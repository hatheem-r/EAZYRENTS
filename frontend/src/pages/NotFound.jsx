import { Link } from 'react-router-dom'

function NotFound() {
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
