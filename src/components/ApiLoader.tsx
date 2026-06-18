import { useState, useEffect, useCallback, ReactNode } from 'react'
import ApiErrorBoundary from '@/components/ApiErrorBoundary'

interface LoaderProps<T> {
  fetchFn: () => Promise<T>
  deps?: unknown[]
  children: (data: T, refresh: () => Promise<void>) => ReactNode
  skeleton?: ReactNode
}

export function withApiErrorBoundary<P>(
  Wrapped: React.ComponentType<P>,
): React.ComponentType<P> {
  return function WrappedBoundary(props: P) {
    return (
      <ApiErrorBoundary>
        <Wrapped {...props} />
      </ApiErrorBoundary>
    )
  }
}

export function ApiLoader<T>({ fetchFn, deps = [], children, skeleton }: LoaderProps<T>) {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: Error | null
    attempt: number
  }>({ data: null, loading: true, error: null, attempt: 0 })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const d = await fetchFn()
      setState((s) => ({ data: d, loading: false, error: null, attempt: s.attempt + 1 }))
    } catch (err) {
      setState((s) => ({ data: null, loading: false, error: err instanceof Error ? err : new Error(String(err)), attempt: s.attempt + 1 }))
    }
  }, [fetchFn])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  if (state.error) {
    return (
      <div className="rounded-xl border border-shujin-600/30 bg-wudu-900 p-6 text-center">
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-shujin-600/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-shujin-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div className="font-serif text-lg text-white mb-1">数据加载失败</div>
        <div className="text-xs text-wudu-400 mb-4 break-words max-w-md mx-auto">{state.error.message}</div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-jinguan-400 text-wudu-900 hover:bg-jinguan-400/90 transition-colors"
        >
          重试加载
        </button>
      </div>
    )
  }

  if (state.loading || state.data == null) {
    return (
      <>
        {skeleton ?? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-jinguan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </>
    )
  }

  return <>{children(state.data, load)}</>
}
