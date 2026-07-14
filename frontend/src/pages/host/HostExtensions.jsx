import { useState } from 'react'
import { format } from 'date-fns'
import { useApi } from '../../hooks/useApi.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { listExtensionRequests, approveExtension, rejectExtension } from '../../api/host.js'
import { ApiError } from '../../api/client.js'
import Skeleton from '../../components/Skeleton.jsx'

function HostExtensions() {
  const extensionsApi = useApi(() => listExtensionRequests(), [])

  const [submittingExtensionId, setSubmittingExtensionId] = useState(null)
  const [extensionCardErrors, setExtensionCardErrors] = useState({})

  usePageTitle('Extension requests')

  async function handleExtensionAction(id, apiCall) {
    setSubmittingExtensionId(id)
    setExtensionCardErrors((prev) => ({ ...prev, [id]: '' }))

    try {
      await apiCall(id)
      // the bookings page refetches on its own mount — no need to reach
      // across pages to keep its data fresh here.
      extensionsApi.refetch()
    } catch (err) {
      // A conflict rolls back server-side; the request is still pending, so
      // refetching keeps the card (with this message) if it's still in the
      // pending list, or removes it if the request was stale (already
      // decided / 404).
      setExtensionCardErrors((prev) => ({
        ...prev,
        [id]: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      }))
      extensionsApi.refetch()
    } finally {
      setSubmittingExtensionId(null)
    }
  }

  return (
    <section className="extension-inbox">
      <header className="page-header">
        <h1>Extension requests</h1>
        <p className="page-header__lede">
          Renters asking for more days. Approving updates the booking instantly.
        </p>
      </header>

      {extensionsApi.loading && <Skeleton variant="card" count={3} />}

      {!extensionsApi.loading && extensionsApi.error && (
        <section className="error-panel" role="alert">
          <p>{extensionsApi.error.message}</p>
          <button type="button" className="btn btn--secondary" onClick={extensionsApi.refetch}>
            Retry
          </button>
        </section>
      )}

      {!extensionsApi.loading && !extensionsApi.error && extensionsApi.data.extensions.length === 0 && (
        <div className="empty-state">
          <p>No pending requests — all caught up.</p>
        </div>
      )}

      {!extensionsApi.loading && !extensionsApi.error && extensionsApi.data.extensions.length > 0 && (
        <ul className="extension-list">
          {extensionsApi.data.extensions.map((request) => (
            <li key={request.id} className="extension-card">
              <p className="extension-card__text">
                <strong>{request.renter_name}</strong> wants {request.make} {request.model}{' '}
                until{' '}
                <span className="extension-card__new-date">
                  {format(new Date(request.requested_end), 'MMM d, yyyy')}
                </span>{' '}
                <span className="extension-card__current">
                  (currently until {format(new Date(request.end_date), 'MMM d, yyyy')})
                </span>
              </p>

              {extensionCardErrors[request.id] && (
                <p className="form-error" role="alert">
                  {extensionCardErrors[request.id]}
                </p>
              )}

              <div className="extension-card__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--small"
                  onClick={() => handleExtensionAction(request.id, approveExtension)}
                  disabled={submittingExtensionId === request.id}
                  aria-label={`Approve extension request from ${request.renter_name}`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  onClick={() => handleExtensionAction(request.id, rejectExtension)}
                  disabled={submittingExtensionId === request.id}
                  aria-label={`Reject extension request from ${request.renter_name}`}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default HostExtensions
