import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, PlusCircle } from 'lucide-react';
import api from '../services/api';
import TaskCard from '../components/TaskCard';
import { Task, CATEGORY_MAP, PaginatedResult } from '../types';

const categories = ['', ...Object.keys(CATEGORY_MAP)];
const statuses = ['', 'published', 'bidding', 'selected', 'in_progress', 'reviewing', 'completed'];

export default function TaskHall() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTasks();
  }, [category, status, page]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 12 };
      if (search) params.keyword = search;
      if (category) params.category = category;
      if (status) params.status = status;
      const res = await api.get<any, { data: PaginatedResult<Task> }>('/tasks', { params });
      setTasks(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">任务大厅</h1>
        <Link to="/publish" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle size={18} />
          发布需求
        </Link>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">搜索</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索任务标题..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部分类</option>
              {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部状态</option>
              <option value="published">已发布</option>
              <option value="bidding">投标中</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <button type="submit" className="btn-primary py-2 text-sm">
            <Filter size={16} className="mr-1" />
            筛选
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无任务</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages} (共 {total} 条)
              </span>
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
    </div>
  );
}
