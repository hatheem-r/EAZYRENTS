import { Router } from "express"
import { z } from "zod"
import { validateQuery } from "../middleware/validate.js"
import { requireAuth, requireRole } from "../middleware/auth.js"
import * as bookingController from "../controllers/booking.controller.js"
import * as vehicleController from "../controllers/vehicle.controller.js"
import * as extensionController from "../controllers/extension.controller.js"

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

router.get("/vehicles", requireAuth, requireRole("host"), vehicleController.listMine)

router.get("/extensions", requireAuth, requireRole("host"), extensionController.listForHost)

export default router
