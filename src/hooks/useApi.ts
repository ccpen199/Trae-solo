import { useState, useCallback } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const request = useCallback(async (url: string, options?: RequestInit) => {
    setState({ data: null, loading: true, error: null })
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      })
      if (!response.ok) throw new Error(`请求失败: ${response.status}`)
      const data = await response.json()
      setState({ data, loading: false, error: null })
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误'
      setState((prev) => ({ ...prev, loading: false, error: message }))
      throw err
    }
  }, [])

  return { ...state, request }
}
