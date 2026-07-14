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

function groupBookings(bookings) {
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

  return { upcoming, past }
}

function HostBookingCard({ booking }) {
  return (
    <li className="host-booking-card">
      <div className="host-booking-card__who">
        <p className="host-booking-card__renter">{booking.renter.name}</p>
        <p className="host-booking-card__vehicle">
          {booking.vehicle.make} {booking.vehicle.model}
        </p>
        <p className="host-booking-card__email">{booking.renter.email}</p>
      </div>

      <p className="host-booking-card__dates">
        {formatDateRange(booking.start_date, booking.end_date)}
      </p>

      <div className="host-booking-card__facts">
        <span className={`status-badge status-badge--${booking.status}`}>
          {booking.status}
        </span>
        <p className="host-booking-card__total">LKR {booking.total_amount}</p>
      </div>
    </li>
  )
}

function HostBookings() {
  const bookingsApi = useApi(() => listHostBookings(), [])

  usePageTitle('Bookings on my vehicles')

  return (
    <section className="host-bookings">
      <header className="page-header">
        <h1>Bookings on my vehicles</h1>
        <p className="page-header__lede">Who has which vehicle, and until when.</p>
      </header>

      {bookingsApi.loading && <Skeleton variant="card" count={3} />}

      {!bookingsApi.loading && bookingsApi.error && (
        <section className="error-panel" role="alert">
          <p>{bookingsApi.error.message}</p>
          <button type="button" className="btn btn--secondary" onClick={bookingsApi.refetch}>
            Retry
          </button>
        </section>
      )}

      {!bookingsApi.loading && !bookingsApi.error && bookingsApi.data.bookings.length === 0 && (
        <div className="empty-state">
          <p>No bookings yet. Once renters book your vehicles, they'll show up here.</p>
        </div>
      )}

      {!bookingsApi.loading && !bookingsApi.error && bookingsApi.data.bookings.length > 0 && (
        (() => {
          const { upcoming, past } = groupBookings(bookingsApi.data.bookings)
          return (
            <>
              {upcoming.length > 0 && (
                <section className="booking-tier">
                  <h2 className="booking-tier__heading">Current &amp; upcoming</h2>
                  <ul className="host-booking-list">
                    {upcoming.map((booking) => (
                      <HostBookingCard key={booking.id} booking={booking} />
                    ))}
                  </ul>
                </section>
              )}

              {past.length > 0 && (
                <section className="booking-tier booking-tier--past">
                  <h2 className="booking-tier__heading">Past</h2>
                  <ul className="host-booking-list">
                    {past.map((booking) => (
                      <HostBookingCard key={booking.id} booking={booking} />
                    ))}
                  </ul>
                </section>
              )}
            </>
          )
        })()
      )}
    </section>
  )
}

export default HostBookings
