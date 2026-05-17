import { AlertCircle } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <AlertCircle size={48} color="#fe2c55" />
      <p className="error-text">{message || '加载失败'}</p>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          点击重试
        </button>
      )}
    </div>
  );
}
