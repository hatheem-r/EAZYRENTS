import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { useApi } from '../hooks/useApi.js'
import { listMyBookings, cancelBooking } from '../api/bookings.js'
import { ApiError } from '../api/client.js'

const CANCELLABLE_STATUSES = ['pending', 'confirmed']
const REMAINING_STATUSES = ['confirmed', 'active']

function formatDateRange(startDate, endDate) {
  // checkout day is shown to users; the exclusive-end adjustment is only for
  // calendar disabling
  const start = new Date(startDate)
  const end = new Date(endDate)
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

function MyBookings() {
  const location = useLocation()
  const { data, loading, error, refetch } = useApi(() => listMyBookings(), [])
  const [cancelError, setCancelError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking?')) return

    setCancelError('')
    setCancellingId(id)

    try {
      await cancelBooking(id)
      refetch()
    } catch (err) {
      if (err instanceof ApiError) {
        setCancelError(err.message)
        if (err.status === 404) {
          // the state changed under us — resync
          refetch()
        }
      } else {
        setCancelError('Something went wrong. Please try again.')
      }
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section className="my-bookings">
      <h1 className="my-bookings__heading">My bookings</h1>

      {location.state?.justBooked && (
        <p className="notice notice--success" role="status">
          Booking confirmed!
        </p>
      )}

      {cancelError && (
        <p className="form-error" role="alert">
          {cancelError}
        </p>
      )}

      {loading && (
        <p className="loading" role="status">
          Loading bookings…
        </p>
      )}

      {!loading && error && (
        <section className="error-panel" role="alert">
          <p>{error.message}</p>
          <button type="button" onClick={refetch}>
            Retry
          </button>
        </section>
      )}

      {!loading && !error && data?.bookings.length === 0 && (
        <p className="empty-state">
          No bookings yet. <Link to="/vehicles/types">Browse vehicles</Link>
        </p>
      )}

      {!loading && !error && data?.bookings.length > 0 && (
        <ul className="booking-list">
          {data.bookings.map((booking) => {
            const endingSoon =
              REMAINING_STATUSES.includes(booking.status) && booking.days_remaining <= 2

            return (
              <li
                key={booking.id}
                className={
                  endingSoon ? 'booking-card booking-card--ending-soon' : 'booking-card'
                }
              >
                <article>
                  <h2>
                    {booking.vehicle.make} {booking.vehicle.model}
                  </h2>

                  <p>{formatDateRange(booking.start_date, booking.end_date)}</p>

                  <span className={`status-badge status-badge--${booking.status}`}>
                    {booking.status}
                  </span>

                  {endingSoon && <span className="badge badge--ending-soon">Ending soon</span>}

                  <p className="booking-card__total">Total: LKR {booking.total_amount}</p>

                  {REMAINING_STATUSES.includes(booking.status) && (
                    <p className="booking-card__remaining">
                      {booking.days_remaining} days remaining
                    </p>
                  )}

                  {CANCELLABLE_STATUSES.includes(booking.status) && (
                    <button
                      type="button"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? 'Cancelling…' : 'Cancel'}
                    </button>
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

export default MyBookings
