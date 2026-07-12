import "dotenv/config"
import express from "express"
import { query } from "./db/index.js"

const app = express()

app.use(express.json())

app.get("/healthz", async (req, res) => {
    try {
        await query("SELECT 1")
        res.json({ status: "ok", db: "up" })
    } catch (err) {
        res.status(503).json({ status: "degraded", db: "down" })
    }
})

app.listen(process.env.PORT, () => {
    console.log(`🚀 listening on ${process.env.PORT}`)
})
