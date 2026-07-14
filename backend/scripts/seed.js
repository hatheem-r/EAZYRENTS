import "dotenv/config"
import bcrypt from "bcrypt"
import { pool } from "../src/db/index.js"

if (process.env.NODE_ENV === "production") {
    console.error("Refusing to run seed script with NODE_ENV=production")
    process.exit(1)
}

const BCRYPT_COST = 12
const SEED_PASSWORD = "password123"
const MS_PER_DAY = 24 * 60 * 60 * 1000
const DAY = MS_PER_DAY

const now = new Date()
const inDays = (n) => new Date(now.getTime() + n * DAY)
const inHours = (n) => new Date(now.getTime() + n * 60 * 60 * 1000)

function nights(start, end) {
    return Math.ceil((end - start) / MS_PER_DAY)
}

async function main() {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_COST)

    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        // 2. Wipe in FK-safe order
        await client.query("DELETE FROM audit_log")
        await client.query("DELETE FROM extension_requests")
        await client.query("DELETE FROM bookings")
        await client.query("DELETE FROM availability_blocks")
        await client.query("DELETE FROM vehicles")
        await client.query("DELETE FROM users")

        // 3a. Users
        async function insertUser(email, name, role) {
            const result = await client.query(
                `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
                [email, passwordHash, name, role]
            )
            return result.rows[0].id
        }

        const host1Id = await insertUser("host1@seed.test", "Host One", "host")
        const host2Id = await insertUser("host2@seed.test", "Host Two", "host")
        const renter1Id = await insertUser("renter1@seed.test", "Renter One", "renter")
        const renter2Id = await insertUser("renter2@seed.test", "Renter Two", "renter")
        const renter3Id = await insertUser("renter3@seed.test", "Renter Three", "renter")

        // 3b. Vehicles
        async function insertVehicle(hostId, type, make, model, pricePerDay, city, description) {
            const result = await client.query(
                `INSERT INTO vehicles (host_id, type, make, model, price_per_day, city, description, photos)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, '{}')
                 RETURNING id`,
                [hostId, type, make, model, pricePerDay, city, description]
            )
            const vehicleId = result.rows[0].id

            await client.query(
                `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
                 VALUES ($1, 'seed.created', 'vehicle', $2, $3)`,
                [hostId, vehicleId, JSON.stringify({ type, make, model })]
            )

            return vehicleId
        }

        const v1 = await insertVehicle(
            host1Id,
            "car",
            "Toyota",
            "Corolla",
            45,
            "Colombo",
            "A reliable and fuel-efficient sedan, perfect for city driving and weekend getaways."
        )
        const v2 = await insertVehicle(
            host1Id,
            "suv",
            "Toyota",
            "Fortuner",
            80,
            "Kandy",
            "A spacious SUV built for comfort, with plenty of room for luggage on longer trips."
        )
        const v3 = await insertVehicle(
            host1Id,
            "van",
            "Toyota",
            "HiAce",
            70,
            "Colombo",
            "An 8-seater van ideal for group travel, airport transfers, and family trips."
        )
        const v4 = await insertVehicle(
            host1Id,
            "bike",
            "Yamaha",
            "FZ-S",
            20,
            "Galle",
            "A nimble commuter bike with excellent mileage, great for weaving through city traffic."
        )
        const v5 = await insertVehicle(
            host1Id,
            "scooter",
            "Honda",
            "Dio",
            18,
            "Ella",
            "A lightweight scooter that's easy to handle on Ella's winding hill roads."
        )
        const v6 = await insertVehicle(
            host2Id,
            "car",
            "Honda",
            "Civic",
            55,
            "Colombo",
            "A sporty and comfortable sedan with a smooth ride and modern features."
        )
        const v7 = await insertVehicle(
            host2Id,
            "suv",
            "Suzuki",
            "Grand Vitara",
            65,
            "Galle",
            "A rugged SUV that handles both coastal roads and rough terrain with ease."
        )
        const v8 = await insertVehicle(
            host2Id,
            "tuktuk",
            "Bajaj",
            "RE",
            15,
            "Ella",
            "A classic three-wheeler and the most fun, affordable way to explore Ella's back roads."
        )
        const v9 = await insertVehicle(
            host2Id,
            "bike",
            "Honda",
            "CB150R",
            22,
            "Kandy",
            "A peppy bike with responsive handling, well suited to Kandy's hilly streets."
        )
        const v10 = await insertVehicle(
            host2Id,
            "scooter",
            "TVS",
            "Ntorq",
            19,
            "Colombo",
            "A stylish, fuel-efficient scooter perfect for short city hops."
        )

        // 3c. Bookings — one per vehicle where used, so the exclusion constraint
        // (which only guards confirmed/active periods per vehicle) is never at risk.
        async function insertBooking(vehicleId, renterId, start, end, status, pricePerDay) {
            const total = nights(start, end) * pricePerDay

            const result = await client.query(
                `INSERT INTO bookings (vehicle_id, renter_id, period, status, total_amount)
                 VALUES ($1, $2, tstzrange($3, $4), $5, $6)
                 RETURNING id`,
                [vehicleId, renterId, start.toISOString(), end.toISOString(), status, total]
            )
            const bookingId = result.rows[0].id

            await client.query(
                `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
                 VALUES ($1, 'seed.created', 'booking', $2, $3)`,
                [renterId, bookingId, JSON.stringify({ vehicleId, status, total_amount: total })]
            )

            return { id: bookingId, end }
        }

        // ACTIVE now — covers today
        const activeBooking = await insertBooking(v1, renter1Id, inDays(-2), inDays(3), "active", 45)

        // confirmed, starting in ~5 days
        await insertBooking(v2, renter2Id, inDays(5), inDays(8), "confirmed", 80)

        // confirmed, ending within 2 days (ending-soon UI)
        await insertBooking(v3, renter1Id, inHours(-1), inHours(36), "confirmed", 70)

        // completed last month
        await insertBooking(v4, renter3Id, inDays(-35), inDays(-30), "completed", 20)

        // cancelled
        await insertBooking(v6, renter2Id, inDays(10), inDays(13), "cancelled", 55)

        // 3d. One pending extension request on the active booking
        const requestedEnd = inDays(5)

        const extResult = await client.query(
            `INSERT INTO extension_requests (booking_id, requested_end) VALUES ($1, $2) RETURNING id`,
            [activeBooking.id, requestedEnd.toISOString()]
        )
        const extensionId = extResult.rows[0].id

        await client.query(
            `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
             VALUES ($1, 'seed.created', 'extension', $2, $3)`,
            [renter1Id, extensionId, JSON.stringify({ bookingId: activeBooking.id, requestedEnd })]
        )

        // 3e. Availability blocks on vehicles with no bookings, future dates
        async function insertBlock(hostId, vehicleId, start, end, reason) {
            const result = await client.query(
                `INSERT INTO availability_blocks (vehicle_id, period, reason)
                 VALUES ($1, tstzrange($2, $3), $4)
                 RETURNING id`,
                [vehicleId, start.toISOString(), end.toISOString(), reason]
            )
            const blockId = result.rows[0].id

            await client.query(
                `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
                 VALUES ($1, 'seed.created', 'block', $2, $3)`,
                [hostId, blockId, JSON.stringify({ vehicleId, reason })]
            )

            return blockId
        }

        await insertBlock(host1Id, v5, inDays(10), inDays(12), "scheduled maintenance")
        await insertBlock(host2Id, v7, inDays(20), inDays(22), "owner personal use")

        await client.query("COMMIT")

        // 5. Summary
        const counts = await client.query(`
            SELECT
                (SELECT count(*) FROM users) AS users,
                (SELECT count(*) FROM vehicles) AS vehicles,
                (SELECT count(*) FROM bookings) AS bookings,
                (SELECT count(*) FROM availability_blocks) AS blocks,
                (SELECT count(*) FROM extension_requests) AS extensions,
                (SELECT count(*) FROM audit_log) AS audit_log
        `)

        console.log("\nSeed complete.\n")
        console.table([
            { email: "host1@seed.test", role: "host", password: SEED_PASSWORD },
            { email: "host2@seed.test", role: "host", password: SEED_PASSWORD },
            { email: "renter1@seed.test", role: "renter", password: SEED_PASSWORD },
            { email: "renter2@seed.test", role: "renter", password: SEED_PASSWORD },
            { email: "renter3@seed.test", role: "renter", password: SEED_PASSWORD },
        ])
        console.table(counts.rows[0])
    } catch (err) {
        await client.query("ROLLBACK")
        throw err
    } finally {
        client.release()
    }
}

main()
    .then(async () => {
        await pool.end()
        process.exit(0)
    })
    .catch(async (err) => {
        console.error(err)
        await pool.end()
        process.exit(1)
    })
