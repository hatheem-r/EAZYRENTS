import React from "react"
import { useParams, useLocation, Link } from "react-router-dom"
import { getVehicle, subscribeToVehicles } from "../api/vehicles"


export default function VehicleDetails() {
    const params = useParams()
    const location = useLocation()

    const [data, setData] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [retryKey, setRetryKey] = React.useState(0)

    React.useEffect( () => {
        setLoading(true)
        setError(null)

        let cancelled = false

        async function fetchVehicle() {

        await getVehicle(params.id)
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
        fetchVehicle()

        return () => {
            cancelled = true
        }
    }, [params.id, retryKey])

    React.useEffect(() => {
        const unsubscribe = subscribeToVehicles(vehicles => {
            const vehicle = vehicles.find(v => String(v.id) === String(params.id)) || null
            setData(vehicle)
        })

        return unsubscribe
    }, [params.id])

    if (loading) {
        return <div>Loading vehicle {params.id}...</div>
    }

    if (error) {
        return (
            <div>
                <p>Something went wrong: {error.message}</p>
                <button onClick={() => setRetryKey(key => key + 1)}>Retry</button>
            </div>
        )
    }

    return (
        <>
        <Link
                to={{ pathname: "..", search: location.state?.search || "" }}
                relative="path"
            >&larr; <span>Back to All {data.type}s</span></Link>
        <div>
            <div>
                {data.photos ? (
                    <img src={data.photos} alt={`${data.make} ${data.model}`} />
                ) : "No photos available"}
            </div>
            <h1>{data.make} {data.model}</h1>
            <p>Type: {data.type}</p>
            <p>Location: {data.location}</p>
            <p>${data.pricePerDay}/day</p>
            <p>{data.description}</p>
        </div>
        </>
    )
}
