import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-cream p-6">
          <div className="text-center card max-w-md">
            <div className="text-6xl mb-4">😅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">加载失败</h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || '页面遇到了一些问题'}
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                this.setState({ hasError: false });
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

export default ErrorBoundary;
