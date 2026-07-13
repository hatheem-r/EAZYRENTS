import multer from "multer"
import { fileTypeFromBuffer } from "file-type"
import { HttpError } from "../utils/httpError.js"

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
    },
    fileFilter(req, file, cb) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(new HttpError(400, "only jpeg, png, webp images are allowed"))
            return
        }

        cb(null, true)
    },
})

export const uploadPhotos = upload.array("photos", 5)

// Content-Type header and extension are client-controlled; magic bytes are not.
export async function verifyImageContent(req, res, next) {
    try {
        for (const file of req.files ?? []) {
            const detected = await fileTypeFromBuffer(file.buffer)

            if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
                throw new HttpError(400, "only jpeg, png, webp images are allowed")
            }

            file.detectedMimeType = detected.mime
        }

        next()
    } catch (err) {
        next(err)
    }
}
