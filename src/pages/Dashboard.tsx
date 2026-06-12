import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Flame, Target, Users, Shield, Edit, ArrowUpRight, ArrowDownRight, RefreshCw, Download, Printer, Check, FileText, TrendingDown, Zap, Award, Calendar, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

type TabKey = 'trend' | 'heatmap' | 'funnel' | 'export';
const ATS_TARGET = 85;
const REPORT_ID = 'RFC-DSH-20260612-00314';
const VERIFY_CODE = 'A7F2-9BC3';

const trendData = [
  { date: '2026-01', avgEdits: 8.2, atsPassRate: 62 },
  { date: '2026-02', avgEdits: 7.6, atsPassRate: 65 },
  { date: '2026-03', avgEdits: 6.8, atsPassRate: 69 },
  { date: '2026-04', avgEdits: 6.1, atsPassRate: 72 },
  { date: '2026-05', avgEdits: 5.6, atsPassRate: 75 },
  { date: '2026-06', avgEdits: 5.2, atsPassRate: 78 },
];

const templateNames = ['现代简约-modern-1', '经典商务-classic-1', '技术极客-tech-1', '创意设计-creative-1', '学术科研-academic-1', '简约优雅-minimal-1'];
const shortNames = ['现代简约', '经典商务', '技术极客', '创意设计', '学术科研', '简约优雅'];
const heatmapIndustries = ['互联网', '金融', '制造', '医疗', '教育', '咨询', '媒体', '零售'];

function genHeatmap() {
  const seedBase = [
    [1250, 420, 180, 310, 520, 290, 680, 210],
    [310, 1180, 620, 540, 380, 890, 260, 720],
    [1080, 290, 890, 410, 220, 180, 390, 150],
    [220, 580, 340, 960, 710, 420, 180, 290],
    [390, 210, 180, 680, 1050, 520, 460, 310],
    [560, 720, 420, 350, 480, 610, 320, 540],
  ];
  return seedBase.map((row, rIdx) => ({ template: templateNames[rIdx], shortName: shortNames[rIdx], values: row }));
}

const funnelSteps = [
  { name: '创建简历', value: 100, loss: null, insight: '入口流量充足' },
  { name: 'AI对话', value: 85, loss: 15, insight: '流失15% · 建议:简化首次引导' },
  { name: '实验室优化', value: 62, loss: 23, insight: '流失23% · 建议:增加AI对话成果展示' },
  { name: '导出', value: 48, loss: 14, insight: '流失14% · 建议:简化导出流程' },
  { name: '保存版本', value: 31, loss: 17, insight: '流失17% · 建议:版本对比前置推广' },
];

const insightCards = [
  { icon: Target, title: 'ATS通过率趋势', desc: '62% → 78% (+16pp) · 持续正向增长', color: 'from-gold-500 to-amber-600', textColor: 'text-gold-700', bg: 'bg-gold-50' },
  { icon: Edit, title: '平均修改次数', desc: '8.2 → 5.2 (−3次) · AI生成质量显著提升', color: 'from-emerald-500 to-teal-600', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
  { icon: Calendar, title: '6月数据突破', desc: '本月ATS首次突破75%目标线 · 创历史新高', color: 'from-brand-500 to-indigo-600', textColor: 'text-brand-700', bg: 'bg-brand-50' },
  { icon: Zap, title: '月度波动分析', desc: '3月提升最大(+4pp)，受新模板发布推动', color: 'from-sky-500 to-blue-600', textColor: 'text-sky-700', bg: 'bg-sky-50' },
  { icon: Award, title: '行业排名领先', desc: '行业平均值为68%，本平台高出10个百分点', color: 'from-purple-500 to-fuchsia-600', textColor: 'text-purple-700', bg: 'bg-purple-50' },
  { icon: TrendingUp, title: '未来预测', desc: '按当前趋势，9月ATS通过率预计可达85%', color: 'from-rose-500 to-pink-600', textColor: 'text-rose-700', bg: 'bg-rose-50' },
];

export default function Dashboard() {
  const [tab, setTab] = useState<TabKey>('trend');
  const [heatmap, setHeatmap] = useState(genHeatmap());
  const [sortBy, setSortBy] = useState<'total' | 'industry'>('total');
  const [sortIndustry, setSortIndustry] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ t: number; i: number } | null>(null);
  const [showToast, setShowToast] = useState('');

  useEffect(() => { if (!showToast) return; const t = setTimeout(() => setShowToast(''), 2500); return () => clearTimeout(t); }, [showToast]);

  const sortedHeatmap = useMemo(() => {
    const arr = [...heatmap];
    if (sortBy === 'total') {
      arr.sort((a, b) => b.values.reduce((s, v) => s + v, 0) - a.values.reduce((s, v) => s + v, 0));
    } else {
      arr.sort((a, b) => b.values[sortIndustry] - a.values[sortIndustry]);
    }
    return arr;
  }, [heatmap, sortBy, sortIndustry]);

  const maxVal = Math.max(...heatmap.flatMap(r => r.values));
  const topCells = useMemo(() => {
    const cells: { t: number; i: number; v: number }[] = [];
    heatmap.forEach((r, ri) => r.values.forEach((v, ii) => cells.push({ t: ri, i: ii, v })));
    cells.sort((a, b) => b.v - a.v);
    const top3 = cells.slice(0, 3).map(c => `${c.t}-${c.i}`);
    return top3;
  }, [heatmap]);

  const cellColor = (v: number) => {
    const ratio = Math.max(0.05, v / maxVal);
    if (ratio > 0.75) return { bg: 'rgba(0,214,143,0.85)', text: '#ffffff' };
    if (ratio > 0.5) return { bg: 'rgba(0,214,143,0.6)', text: '#064e3b' };
    if (ratio > 0.25) return { bg: 'rgba(0,214,143,0.35)', text: '#065f46' };
    return { bg: 'rgba(0,214,143,0.15)', text: '#065f46' };
  };

  const handlePrint = () => setShowToast('🖨 已发送至打印机队列');
  const handleExportCred = () => {
    const content = `ResumeForge AI 报表验收凭证\n============================\n报表ID: ${REPORT_ID}\n报表名称: ResumeForge AI 数据报表\n数据截止: 2026-06-12 12:45:32\n生成时间: ${new Date().toLocaleString('zh-CN')}\n生成人: admin\n校验码: ${VERIFY_CODE}\n数据周期: 近6个月\n\n=== 关键指标 ===\nATS通过率: 78% (目标85%)\n平均修改次数: 5.2次\n累计导出: 28,450份\n活跃用户: 23,500\n\n校验哈希: SHA-256:8F3A2C1E...${VERIFY_CODE}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `验收凭证-${REPORT_ID}.txt`; a.click();
    URL.revokeObjectURL(url);
    setShowToast('📎 验收凭证已下载');
  };

  const tabs: { k: TabKey; l: string; ic: any }[] = [
    { k: 'trend', l: '质量趋势', ic: TrendingUp },
    { k: 'heatmap', l: '模板热力图', ic: Flame },
    { k: 'funnel', l: '用户漏斗', ic: Users },
    { k: 'export', l: '导出管理', ic: Download },
  ];

  return (
    <div className="h-full flex overflow-hidden bg-surface-50/40">
      <AnimatePresence>{showToast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-brand-900 text-white rounded-xl shadow-2xl flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-emerald-400" />{showToast}</motion.div>}</AnimatePresence>

      <aside className="w-56 shrink-0 border-r border-surface-100 bg-white flex flex-col">
        <div className="p-5 border-b border-surface-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-lg shadow-brand-500/20"><BarChart3 className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="font-display font-bold text-brand-900">数据看板</h2>
              <p className="text-[11px] text-surface-400 font-mono">ID: {REPORT_ID.slice(0, 12)}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === t.k ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25' : 'text-surface-600 hover:bg-surface-50 hover:text-brand-700'
              }`}>
              <t.ic className={`w-4.5 h-4.5 ${tab === t.k ? '' : 'text-surface-400'}`} />
              <span>{t.l}</span>
              {tab === t.k && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-surface-50">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-emerald-600" /><span className="text-xs font-semibold text-emerald-800">数据状态</span></div>
            <p className="text-[11px] text-emerald-700">已校验 · 置信度 95%</p>
            <p className="text-[10px] text-emerald-600 font-mono mt-1">{VERIFY_CODE}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur"><BarChart3 className="w-8 h-8 text-brand-200" /></div>
                <div>
                  <h1 className="font-display text-2xl font-bold">ResumeForge AI 数据报表</h1>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 bg-white/15 rounded-full text-xs font-medium">简历质量分析周报 · {tab === 'trend' ? '质量趋势' : tab === 'heatmap' ? '模板热力图' : tab === 'funnel' ? '用户漏斗' : '导出管理'}</span>
                    <span className="text-xs text-brand-200/80 font-mono">ID: {REPORT_ID}</span>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs font-mono text-brand-200/80 space-y-0.5">
                <p>生成时间: 2026-06-12 12:45:32</p>
                <p>统计周期: 近6个月</p>
                <p>生成人: admin · 已校验</p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'trend' && (
              <motion.div key="trend" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-surface-100">
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <div>
                      <h2 className="font-display text-xl font-bold text-brand-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-brand-600" />📈 简历质量趋势分析</h2>
                      <p className="text-xs text-surface-400 mt-0.5">平均修改次数与ATS通过率预估 · 统计周期: 近6个月</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" />平均修改</span>
                      <span className="flex items-center gap-1 ml-3"><span className="w-3 h-3 rounded-full bg-gold-500" />ATS通过率</span>
                      <span className="flex items-center gap-1 ml-3"><span className="w-6 h-0.5 border-t-2 border-dashed border-gold-400" />目标线 {ATS_TARGET}%</span>
                    </div>
                  </div>
                  <div className="h-[300px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="cEdits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00D68F" stopOpacity={0.25} /><stop offset="100%" stopColor="#00D68F" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="cATS" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#D4A843" stopOpacity={0.25} /><stop offset="100%" stopColor="#D4A843" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F4" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#D1D5DB" />
                        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#D1D5DB" domain={[0, 10]} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#D1D5DB" domain={[50, 90]} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <ReferenceLine yAxisId="right" y={ATS_TARGET} stroke="#D4A843" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: `目标 ${ATS_TARGET}%`, position: 'right', fontSize: 11, fill: '#B8860B', fontWeight: 600 }} />
                        <Area yAxisId="left" type="monotone" dataKey="avgEdits" name="平均修改次数" stroke="#00D68F" strokeWidth={2.5} fill="url(#cEdits)" dot={{ r: 5, fill: '#00D68F', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                        <Area yAxisId="right" type="monotone" dataKey="atsPassRate" name="ATS通过率(%)" stroke="#D4A843" strokeWidth={2.5} fill="url(#cATS)" dot={{ r: 5, fill: '#D4A843', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-brand-900 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-gold-500" /> 关键洞察</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {insightCards.map((ic, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className={`p-4 rounded-xl border border-surface-100 ${ic.bg} hover:shadow-lg transition-all`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ic.color} flex items-center justify-center shrink-0 shadow-md`}>
                            <ic.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold text-sm ${ic.textColor} mb-0.5`}>{ic.title}</p>
                            <p className="text-xs text-surface-700 leading-relaxed">{ic.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'heatmap' && (
              <motion.div key="heatmap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-surface-100">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h2 className="font-display text-xl font-bold text-brand-900 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" />🔥 模板使用热力图(按行业)</h2>
                      <p className="text-xs text-surface-400 mt-0.5">单元格颜色越深 = 使用量越大 · 点击单元格查看详情 · TOP3标注🔥徽章</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-surface-500">排序:</span>
                      <button onClick={() => setSortBy('total')} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === 'total' ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>按总量</button>
                      <select value={sortIndustry} onChange={e => { setSortIndustry(Number(e.target.value)); setSortBy('industry'); }}
                        className="text-xs border border-surface-200 rounded-lg px-2.5 py-1.5 bg-white">
                        {heatmapIndustries.map((ind, i) => <option key={i} value={i}>按{ind}</option>)}
                      </select>
                    </div>
                  </div>

                  {selectedCell && (() => {
                    const row = heatmap[selectedCell.t];
                    const v = row.values[selectedCell.i];
                    const total = row.values.reduce((s, vv) => s + vv, 0);
                    return (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-brand-50 to-sky-50 border border-brand-200 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-bold text-brand-900 flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" />{row.shortName}</span>
                          <span className="text-surface-400">→</span>
                          <span className="font-semibold text-surface-700">{heatmapIndustries[selectedCell.i]}行业</span>
                          <span className="font-mono font-bold text-2xl text-emerald-600">{v.toLocaleString()}</span>
                          <span className="text-xs text-surface-500">次使用 · 占模板总量 <b className="font-mono text-brand-700">{((v / total) * 100).toFixed(1)}%</b></span>
                          {topCells.includes(`${selectedCell.t}-${selectedCell.i}`) && <span className="px-2 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs rounded-full font-bold shadow-sm">🔥 TOP {topCells.indexOf(`${selectedCell.t}-${selectedCell.i}`) + 1}</span>}
                        </div>
                        <button onClick={() => setSelectedCell(null)} className="text-xs text-surface-500 hover:text-brand-600 px-2 py-1 rounded hover:bg-white/50">清除选择</button>
                      </motion.div>
                    );
                  })()}

                  <div className="overflow-x-auto rounded-xl border border-surface-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-50/80">
                          <th className="sticky left-0 z-10 bg-surface-50/80 py-3 px-4 text-left text-surface-500 font-semibold border-b border-surface-100 whitespace-nowrap">模板名称 ↓</th>
                          {heatmapIndustries.map((ind, i) => (
                            <th key={i} className="py-3 px-2 text-center text-surface-500 font-semibold border-b border-surface-100 min-w-[90px] whitespace-nowrap">{ind}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedHeatmap.map((row, ri) => {
                          const origIdx = heatmap.findIndex(h => h.template === row.template);
                          return (
                            <tr key={row.template} className="hover:bg-surface-50/50 transition-colors border-b border-surface-50 last:border-0">
                              <td className="sticky left-0 z-10 bg-inherit py-3 px-4 border-r border-surface-50">
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                  <span className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-[10px]">{ri + 1}</span>
                                  <span className="font-medium text-brand-900">{row.shortName}</span>
                                </div>
                              </td>
                              {row.values.map((v, ii) => {
                                const c = cellColor(v);
                                const isSel = selectedCell?.t === origIdx && selectedCell?.i === ii;
                                const isTop = topCells.includes(`${origIdx}-${ii}`);
                                return (
                                  <td key={ii} className="py-2.5 px-1.5 text-center">
                                    <div onClick={() => setSelectedCell(isSel ? null : { t: origIdx, i: ii })}
                                      style={{ backgroundColor: c.bg, color: c.text }}
                                      className={`relative mx-auto min-w-[72px] h-12 rounded-lg flex flex-col items-center justify-center font-mono cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${isSel ? 'ring-2 ring-brand-500 ring-offset-2 scale-105 z-10' : ''}`}>
                                      {isTop && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md animate-pulse">🔥</span>}
                                      <span className="text-xs font-bold">{v.toLocaleString()}</span>
                                      <span className="text-[9px] opacity-75">{((v / maxVal) * 100).toFixed(0)}%</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-surface-500">使用量梯度:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-surface-400">低</span>
                        <div className="w-48 h-3 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(0,214,143,0.1), rgba(0,214,143,0.35), rgba(0,214,143,0.6), rgba(0,214,143,0.85))' }} />
                        <span className="text-surface-400">高</span>
                      </div>
                    </div>
                    <p className="text-xs text-brand-700 font-medium bg-brand-50 px-3 py-1.5 rounded-lg">
                      📊 热力图洞察: 「现代简约」在互联网最受欢迎(1,250次) · 「经典商务」在金融行业占比82%
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'funnel' && (
              <motion.div key="funnel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-surface-100">
                  <div className="mb-5">
                    <h2 className="font-display text-xl font-bold text-brand-900 flex items-center gap-2"><Users className="w-5 h-5 text-brand-600" />🎯 用户漏斗与转化分析</h2>
                    <p className="text-xs text-surface-400 mt-0.5">从创建简历到版本保存的全链路转化 · 统计周期: 近30天</p>
                  </div>

                  <div className="max-w-4xl mx-auto space-y-1">
                    {funnelSteps.map((step, i) => {
                      const next = funnelSteps[i + 1];
                      const colors = ['#00D68F', '#00D68Fcc', '#00D68F99', '#00D68F77', '#00D68F55'];
                      const widthPct = step.value;
                      return (
                        <div key={step.name} className="relative">
                          <div className="flex items-center justify-between mb-2 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-md" style={{ background: `linear-gradient(135deg, ${colors[i]}, ${colors[i]}dd)` }}>{i + 1}</div>
                              <div>
                                <p className="font-semibold text-brand-900 text-sm">{step.name}</p>
                                <p className="text-[10px] text-surface-400">{step.insight}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-display font-bold font-mono text-2xl" style={{ color: colors[i] }}>{step.value}%</p>
                              <p className="text-[10px] text-surface-400 font-mono">相对入口</p>
                            </div>
                          </div>
                          <div className="h-12 rounded-xl overflow-hidden bg-surface-50 relative">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${widthPct}%` }} transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                              className="h-full rounded-xl flex items-center justify-between px-4"
                              style={{ background: `linear-gradient(90deg, ${colors[i]}, ${colors[i]}aa)` }}>
                              <span className="text-white text-xs font-semibold drop-shadow-sm">{step.name}</span>
                              <span className="text-white font-bold font-mono text-sm drop-shadow-sm">{(step.value * 280).toFixed(0)} 人</span>
                            </motion.div>
                          </div>
                          {next && (
                            <div className="flex items-center justify-center py-2.5 gap-3">
                              <div className="h-4 w-px bg-surface-200" />
                              <div className={`px-3 py-1 rounded-full text-[11px] font-mono flex items-center gap-1.5 ${step.loss && step.loss >= 15 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                <TrendingDown className="w-3 h-3" />
                                转化 <b>{((next.value / step.value) * 100).toFixed(0)}%</b> · 流失 <b>{step.loss}%</b>
                              </div>
                              <div className="h-4 w-px bg-surface-200" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-5 border-t border-surface-100 grid grid-cols-4 gap-4">
                    {[
                      { l: '总用户量', v: '28,450', ic: Users, c: 'text-brand-600' },
                      { l: '整体转化率', v: '31%', ic: Target, c: 'text-emerald-600' },
                      { l: '最大流失环节', v: '实验室→导出', ic: TrendingDown, c: 'text-red-500' },
                      { l: '建议优化优先级', v: '★★★★☆', ic: Award, c: 'text-gold-600' },
                    ].map((s, i) => (
                      <div key={i} className="p-3 rounded-xl bg-surface-50/80 text-center">
                        <s.ic className={`w-5 h-5 mx-auto mb-1.5 ${s.c}`} />
                        <p className="text-[10px] text-surface-400">{s.l}</p>
                        <p className={`font-display font-bold text-lg ${s.c} font-mono`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'export' && (
              <motion.div key="export" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="grid grid-cols-3 gap-5">
                  {[
                    { f: 'PDF', c: 'from-red-500 to-rose-600', desc: 'ATS兼容 98%', cnt: '18,234', size: '~247KB' },
                    { f: 'Word', c: 'from-blue-500 to-indigo-600', desc: 'ATS兼容 95%', cnt: '7,892', size: '~32KB' },
                    { f: 'Web', c: 'from-emerald-500 to-teal-600', desc: 'ATS兼容 85%', cnt: '2,324', size: '~125KB' },
                  ].map((x, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white border border-surface-100 shadow-sm">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${x.c} flex items-center justify-center mb-3 shadow-lg`}>
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-display font-bold text-xl text-brand-900">{x.f}</h3>
                      <p className="text-xs text-surface-500 mt-0.5">{x.desc} · 单份{x.size}</p>
                      <div className="mt-3 pt-3 border-t border-surface-50 flex items-end justify-between">
                        <div><p className="text-[10px] text-surface-400">累计导出</p><p className="font-mono font-bold text-2xl text-brand-700">{x.cnt}</p></div>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">占比 {i === 0 ? '64%' : i === 1 ? '28%' : '8%'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-2xl p-5 border-2 border-emerald-200 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shrink-0"><Check className="w-5 h-5 text-white" /></div>
                <div>
                  <h3 className="font-display font-bold text-emerald-900">✅ 本报表已生成可验收凭证</h3>
                  <div className="mt-1 grid grid-cols-2 gap-x-8 gap-y-0.5 text-xs font-mono text-emerald-800/80">
                    <p>报表ID: <b>{REPORT_ID}</b></p>
                    <p>数据截止: 2026-06-12 12:45:32</p>
                    <p>生成人: <b>admin</b></p>
                    <p>校验码: <b>{VERIFY_CODE}</b></p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-sm font-medium hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-sm">
                  <Printer className="w-4 h-4" /> 🖨 打印报表
                </button>
                <button onClick={handleExportCred} className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25">
                  <Download className="w-4 h-4" /> 📎 导出凭证
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
