import { query, pool } from "../db/index.js"
import { HttpError } from "../utils/httpError.js"

const MIN_DAYS = 1
const MAX_DAYS = 90
const MS_PER_DAY = 24 * 60 * 60 * 1000

export async function createBooking(renterId, { vehicleId, startDate, endDate, idempotencyKey }) {
    if (idempotencyKey) {
        const existing = await query(
            `SELECT * FROM bookings WHERE idempotency_key = $1 AND renter_id = $2`,
            [idempotencyKey, renterId]
        )

        if (existing.rows[0]) {
            return { ...existing.rows[0], reused: true }
        }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const vehicleResult = await client.query(
            `SELECT id, price_per_day FROM vehicles WHERE id = $1 AND status = 'active' FOR UPDATE`,
            [vehicleId]
        )

        const vehicle = vehicleResult.rows[0]

        if (!vehicle) {
            throw new HttpError(404, "vehicle not found")
        }

        const blockResult = await client.query(
            `SELECT 1 FROM availability_blocks WHERE vehicle_id = $1 AND period && tstzrange($2, $3) LIMIT 1`,
            [vehicleId, start.toISOString(), end.toISOString()]
        )

        if (blockResult.rows[0]) {
            throw new HttpError(409, "vehicle unavailable for those dates")
        }

        const days = Math.ceil((end - start) / MS_PER_DAY)

        if (days < MIN_DAYS || days > MAX_DAYS) {
            throw new HttpError(400, "booking duration must be between 1 and 90 days")
        }

        const total = days * Number(vehicle.price_per_day)

        const bookingResult = await client.query(
            `INSERT INTO bookings (vehicle_id, renter_id, period, total_amount, idempotency_key)
             VALUES ($1, $2, tstzrange($3, $4), $5, $6)
             RETURNING *`,
            [vehicleId, renterId, start.toISOString(), end.toISOString(), total, idempotencyKey ?? null]
        )

        const booking = bookingResult.rows[0]

        await client.query(
            `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                renterId,
                "booking.created",
                "booking",
                booking.id,
                JSON.stringify({
                    vehicleId,
                    period: { startDate: start.toISOString(), endDate: end.toISOString() },
                }),
            ]
        )

        await client.query("COMMIT")

        return booking
    } catch (err) {
        await client.query("ROLLBACK")

        if (err.code === "23P01") {
            throw new HttpError(409, "vehicle already booked for those dates")
        }

        if (err.code === "23505") {
            const existing = await query(`SELECT * FROM bookings WHERE idempotency_key = $1`, [idempotencyKey])

            if (existing.rows[0]) {
                return { ...existing.rows[0], reused: true }
            }
        }

        throw err
    } finally {
        client.release()
    }
}

export async function cancelBooking(renterId, bookingId) {
    const result = await query(
        `UPDATE bookings
         SET status = 'cancelled'
         WHERE id = $1 AND renter_id = $2 AND status IN ('pending', 'confirmed')
         RETURNING id`,
        [bookingId, renterId]
    )

    if (result.rowCount === 0) {
        throw new HttpError(404, "booking not found or cannot be cancelled")
    }

    await query(
        `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [renterId, "booking.cancelled", "booking", bookingId, JSON.stringify({ bookingId })]
    )

    return result.rows[0]
}

export async function listMyBookings(renterId) {
    const result = await query(
        `SELECT
            b.id,
            b.status,
            b.total_amount,
            lower(b.period) AS start_date,
            upper(b.period) AS end_date,
            GREATEST(0, CEIL(EXTRACT(EPOCH FROM (upper(b.period) - now())) / 86400))::int AS days_remaining,
            jsonb_build_object('id', v.id, 'make', v.make, 'model', v.model, 'type', v.type, 'city', v.city) AS vehicle
         FROM bookings b
         JOIN vehicles v ON v.id = b.vehicle_id
         WHERE b.renter_id = $1
         ORDER BY start_date DESC`,
        [renterId]
    )

    return result.rows
}

export async function listHostBookings(hostId, { status } = {}) {
    const conditions = ["v.host_id = $1"]
    const params = [hostId]

    if (status !== undefined) {
        params.push(status)
        conditions.push(`b.status = $${params.length}`)
    }

    const result = await query(
        `SELECT
            b.id,
            b.status,
            b.total_amount,
            lower(b.period) AS start_date,
            upper(b.period) AS end_date,
            jsonb_build_object('id', v.id, 'make', v.make, 'model', v.model) AS vehicle,
            jsonb_build_object('id', u.id, 'name', u.name, 'email', u.email) AS renter
         FROM bookings b
         JOIN vehicles v ON v.id = b.vehicle_id
         JOIN users u ON u.id = b.renter_id
         WHERE ${conditions.join(" AND ")}
         ORDER BY start_date DESC`,
        params
    )

    return result.rows
}
