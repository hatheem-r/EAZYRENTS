import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { useApi } from '../hooks/useApi.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { listMyBookings, cancelBooking, requestExtension } from '../api/bookings.js'
import { ApiError } from '../api/client.js'
import Skeleton from '../components/Skeleton.jsx'
import { useConfirm } from '../components/ConfirmDialog.jsx'

const CANCELLABLE_STATUSES = ['pending', 'confirmed']
const REMAINING_STATUSES = ['confirmed', 'active']
const LINKABLE_STATUSES = ['pending', 'confirmed', 'active']
const EXTENDABLE_STATUSES = ['confirmed', 'active']

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
  const confirm = useConfirm()
  const [cancellingId, setCancellingId] = useState(null)

  const [extendingId, setExtendingId] = useState(null)
  const [extensionDate, setExtensionDate] = useState('')
  const [extensionError, setExtensionError] = useState('')
  const [extensionSubmittingId, setExtensionSubmittingId] = useState(null)
  // session-local only; the backend does not yet expose extension-request
  // status on /bookings/mine — TODO candidate: include pending extensions
  // in /bookings/mine so this survives a refresh.
  const [pendingExtensionIds, setPendingExtensionIds] = useState(() => new Set())

  usePageTitle('My bookings')

  async function handleCancel(id) {
    if (!(await confirm('Cancel this booking? Your dates will be released.', { confirmLabel: 'Cancel booking' }))) return

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

  function openExtendForm(bookingId) {
    setExtensionError('')
    setExtensionDate('')
    setExtendingId(bookingId)
  }

  function closeExtendForm() {
    setExtensionError('')
    setExtensionDate('')
    setExtendingId(null)
  }

  async function handleRequestExtension(event, bookingId) {
    event.preventDefault()

    setExtensionError('')
    setExtensionSubmittingId(bookingId)

    try {
      // A date-only string like "2027-01-15" parses as UTC midnight, which
      // matches the backend's zod ISO datetime expectation and the
      // checkout-day convention — the requested end is exclusive, so this is
      // the first moment the chosen day is no longer included in the stay.
      const requestedEndIso = new Date(extensionDate).toISOString()

      await requestExtension(bookingId, requestedEndIso)

      setPendingExtensionIds((prev) => new Set(prev).add(bookingId))
      closeExtendForm()
    } catch (err) {
      if (err instanceof ApiError) {
        setExtensionError(err.message)
        if (err.status === 409) {
          // a pending request already exists — reflect reality
          setPendingExtensionIds((prev) => new Set(prev).add(bookingId))
        }
      } else {
        setExtensionError('Something went wrong. Please try again.')
      }
    } finally {
      setExtensionSubmittingId(null)
    }
  }

  const bookings = data?.bookings ?? []
  const activeBookings = bookings.filter((b) => b.status === 'active')
  const upcomingBookings = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status))
  const archivedBookings = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status))

  function renderBookingCard(booking, { tier }) {
    const endingSoon =
      REMAINING_STATUSES.includes(booking.status) && booking.days_remaining <= 2

    const cardClass = [
      'booking-card',
      tier === 'active' ? 'booking-card--current' : '',
      endingSoon ? 'booking-card--ending-soon' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <li key={booking.id} className={cardClass}>
        <article>
          <header className="booking-card__header">
            <h3 className="booking-card__title">
              {LINKABLE_STATUSES.includes(booking.status) ? (
                <Link to={`/vehicles/${booking.vehicle.id}`}>
                  {booking.vehicle.make} {booking.vehicle.model}
                </Link>
              ) : (
                // cancelled/completed bookings may reference removed
                // vehicles; plain text avoids dead links cheaply.
                <span className="booking-card__vehicle">
                  {booking.vehicle.make} {booking.vehicle.model}
                </span>
              )}
            </h3>

            <span className={`status-badge status-badge--${booking.status}`}>
              {booking.status}
            </span>
            {endingSoon && (
              <span className="status-badge status-badge--ending-soon">Ending soon</span>
            )}
          </header>

          <p className="booking-card__dates">
            {formatDateRange(booking.start_date, booking.end_date)}
          </p>

          <div className="booking-card__facts">
            {REMAINING_STATUSES.includes(booking.status) && (
              <p className="booking-card__remaining">
                <strong>{booking.days_remaining}</strong>{' '}
                {booking.days_remaining === 1 ? 'day' : 'days'} remaining
              </p>
            )}
            <p className="booking-card__total">Total: LKR {booking.total_amount}</p>
          </div>

          {(CANCELLABLE_STATUSES.includes(booking.status) ||
            EXTENDABLE_STATUSES.includes(booking.status)) && (
            <div className="booking-card__actions">
              {CANCELLABLE_STATUSES.includes(booking.status) && (
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  onClick={() => handleCancel(booking.id)}
                  disabled={cancellingId === booking.id}
                  aria-label={`Cancel booking for ${booking.vehicle.make} ${booking.vehicle.model}`}
                >
                  {cancellingId === booking.id ? 'Cancelling…' : 'Cancel'}
                </button>
              )}

              {EXTENDABLE_STATUSES.includes(booking.status) &&
                (pendingExtensionIds.has(booking.id) ? (
                  <span className="status-badge status-badge--pending">
                    Extension requested
                  </span>
                ) : (
                  extendingId !== booking.id && (
                    <button
                      type="button"
                      className="btn btn--secondary btn--small"
                      onClick={() => openExtendForm(booking.id)}
                      aria-label={`Extend booking for ${booking.vehicle.make} ${booking.vehicle.model}`}
                    >
                      Extend
                    </button>
                  )
                ))}
            </div>
          )}

          {EXTENDABLE_STATUSES.includes(booking.status) &&
            !pendingExtensionIds.has(booking.id) &&
            extendingId === booking.id && (
              <form
                className="extension-form"
                onSubmit={(event) => handleRequestExtension(event, booking.id)}
              >
                {extensionError && (
                  <p className="form-error" role="alert">
                    {extensionError}
                  </p>
                )}

                <div className="form-field">
                  <label htmlFor={`extension-date-${booking.id}`}>New return date</label>
                  <input
                    id={`extension-date-${booking.id}`}
                    type="date"
                    min={format(addDays(new Date(booking.end_date), 1), 'yyyy-MM-dd')}
                    value={extensionDate}
                    onChange={(event) => setExtensionDate(event.target.value)}
                    required
                  />
                </div>

                <div className="extension-form__actions">
                  <button
                    type="submit"
                    className="btn btn--primary btn--small"
                    disabled={extensionSubmittingId === booking.id}
                  >
                    {extensionSubmittingId === booking.id ? 'Requesting…' : 'Request extension'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={closeExtendForm}
                    aria-label="Cancel extension request"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
        </article>
      </li>
    )
  }

  return (
    <section className="my-bookings">
      <header className="page-header">
        <h1 className="my-bookings__heading">My bookings</h1>
      </header>

      {location.state?.justBooked && (
        <p className="notice notice--success" role="status">
          Booking confirmed! Your dates are locked in.
        </p>
      )}

      {cancelError && (
        <p className="form-error" role="alert">
          {cancelError}
        </p>
      )}

      {loading && <Skeleton variant="card" count={3} />}

      {!loading && error && (
        <section className="error-panel" role="alert">
          <p>{error.message}</p>
          <button type="button" className="btn btn--secondary" onClick={refetch}>
            Retry
          </button>
        </section>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty-state">
          <p>No trips on the calendar yet.</p>
          <Link to="/vehicles/types" className="btn btn--primary">
            Browse vehicles
          </Link>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div
          className={
            activeBookings.length > 0
              ? 'booking-columns'
              : 'booking-columns booking-columns--single'
          }
        >
          {activeBookings.length > 0 && (
            <section className="booking-tier booking-tier--active">
              <h2 className="booking-tier__heading">Happening now</h2>
              <ul className="booking-list">
                {activeBookings.map((booking) => renderBookingCard(booking, { tier: 'active' }))}
              </ul>
            </section>
          )}

          <div className="booking-columns__side">
          {upcomingBookings.length > 0 && (
            <section className="booking-tier">
              <h2 className="booking-tier__heading">Upcoming</h2>
              <div className="booking-columns__scroll">
                <ul className="booking-list">
                  {upcomingBookings.map((booking) => renderBookingCard(booking, { tier: 'upcoming' }))}
                </ul>
              </div>
            </section>
          )}

          {archivedBookings.length > 0 && (
            <details className="booking-archive">
              <summary className="booking-archive__summary">
                Past &amp; cancelled ({archivedBookings.length})
              </summary>
              <ul className="booking-archive__list">
                {archivedBookings.map((booking) => (
                  <li key={booking.id} className="booking-archive__row">
                    <span className="booking-archive__vehicle booking-card__vehicle">
                      {booking.vehicle.make} {booking.vehicle.model}
                    </span>
                    <span className="booking-archive__dates">
                      {formatDateRange(booking.start_date, booking.end_date)}
                    </span>
                    <span className={`status-badge status-badge--${booking.status}`}>
                      {booking.status}
                    </span>
                    <span className="booking-archive__total">LKR {booking.total_amount}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          </div>
        </div>
      )}
    </section>
  )
}

export default MyBookings
