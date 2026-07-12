import { get } from './client.js'

export function getHealth() {
  return get('/healthz')
}
