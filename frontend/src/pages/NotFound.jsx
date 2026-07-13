import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle.js'

function NotFound() {
  usePageTitle('Page not found')

  return (
    <section className="not-found">
      <h1 className="not-found__heading">404</h1>
      <Link to="/" className="not-found__home-link">
        Go home
      </Link>
    </section>
  )
}

export default NotFound
