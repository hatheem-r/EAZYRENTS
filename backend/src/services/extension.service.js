import { query, pool } from "../db/index.js"
import { HttpError } from "../utils/httpError.js"

const MS_PER_DAY = 24 * 60 * 60 * 1000

export async function requestExtension(renterId, bookingId, requestedEnd) {
    const bookingResult = await query(
        `SELECT id, renter_id, status, upper(period) AS current_end FROM bookings WHERE id = $1`,
        [bookingId]
    )

    const booking = bookingResult.rows[0]

    if (!booking || booking.renter_id !== renterId || !["confirmed", "active"].includes(booking.status)) {
        throw new HttpError(404, "booking not found")
    }

    if (new Date(requestedEnd) <= new Date(booking.current_end)) {
        throw new HttpError(400, "requested end must be after the current end date")
    }

    // Plain sequential queries are acceptable here — a duplicate-pending race
    // (two concurrent requests both passing this check) is harmless: the host
    // would just see two pending requests for the same booking, and deciding
    // one doesn't corrupt anything about the other.
    const existingPending = await query(
        `SELECT 1 FROM extension_requests WHERE booking_id = $1 AND status = 'pending'`,
        [bookingId]
    )

    if (existingPending.rows[0]) {
        throw new HttpError(409, "an extension request is already pending")
    }

    const insertResult = await query(
        `INSERT INTO extension_requests (booking_id, requested_end)
         VALUES ($1, $2)
         RETURNING *`,
        [bookingId, requestedEnd]
    )

    const request = insertResult.rows[0]

    await query(
        `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [renterId, "extension.requested", "extension", request.id, JSON.stringify({ bookingId, requestedEnd })]
    )

    return request
}

export async function decideExtension(hostId, requestId, decision) {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const result = await client.query(
            `SELECT er.id, er.status, er.requested_end,
                    b.id AS booking_id, b.vehicle_id, b.total_amount,
                    lower(b.period) AS current_start, upper(b.period) AS current_end,
                    v.price_per_day, v.host_id
             FROM extension_requests er
             JOIN bookings b ON b.id = er.booking_id
             JOIN vehicles v ON v.id = b.vehicle_id
             WHERE er.id = $1
             FOR UPDATE OF er, b`,
            [requestId]
        )

        const row = result.rows[0]

        if (!row || row.host_id !== hostId) {
            throw new HttpError(404, "request not found")
        }

        if (row.status !== "pending") {
            throw new HttpError(409, "request already decided")
        }

        if (decision === "rejected") {
            const requestUpdate = await client.query(
                `UPDATE extension_requests SET status = 'rejected', decided_at = now() WHERE id = $1 RETURNING *`,
                [requestId]
            )

            await client.query(
                `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    hostId,
                    "extension.rejected",
                    "extension_request",
                    requestId,
                    JSON.stringify({ bookingId: row.booking_id }),
                ]
            )

            await client.query("COMMIT")

            return { request: requestUpdate.rows[0] }
        }

        const requestedEnd = new Date(row.requested_end)
        const currentEnd = new Date(row.current_end)
        const currentStart = new Date(row.current_start)

        if (!(requestedEnd > currentEnd)) {
            throw new HttpError(400, "requested end no longer extends the booking")
        }

        const blockConflict = await client.query(
            `SELECT 1 FROM availability_blocks WHERE vehicle_id = $1 AND period && tstzrange($2, $3) LIMIT 1`,
            [row.vehicle_id, currentEnd.toISOString(), requestedEnd.toISOString()]
        )

        if (blockConflict.rows[0]) {
            throw new HttpError(409, "extension conflicts with a blocked period")
        }

        const addedDays = Math.ceil((requestedEnd - currentEnd) / MS_PER_DAY)
        const addedAmount = addedDays * Number(row.price_per_day)

        const bookingUpdate = await client.query(
            `UPDATE bookings
             SET period = tstzrange($2, $3), total_amount = total_amount + $4
             WHERE id = $1
             RETURNING id, lower(period) AS start_date, upper(period) AS end_date, total_amount, status`,
            [row.booking_id, currentStart.toISOString(), requestedEnd.toISOString(), addedAmount]
        )

        const booking = bookingUpdate.rows[0]

        const requestUpdate = await client.query(
            `UPDATE extension_requests SET status = 'approved', decided_at = now() WHERE id = $1 RETURNING *`,
            [requestId]
        )

        const request = requestUpdate.rows[0]

        await client.query(
            `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                hostId,
                "extension.approved",
                "extension_request",
                requestId,
                JSON.stringify({
                    bookingId: row.booking_id,
                    oldPeriod: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
                    newPeriod: { start: currentStart.toISOString(), end: requestedEnd.toISOString() },
                }),
            ]
        )

        await client.query("COMMIT")

        return { request, booking }
    } catch (err) {
        await client.query("ROLLBACK")

        if (err.code === "23P01") {
            throw new HttpError(409, "extension conflicts with a later booking")
        }

        throw err
    } finally {
        client.release()
    }
}

export async function listHostExtensionRequests(hostId) {
    const result = await query(
        `SELECT er.id, er.requested_end, er.status, er.created_at,
                b.id AS booking_id, lower(b.period) AS start_date, upper(b.period) AS end_date,
                u.name AS renter_name, v.make, v.model
         FROM extension_requests er
         JOIN bookings b ON b.id = er.booking_id
         JOIN vehicles v ON v.id = b.vehicle_id
         JOIN users u ON u.id = b.renter_id
         WHERE v.host_id = $1 AND er.status = 'pending'
         ORDER BY er.created_at ASC`,
        [hostId]
    )

    return result.rows
}
