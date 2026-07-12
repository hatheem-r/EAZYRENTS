import { Router } from "express"
import { z } from "zod"
import { validateQuery } from "../middleware/validate.js"
import { requireAuth, requireRole } from "../middleware/auth.js"
import * as bookingController from "../controllers/booking.controller.js"

const hostBookingsQuerySchema = z.object({
    status: z.enum(["pending", "confirmed", "active", "completed", "cancelled"]).optional(),
})

const router = Router()

router.get(
    "/bookings",
    requireAuth,
    requireRole("host"),
    validateQuery(hostBookingsQuerySchema),
    bookingController.listForHost
)

export default router
