import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-icon">⚠️</div>
          <div className="error-boundary-title">加载失败</div>
          <div className="error-boundary-text">
            {this.state.error?.message || '遇到了意外错误'}
          </div>
          <button className="retry-btn" onClick={this.handleRetry}>
            点击重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
