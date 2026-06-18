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
  UserCheck,
  GraduationCap,
  Briefcase,
  User,
  ArrowRight,
  UserPlus,
  FileCheck,
} from 'lucide-react';
import { useGet, useGetPaginated } from '../../hooks/useApi';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
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
import type { PopulationProfile, AppealCluster, GridEvent } from '../../../shared/types';

const tabs = [
  { path: 'population', icon: Users, label: '人口画像', desc: '辖区人口结构分析', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-100', text: 'text-blue-600' },
  { path: 'appeals', icon: MessageSquare, label: '诉求聚类', desc: '高频诉求智能分析', gradient: 'from-purple-500 to-violet-500', bg: 'bg-purple-100', text: 'text-purple-600' },
  { path: 'grid', icon: MapPin, label: '网格事件', desc: '事件闭环跟踪管理', gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-100', text: 'text-orange-600' },
];

const periodTabs = [
  { value: 'day', label: '日', active: false },
  { value: 'week', label: '周', active: true },
  { value: 'month', label: '月', active: false },
];

const agePyramidData = [
  { range: '0-18', male: 1820, female: 1720 },
  { range: '19-35', male: 4520, female: 4380 },
  { range: '36-50', male: 5180, female: 5020 },
  { range: '51-60', male: 2380, female: 2420 },
  { range: '60+', male: 3560, female: 3786 },
];

const closedLoopTracking = [
  {
    id: 'evt-001',
    title: '思明南路路灯故障',
    grid: '镇海网格',
    steps: [
      { action: '上报', operator: '市民热线', time: '06-18 08:32', icon: UserPlus },
      { action: '分派', operator: '网格调度中心', time: '06-18 08:45', icon: ArrowRight },
      { action: '处理', operator: '市政工程队', time: '06-18 09:20', icon: FileCheck },
      { action: '解决', operator: '现场确认', time: '06-18 10:15', icon: CheckCircle },
      { action: '结案', operator: '网格员审核', time: '06-18 11:00', icon: UserCheck },
    ],
  },
  {
    id: 'evt-002',
    title: '辖区内共享单车乱停放',
    grid: '文安网格',
    steps: [
      { action: '上报', operator: '网格员巡查', time: '06-18 09:10', icon: UserPlus },
      { action: '分派', operator: '网格调度中心', time: '06-18 09:25', icon: ArrowRight },
      { action: '处理', operator: '城管执法队', time: '06-18 10:00', icon: FileCheck },
      { action: '解决', operator: '现场清理', time: '06-18 10:45', icon: CheckCircle },
      { action: '结案', operator: '待审核', time: '进行中', icon: Clock },
    ],
  },
  {
    id: 'evt-003',
    title: '居民小区电梯故障',
    grid: '霞溪网格',
    steps: [
      { action: '上报', operator: '物业上报', time: '06-18 07:50', icon: UserPlus },
      { action: '分派', operator: '网格调度中心', time: '06-18 08:00', icon: ArrowRight },
      { action: '处理', operator: '电梯维保公司', time: '06-18 08:30', icon: FileCheck },
      { action: '解决', operator: '进行中', time: '处理中', icon: Clock },
    ],
  },
];

const STATUS_COLORS = ['#165DFF', '#FF7D00', '#F7BA1E', '#00B42A', '#86909C'];

export default function GovernanceDashboard() {
  const location = useLocation();
  const isRoot = location.pathname === '/governance';

  const { data: overview } = useGet<any>(
    ['governance-overview-desk'],
    '/governance/overview',
    { refetchInterval: 30000 }
  );

  const { data: population } = useGet<PopulationProfile>(
    ['governance-population-desk'],
    '/governance/population'
  );

  const { data: appealsData } = useGet<{ clusters: AppealCluster[]; summary: any }>(
    ['governance-appeals-desk'],
    '/governance/appeals'
  );

  const { data: eventsData } = useGetPaginated<GridEvent>(
    ['governance-events-desk'],
    '/governance/grid/events?pageSize=50'
  );

  if (!isRoot) {
    return <Outlet />;
  }

  const totalGrids = overview?.totalGrids ?? 8;
  const totalPopulation = overview?.totalPopulation ?? 32526;
  const eventStatsTotal = overview?.eventStats?.total ?? 312;
  const eventReported = overview?.eventStats?.reported ?? 12;
  const eventAssigned = overview?.eventStats?.assigned ?? 18;
  const eventProcessing = overview?.eventStats?.processing ?? 45;
  const eventResolved = overview?.eventStats?.resolved ?? 187;
  const eventClosed = overview?.eventStats?.closed ?? 50;
  const pendingCount = eventReported + eventAssigned + eventProcessing;
  const resolvedRate = eventStatsTotal > 0 ? Math.round(((eventResolved + eventClosed) / eventStatsTotal) * 100) : 92;

  const pieData = [
    { name: '已上报', value: eventReported, color: '#165DFF' },
    { name: '已分派', value: eventAssigned, color: '#FF7D00' },
    { name: '处理中', value: eventProcessing, color: '#F7BA1E' },
    { name: '已解决', value: eventResolved, color: '#00B42A' },
    { name: '已结案', value: eventClosed, color: '#86909C' },
  ];

  const barData = overview?.typeStats?.slice(0, 6).map((t: any) => ({
    name: t.type,
    count: t.count,
  })) || [
    { name: '环境卫生', count: 78 },
    { name: '市政设施', count: 65 },
    { name: '治安管理', count: 52 },
    { name: '邻里纠纷', count: 45 },
    { name: '违章搭建', count: 38 },
    { name: '其他', count: 34 },
  ];

  const ageDist0_18 = population?.ageDistribution?.find(a => a.range.includes('0-18') || a.range.includes('未成年'))?.percentage ?? 11;
  const ageDist60_plus = population?.ageDistribution?.find(a => a.range.includes('60') || a.range.includes('老年'))?.percentage ?? 22.3;
  const totalAppeals = appealsData?.summary?.totalAppeals ?? 1286;
  const topAppealCategory = appealsData?.clusters?.[0]?.category ?? '环境卫生';
  const avgSatisfaction = appealsData?.summary?.overallSatisfaction ?? 94.2;
  const inProgressEvents = eventProcessing + eventAssigned;
  const avgResolutionHours = 8.5;

  const statsCards = [
    { icon: Users, label: '常住人口', value: 32526, subValue: '3.25万', gradient: 'from-blue-500 to-cyan-500', emoji: '👥' },
    { icon: UserCheck, label: '户籍人口', value: 20125, subValue: '61.8%', gradient: 'from-emerald-500 to-green-500', emoji: '🏠' },
    { icon: GraduationCap, label: '大专以上', value: 11382, subValue: '35%', gradient: 'from-violet-500 to-purple-500', emoji: '🎓' },
    { icon: Briefcase, label: '就业人口', value: 22661, subValue: '就业率 91.5%', gradient: 'from-amber-500 to-orange-500', emoji: '💼' },
    { icon: User, label: '老龄化率', value: '22.3%', subValue: '深度老龄化', gradient: 'from-rose-500 to-pink-500', emoji: '👴' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <Card.Body>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">基层治理驾驶舱</h2>
                <p className="text-sm text-gray-500">
                  思明区中华街道 · 实时数据
                  {overview?.updateTime && (
                    <span className="ml-2 text-xs text-gray-400">
                      更新于 {new Date(overview.updateTime).toLocaleString('zh-CN')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
              {periodTabs.map((tab) => (
                <button
                  key={tab.value}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    tab.active
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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
                <p className="text-3xl font-bold text-gray-900 tabular-nums">{totalGrids}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  ↑ 1 新建
                </p>
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
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {totalPopulation.toLocaleString()}
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
                <p className="text-sm text-gray-500 mb-1">近30天事件</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">{eventStatsTotal}</p>
                <p className="text-xs text-gray-400 mt-1">
                  结案率 {resolvedRate}%
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
                <p className="text-3xl font-bold text-red-600 tabular-nums">
                  {pendingCount}
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
            <Card hover className="h-full overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${tab.gradient}`} />
              <Card.Body className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${tab.bg} ${tab.text}`}>
                      <tab.icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{tab.label}</h3>
                      <p className="text-sm text-gray-500 mb-3">{tab.desc}</p>
                      <div className="text-xs text-gray-600 space-y-1">
                        {tab.path === 'population' && (
                          <>
                            <p>常住人口 <span className="font-semibold text-gray-900">{(totalPopulation / 10000).toFixed(2)}万</span></p>
                            <p>0-18岁 <span className="text-blue-600">{ageDist0_18}%</span> · 60+岁 <span className="text-rose-600">{ageDist60_plus}%</span></p>
                          </>
                        )}
                        {tab.path === 'appeals' && (
                          <>
                            <p>诉求总量 <span className="font-semibold text-gray-900">{totalAppeals}</span></p>
                            <p>高频TOP1 <span className="text-purple-600 font-medium">{topAppealCategory}</span> · 满意度 <span className="text-green-600">{avgSatisfaction}%</span></p>
                          </>
                        )}
                        {tab.path === 'grid' && (
                          <>
                            <p>进行中 <span className="font-semibold text-primary">{inProgressEvents}</span> 件</p>
                            <p>已结案率 <span className="text-green-600">{resolvedRate}%</span> · 平均处理 <span className="text-gray-700">{avgResolutionHours}h</span></p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
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
                  <YAxis dataKey="name" type="category" width={80} fontSize={12} />
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
            <h3 className="font-semibold text-gray-900">辖区人口画像核心看板</h3>
            <p className="text-xs text-gray-400 mt-1">基于第七次全国人口普查数据模型</p>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4 text-center">年龄金字塔</h4>
                <div className="space-y-3">
                  {agePyramidData.map((item, idx) => {
                    const totalMax = 6000;
                    const maleWidth = (item.male / totalMax) * 100;
                    const femaleWidth = (item.female / totalMax) * 100;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-14 text-xs text-gray-500 text-right tabular-nums">
                          {item.male}
                        </div>
                        <div className="flex-1 flex items-center justify-end h-6 bg-blue-50 rounded-l-md overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-l from-blue-500 to-blue-400 rounded-l-md transition-all"
                            style={{ width: `${maleWidth}%` }}
                          />
                        </div>
                        <div className="w-12 text-center text-xs font-medium text-gray-600 flex-shrink-0">
                          {item.range}
                        </div>
                        <div className="flex-1 flex items-center h-6 bg-pink-50 rounded-r-md overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-r-md transition-all"
                            style={{ width: `${femaleWidth}%` }}
                          />
                        </div>
                        <div className="w-14 text-xs text-gray-500 tabular-nums">
                          {item.female}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-blue-500" />
                    男性
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-pink-500" />
                    女性
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {statsCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl bg-gradient-to-r ${card.gradient} text-white relative overflow-hidden`}
                  >
                    <div className="absolute right-3 top-3 text-2xl opacity-20">{card.emoji}</div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <card.icon className="w-4 h-4" />
                        <span className="text-xs font-medium opacity-90">{card.label}</span>
                      </div>
                      <div className="text-2xl font-bold tabular-nums">
                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                      </div>
                      <div className="text-xs opacity-80 mt-0.5">{card.subValue}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">高频诉求 TOP 5</h3>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">类别</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">数量</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">环比</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">处理时效</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">满意度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(appealsData?.clusters?.slice(0, 5) ?? [
                    { id: '1', category: '环境卫生', count: 328, trend: 'up' as const, trendValue: 12.5, avgResolutionTime: 6.2, satisfactionRate: 92 },
                    { id: '2', category: '市政设施', count: 256, trend: 'down' as const, trendValue: 5.8, avgResolutionTime: 8.5, satisfactionRate: 88 },
                    { id: '3', category: '治安管理', count: 198, trend: 'stable' as const, trendValue: 0.5, avgResolutionTime: 4.2, satisfactionRate: 96 },
                    { id: '4', category: '邻里纠纷', count: 167, trend: 'up' as const, trendValue: 8.3, avgResolutionTime: 12.5, satisfactionRate: 85 },
                    { id: '5', category: '违章搭建', count: 132, trend: 'down' as const, trendValue: 15.2, avgResolutionTime: 24.8, satisfactionRate: 82 },
                  ]).map((cluster, idx) => (
                    <tr key={cluster.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-200 text-gray-700' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-900 text-sm">{cluster.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        <span className="text-gray-900 font-medium">{cluster.count}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                          cluster.trend === 'up' ? 'text-red-600' :
                          cluster.trend === 'down' ? 'text-green-600' :
                          'text-gray-500'
                        }`}>
                          {cluster.trend === 'up' ? '↑' : cluster.trend === 'down' ? '↓' : '→'}
                          {Math.abs(cluster.trendValue)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-600">
                        {cluster.avgResolutionTime}h
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                cluster.satisfactionRate >= 90 ? 'bg-green-500' :
                                cluster.satisfactionRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${cluster.satisfactionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 tabular-nums w-9">{cluster.satisfactionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">网格事件闭环追踪</h3>
            <span className="text-xs text-gray-400">最近 3 件事件完整流程</span>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-6">
            {closedLoopTracking.map((event) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                      {event.grid}
                    </span>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                  </div>
                  <StatusBadge
                    status={event.steps.length >= 5 && event.steps[4].action === '结案' ? 'success' : event.steps.length >= 4 ? 'processing' : 'pending'}
                    text={event.steps.length >= 5 && event.steps[4].action === '结案' ? '已结案' : event.steps.length >= 4 ? '处理中' : '进行中'}
                  />
                </div>
                <div className="flex flex-wrap items-start gap-1">
                  {event.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-start flex-1 min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          stepIdx === event.steps.length - 1 && step.action !== '结案'
                            ? 'bg-primary/10 text-primary ring-2 ring-primary/20 animate-pulse'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <step.icon className="w-4 h-4" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs font-medium ${
                            stepIdx === event.steps.length - 1 && step.action !== '结案' ? 'text-primary' : 'text-green-700'
                          }`}>
                            {step.action}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{step.time}</p>
                          <p className="text-[10px] text-gray-500">{step.operator}</p>
                        </div>
                      </div>
                      {stepIdx < event.steps.length - 1 && (
                        <div className="flex-1 h-0.5 bg-green-200 mt-4 mx-1 min-w-[20px]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
}
