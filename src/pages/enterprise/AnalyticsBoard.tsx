import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  DollarSign,
  UserCheck,
  BarChart3,
  PieChart,
  ArrowRight,
  GraduationCap,
  RefreshCw,
  Clock,
  Users,
  Target,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MatchScore } from '@/components/ui/MatchScore';
import { mockRecruitmentMetrics, mockKnowledgeGraphs, mockMatchResults } from '@shared/mock/data';
import type { IndustryType, MatchResult } from '@shared/types';
import { INDUSTRY_LIST } from '@shared/types';
import { cn } from '@/lib/utils';

type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '本年' },
];

const CHART_COLORS = {
  primary: '#1E3A5F',
  accent: '#FF6B6B',
  mint: '#4ECDC4',
  gold: '#FFD93D',
  purple: '#9B59B6',
};

const FUNNEL_COLORS = ['#1E3A5F', '#34495E', '#4ECDC4', '#FF6B6B'];

const INDUSTRY_COLORS: Record<string, string> = {
  hotel: '#1E3A5F',
  restaurant: '#FF6B6B',
  beauty: '#4ECDC4',
  healthcare: '#9B59B6',
  retail: '#FFD93D',
  ecommerce: '#3498DB',
};

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(target * easeOutQuart);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return count;
}

function SparklineChart({ data, color, isDownGood = false }: { data: number[]; color: string; isDownGood?: boolean }) {
  const chartData = data.map((value, index) => ({ index, value }));
  const trend = data[data.length - 1] - data[0];
  const isGood = isDownGood ? trend <= 0 : trend >= 0;
  const lineColor = isGood ? '#4ECDC4' : '#FF6B6B';

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#spark-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  trend: number;
  isDownGood?: boolean;
  sparklineData: number[];
  delay: number;
}

function KPICard({ icon, label, value, suffix, prefix, trend, isDownGood, sparklineData, delay }: KPICardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const animatedValue = useCountUp(value);
  const isGood = isDownGood ? trend <= 0 : trend >= 0;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card
      className={cn(
        'transition-all duration-700 transform',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      hoverable
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-500">
              {icon}
            </div>
            <span className="text-sm text-neutral-500">{label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-lg text-neutral-500">{prefix}</span>}
            <span className="font-serif text-3xl font-bold text-primary-800">
              {animatedValue.toFixed(value % 1 === 0 ? 0 : 1)}
            </span>
            {suffix && <span className="text-lg text-neutral-500">{suffix}</span>}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isGood ? 'text-mint-600' : 'text-accent-500'
            )}>
              {isGood ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              <span>{Math.abs(trend)}%</span>
              <span className="text-neutral-400 font-normal">vs 上期</span>
            </div>
            <SparklineChart data={sparklineData} color={label} isDownGood={isDownGood} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function FunnelChartComponent({ data }: { data: typeof mockRecruitmentMetrics.channelFunnel }) {
  const funnelData = useMemo(() => {
    const stages = [
      { key: 'views', label: '浏览量' },
      { key: 'applications', label: '申请量' },
      { key: 'interviews', label: '面试量' },
      { key: 'hires', label: '入职量' },
    ];

    return data.map((channel, idx) => {
      const result: Record<string, any> = { channel: channel.channel };
      stages.forEach((stage, i) => {
        const value = channel[stage.key as keyof typeof channel] as number;
        const prevValue = i > 0 ? channel[stages[i - 1].key as keyof typeof channel] as number : value;
        const conversion = i > 0 ? ((value / prevValue) * 100).toFixed(1) : '100';
        result[stage.key] = value;
        result[`${stage.key}Label`] = `${value} (${conversion}%)`;
      });
      return result;
    });
  }, [data]);

  const totalViews = data.reduce((sum, c) => sum + c.views, 0);
  const totalHires = data.reduce((sum, c) => sum + c.hires, 0);
  const overallConversion = ((totalHires / totalViews) * 100).toFixed(2);

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart size={20} className="text-primary-500" />
            <h3 className="font-serif text-lg font-semibold text-primary-800">渠道转化漏斗</h3>
          </div>
          <Badge variant="info">总转化率 {overallConversion}%</Badge>
        </div>
      }
    >
      <div className="space-y-6">
        {data.map((channel, idx) => (
          <div key={channel.channel} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-primary-700">{channel.channel}</span>
              <span className="text-neutral-500">
                {channel.hires} 入职 / {channel.views} 浏览
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { value: channel.views, label: '浏览', count: channel.views },
                { value: channel.applications, label: '申请', count: channel.applications },
                { value: channel.interviews, label: '面试', count: channel.interviews },
                { value: channel.hires, label: '入职', count: channel.hires },
              ].map((stage, i, arr) => {
                const width = (stage.value / channel.views) * 100;
                const prevValue = i > 0 ? arr[i - 1].value : stage.value;
                const conversion = i > 0 ? ((stage.value / prevValue) * 100).toFixed(0) : '100';
                return (
                  <div key={stage.label} className="flex-1 flex flex-col gap-1">
                    <div
                      className="h-8 rounded-lg flex items-center justify-center text-xs font-medium text-white transition-all duration-500"
                      style={{
                        width: `${width}%`,
                        backgroundColor: FUNNEL_COLORS[i],
                        minWidth: '40px',
                      }}
                    >
                      {stage.count}
                    </div>
                    <div className="text-xs text-neutral-400 text-center">
                      {stage.label} {i > 0 && `(${conversion}%)`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TimeToHireChart({ data }: { data: Record<string, number> }) {
  const chartData = useMemo(() => {
    return Object.entries(data).map(([role, days]) => ({
      role,
      days,
      fill: days <= 10 ? '#4ECDC4' : days <= 15 ? '#1E3A5F' : '#FF6B6B',
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
          <p className="font-medium text-primary-800">{payload[0].payload.role}</p>
          <p className="text-neutral-500">平均招聘周期: <span className="font-semibold text-primary-600">{payload[0].value} 天</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      header={
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-primary-500" />
          <h3 className="font-serif text-lg font-semibold text-primary-800">各岗位招聘周期对比</h3>
        </div>
      }
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" horizontal={false} />
            <XAxis type="number" unit=" 天" tick={{ fill: '#6C757D', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="role"
              tick={{ fill: '#495057', fontSize: 12 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0F4F8' }} />
            <Bar dataKey="days" radius={[0, 8, 8, 0]} barSize={24}>
              <LabelList dataKey="days" position="right" formatter={(value: number) => `${value} 天`} fill="#495057" fontSize={12} />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function HiringTrendChart() {
  const chartData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    const industries: IndustryType[] = ['hotel', 'restaurant', 'beauty'];

    return months.map((month, idx) => {
      const result: Record<string, any> = { month };
      industries.forEach((ind) => {
        result[ind] = Math.floor(Math.random() * 20) + 5 + idx * 2;
      });
      return result;
    });
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
          <p className="font-medium text-primary-800 mb-2">{label}</p>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-neutral-600">{entry.name}</span>
              <span className="font-semibold" style={{ color: entry.color }}>{entry.value} 人</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" />
            <h3 className="font-serif text-lg font-semibold text-primary-800">招聘趋势</h3>
          </div>
          <div className="flex items-center gap-4">
            {['hotel', 'restaurant', 'beauty'].map((ind) => {
              const info = INDUSTRY_LIST.find((i) => i.key === ind);
              return (
                <div key={ind} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: INDUSTRY_COLORS[ind] }}
                  />
                  <span className="text-xs text-neutral-500">{info?.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {['hotel', 'restaurant', 'beauty'].map((ind) => (
                <linearGradient key={ind} id={`gradient-${ind}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INDUSTRY_COLORS[ind]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={INDUSTRY_COLORS[ind]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
            <XAxis dataKey="month" tick={{ fill: '#6C757D', fontSize: 12 }} axisLine={{ stroke: '#DEE2E6' }} />
            <YAxis tick={{ fill: '#6C757D', fontSize: 12 }} axisLine={{ stroke: '#DEE2E6' }} unit=" 人" />
            <Tooltip content={<CustomTooltip />} />
            {['hotel', 'restaurant', 'beauty'].map((ind) => (
              <Area
                key={ind}
                type="monotone"
                dataKey={ind}
                stroke={INDUSTRY_COLORS[ind]}
                strokeWidth={3}
                fill={`url(#gradient-${ind})`}
                name={INDUSTRY_LIST.find((i) => i.key === ind)?.label}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function KnowledgeGraphCard() {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('hotel');

  const selectedGraph = useMemo(() => {
    return mockKnowledgeGraphs.find((g) => g.industry === selectedIndustry) || mockKnowledgeGraphs[0];
  }, [selectedIndustry]);

  const industryTabs = [
    { key: 'hotel' as IndustryType, label: '酒店', color: '#1E3A5F' },
    { key: 'restaurant' as IndustryType, label: '餐饮', color: '#FF6B6B' },
    { key: 'beauty' as IndustryType, label: '美业', color: '#4ECDC4' },
  ];

  return (
    <Card
      header={
        <div className="flex items-center gap-2">
          <GraduationCap size={20} className="text-primary-500" />
          <h3 className="font-serif text-lg font-semibold text-primary-800">行业知识图谱</h3>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-2">
          {industryTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedIndustry(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                selectedIndustry === tab.key
                  ? 'text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
              style={{
                backgroundColor: selectedIndustry === tab.key ? tab.color : undefined,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-500 mb-2">核心技能要求</h4>
          <div className="flex flex-wrap gap-2">
            {selectedGraph.requiredSkills.map((skill, idx) => (
              <Badge
                key={skill}
                variant="primary"
                className={cn(
                  'transition-all duration-300',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-500 mb-2">推荐课程</h4>
          <div className="space-y-2">
            {selectedGraph.recommendedCourses.map((course, idx) => (
              <div
                key={course}
                className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="p-1.5 rounded-lg bg-primary-100 text-primary-500">
                  <GraduationCap size={14} />
                </div>
                <span className="text-sm text-neutral-700">{course}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-500 mb-3">晋升路径</h4>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {selectedGraph.promotionPaths.map((path, idx) => (
              <div key={path.id} className="flex items-center animate-fade-in" style={{ animationDelay: `${idx * 150}ms` }}>
                <div className="flex flex-col items-center">
                  <div
                    className="w-20 h-20 rounded-full flex flex-col items-center justify-center text-white font-medium text-sm shadow-lg"
                    style={{
                      backgroundColor: industryTabs.find((t) => t.key === selectedIndustry)?.color,
                    }}
                  >
                    <span className="text-xs opacity-90">{idx + 1}级</span>
                    <span className="text-xs leading-tight text-center px-1">{path.to}</span>
                  </div>
                  <div className="mt-2 text-xs text-neutral-400">{path.avgYears}年</div>
                </div>
                {idx < selectedGraph.promotionPaths.length - 1 && (
                  <div className="flex items-center mx-2">
                    <ArrowRight size={20} className="text-neutral-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            起点: {selectedGraph.promotionPaths[0]?.from || selectedGraph.jobTitle}
          </div>
        </div>
      </div>
    </Card>
  );
}

function RecentHiresTable({ data }: { data: MatchResult[] }) {
  const hiredCandidates = useMemo(() => {
    return data.slice(0, 5).map((match, idx) => ({
      ...match,
      status: idx < 3 ? '已入职' : '待入职',
      hireDate: new Date(Date.now() - idx * 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 30 + 1)),
    }));
  }, [data]);

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-primary-500" />
            <h3 className="font-serif text-lg font-semibold text-primary-800">最近入职</h3>
          </div>
          <Badge variant="success">{hiredCandidates.length} 人</Badge>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-2 text-sm font-medium text-neutral-500">候选人</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-neutral-500">岗位</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-neutral-500">入职日期</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-neutral-500">匹配度</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-neutral-500">当前状态</th>
            </tr>
          </thead>
          <tbody>
            {hiredCandidates.map((hire, idx) => (
              <tr
                key={`${hire.talentId}-${idx}`}
                className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <td className="py-4 px-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={hire.talent?.avatar}
                      alt={hire.talent?.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-primary-800">{hire.talent?.name}</div>
                      <div className="text-xs text-neutral-400">{hire.talent?.tags?.[0]}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2">
                  <span className="text-sm text-neutral-700">{hire.job?.title}</span>
                </td>
                <td className="py-4 px-2">
                  <span className="text-sm text-neutral-600">{formatDate(hire.hireDate)}</span>
                </td>
                <td className="py-4 px-2">
                  <MatchScore score={hire.overallScore} size="sm" />
                </td>
                <td className="py-4 px-2">
                  <Badge variant={hire.status === '已入职' ? 'success' : 'info'} size="sm">
                    {hire.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AnalyticsBoard() {
  const [dateRange, setDateRange] = useState<DateRange>('quarter');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const kpiSparklines = useMemo(() => ({
    avgFillDays: [15, 14, 13.5, 13, 12.8, 12.5, 12.5],
    retentionRate: [82, 83, 83.5, 84, 84.8, 85, 85.5],
    costPerHire: [1350, 1320, 1300, 1280, 1260, 1255, 1250],
    hires: [18, 22, 25, 28, 30, 31, 32],
  }), []);

  const RightAction = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-neutral-200">
        {DATE_RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setDateRange(option.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              dateRange === option.value
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-neutral-600 hover:bg-neutral-100'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleRefresh}
        loading={isRefreshing}
      >
        <RefreshCw className={cn(isRefreshing && 'animate-spin')} size={16} />
        刷新
      </Button>
    </div>
  );

  return (
    <PageLayout
      title="招聘效能看板"
      subtitle="数据驱动招聘决策"
      rightAction={RightAction}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <KPICard
            icon={<Clock size={20} />}
            label="岗位平均填补周期"
            value={mockRecruitmentMetrics.avgFillDays}
            suffix="天"
            trend={8.2}
            isDownGood
            sparklineData={kpiSparklines.avgFillDays}
            delay={0}
          />
          <KPICard
            icon={<Target size={20} />}
            label="整体人才留存率"
            value={mockRecruitmentMetrics.retentionRate}
            suffix="%"
            trend={5.3}
            sparklineData={kpiSparklines.retentionRate}
            delay={100}
          />
          <KPICard
            icon={<DollarSign size={20} />}
            label="人均招聘成本"
            value={mockRecruitmentMetrics.costPerHire}
            prefix="¥"
            trend={3.8}
            isDownGood
            sparklineData={kpiSparklines.costPerHire}
            delay={200}
          />
          <KPICard
            icon={<UserCheck size={20} />}
            label="本季度入职人数"
            value={32}
            suffix="人"
            trend={12.5}
            sparklineData={kpiSparklines.hires}
            delay={300}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <FunnelChartComponent data={mockRecruitmentMetrics.channelFunnel} />
          <TimeToHireChart data={mockRecruitmentMetrics.timeToHireByRole} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <HiringTrendChart />
          <KnowledgeGraphCard />
        </div>

        <RecentHiresTable data={mockMatchResults} />
      </div>
    </PageLayout>
  );
}
