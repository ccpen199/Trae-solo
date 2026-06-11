import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Shield, Edit,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { mockAnalytics } from '@/data/mockAnalytics';
import type { AnalyticsData } from '@/types/analytics';

const data: AnalyticsData = mockAnalytics;
const { qualityTrend, templateHeatmap, userActivity } = data;

const kpis = [
  { icon: TrendingUp, value: '28,000', label: '总用户数', trend: '+12%', up: true, color: 'text-brand-500' },
  { icon: Users, value: '23,500', label: '月活用户', trend: '+8%', up: true, color: 'text-brand-500' },
  { icon: Shield, value: '78%', label: '平均ATS通过率', trend: '+3%', up: true, color: 'text-gold-500' },
  { icon: Edit, value: '5.2', label: '平均修改次数', trend: '-7%', up: false, color: 'text-brand-500' },
];

const templates = [...new Set(templateHeatmap.map(h => h.templateName))];
const industries = [...new Set(templateHeatmap.map(h => h.industry))];
const maxUsage = Math.max(...templateHeatmap.map(h => h.usageCount));

const templateRanking = templates.map(t => ({
  name: t,
  usage: templateHeatmap.filter(h => h.templateName === t).reduce((s, h) => s + h.usageCount, 0),
})).sort((a, b) => b.usage - a.usage);

const latestActivity = userActivity[userActivity.length - 1];
const prevActivity = userActivity[userActivity.length - 2];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const barColors = ['#00D68F', '#00D68Fcc', '#00D68F99', '#00D68F77', '#00D68F55', '#00D68F33'];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-brand-500" />
          <h1 className="font-display text-3xl font-bold text-brand-900">数据看板</h1>
        </div>
        <div className="px-4 py-2 rounded-lg bg-white shadow-sm text-sm text-surface-300 font-body">
          近6个月
        </div>
      </div>

      <motion.div
        className="grid grid-cols-4 gap-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={fadeUp}
            className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              <span className={`text-xs font-mono flex items-center gap-0.5 ${kpi.up ? 'text-brand-500' : 'text-red-400'}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.trend} vs上月
              </span>
            </div>
            <div className="font-display text-2xl font-bold text-brand-900">{kpi.value}</div>
            <div className="text-sm text-surface-300 font-body">{kpi.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="grid grid-cols-5 gap-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="col-span-3 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-brand-900 mb-4">简历质量趋势</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={qualityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F4" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#B8BDC8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#B8BDC8" />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                return (
                  <div className="bg-white shadow-lg rounded-lg p-3 text-xs font-body border border-surface-100">
                    <p className="text-surface-300 mb-1">{payload[0].payload.date}</p>
                    <p className="text-brand-500">平均修改: {payload[0].payload.avgEdits}</p>
                    <p className="text-gold-500">ATS通过率: {payload[0].payload.atsPassRate}%</p>
                  </div>
                );
              }} />
              <Area type="monotone" dataKey="avgEdits" stroke="#00D68F" fill="#00D68F" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="atsPassRate" stroke="#D4A843" fill="#D4A843" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={fadeUp} className="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-brand-900 mb-4">模板使用排行</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={templateRanking} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#B8BDC8" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#B8BDC8" width={70} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #EEF0F4' }}
                formatter={(v: number) => [`${v} 次`, '使用量']}
              />
              <Bar dataKey="usage" radius={[0, 4, 4, 0]}>
                {templateRanking.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-5 gap-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="col-span-3 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-brand-900 mb-4">模板-行业使用热力图</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-surface-300 font-normal" />
                  {industries.map(ind => (
                    <th key={ind} className="py-2 px-2 text-center text-surface-300 font-normal">{ind}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t}>
                    <td className="py-2 px-2 text-brand-900 font-medium whitespace-nowrap">{t}</td>
                    {industries.map(ind => {
                      const cell = templateHeatmap.find(h => h.templateName === t && h.industry === ind);
                      const opacity = cell ? Math.max(0.1, cell.usageCount / maxUsage) : 0;
                      return (
                        <td key={ind} className="py-2 px-2 text-center">
                          <div
                            className="mx-auto w-12 h-8 rounded flex items-center justify-center font-mono"
                            style={{ backgroundColor: `rgba(0, 214, 143, ${opacity})`, color: opacity > 0.4 ? '#fff' : '#0A2E1C' }}
                          >
                            {cell?.usageCount ?? ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-brand-900 mb-4">用户活跃度</h2>
          <div className="space-y-5">
            <div>
              <div className="text-xs text-surface-300 font-body mb-1">DAU 趋势</div>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={userActivity}>
                  <Area type="monotone" dataKey="dau" stroke="#00D68F" fill="#00D68F" fillOpacity={0.15} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-surface-300 font-body">MAU</div>
                <div className="font-display text-xl font-bold text-brand-900">{latestActivity.mau.toLocaleString()}</div>
              </div>
              <span className="text-xs font-mono text-brand-500 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                +{((latestActivity.mau - prevActivity.mau) / prevActivity.mau * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-surface-300 font-body">留存率</div>
                <div className="font-display text-xl font-bold text-gold-500">{(latestActivity.retention * 100).toFixed(0)}%</div>
              </div>
              <span className="text-xs font-mono text-brand-500 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                +{((latestActivity.retention - prevActivity.retention) / prevActivity.retention * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
