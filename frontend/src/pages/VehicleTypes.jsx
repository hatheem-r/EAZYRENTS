import { Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { getVehicleFacets } from '../api/vehicles.js'
import Skeleton from '../components/Skeleton.jsx'
import VehicleArt from '../components/VehicleArt.jsx'

function VehicleTypes() {
  const { data, loading, error, refetch } = useApi(() => getVehicleFacets(), [])

  usePageTitle('Browse by vehicle type')

  return (
    <section className="vehicle-types">
      <header className="page-header">
        <h1 className="vehicle-types__heading">What are you driving?</h1>
        <p className="page-header__lede">
          Pick a vehicle type to see what hosts near you have available.
        </p>
      </header>

      {loading && <Skeleton variant="card" count={5} />}

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
              <Link to={`/vehicles?type=${type}`} className="type-card__link">
                <article>
                  <div className="type-card__art">
                    <VehicleArt type={type} />
                  </div>
                  <h2 className="type-card__title">{type}</h2>
                  <span className="type-card__count">
                    {count} available
                  </span>
                </article>
              </Link>
            </li>
          ))}

          {/* Not a bookable type yet — the backend's type enum doesn't
              include tuktuk. Shown as a teaser until the migration lands. */}
          <li className="type-card type-card--soon" aria-disabled="true">
            <article>
              <div className="type-card__art">
                <VehicleArt type="tuktuk" />
              </div>
              <h2 className="type-card__title">Tuktuk</h2>
              <span className="type-card__count type-card__count--soon">Coming soon</span>
            </article>
          </li>
        </ul>
      )}
    </section>
  )
}

export default VehicleTypes
