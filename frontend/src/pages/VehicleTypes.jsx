import React from "react"
import { Link } from "react-router-dom"
import { getAllVehicleTypes, subscribeToVehicles } from '../api/vehicles'

export default function VehicleTypes() {

    const [data, setData] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [retryKey, setRetryKey] = React.useState(0)

    React.useEffect(() => {
        setLoading(true)
        setError(null)

        let cancelled = false

        async function fetchVehicleTypes() {

        await getAllVehicleTypes()
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
        fetchVehicleTypes()

        return () => {
            cancelled = true
        }
    }, [retryKey])

    React.useEffect(() => {
        const unsubscribe = subscribeToVehicles(vehicles => {
            setData([...new Set(vehicles.map(vehicle => vehicle.type).filter(Boolean))])
        })

        return unsubscribe
    }, [])

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

    if (data.length === 0) {
        return <div>No vehicles Types</div>
    }

    const vehicleTypesList = data.map(type => (
        <Link to={`/vehicle-types/${type}`} key={type}>
            {type}
        </Link>
    ))

    return (
        <div>
            <h2>Our Vehicles Types</h2>
            {vehicleTypesList}
        </div>
    )
}
