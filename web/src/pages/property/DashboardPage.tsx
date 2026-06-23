import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceApi, workorderApi } from '../../api';
import type { Device, WorkOrder } from '../../types';

const statusLabel: Record<string, string> = { idle: '空闲', running: '使用中', fault: '故障', reserved: '已预约', offline: '离线' };
const priorityColor: Record<string, string> = { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-50 text-yellow-600', high: 'bg-orange-50 text-orange-600', urgent: 'bg-red-50 text-red-600' };
const priorityLabel: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' };
const workorderStatusLabel: Record<string, string> = { pending: '待派单', assigned: '已派单', processing: '处理中', resolved: '已解决', closed: '已关闭' };

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [workorders, setWorkorders] = useState<WorkOrder[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, wRes] = await Promise.all([
        deviceApi.getList({ pageSize: 200 }),
        workorderApi.list({ status: 'pending', pageSize: 5 })
      ]);
      setDevices(dRes.items || []);
      setWorkorders(wRes.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const total = devices.length;
  const online = devices.filter(d => d.isOnline).length;
  const faults = devices.filter(d => d.status === 'fault').length;
  const pendingWo = workorders.filter(w => w.status === 'pending' || w.status === 'assigned' || w.status === 'processing').length;

  if (loading) return <div className="p-8 text-center text-gray-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">物业运维看板</h1>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '设备总数', value: total, icon: '📱', color: 'bg-blue-500' },
          { label: '在线设备', value: online, icon: '🟢', color: 'bg-green-500' },
          { label: '故障设备', value: faults, icon: '🔧', color: 'bg-red-500' },
          { label: '待处理工单', value: pendingWo, icon: '📋', color: 'bg-orange-500' }
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">设备状态分布</h2>
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(statusLabel).map(([status, label]) => {
            const count = devices.filter(d => d.status === status).length;
            const pct = total > 0 ? Math.round(count / total * 100) : 0;
            return (
              <div key={status} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
                <p className="text-xs text-gray-400 mt-1">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">最新工单</h2>
          <button onClick={() => navigate('/property/workorders')} className="text-sm text-primary-600">查看全部 →</button>
        </div>
        {workorders.length === 0 ? <p className="text-center py-8 text-gray-400">暂无工单</p> :
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="py-2">工单编号</th><th>设备</th><th>类型</th><th>优先级</th><th>状态</th><th>创建时间</th>
            </tr></thead>
            <tbody>
              {workorders.map(w => (
                <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/property/workorders')}>
                  <td className="py-3 font-mono text-xs">{w.id.slice(0, 8)}...</td>
                  <td>{w.deviceName || w.deviceId.slice(0, 6)}</td>
                  <td>{w.type === 'repair' ? '故障报修' : w.type === 'maintenance' ? '保养' : '投诉'}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs ${priorityColor[w.priority]}`}>{priorityLabel[w.priority]}</span></td>
                  <td>{workorderStatusLabel[w.status] || w.status}</td>
                  <td className="text-gray-400">{new Date(w.createdAt).toLocaleString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
    </div>
  );
};
export default DashboardPage;
