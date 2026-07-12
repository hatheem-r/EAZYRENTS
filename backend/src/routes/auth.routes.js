import { Router } from "express"
import { z } from "zod"
import { validate } from "../middleware/validate.js"
import * as authController from "../controllers/auth.controller.js"

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    role: z.enum(["host", "renter"]),
})

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

const router = Router()

router.post("/register", validate(registerSchema), authController.register)
router.post("/login", validate(loginSchema), authController.login)

export default router
