import { useState, useEffect } from 'react';
import { Users, Plus, Filter, X, Tag, DollarSign, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { CustomerGroup, CUSTOMER_TYPE_MAP, PaginatedResult } from '../types';

interface GroupForm {
  name: string;
  type: string;
  tags: string;
}

const emptyForm: GroupForm = {
  name: '',
  type: '',
  tags: '',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  vip: 'bg-amber-100 text-amber-700',
  normal: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

export default function CustomerGroups() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<GroupForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ totalGroups: 0, totalCustomers: 0, avgFee: 0 });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, pageSize: 100 };
      if (typeFilter) params.type = typeFilter;
      const res = await api.get<any, { data: PaginatedResult<CustomerGroup> }>('/customer-groups', { params });
      setGroups(res.data.list || []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<any, { data: PaginatedResult<CustomerGroup> }>('/customer-groups', { params: { page: 1, pageSize: 1000 } });
      const list = res.data?.list || [];
      const totalCustomers = list.reduce((s: number, g: CustomerGroup) => s + g.customer_count, 0);
      const avgFee = list.length > 0 ? list.reduce((s: number, g: CustomerGroup) => s + g.avg_fee, 0) / list.length : 0;
      setStats({ totalGroups: list.length, totalCustomers, avgFee });
    } catch {}
  };

  useEffect(() => {
    fetchGroups();
  }, [typeFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/customer-groups', form);
      setShowCreateModal(false);
      setForm(emptyForm);
      fetchGroups();
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
        <h1 className="text-2xl font-bold text-gray-800">客户分群</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          新建分群
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users size={20} className="text-blue-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">总分群数</div>
            <div className="text-xl font-bold text-gray-800">{stats.totalGroups}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Users size={20} className="text-green-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">总客户数</div>
            <div className="text-xl font-bold text-green-600">{stats.totalCustomers}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <DollarSign size={20} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">平均费用</div>
            <div className="text-xl font-bold text-amber-600">¥{stats.avgFee.toFixed(2)}</div>
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
            {Object.entries(CUSTOMER_TYPE_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无分群</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <div key={group.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-800">{group.name}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${TYPE_BADGE_COLORS[group.type] || 'bg-gray-100 text-gray-600'}`}>
                  {CUSTOMER_TYPE_MAP[group.type] || group.type}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500">客户数</div>
                  <div className="text-sm font-semibold text-gray-800">{group.customer_count}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">订单量</div>
                  <div className="text-sm font-semibold text-gray-800">{group.total_orders}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">平均费用</div>
                  <div className="text-sm font-semibold text-amber-600">¥{group.avg_fee.toFixed(2)}</div>
                </div>
              </div>
              {group.tags && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag size={12} className="text-gray-400" />
                  {group.tags.split(',').map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">新建分群</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">分群名称</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">客户类型</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field" required>
                  <option value="">请选择</option>
                  {Object.entries(CUSTOMER_TYPE_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">标签(逗号分隔)</label>
                <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="input-field" placeholder="标签1,标签2" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
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
