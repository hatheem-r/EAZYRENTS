import { Router } from "express"
import { z } from "zod"
import { validate } from "../middleware/validate.js"
import * as chatController from "../controllers/chat.controller.js"

// The client sends the whole conversation each time (the server is stateless),
// so cap both the number of turns and each message's length — this route is
// public and every token forwarded to OpenAI costs money.
const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 1000

const chatSchema = z.object({
    messages: z
        .array(
            z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
            })
        )
        .min(1)
        .max(MAX_MESSAGES)
        .refine((messages) => messages[messages.length - 1].role === "user", {
            message: "last message must be from the user",
        }),
})

const router = Router()

router.post("/", validate(chatSchema), chatController.sendMessage)

export default router