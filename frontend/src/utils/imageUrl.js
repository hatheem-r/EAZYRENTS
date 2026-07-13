// relative urls come from local storage; absolute urls (future S3) pass through.
export function photoUrl(path) {
  return path?.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}${path}`
}
