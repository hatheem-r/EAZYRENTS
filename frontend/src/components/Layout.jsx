import { NavLink, Outlet } from 'react-router-dom'

function navLinkClassName({ isActive }) {
  return isActive ? 'nav-link nav-link--active' : 'nav-link'
}

function Layout() {
  return (
    <>
      <header className="site-header">
        <nav className="site-nav">
          <NavLink to="/" end className={navLinkClassName}>
            Home
          </NavLink>
          <NavLink to="/vehicles" className={navLinkClassName}>
            Vehicles
          </NavLink>
          <NavLink to="/login" className={navLinkClassName}>
            Login
          </NavLink>
          <NavLink to="/register" className={navLinkClassName}>
            Register
          </NavLink>
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
