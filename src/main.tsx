import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[CIP ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-space-900 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-cine-500/30 to-transparent border border-cine-500/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-cine-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-gradient-gold mb-3">页面渲染异常</h1>
          <p className="text-sm text-slate-400 mb-1">错误信息</p>
          <pre className="max-w-2xl w-full p-4 rounded-xl bg-space-800/80 border border-space-700 text-left text-xs text-cine-400 font-mono overflow-auto">
            {this.state.error?.stack || this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 btn-primary"
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
