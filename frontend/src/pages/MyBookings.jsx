import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { useApi } from '../hooks/useApi.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { listMyBookings, cancelBooking, requestExtension } from '../api/bookings.js'
import { ApiError } from '../api/client.js'
import Skeleton from '../components/Skeleton.jsx'

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

      {loading && <Skeleton variant="card" count={3} />}

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
                      <>
                        {extendingId !== booking.id && (
                          <button
                            type="button"
                            onClick={() => openExtendForm(booking.id)}
                            aria-label={`Extend booking for ${booking.vehicle.make} ${booking.vehicle.model}`}
                          >
                            Extend
                          </button>
                        )}

                        {extendingId === booking.id && (
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
                              <label htmlFor={`extension-date-${booking.id}`}>
                                New return date
                              </label>
                              <input
                                id={`extension-date-${booking.id}`}
                                type="date"
                                min={format(addDays(new Date(booking.end_date), 1), 'yyyy-MM-dd')}
                                value={extensionDate}
                                onChange={(event) => setExtensionDate(event.target.value)}
                                required
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={extensionSubmittingId === booking.id}
                            >
                              {extensionSubmittingId === booking.id
                                ? 'Requesting…'
                                : 'Request extension'}
                            </button>
                            <button type="button" onClick={closeExtendForm} aria-label="Cancel extension request">
                              Cancel
                            </button>
                          </form>
                        )}
                      </>
                    ))}
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
