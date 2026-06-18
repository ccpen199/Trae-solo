import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  hasError: boolean
  error: Error | null
  resetKey: number
}

interface Props {
  children: ReactNode
  onReset?: () => void
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode
}

export default class ApiErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, resetKey: 0 }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, resetKey: 0 }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ApiErrorBoundary:', error, info)
  }

  reset = () => {
    this.props.onReset?.()
    this.setState((prev) => ({ hasError: false, error: null, resetKey: prev.resetKey + 1 }))
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.reset })
      }
      return (
        <div className="rounded-xl border border-shujin-600/30 bg-wudu-900 p-8 text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-shujin-600/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-shujin-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 0h.008v.008H12V12zm0 5.25h.008v.008H12V17.25zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="font-serif text-lg text-white mb-1">数据加载失败</div>
          <div className="text-xs text-wudu-400 mb-4 break-words max-w-md mx-auto">{this.state.error.message}</div>
          <button
            onClick={this.reset}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-jinguan-400 text-wudu-900 hover:bg-jinguan-400/90 transition-colors"
          >
            重试加载
          </button>
        </div>
      )
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>
  }
}
