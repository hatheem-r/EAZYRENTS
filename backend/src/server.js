import "dotenv/config"
import express from "express"
import helmet from "helmet"
import cors from "cors"
import pinoHttp from "pino-http"
import rateLimit from "express-rate-limit"
import { query, pool } from "./db/index.js"
import authRoutes from "./routes/auth.routes.js"
import vehicleRoutes from "./routes/vehicle.routes.js"
import bookingRoutes from "./routes/booking.routes.js"
import hostRoutes from "./routes/host.routes.js"
import extensionRoutes from "./routes/extension.routes.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { requireAuth, requireRole } from "./middleware/auth.js"
import { startJobs } from "./jobs/bookingLifecycle.js"
import logger from "./logger.js"

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }))
app.use(express.json())
app.use(pinoHttp({ logger }))

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: { message: "too many requests" } })
    },
})

app.get("/healthz", async (req, res) => {
    try {
        await query("SELECT 1")
        res.json({ status: "ok", db: "up" })
    } catch (err) {
        res.status(503).json({ status: "degraded", db: "down" })
    }
})

app.use("/auth", authRateLimiter, authRoutes)
app.use("/vehicles", vehicleRoutes)
app.use("/bookings", bookingRoutes)
app.use("/host", hostRoutes)
app.use("/extensions", extensionRoutes)

// TODO: remove these test routes once requireAuth/requireRole are exercised elsewhere
app.get("/me", requireAuth, (req, res) => {
    res.json(req.user)
})

app.get("/host-only", requireAuth, requireRole("host"), (req, res) => {
    res.json({ ok: true })
})
//---------------test ends-------------------

app.use(errorHandler)

let jobs = []

const server = app.listen(process.env.PORT, () => {
    logger.info(`🚀 listening on ${process.env.PORT}`)
    jobs = startJobs()
})

let shuttingDown = false

function shutdown(reason) {
    if (shuttingDown) return
    shuttingDown = true

    logger.info({ reason }, "shutting down")

    const forceExitTimer = setTimeout(() => {
        logger.error("graceful shutdown timed out, forcing exit")
        process.exit(1)
    }, 10_000)

    server.close(async (err) => {
        if (err) {
            logger.error(err)
        }

        jobs.forEach((job) => job.stop())

        try {
            await pool.end()
        } catch (err) {
            logger.error(err)
        }

        clearTimeout(forceExitTimer)
        process.exit(0)
    })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))

process.on("unhandledRejection", (reason) => {
    logger.error(reason, "unhandled rejection")
    shutdown("unhandledRejection")
})

process.on("uncaughtException", (err) => {
    logger.error(err, "uncaught exception")
    shutdown("uncaughtException")
})
