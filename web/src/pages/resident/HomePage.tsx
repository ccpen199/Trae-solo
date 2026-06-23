import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { deviceApi, rewardsApi } from '../../api';
import type { Device } from '../../types';

const typeMeta: Record<string, { label: string; icon: string }> = {
  washer: { label: '洗衣机', icon: '🧺' },
  water_dispenser: { label: '饮水机', icon: '💧' },
  shower: { label: '淋浴终端', icon: '🚿' }
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [streak, setStreak] = useState({ currentStreak: 0, totalPoints: 0 });
  const [typeCount, setTypeCount] = useState<Record<string, number>>({ washer: 0, water_dispenser: 0, shower: 0 });
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [devRes, streakRes] = await Promise.all([
        deviceApi.getList({ pageSize: 100 }),
        rewardsApi.getStreak().catch(() => ({ currentStreak: 0, totalPoints: 0 } as any))
      ]);
      setDevices(devRes.items || []);
      const tc: Record<string, number> = { washer: 0, water_dispenser: 0, shower: 0 };
      let online = 0;
      devRes.items?.forEach(d => {
        if (tc[d.type] !== undefined) tc[d.type]++;
        if (d.isOnline) online++;
      });
      setTypeCount(tc);
      setOnlineCount(online);
      setStreak({ currentStreak: (streakRes as any).currentStreak || 0, totalPoints: (streakRes as any).totalPoints || 0 });
    } catch (e) { console.error(e); }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'scan': navigate('/scan'); break;
      case 'reserve': navigate('/devices'); break;
      case 'orders': navigate('/orders'); break;
      case 'repair': navigate('/report'); break;
    }
  };

  return (
    <div className="p-4 space-y-5">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-100 text-sm">下午好，{user?.nickname || '居民'}</p>
            <h2 className="text-xl font-bold mt-1">欢迎使用共享设备</h2>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-3xl">👋</span>
          </div>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold">{onlineCount}</p>
            <p className="text-xs text-primary-100">可用设备</p>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <p className="text-2xl font-bold">{streak.totalPoints || 0}</p>
            <p className="text-xs text-primary-100">累计积分</p>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <p className="text-2xl font-bold">{streak.currentStreak || 0}</p>
            <p className="text-xs text-primary-100">连续签到</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '扫码使用', icon: '📷', action: 'scan', color: 'bg-blue-500' },
          { label: '预约设备', icon: '📅', action: 'reserve', color: 'bg-green-500' },
          { label: '我的订单', icon: '📋', action: 'orders', color: 'bg-orange-500' },
          { label: '报修中心', icon: '🔧', action: 'repair', color: 'bg-purple-500' }
        ].map(item => (
          <button key={item.action} onClick={() => handleAction(item.action)}
            className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm active:scale-95 transition-transform">
            <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-2`}>
              <span className="text-xl">{item.icon}</span>
            </div>
            <span className="text-xs text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">设备分类</h3>
          <button onClick={() => navigate('/devices')} className="text-sm text-primary-600 font-medium">查看全部 →</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(typeMeta).map(([type, meta]) => (
            <button key={type} onClick={() => navigate('/devices', { state: { type } })}
              className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-2">
                <span className="text-2xl">{meta.icon}</span>
              </div>
              <span className="text-sm font-medium text-gray-800">{meta.label}</span>
              <span className="text-xs text-gray-400 mt-0.5">{typeCount[type] || 0}台在线</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">附近设备</h3>
        <div className="space-y-3">
          {devices.slice(0, 5).map(d => {
            const meta = typeMeta[d.type] || { label: d.type, icon: '📱' };
            const statusColor = d.status === 'idle' ? 'bg-green-50 text-green-600'
              : d.status === 'running' ? 'bg-blue-50 text-blue-600'
              : d.status === 'fault' ? 'bg-red-50 text-red-600'
              : d.status === 'reserved' ? 'bg-orange-50 text-orange-600'
              : 'bg-gray-100 text-gray-500';
            const statusText = { idle: '空闲', running: '使用中', fault: '故障', reserved: '已预约', offline: '离线' }[d.status];
            return (
              <div key={d.id} onClick={() => navigate(`/devices/${d.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-3xl">{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 truncate">{d.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{statusText}</span>
                      {d.isOnline && <span className="text-xs text-green-500">●在线</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {d.location}</p>
                    <p className="text-xs text-primary-600 mt-0.5">¥{d.pricing}/30分钟</p>
                  </div>
                  <span className="text-gray-300 ml-2 text-xl">›</span>
                </div>
              </div>
            );
          })}
          {devices.length === 0 && (
            <div className="text-center py-8 text-gray-400">暂无设备</div>
          )}
        </div>
      </div>
    </div>
  );
};
export default HomePage;
