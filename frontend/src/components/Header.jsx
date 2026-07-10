import React from "react"
import { NavLink } from "react-router-dom"

export default function Header() {
    return (
        <header className="site-header">
            <NavLink to="/" className="logo">EazyRents</NavLink>

            <nav className="nav-links">
                <NavLink
                    to="/vehicle-types"
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                >
                    Vehicle Types
                </NavLink>
                <NavLink
                    to="/about"
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                >
                    About
                </NavLink>
            </nav>

            <button className="login-button">Login</button>
        </header>
    )
}
