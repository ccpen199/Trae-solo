import React from 'react';
import { Search, FileText, MessageSquare, Users } from 'lucide-react';

export function EmptyState({ title, description, icon, action, customIcon }) {
  const icons = {
    search: <Search className="w-12 h-12 text-gray-300" />,
    article: <FileText className="w-12 h-12 text-gray-300" />,
    question: <MessageSquare className="w-12 h-12 text-gray-300" />,
    user: <Users className="w-12 h-12 text-gray-300" />
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-4">{customIcon || icons[icon] || icons.search}</div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title || '暂无数据'}</h3>
      {description && (
        <p className="text-gray-500 text-sm text-center max-w-xs mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-4xl mb-4">😕</div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">加载失败</h3>
      <p className="text-gray-500 text-sm mb-6">{message || '请稍后重试'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重新加载
        </button>
      )}
    </div>
  );
}

export default EmptyState;
