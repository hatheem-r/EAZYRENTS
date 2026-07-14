import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'
import VehicleArt from '../components/VehicleArt.jsx'

function Home() {
  const { user } = useAuth()

  usePageTitle('Home')

  // hosts landing on / are redirected to their dashboard; this is UX, not access control.
  if (user?.role === 'host') {
    return <Navigate to="/host" replace />
  }

  return (
    <section className="home">
      <div className="home__hero">
        <div className="home__hero-copy">
          <p className="home__kicker">Vehicle rentals made easy</p>
          <h1 className="home__heading">Time to hit the road</h1>
          <p className="home__tagline">
            Rent cars, vans, and scooters from local hosts — by the day, for
            exactly as long as your trip needs.
          </p>

          <div className="home__actions">
            <Link to="/vehicles/types" className="btn btn--primary btn--large">
              Browse vehicles
            </Link>
            <Link to="/register?role=host" className="btn btn--secondary btn--large">
              Become a host
            </Link>
          </div>
        </div>

        <div className="home__hero-art" aria-hidden="true">
          <VehicleArt type="van" className="home__hero-van" />
          <VehicleArt type="road" className="home__hero-road" />
        </div>
      </div>

      <ul className="home__highlights">
        <li className="home__highlight">
          <h2>Book by the day</h2>
          <p>Pick your dates on a live calendar — what you see free is free.</p>
        </li>
        <li className="home__highlight">
          <h2>No double-booking, ever</h2>
          <p>Availability is enforced by the database itself, not by luck.</p>
        </li>
        <li className="home__highlight">
          <h2>Extend when plans change</h2>
          <p>Ask for more days in one tap; your host approves in one more.</p>
        </li>
      </ul>
    </section>
  )
}

export default Home
