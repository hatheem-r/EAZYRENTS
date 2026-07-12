import React from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { getVehicles, subscribeToVehicles } from '../api/vehicles'

export default function Vehicles() {

    //filters = type(default), location, make, minPrice, maxPrice

    const { type } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()

    const locationFilter = searchParams.get('location') || ''
    const makeFilter = searchParams.get('make') || ''
    const minPriceFilter = searchParams.get('minPrice') || ''
    const maxPriceFilter = searchParams.get('maxPrice') || ''

    const [data, setData] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [retryKey, setRetryKey] = React.useState(0)

    React.useEffect(() => {
        setLoading(true)
        setError(null)

        let cancelled = false

        async function fetchVehicles() {

        await getVehicles({type})
            .then(result => {
                if (cancelled) return
                    setData(result.data)

                if(result.error){
                    throw result.error
                }
            })
            .catch(err => {
                if (cancelled) return
                setError(err)
            })
            .finally(() => {
                if (cancelled) return
                setLoading(false)
            })
        }
        fetchVehicles()

        return () => {
            cancelled = true
        }
    }, [type, retryKey])

    React.useEffect(() => {
        const unsubscribe = subscribeToVehicles(vehicles => {
            const filtered = type
                ? vehicles.filter(vehicle => vehicle.type?.toLowerCase() === type.toLowerCase())
                : vehicles
            setData(filtered)
        })

        return unsubscribe
    }, [type])

    function handleFilterChange(e) {
        const { name, value } = e.target
        const next = new URLSearchParams(searchParams)
        if (value) {
            next.set(name, value)
        } else {
            next.delete(name)
        }
        setSearchParams(next)
    }

    function handleFilterReset() {
        const next = new URLSearchParams(searchParams)
        next.delete('location')
        next.delete('make')
        next.delete('minPrice')
        next.delete('maxPrice')
        setSearchParams(next)
    }

    if (loading) {
        return <div>Loading vehicles...</div>
    }

    if (error) {
        return (
            <div>
                <p>Something went wrong: {error.message}</p>
                <button onClick={() => setRetryKey(key => key + 1)}>Retry</button>
            </div>
        )
    }

    const filteredVehicles = data.filter(vehicle => {
        if (locationFilter && vehicle.location.toLowerCase() !== locationFilter.toLowerCase()) return false
        if (makeFilter && vehicle.make.toLowerCase() !== makeFilter.toLowerCase()) return false
        if (minPriceFilter && vehicle.pricePerDay < Number(minPriceFilter)) return false
        if (maxPriceFilter && vehicle.pricePerDay > Number(maxPriceFilter)) return false
        return true
    })

    return (
        <>
        <Link
                to=".."
                relative="path"
            >&larr; <span>Back to Vehicle Types</span></Link>

        <form onSubmit={e => e.preventDefault()}>
            <label>
                Location
                <input name="location" value={locationFilter} onChange={handleFilterChange} />
            </label>
            <label>
                Make
                <input name="make" value={makeFilter} onChange={handleFilterChange} />
            </label>
            <label>
                Min Price
                <input name="minPrice" type="number" value={minPriceFilter} onChange={handleFilterChange} />
            </label>
            <label>
                Max Price
                <input name="maxPrice" type="number" value={maxPriceFilter} onChange={handleFilterChange} />
            </label>
            <button type="button" onClick={handleFilterReset}>Reset Filters</button>
        </form>

        <div>
            <h2>Our {type ? `: ${type}` : ''}s</h2>

            {filteredVehicles.length === 0 ? (
                <div>No vehicles match</div>
            ) : (
                filteredVehicles.map(vehicle => (
                    <Link
                        to={`/vehicle-types/${type}/${vehicle.id}`}
                        state={{ search: searchParams.toString() }}
                        key={vehicle.id}
                    >
                        <div>
                            <h3>{vehicle.make} {vehicle.model}</h3>
                            <p>Type: {vehicle.type}</p>
                            <p>Location: {vehicle.location}</p>
                            <p>Price per day: ${vehicle.pricePerDay}</p>
                            <p>{vehicle.description}</p>
                            <p>Rating: {vehicle.rating}</p>

                        </div>
                    </Link>
                ))
            )}
        </div>

        </>
    )
}
