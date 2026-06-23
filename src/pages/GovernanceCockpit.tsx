import { useState } from 'react';
import {
  Shield, Users, BarChart3, PieChart, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, MapPin, Building2, User, AlertCircle,
  ChevronRight, Zap, FileText, Target, Bell, RefreshCw, Filter,
  Download, Eye, Clock as ClockIcon, Leaf, Car, Hammer
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart as RechartsPie, Pie, Cell,
  ComposedChart, Area
} from 'recharts';
import {
  gridEvents, demographicData, appealCategories, monthlyAppealTrend
} from '../data/mock';

const COLORS = ['#1a4fb0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const eventTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  environmental: { label: '环境卫生', color: 'bg-emerald-500', icon: Leaf },
  traffic: { label: '交通出行', color: 'bg-blue-500', icon: Car },
  infrastructure: { label: '市政设施', color: 'bg-amber-500', icon: Hammer },
  civil: { label: '邻里纠纷', color: 'bg-purple-500', icon: Users },
  safety: { label: '安全隐患', color: 'bg-red-500', icon: AlertTriangle },
};

const eventLevelConfig: Record<string, { label: string; color: string; textColor: string; bg: string; border: string }> = {
  low: { label: '一般', color: 'bg-slate-500', textColor: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
  medium: { label: '较重', color: 'bg-amber-500', textColor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  high: { label: '严重', color: 'bg-orange-500', textColor: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  urgent: { label: '紧急', color: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

const eventStatusConfig: Record<string, { label: string; color: string; icon: any; bg: string; border: string }> = {
  pending: { label: '待分派', color: 'text-slate-600', icon: ClockIcon, bg: 'bg-slate-50', border: 'border-slate-200' },
  processing: { label: '处理中', color: 'text-blue-700', icon: RefreshCw, bg: 'bg-blue-50', border: 'border-blue-200' },
  resolved: { label: '已解决', color: 'text-emerald-700', icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200' },
  closed: { label: '已结案', color: 'text-gray-600', icon: FileText, bg: 'bg-gray-50', border: 'border-gray-200' },
};

const dashboardStats = [
  { label: '辖区总人口', value: '337,240', icon: Users, trend: '+1.2%', positive: true, desc: '较上月', color: 'from-blue-500 to-indigo-600' },
  { label: '本月网格事件', value: '1,217', icon: Bell, trend: '+8.6%', positive: false, desc: '环比上升', color: 'from-amber-500 to-orange-600' },
  { label: '事件办结率', value: '93.8%', icon: CheckCircle2, trend: '+2.1%', positive: true, desc: '持续优化', color: 'from-emerald-500 to-teal-600' },
  { label: '平均处置时长', value: '6.2小时', icon: Clock, trend: '-12%', positive: true, desc: '效率提升', color: 'from-purple-500 to-violet-600' },
];

const subDistricts = [
  { name: '滨海街道', population: 58420, events: 186, rate: 96.2 },
  { name: '鹭江街道', population: 42180, events: 142, rate: 94.5 },
  { name: '中华街道', population: 35760, events: 158, rate: 92.8 },
  { name: '厦港街道', population: 41230, events: 167, rate: 95.1 },
  { name: '开元街道', population: 62340, events: 215, rate: 93.6 },
  { name: '筼筜街道', population: 54830, events: 176, rate: 94.8 },
  { name: '梧村街道', population: 42480, events: 173, rate: 91.5 },
];

export default function GovernanceCockpit() {
  const [eventLevelFilter, setEventLevelFilter] = useState<string>('all');
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('all');

  const filteredEvents = gridEvents.filter(e => {
    if (eventLevelFilter !== 'all' && e.level !== eventLevelFilter) return false;
    if (eventStatusFilter !== 'all' && e.status !== eventStatusFilter) return false;
    return true;
  });

  const totalMale = demographicData.reduce((s, d) => s + d.male, 0);
  const totalFemale = demographicData.reduce((s, d) => s + d.female, 0);
  const totalPop = totalMale + totalFemale;

  const pieData = [
    { name: '男性', value: totalMale },
    { name: '女性', value: totalFemale },
  ];

  const ageDemographics = demographicData.map(d => ({
    ageGroup: d.ageGroup,
    男性: d.male,
    女性: d.female,
  }));

  return (
    <div className="animate-fade-in bg-slate-950 text-white min-h-screen -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-[1800px] mx-auto">
        <section className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">基层治理驾驶舱</h2>
                <p className="text-slate-400 text-sm">思明区 · 面向街道的综合治理数据看板</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-slate-300">数据实时更新</span>
            </div>
            <button className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-sm flex items-center gap-2 transition-colors">
              <RefreshCw className="w-4 h-4" />刷新
            </button>
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all">
              <Download className="w-4 h-4" />导出报表
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dashboardStats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="relative overflow-hidden rounded-2xl p-5 md:p-6 bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:border-slate-700 transition-colors group">
                <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                      stat.positive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-3xl md:text-4xl font-bold mb-1 tracking-tight">{stat.value}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                    <p className="text-xs text-slate-500">{stat.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 rounded-2xl p-5 md:p-6 bg-slate-900/80 backdrop-blur-sm border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                诉求月度趋势分析
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" />诉求总量</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />已解决</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={monthlyAppealTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="count" stroke="transparent" fill="url(#colorCount)" />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#1e293b' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#1e293b' }} activeDot={{ r: 7 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-5 md:p-6 bg-slate-900/80 backdrop-blur-sm border border-slate-800">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-purple-400" />
              性别比例分布
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" stroke="#1e293b" strokeWidth={2} />
                  <Cell fill="#ec4899" stroke="#1e293b" strokeWidth={2} />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                  formatter={(value: number) => [`${value.toLocaleString()}人 (${((value / totalPop) * 100).toFixed(1)}%)`, '']}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm text-blue-300">男性</span>
                </div>
                <p className="text-xl font-bold">{totalMale.toLocaleString()}</p>
                <p className="text-xs text-slate-400">占比 {((totalMale / totalPop) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span className="text-sm text-pink-300">女性</span>
                </div>
                <p className="text-xl font-bold">{totalFemale.toLocaleString()}</p>
                <p className="text-xs text-slate-400">占比 {((totalFemale / totalPop) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl p-5 md:p-6 bg-slate-900/80 backdrop-blur-sm border border-slate-800">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-sky-400" />
              人口年龄分布画像
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ageDemographics} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                <YAxis dataKey="ageGroup" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} width={65} axisLine={{ stroke: '#334155' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(val: number) => [`${val.toLocaleString()}人`]}
                />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Bar dataKey="男性" fill="#3b82f6" radius={[0, 6, 6, 0]} stackId="a" />
                <Bar dataKey="女性" fill="#ec4899" radius={[0, 6, 6, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-5 md:p-6 bg-slate-900/80 backdrop-blur-sm border border-slate-800">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              高频诉求聚类 TOP 8
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={appealCategories} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} interval={0} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(val: number) => [`${val}件`]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#f59e0b">
                  {appealCategories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-5 md:p-6 bg-slate-900/80 backdrop-blur-sm border border-slate-800">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-teal-400" />
              街道治理效能排行
            </h3>
            <div className="space-y-3">
              {subDistricts.map((sd, idx) => (
                <div key={sd.name} className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 transition-colors border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        idx < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-medium text-sm">{sd.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                      {sd.rate}%<CheckCircle2 className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">人口</p>
                      <p className="font-semibold text-slate-200">{sd.population.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">事件数</p>
                      <p className="font-semibold text-amber-400">{sd.events}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">办结率</p>
                      <div className="h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: `${sd.rate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl p-5 md:p-6 bg-slate-900/80 backdrop-blur-sm border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-red-400" />
              网格事件闭环跟踪
              <span className="ml-2 text-sm font-normal px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                共 {filteredEvents.length} 件事件
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" />紧急程度：</span>
                <div className="flex items-center gap-1">
                  {[{ k: 'all', l: '全部' }, { k: 'urgent', l: '紧急' }, { k: 'high', l: '严重' }, { k: 'medium', l: '较重' }, { k: 'low', l: '一般' }].map(f => (
                    <button
                      key={f.k}
                      onClick={() => setEventLevelFilter(f.k)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        eventLevelFilter === f.k
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                      }`}
                    >{f.l}</button>
                  ))}
                </div>
              </div>
              <div className="w-px h-6 bg-slate-700 hidden md:block" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">处理状态：</span>
                <div className="flex items-center gap-1">
                  {[{ k: 'all', l: '全部' }, { k: 'pending', l: '待分派' }, { k: 'processing', l: '处理中' }, { k: 'resolved', l: '已解决' }, { k: 'closed', l: '已结案' }].map(f => (
                    <button
                      key={f.k}
                      onClick={() => setEventStatusFilter(f.k)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        eventStatusFilter === f.k
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                      }`}
                    >{f.l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(event => {
              const typeCfg = eventTypeConfig[event.type];
              const levelCfg = eventLevelConfig[event.level];
              const statusCfg = eventStatusConfig[event.status];
              const StatusIcon = statusCfg.icon;
              return (
                <div key={event.id} className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl ${levelCfg.color} flex items-center justify-center shrink-0 shadow-lg`}>
                        {typeCfg?.icon && <typeCfg.icon className="w-5 h-5 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors">{event.title}</h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`gov-badge ${levelCfg.bg} ${levelCfg.textColor} ${levelCfg.border} border !text-[10px]`}>
                            {levelCfg.label}
                          </span>
                          <span className={`gov-badge ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} border !text-[10px] flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />{statusCfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 flex items-start gap-1.5 mb-3 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-500" />
                    {event.location}
                  </p>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">处置进度</span>
                      <span className="font-bold text-white">{event.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          event.progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                        }`}
                        style={{ width: `${event.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" />上报：{event.reporter.split('-')[0]}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />处置：{event.handler}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />{event.reportTime.split(' ')[1]}
                      </span>
                      <button className="mt-1 text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <Eye className="w-3 h-3" />详情
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid md:grid-cols-4 gap-4">
          {[
            { label: '接入社区网格', value: '86个', icon: MapPin, color: 'from-blue-500 to-indigo-600' },
            { label: '网格员在岗', value: '1,243人', icon: Users, color: 'from-emerald-500 to-teal-600' },
            { label: '本月已处置', value: '1,141件', icon: CheckCircle2, color: 'from-amber-500 to-orange-600' },
            { label: '群众满意度', value: '97.6%', icon: Zap, color: 'from-purple-500 to-violet-600' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="p-5 rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-800 flex items-center gap-4 hover:border-slate-700 transition-colors">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg shrink-0`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-sm text-slate-400">{item.label}</p>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
