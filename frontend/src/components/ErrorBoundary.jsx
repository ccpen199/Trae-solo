import { useState } from 'react'

export function AppErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)

  const handleReset = () => {
    setHasError(false)
    setError(null)
  }

  if (hasError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#f5f6fa'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>加载失败</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>{error?.message || '页面出现了问题'}</p>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 32px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            点击重试
          </button>
        </div>
      </div>
    )
  }

  return children
}

export function ErrorBoundary({ children, onReset }) {
  const [hasError, setHasError] = useState(false)

  const handleReset = () => {
    setHasError(false)
    onReset?.()
  }

  if (hasError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#666', marginBottom: '16px' }}>加载失败</p>
        <button
          onClick={handleReset}
          style={{
            padding: '8px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          重试
        </button>
      </div>
    )
  }

  return children
}
