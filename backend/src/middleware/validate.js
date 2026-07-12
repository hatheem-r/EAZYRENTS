export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    details: result.error.flatten(),
                },
            })
        }

        req.body = result.data
        next()
    }
}

export function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query)

        if (!result.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    details: result.error.flatten(),
                },
            })
        }

        // req.query is a getter-only accessor in Express 5; reassigning it
        // directly throws under ES module strict mode.
        Object.defineProperty(req, "query", {
            value: result.data,
            writable: true,
            configurable: true,
            enumerable: true,
        })
        next()
    }
}

export function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params)

        if (!result.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    details: result.error.flatten(),
                },
            })
        }

        req.params = result.data
        next()
    }
}
