import React from 'react'

export default function Vehicles() {
    const [vehicles, setVehicles] = React.useState([])

    React.useEffect(() => {
        fetch("/api/vehicles")
            .then(res => res.json())
            .then(data => setVehicles(data.vehicles))
    }, [])

    if (!vehicles) {
        return <div>Loading...</div>
    }

    return(

        <div>
            <h2>Our Vehicles</h2>
        </div>

    )
}