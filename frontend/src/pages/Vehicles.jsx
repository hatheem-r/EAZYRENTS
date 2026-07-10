import React from 'react'
import { useSearchParams, useParams, Outlet, Link } from 'react-router-dom'
import { getVehicles } from '../api/vehicles'
import { vehicleType } from './VehicleTypes'

export default function Vehicles() {

    //filters = type(default), location, make, minPrice, maxPrice

    // const [searchParams] = useSearchParams()
    // const type = searchParams.get('type')

    const { type } = useParams()

    // const type = props.type || null

    const [data, setData] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [retryKey, setRetryKey] = React.useState(0)

    React.useEffect(() => {
        setLoading(true)
        setError(null)

        let cancelled = false

        getVehicles({type})
            .then(result => {
                if (cancelled) return
                setData(result)
            })
            .catch(err => {
                if (cancelled) return
                setError(err)
            })
            .finally(() => {
                if (cancelled) return
                setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [retryKey])

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

    const filteredVehicles = data.map(vehicle => (
                    <Link to={`/vehicle-types/${type}/${vehicle.id}`} key={vehicle.id}>
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
                    

    if (data.length === 0) {
        return <div>No vehicles match</div>
    }

    return (
        <>
        <Link
                to=".."
                relative="path"
            >&larr; <span>Back to Vehicle Types</span></Link>
        <div>
            <h2>Our {type ? `: ${type}` : ''}s</h2>
            
                    {filteredVehicles}
            
        </div>
        
        </>
    )
}
