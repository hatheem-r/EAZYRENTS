import { useCallback, useEffect, useState } from 'react'

export function useApi(fetcherFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadIndex, setReloadIndex] = useState(0)

  useEffect(() => {
    let ignore = false

    setLoading(true)
    setError(null)

    fetcherFn()
      .then((result) => {
        if (ignore) return
        setData(result)
        setLoading(false)
      })
      .catch((err) => {
        if (ignore) return
        setError(err)
        setLoading(false)
      })

    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadIndex])

  const refetch = useCallback(() => setReloadIndex((index) => index + 1), [])

  return { data, loading, error, refetch }
}
