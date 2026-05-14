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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">页面加载失败</h2>
          <p className="text-gray-500 text-center mb-6">
            {this.state.error?.message || '发生了未知错误'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
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
