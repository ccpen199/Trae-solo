import { useState } from 'react'

export function LoadingSpinner({ size = 'medium', text = '加载中...' }) {
  const sizes = { small: '16px', medium: '32px', large: '48px' }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{
        width: sizes[size],
        height: sizes[size],
        border: '3px solid #e5e7eb',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '12px'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {text && <span style={{ color: '#666' }}>{text}</span>}
    </div>
  )
}

export function EmptyState({ icon = '📭', title = '暂无数据', description = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <span style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</span>
      <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '8px' }}>{title}</h3>
      {description && <p style={{ color: '#999', fontSize: '14px' }}>{description}</p>}
    </div>
  )
}

export function AsyncStatus({ loading, error, empty, onRetry, children }) {
  if (loading) return <LoadingSpinner />
  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>加载失败</p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{ padding: '8px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            重试
          </button>
        )}
      </div>
    )
  }
  if (empty) return <EmptyState />
  return children
}

export function Button({ children, onClick, disabled, variant = 'primary', size = 'medium', className = '', ...props }) {
  const variants = {
    primary: { background: '#3b82f6', color: '#fff', borderColor: '#3b82f6' },
    secondary: { background: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' },
    danger: { background: '#ef4444', color: '#fff', borderColor: '#ef4444' },
    ghost: { background: 'transparent', color: '#3b82f6', borderColor: 'transparent' }
  }
  const sizes = { small: '8px 16px', medium: '10px 20px', large: '12px 28px' }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: sizes[size],
        fontSize: size === 'small' ? '13px' : '14px',
        background: variants[variant].background,
        color: variants[variant].color,
        border: `1px solid ${variants[variant].borderColor}`,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s',
        ...(className === 'full' ? { width: '100%' } : {})
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', style = {}, ...props }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 14px',
        fontSize: '14px',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        outline: 'none',
        transition: 'border-color 0.2s',
        ...style
      }}
      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      {...props}
    />
  )
}

export function Textarea({ value, onChange, placeholder, rows = 4, style = {}, ...props }) {
  return (
    <textarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '10px 14px',
        fontSize: '14px',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s',
        ...style
      }}
      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      {...props}
    />
  )
}

export function Card({ children, style = {}, ...props }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }} {...props}>
      {children}
    </div>
  )
}

export function Tag({ children, color = '#3b82f6' }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: '12px',
      background: color + '15',
      color: color,
      borderRadius: '4px'
    }}>
      {children}
    </span>
  )
}

export function Avatar({ url, name, size = 40 }) {
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  }
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.4,
      fontWeight: 'bold'
    }}>
      {(name || 'U').slice(0, 1)}
    </div>
  )
}
