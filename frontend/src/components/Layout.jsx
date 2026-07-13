import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useApi } from '../hooks/useApi.js'
import { listExtensionRequests } from '../api/host.js'

function navLinkClassName({ isActive }) {
  return isActive ? 'nav-link nav-link--active' : 'nav-link'
}

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // lightweight badge; acceptable duplicate fetch (HostExtensions fetches
  // this same list again) — candidate for a shared context or a count
  // endpoint later.
  const extensionsApi = useApi(
    () => (user?.role === 'host' ? listExtensionRequests() : Promise.resolve({ extensions: [] })),
    [user?.role],
  )
  const pendingExtensionCount = extensionsApi.data?.extensions.length ?? 0

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <Link to="/" className="site-brand">
          EazyRents
        </Link>

        <nav className="site-nav" aria-label="Main">
          {user?.role === 'host' ? (
            <>
              <NavLink to="/host" end className={navLinkClassName}>
                My vehicles
              </NavLink>
              <NavLink to="/host/bookings" className={navLinkClassName}>
                Bookings
              </NavLink>
              <NavLink to="/host/extensions" className={navLinkClassName}>
                Extension requests{pendingExtensionCount > 0 ? ` (${pendingExtensionCount})` : ''}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" end className={navLinkClassName}>
                Home
              </NavLink>
              <NavLink to="/vehicles/types" className={navLinkClassName}>
                Vehicles
              </NavLink>
              {user?.role === 'renter' && (
                <NavLink to="/my-bookings" className={navLinkClassName}>
                  My bookings
                </NavLink>
              )}
            </>
          )}

          {user ? (
            <>
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
              {/* <NavLink to="/register" className={navLinkClassName}>
                Register
              </NavLink> */}
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
