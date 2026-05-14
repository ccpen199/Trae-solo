import React, { useEffect } from 'react';
import { useToastStore } from '../store/auth';

function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast"
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </>
  );
}

export default Toast;
