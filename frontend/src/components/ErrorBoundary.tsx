import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Result, Button } from 'antd'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary 捕获到错误:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 24,
          background: '#f5f5f5'
        }}>
          <Result
            status="error"
            title="页面加载出错"
            subTitle={this.state.error?.message || '发生了未知错误'}
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                重新加载
              </Button>,
              <Button key="home" onClick={this.handleGoHome}>
                返回首页
              </Button>,
            ]}
          />
          {this.state.errorInfo && (
            <div style={{ 
              maxWidth: 800, 
              width: '100%', 
              marginTop: 24,
              padding: 16,
              background: 'white',
              borderRadius: 8,
              overflow: 'auto'
            }}>
              <details style={{ whiteSpace: 'pre-wrap' }}>
                <summary>错误详情（点击展开）</summary>
                <p style={{ color: '#666' }}>
                  {this.state.error?.toString()}
                </p>
                <p style={{ color: '#999', fontSize: 12 }}>
                  {this.state.errorInfo.componentStack}
                </p>
              </details>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
