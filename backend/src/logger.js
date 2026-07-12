import pino from "pino"

const logger = pino({
    transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
    redact: ["req.headers.authorization", "req.body.password"],
})

export default logger
