import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  ClipboardList,
  Plus
} from 'lucide-react';
import { useApplicationStore, useUserStore } from '@/store';
import { statusLabels, statusColors } from '@/components/Layout';

export default function Home() {
  const { statistics, fetchApplications, fetchStatistics, applications } = useApplicationStore();
  const { currentUser } = useUserStore();
  const [recentApplications, setRecentApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchStatistics();
    fetchApplications({ limit: 5 });
  }, []);

  useEffect(() => {
    setRecentApplications(applications.slice(0, 5));
  }, [applications]);

  const statsCards = [
    {
      label: '待处理',
      value: statistics.pending || 0,
      color: 'bg-yellow-500',
      icon: Clock
    },
    {
      label: '核保中',
      value: statistics.underwriting || 0,
      color: 'bg-blue-500',
      icon: ClipboardList
    },
    {
      label: '已通过',
      value: (statistics.approved || 0) + (statistics.rated || 0) + (statistics.excluded || 0),
      color: 'bg-green-500',
      icon: CheckCircle
    },
    {
      label: '已拒保',
      value: statistics.rejected || 0,
      color: 'bg-red-500',
      icon: AlertTriangle
    }
  ];

  const quickActions = [
    { label: '新建投保单', path: '/applications/new', icon: Plus, color: 'bg-blue-500' },
    { label: '核保队列', path: '/applications', icon: ClipboardList, color: 'bg-purple-500' },
    { label: '核保规则', path: '/rules', icon: FileText, color: 'bg-green-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            欢迎回来，{currentUser?.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/applications/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建投保单
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">最近投保单</h2>
            <Link to="/applications" className="text-sm text-blue-600 hover:text-blue-700">
              查看全部 →
            </Link>
          </div>
          {recentApplications.length > 0 ? (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {app.application_no}
                      </p>
                      <p className="text-sm text-gray-500">
                        {app.customer_name} · {app.product_name} · {app.coverage_amount?.toLocaleString()} 元
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[app.status]}`}>
                      {statusLabels[app.status]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(app.submitted_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无投保单数据</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.path}
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className={`${action.color} p-2 rounded-lg mr-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 mr-2" />
              <h3 className="font-semibold">今日核保统计</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">处理单数</span>
                <span className="font-bold text-xl">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">通过率</span>
                <span className="font-bold text-xl">75%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100">平均耗时</span>
                <span className="font-bold text-xl">8.5 分钟</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
