import { get, post, patch, del } from './client.js'

export function listHostVehicles() {
  return get('/host/vehicles')
}

export function listHostBookings() {
  return get('/host/bookings')
}

export function createVehicle(data) {
  return post('/vehicles', data)
}

export function updateVehicle(id, data) {
  return patch(`/vehicles/${id}`, data)
}

export function removeVehicle(id) {
  return del(`/vehicles/${id}`)
}

export function listVehicleBlocks(vehicleId) {
  return get(`/vehicles/${vehicleId}/blocks`)
}

export function createBlock(vehicleId, { startDate, endDate, reason }) {
  return post(`/vehicles/${vehicleId}/blocks`, { startDate, endDate, reason })
}

export function deleteBlock(vehicleId, blockId) {
  return del(`/vehicles/${vehicleId}/blocks/${blockId}`)
}

export function listExtensionRequests() {
  return get('/host/extensions')
}

export function approveExtension(id) {
  return post(`/extensions/${id}/approve`)
}

export function rejectExtension(id) {
  return post(`/extensions/${id}/reject`)
}
