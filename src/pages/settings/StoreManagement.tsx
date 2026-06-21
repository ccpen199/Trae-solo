import { useState } from 'react';
import { Plus, Edit, Trash2, Store, MapPin, Monitor, Hotel, Activity, ChevronRight, Settings, RefreshCw } from 'lucide-react';
import { stores } from '@/data/mockData';
import { cn } from '@/lib/utils';

const typeMap = {
  esports: { label: '电竞馆', color: 'bg-cyber-500/20 text-cyber-400' },
  hotel: { label: '电竞酒店', color: 'bg-neon-purple/20 text-neon-purple' },
  both: { label: '综合店', color: 'bg-neon-green/20 text-neon-green' },
};

const statusMap = {
  open: { label: '营业中', color: 'bg-neon-green/20 text-neon-green' },
  closed: { label: '已关闭', color: 'bg-dark-600 text-dark-400' },
  maintenance: { label: '维护中', color: 'bg-neon-orange/20 text-neon-orange' },
};

export default function StoreManagement() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">门店管理</h1>
          <p className="text-dark-400 mt-1">管理所有门店信息与BI数据同步</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-10 px-4 bg-dark-800 hover:bg-dark-700 text-white text-sm font-medium rounded-lg border border-dark-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            同步BI数据
          </button>
          <button className="flex items-center gap-2 h-10 px-4 bg-cyber-600 hover:bg-cyber-500 text-white font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            添加门店
          </button>
        </div>
      </div>

      {/* 门店概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <p className="text-dark-400 text-sm mb-1">总门店数</p>
          <p className="text-2xl font-bold text-white font-orbitron">{stores.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <p className="text-dark-400 text-sm mb-1">营业中</p>
          <p className="text-2xl font-bold text-neon-green font-orbitron">
            {stores.filter((s) => s.status === 'open').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-500/30">
          <p className="text-dark-400 text-sm mb-1">总座位数</p>
          <p className="text-2xl font-bold text-cyber-400 font-orbitron">
            {stores.reduce((sum, s) => sum + s.seatCount, 0)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-purple/30">
          <p className="text-dark-400 text-sm mb-1">总房间数</p>
          <p className="text-2xl font-bold text-neon-purple font-orbitron">
            {stores.reduce((sum, s) => sum + s.roomCount, 0)}
          </p>
        </div>
      </div>

      {/* 门店列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div
            key={store.id}
            className={cn(
              'rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer',
              selectedStore === store.id
                ? 'bg-dark-800 border-cyber-500 shadow-lg shadow-cyber-500/20'
                : 'bg-dark-800/50 border-cyber-800/50 hover:border-cyber-600/50'
            )}
            onClick={() => setSelectedStore(store.id === selectedStore ? null : store.id)}
          >
            {/* 门店头部 */}
            <div className="p-5 border-b border-dark-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-500 to-neon-purple flex items-center justify-center">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{store.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeMap[store.type].color}`}>
                        {typeMap[store.type].label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusMap[store.status].color}`}>
                        {statusMap[store.status].label}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={cn(
                  'w-5 h-5 text-dark-400 transition-transform',
                  selectedStore === store.id && 'rotate-90'
                )} />
              </div>
              <div className="flex items-center gap-1 text-sm text-dark-400">
                <MapPin className="w-4 h-4" />
                <span>{store.address}</span>
              </div>
            </div>

            {/* 门店数据 */}
            <div className="p-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Monitor className="w-4 h-4 text-cyber-400" />
                    <span className="text-xs text-dark-400">座位</span>
                  </div>
                  <p className="text-lg font-bold text-white font-orbitron">{store.seatCount}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Hotel className="w-4 h-4 text-neon-purple" />
                    <span className="text-xs text-dark-400">包间</span>
                  </div>
                  <p className="text-lg font-bold text-white font-orbitron">{store.roomCount}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Activity className="w-4 h-4 text-neon-green" />
                    <span className="text-xs text-dark-400">面积</span>
                  </div>
                  <p className="text-lg font-bold text-white font-orbitron">{store.area}㎡</p>
                </div>
              </div>

              {selectedStore === store.id && (
                <div className="mt-4 pt-4 border-t border-dark-700 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">开业时间</span>
                    <span className="text-white">{store.createdAt}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">BI同步</span>
                    <span className="text-neon-green">已同步</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="flex-1 flex items-center justify-center gap-1 h-8 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm rounded-lg transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                      编辑
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 h-8 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm rounded-lg transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                      配置
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 h-8 bg-dark-700 hover:bg-dark-600 text-neon-red text-sm rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* BI系统配置 */}
      <div className="p-6 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <h3 className="text-lg font-semibold text-white mb-4">集团BI系统接入</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">BI系统地址</label>
              <input
                type="text"
                value="https://bi.wangyu-esports.com/api"
                className="w-full h-10 px-4 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-cyber-500"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-2">API密钥</label>
              <input
                type="password"
                value="xxxxxxxxxxxxxxxx"
                className="w-full h-10 px-4 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-cyber-500"
                readOnly
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">同步频率</label>
              <select className="w-full h-10 px-4 bg-dark-900 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-cyber-500">
                <option>每5分钟</option>
                <option>每15分钟</option>
                <option>每小时</option>
                <option>每天</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-900/50 rounded-lg">
              <div>
                <p className="text-sm text-white">上次同步</p>
                <p className="text-xs text-dark-400">2024-01-15 14:30:00</p>
              </div>
              <span className="flex items-center gap-1 text-neon-green text-sm">
                <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
                运行正常
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
