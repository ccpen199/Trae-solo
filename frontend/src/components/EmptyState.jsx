import { Film } from 'lucide-react';

export default function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <Film size={48} color="#666" />
      <p className="empty-text">{message || '暂无数据'}</p>
    </div>
  );
}
