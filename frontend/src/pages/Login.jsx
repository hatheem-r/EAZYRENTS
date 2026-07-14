import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { ApiError } from '../api/client.js'
import { resolvePostAuthDestination } from '../lib/authRedirect.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import VehicleArt from '../components/VehicleArt.jsx'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ email, password }) {
  const errors = {}

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'enter a valid email address'
  }

  if (!password) {
    errors.password = 'password is required'
  }

  return errors
}

function mapValidationDetails(details) {
  const fieldErrors = details?.fieldErrors ?? {}
  const mapped = {}

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.length) {
      mapped[field] = messages[0]
    }
  }

  return mapped
}

function Login() {
  const { login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  usePageTitle('Log in')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const errors = validate(form)
    setFieldErrors(errors)
    setFormError('')

    if (Object.keys(errors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      // login() returns the freshly-authenticated user directly — use that
      // for the redirect decision rather than reading useAuth() state here,
      // which may not have updated yet.
      const loggedInUser = await login(form)
      navigate(resolvePostAuthDestination(loggedInUser, location.state?.from), { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError('Invalid email or password')
      } else if (err instanceof ApiError && err.status === 400 && err.details) {
        const mapped = mapValidationDetails(err.details)
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped)
        } else {
          setFormError(err.message)
        }
      } else if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page login">
      <div className="auth-card">
        <div className="auth-card__art" aria-hidden="true">
          <VehicleArt type="scooter" />
          <VehicleArt type="road" className="auth-card__road" />
          <p className="auth-card__art-line">Pick it up where you left off.</p>
        </div>

        <div className="auth-card__body">
          <h1 className="auth-heading login__heading">Welcome back</h1>
          <p className="auth-subheading">Log in to book, extend, or check on your trips.</p>

          {sessionExpired && (
            <p className="form-info" role="status">
              Your session expired, please log in again.
            </p>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}

            <div className="form-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="form-error" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              {fieldErrors.password && (
                <p className="form-error" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="auth-switch">
            New to EazyRents? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Login
