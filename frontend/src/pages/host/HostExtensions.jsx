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
      <h1>Extension requests</h1>

      {extensionsApi.loading && <Skeleton variant="card" count={3} />}

      {!extensionsApi.loading && extensionsApi.error && (
        <section className="error-panel" role="alert">
          <p>{extensionsApi.error.message}</p>
          <button type="button" onClick={extensionsApi.refetch}>
            Retry
          </button>
        </section>
      )}

      {!extensionsApi.loading && !extensionsApi.error && extensionsApi.data.extensions.length === 0 && (
        <p className="empty-state">No pending requests.</p>
      )}

      {!extensionsApi.loading && !extensionsApi.error && extensionsApi.data.extensions.length > 0 && (
        <ul className="extension-list">
          {extensionsApi.data.extensions.map((request) => (
            <li key={request.id} className="extension-card">
              <p>
                {request.renter_name} requests {request.make} {request.model} until{' '}
                {format(new Date(request.requested_end), 'MMM d, yyyy')} (currently until{' '}
                {format(new Date(request.end_date), 'MMM d, yyyy')})
              </p>

              {extensionCardErrors[request.id] && (
                <p className="form-error" role="alert">
                  {extensionCardErrors[request.id]}
                </p>
              )}

              <button
                type="button"
                onClick={() => handleExtensionAction(request.id, approveExtension)}
                disabled={submittingExtensionId === request.id}
                aria-label={`Approve extension request from ${request.renter_name}`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleExtensionAction(request.id, rejectExtension)}
                disabled={submittingExtensionId === request.id}
                aria-label={`Reject extension request from ${request.renter_name}`}
              >
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default HostExtensions
