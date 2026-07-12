import jwt from "jsonwebtoken"

export function requireAuth(req, res, next) {
    const header = req.headers.authorization

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: { message: "authentication required" } })
    }

    const token = header.slice("Bearer ".length)

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = { id: payload.sub, role: payload.role }
        next()
    } catch (err) {
        res.status(401).json({ error: { message: "authentication required" } })
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: { message: "forbidden" } })
        }

        next()
    }
}
