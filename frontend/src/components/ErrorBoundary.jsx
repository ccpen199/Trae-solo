import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('页面出错:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          color: '#fff',
          padding: '20px'
        }}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>😵</div>
          <h2 style={{ marginBottom: '10px' }}>加载失败</h2>
          <p style={{ color: '#999', marginBottom: '20px', textAlign: 'center' }}>
            {this.state.error?.message || '页面遇到了一些问题'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '12px 32px',
              background: '#fe2c55',
              border: 'none',
              borderRadius: '25px',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            点击重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
