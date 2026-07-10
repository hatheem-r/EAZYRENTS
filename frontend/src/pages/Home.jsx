import React from "react"
import { Link } from "react-router-dom"

export default function Home() {
    return (
        <>
        <div>
            <h2>Welcome to EazyRents</h2>
            <h1>You got the travel plans, we got the Vehicles</h1>
        </div>
        <Link to="/vehicle-types">View Vehicles</Link>
        </>
    )
};