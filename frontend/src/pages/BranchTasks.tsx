import { useState, useEffect } from 'react';
import { PlusCircle, X, UserCheck } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { PickupTask, TASK_TYPE_MAP, TASK_STATUS_MAP, PaginatedResult } from '../types';

interface CourierOption {
  id: number;
  name: string;
}

interface TaskForm {
  type: string;
  tracking_no: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  address: string;
  scheduled_time: string;
  fee: string;
}

const emptyForm: TaskForm = {
  type: 'pickup',
  tracking_no: '',
  sender_name: '',
  sender_phone: '',
  receiver_name: '',
  receiver_phone: '',
  address: '',
  scheduled_time: '',
  fee: '',
};

export default function BranchTasks() {
  const [tasks, setTasks] = useState<PickupTask[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courierFilter, setCourierFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyForm);
  const [showAssignModal, setShowAssignModal] = useState<PickupTask | null>(null);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 15;

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (courierFilter) params.courier_id = courierFilter;
      const res = await api.get<any, { data: PaginatedResult<PickupTask> }>('/tasks', { params });
      setTasks(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const res = await api.get<any, { data: CourierOption[] }>('/couriers');
      setCouriers(res.data || []);
    } catch {
      setCouriers([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, typeFilter, statusFilter, courierFilter]);

  useEffect(() => {
    fetchCouriers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tasks', {
        ...taskForm,
        fee: Number(taskForm.fee),
        scheduled_time: taskForm.scheduled_time || null,
      });
      setShowCreateModal(false);
      setTaskForm(emptyForm);
      fetchTasks();
    } catch (err: any) {
      alert(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!showAssignModal || !selectedCourier) return;
    setSubmitting(true);
    try {
      await api.post(`/tasks/${showAssignModal.id}/assign`, { courier_id: Number(selectedCourier) });
      setShowAssignModal(null);
      setSelectedCourier('');
      fetchTasks();
    } catch (err: any) {
      alert(err.message || '分配失败');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">揽派调度</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
          <PlusCircle size={16} />
          创建任务
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">任务类型</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部类型</option>
              {Object.entries(TASK_TYPE_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">状态</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部状态</option>
              {Object.entries(TASK_STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">快递员</label>
            <select
              value={courierFilter}
              onChange={e => { setCourierFilter(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部快递员</option>
              {couriers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 pr-3">任务编号</th>
                  <th className="pb-2 pr-3">类型</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2 pr-3">快递员</th>
                  <th className="pb-2 pr-3">地址</th>
                  <th className="pb-2 pr-3">预约时间</th>
                  <th className="pb-2 pr-3">费用</th>
                  <th className="pb-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-800">{task.task_no}</td>
                    <td className="py-2.5 pr-3">{TASK_TYPE_MAP[task.type] || task.type}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={task.status} type="task" /></td>
                    <td className="py-2.5 pr-3">{task.courier_name || '-'}</td>
                    <td className="py-2.5 pr-3 max-w-[200px] truncate">{task.address}</td>
                    <td className="py-2.5 pr-3 text-gray-500">{task.scheduled_time || '-'}</td>
                    <td className="py-2.5 pr-3">¥{task.fee.toFixed(2)}</td>
                    <td className="py-2.5">
                      {task.status === 'pending' || task.status === 'assigned' ? (
                        <button
                          className="btn-accent text-xs px-2 py-1 flex items-center gap-1"
                          onClick={() => { setShowAssignModal(task); setSelectedCourier(''); }}
                        >
                          <UserCheck size={12} />
                          分配
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">{page} / {totalPages} (共 {total} 条)</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">创建任务</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">任务类型</label>
                <select value={taskForm.type} onChange={e => setTaskForm(f => ({ ...f, type: e.target.value }))} className="input-field" required>
                  {Object.entries(TASK_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">快递单号</label>
                <input type="text" value={taskForm.tracking_no} onChange={e => setTaskForm(f => ({ ...f, tracking_no: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">寄件人姓名</label>
                <input type="text" value={taskForm.sender_name} onChange={e => setTaskForm(f => ({ ...f, sender_name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">寄件人电话</label>
                <input type="text" value={taskForm.sender_phone} onChange={e => setTaskForm(f => ({ ...f, sender_phone: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">收件人姓名</label>
                <input type="text" value={taskForm.receiver_name} onChange={e => setTaskForm(f => ({ ...f, receiver_name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">收件人电话</label>
                <input type="text" value={taskForm.receiver_phone} onChange={e => setTaskForm(f => ({ ...f, receiver_phone: e.target.value }))} className="input-field" required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">地址</label>
                <input type="text" value={taskForm.address} onChange={e => setTaskForm(f => ({ ...f, address: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">预约时间</label>
                <input type="datetime-local" value={taskForm.scheduled_time} onChange={e => setTaskForm(f => ({ ...f, scheduled_time: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">费用(元)</label>
                <input type="number" step="0.01" value={taskForm.fee} onChange={e => setTaskForm(f => ({ ...f, fee: e.target.value }))} className="input-field" required />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>取消</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? '创建中...' : '创建任务'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">分配任务</h2>
              <button onClick={() => setShowAssignModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">任务: {showAssignModal.task_no}</p>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">选择快递员</label>
              <select value={selectedCourier} onChange={e => setSelectedCourier(e.target.value)} className="input-field" required>
                <option value="">请选择快递员</option>
                {couriers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setShowAssignModal(null)}>取消</button>
              <button className="btn-accent flex items-center gap-1" onClick={handleAssign} disabled={submitting || !selectedCourier}>
                <UserCheck size={14} />
                {submitting ? '分配中...' : '确认分配'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
