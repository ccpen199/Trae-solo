import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, ArrowRight, Calendar, DollarSign, Users } from 'lucide-react';
import { taskApi } from '../../lib/api';
import { useAuth } from '../../store/authStore';
import { TASK_TYPE_LABELS, TASK_STATUS_LABELS } from '../../../shared/types';
import type { Task, TaskStatus, TaskType } from '../../../shared/types';

const TaskList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<TaskType | ''>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const query: any = { page, pageSize };
        if (statusFilter) query.status = statusFilter;
        if (typeFilter) query.type = typeFilter;
        const data = await taskApi.getList(query);
        setTasks(data.data);
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [page, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-blue-100 text-blue-700 border-blue-200',
      bidding: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      selected: 'bg-purple-100 text-purple-700 border-purple-200',
      in_progress: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      submitted: 'bg-orange-100 text-orange-700 border-orange-200',
      reviewing: 'bg-pink-100 text-pink-700 border-pink-200',
      revising: 'bg-amber-100 text-amber-700 border-amber-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      disputed: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const filteredTasks = tasks.filter(task =>
    !searchKeyword ||
    task.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    task.description.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const statuses: { value: TaskStatus | ''; label: string }[] = [
    { value: '', label: '全部状态' },
    { value: 'published', label: '已发布' },
    { value: 'bidding', label: '招标中' },
    { value: 'selected', label: '已选中' },
    { value: 'in_progress', label: '进行中' },
    { value: 'submitted', label: '已提交' },
    { value: 'reviewing', label: '评审中' },
    { value: 'completed', label: '已完成' },
  ];

  const types: { value: TaskType | ''; label: string }[] = [
    { value: '', label: '全部类型' },
    { value: 'ui_design', label: 'UI设计' },
    { value: 'industrial_design', label: '工业设计' },
    { value: 'animation', label: '动漫设计' },
    { value: 'software', label: '软件开发' },
    { value: 'trademark', label: '商标注册' },
    { value: 'copywriting', label: '文案策划' },
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
          <h2 className="text-2xl font-bold text-slate-800">需求任务</h2>
          <p className="text-slate-500 mt-1">共 {total} 个任务</p>
        </div>
        {user?.role === 'employer' && (
          <button
            onClick={() => navigate('/tasks/publish')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            发布需求
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索任务标题或描述..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TaskType | '')}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => navigate(`/tasks/${task.id}`)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {TASK_TYPE_LABELS[task.type]}
                      </span>
                      {task.tags?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-2">{task.description}</p>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-xl font-bold text-slate-800">
                      ¥{task.budgetMin.toLocaleString()}
                      <span className="text-slate-400 text-base font-normal">
                        {' - '}{task.budgetMax.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500 mt-1">预算区间</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {task.durationDays} 天周期
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      {task.finalBudget ? `已确定 ¥${task.finalBudget.toLocaleString()}` : '待确定'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {task.bids?.length || 0} 人投标
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                    查看详情 <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无任务</h3>
            <p className="text-slate-500 mb-6">
              {user?.role === 'employer'
                ? '发布您的第一个创意需求，寻找专业服务商'
                : '浏览平台需求，投递您的方案'}
            </p>
            {user?.role === 'employer' && (
              <button
                onClick={() => navigate('/tasks/publish')}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                立即发布
              </button>
            )}
          </div>
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-slate-600">
            {page} / {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
