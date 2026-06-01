import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import { Plus, Eye, FileText, Trash2 } from 'lucide-react';

export default function Demands() {
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadDemands();
  }, [page]);

  const loadDemands = async () => {
    setLoading(true);
    try {
      const res = user?.role === 'buyer'
        ? await api.demands.my({ page, limit: 10 })
        : await api.demands.list({ status: 'published', page, limit: 10 });
      setDemands(res.data?.list || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error('加载需求失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此需求吗？')) return;
    try {
      await api.demands.delete(id);
      loadDemands();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await api.demands.publish(id);
      loadDemands();
    } catch (err: any) {
      alert(err.message || '发布失败');
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    published: { label: '已发布', color: 'bg-blue-100 text-blue-600' },
    quoted: { label: '已报价', color: 'bg-purple-100 text-purple-600' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'buyer' ? '我的需求' : '需求大厅'}
        </h1>
        {user?.role === 'buyer' && (
          <Link
            to="/demands/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            发布需求
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : demands.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">暂无需求数据</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">需求标题</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">行业</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">地区</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">浏览次数</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">创建时间</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {demands.map((demand) => {
                  const status = statusMap[demand.status] || statusMap.draft;
                  return (
                    <tr key={demand.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{demand.title}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{demand.industry || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{demand.region || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{demand.view_count || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(demand.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/demands/${demand.id}`}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="查看详情"
                          >
                            <Eye size={16} />
                          </Link>
                          {user?.role === 'buyer' && demand.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handlePublish(demand.id)}
                                className="text-green-600 hover:text-green-700 p-1"
                                title="发布"
                              >
                                <Plus size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(demand.id)}
                                className="text-red-600 hover:text-red-700 p-1"
                                title="删除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {total > 10 && (
              <div className="px-6 py-4 border-t flex justify-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <span className="text-gray-600">第 {page} 页</span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={demands.length < 10}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
