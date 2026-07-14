import { useRef, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import { differenceInCalendarDays } from 'date-fns'
import { useApi } from '../hooks/useApi.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { getVehicle } from '../api/vehicles.js'
import { createBooking } from '../api/bookings.js'
import { ApiError } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { buildDisabledMatchers, rangeOverlapsDisabled, toUtcMidnightIso } from '../lib/availability.js'
import Skeleton from '../components/Skeleton.jsx'
import { photoUrl } from '../utils/imageUrl.js'
import VehicleArt from '../components/VehicleArt.jsx'

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

  usePageTitle(vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle details')

  if (loading) {
    return <Skeleton />
  }

  if (error) {
    if (error.status === 404) {
      return (
        <section className="error-panel">
          <p>This vehicle is no longer listed.</p>
          <Link to="/vehicles" className="btn btn--secondary btn--small">
            Back to vehicles
          </Link>
        </section>
      )
    }

    return (
      <section className="error-panel" role="alert">
        <p>{error.message}</p>
        <button type="button" className="btn btn--secondary" onClick={refetch}>
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
    <section className="vehicle-details-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/vehicles" className="breadcrumb__link">
          All vehicles
        </Link>
        <span className="breadcrumb__current">
          {vehicle.make} {vehicle.model}
        </span>
      </nav>

      <article className="vehicle-details">
        <div className="vehicle-details__main">
          <header className="vehicle-details__header">
            <h1 className="vehicle-details__heading">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="vehicle-details__meta">
              <span className="vehicle-details__type">{vehicle.type}</span>
              <span className="vehicle-details__city">{vehicle.city}</span>
            </p>
          </header>

          {vehicle.photos?.length > 0 ? (
            <ul className="vehicle-details__photos">
              {vehicle.photos.map((photo, index) => (
                <li
                  key={photo}
                  className={index === 0 ? 'vehicle-details__photo--lead' : 'vehicle-details__photo'}
                >
                  <figure>
                    <img src={photoUrl(photo)} alt={`${vehicle.make} ${vehicle.model}`} />
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            <div className="vehicle-details__no-photos no-photos" aria-hidden="true">
              <VehicleArt type={vehicle.type} />
              <p>No photos yet — but it drives just fine.</p>
            </div>
          )}

          {vehicle.description && (
            <section className="vehicle-details__about">
              <h2>About this vehicle</h2>
              <p className="vehicle-details__description">{vehicle.description}</p>
            </section>
          )}
        </div>

        <aside className="vehicle-details__panel">
          <p className="vehicle-details__price">
            LKR {vehicle.price_per_day}
            <span className="vehicle-details__price-unit">/day</span>
          </p>

          <section className="vehicle-availability">
            <h2 className="vehicle-availability__heading">Pick your dates</h2>
            <DayPicker
              mode="range"
              numberOfMonths={1}
              startMonth={new Date()}
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

            {!hasCompleteRange && (
              <p className="booking-summary__hint">
                Select a pick-up and return day to see your total. Greyed-out
                days are already booked or blocked.
              </p>
            )}

            {hasCompleteRange && (
              <>
                {user?.role === 'renter' && (
                  <>
                    {nights > 0 ? (
                      <div className="booking-summary__pricing">
                        <p className="booking-summary__math">
                          {nights} {nights === 1 ? 'night' : 'nights'} × LKR {pricePerDay}
                        </p>
                        <p className="booking-summary__total">LKR {total}</p>
                        <p className="booking-summary__note">
                          Return the vehicle before the start of your last selected day.
                        </p>
                      </div>
                    ) : (
                      <p className="booking-summary__hint">
                        Select at least two days so you have the vehicle for a full night.
                      </p>
                    )}

                    <button
                      type="button"
                      className="btn btn--primary btn--block"
                      onClick={handleBook}
                      disabled={submitting || nights === 0}
                    >
                      {submitting ? 'Booking…' : 'Book these dates'}
                    </button>
                  </>
                )}

                {!user && (
                  <Link to="/login" state={{ from: location }} className="btn btn--primary btn--block">
                    Log in to book
                  </Link>
                )}

                {user?.role === 'host' && <p className="notice">Hosts cannot book vehicles.</p>}
              </>
            )}
          </section>
        </aside>
      </article>
    </section>
  )
}

export default VehicleDetails
