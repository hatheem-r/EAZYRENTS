import { post } from './client.js'

export function registerUser(data) {
  return post('/auth/register', data)
}

export function loginUser(credentials) {
  return post('/auth/login', credentials)
}
