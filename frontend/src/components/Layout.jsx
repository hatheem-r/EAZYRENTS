import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

function navLinkClassName({ isActive }) {
  return isActive ? 'nav-link nav-link--active' : 'nav-link'
}

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <nav className="site-nav">
          <NavLink to="/" end className={navLinkClassName}>
            Home
          </NavLink>
          <NavLink to="/vehicles/types" className={navLinkClassName}>
            Vehicles
          </NavLink>

          {user ? (
            <>
              {user.role === 'renter' && (
                <NavLink to="/my-bookings" className={navLinkClassName}>
                  My bookings
                </NavLink>
              )}
              {user.role === 'host' && (
                <NavLink to="/host" className={navLinkClassName}>
                  Host dashboard
                </NavLink>
              )}
              <span className="user-badge">
                {user.name} ({user.role})
              </span>
              <button type="button" className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClassName}>
                Login
              </NavLink>
              <NavLink to="/register" className={navLinkClassName}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer"></footer>
    </>
  )
}

export default Layout
