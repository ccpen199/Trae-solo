import React from 'react';
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react';
import useUIStore from '../store/useUIStore';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

function Toast() {
  const { currentToast } = useUIStore();

  if (!currentToast) return null;

  const Icon = iconMap[currentToast.type] || Info;

  return (
    <div className="toast-container">
      <div className={`toast ${currentToast.type}`}>
        <Icon size={18} />
        <span>{currentToast.message}</span>
      </div>
    </div>
  );
}

export default Toast;
