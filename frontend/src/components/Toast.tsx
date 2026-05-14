import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useStore();
  
  if (!toast || !toast.show) {
    return null;
  }
  
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };
  
  const bgColors = {
    success: 'bg-green-900/90 border-green-500',
    error: 'bg-red-900/90 border-red-500',
    info: 'bg-blue-900/90 border-blue-500',
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-float">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md ${bgColors[toast.type]}`}
      >
        {icons[toast.type]}
        <span className="text-white font-medium">{toast.message}</span>
        <button
          onClick={hideToast}
          className="ml-2 text-white/60 hover:text-white transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
