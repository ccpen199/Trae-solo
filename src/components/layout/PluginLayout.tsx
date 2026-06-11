import React from 'react';
import { Outlet } from 'react-router-dom';

const PluginLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 border-b border-ink-100 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
            文
          </div>
          <div>
            <h1 className="font-bold text-ink-800 text-sm">文旅数据服务</h1>
            <p className="text-xs text-ink-500">政务系统插件</p>
          </div>
        </div>
      </div>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default PluginLayout;
