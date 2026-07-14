import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { getVehicleFacets } from '../api/vehicles.js'

function readFiltersFromParams(searchParams) {
  return {
    city: searchParams.get('city') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
  }
}

function FilterBar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState(() => readFiltersFromParams(searchParams))
  const [formError, setFormError] = useState('')
  const { data: facets, loading: facetsLoading, error: facetsError } = useApi(
    () => getVehicleFacets(),
    [],
  )

  // The URL is the source of truth: whenever it changes (Apply, Clear,
  // pagination, or a direct address-bar edit), resync the typing buffer.
  useEffect(() => {
    setForm(readFiltersFromParams(searchParams))
  }, [searchParams])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (
      form.minPrice !== '' &&
      form.maxPrice !== '' &&
      Number(form.minPrice) > Number(form.maxPrice)
    ) {
      setFormError('Min price must not be greater than max price')
      return
    }

    setFormError('')

    // FilterBar preserves params it does not own.
    const nextParams = new URLSearchParams(searchParams)

    if (form.city) nextParams.set('city', form.city)
    else nextParams.delete('city')

    if (form.minPrice !== '') nextParams.set('minPrice', form.minPrice)
    else nextParams.delete('minPrice')

    if (form.maxPrice !== '') nextParams.set('maxPrice', form.maxPrice)
    else nextParams.delete('maxPrice')

    // A filter change always resets pagination back to page 1.
    nextParams.delete('page')

    setSearchParams(nextParams)
  }

  function handleClear() {
    setFormError('')

    // FilterBar preserves params it does not own.
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('city')
    nextParams.delete('minPrice')
    nextParams.delete('maxPrice')
    nextParams.delete('page')

    setSearchParams(nextParams)
  }

  return (
    <form className="filter-bar" onSubmit={handleSubmit}>
      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="form-field">
        <label htmlFor="filter-city">City</label>
        {facetsError ? (
          // Facets failed to load — fall back to a plain text input so
          // filtering by city still works instead of blocking the form.
          <input
            id="filter-city"
            name="city"
            type="text"
            value={form.city}
            onChange={handleChange}
          />
        ) : (
          <select
            id="filter-city"
            name="city"
            className="filter-bar__city"
            value={form.city}
            onChange={handleChange}
            disabled={facetsLoading}
          >
            {facetsLoading ? (
              <option value="">Loading cities…</option>
            ) : (
              <>
                <option value="">All cities</option>
                {facets.cities.map(({ city, count }) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </>
            )}
          </select>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="filter-min-price">Min price</label>
        <input
          id="filter-min-price"
          name="minPrice"
          type="number"
          min="0"
          value={form.minPrice}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label htmlFor="filter-max-price">Max price</label>
        <input
          id="filter-max-price"
          name="maxPrice"
          type="number"
          min="0"
          value={form.maxPrice}
          onChange={handleChange}
        />
      </div>

      <div className="filter-bar__actions">
        <button type="submit" className="btn btn--primary btn--small">
          Apply
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={handleClear}>
          Clear
        </button>
      </div>
    </form>
  )
}

export default FilterBar
