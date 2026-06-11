import { useState, useEffect } from 'react';
import { Building, Plus, Filter, X, MapPin, Grid3X3 } from 'lucide-react';
import api from '../services/api';
import { LockerStation, LOCKER_TYPE_MAP, PaginatedResult } from '../types';

interface StationForm {
  name: string;
  code: string;
  type: string;
  address: string;
  total_slots: string;
}

const emptyForm: StationForm = {
  name: '',
  code: '',
  type: '',
  address: '',
  total_slots: '',
};

export default function LockerStations() {
  const [stations, setStations] = useState<LockerStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<StationForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ totalStations: 0, totalSlots: 0, usageRate: 0 });

  const fetchStations = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, pageSize: 100 };
      if (typeFilter) params.type = typeFilter;
      const res = await api.get<any, { data: PaginatedResult<LockerStation> }>('/locker-stations', { params });
      setStations(res.data.list || []);
    } catch {
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<any, { data: PaginatedResult<LockerStation> }>('/locker-stations', { params: { page: 1, pageSize: 1000 } });
      const list = res.data?.list || [];
      const totalSlots = list.reduce((s: number, st: LockerStation) => s + st.total_slots, 0);
      const usedSlots = list.reduce((s: number, st: LockerStation) => s + st.used_slots, 0);
      setStats({ totalStations: list.length, totalSlots, usageRate: totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0 });
    } catch {}
  };

  useEffect(() => {
    fetchStations();
  }, [typeFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/locker-stations', {
        ...form,
        total_slots: Number(form.total_slots),
      });
      setShowCreateModal(false);
      setForm(emptyForm);
      fetchStations();
      fetchStats();
    } catch (err: any) {
      alert(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">驿站/柜机</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          新增站点
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Building size={20} className="text-blue-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">总站点数</div>
            <div className="text-xl font-bold text-gray-800">{stats.totalStations}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Grid3X3 size={20} className="text-indigo-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">总格口数</div>
            <div className="text-xl font-bold text-gray-800">{stats.totalSlots}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Grid3X3 size={20} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">使用率</div>
            <div className="text-xl font-bold text-amber-600">{stats.usageRate}%</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field text-sm w-32"
          >
            <option value="">全部类型</option>
            {Object.entries(LOCKER_TYPE_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : stations.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无站点</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map(station => {
            const usagePercent = station.total_slots > 0 ? Math.round((station.used_slots / station.total_slots) * 100) : 0;
            return (
              <div key={station.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-800">{station.name}</h3>
                    <span className="text-xs text-gray-400 font-mono">{station.code}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                    station.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {station.status === 'active' ? '运营中' : '停用'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                    {LOCKER_TYPE_MAP[station.type] || station.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                  <MapPin size={14} />
                  <span className="truncate">{station.address}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>格口使用</span>
                    <span>{station.used_slots}/{station.total_slots}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">新增站点</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">站点名称</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">站点编码</label>
                <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">类型</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field" required>
                  <option value="">请选择</option>
                  {Object.entries(LOCKER_TYPE_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">总格口数</label>
                <input type="number" value={form.total_slots} onChange={e => setForm(f => ({ ...f, total_slots: e.target.value }))} className="input-field" required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">地址</label>
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field" required />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>取消</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? '提交中...' : '确认创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
