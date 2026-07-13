import { query } from "../db/index.js"
import { HttpError } from "../utils/httpError.js"

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 50
const DEFAULT_PAGE = 1
const UPDATABLE_FIELDS = ["type", "make", "model", "price_per_day", "city", "description", "photos"]

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
    const result = await query(
        `UPDATE vehicles
         SET status = 'removed'
         WHERE id = $1 AND host_id = $2 AND status = 'active'`,
        [vehicleId, hostId]
    )

    if (result.rowCount === 0) {
        throw new HttpError(404, "vehicle not found")
    }
}
