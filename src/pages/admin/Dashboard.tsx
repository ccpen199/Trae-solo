import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Users, Eye, Clock, Zap, Plus, MapPin, Box, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useScenicStore } from '@/store/useScenicStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
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
  { key: 'totalVisitors' as const, label: '今日游客', icon: Users, color: 'text-blue-400', trend: '+12.5%' },
  { key: 'arLaunchCount' as const, label: 'AR启动次数', icon: Eye, color: 'text-purple-400', trend: '+8.3%' },
  { key: 'avgStayDuration' as const, label: '平均停留时长', icon: Clock, color: 'text-emerald-400', trend: '+5.1%', suffix: '分钟' },
  { key: 'interactionRate' as const, label: '互动完成率', icon: Zap, color: 'text-amber-400', trend: '+2.4%', suffix: '%' },
];

const quickActions = [
  { label: '创建景区', icon: Plus, path: '/admin/scenic' },
  { label: '配置POI', icon: MapPin, path: '/admin/scenic' },
  { label: 'AR编辑', icon: Box, path: '/admin/scenic/1/ar-editor' },
  { label: '查看分析', icon: BarChart3, path: '/admin/analytics' },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-1.5 text-xs">
      <p className="text-gray-400">{label}</p>
      <p className="text-amber-500 font-mono font-medium">{payload[0].value}</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="glass rounded-xl p-5 hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon size={18} className={card.color} />
              <span className="text-[10px] text-emerald-400 font-medium bg-emerald-400/10 px-1.5 py-0.5 rounded">
                {card.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              <AnimatedNumber value={getStatValue(card.key)} />
              {card.suffix && <span className="text-sm font-normal text-gray-500 ml-1">{card.suffix}</span>}
            </p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="glass rounded-xl p-5 lg:col-span-2"
        >
          <h3 className="text-sm font-medium text-gray-300 mb-4">7天游客趋势</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="date" stroke="#607D8B" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#607D8B" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#FF8F00"
                  strokeWidth={2}
                  dot={{ fill: '#FF8F00', r: 3 }}
                  activeDot={{ r: 5, fill: '#FF8F00' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="glass rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-gray-300 mb-4">景区排行</h3>
          <div className="space-y-3">
            {topScenics.length > 0 ? topScenics.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-amber-600/20 text-amber-500' : 'bg-white/5 text-gray-600'}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-300 truncate">{s.name}</span>
                <span className="text-xs font-mono text-gray-500">{s.visitors.toLocaleString()}</span>
              </div>
            )) : (
              scenicAreas.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-amber-600/20 text-amber-500' : 'bg-white/5 text-gray-600'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-300 truncate">{s.name}</span>
                  <span className="text-xs font-mono text-gray-500">{(s.visitorCount || 0).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="glass rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-gray-300 mb-4">快捷操作</h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-900/40 border border-indigo-800/30 text-sm text-gray-300 hover:bg-indigo-900/60 hover:border-amber-600/20 hover:text-amber-500 transition-all duration-200"
            >
              <action.icon size={16} />
              {action.label}
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
