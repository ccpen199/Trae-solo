import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import { webSocketService } from './services/webSocketService';
import BusinessNodeList from './components/BusinessNodeList';
import AlertPanel from './components/AlertPanel';
import ControlPanel from './components/ControlPanel';
import { LayoutDashboard, Bell, Settings, Fish, Waves, Activity, Zap, Wifi, WifiOff } from 'lucide-react';

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

  const tabs = [
    { id: 'dashboard' as const, label: '业务节点', icon: LayoutDashboard },
    { id: 'alerts' as const, label: '预警中心', icon: Bell },
    { id: 'control' as const, label: '控制中心', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-primary-700 via-primary-600 to-aqua-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Fish className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-aqua-400 rounded-full flex items-center justify-center">
                  <Waves className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">水产养殖智能监控系统</h1>
                <p className="text-primary-100 text-sm mt-1">智能溶氧分析 · 动力切换 · 精准投喂</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                isConnected ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
              }`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium">{isConnected ? '实时连接中' : '连接断开'}</span>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
              </div>
              
              {activeAlerts.length > 0 && (
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="relative flex items-center gap-2 px-4 py-2 bg-danger-500 hover:bg-danger-600 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">{activeAlerts.length}</span>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning-400 rounded-full animate-pulse-ring"></span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <nav className="bg-white/10 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-300 ${
                      isActive 
                        ? 'bg-white text-primary-700 shadow-lg' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    } rounded-t-lg`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    {tab.id === 'alerts' && activeAlerts.length > 0 && (
                      <span className="px-2 py-0.5 bg-danger-500 text-white text-xs rounded-full">
                        {activeAlerts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Activity}
                title="核心驱动模块"
                value="3"
                description="溶氧分析 · 动力切换 · 投喂决策"
                gradient="from-blue-500 to-blue-600"
              />
              <StatCard
                icon={LayoutDashboard}
                title="业务节点"
                value={useAppStore.getState().businessNodes.length.toString()}
                description="实时监控各节点状态"
                gradient="from-green-500 to-green-600"
              />
              <StatCard
                icon={Bell}
                title="未确认预警"
                value={activeAlerts.length.toString()}
                description={activeAlerts.length > 0 ? '需及时处理' : '暂无预警'}
                gradient={activeAlerts.length > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'}
                highlight={activeAlerts.length > 0}
              />
              <StatCard
                icon={Zap}
                title="电源状态"
                value={useAppStore.getState().powerStatus.isPowered ? '正常' : '应急'}
                description={`备用电源: ${useAppStore.getState().powerStatus.backupPowerStatus}`}
                gradient={useAppStore.getState().powerStatus.isPowered ? 'from-emerald-500 to-emerald-600' : 'from-yellow-500 to-yellow-600'}
              />
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

      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-800 font-semibold">水产养殖智能监控系统 v1.0</p>
              <p className="text-gray-500 text-xs mt-1">
                核心驱动: 溶氧趋势分析引擎 · 备用动力智能切换算法 · 精准投喂决策模型
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-500 text-sm">当前时间: {new Date().toLocaleString('zh-CN')}</p>
              <p className="text-gray-400 text-xs mt-1">
                闭环逻辑: 传感器预警 · 智能增氧 · 应急处理 · 精准投喂
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  description: string;
  gradient: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, description, gradient, highlight }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {highlight && (
            <div className="w-3 h-3 bg-danger-500 rounded-full animate-pulse"></div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-gray-500 text-sm">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-danger-600' : 'text-gray-800'}`}>
            {value}
          </p>
          <p className="text-gray-400 text-xs mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
