import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle.js'
import VehicleArt from '../components/VehicleArt.jsx'

function NotFound() {
  usePageTitle('Page not found')

  return (
    <section className="status-page not-found">
      <div className="status-page__art" aria-hidden="true">
        <VehicleArt type="road" />
      </div>
      <h1 className="status-page__heading not-found__heading">404 — wrong turn</h1>
      <p className="status-page__text">This road doesn't lead anywhere. Let's get you back on the map.</p>
      <Link to="/" className="btn btn--primary not-found__home-link">
        Go home
      </Link>
    </section>
  )
}

export default NotFound
