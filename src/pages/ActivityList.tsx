import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { activityApi } from '../lib/api';
import type { Activity } from '../../shared/types.js';
import { Plus, Edit, Trash2, Eye, Calendar, Clock } from 'lucide-react';

const statusMap: Record<Activity['status'], { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
  published: { label: '已发布', className: 'bg-green-100 text-green-600' },
  ended: { label: '已结束', className: 'bg-red-100 text-red-600' },
};

export default function ActivityList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<Activity['status'] | ''>('');

  useEffect(() => {
    loadActivities();
  }, [page, statusFilter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await activityApi.getList(page, 10, statusFilter || undefined);
      if (res.data.code === 200) {
        setActivities(res.data.data.items);
        setTotal(res.data.data.total);
      }
    } catch (error) {
      console.error('Load activities failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个活动吗？')) return;
    try {
      await activityApi.delete(id);
      loadActivities();
    } catch (error) {
      console.error('Delete activity failed:', error);
    }
  };

  const handleStatusChange = async (id: number, status: Activity['status']) => {
    try {
      await activityApi.updateStatus(id, status);
      loadActivities();
    } catch (error) {
      console.error('Update status failed:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">活动管理</h1>
          <p className="text-gray-500 mt-1">管理抽奖活动配置</p>
        </div>
        <Link
          to="/activities/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
        >
          <Plus size={18} />
          新建活动
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as Activity['status'] | '');
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="ended">已结束</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无活动数据
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">活动名称</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">主题</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">活动时间</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">创建时间</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map((activity) => {
                  const status = statusMap[activity.status];
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{activity.name}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{activity.description}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{activity.theme}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(activity.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatDate(activity.endTime)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(activity.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/lottery/${activity.id}`}
                            target="_blank"
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="预览活动"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            to={`/activities/${activity.id}/edit`}
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit size={18} />
                          </Link>
                          {activity.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(activity.id, 'published')}
                              className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              发布
                            </button>
                          )}
                          {activity.status === 'published' && (
                            <button
                              onClick={() => handleStatusChange(activity.id, 'ended')}
                              className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              结束
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(activity.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-6 py-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500">共 {total} 条记录</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">第 {page} 页</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 10 >= total}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
