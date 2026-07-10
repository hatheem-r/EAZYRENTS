import React from "react"
import { useParams } from "react-router-dom"

export default function VehicleTypes() {
    const params = useParams()
    const [vehicleTypes, setVehicleTypes] = React.useState([])

    React.useEffect(() => {
        fetch(`/api/vehicles/type/${params.types}`)
            .then(res => res.json())
            .then(data => setVehicleTypes(data.vehicleTypes))
    }, [params.types])

    if (vehicleTypes.length === 0) {
        return <div>Loading {params.types}...</div>
    }

    return (
        <div>
            <h1>Vehicle Types</h1>
            <p>Vehicle Type: {params.types}</p>
        </div>
    )
}