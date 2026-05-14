import React from 'react';
import { useToastStore } from '../store/useToastStore';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toasts } = useToastStore();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-pulse ${getBg(toast.type)}`}
        >
          {getIcon(toast.type)}
          <span className="text-sm text-gray-700">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
