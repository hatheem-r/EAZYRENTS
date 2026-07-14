import { useState } from 'react'
import { ApiError } from '../../api/client.js'

const VEHICLE_TYPES = ['car', 'van', 'suv', 'bike', 'scooter', 'tuktuk']

const EMPTY_VALUES = {
  type: 'car',
  make: '',
  model: '',
  price_per_day: '',
  city: '',
  description: '',
}

function toFormValues(initialValues) {
  if (!initialValues) return EMPTY_VALUES

  return {
    type: initialValues.type,
    make: initialValues.make,
    model: initialValues.model,
    price_per_day: String(initialValues.price_per_day),
    city: initialValues.city,
    description: initialValues.description ?? '',
  }
}

function validate({ type, make, model, price_per_day, city }) {
  const errors = {}

  if (!VEHICLE_TYPES.includes(type)) errors.type = 'select a vehicle type'
  if (!make.trim()) errors.make = 'make is required'
  if (!model.trim()) errors.model = 'model is required'
  if (!city.trim()) errors.city = 'city is required'

  const price = Number(price_per_day)
  if (price_per_day === '' || Number.isNaN(price) || price <= 0) {
    errors.price_per_day = 'price per day must be greater than 0'
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

function VehicleForm({ initialValues, onSubmit, onCancel }) {
  const isEditMode = Boolean(initialValues)
  const [form, setForm] = useState(() => toFormValues(initialValues))
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
      if (isEditMode) {
        // PATCH sends a partial body: only fields the host actually changed.
        const original = toFormValues(initialValues)
        const changed = {}
        for (const key of Object.keys(EMPTY_VALUES)) {
          if (form[key] !== original[key]) {
            changed[key] = key === 'price_per_day' ? Number(form[key]) : form[key]
          }
        }
        await onSubmit(changed)
      } else {
        await onSubmit({ ...form, price_per_day: Number(form.price_per_day) })
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.details) {
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
    <form className="vehicle-form" onSubmit={handleSubmit}>
      <h2 className="vehicle-form__heading">
        {isEditMode ? 'Edit vehicle' : 'Add a vehicle'}
      </h2>

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="vehicle-form__grid">
      <div className="form-field">
        <label htmlFor="vehicle-form-type">Type</label>
        <select id="vehicle-form-type" name="type" value={form.type} onChange={handleChange}>
          {VEHICLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {fieldErrors.type && (
          <p className="form-error" role="alert">
            {fieldErrors.type}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="vehicle-form-make">Make</label>
        <input
          id="vehicle-form-make"
          name="make"
          type="text"
          value={form.make}
          onChange={handleChange}
        />
        {fieldErrors.make && (
          <p className="form-error" role="alert">
            {fieldErrors.make}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="vehicle-form-model">Model</label>
        <input
          id="vehicle-form-model"
          name="model"
          type="text"
          value={form.model}
          onChange={handleChange}
        />
        {fieldErrors.model && (
          <p className="form-error" role="alert">
            {fieldErrors.model}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="vehicle-form-price">Price per day</label>
        <input
          id="vehicle-form-price"
          name="price_per_day"
          type="number"
          min="0.01"
          step="0.01"
          value={form.price_per_day}
          onChange={handleChange}
        />
        {fieldErrors.price_per_day && (
          <p className="form-error" role="alert">
            {fieldErrors.price_per_day}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="vehicle-form-city">City</label>
        <input
          id="vehicle-form-city"
          name="city"
          type="text"
          value={form.city}
          onChange={handleChange}
        />
        {fieldErrors.city && (
          <p className="form-error" role="alert">
            {fieldErrors.city}
          </p>
        )}
      </div>

      </div>

      <div className="form-field form-field--full">
        <label htmlFor="vehicle-form-description">Description</label>
        <textarea
          id="vehicle-form-description"
          name="description"
          rows="3"
          placeholder="Seats, fuel type, quirks, what trips it's best for…"
          value={form.description}
          onChange={handleChange}
        />
      </div>

      <div className="vehicle-form__actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Add vehicle'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default VehicleForm
