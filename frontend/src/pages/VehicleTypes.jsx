import React from "react"
import { Link } from "react-router-dom"
import { getAllVehicleTypes} from '../api/vehicles'
import Vehicles from './Vehicles'


const vehicleType = React.createContext()


export default function VehicleTypes() {

    const [data, setData] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [retryKey, setRetryKey] = React.useState(0)

    const [type, setType] = React.useState(null)

    React.useEffect(() => {
            setLoading(true)
            setError(null)
    
            let cancelled = false
    
            getAllVehicleTypes()
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

    if (data.length === 0) {
        return <div>No vehicles Types</div>
    }

    const vehicleTypesList = data.map(type => (
        <Link to={`/vehicle-types/${type}`} key={type}>
            {type}
        </Link>
    ))

    return type ? <Vehicles type={type} /> : (

        <vehicleType.Provider value={type}>


        <div>
            <h2>Our Vehicles Types</h2>
            {vehicleTypesList}
        </div>

        </vehicleType.Provider>
    ) 

}

export {vehicleType}