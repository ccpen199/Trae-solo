import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { deviceApi } from '../../api';
import type { Device } from '../../types';

const typeMeta: Record<string, { label: string; icon: string }> = {
  washer: { label: '洗衣机', icon: '🧺' },
  water_dispenser: { label: '饮水机', icon: '💧' },
  shower: { label: '淋浴终端', icon: '🚿' }
};

const statusText: Record<string, string> = {
  idle: '空闲', running: '使用中', fault: '故障', reserved: '已预约', offline: '离线'
};

const statusColor: Record<string, string> = {
  idle: 'bg-green-50 text-green-600',
  running: 'bg-blue-50 text-blue-600',
  fault: 'bg-red-50 text-red-600',
  reserved: 'bg-orange-50 text-orange-600',
  offline: 'bg-gray-100 text-gray-500'
};

const DeviceListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deviceApi.getList({
        type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        pageSize: 100
      });
      setDevices(res.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterType, filterStatus]);

  useEffect(() => {
    const state = location.state as { type?: string } | null;
    if (state?.type) setFilterType(state.type);
  }, [location.state]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">设备列表</h2>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[{value:'all',label:'全部'},{value:'washer',label:'洗衣机'},{value:'water_dispenser',label:'饮水机'},{value:'shower',label:'淋浴'}].map(item => (
          <button key={item.value} onClick={() => setFilterType(item.value)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filterType===item.value ? 'bg-primary-500 text-white' : 'bg-white text-gray-600'
            }`}>{item.label}</button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[{value:'all',label:'全部状态'},{value:'idle',label:'空闲'},{value:'running',label:'使用中'},{value:'fault',label:'故障'},{value:'offline',label:'离线'}].map(item => (
          <button key={item.value} onClick={() => setFilterStatus(item.value)}
            className={`px-3 py-1.5 rounded-lg text-xs ${
              filterStatus===item.value ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
            }`}>{item.label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">加载中...</div> :
      devices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-400">暂无设备</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map(d => {
            const meta = typeMeta[d.type] || { label: d.type, icon: '📱' };
            return (
              <div key={d.id} onClick={() => navigate(`/devices/${d.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-3xl">{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 truncate">{d.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[d.status]}`}>{statusText[d.status]}</span>
                      {d.isOnline ? <span className="text-xs text-green-500">●在线</span> : <span className="text-xs text-gray-400">○离线</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{meta.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {d.location}</p>
                    <p className="text-xs text-primary-600 mt-0.5">¥{d.pricing}/30分钟</p>
                  </div>
                  <span className="text-gray-300 ml-2 text-xl">›</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default DeviceListPage;
