import { format } from 'date-fns'
import { useApi } from '../../hooks/useApi.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { listHostBookings } from '../../api/host.js'
import Skeleton from '../../components/Skeleton.jsx'

function formatDateRange(startDate, endDate) {
  // checkout day is shown to users; the exclusive-end adjustment is only for
  // calendar disabling
  const start = new Date(startDate)
  const end = new Date(endDate)
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

function sortBookings(bookings) {
  const now = new Date()
  const upcoming = []
  const past = []

  for (const booking of bookings) {
    if (new Date(booking.end_date) >= now) {
      upcoming.push(booking)
    } else {
      past.push(booking)
    }
  }

  const byStartDate = (a, b) => new Date(a.start_date) - new Date(b.start_date)
  upcoming.sort(byStartDate)
  past.sort(byStartDate)

  return [...upcoming, ...past]
}

function HostBookings() {
  const bookingsApi = useApi(() => listHostBookings(), [])

  usePageTitle('Bookings on my vehicles')

  return (
    <section className="host-bookings">
      <h1>Bookings on my vehicles</h1>

      {bookingsApi.loading && <Skeleton variant="card" count={3} />}

      {!bookingsApi.loading && bookingsApi.error && (
        <section className="error-panel" role="alert">
          <p>{bookingsApi.error.message}</p>
          <button type="button" onClick={bookingsApi.refetch}>
            Retry
          </button>
        </section>
      )}

      {!bookingsApi.loading && !bookingsApi.error && bookingsApi.data.bookings.length === 0 && (
        <p className="empty-state">No bookings yet.</p>
      )}

      {!bookingsApi.loading && !bookingsApi.error && bookingsApi.data.bookings.length > 0 && (
        <ul className="host-booking-list">
          {sortBookings(bookingsApi.data.bookings).map((booking) => (
            <li key={booking.id} className="host-booking-card">
              <p>
                {booking.vehicle.make} {booking.vehicle.model} — {booking.renter.name} (
                {booking.renter.email})
              </p>

              <p>{formatDateRange(booking.start_date, booking.end_date)}</p>

              <span className={`status-badge status-badge--${booking.status}`}>
                {booking.status}
              </span>

              <p className="host-booking-card__total">Total: LKR {booking.total_amount}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default HostBookings
