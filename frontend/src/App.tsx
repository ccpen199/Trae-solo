import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import { webSocketService } from './services/webSocketService';
import BusinessNodeList from './components/BusinessNodeList';
import AlertPanel from './components/AlertPanel';
import ControlPanel from './components/ControlPanel';

const App: React.FC = () => {
  const isConnected = useAppStore((state) => state.isConnected);
  const alerts = useAppStore((state) => state.alerts);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'control'>('dashboard');

  const activeAlerts = alerts.filter(a => a.status === 'active');

  useEffect(() => {
    webSocketService.connect();

    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">水产养殖智能监控系统</h1>
                <p className="text-sm text-blue-200">智能溶氧分析 · 动力切换 · 精准投喂</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span className="text-sm">{isConnected ? '已连接' : '未连接'}</span>
              </div>
              
              {activeAlerts.length > 0 && (
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="text-sm font-medium">{activeAlerts.length}</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex gap-1">
              {[
                { id: 'dashboard', label: '业务节点', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
                { id: 'alerts', label: '预警中心', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                { id: 'control', label: '控制中心', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-white text-blue-700' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">核心驱动模块</p>
                    <p className="text-2xl font-bold text-gray-800">3</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">溶氧分析 · 动力切换 · 投喂决策</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">业务节点</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {useAppStore.getState().businessNodes.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">每个节点都有源、责任人、状态和动作</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">未确认预警</p>
                    <p className={`text-2xl font-bold ${activeAlerts.length > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      {activeAlerts.length}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    activeAlerts.length > 0 ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-6 h-6 ${activeAlerts.length > 0 ? 'text-red-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">橙色预警+红色紧急预警</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">电源状态</p>
                    <p className={`text-2xl font-bold ${
                      useAppStore.getState().powerStatus.isPowered ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {useAppStore.getState().powerStatus.isPowered ? '正常' : '应急'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    useAppStore.getState().powerStatus.isPowered ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      useAppStore.getState().powerStatus.isPowered ? 'text-green-600' : 'text-yellow-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  备用电源: {useAppStore.getState().powerStatus.backupPowerStatus}
                </p>
              </div>
            </div>

            <BusinessNodeList />
          </div>
        )}

        {activeTab === 'alerts' && (
          <AlertPanel />
        )}

        {activeTab === 'control' && (
          <ControlPanel />
        )}
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <p>水产养殖智能监控系统 v1.0</p>
              <p className="text-xs mt-1">
                核心驱动: 溶氧趋势分析引擎 · 备用动力智能切换算法 · 精准投喂决策模型
              </p>
            </div>
            <div className="text-right">
              <p>当前时间: {new Date().toLocaleString('zh-CN')}</p>
              <p className="text-xs mt-1">
                闭环逻辑: 传感器预警 · 智能增氧 · 应急处理 · 精准投喂
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
