import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ marginBottom: '8px' }}>页面加载失败</h2>
          <p style={{ color: '#999', marginBottom: '24px' }}>
            抱歉，页面发生了错误，请稍后重试
          </p>
          <button
            className="btn"
            onClick={this.handleRetry}
          >
            重新加载
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
