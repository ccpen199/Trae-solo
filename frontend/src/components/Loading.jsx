import React from 'react';
import { Loader } from 'lucide-react';

function Loading({ text = '加载中...', size = 'large' }) {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 40,
  };

  return (
    <div className="loading-state">
      <Loader size={sizeMap[size]} className="loading-spinner" />
      {text && <p style={{ color: 'rgba(255,255,255,0.7)' }}>{text}</p>}
    </div>
  );
}

export default Loading;
