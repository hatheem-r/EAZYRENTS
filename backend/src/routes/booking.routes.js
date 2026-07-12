import { Router } from "express"
import { z } from "zod"
import { validate, validateParams } from "../middleware/validate.js"
import { requireAuth, requireRole } from "../middleware/auth.js"
import * as bookingController from "../controllers/booking.controller.js"

const createBookingSchema = z
    .object({
        vehicleId: z.string().uuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
    })
    .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
        message: "endDate must be after startDate",
        path: ["endDate"],
    })
    .refine((data) => new Date(data.startDate) >= new Date(), {
        message: "startDate must not be in the past",
        path: ["startDate"],
    })

const idParamSchema = z.object({
    id: z.string().uuid(),
})

const router = Router()

router.post("/", requireAuth, requireRole("renter"), validate(createBookingSchema), bookingController.create)
router.get("/mine", requireAuth, requireRole("renter"), bookingController.listMine)
router.post(
    "/:id/cancel",
    requireAuth,
    requireRole("renter"),
    validateParams(idParamSchema),
    bookingController.cancel
)

export default router
