import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SimpleCamera = () => {
  const navigate = useNavigate();
  const [captured, setCaptured] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-black">
      <div className="flex-1 flex items-center justify-center">
        {captured ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-white text-lg">照片已拍摄</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-white text-lg">相机预览</p>
            <p className="text-gray-400 text-sm mt-2">点击下方按钮拍摄</p>
          </div>
        )}
      </div>

      <div className="bg-black/90 py-8 px-6">
        <div className="flex justify-around items-center">
          <button
            onClick={() => navigate('/login')}
            className="flex flex-col items-center text-white"
          >
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl">
              👤
            </div>
            <span className="text-xs mt-1">登录</span>
          </button>

          <button
            onClick={() => setCaptured(!captured)}
            className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="flex flex-col items-center text-white"
          >
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl">
              🎨
            </div>
            <span className="text-xs mt-1">滤镜</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCamera;
