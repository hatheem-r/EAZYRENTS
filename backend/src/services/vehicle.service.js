import { query, pool } from "../db/index.js"
import { HttpError } from "../utils/httpError.js"
import * as storage from "../storage/localStorage.js"
import logger from "../logger.js"

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 50
const DEFAULT_PAGE = 1
const MAX_PHOTOS_PER_VEHICLE = 10
// "photos" is deliberately excluded — the photo array is only ever changed via
// addVehiclePhotos/removeVehiclePhoto, never through the general update endpoint.
const UPDATABLE_FIELDS = ["type", "make", "model", "price_per_day", "city", "description"]

export async function listVehicles({ type, city, minPrice, maxPrice, page, limit } = {}) {
    const conditions = ["status = 'active'"]
    const params = []

    if (type !== undefined) {
        params.push(type)
        conditions.push(`type = $${params.length}`)
    }

    if (city !== undefined) {
        params.push(city)
        conditions.push(`city ILIKE $${params.length}`)
    }

    if (minPrice !== undefined) {
        params.push(minPrice)
        conditions.push(`price_per_day >= $${params.length}`)
    }

    if (maxPrice !== undefined) {
        params.push(maxPrice)
        conditions.push(`price_per_day <= $${params.length}`)
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`

    const safeLimit = Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const safePage = page ?? DEFAULT_PAGE
    const offset = (safePage - 1) * safeLimit

    const rowsResult = await query(
        `SELECT * FROM vehicles
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, safeLimit, offset]
    )

    const countResult = await query(`SELECT COUNT(*) FROM vehicles ${whereClause}`, params)

    return {
        vehicles: rowsResult.rows,
        page: safePage,
        limit: safeLimit,
        total: Number(countResult.rows[0].count),
    }
}

export async function getVehicleFacets() {
    // TODO: candidate for Redis caching — facets change far less often than they're read
    const typesResult = await query(
        `SELECT type, count(*)::int AS count
         FROM vehicles
         WHERE status = 'active'
         GROUP BY type
         ORDER BY count DESC`
    )

    const citiesResult = await query(
        `SELECT min(city) AS city, count(*)::int AS count
         FROM vehicles
         WHERE status = 'active'
         GROUP BY lower(city)
         ORDER BY city ASC`
    )

    return {
        types: typesResult.rows,
        cities: citiesResult.rows,
    }
}

export async function listHostVehicles(hostId) {
    const result = await query(
        `SELECT * FROM vehicles WHERE host_id = $1 AND status = 'active' ORDER BY created_at DESC`,
        [hostId]
    )

    return result.rows
}

export async function listVehicleBlocks(hostId, vehicleId) {
    const ownership = await query(`SELECT 1 FROM vehicles WHERE id = $1 AND host_id = $2`, [vehicleId, hostId])

    if (ownership.rowCount === 0) {
        throw new HttpError(404, "vehicle not found")
    }

    const result = await query(
        `SELECT b.id, lower(b.period) AS start_date, upper(b.period) AS end_date, b.reason
         FROM availability_blocks b
         JOIN vehicles v ON v.id = b.vehicle_id
         WHERE b.vehicle_id = $1 AND v.host_id = $2
         ORDER BY start_date`,
        [vehicleId, hostId]
    )

    return result.rows
}

export async function createBlock(hostId, vehicleId, { startDate, endDate, reason }) {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const vehicleResult = await client.query(
            `SELECT id FROM vehicles WHERE id = $1 AND host_id = $2 AND status = 'active' FOR UPDATE`,
            [vehicleId, hostId]
        )

        if (vehicleResult.rowCount === 0) {
            throw new HttpError(404, "vehicle not found")
        }

        const bookingConflict = await client.query(
            `SELECT 1 FROM bookings
             WHERE vehicle_id = $1 AND status IN ('confirmed', 'active') AND period && tstzrange($2, $3)
             LIMIT 1`,
            [vehicleId, startDate, endDate]
        )

        if (bookingConflict.rows[0]) {
            throw new HttpError(409, "dates conflict with an existing booking")
        }

        const blockResult = await client.query(
            `INSERT INTO availability_blocks (vehicle_id, period, reason)
             VALUES ($1, tstzrange($2, $3), $4)
             RETURNING id, lower(period) AS start_date, upper(period) AS end_date, reason`,
            [vehicleId, startDate, endDate, reason ?? null]
        )

        const block = blockResult.rows[0]

        await client.query(
            `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [hostId, "block.created", "block", block.id, JSON.stringify({ vehicleId, period: { startDate, endDate } })]
        )

        await client.query("COMMIT")

        return block
    } catch (err) {
        await client.query("ROLLBACK")

        if (err.code === "23P01") {
            throw new HttpError(409, "dates overlap an existing block")
        }

        throw err
    } finally {
        client.release()
    }
}

export async function deleteBlock(hostId, blockId) {
    const result = await query(
        `DELETE FROM availability_blocks ab
         USING vehicles v
         WHERE ab.id = $1 AND v.id = ab.vehicle_id AND v.host_id = $2
         RETURNING ab.id`,
        [blockId, hostId]
    )

    if (result.rowCount === 0) {
        throw new HttpError(404, "block not found")
    }

    await query(
        `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [hostId, "block.deleted", "block", blockId, JSON.stringify({ blockId })]
    )

    return result.rows[0]
}

export async function addVehiclePhotos(hostId, vehicleId, files) {
    if (!files || files.length === 0) {
        throw new HttpError(400, "no files uploaded")
    }

    const countResult = await query(`SELECT array_length(photos, 1) AS count FROM vehicles WHERE id = $1`, [
        vehicleId,
    ])

    const currentCount = countResult.rows[0]?.count ?? 0

    // small check-then-act race here is acceptable for a cap
    if (currentCount + files.length > MAX_PHOTOS_PER_VEHICLE) {
        throw new HttpError(400, `maximum ${MAX_PHOTOS_PER_VEHICLE} photos per vehicle`)
    }

    const urls = []

    for (const file of files) {
        const saved = await storage.saveImage(file.buffer, file.detectedMimeType)
        urls.push(saved.url)
    }

    const result = await query(
        `UPDATE vehicles
         SET photos = photos || $1::text[]
         WHERE id = $2 AND host_id = $3 AND status = 'active'
         RETURNING photos`,
        [urls, vehicleId, hostId]
    )

    if (result.rowCount === 0) {
        for (const url of urls) {
            try {
                await storage.deleteImage(url)
            } catch (err) {
                logger.error(err, "failed to clean up uploaded file after vehicle not found")
            }
        }

        throw new HttpError(404, "vehicle not found")
    }

    await query(
        `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [hostId, "vehicle.photos_added", "vehicle", vehicleId, JSON.stringify({ urls })]
    )

    return result.rows[0].photos
}

export async function removeVehiclePhoto(hostId, vehicleId, url) {
    const result = await query(
        `UPDATE vehicles
         SET photos = array_remove(photos, $1)
         WHERE id = $2 AND host_id = $3 AND status = 'active'
         RETURNING photos`,
        [url, vehicleId, hostId]
    )

    if (result.rowCount === 0) {
        throw new HttpError(404, "vehicle not found")
    }

    try {
        await storage.deleteImage(url)
    } catch (err) {
        // DB is the source of truth; an orphaned file is a cleanup problem, a
        // broken URL in the DB is a user-facing bug.
        logger.error(err, "failed to delete vehicle photo file from storage")
    }

    await query(
        `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [hostId, "vehicle.photo_removed", "vehicle", vehicleId, JSON.stringify({ url })]
    )

    return result.rows[0].photos
}

export async function getVehicleById(id) {
    const vehicleResult = await query(
        `SELECT * FROM vehicles WHERE id = $1 AND status = 'active'`,
        [id]
    )

    const vehicle = vehicleResult.rows[0]

    if (!vehicle) {
        throw new HttpError(404, "vehicle not found")
    }

    const unavailableResult = await query(
        `SELECT lower(period) AS start_date, upper(period) AS end_date
         FROM bookings
         WHERE vehicle_id = $1 AND status IN ('confirmed', 'active')
         UNION
         SELECT lower(period) AS start_date, upper(period) AS end_date
         FROM availability_blocks
         WHERE vehicle_id = $1`,
        [id]
    )

    return {
        ...vehicle,
        unavailable_dates: unavailableResult.rows,
    }
}

export async function createVehicle(hostId, data) {
    const { type, make, model, price_per_day, city, description, photos } = data

    const result = await query(
        `INSERT INTO vehicles (host_id, type, make, model, price_per_day, city, description, photos)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [hostId, type, make, model, price_per_day, city, description ?? null, photos ?? []]
    )

    return result.rows[0]
}

export async function updateVehicle(hostId, vehicleId, data) {
    const setClauses = []
    const params = []

    for (const field of UPDATABLE_FIELDS) {
        if (data[field] !== undefined) {
            params.push(data[field])
            setClauses.push(`${field} = $${params.length}`)
        }
    }

    params.push(vehicleId, hostId)

    const result = await query(
        `UPDATE vehicles
         SET ${setClauses.join(", ")}
         WHERE id = $${params.length - 1} AND host_id = $${params.length} AND status = 'active'
         RETURNING *`,
        params
    )

    if (result.rowCount === 0) {
        throw new HttpError(404, "vehicle not found")
    }

    return result.rows[0]
}

export async function removeVehicle(hostId, vehicleId) {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const vehicleResult = await client.query(
            `UPDATE vehicles
             SET status = 'removed'
             WHERE id = $1 AND host_id = $2 AND status = 'active'
             RETURNING id`,
            [vehicleId, hostId]
        )

        if (vehicleResult.rowCount === 0) {
            throw new HttpError(404, "vehicle not found")
        }

        // Policy: removing a vehicle only cancels bookings that haven't started yet.
        // Bookings already underway (status 'active', or 'confirmed' with a period
        // that has already begun) are left alone — the renter already has the
        // vehicle, so the rental runs to its natural end and the lifecycle job
        // completes it normally.
        const cancelledResult = await client.query(
            `UPDATE bookings
             SET status = 'cancelled'
             WHERE vehicle_id = $1 AND status IN ('pending', 'confirmed') AND lower(period) > now()
             RETURNING id, renter_id`,
            [vehicleId]
        )

        const cancelledBookings = cancelledResult.rows

        const rejectedResult = await client.query(
            `UPDATE extension_requests er
             SET status = 'rejected', decided_at = now()
             FROM bookings b
             WHERE er.booking_id = b.id AND b.vehicle_id = $1 AND er.status = 'pending'
             RETURNING er.id`,
            [vehicleId]
        )

        const rejectedExtensions = rejectedResult.rows

        await client.query(
            `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                hostId,
                "vehicle.removed",
                "vehicle",
                vehicleId,
                JSON.stringify({
                    cancelledBookings: cancelledBookings.map((b) => b.id),
                    rejectedExtensions: rejectedExtensions.map((r) => r.id),
                }),
            ]
        )

        await client.query(
            `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
             SELECT $1, 'booking.cancelled_by_removal', 'booking', id, $2::jsonb
             FROM unnest($3::uuid[]) AS id`,
            [hostId, JSON.stringify({ reason: "vehicle removed" }), cancelledBookings.map((b) => b.id)]
        )

        await client.query("COMMIT")

        return { cancelledBookings: cancelledBookings.length }
    } catch (err) {
        await client.query("ROLLBACK")
        throw err
    } finally {
        client.release()
    }
}
