import { get } from './client.js'

export function listVehicles(filters = {}) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return get(`/vehicles${query ? `?${query}` : ''}`)
}

export function getVehicle(id) {
  return get(`/vehicles/${id}`)
}

export function getVehicleFacets() {
  return get('/vehicles/facets')
}
