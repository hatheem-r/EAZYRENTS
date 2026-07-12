import { useEffect, useState } from 'react'
import { getHealth } from '../api/health.js'

function Home() {
  const [status, setStatus] = useState('checking...')

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

  return (
    <section className="home">
      <h1 className="home__heading">EazyRents</h1>
      <p className="home__tagline">Rent the right vehicle, right when you need it.</p>

      <section className="home__api-status">
        <p>{status}</p>
      </section>
    </section>
  )
}

export default Home
