export function errorHandler(err, req, res, next) {
    if (err.statusCode) {
        return res.status(err.statusCode).json({ error: { message: err.message } })
    }

    console.error(err)
    res.status(500).json({ error: { message: "internal server error" } })
}
