// Decides where to send the user right after login/register. Callers should
// pass the user returned directly by login()/register() — not user read back
// from AuthContext state right after calling — since context state updates
// asynchronously and may not reflect the new session yet.
export function resolvePostAuthDestination(user, from) {
  const fromPath = typeof from === 'string' ? from : from?.pathname

  if (user.role === 'host') {
    // Only honor `from` for a host if it actually points at a host page —
    // a renter-only page (e.g. the vehicle they were browsing) isn't a
    // valid landing spot for a host account.
    return fromPath?.startsWith('/host') ? from : '/host'
  }

  return from ?? '/'
}
