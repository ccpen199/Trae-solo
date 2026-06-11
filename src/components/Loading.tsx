import React from 'react';
import { SpinLoading } from 'antd-mobile';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ text = '加载中...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 z-50">
        <SpinLoading color="#1E40AF" style={{ '--size': '48px' } as React.CSSProperties} />
        {text && <p className="mt-4 text-gray-500 text-sm">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <SpinLoading color="#1E40AF" style={{ '--size': '32px' } as React.CSSProperties} />
      {text && <p className="mt-3 text-gray-500 text-sm">{text}</p>}
    </div>
  );
};

export default Loading;
