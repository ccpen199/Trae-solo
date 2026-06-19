import React, { useState, createContext, useContext, useCallback, ReactNode } from 'react';

interface ToastContextValue {
  show: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { show: (msg) => console.warn('[Toast]', msg) };
  }
  return ctx;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string, duration = 1500) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), duration);
  }, []);

  (window as any).toast = show;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-xl text-sm z-[999] bounce-in">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
};
