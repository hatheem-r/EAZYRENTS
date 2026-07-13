import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getHealth } from '../api/health.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

function Home() {
  const { user } = useAuth()
  const [status, setStatus] = useState('checking...')

  usePageTitle('Home')

  // TODO: remove this temporary API status check once a real dashboard exists
  useEffect(() => {
    let cancelled = false

    getHealth()
      .then((data) => {
        if (!cancelled) setStatus(`API: ${data.status} / db ${data.db}`)
      })
      .catch((err) => {
        if (!cancelled) setStatus(`Here ${err.message}`)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // hosts landing on / are redirected to their dashboard; this is UX, not access control.
  if (user?.role === 'host') {
    return <Navigate to="/host" replace />
  }

  return (
    <section className="home">
      <h1 className="home__heading">EazyRents</h1>
      <p className="home__tagline">Rent the right vehicle, right when you need it.</p>

      <section className="home__api-status">
        <p>{status}</p>
      </section>

      <section className="home-browse">
        <Link to="/vehicles/types">Browse Vehicles</Link>
        {/* <Link to="/register?role=host"> List your vehicle — become a host</Link> */}
      </section>
    </section>
  )
}

export default Home
