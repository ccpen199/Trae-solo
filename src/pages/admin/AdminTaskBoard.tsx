import { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Briefcase,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  Filter,
  Eye,
  Edit,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { TASK_TYPE_LABELS, TASK_STATUS_LABELS } from '../../../shared/types';
import type { Task, TaskStatus } from '../../../shared/types';
import { cn } from '../../lib/utils';

const AdminTaskBoard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [taskBoard, setTaskBoard] = useState<Record<TaskStatus, Task[]>>({} as Record<TaskStatus, Task[]>);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, boardData] = await Promise.all([
          adminApi.getPlatformStats(),
          adminApi.getTaskBoard(statusFilter || undefined),
        ]);
        setStats(statsData);
        setTaskBoard(boardData);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [statusFilter]);

  const statuses: { value: TaskStatus | ''; label: string; color: string }[] = [
    { value: '', label: '全部状态', color: 'bg-slate-100 text-slate-700' },
    { value: 'published', label: '已发布', color: 'bg-blue-100 text-blue-700' },
    { value: 'bidding', label: '招标中', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'selected', label: '已选中', color: 'bg-purple-100 text-purple-700' },
    { value: 'in_progress', label: '进行中', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'submitted', label: '已提交', color: 'bg-orange-100 text-orange-700' },
    { value: 'reviewing', label: '评审中', color: 'bg-pink-100 text-pink-700' },
    { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-700' },
    { value: 'disputed', label: '争议中', color: 'bg-red-100 text-red-700' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">任务状态看板</h2>
          <p className="text-slate-500 mt-1">实时监控平台所有任务状态</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
            className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {statuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">总用户</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm text-slate-500">总任务</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalTasks.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-slate-500">已完成</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.completedTasks.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-500">平台收入</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">¥{stats.platformRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-slate-500">待处理争议</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.pendingDisputes}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-slate-500">待认证</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.pendingVerifications}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(taskBoard).map(([status, tasks]) => {
          const statusInfo = statuses.find(s => s.value === status);
          if (!statusInfo || tasks.length === 0) return null;
          
          return (
            <div key={status} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={cn('px-5 py-4 flex items-center justify-between', statusInfo.color)}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{statusInfo.label}</span>
                  <span className="px-2 py-0.5 bg-white/50 rounded-full text-xs font-medium">
                    {tasks.length}
                  </span>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto space-y-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-800 text-sm line-clamp-1">{task.title}</h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tasks/${task.id}`);
                          }}
                          className="p-1 hover:bg-white rounded"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-white rounded-full text-slate-600">
                        {TASK_TYPE_LABELS[task.type]}
                      </span>
                      <span className="text-xs text-slate-500">
                        ¥{task.budgetMin.toLocaleString()}-{task.budgetMax.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>雇主: {task.employer?.name || '-'}</span>
                      <span>服务商: {task.provider?.name || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTaskBoard;
