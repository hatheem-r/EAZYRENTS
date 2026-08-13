import * as chatService from "../services/chat.service.js"

export async function sendMessage(req, res, next) {
    try {
        const result = await chatService.getChatReply(req.body.messages)
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}