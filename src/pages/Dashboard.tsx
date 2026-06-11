import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Shield, Edit, ArrowUpRight, ArrowDownRight, RefreshCw, Download, ChevronDown, FileSpreadsheet, FileText, File } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, Legend } from 'recharts';
import { mockAnalytics } from '@/data/mockAnalytics';
import type { AnalyticsData } from '@/types/analytics';

type DateRange = '1m' | '3m' | '6m' | '12m' | 'custom';
type ChartPoint = { date: string; avgEdits: number; atsPassRate: number; predicted?: boolean };
const ATS_TARGET = 85, IDEAL_EDITS = 3.0;
const rangeOpts: { v: DateRange; l: string }[] = [{ v: '1m', l: '近1月' }, { v: '3m', l: '近3月' }, { v: '6m', l: '近6月' }, { v: '12m', l: '近12月' }, { v: 'custom', l: '自定义' }];

function genData(r: DateRange): AnalyticsData {
  const mc: Record<DateRange, number> = { '1m': 1, '3m': 3, '6m': 6, '12m': 12, custom: 6 }, c = mc[r];
  const dates = ['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'].slice(-c);
  const bl = mockAnalytics.qualityTrend.length;
  return {
    qualityTrend: dates.map((d, i) => {
      const p = (i + 1) / c, bi = Math.min(Math.floor(p * bl), bl - 1), b = mockAnalytics.qualityTrend[bi], j = (Math.sin(i * 1.7) + 1) * 0.5;
      return { date: d, avgEdits: +(b.avgEdits - j * 0.5).toFixed(1), atsPassRate: Math.round(b.atsPassRate + j * 3) };
    }),
    userActivity: dates.map((d, i) => {
      const p = (i + 1) / c, bi = Math.min(Math.floor(p * bl), bl - 1), b = mockAnalytics.userActivity[bi];
      return { date: d, dau: Math.round(b.dau * (0.7 + p * 0.5)), mau: Math.round(b.mau * (0.7 + p * 0.5)), retention: +(b.retention * (0.85 + p * 0.25)).toFixed(2) };
    }),
    templateHeatmap: mockAnalytics.templateHeatmap.map(h => ({ ...h, usageCount: Math.round(h.usageCount * (0.6 + (c / 6) * 0.6)) })),
  };
}
function useCU(t: number, d = 800, l: boolean) {
  const [v, sv] = useState(t); const sr = useRef<number | null>(null), fr = useRef(t);
  useEffect(() => {
    if (l) return; fr.current = v; sr.current = null; let r: number;
    const s = fr.current, e = t, st = (ts: number) => { if (sr.current === null) sr.current = ts; const el = ts - sr.current, x = Math.min(el / d, 1), ee = 1 - Math.pow(1 - x, 3); sv(s + (e - s) * ee); if (x < 1) r = requestAnimationFrame(st); };
    r = requestAnimationFrame(st); return () => cancelAnimationFrame(r);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, d, l]); return v;
}
function PR({ v, tg, c }: { v: number; tg: number; c: string }) {
  const s = 44, sw = 5, r = (s - sw) / 2, cc = 2 * Math.PI * r, p = Math.min(100, Math.max(0, (v / tg) * 100)), o = cc - (p / 100) * cc;
  return <div className="relative" style={{ width: s, height: s }}>
    <svg width={s} height={s} className="-rotate-90"><circle cx={s / 2} cy={s / 2} r={r} stroke="#EEF0F4" strokeWidth={sw} fill="none" /><circle cx={s / 2} cy={s / 2} r={r} stroke={c} strokeWidth={sw} fill="none" strokeDasharray={cc} strokeDashoffset={o} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }} /></svg>
    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono" style={{ color: c }}>{Math.round(p)}%</div>
  </div>;
}
function Sh({ className }: { className?: string }) { return <div className={`relative overflow-hidden bg-surface-100 rounded animate-pulse ${className || ''}`}><div className="absolute inset-0 -translate-x-full animate-[sh_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" /></div>; }
function CC({ cn }: { cn?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>; }

export default function Dashboard() {
  const [dr, sdr] = useState<DateRange>('6m'), [ro, sro] = useState(false), [eo, seo] = useState(false), [ld, sld] = useState(false);
  const [tst, stst] = useState(false), [lu, slu] = useState(new Date()), [now, sn] = useState(new Date());
  const [cm, scm] = useState<'none' | 'yoy' | 'mom'>('none'), [sc, ssc] = useState<{ t: string; i: string } | null>(null);

  useEffect(() => { const id = setInterval(() => sn(new Date()), 1000); return () => clearInterval(id); }, []);
  const data = useMemo(() => genData(dr), [dr]);
  useEffect(() => { sld(true); const t = setTimeout(() => { sld(false); slu(new Date()); stst(true); setTimeout(() => stst(false), 2000); }, 1500); return () => clearTimeout(t); }, [dr]);

  const { qualityTrend: qt, templateHeatmap: th, userActivity: ua } = data;
  const ts = [...new Set(th.map(h => h.templateName))], ins = [...new Set(th.map(h => h.industry))];
  const mu = Math.max(...th.map(h => h.usageCount)), tu = th.reduce((s, h) => s + h.usageCount, 0);
  const tr = ts.map(t => ({ name: t, usage: th.filter(h => h.templateName === t).reduce((s, h) => s + h.usageCount, 0) })).sort((a, b) => b.usage - a.usage);
  const topT = tr.slice(0, 3).map(t => t.name), lat = qt[qt.length - 1], pv = qt[qt.length - 2];

  const kpis = [
    { ic: TrendingUp, rv: 28000, lb: '总用户数', td: '+12%', up: true, c: '#00D68F', tg: null },
    { ic: Users, rv: 23500, lb: '月活用户', td: '+8%', up: true, c: '#00D68F', tg: null },
    { ic: Shield, rv: lat?.atsPassRate ?? 78, lb: '平均ATS通过率', td: pv ? `+${lat.atsPassRate - pv.atsPassRate}%` : '+3%', up: true, c: '#D4A843', tg: ATS_TARGET },
    { ic: Edit, rv: lat?.avgEdits ?? 5.2, lb: '平均修改次数', td: pv ? `${pv.avgEdits - lat.avgEdits >= 0 ? '+' : ''}${(pv.avgEdits - lat.avgEdits).toFixed(1)}` : '-7%', up: !pv ? false : lat.avgEdits <= pv.avgEdits, c: '#00D68F', tg: 5, dv: lat?.avgEdits ?? 5.2 },
  ] as const;
  const rk = [28000, 23500, lat?.atsPassRate ?? 78, lat?.avgEdits ?? 5.2];
  const ak0 = useCU(rk[0], 900, ld), ak1 = useCU(rk[1], 900, ld), ak2 = useCU(rk[2], 900, ld), ak3 = useCU(rk[3], 900, ld);
  const ak = [ak0, ak1, ak2, ak3];

  const cd = useMemo(() => {
    const a: ChartPoint[] = [...qt]; if (a.length < 2) return a;
    const n = a.length, x1 = n - 2, x2 = n - 1;
    const sA = a[x2].atsPassRate - a[x1].atsPassRate, sE = a[x2].avgEdits - a[x1].avgEdits;
    const ld = new Date(a[x2].date + '-01');
    for (let i = 1; i <= 3; i++) { const d = new Date(ld); d.setMonth(d.getMonth() + i); a.push({ date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')} (预)`, avgEdits: +(a[x2].avgEdits + sE * i).toFixed(1), atsPassRate: Math.round(a[x2].atsPassRate + sA * i), predicted: true }); }
    return a;
  }, [qt]);

  const fd = [{ n: '创建简历', v: 100, c: '#00D68F' }, { n: 'AI对话', v: 85, c: '#00D68Fcc' }, { n: '实验室优化', v: 62, c: '#00D68F99' }, { n: '导出', v: 48, c: '#00D68F77' }, { n: '保存版本', v: 31, c: '#00D68F55' }];
  const yd = cm === 'yoy' ? [50, 100] as [number, number] : cm === 'mom' ? [70, 95] as [number, number] : [0, 100] as [number, number];
  const si = sc ? th.find(h => h.templateName === sc.t && h.industry === sc.i) : null;
  const ft = (d: Date) => d.toLocaleTimeString('zh-CN', { hour12: false });
  const bc = ['#00D68F', '#00D68Fcc', '#00D68F99', '#00D68F77', '#00D68F55', '#00D68F33'];
  const mv = (fn: () => void, af?: () => void) => { sld(true); setTimeout(() => { sld(false); slu(new Date()); stst(true); setTimeout(() => stst(false), 2000); fn?.(); af?.(); }, 1500); };

  return <div className="p-8 space-y-8 relative"><style>{`@keyframes sh { 100% { transform: translateX(100%); } }`}</style>
    <AnimatePresence>{tst && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-brand-900 text-white rounded-xl shadow-2xl flex items-center gap-2 text-sm font-body"><CC cn="w-4 h-4 text-brand-400" /> 数据已刷新</motion.div>}</AnimatePresence>

    <div className="flex items-start justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3"><BarChart3 className="w-7 h-7 text-brand-500" /><div><h1 className="font-display text-3xl font-bold text-brand-900">数据看板</h1><div className="text-xs text-surface-400 font-mono mt-1">最后更新：{ft(lu)} · 当前 {ft(now)}</div></div></div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button onClick={() => { sro(v => !v); seo(false); }} className="px-4 py-2 rounded-lg bg-white shadow-sm text-sm font-body border border-surface-100 hover:border-brand-300 transition-all flex items-center gap-2">{rangeOpts.find(o => o.v === dr)?.l}<ChevronDown className={`w-4 h-4 transition-transform ${ro ? 'rotate-180' : ''}`} /></button>
          <AnimatePresence>{ro && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-surface-100 py-1 z-40">{rangeOpts.map(o => <button key={o.v} onClick={() => { sdr(o.v); sro(false); }} className={`w-full px-4 py-2 text-left text-sm font-body transition-colors ${dr === o.v ? 'bg-brand-500/10 text-brand-600 font-medium' : 'text-brand-900 hover:bg-surface-50'}`}>{o.l}</button>)}</motion.div>}</AnimatePresence>
        </div>
        <button onClick={() => mv(() => {})} className="px-4 py-2 rounded-lg bg-white shadow-sm text-sm font-body border border-surface-100 hover:border-brand-300 transition-all flex items-center gap-2 text-brand-700"><RefreshCw className={`w-4 h-4 ${ld ? 'animate-spin' : ''}`} /> 刷新数据</button>
        <div className="relative">
          <button onClick={() => { seo(v => !v); sro(false); }} className="px-4 py-2 rounded-lg bg-brand-500 text-white shadow-sm hover:bg-brand-600 transition-all flex items-center gap-2 text-sm font-medium shadow-brand-500/25"><Download className="w-4 h-4" /> 导出报表<ChevronDown className={`w-4 h-4 transition-transform ${eo ? 'rotate-180' : ''}`} /></button>
          <AnimatePresence>{eo && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-surface-100 py-1 z-40">{[{ ic: FileSpreadsheet, lb: '导出 Excel', cl: 'text-emerald-600' }, { ic: FileText, lb: '导出 CSV', cl: 'text-blue-600' }, { ic: File, lb: '导出 PDF', cl: 'text-red-600' }].map(it => <button key={it.lb} onClick={() => { seo(false); mv(() => {}); }} className="w-full px-4 py-2 text-left text-sm font-body text-brand-900 hover:bg-surface-50 flex items-center gap-2 transition-colors"><it.ic className={`w-4 h-4 ${it.cl}`} /> {it.lb}</button>)}</motion.div>}</AnimatePresence>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-6">{kpis.map((k, i) => <motion.div key={k.lb} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .1 }} className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between"><k.ic className="w-5 h-5" style={{ color: k.c }} /><span className={`text-xs font-mono flex items-center gap-0.5 ${k.up ? 'text-brand-500' : 'text-red-400'}`}>{k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{k.td} vs上月</span></div>
      <div className="flex items-end gap-3">
        <div className="flex-1">{ld ? <Sh className="h-8 w-24" /> : <div className="font-display text-2xl font-bold text-brand-900 font-mono">{'dv' in k ? ak[i].toFixed(1) : i < 2 ? Math.round(ak[i]).toLocaleString() : Math.round(ak[i]) + '%'}</div>}<div className="text-sm text-surface-300 font-body mt-1">{k.lb}</div></div>
        {k.tg !== null && <div className="flex flex-col items-center gap-1"><PR v={'dv' in k ? (k.tg as number - (k.dv as number) + 2) : (rk[i] as number)} tg={k.tg as number} c={k.c} /><div className="text-[10px] text-surface-400 font-mono">目标 {k.lb === '平均ATS通过率' ? `${ATS_TARGET}%` : `${IDEAL_EDITS}`}</div></div>}
      </div>
    </motion.div>)}</div>

    <div className="grid grid-cols-5 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .4 }} className="col-span-3 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3"><h2 className="font-display text-lg font-bold text-brand-900">简历质量趋势</h2><div className="flex gap-1.5">{(['none', 'mom', 'yoy'] as const).map(m => <button key={m} onClick={() => scm(m)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${cm === m ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-50 text-surface-500 hover:bg-surface-100'}`}>{m === 'none' ? '默认' : m === 'mom' ? '环比' : '同比'}</button>)}</div></div>
        {ld ? <Sh className="h-[260px] w-full" /> : <ResponsiveContainer width="100%" height={260}><AreaChart data={cd}>
          <defs><linearGradient id="pA" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#D4A843" stopOpacity={.15} /><stop offset="100%" stopColor="#D4A843" stopOpacity={.05} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F4" /><XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#B8BDC8" /><YAxis tick={{ fontSize: 11 }} stroke="#B8BDC8" domain={yd} />
          <Tooltip content={({ payload, label }) => { if (!payload?.length) return null; const p = payload[0].payload, idx = cd.findIndex(c => c.date === label), pc = idx > 0 ? cd[idx - 1] : null, dA = pc ? p.atsPassRate - pc.atsPassRate : 0, dE = pc ? (p.avgEdits - pc.avgEdits).toFixed(1) : '0'; return <div className="bg-white shadow-lg rounded-lg p-3 text-xs font-body border border-surface-100 min-w-[180px]"><p className="text-surface-400 mb-2 font-medium">{label}{p.predicted ? ' · 预测' : ''}</p><div className="space-y-1.5"><div className="flex items-center justify-between gap-4"><span className="text-surface-500">ATS通过率</span><span className="font-mono font-bold text-gold-600">{p.atsPassRate}%</span></div><div className="flex items-center justify-between gap-4"><span className="text-surface-500">环比变化</span><span className={`font-mono ${dA >= 0 ? 'text-brand-500' : 'text-red-400'}`}>{dA >= 0 ? '+' : ''}{dA}%</span></div><div className="flex items-center justify-between gap-4"><span className="text-surface-500">距离目标</span><span className="font-mono text-gold-500">{Math.max(0, ATS_TARGET - p.atsPassRate)}%</span></div><div className="pt-1.5 border-t border-surface-100 flex items-center justify-between gap-4"><span className="text-surface-500">平均修改</span><span className="font-mono font-bold text-brand-600">{p.avgEdits} 次</span></div><div className="flex items-center justify-between gap-4"><span className="text-surface-500">环比变化</span><span className={`font-mono ${Number(dE) <= 0 ? 'text-brand-500' : 'text-red-400'}`}>{Number(dE) <= 0 ? '' : '+'}{dE}</span></div></div></div>; }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} formatter={(v: string) => <span className="text-surface-500">{v}</span>} />
          <ReferenceLine y={ATS_TARGET} stroke="#D4A843" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: `ATS目标 ${ATS_TARGET}%`, position: 'right', fontSize: 10, fill: '#D4A843', fontWeight: 600 }} />
          <Area type="monotone" dataKey="avgEdits" name="平均修改" stroke="#00D68F" fill="#00D68F" fillOpacity={.12} strokeWidth={2} dot={{ r: 3, fill: '#00D68F' }} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="atsPassRate" name="ATS通过率" stroke="#D4A843" fill="#D4A843" fillOpacity={.12} strokeWidth={2} dot={{ r: 3, fill: '#D4A843' }} activeDot={{ r: 5 }} />
          {cd.some(d => d.predicted) && <Area type="monotone" dataKey="atsPassRate" name="修改趋势预测" stroke="#10B981" strokeDasharray="6 5" fill="url(#pA)" strokeWidth={1.5} dot={{ r: 0 }} data={cd.filter(d => d.predicted || cd[cd.indexOf(d) - 1]?.predicted)} />}
        </AreaChart></ResponsiveContainer>}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }} className="col-span-2 bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-display text-lg font-bold text-brand-900 mb-4">模板使用排行</h2>
        {ld ? <Sh className="h-[260px] w-full" /> : <ResponsiveContainer width="100%" height={260}><BarChart data={tr} layout="vertical"><XAxis type="number" tick={{ fontSize: 11 }} stroke="#B8BDC8" /><YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#B8BDC8" width={70} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #EEF0F4' }} formatter={(v: number) => [`${v.toLocaleString()} 次`, '使用量']} /><Bar dataKey="usage" radius={[0, 4, 4, 0]}>{tr.map((_, i) => <Cell key={i} fill={bc[i % bc.length]} />)}</Bar></BarChart></ResponsiveContainer>}
      </motion.div>
    </div>

    <div className="grid grid-cols-5 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .6 }} className="col-span-3 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3"><h2 className="font-display text-lg font-bold text-brand-900">模板-行业使用热力图</h2><div className="flex items-center gap-3 text-xs font-body">{[{ l: '低频', c: 'bg-brand-500/20' }, { l: '中频', c: 'bg-brand-500/50' }, { l: '高频', c: 'bg-brand-500' }].map(x => <div key={x.l} className="flex items-center gap-1.5"><div className={`w-4 h-4 rounded ${x.c}`} /><span className="text-surface-500">{x.l}</span></div>)}</div></div>
        {si && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20 flex items-center justify-between flex-wrap gap-3"><div className="flex items-center gap-4 text-xs font-body"><span className="font-medium text-brand-900">{si.templateName}</span><span className="text-surface-400">|</span><span className="text-surface-600">行业：{si.industry}</span><span className="text-surface-400">|</span><span className="font-mono text-brand-600 font-bold">{si.usageCount.toLocaleString()} 次</span><span className="text-surface-400">|</span><span className="font-mono text-surface-500">{((si.usageCount / tu) * 100).toFixed(1)}%</span><span className="text-surface-400">|</span><span className="flex items-center gap-1 text-brand-500 font-mono"><ArrowUpRight className="w-3 h-3" /> +{(Math.sin(si.usageCount) * 8 + 12).toFixed(1)}%</span></div><button onClick={() => ssc(null)} className="text-xs text-surface-400 hover:text-surface-600">清除</button></motion.div>}
        {ld ? <Sh className="h-[280px] w-full" /> : <div className="overflow-x-auto"><table className="w-full text-xs font-body"><thead><tr><th className="text-left py-2 px-2 text-surface-300 font-normal" />{ins.map(i => <th key={i} className="py-2 px-2 text-center text-surface-300 font-normal">{i}</th>)}</tr></thead><tbody>{ts.map(t => <tr key={t}><td className="py-2 px-2 text-brand-900 font-medium whitespace-nowrap"><div className="flex items-center gap-1.5">{topT.includes(t) && <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-gold-400 to-gold-600 text-white rounded shadow-sm">TOP {topT.indexOf(t) + 1}</span>}{t}</div></td>{ins.map(i => { const c = th.find(h => h.templateName === t && h.industry === i), op = c ? Math.max(.1, c.usageCount / mu) : 0, sel = sc?.t === t && sc?.i === i; return <td key={i} className="py-2 px-2 text-center"><div onClick={() => c && ssc(sel ? null : { t, i })} style={{ backgroundColor: c ? `rgba(0,214,143,${op})` : 'transparent', color: op > .4 ? '#fff' : '#0A2E1C', border: sel ? '2px solid #0A2E1C' : '2px solid transparent', transform: sel ? 'scale(1.08)' : undefined }} className={`mx-auto w-12 h-8 rounded flex items-center justify-center font-mono transition-all duration-200 ${c ? 'cursor-pointer hover:scale-110 hover:shadow-md' : ''}`}>{c?.usageCount ?? ''}</div></td>; })}</tr>)}</tbody></table></div>}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .7 }} className="col-span-2 bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-display text-lg font-bold text-brand-900 mb-4">用户活跃度</h2>
        {ld ? <Sh className="h-[200px] w-full mb-4" /> : <div className="space-y-5"><div><div className="text-xs text-surface-300 font-body mb-1">DAU 趋势</div><ResponsiveContainer width="100%" height={60}><AreaChart data={ua}><Area type="monotone" dataKey="dau" stroke="#00D68F" fill="#00D68F" fillOpacity={.15} strokeWidth={1.5} dot={false} /></AreaChart></ResponsiveContainer></div>{ua.length >= 2 && (() => { const la = ua[ua.length - 1], pa = ua[ua.length - 2]; return <><div className="flex items-center justify-between"><div><div className="text-xs text-surface-300 font-body">MAU</div><div className="font-display text-xl font-bold text-brand-900">{la.mau.toLocaleString()}</div></div><span className="text-xs font-mono text-brand-500 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> +{Math.round((la.mau - pa.mau) / pa.mau * 100)}%</span></div><div className="flex items-center justify-between"><div><div className="text-xs text-surface-300 font-body">留存率</div><div className="font-display text-xl font-bold text-gold-500">{(la.retention * 100).toFixed(0)}%</div></div><span className="text-xs font-mono text-brand-500 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> +{Math.round((la.retention - pa.retention) / pa.retention * 100)}%</span></div></>; })()}</div>}
      </motion.div>
    </div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .8 }} className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="font-display text-lg font-bold text-brand-900 mb-6">功能使用漏斗</h2>
      {ld ? <Sh className="h-[200px] w-full" /> : <div className="space-y-4 max-w-3xl mx-auto">{fd.map((f, i) => { const nf = fd[i + 1], cv = nf ? ((nf.v / f.v) * 100).toFixed(0) : null; return <div key={f.n}><div className="flex items-center justify-between mb-1.5"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${f.c}, ${f.c}dd)` }}>{i + 1}</span><span className="text-sm font-medium text-brand-900">{f.n}</span></div><span className="font-display font-bold font-mono text-brand-900 text-lg">{f.v}%</span></div><div className="relative h-9 rounded-lg overflow-hidden bg-surface-50"><motion.div initial={{ width: 0 }} animate={{ width: `${f.v}%` }} transition={{ duration: 1, delay: i * .1, ease: 'easeOut' }} className="h-full rounded-lg" style={{ background: `linear-gradient(90deg, ${f.c}, ${f.c}aa)` }} /></div>{cv && <div className="flex items-center justify-center my-1.5 gap-1.5"><div className="h-3 w-px bg-surface-200" /><span className="text-xs font-mono text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> 转化率 {cv}%</span><div className="h-3 w-px bg-surface-200" /></div>}</div>; })}</div>}
    </motion.div>
  </div>;
}
