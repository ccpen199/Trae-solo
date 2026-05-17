import React from 'react'
import { Button, Result } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

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

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: '#fff',
          padding: '20px'
        }}>
          <Result
            status="error"
            title="页面加载失败"
            subTitle={this.state.error?.message || '发生了未知错误，请重试'}
            extra={
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={this.handleReload}
              >
                点击重试
              </Button>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
