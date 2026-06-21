import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  UsersRound, Award, ShieldCheck, Lock, Send, Search, Filter, ChevronRight,
  Star, Briefcase, CalendarCheck, Fingerprint, Check, MessageSquare, FileSignature,
  BadgeCheck, Clock, User, Zap, Film,
} from 'lucide-react';
import type { MatchMatrixItem, CertificateInfo } from 'shared/types';
import { formatNumber } from '@/utils/format';
import type { EChartsOption } from 'echarts';
import { clsx } from 'clsx';

const roles = ['全部', '导演', '编剧', '制片人', '摄影指导', '美术指导', '音乐总监', '主演', '动作指导', '剪辑师', '特效总监'];
const schedules = ['全部', '2026Q3', '2026Q4', '2027Q1', '2027春节档', '2027暑期档'];
const positions = ['全部', '一线', '资深', '中坚', '新锐', '潜力'];

export default function CrewCollaboration() {
  const [matches, setMatches] = useState<MatchMatrixItem[]>([]);
  const [cert, setCert] = useState<CertificateInfo | null>(null);
  const [selected, setSelected] = useState<MatchMatrixItem | null>(null);
  const [filters, setFilters] = useState({ role: '全部', schedule: '全部', position: '全部' });
  const [negotiating, setNegotiating] = useState(true);
  const [messages, setMessages] = useState<{ from: 'me' | 'them'; time: string; content: string }[]>([
    { from: 'them', time: '10:24', content: '您好，看到贵方《星河长明》项目的导演邀约，非常感兴趣，我这边Q3档期预留了空间。' },
    { from: 'them', time: '10:25', content: '过往类似科幻题材的经历我整理在作品验证板块，可查阅《星际迷途》相关资料。' },
    { from: 'me', time: '10:32', content: '陈导您好！感谢回复。贵方在硬科幻领域的执导能力我们非常认可，预算方面我们的方案是基础酬金+票房分账模式。' },
  ]);
  const [draftMsg, setDraftMsg] = useState('');

  useEffect(() => {
    const role = filters.role === '全部' ? '' : filters.role;
    fetch(`/api/crew/match?role=${encodeURIComponent(role)}`).then(r => r.json()).then(j => {
      setMatches(j.data);
      if (j.data?.length) setSelected(j.data[0]);
    });
    fetch('/api/crew/certificate').then(r => r.json()).then(j => setCert(j.data));
  }, [filters.role]);

  const rolesShort = roles.slice(1, 7);
  const posShort = positions.slice(1);
  const heatData: [number, number, number][] = [];
  for (let pi = 0; pi < posShort.length; pi++) {
    for (let ri = 0; ri < rolesShort.length; ri++) {
      const base = 90 - pi * 3 - ri * 1.5;
      heatData.push([ri, pi, Math.max(58, Math.min(97, Math.round(base + (Math.random() - 0.5) * 8)))]);
    }
  }

  const matchHeatmapOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1', fontSize: 12 },
    },
    grid: { left: 70, right: 24, top: 12, bottom: 48 },
    xAxis: { type: 'category', data: rolesShort, axisLine: { lineStyle: { color: '#1A2A47' } }, axisLabel: { color: '#94a3b8', fontSize: 11, rotate: 15 }, axisTick: { show: false }, splitArea: { show: true } },
    yAxis: { type: 'category', data: posShort, axisLine: { lineStyle: { color: '#1A2A47' } }, axisLabel: { color: '#94a3b8', fontSize: 11 }, axisTick: { show: false }, splitArea: { show: true } },
    visualMap: { min: 55, max: 98, orient: 'horizontal', left: 'center', bottom: 2, textStyle: { color: '#94a3b8', fontSize: 10 }, itemWidth: 10, itemHeight: 100, calculable: true, inRange: { color: ['#0F1B30', '#1E3A5F', '#3B82F6', '#10B981', '#F59E0B', '#C0392B', '#D4AF37'] } },
    series: [{ type: 'heatmap', data: heatData, label: { show: true, color: '#fff', fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600 }, emphasis: { itemStyle: { borderColor: '#D4AF37', borderWidth: 2, shadowBlur: 16, shadowColor: 'rgba(212,175,55,0.6)' } } }],
  };

  const works = cert?.pastWorks?.length ? cert.pastWorks : [
    { title: '流浪地球3', role: '导演', releaseYear: 2025, boxOffice: 486000, rating: 8.9 },
    { title: '满江红', role: '联合导演', releaseYear: 2024, boxOffice: 425000, rating: 8.2 },
    { title: '封神第一部', role: '监制', releaseYear: 2023, boxOffice: 263000, rating: 8.4 },
    { title: '长津湖2', role: '导演组', releaseYear: 2022, boxOffice: 406000, rating: 8.6 },
    { title: '我不是药神', role: '艺术顾问', releaseYear: 2021, boxOffice: 310000, rating: 9.4 },
    { title: '孤注一掷', role: '编剧指导', releaseYear: 2024, boxOffice: 385000, rating: 8.0 },
  ];
  const issuers = cert?.issuerVerifications?.length ? cert.issuerVerifications : [
    { issuerName: '中国电影家协会', cooperationCount: 12, creditScore: 96, verifiedDate: '2025-08-15' },
    { issuerName: '中影股份', cooperationCount: 8, creditScore: 94, verifiedDate: '2025-03-22' },
    { issuerName: '北京文化', cooperationCount: 5, creditScore: 92, verifiedDate: '2024-11-08' },
    { issuerName: '万达影业', cooperationCount: 6, creditScore: 90, verifiedDate: '2024-06-18' },
  ];

  const sendMsg = () => {
    if (!draftMsg.trim()) return;
    const now = new Date();
    const fmt = () => `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages(m => [...m, { from: 'me', time: fmt(), content: draftMsg }]);
    setDraftMsg('');
    setTimeout(() => {
      setMessages(m => [...m, { from: 'them', time: fmt(), content: '收到，我这边综合评估后24小时内给到正式答复。期待合作！' }]);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-gold-500 font-medium tracking-widest uppercase mb-1.5">Crew Collaboration Hub</div>
          <h1 className="font-serif text-3xl font-bold text-slate-100">
            <span className="text-gradient-gold">剧组协作中心</span> · 可信匹配
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">角色×职位×档期三维匹配 · 出品方背书认证 · 端到端加密意向协商</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 rounded-xl bg-space-800/50 border border-space-700/50 p-1">
            {['匹配推荐', '我的项目', '邀约记录'].map((t, i) => (
              <button key={t} className={clsx('px-4 rounded-lg text-sm font-medium transition-all', i === 0 ? 'bg-gold-500/20 text-gold-400 shadow-inner' : 'text-slate-400 hover:text-slate-200')}>
                {t}
              </button>
            ))}
          </div>
          <button className="btn-primary h-10 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" />发布新项目
          </button>
        </div>
      </div>

      <div className="cip-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
          <input placeholder="搜索姓名 / 作品 / 出品方..." className="w-60 h-10 pl-10 pr-4 rounded-xl bg-space-800/50 border border-space-700/50 text-sm placeholder:text-slate-500 focus:outline-none focus:border-gold-500/40 transition-all" />
        </div>
        {[
          { k: 'role', label: '角色', icon: Briefcase, items: roles.slice(0, 8) },
          { k: 'schedule', label: '档期', icon: CalendarCheck, items: schedules },
          { k: 'position', label: '级别', icon: Award, items: positions },
        ].map(sec => (
          <div key={sec.k} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1.5"><sec.icon className="w-3.5 h-3.5" />{sec.label}</span>
            <div className="flex gap-1 flex-wrap">
              {sec.items.map(r => (
                <button key={r} onClick={() => setFilters(f => ({ ...f, [sec.k]: r }))} className={clsx('chip text-xs py-1 px-2.5', (filters as never)[sec.k] === r && 'chip-active')}>{r}</button>
              ))}
            </div>
            <div className="cip-divider w-px h-6 mx-1 hidden md:block" />
          </div>
        ))}
        <div className="ml-auto">
          <button className="btn-secondary h-10 flex items-center gap-1.5 text-sm">
            <Filter className="w-4 h-4" />高级筛选
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 space-y-5">
          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2.5">
                <UsersRound className="w-5 h-5 text-chart-purple" strokeWidth={1.8} />
                角色 × 职位 × 档期 匹配矩阵
              </h3>
              <span className="badge badge-online">AI推荐 v2.4</span>
            </div>
            <ReactECharts option={matchHeatmapOption} style={{ height: 320 }} />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-space-800/40 border border-space-700/40">
                <div className="kpi-label mb-1">匹配率均值</div>
                <div className="font-mono font-bold text-gold-400 text-lg">78.4%</div>
              </div>
              <div className="p-3 rounded-xl bg-space-800/40 border border-space-700/40">
                <div className="kpi-label mb-1">A级以上候选</div>
                <div className="font-mono font-bold text-chart-green text-lg">{matches.filter(m => m.matchScore >= 80).length || 7}<span className="text-xs ml-0.5">人</span></div>
              </div>
              <div className="p-3 rounded-xl bg-space-800/40 border border-space-700/40">
                <div className="kpi-label mb-1">档期匹配率</div>
                <div className="font-mono font-bold text-chart-blue text-lg">82.5%</div>
              </div>
            </div>
          </div>

          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-gold-400" strokeWidth={1.8} />
                智能推荐 · TOP候选
              </h3>
              <span className="text-xs text-slate-500">共 {matches.length || 12} 位</span>
            </div>
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
              {(matches.length ? matches : Array.from({ length: 10 }).map((_, i) => ({
                candidateId: `C${String(i).padStart(4, '0')}`, candidateName: ['张艺谋', '陈思诚', '郭帆', '贾玲', '吴京', '沈腾', '张译', '雷佳音', '于和伟', '刘德华'][i],
                role: ['导演', '编剧', '制片人', '主演', '摄影指导'][i % 5], position: ['一线', '资深', '中坚'][i % 3],
                matchScore: Math.round(95 - i * 2 - Math.random() * 3),
                dimensionScores: { roleFit: 90 - i, positionFit: 88 - i, scheduleFit: Math.round(92 - i * 1.5), creditLevel: Math.round(94 - i * 1.2) },
                credits: ['流浪地球', '满江红', '封神第一部', '长津湖', '消失的她'].slice(0, 3 + (i % 2)),
                verifiedBadges: ['实名认证', '中影协认证', '一线认证', '出品方背书'].slice(0, 3),
              } as MatchMatrixItem))).map((m, i) => (
                <button
                  key={m.candidateId}
                  onClick={() => setSelected(m)}
                  className={clsx(
                    'w-full text-left p-4 rounded-xl border transition-all flex gap-3.5 group',
                    selected?.candidateId === m.candidateId
                      ? 'bg-gradient-to-br from-gold-500/15 to-transparent border-gold-500/40 shadow-glow-gold'
                      : 'bg-space-800/30 border-space-700/40 hover:border-space-600/60 hover:bg-space-700/30'
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-purple/30 via-gold-500/20 to-chart-blue/30 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-200" strokeWidth={1.8} />
                    </div>
                    {i < 3 && (
                      <span className={clsx('absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', i === 0 ? 'bg-gold-500 text-space-950' : 'bg-space-700 text-gold-400')}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={clsx('font-semibold truncate', selected?.candidateId === m.candidateId ? 'text-gold-400' : 'text-slate-200')}>{m.candidateName}</span>
                        {m.verifiedBadges.includes('实名认证') && <BadgeCheck className="w-3.5 h-3.5 text-chart-blue shrink-0" strokeWidth={2.5} />}
                        {m.verifiedBadges.includes('一线认证') && <Star className="w-3.5 h-3.5 text-gold-400 shrink-0 fill-gold-400" strokeWidth={0} />}
                      </div>
                      <span className="shrink-0">
                        <span className={clsx('font-mono font-bold text-lg', m.matchScore >= 90 ? 'text-gold-400' : m.matchScore >= 80 ? 'text-chart-green' : m.matchScore >= 70 ? 'text-chart-blue' : 'text-slate-400')}>
                          {m.matchScore}
                        </span>
                        <span className="text-xs text-slate-500 ml-0.5">分</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                      <span>{m.role}</span><span className="text-space-600">·</span>
                      <span>{m.position}级别</span><span className="text-space-600">·</span>
                      <span className="flex items-center gap-0.5 text-chart-green"><CalendarCheck className="w-3 h-3" />档期 {m.dimensionScores.scheduleFit}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {m.credits.slice(0, 3).map(w => (
                        <span key={w} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-space-700/60 text-slate-400 border border-space-600/40">
                          <Film className="w-2.5 h-2.5" />{w}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[{ k: '角色', v: m.dimensionScores.roleFit }, { k: '职位', v: m.dimensionScores.positionFit }, { k: '档期', v: m.dimensionScores.scheduleFit }, { k: '资信', v: m.dimensionScores.creditLevel }].map(d => (
                        <div key={d.k} className="flex flex-col">
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-slate-500">{d.k}</span><span className="font-mono text-slate-300">{d.v}</span>
                          </div>
                          <div className="h-1 rounded-full bg-space-700 overflow-hidden">
                            <div className={clsx('h-full rounded-full', d.v >= 85 ? 'bg-gold-500' : d.v >= 70 ? 'bg-chart-green' : d.v >= 55 ? 'bg-chart-blue' : 'bg-slate-500')} style={{ width: `${d.v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 space-y-5">
          <div className="cip-card p-5 border-gradient-gold">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-chart-purple/40 via-gold-500/30 to-chart-blue/40 flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-xl font-bold text-slate-100">{selected?.candidateName || '张艺谋'}</h3>
                    <span className={clsx('badge text-[10px] px-2 py-0.5', (cert?.overallCreditLevel || 'AAA') === 'AAA' ? 'bg-gradient-to-r from-gold-500/30 to-amber-500/20 text-gold-300 border-gold-500/50' : 'bg-chart-purple/15 text-chart-purple border-chart-purple/30')}>
                      <ShieldCheck className="w-3 h-3 mr-0.5 inline" />资信等级 {cert?.overallCreditLevel || 'AAA'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 mb-2">
                    <span>{selected?.role || '导演'}</span>
                    <span className="mx-1.5 text-space-600">·</span>
                    <span>{selected?.position || '一线'}</span>
                    <span className="mx-1.5 text-space-600">·</span>
                    <span className="text-chart-green flex items-center inline-flex gap-1"><CalendarCheck className="w-3.5 h-3.5" />2026Q3档期可接</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected?.verifiedBadges?.length ? selected.verifiedBadges : ['实名认证', '中影协认证', '一线认证', '出品方背书', '作品验证']).map(b => (
                      <span key={b} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400/90 border border-gold-500/25">
                        <Fingerprint className="w-2.5 h-2.5" />{b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button onClick={() => setNegotiating(!negotiating)} className={clsx('px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5', negotiating ? 'bg-gold-500 text-space-950 shadow-glow-gold' : 'btn-primary')}>
                  <Lock className="w-4 h-4" />{negotiating ? '协商中' : '加密协商通道'}
                </button>
                <button className="btn-secondary h-10 flex items-center gap-1.5 text-sm">
                  <FileSignature className="w-4 h-4" />发起正式邀约
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { l: '代表作品数', v: String(works.length || 16), sub: '部作品', icon: Film, c: 'text-gold-400' },
                { l: '累计票房', v: formatNumber(works.reduce((a, w) => a + w.boxOffice, 0) * 10000, 2).replace(/\.0/, ''), sub: '票房总和', icon: Zap, c: 'text-cine-400' },
                { l: '出品方背书', v: String(issuers.length || 4), sub: '家权威机构', icon: ShieldCheck, c: 'text-chart-blue' },
                { l: '平均评分', v: (works.reduce((a, w) => a + w.rating, 0) / works.length).toFixed(1), sub: '豆瓣均分', icon: Star, c: 'text-chart-orange' },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-xl bg-space-800/40 border border-space-700/40">
                  <div className={clsx('w-8 h-8 rounded-lg bg-space-700/60 flex items-center justify-center mb-2', m.c)}>
                    <m.icon className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div className="kpi-label mb-1">{m.l}</div>
                  <div className={clsx('font-mono font-bold text-xl', m.c)}>{m.v}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-gold-400" />出品方背书验证链
                </h4>
                <div className="space-y-2">
                  {issuers.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-space-800/30 border border-space-700/40">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-chart-green/20 to-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-chart-green" strokeWidth={3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-200 truncate">{v.issuerName}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-chart-green">
                            <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />官方背书
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">合作{v.cooperationCount}次 · 信用分 {v.creditScore} · 认证于 {v.verifiedDate}</div>
                      </div>
                      <div className="w-10 h-2 rounded-full bg-space-700 overflow-hidden shrink-0">
                        <div className="h-full rounded-full bg-gradient-to-r from-chart-green to-emerald-400" style={{ width: `${v.creditScore}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-chart-purple" />过往作品验证
                </h4>
                <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                  {works.map((w, i) => (
                    <div key={i} className="p-3 rounded-xl bg-space-800/30 border border-space-700/40 hover:border-space-600/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-semibold text-slate-200 truncate">{w.title}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">({w.releaseYear})</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-[11px] text-chart-orange shrink-0">
                          <Star className="w-3 h-3 fill-chart-orange" strokeWidth={0} />
                          <span className="font-mono font-bold">{w.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">{w.role}</span>
                        <span className="text-[11px] font-mono text-gold-400">{formatNumber(w.boxOffice)}万 票房</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {negotiating && (
            <div className="cip-card p-5 border border-chart-purple/40">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-space-700/40">
                <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2.5">
                  <MessageSquare className="w-5 h-5 text-chart-purple" strokeWidth={1.8} />
                  端到端加密协商通道
                  <span className="inline-flex items-center gap-1 text-[10px] text-chart-green ml-1 px-2 py-0.5 rounded-full bg-chart-green/15 border border-chart-green/30">
                    <Lock className="w-3 h-3" />AES-256加密
                  </span>
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />有效期至：2026-07-20
                </div>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin pr-2 mb-4">
                {messages.map((msg, i) => (
                  <div key={i} className={clsx('flex gap-2.5', msg.from === 'me' ? 'justify-end' : 'justify-start')}>
                    {msg.from === 'them' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-purple/30 to-blue-500/30 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-300" strokeWidth={1.8} />
                      </div>
                    )}
                    <div className={clsx('max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed', msg.from === 'me' ? 'bg-gradient-to-br from-gold-500 to-amber-600 text-space-950 rounded-br-sm' : 'bg-space-700/70 text-slate-200 border border-space-600/50 rounded-bl-sm')}>
                      {msg.content}
                      <div className={clsx('text-[10px] mt-1', msg.from === 'me' ? 'text-space-950/70' : 'text-slate-500')}>{msg.time}</div>
                    </div>
                    {msg.from === 'me' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500/40 to-amber-600/40 flex items-center justify-center shrink-0">
                        <BadgeCheck className="w-4 h-4 text-gold-300" strokeWidth={2.2} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-end gap-2 pt-3 border-t border-space-700/40">
                <textarea
                  value={draftMsg}
                  onChange={e => setDraftMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  rows={2}
                  placeholder="输入加密消息（Enter 发送，Shift+Enter 换行）..."
                  className="flex-1 p-3 rounded-xl bg-space-800/50 border border-space-700/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-chart-purple/50 resize-none transition-colors"
                />
                <button onClick={sendMsg} className="h-full px-4 py-3 rounded-xl bg-gradient-to-br from-chart-purple to-violet-600 text-white hover:from-chart-purple/90 hover:to-violet-500 transition-all flex flex-col items-center gap-1 text-xs font-medium shadow-lg">
                  <Send className="w-4 h-4" strokeWidth={2} />
                  发送
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3 text-chart-green" />端到端加密，第三方不可见</span>
                <span className="inline-flex items-center gap-1"><FileSignature className="w-3 h-3 text-gold-400" />支持电子合同签署</span>
                <span className="inline-flex items-center gap-1"><ChevronRight className="w-3 h-3 text-chart-blue" />可升级为多方协作空间</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
