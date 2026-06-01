import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'available', label: '可用' },
  { value: 'charging', label: '充电中' },
  { value: 'in_use', label: '使用中' },
  { value: 'abnormal', label: '异常' },
  { value: 'maintenance', label: '维护中' },
];

const STATION_OPTIONS = [
  { value: '', label: '全部站点' },
  { value: '1', label: '朝阳站' },
  { value: '2', label: '海淀站' },
];

const STATUS_BADGE = {
  available: 'bg-green-100 text-green-700',
  charging: 'bg-blue-100 text-blue-700',
  in_use: 'bg-purple-100 text-purple-700',
  abnormal: 'bg-red-100 text-red-700',
  maintenance: 'bg-orange-100 text-orange-700',
};

const STATUS_LABEL = {
  available: '可用',
  charging: '充电中',
  in_use: '使用中',
  abnormal: '异常',
  maintenance: '维护中',
};

function socColor(v) {
  if (v > 60) return 'bg-green-500';
  if (v > 30) return 'bg-yellow-400';
  return 'bg-red-500';
}

function sohColor(v) {
  if (v > 80) return 'text-green-600';
  if (v > 60) return 'text-yellow-600';
  return 'text-red-600';
}

export default function Batteries() {
  const [batteries, setBatteries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const fetchBatteries = useCallback(async () => {
    setLoading(true);
    try {
      const params = [];
      if (statusFilter) params.push(`status=${statusFilter}`);
      if (stationFilter) params.push(`station_id=${stationFilter}`);
      params.push(`page=${page}`);
      params.push(`page_size=${pageSize}`);
      const res = await api.getBatteries(params.join('&'));
      setBatteries(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, stationFilter, page]);

  useEffect(() => {
    fetchBatteries();
  }, [fetchBatteries]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, stationFilter]);

  const totalPages = Math.ceil(total / pageSize);

  async function handleStatusChange(id, newStatus) {
    try {
      await api.updateBatteryStatus(id, { status: newStatus });
      fetchBatteries();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">电池管理</h2>

      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          {STATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">共 {total} 条</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-left">
                <th className="px-4 py-3 font-medium">电池编号</th>
                <th className="px-4 py-3 font-medium">型号</th>
                <th className="px-4 py-3 font-medium">SOC</th>
                <th className="px-4 py-3 font-medium">SOH</th>
                <th className="px-4 py-3 font-medium">循环次数</th>
                <th className="px-4 py-3 font-medium">温度</th>
                <th className="px-4 py-3 font-medium">电压</th>
                <th className="px-4 py-3 font-medium">故障码</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">上次维护</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-gray-400">加载中...</td>
                </tr>
              ) : batteries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-gray-400">暂无数据</td>
                </tr>
              ) : (
                batteries.map((b) => (
                  <BatteryRow
                    key={b.id}
                    battery={b}
                    expanded={expandedId === b.id}
                    onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-600">
              第 {page} / {totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BatteryRow({ battery: b, expanded, onToggle, onStatusChange }) {
  const canMarkAbnormal = b.status === 'available' || b.status === 'charging';
  const canMarkAvailable = b.status === 'abnormal' || b.status === 'maintenance';

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3 font-medium text-gray-800">{b.battery_code}</td>
        <td className="px-4 py-3 text-gray-600">{b.model}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${socColor(b.soc)}`}
                style={{ width: `${b.soc}%` }}
              />
            </div>
            <span className="text-xs font-medium">{b.soc}%</span>
          </div>
        </td>
        <td className={`px-4 py-3 font-medium ${sohColor(b.soh)}`}>{b.soh}%</td>
        <td className="px-4 py-3 text-gray-600">{b.cycle_count}</td>
        <td className={`px-4 py-3 ${b.temperature > 40 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          {b.temperature}°C
        </td>
        <td className="px-4 py-3 text-gray-600">{b.voltage}V</td>
        <td className={`px-4 py-3 ${b.fault_code ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
          {b.fault_code || '-'}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[b.status] || ''}`}>
            {STATUS_LABEL[b.status] || b.status}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600">{b.last_maintenance_date?.slice(0, 10) || '-'}</td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            {canMarkAbnormal && (
              <button
                onClick={() => onStatusChange(b.id, 'abnormal')}
                className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100"
              >
                标记异常
              </button>
            )}
            {canMarkAvailable && (
              <button
                onClick={() => onStatusChange(b.id, 'available')}
                className="px-2 py-1 text-xs rounded bg-green-50 text-green-600 hover:bg-green-100"
              >
                恢复可用
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={11} className="px-6 py-4">
            <div className="grid grid-cols-4 gap-x-8 gap-y-2 text-sm">
              <DetailItem label="ID" value={b.id} />
              <DetailItem label="电池编号" value={b.battery_code} />
              <DetailItem label="型号" value={b.model} />
              <DetailItem label="所属站点" value={b.station_id === 1 ? '朝阳站' : b.station_id === 2 ? '海淀站' : `站点${b.station_id}`} />
              <DetailItem label="SOC" value={`${b.soc}%`} />
              <DetailItem label="SOH" value={`${b.soh}%`} />
              <DetailItem label="循环次数" value={b.cycle_count} />
              <DetailItem label="温度" value={`${b.temperature}°C`} />
              <DetailItem label="电压" value={`${b.voltage}V`} />
              <DetailItem label="故障码" value={b.fault_code || '无'} />
              <DetailItem label="状态" value={STATUS_LABEL[b.status] || b.status} />
              <DetailItem label="上次维护" value={b.last_maintenance_date?.slice(0, 10) || '-'} />
              <DetailItem label="创建时间" value={b.created_at?.slice(0, 19) || '-'} />
              <DetailItem label="更新时间" value={b.updated_at?.slice(0, 19) || '-'} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
