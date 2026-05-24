import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        fontSize: '120px',
        fontWeight: '800',
        background: 'linear-gradient(135deg, var(--primary-color), #7c3aed)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: '1',
        marginBottom: '16px'
      }}>
        404
      </div>
      <h1 style={{
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '12px',
        color: 'var(--text-primary)'
      }}>
        页面未找到
      </h1>
      <p style={{
        fontSize: '16px',
        color: 'var(--text-secondary)',
        marginBottom: '32px',
        maxWidth: '400px'
      }}>
        抱歉，您访问的页面不存在或已被移除。请检查网址是否正确，或返回首页继续使用。
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link to="/" className="btn btn-primary btn-lg">
          返回首页
        </Link>
        <button 
          className="btn btn-secondary btn-lg"
          onClick={() => window.history.back()}
        >
          返回上一页
        </button>
      </div>
      <div style={{
        marginTop: '48px',
        fontSize: '60px',
        opacity: '0.3'
      }}>
        🐾
      </div>
    </div>
  )
}
