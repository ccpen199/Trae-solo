import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Users, Eye, Clock, Zap, Plus, MapPin, Box, BarChart3,
  FlaskConical, Route, Layers, Gauge, TrendingUp, ArrowRight,
  Globe, Sparkles, ChevronRight, Download, FileText, Mic
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useScenicStore } from '@/store/useScenicStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { cn } from '@/lib/utils';
import type { OverviewMetrics } from '@/types';

function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionVal, value, { duration: 1.2, ease: 'easeOut' });
    return controls.stop;
  }, [value, motionVal]);

  useEffect(() => {
    const unsub = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsub;
  }, [display]);

  return <span ref={ref} className="font-mono">0</span>;
}

const statCards = [
  { key: 'totalVisitors' as const, label: '今日游客', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: '+12.5%' },
  { key: 'arLaunchCount' as const, label: 'AR启动次数', icon: Eye, color: 'text-purple-400', bg: 'bg-purple-400/10', trend: '+8.3%' },
  { key: 'avgStayDuration' as const, label: '平均停留时长', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10', trend: '+5.1%', suffix: '分钟' },
  { key: 'interactionRate' as const, label: '互动完成率', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10', trend: '+2.4%', suffix: '%' },
];

const businessModules = [
  {
    label: '景区坐标管理',
    desc: '边界围栏 · 地图中心 · 缩放级别',
    icon: Globe,
    path: '/admin/scenic',
    color: 'from-indigo-600 to-indigo-500',
    badge: '3景区',
  },
  {
    label: 'POI点位绑定',
    desc: '坐标标定 · POI类型 · 触发半径',
    icon: MapPin,
    path: '/admin/scenic/scenic-001/poi',
    color: 'from-amber-600 to-amber-500',
    badge: '11点位',
  },
  {
    label: 'AR内容包制作',
    desc: '3D模型 · 讲解音频 · 历史影像',
    icon: Box,
    path: '/admin/scenic/scenic-001/ar-editor',
    color: 'from-purple-600 to-purple-500',
    badge: '6内容包',
  },
  {
    label: '导览动线配置',
    desc: '推荐路线 · 步长估算 · 游览顺序',
    icon: Route,
    path: '/admin/scenic/scenic-001/poi',
    color: 'from-emerald-600 to-emerald-500',
    badge: '6路线',
  },
  {
    label: '讲解脚本AB测试',
    desc: '变体配置 · 流量分配 · 显著度',
    icon: FlaskConical,
    path: '/admin/ab-test',
    color: 'from-rose-600 to-rose-500',
    badge: '4测试',
  },
  {
    label: '多语言配音',
    desc: '中文/英文/日文 · 上传管理',
    icon: Mic,
    path: '/admin/scenic/scenic-001/ar-editor',
    color: 'from-sky-600 to-sky-500',
    badge: '3语种',
  },
];

const analyticsShortcuts = [
  { label: '停留时长分布', icon: Clock, path: '/admin/analytics?tab=behavior' },
  { label: '互动完成率', icon: Zap, path: '/admin/analytics?tab=behavior' },
  { label: '分享路径追踪', icon: ArrowRight, path: '/admin/analytics?tab=behavior' },
  { label: '游客热力导出', icon: Download, path: '/admin/analytics?tab=heatmap' },
  { label: '讲解脚本复查', icon: FileText, path: '/admin/ab-test' },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-1.5 text-xs border border-white/10">
      <p className="text-gray-400">{label}</p>
      <p className="text-amber-500 font-mono font-medium">{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function Dashboard() {
  const { scenicAreas, loadScenicAreas } = useScenicStore();
  const { overviewMetrics, loadOverview } = useAnalyticsStore();

  useEffect(() => {
    loadScenicAreas();
    loadOverview();
  }, [loadScenicAreas, loadOverview]);

  const getStatValue = useCallback(
    (key: string) => {
      if (!overviewMetrics) return 0;
      return (overviewMetrics[key as keyof OverviewMetrics] as number) || 0;
    },
    [overviewMetrics],
  );

  const trendData = overviewMetrics?.visitorTrend || [];
  const topScenics = overviewMetrics?.topScenics || [];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                系统运行中
              </span>
              <span className="text-[10px] text-gray-500">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white mb-1">
              欢迎回来，AR导览运营者
            </h1>
            <p className="text-sm text-gray-500 max-w-lg leading-relaxed">
              管理全国文博景区的AR内容生产、发布与游客触达。以下是今日运营数据和核心业务入口。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/scenic"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
            >
              <Plus size={15} />
              新建景区
            </Link>
            <Link
              to="/admin/analytics"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-sm font-medium text-white hover:from-amber-500 hover:to-amber-400 transition-colors shadow-lg shadow-amber-900/30"
            >
              <Gauge size={15} />
              查看完整分析
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="glass rounded-2xl p-5 hover:scale-[1.02] hover:border-white/10 transition-all duration-200 relative overflow-hidden group"
          >
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${card.bg} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <card.icon size={18} className={card.color} />
                </div>
                <span className="text-[10px] text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp size={10} />
                  {card.trend}
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                <AnimatedNumber value={getStatValue(card.key)} />
                {card.suffix && <span className="text-base font-normal text-gray-500 ml-1">{card.suffix}</span>}
              </p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              核心业务模块
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">景区AR内容生产到发布的完整链路</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessModules.map((mod, i) => (
            <motion.div
              key={mod.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.35 }}
            >
              <Link
                to={mod.path}
                className="group block h-full glass rounded-2xl p-5 hover:border-white/10 transition-all duration-200 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${mod.color} opacity-80`} />
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg`}>
                    <mod.icon size={22} className="text-white" />
                  </div>
                  <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                    {mod.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {mod.label}
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                  {mod.desc}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-amber-500 group-hover:gap-2 transition-all">
                  进入管理 <ChevronRight size={12} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="glass rounded-2xl p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                7天游客与AR启动趋势
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">蓝色为游客量，金色为AR启动次数</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-gray-400">游客量</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-gray-400">AR启动</span>
              </span>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradVisitor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8F00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF8F00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#607D8B" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#607D8B" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} fill="url(#gradVisitor)" name="游客" />
                <Area type="monotone" dataKey="arCount" stroke="#FF8F00" strokeWidth={2} fill="url(#gradAR)" name="AR启动" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="glass rounded-2xl p-5"
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              景区运营排行
            </h3>
          </div>
          <div className="space-y-3">
            {topScenics.length > 0 ? topScenics.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/20' :
                  i === 1 ? 'bg-gray-400/10 text-gray-300' :
                  i === 2 ? 'bg-orange-500/10 text-orange-400' :
                  'bg-white/5 text-gray-500'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{s.name}</p>
                  <div className="mt-1 h-1 w-full rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-amber-500"
                      style={{ width: `${Math.min(100, (s.visitors / (topScenics[0]?.visitors || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-gray-300">{s.visitors.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-400">+{(Math.random() * 15 + 2).toFixed(1)}%</p>
                </div>
              </div>
            )) : (
              scenicAreas.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-600/20 text-amber-500' : 'bg-white/5 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{s.name}</p>
                  </div>
                  <span className="text-xs font-mono text-gray-400">{(s.visitorCount || 0).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              数据分析快捷入口
            </h3>
            <Link to="/admin/analytics" className="text-[11px] text-amber-500 hover:underline underline-offset-4 flex items-center gap-1">
              全部分析 <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {analyticsShortcuts.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-amber-600/20 transition-all group"
              >
                <item.icon size={18} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-[11px] text-gray-400 text-center leading-tight group-hover:text-gray-200 transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-rose-400" />
              进行中的AB测试
            </h3>
            <Link to="/admin/ab-test" className="text-[11px] text-amber-500 hover:underline underline-offset-4 flex items-center gap-1">
              全部测试 <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {[
              { name: '太和殿讲解脚本A/B', scenic: '故宫博物院', progress: 68, lead: 'Variant B' },
              { name: '兵马俑互动问答对比', scenic: '秦始皇兵马俑', progress: 42, lead: 'Variant A' },
              { name: '莫高窟多语言引导', scenic: '敦煌莫高窟', progress: 85, lead: 'Variant A' },
            ].map((t, i) => (
              <div key={t.name} className={cn(
                'rounded-xl p-3 border transition-colors',
                i === 0 ? 'bg-amber-500/5 border-amber-500/10' : 'bg-white/5 border-white/5'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-200 truncate">{t.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t.scenic}</p>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                    {t.lead} 领先
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-amber-500"
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 w-10 text-right">{t.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
