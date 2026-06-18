import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { useGet } from '../../hooks/useApi';
import Card from '../../components/Card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Grid, AppealCluster } from '../../../shared/types';

const tabs = [
  { path: 'population', icon: Users, label: '人口画像', desc: '辖区人口结构分析' },
  { path: 'appeals', icon: MessageSquare, label: '诉求聚类', desc: '高频诉求智能分析' },
  { path: 'grid', icon: MapPin, label: '网格事件', desc: '事件闭环跟踪管理' },
];

const STATUS_COLORS = ['#165DFF', '#FF7D00', '#00B42A', '#F53F3F', '#86909C'];

export default function GovernanceDashboard() {
  const location = useLocation();
  const isRoot = location.pathname === '/governance';

  const { data: overview } = useGet<any>(
    ['governance-overview'],
    '/governance/overview',
    { refetchInterval: 30000 }
  );

  const { data: grids } = useGet<Grid[]>(
    ['governance-grids'],
    '/governance/grids'
  );

  const { data: appealsData } = useGet<{ clusters: AppealCluster[]; summary: any }>(
    ['governance-appeals'],
    '/governance/appeals'
  );

  if (!isRoot) {
    return <Outlet />;
  }

  const pieData = overview?.eventStats ? [
    { name: '已上报', value: overview.eventStats.reported, color: '#165DFF' },
    { name: '已分派', value: overview.eventStats.assigned, color: '#FF7D00' },
    { name: '处理中', value: overview.eventStats.processing, color: '#F7BA1E' },
    { name: '已解决', value: overview.eventStats.resolved, color: '#00B42A' },
    { name: '已结案', value: overview.eventStats.closed, color: '#86909C' },
  ] : [];

  const barData = overview?.typeStats?.map((t: any) => ({
    name: t.type,
    count: t.count,
  })) || [];

  const priorityData = overview?.priorityStats?.map((p: any) => ({
    name: p.priority === 'high' ? '高' : p.priority === 'medium' ? '中' : '低',
    count: p.count,
    color: p.priority === 'high' ? '#F53F3F' : p.priority === 'medium' ? '#FF7D00' : '#00B42A',
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <Card.Body>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">基层治理驾驶舱</h2>
              <p className="text-sm text-gray-500">
                辖区人口画像 · 高频诉求聚类 · 网格事件闭环跟踪
                {overview?.updateTime && (
                  <span className="ml-2 text-xs text-gray-400">
                    数据更新于 {new Date(overview.updateTime).toLocaleString('zh-CN')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Body className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">管辖网格</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.totalGrids || 0}</p>
                <p className="text-xs text-gray-400 mt-1">个社区网格</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">服务人口</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overview?.totalPopulation?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  同比增长 2.3%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">30天事件</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.eventStats?.total || 0}</p>
                <p className="text-xs text-gray-400 mt-1">
                  解决率 {overview?.eventStats ? Math.round((overview.eventStats.resolved / overview.eventStats.total) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">待处理</p>
                <p className="text-3xl font-bold text-red-600">
                  {(overview?.eventStats?.reported || 0) + (overview?.eventStats?.assigned || 0) + (overview?.eventStats?.processing || 0)}
                </p>
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  需及时处理
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <Link key={tab.path} to={tab.path}>
            <Card hover className="h-full">
              <Card.Body className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      tab.path === 'population' ? 'bg-blue-100 text-blue-600' :
                      tab.path === 'appeals' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <tab.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tab.label}</h3>
                      <p className="text-sm text-gray-500">{tab.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card.Body>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">事件状态分布</h3>
          </Card.Header>
          <Card.Body>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">事件类型分布（近30天）</h3>
          </Card.Header>
          <Card.Body>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#165DFF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">事件优先级分布（近7天）</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {priorityData.map((item: any, idx: number) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.name}优先级</span>
                    <span className="font-medium" style={{ color: item.color }}>{item.count} 件</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${(item.count / (priorityData.reduce((s: number, i: any) => s + i.count, 0) || 1)) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">网格概览</h3>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-gray-100 max-h-72 overflow-auto">
              {grids?.map((grid) => (
                <div key={grid.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {grid.code}
                        </span>
                        <h4 className="font-medium text-gray-900">{grid.name}</h4>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {grid.area} · {grid.population.toLocaleString()}人 · {grid.households}户
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{grid.eventCount}</span> 件事件
                      </p>
                      <p className="text-xs text-red-500">
                        {grid.unresolvedCount} 件待处理
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900">高频诉求 TOP5</h3>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">诉求类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">趋势</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均解决时长</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">满意度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">热点词</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appealsData?.clusters?.slice(0, 5).map((cluster, idx) => (
                  <tr key={cluster.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{cluster.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{cluster.count}</span>
                      <span className="text-xs text-gray-400 ml-1">({cluster.percentage}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-sm ${
                        cluster.trend === 'up' ? 'text-red-600' :
                        cluster.trend === 'down' ? 'text-green-600' :
                        'text-gray-500'
                      }`}>
                        {cluster.trend === 'up' ? '↑' : cluster.trend === 'down' ? '↓' : '→'}
                        {Math.abs(cluster.trendValue)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {cluster.avgResolutionTime} 小时
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${cluster.satisfactionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{cluster.satisfactionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {cluster.hotWords.map((word, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            {word}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
}
