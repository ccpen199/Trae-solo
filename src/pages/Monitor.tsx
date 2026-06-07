import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  Zap,
  Server,
  Activity,
  FileText,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { metricsApi } from '../api';

const COLORS = ['#0052D9', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1', '#14C9C9'];

const Monitor: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [overviewRes, trendRes, deptRes, bottleneckRes] = await Promise.all([
          metricsApi.getOverview(),
          metricsApi.getDailyTrend({ days: 7 }),
          metricsApi.getDepartmentStats(),
          metricsApi.getBottlenecks(),
        ]);

        if (overviewRes.success) setOverview(overviewRes.data);
        if (trendRes.success) setTrend(trendRes.data || []);
        if (deptRes.success) setDepartmentStats(deptRes.data || []);
        if (bottleneckRes.success) setBottlenecks(bottleneckRes.data || []);
      } catch (e) {
        console.error('Load monitor data error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">服务效能监测平台</h2>
            <p className="text-primary-100">
              实时监控全省政务服务运行态势，超期预警、堵点分析、NPS满意度监测
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-400 animate-pulse" />
            <span className="text-sm text-green-300">实时监控中</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: '今日办件量',
            value: overview?.totalApplications || 0,
            icon: FileText,
            trend: '+12.5%',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: '平均办理时长',
            value: `${overview?.averageHandlingTime || 0}小时`,
            icon: Clock,
            trend: '-8.2%',
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: '超期预警',
            value: overview?.overWarningCount || 0,
            icon: AlertTriangle,
            trend: '需关注',
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
          {
            label: '用户满意度NPS',
            value: `${overview?.npsScore || 0}分`,
            icon: Users,
            trend: '+3.1',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className={`text-xs font-medium ${item.color}`}>{item.trend}</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">7日办件趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0052D9"
                  strokeWidth={2}
                  dot={{ fill: '#0052D9' }}
                  name="办件量"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#00B42A"
                  strokeWidth={2}
                  dot={{ fill: '#00B42A' }}
                  name="办结量"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">部门办件分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {departmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">各部门办理效率对比</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgTime" fill="#0052D9" name="平均时长(小时)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="count" fill="#00B42A" name="办件量" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">堵点预警</h3>
          <div className="space-y-3">
            {bottlenecks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无堵点</p>
              </div>
            ) : (
              bottlenecks.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    item.level === 'high'
                      ? 'bg-red-50 border-red-200'
                      : item.level === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{item.nodeName}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        item.level === 'high'
                          ? 'bg-red-100 text-red-600'
                          : item.level === 'medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.level === 'high' ? '高风险' : item.level === 'medium' ? '中风险' : '低风险'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.department}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">等待件数：{item.waitingCount}</span>
                    <span className="text-gray-500">平均耗时：{item.avgTime}小时</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">API资源调用监控</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Server className="w-4 h-4 mr-2" />
            全省政务数据资源目录中枢
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">接口名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">所属部门</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">调用频次</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">平均响应</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">错误率</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody>
              {overview?.apiResources?.map((api: any, index: number) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">{api.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{api.department}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{api.callCount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{api.avgResponseTime}ms</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-sm ${
                        api.errorRate > 1 ? 'text-red-600' : api.errorRate > 0.1 ? 'text-yellow-600' : 'text-green-600'
                      }`}
                    >
                      {api.errorRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        api.status === 'healthy'
                          ? 'bg-green-100 text-green-600'
                          : api.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {api.status === 'healthy' ? '正常' : api.status === 'warning' ? '警告' : '异常'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Monitor;
