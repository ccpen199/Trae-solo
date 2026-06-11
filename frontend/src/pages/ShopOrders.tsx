import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Filter, X, RefreshCw, DollarSign, Package } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { ShopOrder, SHOP_ORDER_STATUS_MAP, SHOP_SOURCE_MAP, PaginatedResult } from '../types';

interface OrderForm {
  customer_name: string;
  customer_phone: string;
  product_name: string;
  quantity: string;
  amount: string;
  source: string;
}

const emptyForm: OrderForm = {
  customer_name: '',
  customer_phone: '',
  product_name: '',
  quantity: '',
  amount: '',
  source: '',
};

export default function ShopOrders() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, totalAmount: 0, pendingCount: 0 });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, pageSize: 50 };
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      const res = await api.get<any, { data: PaginatedResult<ShopOrder> }>('/shop-orders', { params });
      setOrders(res.data.list || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<any, { data: PaginatedResult<ShopOrder> }>('/shop-orders', { params: { page: 1, pageSize: 1000 } });
      const list = res.data?.list || [];
      const totalAmount = list.reduce((s: number, o: ShopOrder) => s + o.amount, 0);
      const pendingCount = list.filter((o: ShopOrder) => o.status === 'pending').length;
      setStats({ totalOrders: list.length, totalAmount, pendingCount });
    } catch {}
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, sourceFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/shop-orders', {
        ...form,
        quantity: Number(form.quantity),
        amount: Number(form.amount),
      });
      setShowCreateModal(false);
      setForm(emptyForm);
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      alert(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/shop-orders/sync');
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      alert(err.message || '同步失败');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">微店订单</h1>
        <div className="flex items-center gap-2">
          <button className="btn-outline flex items-center gap-2" onClick={handleSync} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? '同步中...' : '同步订单'}
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            新增订单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <ShoppingCart size={20} className="text-blue-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">总订单数</div>
            <div className="text-xl font-bold text-gray-800">{stats.totalOrders}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <DollarSign size={20} className="text-green-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">总金额</div>
            <div className="text-xl font-bold text-green-600">¥{stats.totalAmount.toLocaleString()}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Package size={20} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">待处理</div>
            <div className="text-xl font-bold text-amber-600">{stats.pendingCount}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-sm w-32"
          >
            <option value="">全部状态</option>
            {Object.entries(SHOP_ORDER_STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="input-field text-sm w-32"
        >
          <option value="">全部来源</option>
          {Object.entries(SHOP_SOURCE_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无订单</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">订单号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">客户</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">商品</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">数量</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">金额</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">来源</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">物流单号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{order.order_no}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{order.customer_name}</div>
                    <div className="text-xs text-gray-400">{order.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{order.product_name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{order.quantity}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">¥{order.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} type="shopOrder" />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{SHOP_SOURCE_MAP[order.source] || order.source}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{order.tracking_no || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{order.created_at}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">暂无订单</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">新增订单</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">客户姓名</label>
                <input type="text" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">客户电话</label>
                <input type="text" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className="input-field" required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">商品名称</label>
                <input type="text" value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">数量</label>
                <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">金额(元)</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">来源</label>
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input-field" required>
                  <option value="">请选择</option>
                  {Object.entries(SHOP_SOURCE_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
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
