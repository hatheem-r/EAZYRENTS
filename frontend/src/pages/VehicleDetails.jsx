import { useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { subDays, differenceInCalendarDays, isBefore, isWithinInterval, startOfToday, eachDayOfInterval } from 'date-fns'
import { useApi } from '../hooks/useApi.js'
import { getVehicle } from '../api/vehicles.js'
import { useAuth } from '../auth/AuthContext.jsx'

function buildDisabledMatchers(unavailableDates) {
  const pastDays = { before: startOfToday() }

  const bookedRanges = unavailableDates.map(({ start_date, end_date }) => ({
    from: new Date(start_date),
    // end_date is the checkout day (exclusive) — the guest can still check
    // out that morning, so the last actually-blocked night is the day before.
    to: subDays(new Date(end_date), 1),
  }))

  return [pastDays, ...bookedRanges]
}

function rangeOverlapsDisabled(range, disabledMatchers) {
  if (!range?.from || !range?.to) return false

  const days = eachDayOfInterval({ start: range.from, end: range.to })

  return days.some((day) =>
    disabledMatchers.some((matcher) =>
      matcher.before ? isBefore(day, matcher.before) : isWithinInterval(day, { start: matcher.from, end: matcher.to }),
    ),
  )
}

function VehicleDetails() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const { data: vehicle, loading, error, refetch } = useApi(() => getVehicle(id), [id])
  const [range, setRange] = useState({ from: undefined, to: undefined })

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
    // excludeDisabled already prevents extending a range through a disabled
    // day, but double-check here in case a range still slips through.
    if (nextRange && rangeOverlapsDisabled(nextRange, disabledMatchers)) {
      setRange({ from: undefined, to: undefined })
      return
    }
    setRange(nextRange ?? { from: undefined, to: undefined })
  }

  const hasCompleteRange = Boolean(range.from && range.to)
  const nights = hasCompleteRange ? differenceInCalendarDays(range.to, range.from) : 0
  const pricePerDay = Number(vehicle.price_per_day)
  const total = nights * pricePerDay

  return (
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
        {hasCompleteRange && (
          <>
            <p>
              {nights} days × LKR {pricePerDay} = LKR {total}
            </p>
            {user ? (
              <button type="button" disabled title="coming in next step">
                Book these dates
              </button>
            ) : (
              <Link to="/login" state={{ from: location }}>
                Log in to book
              </Link>
            )}
          </>
        )}
      </section>
    </article>
  )
}

export default VehicleDetails
