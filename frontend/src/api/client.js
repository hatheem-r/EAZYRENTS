const TOKEN_KEY = 'eazyrents_token'
const API_BASE_URL = import.meta.env.VITE_API_URL

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor({ status, message, details }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function parseJsonSafely(response) {
  if (response.status === 204) return null

  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function apiFetch(path, { method = 'GET', body, headers, idempotencyKey } = {}) {
  const requestHeaders = { ...headers }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  const token = getToken()
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  if (idempotencyKey) {
    requestHeaders['Idempotency-Key'] = idempotencyKey
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await parseJsonSafely(response)

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }

    throw new ApiError({
      status: response.status,
      message: data?.error?.message ?? 'Something went wrong. Please try again.',
      details: data?.error?.details,
    })
  }

  return data
}

export function get(path, opts) {
  return apiFetch(path, { ...opts, method: 'GET' })
}

export function post(path, body, opts) {
  return apiFetch(path, { ...opts, method: 'POST', body })
}

export function patch(path, body, opts) {
  return apiFetch(path, { ...opts, method: 'PATCH', body })
}

export function del(path, opts) {
  return apiFetch(path, { ...opts, method: 'DELETE' })
}
