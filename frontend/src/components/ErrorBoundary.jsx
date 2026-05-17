import React, { Component } from 'react';

class ErrorBoundary extends Component {
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
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <h1 style={styles.title}>😔 加载失败</h1>
            <p style={styles.description}>应用遇到了一些问题，请点击下方按钮重试</p>
            <button style={styles.button} onClick={this.handleRetry}>
              重试
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  content: {
    textAlign: 'center',
    color: 'white'
  },
  title: {
    fontSize: '28px',
    marginBottom: '16px'
  },
  description: {
    fontSize: '16px',
    marginBottom: '24px',
    opacity: 0.9
  },
  button: {
    padding: '12px 32px',
    fontSize: '16px',
    borderRadius: '25px',
    border: 'none',
    background: 'white',
    color: '#667eea',
    cursor: 'pointer',
    fontWeight: 600
  }
};

export default ErrorBoundary;
