import { useState, useCallback } from "react"

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (...args: unknown[]) => Promise<T | null>
  reset: () => void
}

export function useApi<T>(
  apiFunction: (...args: unknown[]) => Promise<{ success: boolean; data?: T; error?: string; message?: string }>
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFunction(...args)
      if (result.success && result.data !== undefined) {
        setData(result.data)
        return result.data
      } else {
        throw new Error(result.error || result.message || "Request failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  const reset = useCallback((): void => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}
