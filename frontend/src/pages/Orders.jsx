import React, { useState, useEffect } from 'react';
import { api } from '../api';

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'swapping', label: '换电中' },
  { value: 'pending', label: '待处理' },
];

const STATUS_BADGE = {
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  swapping: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABEL = {
  completed: '已完成',
  failed: '失败',
  swapping: '换电中',
  pending: '待处理',
};

const EMPTY_FORM = {
  station_id: 1,
  vehicle_id: '',
  battery_in_id: '',
  slot_number: '',
  fee: '',
  discount_amount: '',
  actual_fee: '',
  member_benefit: '',
  operator_id: '',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search.trim()) params.set('plate_number', search.trim());
    params.set('page', page);
    params.set('page_size', pageSize);
    try {
      const data = await api.getOrders(params.toString());
      setOrders(data.items || data.orders || []);
      setTotal(data.total || 0);
    } catch {
      setOrders([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      for (const key of Object.keys(payload)) {
        if (payload[key] === '') delete payload[key];
        else if (['station_id', 'vehicle_id', 'battery_in_id', 'slot_number', 'operator_id'].includes(key)) {
          payload[key] = Number(payload[key]);
        } else if (['fee', 'discount_amount', 'actual_fee', 'member_benefit'].includes(key)) {
          payload[key] = parseFloat(payload[key]);
        }
      }
      await api.createOrder(payload);
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.updateOrderStatus(id, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">换电订单</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          新建订单
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="搜索车牌号"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
          >
            搜索
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3 font-medium">订单号</th>
              <th className="px-4 py-3 font-medium">车牌号</th>
              <th className="px-4 py-3 font-medium">车主</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">实付金额</th>
              <th className="px-4 py-3 font-medium">会员优惠</th>
              <th className="px-4 py-3 font-medium">失败原因</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无数据</td>
              </tr>
            ) : (
              orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleExpand(order.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{order.order_no}</td>
                    <td className="px-4 py-3">{order.plate_number}</td>
                    <td className="px-4 py-3">{order.owner_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">¥{Number(order.actual_fee ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3">{order.member_benefit || '-'}</td>
                    <td className="px-4 py-3 text-red-500">{order.status === 'failed' ? (order.failure_reason || '-') : '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{order.created_at}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {(order.status === 'pending' || order.status === 'swapping') && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            完成
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'failed')}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            失败
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">换出电池编码：</span>
                            <span className="font-medium">{order.battery_out_code || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">换入电池编码：</span>
                            <span className="font-medium">{order.battery_in_code || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">仓位号：</span>
                            <span className="font-medium">{order.slot_number ?? '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">换电开始时间：</span>
                            <span className="font-medium">{order.swap_start_time || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">换电结束时间：</span>
                            <span className="font-medium">{order.swap_end_time || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">费用：</span>
                            <span className="font-medium">¥{Number(order.fee ?? 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">优惠金额：</span>
                            <span className="font-medium">¥{Number(order.discount_amount ?? 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border px-4 py-3">
          <span className="text-sm text-gray-500">
            共 {total} 条，第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">新建订单</h3>
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">站点ID</label>
                  <input name="station_id" type="number" value={form.station_id} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">车辆ID</label>
                  <input name="vehicle_id" type="number" value={form.vehicle_id} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">换入电池ID</label>
                  <input name="battery_in_id" type="number" value={form.battery_in_id} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">仓位号</label>
                  <input name="slot_number" type="number" value={form.slot_number} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">费用</label>
                  <input name="fee" type="number" step="0.01" value={form.fee} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">优惠金额</label>
                  <input name="discount_amount" type="number" step="0.01" value={form.discount_amount} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">实付金额</label>
                  <input name="actual_fee" type="number" step="0.01" value={form.actual_fee} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">会员优惠</label>
                  <input name="member_benefit" type="number" step="0.01" value={form.member_benefit} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">操作员ID</label>
                  <input name="operator_id" type="number" value={form.operator_id} onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? '提交中...' : '提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
