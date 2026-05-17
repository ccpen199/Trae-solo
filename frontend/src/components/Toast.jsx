import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useToastStore } from '../store';

function Toast() {
  const toasts = useToastStore(useShallow((state) => state.toasts));

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default Toast;
