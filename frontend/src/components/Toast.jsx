import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
  const showInfo = useCallback((message) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <div style={styles.container}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ ...styles.toast, ...styles[toast.type] }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  toast: {
    padding: '12px 20px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'slideIn 0.3s ease-out'
  },
  success: {
    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
  },
  error: {
    background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)'
  },
  info: {
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
  }
};
