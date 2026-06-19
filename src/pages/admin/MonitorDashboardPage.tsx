import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Activity,
  Clock,
  Smile,
  AlertCircle,
  Snowflake,
  PlayCircle,
  Calendar,
  Info,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/features/StatCard';
import MonitorChart from '@/components/features/MonitorChart';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAdminStore } from '@/stores/admin.store';
import { useLawyerStore } from '@/stores/lawyer.store';
import type { CaseCategory } from '@/types';
import { formatDate, getCategoryLabel } from '@/utils/format';
import { timeAgo } from '@/utils/date';
import { cn } from '@/lib/utils';

type TimeRange = 'today' | 'week' | 'month' | 'quarter';
type ChartRange = '7d' | '30d';

const timeRangeOptions: { key: TimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
];

const chartRangeOptions: { key: ChartRange; label: string }[] = [
  { key: '7d', label: '最近7天' },
  { key: '30d', label: '最近30天' },
];

const categoryColors: Record<CaseCategory, string> = {
  marriage: '#c9a962',
  labor: '#3a5a92',
  debt: '#2dd4bf',
  traffic: '#f59e0b',
  contract: '#8b5cf6',
  criminal: '#ef4444',
  other: '#6b7280',
};

function generateConsultationTrend(days: number) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    const base = 80 + Math.random() * 120;
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      咨询量: Math.round(base),
      已完成: Math.round(base * (0.7 + Math.random() * 0.2)),
    });
  }
  return data;
}

function generateCategoryDistribution() {
  const categories: CaseCategory[] = [
    'marriage',
    'labor',
    'debt',
    'traffic',
    'contract',
    'criminal',
    'other',
  ];
  return categories.map((cat) => ({
    name: getCategoryLabel(cat),
    value: Math.round(50 + Math.random() * 300),
    category: cat,
  }));
}

function generateLawyerLoad() {
  const loadRates = [
    { name: '律师1', count: 18, rate: 90 },
    { name: '律师2', count: 15, rate: 75 },
    { name: '律师4', count: 8, rate: 40 },
    { name: '律师3', count: 5, rate: 25 },
  ];
  return loadRates;
}

function generateZeroResponseLawyers() {
  return [
    {
      id: 'lawyer-zero-1',
      name: '律师A',
      firmName: '某某律师事务所',
      lastResponseAt: new Date(Date.now() - 80 * 3600000).toISOString(),
      pendingCount: 5,
    },
    {
      id: 'lawyer-zero-2',
      name: '律师B',
      firmName: '某某律师事务所',
      lastResponseAt: new Date(Date.now() - 96 * 3600000).toISOString(),
      pendingCount: 3,
    },
  ];
}

function generateOperationLogs() {
  return [
    {
      id: 'log-1',
      type: 'freeze',
      description: '冻结律师 lawyer-5 接单权限',
      operator: '管理员',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      reason: '连续多次零响应',
    },
    {
      id: 'log-2',
      type: 'approve',
      description: '通过律师资质审核',
      operator: '管理员',
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      target: 'lawyer-4',
    },
    {
      id: 'log-3',
      type: 'reject',
      description: '驳回律师资质申请',
      operator: '管理员',
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      reason: '继续教育学分不足',
    },
    {
      id: 'log-4',
      type: 'unfreeze',
      description: '解除律师接单冻结',
      operator: '管理员',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      target: 'lawyer-2',
    },
  ];
}

export default function MonitorDashboardPage() {
  const { monitorStats, fetchMonitorStats } = useAdminStore();
  const { lawyers } = useLawyerStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [chartRange, setChartRange] = useState<ChartRange>('7d');
  const [trendData, setTrendData] = useState(generateConsultationTrend(7));
  const [categoryData] = useState(generateCategoryDistribution());
  const [lawyerLoad] = useState(generateLawyerLoad());
  const [zeroResponseLawyers] = useState(generateZeroResponseLawyers());
  const [operationLogs] = useState(generateOperationLogs());

  useEffect(() => {
    fetchMonitorStats();
  }, [fetchMonitorStats]);

  useEffect(() => {
    const days = chartRange === '7d' ? 7 : 30;
    setTrendData(generateConsultationTrend(days));
  }, [chartRange]);

  const getLogIconColor = (type: string) => {
    switch (type) {
      case 'freeze':
        return 'text-red-500 bg-red-50';
      case 'unfreeze':
        return 'text-emerald-500 bg-emerald-50';
      case 'approve':
        return 'text-primary-600 bg-primary-50';
      case 'reject':
        return 'text-amber-500 bg-amber-50';
      default:
        return 'text-primary-500 bg-primary-50';
    }
  };

  const getLogLabel = (type: string) => {
    switch (type) {
      case 'freeze':
        return { label: '冻结', variant: 'danger' as const };
      case 'unfreeze':
        return { label: '解冻', variant: 'success' as const };
      case 'approve':
        return { label: '通过', variant: 'info' as const };
      case 'reject':
        return { label: '驳回', variant: 'warning' as const };
      default:
        return { label: '操作', variant: 'default' as const };
    }
  };

  return (
    <div className="min-h-screen bg-neutral-warm p-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary-800 mb-2">
              运营监控看板
            </h1>
            <p className="text-primary-500">实时监控平台运营数据与律师服务质量</p>
          </div>
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white border border-primary-100/50 shadow-card">
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTimeRange(opt.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
                  timeRange === opt.key
                    ? 'bg-gold-gradient text-primary-900 shadow-gold'
                    : 'text-primary-500 hover:text-primary-700 hover:bg-primary-50'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="累计咨询量"
            value={monitorStats?.totalConsultations || 0}
            icon={MessageSquare}
            trend={8}
            trendLabel="环比"
          />
          <StatCard
            label="活跃律师数"
            value={monitorStats?.activeLawyers || 0}
            icon={Users}
            trend={3}
            trendLabel="环比"
          />
          <StatCard
            label="人均咨询量"
            value={monitorStats?.consultationsPerLawyer || 0}
            suffix="件"
            icon={Activity}
            trend={5}
            trendLabel="环比"
          />
          <StatCard
            label="平均响应时长"
            value={monitorStats?.averageResponseTime || 0}
            suffix="分钟"
            icon={Clock}
            trend={-12}
            trendLabel="环比"
          />
          <StatCard
            label="满意度"
            value={monitorStats?.averageRating || 0}
            suffix="分"
            icon={Smile}
            trend={2}
            trendLabel="环比"
          />
          <StatCard
            label="零响应律师"
            value={monitorStats?.zeroResponseLawyers || 0}
            icon={AlertCircle}
            trend={0}
            trendLabel="环比"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <MonitorChart
              title="咨询量趋势"
              subtitle="实时统计平台咨询量变化"
              action={
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-primary-50">
                  {chartRangeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setChartRange(opt.key)}
                      className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
                        chartRange === opt.key
                          ? 'bg-white text-primary-800 shadow-sm'
                          : 'text-primary-400 hover:text-primary-600'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(30, 58, 95, 0.1)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="咨询量"
                    stroke="#1e3a5f"
                    strokeWidth={2.5}
                    dot={{ fill: '#1e3a5f', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="已完成"
                    stroke="#c9a962"
                    strokeWidth={2.5}
                    dot={{ fill: '#c9a962', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </MonitorChart>

            <MonitorChart
              title="案由分布"
              subtitle="各类型法律问题咨询占比"
              action={<PieChartIcon className="w-4 h-4 text-primary-400" />}
            >
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={categoryColors[entry.category]}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </MonitorChart>
          </div>

          <div className="space-y-6">
            <MonitorChart
              title="律师负载热力图"
              subtitle="当前律师接单负载情况"
              action={<BarChart3 className="w-4 h-4 text-primary-400" />}
            >
              <div className="space-y-3">
                {lawyerLoad.map((lawyer, index) => (
                  <motion.div
                    key={lawyer.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-primary-50/30 border border-primary-100/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary-800">
                        {lawyer.name}
                      </span>
                      <span className="text-xs text-primary-500">
                        当前 {lawyer.count} 单
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${lawyer.rate}%` }}
                          transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
                          className={cn(
                            'h-full rounded-full',
                            lawyer.rate > 80
                              ? 'bg-red-500'
                              : lawyer.rate < 30
                              ? 'bg-emerald-500'
                              : 'bg-gold-gradient'
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-xs font-bold w-10 text-right',
                          lawyer.rate > 80
                            ? 'text-red-600'
                            : lawyer.rate < 30
                            ? 'text-emerald-600'
                            : 'text-primary-700'
                        )}
                      >
                        {lawyer.rate}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </MonitorChart>

            <MonitorChart
              title="零响应律师预警"
              subtitle="超过72小时无响应的律师"
              action={
                <Badge variant="danger" dot>
                  {zeroResponseLawyers.length} 位预警
                </Badge>
              }
              className="border-red-200/50"
            >
              <div className="space-y-3">
                {zeroResponseLawyers.map((lawyer, index) => (
                  <motion.div
                    key={lawyer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-red-50/50 border border-red-100"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-medium text-primary-800">
                          {lawyer.name}
                        </p>
                        <p className="text-xs text-primary-500">{lawyer.firmName}</p>
                      </div>
                      <Badge variant="danger" dot>
                        {lawyer.pendingCount} 单未响应
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-red-600">
                        最后响应：{timeAgo(lawyer.lastResponseAt)}
                      </p>
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<Snowflake className="w-3.5 h-3.5" />}
                      >
                        冻结权限
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </MonitorChart>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Info className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-primary-800">
                    自动冻结规则
                  </h3>
                  <p className="text-xs text-primary-500">系统自动触发机制</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    title: '连续72小时零响应',
                    desc: '系统将自动冻结接单权限，并通知管理员复核',
                    color: 'bg-red-100 text-red-600',
                  },
                  {
                    title: '继续教育学分不足40分',
                    desc: '年度审核时将自动冻结，直至完成学分要求',
                    color: 'bg-amber-100 text-amber-600',
                  },
                  {
                    title: '月度差评率超过30%',
                    desc: '触发警告并进入观察期，持续不达标将冻结',
                    color: 'bg-primary-100 text-primary-600',
                  },
                  {
                    title: '累计投诉超过5次',
                    desc: '经核实属实后，永久冻结平台服务资格',
                    color: 'bg-red-100 text-red-600',
                  },
                ].map((rule, index) => (
                  <motion.div
                    key={rule.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-neutral-warm"
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold',
                        rule.color
                      )}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-800">
                        {rule.title}
                      </p>
                      <p className="text-xs text-primary-500 mt-0.5">
                        {rule.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-primary-800">
                      最近操作日志
                    </h3>
                    <p className="text-xs text-primary-500">
                      平台管理员最近操作记录
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  查看全部
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-primary-100/50">
                {operationLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-primary-50/30 transition-colors"
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                        getLogIconColor(log.type)
                      )}
                    >
                      {log.type === 'freeze' ? (
                        <Snowflake className="w-4 h-4" />
                      ) : log.type === 'unfreeze' ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-primary-800">
                          {log.description}
                        </p>
                        <Badge variant={getLogLabel(log.type).variant}>
                          {getLogLabel(log.type).label}
                        </Badge>
                      </div>
                      {log.reason && (
                        <p className="text-xs text-primary-400">
                          原因：{log.reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-primary-500">
                        {formatDate(log.createdAt)}
                      </p>
                      <p className="text-xs text-primary-400">{log.operator}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
