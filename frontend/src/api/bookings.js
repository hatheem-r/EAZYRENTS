import { get, post } from './client.js'

export function createBooking({ vehicleId, startDate, endDate }, idempotencyKey) {
  return post('/bookings', { vehicleId, startDate, endDate }, { idempotencyKey })
}

export function listMyBookings() {
  return get('/bookings/mine')
}

export function cancelBooking(id) {
  return post(`/bookings/${id}/cancel`)
}

export function requestExtension(bookingId, requestedEnd) {
  return post(`/bookings/${bookingId}/extension`, { requestedEnd })
}
