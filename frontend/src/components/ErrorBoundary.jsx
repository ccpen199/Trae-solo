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
    console.error('ErrorBoundary 捕获错误:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>加载失败</h2>
            <p style={styles.message}>页面遇到了一些问题，请点击重试</p>
            {this.state.error && (
              <p style={styles.errorInfo}>
                {this.state.error.message}
              </p>
            )}
            <button style={styles.button} onClick={this.handleRetry}>
              点击重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  content: {
    textAlign: 'center',
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    maxWidth: '400px'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  message: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px'
  },
  errorInfo: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '20px',
    wordBreak: 'break-word'
  },
  button: {
    padding: '12px 32px',
    backgroundColor: '#ff4757',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer'
  }
};

export default ErrorBoundary;
