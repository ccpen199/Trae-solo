import React from 'react';
import { Button, Result } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          padding: 24
        }}>
          <Result
            status="error"
            title="加载失败"
            subTitle="抱歉，页面发生了错误，请点击重试"
            extra={
              <Button type="primary" onClick={this.handleRetry}>
                点击重试
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
