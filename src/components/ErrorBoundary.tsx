import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              页面加载出现问题
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {this.state.error?.message ||
                "发生了未知错误，请刷新页面重试。"}
            </p>
            {this.state.error && (
              <div className="mb-6 p-3 bg-slate-50 rounded-lg text-left">
                <pre className="text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap break-all">
                  {this.state.error.stack?.slice(0, 300)}
                </pre>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                返回工作台
              </Link>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重新加载
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
