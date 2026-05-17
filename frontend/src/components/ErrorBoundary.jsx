import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">加载失败</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            页面出现了一些问题，请点击下方按钮重试。
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 btn-primary"
          >
            <RefreshCw className="w-5 h-5" />
            点击重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary