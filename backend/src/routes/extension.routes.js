import { Router } from "express"
import { z } from "zod"
import { validateParams } from "../middleware/validate.js"
import { requireAuth, requireRole } from "../middleware/auth.js"
import * as extensionController from "../controllers/extension.controller.js"

const idParamSchema = z.object({
    id: z.string().uuid(),
})

const router = Router()

router.post(
    "/:id/approve",
    requireAuth,
    requireRole("host"),
    validateParams(idParamSchema),
    extensionController.approve
)
router.post(
    "/:id/reject",
    requireAuth,
    requireRole("host"),
    validateParams(idParamSchema),
    extensionController.reject
)

export default router
