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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <h1 style={styles.title}>😴 加载失败</h1>
            <p style={styles.message}>页面出现了一些问题，点击按钮重试</p>
            <button 
              style={styles.button}
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
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
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: 20,
  },
  content: {
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 24,
  },
  button: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    border: 'none',
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
    cursor: 'pointer',
  },
};

export default ErrorBoundary;
