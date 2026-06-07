import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const CATEGORY_LABELS = {
  all: '全部',
  survey: '问卷调研',
  video: '视频观看',
  promotion: '地推打卡',
  blessing: '祝福征集',
};

const CATEGORY_COLORS = {
  survey: { bg: 'bg-blue-100', text: 'text-blue-600' },
  video: { bg: 'bg-purple-100', text: 'text-purple-600' },
  promotion: { bg: 'bg-green-100', text: 'text-green-600' },
  blessing: { bg: 'bg-pink-100', text: 'text-pink-600' },
};

const SORT_OPTIONS = [
  { value: 'latest', label: '最新发布' },
  { value: 'reward', label: '赏金最高' },
  { value: 'slots', label: '名额最多' },
];

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    loadTasks();
  }, [category, page, sort]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (category !== 'all') params.category = category;
      if (sort !== 'latest') params.sort = sort;
      const data = await api.tasks.list(params);
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  const getBadgeColors = (cat) =>
    CATEGORY_COLORS[cat] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const visible = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
    );
    let prev = 0;
    visible.forEach((p) => {
      if (p - prev > 1) pages.push({ type: 'ellipsis', key: `e${prev}` });
      pages.push({ type: 'page', value: p, key: p });
      prev = p;
    });
    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          上一页
        </button>
        {pages.map((item) =>
          item.type === 'ellipsis' ? (
            <span key={item.key} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={item.key}
              onClick={() => setPage(item.value)}
              className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                page === item.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.value}
            </button>
          )
        )}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          下一页
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">任务大厅</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setCategory(key);
              setPage(1);
            }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              category === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm text-gray-500">排序:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setSort(opt.value);
              setPage(1);
            }}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${
              sort === opt.value
                ? 'text-blue-600 font-medium bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400">
          共 {total} 个任务
        </span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-gray-500">暂无符合条件的任务</p>
          <p className="text-gray-400 text-sm mt-1">试试切换分类或调整筛选条件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const badge = getBadgeColors(task.category);
            const progress =
              task.total_count > 0
                ? Math.round((task.accepted_count / task.total_count) * 100)
                : 0;
            return (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1 mr-2 line-clamp-1">
                    {task.title}
                  </h3>
                  <span
                    className={`${badge.bg} ${badge.text} text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap`}
                  >
                    {CATEGORY_LABELS[task.category] || task.category}
                  </span>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold text-orange-500">
                    {task.reward}
                  </span>
                  <span className="text-sm text-orange-400">元/单</span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>
                      进度 {task.accepted_count}/{task.total_count}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>剩余 {task.remaining_count} 名额</span>
                    <span>{task.publisher_name}</span>
                  </div>
                  <Link
                    to={`/tasks/${task.id}`}
                    className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    立即接单
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {renderPagination()}
    </div>
  );
}
