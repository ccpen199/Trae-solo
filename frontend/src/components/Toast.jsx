import React, { useState, useEffect, useCallback } from 'react';

const ToastContext = React.createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    window.__ME_TAO_TOAST_HANDLER__ = showToast;
    return () => {
      window.__ME_TAO_TOAST_HANDLER__ = undefined;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.container}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            style={{
              ...styles.toast,
              ...styles[toast.type]
            }}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    return { showToast: (msg, type) => console.log(`[${type || 'info'}]: ${msg}`) };
  }
  return context;
};

const styles = {
  container: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 9999,
    pointerEvents: 'none'
  },
  toast: {
    padding: '12px 24px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    marginBottom: '8px',
    textAlign: 'center',
    pointerEvents: 'auto',
    animation: 'fadeIn 0.3s ease'
  },
  info: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  },
  success: {
    backgroundColor: 'rgba(46, 204, 113, 0.95)'
  },
  error: {
    backgroundColor: 'rgba(255, 71, 87, 0.95)'
  },
  warning: {
    backgroundColor: 'rgba(241, 196, 15, 0.95)',
    color: '#333'
  }
};

export default ToastProvider;
