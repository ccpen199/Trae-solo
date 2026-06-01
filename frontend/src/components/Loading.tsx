import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin ${sizeClasses[size]}`}></div>
      {text && <p className="mt-3 text-gray-500">{text}</p>}
    </div>
  );
};

export default Loading;
