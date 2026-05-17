import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  const bgColors = {
    success: 'rgba(34, 197, 94, 0.9)',
    error: 'rgba(239, 68, 68, 0.9)',
    info: 'rgba(107, 114, 128, 0.9)'
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '12px 24px',
              background: bgColors[toast.type] || bgColors.info,
              color: '#fff',
              borderRadius: '8px',
              marginBottom: '10px',
              fontSize: '14px',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: (msg) => console.log('Toast:', msg) };
  }
  return context;
};
