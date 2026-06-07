import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, CheckCircle, AlertTriangle, FileText, XCircle, Eye } from 'lucide-react';
import { applicationApi } from '../api';
import { Application } from '../types';

const Applications: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await applicationApi.getStats();
        if (res.success) {
          const mineData = res.data?.mine || res.data?.all || [];
          const statsMap: any = { total: 0, processing: 0, completed: 0, draft: 0, submitted: 0, reviewing: 0, approved: 0, rejected: 0 };
          for (const item of mineData) {
            statsMap[item.status] = item.count;
            statsMap.total += item.count;
          }
          setStats(statsMap);
        }
      } catch (e) {
        console.error('Load stats error:', e);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      try {
        const res = await applicationApi.getMyApplications({
          status: statusFilter || undefined,
          page,
          pageSize,
        });
        if (res.success) {
          setApplications(res.data || []);
          setTotal(res.total || 0);
        }
      } catch (e) {
        console.error('Load applications error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, [statusFilter, page]);

  const statusConfig = {
    draft: {
      label: '草稿',
      color: 'bg-gray-100 text-gray-600',
      icon: FileText,
    },
    submitted: {
      label: '已提交',
      color: 'bg-blue-100 text-blue-600',
      icon: Clock,
    },
    processing: {
      label: '审批中',
      color: 'bg-yellow-100 text-yellow-600',
      icon: Clock,
    },
    approved: {
      label: '已批准',
      color: 'bg-green-100 text-green-600',
      icon: CheckCircle,
    },
    rejected: {
      label: '已驳回',
      color: 'bg-red-100 text-red-600',
      icon: XCircle,
    },
    completed: {
      label: '已完成',
      color: 'bg-green-100 text-green-600',
      icon: CheckCircle,
    },
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: '全部办件', value: stats?.total || 0, color: 'bg-blue-500' },
          { label: '草稿', value: stats?.draft || 0, color: 'bg-gray-500' },
          { label: '审批中', value: stats?.processing || 0, color: 'bg-yellow-500' },
          { label: '已完成', value: stats?.completed || 0, color: 'bg-green-500' },
          { label: '已驳回', value: stats?.rejected || 0, color: 'bg-red-500' },
        ].map((item, index) => (
          <div key={index} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
              <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center opacity-10`}>
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索办件编号、事项名称..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-64"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              搜索
            </button>
          </form>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {[
              { key: '', label: '全部' },
              { key: 'draft', label: '草稿' },
              { key: 'submitted', label: '已提交' },
              { key: 'processing', label: '审批中' },
              { key: 'approved', label: '已批准' },
              { key: 'rejected', label: '已驳回' },
              { key: 'completed', label: '已完成' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-primary-100 text-primary-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无办件记录</p>
            <button
              onClick={() => navigate('/services')}
              className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              去办事
            </button>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">办件编号</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">事项名称</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">当前状态</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">当前环节</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">申请时间</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.submitted;
                  const StatusIcon = status.icon;
                  return (
                    <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <p className="text-sm font-mono text-gray-900">{app.applicationNo}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-900">{app.serviceItemName}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${status.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-600">{app.currentNode}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-500">
                          {new Date(app.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => navigate(`/applications/${app.id}`)}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {total > pageSize && (
              <div className="flex items-center justify-center py-4 border-t border-gray-100 space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">
                  第 {page} / {Math.ceil(total / pageSize)} 页，共 {total} 条
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Applications;
