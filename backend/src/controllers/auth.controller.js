import * as authService from "../services/auth.service.js"

export async function register(req, res, next) {
    try {
        const user = await authService.register(req.body)
        res.status(201).json(user)
    } catch (err) {
        next(err)
    }
}

export async function login(req, res, next) {
    try {
        const result = await authService.login(req.body)
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}
