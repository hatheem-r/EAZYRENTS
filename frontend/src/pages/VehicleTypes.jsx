import { Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { getVehicleFacets } from '../api/vehicles.js'

function VehicleTypes() {
  const { data, loading, error, refetch } = useApi(() => getVehicleFacets(), [])

  return (
    <section className="vehicle-types">
      <h1 className="vehicle-types__heading">Browse by vehicle type</h1>

      {loading && (
        <p className="loading" role="status">
          Loading vehicle types…
        </p>
      )}

      {!loading && error && (
        <section className="error-panel" role="alert">
          <p>{error.message}</p>
          <button type="button" onClick={refetch}>
            Retry
          </button>
        </section>
      )}

      {!loading && !error && data?.types.length === 0 && (
        <p className="empty-state">No vehicle types available.</p>
      )}

      {!loading && !error && data?.types.length > 0 && (
        <ul className="type-grid">
          {data.types.map(({ type, count }) => (
            <li key={type} className="type-card">
              <Link to={`/vehicles?type=${type}`}>
                <article>
                  <h2>{type}</h2>
                  {/* <span className="type-card__count">{count} available</span> */}
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default VehicleTypes
