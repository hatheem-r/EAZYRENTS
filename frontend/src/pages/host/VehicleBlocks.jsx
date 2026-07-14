import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { useApi } from '../../hooks/useApi.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { getVehicle } from '../../api/vehicles.js'
import { listVehicleBlocks, createBlock, deleteBlock } from '../../api/host.js'
import { ApiError } from '../../api/client.js'
import { buildDisabledMatchers, rangeOverlapsDisabled, toUtcMidnightIso } from '../../lib/availability.js'
import Skeleton from '../../components/Skeleton.jsx'
import { useConfirm } from '../../components/ConfirmDialog.jsx'

function formatDateRange(startDate, endDate) {
  // checkout day is shown to users; the exclusive-end adjustment is only for
  // calendar disabling
  const start = new Date(startDate)
  const end = new Date(endDate)
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

function VehicleBlocks() {
  const { id } = useParams()
  const vehicleApi = useApi(() => getVehicle(id), [id])
  const blocksApi = useApi(() => listVehicleBlocks(id), [id])

  const [range, setRange] = useState({ from: undefined, to: undefined })
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [blockError, setBlockError] = useState(null)
  const [listError, setListError] = useState('')
  const confirm = useConfirm()

  usePageTitle(vehicleApi.data ? `Blocked dates — ${vehicleApi.data.make} ${vehicleApi.data.model}` : 'Blocked dates')

  const loading = vehicleApi.loading || blocksApi.loading
  const error = vehicleApi.error || blocksApi.error

  function retry() {
    vehicleApi.refetch()
    blocksApi.refetch()
  }

  function handleSelect(nextRange) {
    setBlockError(null)

    const disabledMatchers = buildDisabledMatchers(vehicleApi.data.unavailable_dates)
    if (nextRange && rangeOverlapsDisabled(nextRange, disabledMatchers)) {
      setRange({ from: undefined, to: undefined })
      return
    }
    setRange(nextRange ?? { from: undefined, to: undefined })
  }

  async function handleCreateBlock(event) {
    event.preventDefault()

    setBlockError(null)
    setSubmitting(true)

    try {
      await createBlock(id, {
        startDate: toUtcMidnightIso(range.from),
        endDate: toUtcMidnightIso(range.to),
        reason: reason || undefined,
      })
      setRange({ from: undefined, to: undefined })
      setReason('')
      blocksApi.refetch()
      vehicleApi.refetch()
    } catch (err) {
      if (err instanceof ApiError) {
        // The two distinct 409 messages (block overlap vs booking conflict)
        // must surface exactly as the server sent them.
        setBlockError(err)
        if (err.status === 409) {
          blocksApi.refetch()
          vehicleApi.refetch()
        }
      } else {
        setBlockError({ message: 'Something went wrong. Please try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteBlock(blockId) {
    if (!(await confirm('Delete this block? Renters will be able to book these dates again.', { confirmLabel: 'Delete block' }))) return

    setListError('')

    try {
      await deleteBlock(id, blockId)
      blocksApi.refetch()
      vehicleApi.refetch()
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  const hasCompleteRange = Boolean(range.from && range.to)

  return (
    <section className="vehicle-blocks">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/host" className="breadcrumb__link">My vehicles</Link>
        {!loading && !error && (
          <span className="breadcrumb__current">
            {vehicleApi.data.make} {vehicleApi.data.model}
          </span>
        )}
      </nav>

      {loading && <Skeleton />}

      {!loading && error && error.status === 404 && (
        <section className="error-panel">
          <p>Vehicle not found.</p>
          <Link to="/host" className="btn btn--secondary btn--small">
            Back to my vehicles
          </Link>
        </section>
      )}

      {!loading && error && error.status !== 404 && (
        <section className="error-panel" role="alert">
          <p>{error.message}</p>
          <button type="button" className="btn btn--secondary" onClick={retry}>
            Retry
          </button>
        </section>
      )}

      {!loading && !error && (
        <>
          <header className="page-header">
            <h1 className="vehicle-blocks__heading">
              Blocked dates — {vehicleApi.data.make} {vehicleApi.data.model}
            </h1>
            <p className="page-header__lede">
              Renters can't book any day you block. Bookings that already exist stay untouched.
            </p>
          </header>

          <div className="vehicle-blocks__layout">
          <section className="block-list">
            <h2 className="block-list__heading">Current blocks</h2>
            {listError && (
              <p className="form-error" role="alert">
                {listError}
              </p>
            )}

            {blocksApi.data.blocks.length === 0 ? (
              <p className="empty-state empty-state--compact">
                No blocked dates yet — every free day is bookable.
              </p>
            ) : (
              <ul>
                {blocksApi.data.blocks.map((block) => (
                  <li key={block.id} className="block-card">
                    <div className="block-card__info">
                      <p className="block-card__dates">
                        {formatDateRange(block.start_date, block.end_date)}
                      </p>
                      {block.reason && <p className="block-card__reason">{block.reason}</p>}
                    </div>
                    <button
                      type="button"
                      className="btn btn--danger btn--small"
                      onClick={() => handleDeleteBlock(block.id)}
                      aria-label={`Delete block ${formatDateRange(block.start_date, block.end_date)}`}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="block-create">
            <h2>Block new dates</h2>

            {blockError && (
              <p className="form-error" role="alert">
                {blockError.message}
              </p>
            )}

            {blockError?.status === 404 && (
              <p>
                <Link to="/host" className="btn btn--secondary btn--small">
                  Back to my vehicles
                </Link>
              </p>
            )}

            <DayPicker
              mode="range"
              numberOfMonths={1}
              startMonth={new Date()}
              disabled={buildDisabledMatchers(vehicleApi.data.unavailable_dates)}
              excludeDisabled
              selected={range}
              onSelect={handleSelect}
            />

            <form className="block-form" onSubmit={handleCreateBlock}>
              <div className="form-field">
                <label htmlFor="block-reason">Reason (optional)</label>
                <input
                  id="block-reason"
                  name="reason"
                  type="text"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={!hasCompleteRange || submitting}
              >
                {submitting ? 'Blocking…' : 'Block these dates'}
              </button>
            </form>
          </section>
          </div>
        </>
      )}
    </section>
  )
}

export default VehicleBlocks
