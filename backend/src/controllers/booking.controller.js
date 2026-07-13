import * as bookingService from "../services/booking.service.js"
import * as extensionService from "../services/extension.service.js"

export async function create(req, res, next) {
    try {
        const idempotencyKey = req.get("Idempotency-Key") || undefined

        const booking = await bookingService.createBooking(req.user.id, {
            ...req.body,
            idempotencyKey,
        })

        res.status(booking.reused ? 200 : 201).json(booking)
    } catch (err) {
        next(err)
    }
}

export async function cancel(req, res, next) {
    try {
        const booking = await bookingService.cancelBooking(req.user.id, req.params.id)
        res.status(200).json(booking)
    } catch (err) {
        next(err)
    }
}

export async function requestExtension(req, res, next) {
    try {
        const request = await extensionService.requestExtension(req.user.id, req.params.id, req.body.requestedEnd)
        res.status(201).json(request)
    } catch (err) {
        next(err)
    }
}

export async function listMine(req, res, next) {
    try {
        const bookings = await bookingService.listMyBookings(req.user.id)
        res.status(200).json({ bookings })
    } catch (err) {
        next(err)
    }
}

export async function listForHost(req, res, next) {
    try {
        const bookings = await bookingService.listHostBookings(req.user.id, { status: req.query.status })
        res.status(200).json({ bookings })
    } catch (err) {
        next(err)
    }
}
