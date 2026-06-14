import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Shield, CheckCircle2, AlertTriangle, FileWarning, Banknote,
  Clock, Users, Zap, Eye, ChevronDown, Search, Activity,
  ThumbsUp, XCircle, FileCheck, FileText, TrendingUp,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatMoney, formatDateTime } from '@/utils/format';
import type { CargoOrder } from '@/types';

export default function InsuranceManage() {
  const { orders, init, loading } = useOrderStore();
  useEffect(() => { init(); }, [init]);

  const [tab, setTab] = useState<'PENDING' | 'ISSUED' | 'CLAIM'>('PENDING');
  const [search, setSearch] = useState('');

  const insuredOrders = useMemo(() => orders.filter((o) => o.insurance.enabled), [orders]);

  const stats = useMemo(() => {
    const totalInsured = insuredOrders.length;
    const totalPremium = insuredOrders.reduce((s, o) => s + o.insurance.premium, 0);
    const totalCoverage = insuredOrders.reduce((s, o) => s + o.insurance.coverage, 0);
    const pending = insuredOrders.filter((o) => o.insurance.status === 'PENDING').length;
    const issued = insuredOrders.filter((o) => ['ISSUED', 'SETTLED'].includes(o.insurance.status)).length;
    const claimCount = Math.floor(totalInsured * 0.06);
    const claimRate = totalInsured > 0 ? ((claimCount / totalInsured) * 100).toFixed(2) : '0';
    const settledAmount = claimCount * 2800;
    return { totalInsured, totalPremium, totalCoverage, pending, issued, claimCount, claimRate, settledAmount };
  }, [insuredOrders]);

  const pendingList = useMemo(() => insuredOrders.filter((o) => o.insurance.status === 'PENDING'), [insuredOrders]);
  const issuedList = useMemo(() => insuredOrders.filter((o) => ['ISSUED', 'SETTLED'].includes(o.insurance.status)), [insuredOrders]);
  const claimList = useMemo(() => {
    const excOrders = orders.filter((o) => o.status === 'EXCEPTION' || (o.fulfillment && !o.fulfillment.overallPass)).slice(0, 8);
    return excOrders.map((o, i) => ({
      order: o,
      claimId: `CLM202606${String(1000 + i).padStart(4, '0')}`,
      claimType: ['温度异常', '货物破损', '超时送达', '丢失短少'][i % 4],
      claimAmount: Math.floor(800 + Math.random() * 12000),
      status: (['REVIEWING', 'APPROVED', 'REJECTED', 'PAID'] as const)[i % 4],
      filedAt: new Date(Date.now() - i * 3600000 * 7).toISOString(),
    }));
  }, [orders]);

  const premiumTrendOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 40, right: 16, top: 12, bottom: 24 },
    tooltip: { trigger: 'axis', backgroundColor: '#0B1220', borderColor: '#243049', textStyle: { color: '#E2E8F0', fontSize: 11 } },
    xAxis: { type: 'category', data: ['6/8', '6/9', '6/10', '6/11', '6/12', '6/13', '6/14'], axisLine: { lineStyle: { color: '#243049' } }, axisLabel: { color: '#64748B', fontSize: 10 }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#64748B', fontSize: 10, formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k` }, splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } } },
    series: [{
      type: 'bar', barWidth: 16,
      itemStyle: { borderRadius: [2, 2, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3B82F6' }, { offset: 1, color: 'rgba(59,130,246,0.2)' }] } },
      label: { show: true, position: 'top', color: '#3B82F6', fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700, formatter: (p: { value: number }) => `¥${(p.value / 1000).toFixed(1)}k` },
      data: [18600, 22400, 19800, 27800, 31200, 28600, stats.totalPremium.toFixed(0)],
    }],
  }), [stats.totalPremium]);

  const SelectField = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-industrial appearance-none pr-8 cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value} className="bg-ink-900">{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    </div>
  );

  if (loading) return <div className="h-full flex items-center justify-center text-slate-400">加载保险数据中...</div>;

  return (
    <div className="min-h-screen w-full bg-ink-950 p-5">
      <div className="max-w-[1800px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-signal-blue/40 to-signal-cyan/20 border border-signal-blue/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-signal-blue" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white tracking-wide">保险对接管理</h1>
              <p className="font-mono text-[11px] text-slate-500 mt-0.5 tracking-wider">INSURANCE MANAGEMENT · PICC API</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-sm bg-signal-green/10 border border-signal-green/40 shadow-glow-green-sm">
              <Zap className="w-4 h-4 text-signal-green animate-pulse" />
              <div>
                <div className="font-display font-bold text-sm text-signal-green tracking-wider">PICC ONLINE</div>
                <div className="font-mono text-[9px] text-signal-green/70">人保财险 API 已连接</div>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-500">延迟 42ms · 健康度 99.8%</div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {[
            { label: '投保订单总数', v: stats.totalInsured, u: '单', icon: FileText, c: 'text-signal-blue', bg: 'bg-signal-blue/15', trend: '+8.2%', up: true },
            { label: '累计保费收入', v: `¥${(stats.totalPremium / 10000).toFixed(2)}`, u: '万', icon: Banknote, c: 'text-orange-400', bg: 'bg-orange-500/15', trend: '+12.4%', up: true },
            { label: '风险保额总计', v: `¥${(stats.totalCoverage / 10000).toFixed(1)}`, u: '万', icon: Shield, c: 'text-signal-cyan', bg: 'bg-signal-cyan/15', trend: '+6.7%', up: true },
            { label: '理赔率', v: stats.claimRate, u: '%', icon: AlertTriangle, c: 'text-signal-yellow', bg: 'bg-signal-yellow/15', trend: '-0.3%', up: true },
            { label: '已赔付金额', v: `¥${(stats.settledAmount / 10000).toFixed(2)}`, u: '万', icon: ThumbsUp, c: 'text-signal-red', bg: 'bg-signal-red/15', trend: '+2.1%', up: false },
          ].map((k, i) => (
            <div key={i} className="stat-panel corner-brackets">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-8 h-8 rounded-sm ${k.bg} flex items-center justify-center`}>
                      <k.icon size={15} className={k.c} />
                    </div>
                    <span className="text-xs text-slate-400 font-mono tracking-wider">{k.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display font-extrabold text-2xl ${k.c} tabular-nums`}>{k.v}</span>
                    <span className="text-xs text-slate-500 font-mono">{k.u}</span>
                  </div>
                  <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] ${k.up ? 'text-signal-green' : 'text-signal-red'}`}>
                    {k.up ? <TrendingUp size={10} /> : <TrendingUp size={10} style={{ transform: 'scaleY(-1)' }} />}
                    <span>{k.trend}</span>
                    <span className="text-slate-500 ml-0.5">周环比</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-100 gap-4">
          <div className="col-span-[35%] industrial-card corner-brackets p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-signal-blue" />
                <h3 className="text-sm font-semibold text-white tracking-wide">7日保费收入趋势</h3>
              </div>
              <span className="hex-tag text-[10px]">PREMIUM TREND</span>
            </div>
            <div className="flex-1">
              <ReactECharts option={premiumTrendOption} style={{ height: 220 }} />
            </div>
          </div>

          <div className="col-span-[65%] industrial-card corner-brackets p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-signal-yellow" />
                <h3 className="text-sm font-semibold text-white tracking-wide">待核保队列</h3>
                <span className="hex-tag text-[10px] !bg-signal-yellow/15 !text-signal-yellow">{pendingList.length} 单等待核保</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索订单号" className="input-industrial pl-7 w-44 text-xs" />
                </div>
                <button className="btn-primary !px-3 !py-1.5 text-xs">
                  <FileCheck size={13} className="mr-1.5" />批量审核
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto max-h-[240px]">
              <table className="w-full min-w-[700px]">
                <thead className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur-sm">
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-ink-600/60">
                    <th className="py-2 px-3 text-left font-normal w-8"><input type="checkbox" className="accent-orange-500" /></th>
                    <th className="py-2 px-3 text-left font-normal">订单号</th>
                    <th className="py-2 px-3 text-left font-normal">货主</th>
                    <th className="py-2 px-3 text-right font-normal">货值/保额</th>
                    <th className="py-2 px-3 text-right font-normal">保费</th>
                    <th className="py-2 px-3 text-left font-normal">提交时间</th>
                    <th className="py-2 px-3 text-center font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((o) => (
                    <tr key={o.id} className="border-b border-ink-600/30 hover:bg-orange-500/5 text-xs">
                      <td className="py-2.5 px-3"><input type="checkbox" className="accent-orange-500" /></td>
                      <td className="py-2.5 px-3 font-display font-bold text-orange-400">{o.orderNo}</td>
                      <td className="py-2.5 px-3 text-slate-300">{o.shipperName}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="text-slate-300">{formatMoney(o.cargoValue)}</div>
                        <div className="text-[10px] text-signal-cyan font-mono">保 {formatMoney(o.insurance.coverage)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-display font-bold text-signal-green">{formatMoney(o.insurance.premium)}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{formatDateTime(o.createdAt)}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button title="通过" className="p-1 rounded-sm hover:bg-signal-green/15 text-signal-green"><CheckCircle2 size={14} /></button>
                          <button title="驳回" className="p-1 rounded-sm hover:bg-signal-red/15 text-signal-red"><XCircle size={14} /></button>
                          <button title="查看详情" className="p-1 rounded-sm hover:bg-signal-cyan/15 text-signal-cyan"><Eye size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingList.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-500 text-sm">暂无待核保订单</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="industrial-card corner-brackets overflow-hidden">
          <div className="flex border-b border-ink-600/60 px-5">
            {[
              { key: 'PENDING', label: '待核保', count: stats.pending, icon: Clock, c: 'signal-yellow' },
              { key: 'ISSUED', label: '已完成保单', count: stats.issued, icon: FileCheck, c: 'signal-green' },
              { key: 'CLAIM', label: '理赔申请处理', count: stats.claimCount, icon: FileWarning, c: 'signal-red' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`relative flex items-center gap-2 px-5 py-3.5 transition-all ${
                  tab === t.key ? 'text-orange-400 bg-orange-500/5' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <t.icon size={16} className={tab === t.key ? 'text-orange-400' : ''} />
                <span className="text-sm font-semibold tracking-wide">{t.label}</span>
                <span className={`hex-tag text-[10px] ${tab === t.key ? '' : '!bg-ink-700 !text-slate-400'}`}>{t.count}</span>
                {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
              </button>
            ))}
          </div>

          {tab === 'PENDING' && (
            <div className="p-5">
              <div className="text-xs text-slate-500">↑ 上方待核保队列已展示全部 {stats.pending} 条待处理保单</div>
            </div>
          )}

          {tab === 'ISSUED' && (
            <div className="overflow-auto max-h-[420px]">
              <table className="w-full min-w-[1100px]">
                <thead className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur-sm">
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-ink-600/60">
                    <th className="py-3 px-4 text-left font-normal">保单号</th>
                    <th className="py-3 px-4 text-left font-normal">关联订单</th>
                    <th className="py-3 px-4 text-left font-normal">货主</th>
                    <th className="py-3 px-4 text-right font-normal">保额</th>
                    <th className="py-3 px-4 text-right font-normal">保费</th>
                    <th className="py-3 px-4 text-left font-normal">承保公司</th>
                    <th className="py-3 px-4 text-left font-normal">出单时间</th>
                    <th className="py-3 px-4 text-left font-normal">状态</th>
                    <th className="py-3 px-4 text-center font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedList.map((o) => (
                    <tr key={o.id} className="border-b border-ink-600/30 hover:bg-orange-500/5 text-xs">
                      <td className="py-3 px-4 font-display font-bold text-signal-cyan">{o.insurance.policyNo || '--'}</td>
                      <td className="py-3 px-4 font-mono text-orange-400">{o.orderNo}</td>
                      <td className="py-3 px-4 text-slate-300">{o.shipperName}</td>
                      <td className="py-3 px-4 text-right text-slate-200 font-mono">{formatMoney(o.insurance.coverage)}</td>
                      <td className="py-3 px-4 text-right font-display font-bold text-signal-green">{formatMoney(o.insurance.premium)}</td>
                      <td className="py-3 px-4">
                        <span className="hex-tag text-[9px] !bg-signal-blue/15 !text-signal-blue">PICC 人保</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{formatDateTime(o.matchedAt)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-medium ${
                          o.insurance.status === 'SETTLED' ? 'bg-signal-green/10 text-signal-green' : 'bg-signal-cyan/10 text-signal-cyan'
                        }`}>
                          <span className="status-dot" style={{ backgroundColor: 'currentColor' }} />
                          {o.insurance.status === 'SETTLED' ? '已结算' : '已承保'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 rounded-sm hover:bg-signal-cyan/10 text-signal-cyan"><Eye size={14} /></button>
                          <button className="p-1.5 rounded-sm hover:bg-orange-500/10 text-orange-400"><FileText size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'CLAIM' && (
            <div className="overflow-auto max-h-[420px]">
              <table className="w-full min-w-[1100px]">
                <thead className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur-sm">
                  <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-ink-600/60">
                    <th className="py-3 px-4 text-left font-normal">理赔号</th>
                    <th className="py-3 px-4 text-left font-normal">关联订单</th>
                    <th className="py-3 px-4 text-left font-normal">货主</th>
                    <th className="py-3 px-4 text-left font-normal">理赔类型</th>
                    <th className="py-3 px-4 text-right font-normal">理赔金额</th>
                    <th className="py-3 px-4 text-left font-normal">提交时间</th>
                    <th className="py-3 px-4 text-left font-normal">状态</th>
                    <th className="py-3 px-4 text-center font-normal">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {claimList.map((c) => (
                    <tr key={c.claimId} className={`border-b border-ink-600/30 hover:bg-orange-500/5 text-xs ${c.status === 'REVIEWING' ? 'bg-signal-yellow/[0.03]' : ''}`}>
                      <td className="py-3 px-4 font-display font-bold text-signal-red">{c.claimId}</td>
                      <td className="py-3 px-4 font-mono text-orange-400">{c.order.orderNo}</td>
                      <td className="py-3 px-4 text-slate-300">{c.order.shipperName}</td>
                      <td className="py-3 px-4">
                        <span className="hex-tag text-[9px] !bg-signal-red/15 !text-signal-red">{c.claimType}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-display font-bold text-signal-red text-sm">{formatMoney(c.claimAmount)}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{formatDateTime(c.filedAt)}</td>
                      <td className="py-3 px-4">
                        {c.status === 'REVIEWING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-signal-yellow/10 text-signal-yellow text-[10px] font-medium">
                            <span className="status-dot bg-signal-yellow animate-pulse" />审核中
                          </span>
                        )}
                        {c.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-signal-cyan/10 text-signal-cyan text-[10px] font-medium">
                            <span className="status-dot bg-signal-cyan" />已通过
                          </span>
                        )}
                        {c.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-signal-red/10 text-signal-red text-[10px] font-medium">
                            <span className="status-dot bg-signal-red" />已拒赔
                          </span>
                        )}
                        {c.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-signal-green/10 text-signal-green text-[10px] font-medium">
                            <span className="status-dot bg-signal-green" />已赔付
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 rounded-sm hover:bg-signal-cyan/10 text-signal-cyan"><Eye size={14} /></button>
                          {c.status === 'REVIEWING' && (
                            <>
                              <button className="p-1.5 rounded-sm hover:bg-signal-green/10 text-signal-green"><CheckCircle2 size={14} /></button>
                              <button className="p-1.5 rounded-sm hover:bg-signal-red/10 text-signal-red"><XCircle size={14} /></button>
                            </>
                          )}
                          <button className="p-1.5 rounded-sm hover:bg-orange-500/10 text-orange-400"><FileText size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
