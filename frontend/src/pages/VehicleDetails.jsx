import React from "react"
import { useParams } from "react-router-dom"

export default function VehicleDetails() {
    const params = useParams()

    const [vehicle, setVehicle] = React.useState(null)

    React.useEffect(() => {
        fetch(`/api/vehicles/${params.id}`)
            .then(res => res.json())
            .then(data => setVehicle(data.vehicle))
    }, [params.id])

    if (!vehicle) {
        return <div>Loading {params.id}...</div>
    }

    return (
        <div>
            <h1>Vehicle Details</h1>
            <p>Vehicle ID: {params.id}</p>
        </div>
    )
}