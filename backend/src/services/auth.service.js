import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { query } from "../db/index.js"
import { HttpError } from "../utils/httpError.js"

const BCRYPT_COST = 12

// Valid bcrypt hash of an arbitrary password, used only to equalize compare
// timing when no user is found for the given email.
const DUMMY_PASSWORD_HASH = "$2b$12$GRsbph7rTP.DG//fQU.7Xe4Cqo27IaBQNcTYn/5ZansuzFXbV4irK"

export async function register({ email, password, name, role }) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST)

    try {
        const result = await query(
            `INSERT INTO users (email, password_hash, name, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, name, role, created_at`,
            [email, passwordHash, name, role]
        )

        return result.rows[0]
    } catch (err) {
        if (err.code === "23505") {
            throw new HttpError(409, "email already registered")
        }

        throw err
    }
}

export async function login({ email, password }) {
    const result = await query(
        `SELECT id, email, name, role, password_hash FROM users WHERE email = $1`,
        [email]
    )

    const user = result.rows[0]

    const passwordMatches = await bcrypt.compare(
        password,
        user ? user.password_hash : DUMMY_PASSWORD_HASH
    )

    if (!user || !passwordMatches) {
        throw new HttpError(401, "invalid credentials")
    }

    const token = jwt.sign(
        { sub: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    }
}
