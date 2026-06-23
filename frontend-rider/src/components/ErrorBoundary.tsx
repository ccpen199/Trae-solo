import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    try {
      window.location.href = '/';
    } catch {}
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
          <div className="max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WarningOutlined className="text-red-500 text-2xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">页面出错了</h2>
            <p className="text-sm text-gray-500 mb-2">
              {this.state.error?.message || '发生了一个未知错误'}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              请尝试刷新页面重新进入骑手工作台
            </p>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={this.handleReset}
              size="large"
              block
            >
              重新进入骑手工作台
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
