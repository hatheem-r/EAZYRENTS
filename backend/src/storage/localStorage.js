// swap this module for S3/Cloudinary later; callers only know saveImage/deleteImage.

import { randomUUID } from "crypto"
import { mkdir, writeFile, unlink } from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads")

await mkdir(UPLOADS_DIR, { recursive: true })

const EXTENSION_BY_MIME_TYPE = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

export async function saveImage(buffer, mimetype) {
    // client filenames are untrusted input: path traversal, weird characters,
    // lies about type — the filename we save under is always a fresh UUID plus
    // the extension for the DETECTED mimetype, never anything from the client.
    const extension = EXTENSION_BY_MIME_TYPE[mimetype]
    const filename = `${randomUUID()}.${extension}`

    await writeFile(path.join(UPLOADS_DIR, filename), buffer)

    return { url: `/uploads/${filename}` }
}

export async function deleteImage(url) {
    if (!url.startsWith("/uploads/")) {
        return
    }

    // path.basename strips any directory components (including "../"), so the
    // resolved path can never escape UPLOADS_DIR regardless of what's in url.
    const filename = path.basename(url)

    await unlink(path.join(UPLOADS_DIR, filename))
}
