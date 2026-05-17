import React from 'react';

const Loading = ({ fullScreen = true }) => {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="loading-spinner"></div>
      <p className="mt-4 text-gray-600">加载中...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return <div className="py-8">{content}</div>;
};

export default Loading;
