import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, AlertTriangle, MapPin, User, Phone, DollarSign } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { PickupTask, TASK_TYPE_MAP, PaginatedResult } from '../types';

const STATUS_FILTERS = [
  { key: '', label: '全部' },
  { key: 'assigned', label: '待出发' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'failed', label: '异常' },
];

export default function CourierWorkbench() {
  useAuth();
  const [tasks, setTasks] = useState<PickupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { courier_id: 'me' };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<any, { data: PaginatedResult<PickupTask> }>('/tasks', { params });
      setTasks(res.data.list || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const handleAction = async (action: string, taskId: number) => {
    try {
      await api.post(`/tasks/${taskId}/${action}`);
      fetchTasks();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const todayCompleted = tasks.filter(t => t.status === 'completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const totalFee = tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.fee, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">我的任务</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">今日完成</div>
            <div className="text-xl font-bold text-gray-800">{todayCompleted}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock size={20} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">进行中</div>
            <div className="text-xl font-bold text-gray-800">{inProgressCount}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <DollarSign size={20} className="text-indigo-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">今日费用</div>
            <div className="text-xl font-bold text-gray-800">¥{totalFee.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={statusFilter === f.key ? 'btn-primary' : 'btn-outline'}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无任务</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map(task => (
            <div key={task.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-indigo-500" />
                  <span className="font-medium text-sm text-gray-800">{task.task_no}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                    {TASK_TYPE_MAP[task.type] || task.type}
                  </span>
                </div>
                <StatusBadge status={task.status} type="task" />
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span>寄件: {task.sender_name}</span>
                  <Phone size={14} className="text-gray-400 ml-2" />
                  <span>{task.sender_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span>收件: {task.receiver_name}</span>
                  <Phone size={14} className="text-gray-400 ml-2" />
                  <span>{task.receiver_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{task.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span>{task.scheduled_time || '无预约时间'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-indigo-600 font-bold">¥{task.fee.toFixed(2)}</span>
                <div className="flex gap-2">
                  {task.status === 'assigned' && (
                    <button className="btn-primary text-xs px-3 py-1.5" onClick={() => handleAction('start', task.id)}>
                      开始执行
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <>
                      <button className="btn-success text-xs px-3 py-1.5" onClick={() => handleAction('complete', task.id)}>
                        完成
                      </button>
                      <button className="btn-danger text-xs px-3 py-1.5" onClick={() => handleAction('fail', task.id)}>
                        异常
                      </button>
                    </>
                  )}
                  {task.status === 'failed' && (
                    <div className="flex items-center gap-1 text-red-500 text-xs">
                      <AlertTriangle size={14} />
                      异常
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
