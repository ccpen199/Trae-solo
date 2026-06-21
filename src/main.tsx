import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import ErrorBoundary from '@/components/common/ErrorBoundary'

console.log('main.tsx loaded')

const rootElement = document.getElementById('root')

if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: sans-serif;">错误：找不到 root 元素</div>'
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
    console.log('React app rendered successfully')
  } catch (error) {
    console.error('Failed to render React app:', error)
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; background: #fff5f5;">
        <h2 style="color: #c53030;">页面加载失败</h2>
        <p style="color: #718096;">${error instanceof Error ? error.message : '未知错误'}</p>
        <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #0F3460; color: white; border: none; border-radius: 6px; cursor: pointer;">
          刷新页面
        </button>
      </div>
    `
  }
}
