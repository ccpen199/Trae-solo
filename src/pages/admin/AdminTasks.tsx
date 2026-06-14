import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AlertTriangle, Check, X, Search, Filter } from 'lucide-react';
import { get, post } from '../../utils/request';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  reward: number;
  status: string;
  sensitiveResult?: {
    hasSensitive: boolean;
    words: string[];
    filtered: string;
  };
  createdAt: string;
}

const AdminTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      if (filter === 'pending') {
        const res: any = await get('/admin/tasks/pending');
        if (res.success) {
          setTasks(res.tasks);
        }
      } else {
        const res: any = await get('/admin/tasks/pool');
        if (res.success) {
          setTasks(res.tasks);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId: string) => {
    try {
      const res: any = await post(`/admin/tasks/${taskId}/approve`);
      if (res.success) {
        loadTasks();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (taskId: string) => {
    const reason = prompt('请输入拒绝原因：');
    if (reason === null) return;
    try {
      const res: any = await post(`/admin/tasks/${taskId}/reject`, { reason: reason || '不符合要求' });
      if (res.success) {
        loadTasks();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: '待审核',
      active: '已上线',
      rejected: '已拒绝',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      task.description.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <AdminLayout title="任务审核">
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索任务..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="active">已上线</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    任务信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    奖励
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    敏感词检测
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{task.title}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{task.category}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-yellow-600">{task.reward} 金币</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                      <td className="px-6 py-4">
                        {task.sensitiveResult?.hasSensitive ? (
                          <div className="flex items-center gap-1 text-red-500 text-sm">
                            <AlertTriangle size={14} />
                            <span>包含敏感词: {task.sensitiveResult.words.join(', ')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-500 text-sm">
                            <Check size={14} />
                            <span>正常</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {task.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(task.id)}
                              className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                            >
                              <Check size={14} />
                              通过
                            </button>
                            <button
                              onClick={() => handleReject(task.id)}
                              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                            >
                              <X size={14} />
                              拒绝
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTasks;
