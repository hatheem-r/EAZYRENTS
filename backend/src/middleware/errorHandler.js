import multer from "multer"
import logger from "../logger.js"

export function errorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: { message: err.message } })
    }

    if (err.statusCode) {
        return res.status(err.statusCode).json({ error: { message: err.message } })
    }

    logger.error(err)
    res.status(500).json({ error: { message: "internal server error" } })
}
