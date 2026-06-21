import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingDown, TrendingUp, Users, Briefcase, Clock, MapPin, Activity } from 'lucide-react';
import { mockDashboardData } from '@/mock/data';

export default function Dashboard() {
  const { avgRecruitmentCycle, jobCloseReasons, regionHeatmap } = mockDashboardData;
  const [heatmapMetric, setHeatmapMetric] = useState<'demand' | 'supply' | 'ratio'>('demand');

  const metricLabels = {
    demand: '需求人数',
    supply: '供给人数',
    ratio: '供需比',
  };

  const getHeatColor = (value: number, metric: string) => {
    if (metric === 'ratio') {
      if (value >= 1.15) return '#C8553D';
      if (value >= 1.05) return '#D4A843';
      return '#2D6A4F';
    }
    if (value >= 2500) return '#C8553D';
    if (value >= 1500) return '#D4A843';
    if (value >= 800) return '#55A367';
    return '#A8D0B1';
  };

  const getOpacity = (value: number, metric: string) => {
    if (metric === 'ratio') {
      return Math.min(0.9, 0.5 + value * 0.3);
    }
    return Math.min(0.9, 0.3 + value / 3500);
  };

  const stats = [
    {
      label: '人均招聘周期',
      value: '18天',
      change: '-35.7%',
      trend: 'down',
      icon: Clock,
      color: 'text-spruce-600',
      bg: 'bg-spruce-50',
    },
    {
      label: '本月活跃职位',
      value: '1,286',
      change: '+12.4%',
      trend: 'up',
      icon: Briefcase,
      color: 'text-terracotta-600',
      bg: 'bg-terracotta-50',
    },
    {
      label: '本月新增简历',
      value: '3,852',
      change: '+8.7%',
      trend: 'up',
      icon: Users,
      color: 'text-sand-600',
      bg: 'bg-sand-50',
    },
    {
      label: '面试成功率',
      value: '68.5%',
      change: '+5.2%',
      trend: 'up',
      icon: Activity,
      color: 'text-spruce-600',
      bg: 'bg-spruce-50',
    },
  ];

  const totalDemand = regionHeatmap.reduce((s, r) => s + r.demand, 0);
  const totalSupply = regionHeatmap.reduce((s, r) => s + r.supply, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon size={20} className={s.color} />
                </div>
                <span
                  className={`text-xs font-medium flex items-center gap-1 ${
                    s.trend === 'up' ? 'text-spruce-600' : 'text-terracotta-600'
                  }`}
                >
                  {s.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {s.change}
                </span>
              </div>
              <p className="text-3xl font-bold font-serif text-ash-700">{s.value}</p>
              <p className="text-sm text-ash-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-ash-700">企业人均招聘周期</h3>
              <p className="text-sm text-ash-500">从发布职位到最终录用的平均天数</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-terracotta-500"></span>
                本企业
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-ash-300"></span>
                行业平均
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={avgRecruitmentCycle}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E6E7" />
              <XAxis dataKey="month" tick={{ fill: '#8E9296', fontSize: 12 }} />
              <YAxis tick={{ fill: '#8E9296', fontSize: 12 }} domain={[10, 45]} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E5E6E7',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
                }}
              />
              <Line
                type="monotone"
                dataKey="days"
                stroke="#C8553D"
                strokeWidth={3}
                dot={{ fill: '#C8553D', r: 4 }}
                activeDot={{ r: 6, fill: '#C8553D' }}
                name="本企业"
              />
              <Line
                type="monotone"
                dataKey="industryAvg"
                stroke="#AFB1B4"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="行业平均"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-ash-700">职位关闭原因分布</h3>
              <p className="text-sm text-ash-500">已关闭职位的关闭原因统计</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-serif text-ash-700">105</p>
              <p className="text-xs text-ash-500">已关闭职位数</p>
            </div>
          </div>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={280}>
              <PieChart>
                <Pie
                  data={jobCloseReasons}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {jobCloseReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {jobCloseReasons.map((item) => (
                <div key={item.reason} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-ash-600">{item.reason}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ash-700">{item.count}</span>
                    <span className="text-xs text-ash-400">
                      {Math.round((item.count / 105) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-ash-700">云南人才供需热力图</h3>
            <p className="text-sm text-ash-500">各地州人才需求与供给分布</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 bg-ash-50 p-1 rounded-lg">
              {(['demand', 'supply', 'ratio'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setHeatmapMetric(m)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    heatmapMetric === m
                      ? 'bg-white shadow-sm text-terracotta-600'
                      : 'text-ash-500 hover:text-ash-700'
                  }`}
                >
                  {metricLabels[m]}
                </button>
              ))}
            </div>
            <div className="text-sm text-ash-500 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-ash-50 border border-ash-200"></span>
                低
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-sand-500/60"></span>
                中
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-terracotta-500/80"></span>
                高
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 relative">
            <svg viewBox="0 0 560 520" className="w-full h-auto">
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
                </filter>
              </defs>
              {regionHeatmap.map((region) => {
                const value = heatmapMetric === 'demand' ? region.demand : heatmapMetric === 'supply' ? region.supply : region.ratio;
                return (
                  <g key={region.region} className="group cursor-pointer">
                    <path
                      d={region.path}
                      fill={getHeatColor(value, heatmapMetric)}
                      fillOpacity={getOpacity(value, heatmapMetric)}
                      stroke="#fff"
                      strokeWidth="2"
                      filter="url(#shadow)"
                      className="transition-all duration-300 hover:fill-opacity-100 hover:stroke-terracotta-400"
                    />
                    <text
                      x={region.x}
                      y={region.y}
                      textAnchor="middle"
                      className="text-xs fill-white font-medium pointer-events-none drop-shadow-sm"
                      style={{ fontSize: '13px' }}
                    >
                      {region.region.replace('市', '').replace('州', '')}
                    </text>
                    <title>
                      {region.region} - {metricLabels[heatmapMetric]}: {value}
                    </title>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-64 space-y-2">
            <div className="p-3 bg-ash-50 rounded-lg text-center mb-3">
              <p className="text-xs text-ash-500">全省总计</p>
              <div className="flex justify-around mt-2">
                <div>
                  <p className="text-lg font-bold text-terracotta-600 font-serif">{totalDemand.toLocaleString()}</p>
                  <p className="text-xs text-ash-500">需求</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-spruce-600 font-serif">{totalSupply.toLocaleString()}</p>
                  <p className="text-xs text-ash-500">供给</p>
                </div>
              </div>
            </div>
            {regionHeatmap
              .sort((a, b) => (heatmapMetric === 'ratio' ? b.ratio - a.ratio : b.demand - a.demand))
              .slice(0, 10)
              .map((region, i) => {
                const value = heatmapMetric === 'demand' ? region.demand : heatmapMetric === 'supply' ? region.supply : region.ratio;
                const maxValue = Math.max(...regionHeatmap.map((r) => heatmapMetric === 'demand' ? r.demand : heatmapMetric === 'supply' ? r.supply : r.ratio));
                return (
                  <div key={region.region} className="flex items-center gap-3">
                    <span className="text-xs text-ash-400 w-4">{i + 1}</span>
                    <span className="text-sm text-ash-600 w-16 truncate">{region.region}</span>
                    <div className="flex-1 h-2 bg-ash-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(value / maxValue) * 100}%`,
                          backgroundColor: getHeatColor(value, heatmapMetric),
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-ash-700 w-14 text-right">
                      {heatmapMetric === 'ratio' ? value.toFixed(2) : value.toLocaleString()}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-serif text-lg font-bold text-ash-700 mb-4">各地州供需明细</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...regionHeatmap].sort((a, b) => b.demand - a.demand)}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E6E7" vertical={false} />
              <XAxis
                dataKey="region"
                tick={{ fill: '#8E9296', fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#8E9296', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E5E6E7',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
                }}
              />
              <Legend />
              <Bar dataKey="demand" name="人才需求" fill="#C8553D" radius={[4, 4, 0, 0]} />
              <Bar dataKey="supply" name="人才供给" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
