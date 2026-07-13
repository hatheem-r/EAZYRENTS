import { Router } from "express"
import { z } from "zod"
import { validate, validateQuery, validateParams } from "../middleware/validate.js"
import { requireAuth, requireRole } from "../middleware/auth.js"
import * as vehicleController from "../controllers/vehicle.controller.js"

const VEHICLE_TYPES = ["car", "van", "suv", "bike", "scooter"]

const listQuerySchema = z
    .object({
        type: z.enum(VEHICLE_TYPES).optional(),
        city: z.string().min(1).optional(),
        minPrice: z.coerce.number().min(0).optional(),
        maxPrice: z.coerce.number().min(0).optional(),
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
    })
    .refine(
        (data) => data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice,
        { message: "minPrice must not be greater than maxPrice", path: ["minPrice"] }
    )

const idParamSchema = z.object({
    id: z.string().uuid(),
})

const blockParamsSchema = z.object({
    id: z.string().uuid(),
    blockId: z.string().uuid(),
})

const createBlockSchema = z
    .object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        reason: z.string().optional(),
    })
    .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
        message: "endDate must be after startDate",
        path: ["endDate"],
    })

const createVehicleSchema = z.object({
    type: z.enum(VEHICLE_TYPES),
    make: z.string().min(1),
    model: z.string().min(1),
    price_per_day: z.number().positive(),
    city: z.string().min(1),
    description: z.string().optional(),
    photos: z.array(z.string()).optional(),
})

const updateVehicleSchema = z
    .object({
        type: z.enum(VEHICLE_TYPES).optional(),
        make: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
        price_per_day: z.number().positive().optional(),
        city: z.string().min(1).optional(),
        description: z.string().optional(),
        photos: z.array(z.string()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "request body must include at least one field",
    })

const router = Router()

router.get("/facets", vehicleController.facets)
router.get("/", validateQuery(listQuerySchema), vehicleController.list)

router.get(
    "/:id/blocks",
    requireAuth,
    requireRole("host"),
    validateParams(idParamSchema),
    vehicleController.listBlocks
)
router.post(
    "/:id/blocks",
    requireAuth,
    requireRole("host"),
    validateParams(idParamSchema),
    validate(createBlockSchema),
    vehicleController.createBlock
)
router.delete(
    "/:id/blocks/:blockId",
    requireAuth,
    requireRole("host"),
    validateParams(blockParamsSchema),
    vehicleController.deleteBlock
)

router.get("/:id", validateParams(idParamSchema), vehicleController.getById)

router.post(
    "/",
    requireAuth,
    requireRole("host"),
    validate(createVehicleSchema),
    vehicleController.create
)
router.patch(
    "/:id",
    requireAuth,
    requireRole("host"),
    validateParams(idParamSchema),
    validate(updateVehicleSchema),
    vehicleController.update
)
router.delete(
    "/:id",
    requireAuth,
    requireRole("host"),
    validateParams(idParamSchema),
    vehicleController.remove
)

export default router
