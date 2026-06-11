import { Component, type ReactNode } from "react"

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">页面渲染出错</h2>
          <p className="text-sm text-gray-500 mb-4 max-w-md">{this.state.error?.message ?? "未知错误"}</p>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/" }}
            className="px-6 py-2 rounded-xl bg-[#1A56DB] text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            返回首页
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
