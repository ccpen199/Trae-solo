import { useState, useEffect, createContext, useContext } from 'react'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.container}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              ...styles.toast,
              ...(toast.type === 'success' ? styles.success : {}),
              ...(toast.type === 'error' ? styles.error : {})
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  toast: {
    padding: '12px 24px',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    animation: 'fadeIn 0.3s ease'
  },
  success: {
    backgroundColor: 'rgba(52, 199, 89, 0.9)'
  },
  error: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)'
  }
}
