import * as extensionService from "../services/extension.service.js"

export async function approve(req, res, next) {
    try {
        const result = await extensionService.decideExtension(req.user.id, req.params.id, "approved")
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}

export async function reject(req, res, next) {
    try {
        const result = await extensionService.decideExtension(req.user.id, req.params.id, "rejected")
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}

export async function listForHost(req, res, next) {
    try {
        const extensions = await extensionService.listHostExtensionRequests(req.user.id)
        res.status(200).json({ extensions })
    } catch (err) {
        next(err)
    }
}
