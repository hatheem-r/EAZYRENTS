import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useApi } from '../hooks/useApi.js'
import { listExtensionRequests } from '../api/host.js'
import ChatWidget from './ChatWidget.jsx'

function navLinkClassName({ isActive }) {
  return isActive ? 'nav-link nav-link--active' : 'nav-link'
}

function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // lightweight badge; acceptable duplicate fetch (HostExtensions fetches
  // this same list again) — candidate for a shared context or a count
  // endpoint later.
  const extensionsApi = useApi(
    () => (user?.role === 'host' ? listExtensionRequests() : Promise.resolve({ extensions: [] })),
    [user?.role],
  )
  const pendingExtensionCount = extensionsApi.data?.extensions.length ?? 0

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  // Any tap on a link/button inside the menu closes it (mobile dropdown UX).
  function handleNavClick(event) {
    if (event.target.closest('a, button')) setMenuOpen(false)
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="site-brand">
            Eazy<span className="site-brand__accent">Rents</span>
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{menuOpen ? '\u2715' : '\u2630'}</span>
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          </button>

          <nav
            id="site-nav"
            className={menuOpen ? 'site-nav site-nav--open' : 'site-nav'}
            aria-label="Main"
            onClick={handleNavClick}
          >
            {user?.role === 'host' ? (
              <>
                <NavLink to="/host" end className={navLinkClassName}>
                  My vehicles
                </NavLink>
                <NavLink to="/host/bookings" className={navLinkClassName}>
                  Bookings
                </NavLink>
                <NavLink to="/host/extensions" className={navLinkClassName}>
                  Extension requests
                  {pendingExtensionCount > 0 && (
                    <span className="nav-badge">{pendingExtensionCount}</span>
                  )}
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
              <span className="site-nav__auth">
                <span className="user-badge">
                  {user.name} <span className="user-badge__role">{user.role}</span>
                </span>
                <button type="button" className="btn btn--ghost btn--small logout-button" onClick={handleLogout}>
                  Log out
                </button>
              </span>
            ) : (
              <span className="site-nav__auth">
                <NavLink to="/login" className={navLinkClassName}>
                  Log in
                </NavLink>
                <Link to="/register" className="btn btn--primary btn--small">
                  Sign up
                </Link>
              </span>
            )}
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="site-footer__brand">EazyRents</p>
          <p className="site-footer__tagline">
            Local vehicles, honest hosts, and dates that never double-book.
          </p>
          <p className="site-footer__meta">Built on PostgreSQL exclusion constraints — one vehicle, one booking, guaranteed.</p>
        </div>
      </footer>

      <ChatWidget />
    </>
  )
}

export default Layout
