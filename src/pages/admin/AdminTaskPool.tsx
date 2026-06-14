import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Edit2, Trash2, Search, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { get, post, put } from '../../utils/request';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  reward: number;
  dailyLimit: number;
  maxProgress: number;
  status: string;
  sortOrder: number;
}

const AdminTaskPool = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'content',
    type: 'custom',
    reward: 10,
    dailyLimit: 1,
    maxProgress: 1,
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res: any = await get('/admin/tasks/pool');
      if (res.success) {
        setTasks(res.tasks);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      category: 'content',
      type: 'custom',
      reward: 10,
      dailyLimit: 1,
      maxProgress: 1,
    });
    setShowModal(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      type: task.type,
      reward: task.reward,
      dailyLimit: task.dailyLimit,
      maxProgress: task.maxProgress,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      alert('请输入任务标题');
      return;
    }

    try {
      if (editingTask) {
        // Update task
        const res: any = await put(`/admin/tasks/${editingTask.id}/status`, { status: 'active' });
        if (res.success) {
          loadTasks();
        }
      } else {
        const res: any = await post('/admin/tasks', formData);
        if (res.success) {
          loadTasks();
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'active' ? 'inactive' : 'active';
    try {
      const res: any = await put(`/admin/tasks/${task.id}/status`, { status: newStatus });
      if (res.success) {
        loadTasks();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      task.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const categories = [
    { value: 'content', label: '内容消费' },
    { value: 'health', label: '健康打卡' },
    { value: 'fashion', label: '穿搭测评' },
    { value: 'invite', label: '邀请任务' },
  ];

  return (
    <AdminLayout title="任务池调度">
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索任务..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <Settings size={16} />
              调度配置
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-primary-600 transition-colors"
            >
              <Plus size={16} />
              新建任务
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    任务
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    奖励
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    每日上限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
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
                      暂无任务
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{task.title}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                          {categories.find((c) => c.value === task.category)?.label || task.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-yellow-600">{task.reward} 金币</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{task.dailyLimit} 次</td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleStatus(task)}>
                          {task.status === 'active' ? (
                            <ToggleRight size={28} className="text-green-500" />
                          ) : (
                            <ToggleLeft size={28} className="text-gray-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(task)}
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingTask ? '编辑任务' : '新建任务'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">任务标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入任务标题"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">任务描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入任务描述"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">奖励金币</label>
                  <input
                    type="number"
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">每日上限</label>
                  <input
                    type="number"
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">目标进度</label>
                  <input
                    type="number"
                    value={formData.maxProgress}
                    onChange={(e) => setFormData({ ...formData, maxProgress: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTaskPool;
