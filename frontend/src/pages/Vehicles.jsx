import { Link, useSearchParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { listVehicles } from '../api/vehicles.js'
import FilterBar from '../components/FilterBar.jsx'
import VehicleCard from '../components/VehicleCard.jsx'

function pluralizeType(type) {
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}s`
}

function Vehicles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeType = searchParams.get('type')

  const filters = {
    type: searchParams.get('type'),
    city: searchParams.get('city'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    page: searchParams.get('page'),
  }

  const { data, loading, error, refetch } = useApi(
    () => listVehicles(filters),
    [searchParams],
  )

  const page = Number(searchParams.get('page')) || 1
  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

  function goToPage(nextPage) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', String(nextPage))
    setSearchParams(nextParams)
  }

  return (
    <section className="vehicles">

      {/* {activeType && (
        <nav className="breadcrumb">
          <Link to="/vehicles/types">Back</Link>
          <span>{pluralizeType(activeType)}</span>
        </nav>)} */}

      { <nav className="breadcrumb">
          <Link to="/vehicles/types">Back</Link>
        </nav>}

      <h1 className="vehicles__heading">
        {activeType ? pluralizeType(activeType) : 'All vehicles'}
      </h1>

      <FilterBar />

      {loading && (
        <p className="loading" role="status">
          Loading vehicles…
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

      {!loading && !error && data?.vehicles.length === 0 && (
        <p className="empty-state">No vehicles match your filters.</p>
      )}

      {!loading && !error && data?.vehicles.length > 0 && (
        <>
          <ul className="vehicle-grid">
            {data.vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </ul>

          <nav className="pagination">
            <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Prev
            </button>
            <span className="pagination__status">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </section>
  )
}

export default Vehicles
