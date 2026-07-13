import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useApi } from '../../hooks/useApi.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { listHostVehicles, listHostBookings, createVehicle, updateVehicle, removeVehicle } from '../../api/host.js'
import { ApiError } from '../../api/client.js'
import VehicleForm from '../../components/host/VehicleForm.jsx'
import PhotoManager from '../../components/host/PhotoManager.jsx'
import Skeleton from '../../components/Skeleton.jsx'

const ACTIVE_STATUSES = ['active', 'confirmed']

function isCoveringNow(booking, now) {
  const start = new Date(booking.start_date)
  const end = new Date(booking.end_date)
  return start <= now && now < end
}

function findCurrentBooking(bookings, vehicleId, now) {
  return bookings.find(
    (booking) =>
      booking.vehicle.id === vehicleId &&
      ACTIVE_STATUSES.includes(booking.status) &&
      isCoveringNow(booking, now),
  )
}

function findNextUpcoming(bookings, vehicleId, now) {
  return bookings
    .filter(
      (booking) =>
        booking.vehicle.id === vehicleId &&
        booking.status === 'confirmed' &&
        new Date(booking.start_date) > now,
    )
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0]
}

function HostDashboard() {
  const vehiclesApi = useApi(() => listHostVehicles(), [])
  const bookingsApi = useApi(() => listHostBookings(), [])
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [dashboardError, setDashboardError] = useState('')
  const [dashboardNotice, setDashboardNotice] = useState('')

  usePageTitle('My vehicles')

  const loading = vehiclesApi.loading || bookingsApi.loading
  const error = vehiclesApi.error || bookingsApi.error

  function retry() {
    vehiclesApi.refetch()
    bookingsApi.refetch()
  }

  async function handleCreate(data) {
    await createVehicle(data)
    setAddFormOpen(false)
    vehiclesApi.refetch()
  }

  async function handleUpdate(id, data) {
    try {
      await updateVehicle(id, data)
      setEditingId(null)
      vehiclesApi.refetch()
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // vehicle changed under us — resync
        vehiclesApi.refetch()
      }
      throw err
    }
  }

  async function handleRemove(id) {
    if (!window.confirm('Remove this vehicle? Upcoming bookings will be cancelled.')) return

    setDashboardError('')
    setDashboardNotice('')

    try {
      const result = await removeVehicle(id)
      setDashboardNotice(
        result.cancelledBookings > 0
          ? `Vehicle removed. ${result.cancelledBookings} upcoming booking(s) were cancelled.`
          : 'Vehicle removed.',
      )
      // counts may have changed — resync everything the removal could affect.
      vehiclesApi.refetch()
      bookingsApi.refetch()
    } catch (err) {
      setDashboardError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <section className="host-dashboard">
      <h1 className="host-dashboard__heading">My vehicles</h1>

      {dashboardError && (
        <p className="form-error" role="alert">
          {dashboardError}
        </p>
      )}

      {dashboardNotice && (
        <p className="notice" role="status">
          {dashboardNotice}
        </p>
      )}

      <button type="button" onClick={() => setAddFormOpen((open) => !open)}>
        {addFormOpen ? 'Cancel' : '+ Add vehicle'}
      </button>

      {addFormOpen && <VehicleForm onSubmit={handleCreate} onCancel={() => setAddFormOpen(false)} />}

      {loading && <Skeleton variant="card" count={3} />}

      {!loading && error && (
        <section className="error-panel" role="alert">
          <p>{error.message}</p>
          <button type="button" onClick={retry}>
            Retry
          </button>
        </section>
      )}

      {!loading && !error && vehiclesApi.data.vehicles.length === 0 && (
        <p className="empty-state">No vehicles yet.</p>
      )}

      {!loading && !error && vehiclesApi.data.vehicles.length > 0 && (
        <ul className="host-vehicle-list">
          {vehiclesApi.data.vehicles.map((vehicle) => {
            const now = new Date()
            const bookings = bookingsApi.data?.bookings ?? []
            const currentBooking = findCurrentBooking(bookings, vehicle.id, now)
            const nextBooking = findNextUpcoming(bookings, vehicle.id, now)
            const isEditing = editingId === vehicle.id

            return (
              <li key={vehicle.id} className="host-vehicle-card">
                <article>
                  {isEditing ? (
                    <VehicleForm
                      initialValues={vehicle}
                      onSubmit={(data) => handleUpdate(vehicle.id, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <h2>
                        {vehicle.make} {vehicle.model}
                      </h2>
                      <span className="host-vehicle-card__type">{vehicle.type}</span>
                      <span className="host-vehicle-card__city">{vehicle.city}</span>
                      <span className="host-vehicle-card__price">LKR {vehicle.price_per_day}/day</span>

                      {currentBooking ? (
                        <span className="vehicle-status vehicle-status--rented">
                          Rented by {currentBooking.renter.name} until{' '}
                          {format(new Date(currentBooking.end_date), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="vehicle-status vehicle-status--available">Available</span>
                      )}

                      {nextBooking && (
                        <p className="vehicle-status__next">
                          Next: {format(new Date(nextBooking.start_date), 'MMM d')}-{format(new Date(nextBooking.end_date), 'MMM d')},{' '}
                          {nextBooking.renter.name}
                        </p>
                      )}

                      <div className="host-vehicle-card__actions">
                        <button
                          type="button"
                          onClick={() => setEditingId(vehicle.id)}
                          aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(vehicle.id)}
                          aria-label={`Remove ${vehicle.make} ${vehicle.model}`}
                        >
                          Remove
                        </button>
                        <Link
                          to={`/host/vehicles/${vehicle.id}/blocks`}
                          aria-label={`Manage blocks for ${vehicle.make} ${vehicle.model}`}
                        >
                          Manage blocks
                        </Link>
                      </div>

                      <PhotoManager vehicle={vehicle} onChanged={vehiclesApi.refetch} />
                    </>
                  )}
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default HostDashboard
