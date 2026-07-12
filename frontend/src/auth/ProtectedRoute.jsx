import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

function ProtectedRoute({ role }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const allowedRoles = Array.isArray(role) ? role : role ? [role] : null

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <section className="forbidden">
        <h1 className="forbidden__heading">403 — Not allowed</h1>
        <Link to="/" className="forbidden__home-link">
          Go home
        </Link>
      </section>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
