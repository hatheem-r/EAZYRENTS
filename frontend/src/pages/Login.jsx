import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { ApiError } from '../api/client.js'

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
      await login(form)
      navigate(location.state?.from ?? '/', { replace: true })
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
    <section className="login">
      <h1 className="login__heading">Login</h1>

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

        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </section>
  )
}

export default Login
