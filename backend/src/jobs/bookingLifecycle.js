import cron from "node-cron"
import { query } from "../db/index.js"

async function activateStartedBookings() {
    try {
        const result = await query(
            `WITH activated AS (
                UPDATE bookings
                SET status = 'active'
                WHERE status = 'confirmed' AND lower(period) <= now()
                RETURNING id
            )
            INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
            SELECT NULL, 'booking.activated', 'booking', id, jsonb_build_object('by', 'system')
            FROM activated
            RETURNING entity_id`
        )

        if (result.rowCount > 0) {
            console.log(`[bookingLifecycle] activated ${result.rowCount} booking(s)`)
        }
    } catch (err) {
        console.error("[bookingLifecycle] activateStartedBookings failed", err)
    }
}

async function completeEndedBookings() {
    try {
        const result = await query(
            `WITH completed AS (
                UPDATE bookings
                SET status = 'completed'
                WHERE status = 'active' AND upper(period) <= now()
                RETURNING id
            )
            INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
            SELECT NULL, 'booking.completed', 'booking', id, jsonb_build_object('by', 'system')
            FROM completed
            RETURNING entity_id`
        )

        if (result.rowCount > 0) {
            console.log(`[bookingLifecycle] completed ${result.rowCount} booking(s)`)
        }
    } catch (err) {
        console.error("[bookingLifecycle] completeEndedBookings failed", err)
    }
}

async function flagEndingSoonBookings() {
    try {
        const result = await query(
            `WITH candidates AS (
                SELECT b.id, upper(b.period) AS end_date
                FROM bookings b
                WHERE b.status = 'active'
                  AND upper(b.period) <= now() + interval '24 hours'
                  AND NOT EXISTS (
                      SELECT 1 FROM audit_log a
                      WHERE a.action = 'booking.ending_soon' AND a.entity_id = b.id
                  )
            )
            INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
            SELECT NULL, 'booking.ending_soon', 'booking', id, jsonb_build_object('by', 'system', 'end_date', end_date)
            FROM candidates
            RETURNING entity_id, details`
        )

        for (const row of result.rows) {
            console.log(`[bookingLifecycle] booking ${row.entity_id} ending soon`, row.details)
        }
    } catch (err) {
        console.error("[bookingLifecycle] flagEndingSoonBookings failed", err)
    }
}

export function startJobs() {
    return [
        cron.schedule("*/15 * * * *", activateStartedBookings),
        cron.schedule("*/15 * * * *", completeEndedBookings),
        cron.schedule("0 * * * *", flagEndingSoonBookings),
    ]
}
