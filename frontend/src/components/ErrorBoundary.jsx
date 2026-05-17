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
    console.error('页面错误:', error, errorInfo);
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
            <h1 style={styles.title}>页面加载失败</h1>
            <p style={styles.message}>抱歉，页面出现了一些问题，请稍后重试</p>
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  content: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '12px'
  },
  message: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px'
  },
  button: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500'
  }
};

export default ErrorBoundary;
