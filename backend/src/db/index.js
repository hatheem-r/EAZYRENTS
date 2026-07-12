import { Pool } from "pg"
import logger from "../logger.js"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

pool.on("error", (err) => {
    logger.error(err)
})

export function query(text, params) {
    return pool.query(text, params)
}

export { pool }
