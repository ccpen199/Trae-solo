import { useEffect, useState } from 'react';
import { DollarSign, User, Tag, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';

export default function Refunds() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [form, setForm] = useState({
    coupon_code: '',
    type: 'unused',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      const res = await api.refunds.list(params);
      setRefunds(res.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async function handleApprove(id: string) {
    if (!confirm('确定同意退款吗？')) return;
    try {
      await api.refunds.approve(id, 4);
      loadData();
    } catch (error) {
      console.error('Failed to approve refund:', error);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt('请输入拒绝原因：');
    if (reason === null) return;
    try {
      await api.refunds.reject(id, 4, reason);
      loadData();
    } catch (error) {
      console.error('Failed to reject refund:', error);
    }
  }

  async function handleCreateRefund(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const couponRes = await api.coupons.getCoupon(form.coupon_code.trim());
      const coupon = couponRes.data;

      await api.refunds.create({
        coupon_id: coupon.id,
        user_id: coupon.user_id,
        type: form.type,
        reason: form.reason,
      });

      setShowModal(false);
      setForm({ coupon_code: '', type: 'unused', reason: '' });
      loadData();
    } catch (err: any) {
      setModalError(err.message || '创建退款失败');
    } finally {
      setModalLoading(false);
    }
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      unused: '未使用全额退款',
      partial: '部分使用按比例退款',
      expired: '过期50%退款',
      platform: '平台补偿全额退款',
    };
    return labels[type] || type;
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: '待处理',
      approved: '已同意',
      rejected: '已拒绝',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">退款处理</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  filter === f
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? '全部' : f === 'pending' ? '待处理' : f === 'approved' ? '已同意' : '已拒绝'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            新建退款
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">券码</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">退款类型</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">退款金额</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">原因</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作员</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">申请时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {refunds.map((refund) => (
              <tr key={refund.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-sm">{refund.coupon_code}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{refund.user_name}</p>
                      <p className="text-xs text-gray-500">{refund.user_phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{getTypeLabel(refund.type)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <DollarSign className="w-4 h-4" />
                    ¥{(refund.amount || 0).toFixed(2)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {refund.reason || '-'}
                </td>
                <td className="px-4 py-3 text-sm">{refund.operator_name || '-'}</td>
                <td className="px-4 py-3">
                  <div>
                    {getStatusBadge(refund.status)}
                    {refund.status === 'approved' && refund.updated_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(refund.updated_at).toLocaleString()}
                        {refund.operator_name && ` · ${refund.operator_name}`}
                      </p>
                    )}
                    {refund.status === 'rejected' && refund.reason && (
                      <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate">
                        拒绝原因: {refund.reason}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(refund.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {refund.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(refund.id)}
                        className="text-green-600 hover:text-green-700 p-1"
                        title="同意"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(refund.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="拒绝"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {refunds.length === 0 && (
          <p className="text-center py-8 text-gray-500">暂无退款记录</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">新建退款</h2>
              <button onClick={() => { setShowModal(false); setModalError(''); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="p-4 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">券码</label>
                <input
                  type="text"
                  value={form.coupon_code}
                  onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  placeholder="请输入券码，如 CPN000001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款类型</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="unused">未使用全额退款</option>
                  <option value="partial">部分使用按比例退款</option>
                  <option value="expired">过期50%退款</option>
                  <option value="platform">平台补偿全额退款</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款原因</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="请输入退款原因"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setModalError(''); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={modalLoading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={modalLoading}
                >
                  {modalLoading ? '提交中...' : '提交退款'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
