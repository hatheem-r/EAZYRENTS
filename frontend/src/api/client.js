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

async function handleResponse(response) {
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

  return handleResponse(response)
}

export async function uploadFiles(path, formData) {
  const requestHeaders = {}

  // The browser must set the multipart boundary itself when sending
  // FormData — setting Content-Type manually here is the classic multipart
  // bug (it strips the boundary and the server can no longer parse the body).
  const token = getToken()
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: requestHeaders,
    body: formData,
  })

  return handleResponse(response)
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
