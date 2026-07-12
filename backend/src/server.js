import "dotenv/config"
import express from "express"
import helmet from "helmet"
import cors from "cors"
import rateLimit from "express-rate-limit"
import { query } from "./db/index.js"
import authRoutes from "./routes/auth.routes.js"
import vehicleRoutes from "./routes/vehicle.routes.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { requireAuth, requireRole } from "./middleware/auth.js"

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }))
app.use(express.json())

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

// TODO: remove these test routes once requireAuth/requireRole are exercised elsewhere
app.get("/me", requireAuth, (req, res) => {
    res.json(req.user)
})

app.get("/host-only", requireAuth, requireRole("host"), (req, res) => {
    res.json({ ok: true })
})
//---------------test ends-------------------

app.use(errorHandler)

app.listen(process.env.PORT, () => {
    console.log(`🚀 listening on ${process.env.PORT}`)
})
