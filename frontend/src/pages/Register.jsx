import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { ApiError } from '../api/client.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ name, email, password }) {
  const errors = {}

  if (!name.trim()) {
    errors.name = 'name is required'
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'enter a valid email address'
  }

  if (password.length < 8) {
    errors.password = 'password must be at least 8 characters'
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

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'renter' })
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
      await register(form)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({ email: 'email already registered' })
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
    <section className="register">
      <h1 className="register__heading">Register</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="form-field">
          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
          />
          {fieldErrors.name && (
            <p className="form-error" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
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
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {fieldErrors.password && (
            <p className="form-error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <fieldset className="form-field">
          <legend>Role</legend>

          <label htmlFor="register-role-renter">
            <input
              id="register-role-renter"
              name="role"
              type="radio"
              value="renter"
              checked={form.role === 'renter'}
              onChange={handleChange}
            />
            Renter
          </label>

          <label htmlFor="register-role-host">
            <input
              id="register-role-host"
              name="role"
              type="radio"
              value="host"
              checked={form.role === 'host'}
              onChange={handleChange}
            />
            Host
          </label>
        </fieldset>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div>Already have an account?
        <a href="/login"> Log in here</a>
      </div>
    
  

    </section>
  )
}

export default Register
