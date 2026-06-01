import { useEffect, useState } from 'react';
import { Calendar, User, Store, Clock, Plus, X, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [form, setForm] = useState({
    coupon_id: '',
    store_id: '',
    service_id: '',
    staff_id: '',
    appointment_time: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (form.store_id) {
      api.appointments.getStaff(parseInt(form.store_id)).then(res => setStaff(res.data));
    } else {
      setStaff([]);
    }
  }, [form.store_id]);

  async function loadData() {
    try {
      setError('');
      const [aptRes, couponRes, storeRes, serviceRes] = await Promise.all([
        api.appointments.list(),
        api.coupons.getMyCoupons(1),
        api.coupons.getStores(),
        api.coupons.getServices(),
      ]);
      setAppointments(aptRes.data);
      setCoupons(couponRes.data.filter((c: any) => c.status === 'active' || c.status === 'partial'));
      setStores(storeRes.data);
      setServices(serviceRes.data);
    } catch (err: any) {
      setError(err.message || '加载失败');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.appointments.create({
        ...form,
        coupon_id: parseInt(form.coupon_id),
        store_id: parseInt(form.store_id),
        service_id: form.service_id ? parseInt(form.service_id) : null,
        staff_id: form.staff_id ? parseInt(form.staff_id) : null,
        user_id: 1,
      });
      setShowModal(false);
      loadData();
      setForm({
        coupon_id: '',
        store_id: '',
        service_id: '',
        staff_id: '',
        appointment_time: '',
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('确定取消预约吗？')) return;
    try {
      await api.appointments.cancel(id);
      loadData();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      pending: '待使用',
      completed: '已完成',
      cancelled: '已取消',
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
        <h1 className="text-2xl font-bold">预约管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新建预约
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">券码</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">门店</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">服务</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">店员</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">预约时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {appointments.map((apt) => (
              <tr key={apt.id}>
                <td className="px-4 py-3 font-mono text-sm">{apt.coupon_code}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{apt.user_name}</p>
                      <p className="text-xs text-gray-500">{apt.user_phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Store className="w-4 h-4 text-gray-400" />
                    {apt.store_name}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{apt.service_name || '-'}</td>
                <td className="px-4 py-3 text-sm">{apt.staff_name || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(apt.appointment_time).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3">{getStatusBadge(apt.status)}</td>
                <td className="px-4 py-3">
                  {apt.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      取消
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && (
          <p className="text-center py-8 text-gray-500">暂无预约记录</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">新建预约</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择券包</label>
                <select
                  value={form.coupon_id}
                  onChange={(e) => setForm({ ...form, coupon_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">请选择</option>
                  {coupons.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.package_name} - {c.code} (剩余 {c.remaining_count} 次)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门店</label>
                <select
                  value={form.store_id}
                  onChange={(e) => setForm({ ...form, store_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">请选择</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务项目</label>
                <select
                  value={form.service_id}
                  onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">请选择（可选）</option>
                  {services
                    .filter((s: any) => !form.store_id || s.store_id === parseInt(form.store_id))
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} - ¥{s.price}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务人员</label>
                <select
                  value={form.staff_id}
                  onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">请选择（可选）</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
                <input
                  type="datetime-local"
                  value={form.appointment_time}
                  onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '创建中...' : '创建预约'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
