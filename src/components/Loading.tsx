import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullscreen?: boolean;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const Loading: React.FC<LoadingProps> = ({ size = 'md', text, fullscreen = false }) => {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${fullscreen ? 'min-h-screen' : 'py-8'}`}>
      <Loader2 className={`${sizeMap[size]} text-primary-500 animate-spin`} />
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  );

  if (fullscreen) {
    return <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">{content}</div>;
  }

  return content;
};

export default Loading;
