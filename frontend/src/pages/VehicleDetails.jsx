import { useRef, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { differenceInCalendarDays } from 'date-fns'
import { useApi } from '../hooks/useApi.js'
import { getVehicle } from '../api/vehicles.js'
import { createBooking } from '../api/bookings.js'
import { ApiError } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { buildDisabledMatchers, rangeOverlapsDisabled, toUtcMidnightIso } from '../lib/availability.js'

function VehicleDetails() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: vehicle, loading, error, refetch } = useApi(() => getVehicle(id), [id])
  const [range, setRange] = useState({ from: undefined, to: undefined })
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')

  // One key per booking attempt; retries/double-clicks replay the same
  // booking. React StrictMode double-mount in dev creates a fresh ref per
  // mount — fine, since no request fires on mount.
  const idemKey = useRef(crypto.randomUUID())

  if (loading) {
    return (
      <p className="loading" role="status">
        Loading vehicle…
      </p>
    )
  }

  if (error) {
    if (error.status === 404) {
      return (
        <section className="error-panel">
          <p>Vehicle not found</p>
          <Link to="/vehicles">Back to vehicles</Link>
        </section>
      )
    }

    return (
      <section className="error-panel" role="alert">
        <p>{error.message}</p>
        <button type="button" onClick={refetch}>
          Retry
        </button>
      </section>
    )
  }

  const disabledMatchers = buildDisabledMatchers(vehicle.unavailable_dates)

  function handleSelect(nextRange) {
    setBookingError('')

    // excludeDisabled already prevents extending a range through a disabled
    // day, but double-check here in case a range still slips through.
    if (nextRange && rangeOverlapsDisabled(nextRange, disabledMatchers)) {
      setRange({ from: undefined, to: undefined })
      return
    }
    setRange(nextRange ?? { from: undefined, to: undefined })
  }

  async function handleBook() {
    setBookingError('')
    setSubmitting(true)

    try {
      const booking = await createBooking(
        {
          vehicleId: vehicle.id,
          startDate: toUtcMidnightIso(range.from),
          endDate: toUtcMidnightIso(range.to),
        },
        idemKey.current,
      )
      navigate('/my-bookings', { state: { justBooked: booking.id } })
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setBookingError('Something went wrong. Please try again.')
      } else if (err.status === 401) {
        // handled globally via the auth:expired listener — AuthContext
        // clears the session and this page re-renders logged-out.
      } else if (err.status === 409) {
        setBookingError(err.message)
        refetch()
        setRange({ from: undefined, to: undefined })
        // a rejected attempt is a new attempt next time
        idemKey.current = crypto.randomUUID()
      } else if (err.status === 403) {
        setBookingError('Hosts cannot book vehicles')
      } else if (err.status === 400) {
        setBookingError(err.message)
      } else {
        setBookingError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const hasCompleteRange = Boolean(range.from && range.to)
  const nights = hasCompleteRange ? differenceInCalendarDays(range.to, range.from) : 0
  const pricePerDay = Number(vehicle.price_per_day)
  const total = nights * pricePerDay

  return (
    <section>

    <Link to="/vehicles">Back to vehicles</Link>

    <article className="vehicle-details">
      <header className="vehicle-details__header">
        <h1 className="vehicle-details__heading">
          {vehicle.make} {vehicle.model}
        </h1>
        <span className="vehicle-details__type">{vehicle.type}</span>
        <span className="vehicle-details__city">{vehicle.city}</span>
      </header>

      {vehicle.photos?.length > 0 && (
        <ul className="vehicle-details__photos">
          {vehicle.photos.map((photo) => (
            <li key={photo}>
              <figure>
                <img src={photo} alt={`${vehicle.make} ${vehicle.model}`} />
              </figure>
            </li>
          ))}
        </ul>
      )}

      {vehicle.description && <p className="vehicle-details__description">{vehicle.description}</p>}

      <p className="vehicle-details__price">LKR {vehicle.price_per_day}/day</p>

      <section className="vehicle-availability">
        <DayPicker
          mode="range"
          numberOfMonths={2}
          disabled={disabledMatchers}
          excludeDisabled
          selected={range}
          onSelect={handleSelect}
          />
      </section>

      <section className="booking-summary">
        {bookingError && (
          <p className="form-error" role="alert">
            {bookingError}
          </p>
        )}

        {hasCompleteRange &&  (
          <>
            {user?.role === 'renter' && (
              <>
              
              <p className="booking-summary__pricing">
                {nights > 0
                  ? `${nights} nights × LKR ${pricePerDay} = LKR ${total}. Return your vehicle before the beginning of the last date.`
                  : 'Select more than two days, so you will have your vehicle for at least one night.'}
              </p>

              <button type="button" onClick={handleBook} disabled={submitting}>
                {submitting ? 'Booking…' : 'Book these dates'}
              </button>
              </>
            ) }


            {!user && (
              <Link to="/login" state={{ from: location }}>
                Log in to book
              </Link>
            )}


            {user?.role === 'host' && <p className="notice">Hosts cannot book vehicles.</p>}
          </>
        )}
      </section>
    </article>
   </section>
  )
}

export default VehicleDetails
