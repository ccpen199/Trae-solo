import React from 'react';
import { useAuthStore } from '../store/auth.js';

const Watermark = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  const items = Array.from({ length: 30 }, (_, i) => `${user.real_name || user.username} - ${new Date().toLocaleDateString()} - 仅供配送平台内部使用`);

  return (
    <div className="watermark">
      {items.map((text, i) => (
        <div key={i} className="watermark-item">{text}</div>
      ))}
    </div>
  );
};

export default Watermark;
