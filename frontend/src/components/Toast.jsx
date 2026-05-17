import React from 'react';
import { useToastStore } from '../store';

const Toast = () => {
  const { toasts } = useToastStore();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default Toast;
