import { useEffect, useMemo, useState } from 'react';
import {
  Search, Filter, Calendar, MapPin, Thermometer, Banknote,
  AlertTriangle, CheckSquare, Square, Eye, Truck, AlertCircle,
  CheckCircle2, MoreHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  Package, RotateCw, XCircle, User,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { statusTextMap, tempControlMap, difficultyMap, formatMoney, formatVolume, formatWeight, formatDateTime } from '@/utils/format';
import type { CargoOrder, OrderStatus, TempControl } from '@/types';
import { AREA_ADDRESSES_EXPORT } from '@/utils/mockData';

export default function AdminOrderManage() {
  const { orders, drivers, init, loading } = useOrderStore();
  useEffect(() => { init(); }, [init]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [tempFilter, setTempFilter] = useState<TempControl | 'ALL'>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [exceptionOnly, setExceptionOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (tempFilter !== 'ALL' && o.tempControl !== tempFilter) return false;
      if (regionFilter !== 'ALL') {
        const pk = o.stops.find((s) => s.type === 'PICKUP');
        if (!pk || !AREA_ADDRESSES_EXPORT.some((a) => a.name === regionFilter && Math.abs(a.lat - pk.lat) < 0.05)) return false;
      }
      if (exceptionOnly && !['EXCEPTION', 'FULFILLMENT_CHECKING'].includes(o.status)) return false;
      if (search && !o.orderNo.toLowerCase().includes(search.toLowerCase()) && !o.shipperName.includes(search)) return false;
      if (minValue && o.cargoValue < +minValue) return false;
      if (maxValue && o.cargoValue > +maxValue) return false;
      if (dateFrom && o.createdAt < dateFrom) return false;
      if (dateTo && o.createdAt > dateTo + 'T23:59:59') return false;
      return true;
    });
  }, [orders, statusFilter, tempFilter, regionFilter, exceptionOnly, search, minValue, maxValue, dateFrom, dateTo]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => ['PUBLISHED', 'MATCHING'].includes(o.status)).length,
    inTransit: orders.filter((o) => ['ACCEPTED', 'PICKING_UP', 'IN_TRANSIT'].includes(o.status)).length,
    exception: orders.filter((o) => o.status === 'EXCEPTION').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
  }), [orders]);

  const allChecked = paged.length > 0 && paged.every((o) => selected.has(o.id));

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else {
      const next = new Set(selected);
      paged.forEach((o) => next.add(o.id));
      setSelected(next);
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const SelectField = ({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string }) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-industrial appearance-none pr-8 cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value} className="bg-ink-900">{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    </div>
  );

  if (loading) return <div className="h-full flex items-center justify-center text-slate-400">加载订单数据中...</div>;

  return (
    <div className="min-h-screen w-full bg-ink-950 p-5">
      <div className="max-w-[1800px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-orange-500/40 to-orange-550/20 border border-orange-500/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-white tracking-wide">订单审核管理</h1>
                <p className="font-mono text-[11px] text-slate-500 mt-0.5 tracking-wider">ORDER MANAGEMENT · ADMIN</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: '全部', v: stats.total, c: 'text-signal-cyan', i: Package },
              { label: '待派', v: stats.pending, c: 'text-signal-yellow', i: RotateCw },
              { label: '在途', v: stats.inTransit, c: 'text-signal-blue', i: Truck },
              { label: '异常', v: stats.exception, c: 'text-signal-red', i: AlertTriangle },
              { label: '已完成', v: stats.completed, c: 'text-signal-green', i: CheckCircle2 },
            ].map((k) => (
              <div key={k.label} className="stat-panel corner-brackets px-4 py-2.5 !p-0 !bg-transparent border-0 shadow-none">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-sm bg-ink-800/80 flex items-center justify-center`}>
                    <k.i size={15} className={k.c} />
                  </div>
                  <div>
                    <div className={`font-display font-bold text-lg ${k.c} tabular-nums leading-none`}>{k.v}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{k.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="industrial-card corner-brackets p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-white tracking-wide">高级筛选</span>
          </div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="订单号/货主名称"
                className="input-industrial pl-8"
              />
            </div>
            <div className="col-span-2">
              <SelectField
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as OrderStatus | 'ALL')}
                placeholder="订单状态"
                options={[
                  { value: 'ALL', label: '全部状态' },
                  ...Object.entries(statusTextMap).map(([k, v]) => ({ value: k, label: v.label })),
                ]}
              />
            </div>
            <div className="col-span-1.5">
              <SelectField
                value={tempFilter}
                onChange={(v) => setTempFilter(v as TempControl | 'ALL')}
                placeholder="温控类型"
                options={[
                  { value: 'ALL', label: '全部温控' },
                  ...Object.entries(tempControlMap).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` })),
                ]}
              />
            </div>
            <div className="col-span-1.5">
              <SelectField
                value={regionFilter}
                onChange={setRegionFilter}
                placeholder="区域"
                options={[{ value: 'ALL', label: '全部区域' }, ...AREA_ADDRESSES_EXPORT.map((a) => ({ value: a.name, label: a.name }))]}
              />
            </div>
            <div className="col-span-1">
              <SelectField
                value={exceptionOnly ? 'EXCEPTION' : 'ALL'}
                onChange={(v) => setExceptionOnly(v === 'EXCEPTION')}
                placeholder="异常"
                options={[{ value: 'ALL', label: '全部订单' }, { value: 'EXCEPTION', label: '仅异常' }]}
              />
            </div>
            <div className="col-span-1.5 flex items-center gap-1.5">
              <div className="relative flex-1">
                <Banknote className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input value={minValue} onChange={(e) => setMinValue(e.target.value)} placeholder="最小" className="input-industrial pl-7 text-xs" type="number" />
              </div>
              <span className="text-slate-500">—</span>
              <input value={maxValue} onChange={(e) => setMaxValue(e.target.value)} placeholder="最大" className="input-industrial text-xs flex-1" type="number" />
            </div>
            <div className="col-span-1.5 flex items-center gap-1.5">
              <div className="relative flex-1">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-industrial pl-7 text-xs" />
              </div>
              <span className="text-slate-500">—</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-industrial text-xs flex-1" />
            </div>
            <div className="col-span-1 flex items-center gap-2">
              <button
                onClick={() => { setStatusFilter('ALL'); setTempFilter('ALL'); setRegionFilter('ALL'); setExceptionOnly(false); setSearch(''); setMinValue(''); setMaxValue(''); setDateFrom(''); setDateTo(''); }}
                className="btn-ghost flex-1 justify-center text-xs"
              >
                重置
              </button>
              <button className="btn-primary text-xs flex-1 justify-center">
                <Search size={14} className="mr-1.5" />筛选
              </button>
            </div>
          </div>
        </div>

        <div className="industrial-card corner-brackets overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-ink-600/60 bg-ink-900/40">
            <div className="flex items-center gap-4">
              <button onClick={toggleAll} className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors">
                {allChecked ? (
                  <CheckSquare className="w-4 h-4 text-orange-500" fill="currentColor" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                全选当前页
              </button>
              {selected.size > 0 && (
                <>
                  <div className="h-4 w-px bg-ink-600/60" />
                  <span className="text-xs text-slate-400">已选 <span className="font-display font-bold text-orange-400">{selected.size}</span> 条</span>
                  <button className="btn-primary !px-3 !py-1.5 text-xs">
                    <Truck size={13} className="mr-1" />批量派单
                  </button>
                  <button className="btn-ghost !px-3 !py-1.5 text-xs">
                    <AlertTriangle size={13} className="mr-1" />标记异常
                  </button>
                  <button className="btn-ghost !px-3 !py-1.5 text-xs">
                    <XCircle size={13} className="mr-1" />批量取消
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
              <span>共 {filtered.length} 条记录</span>
              <div className="h-4 w-px bg-ink-600/60" />
              <span>第 {page} / {totalPages} 页</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-460px)] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur-sm">
                <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-ink-600/60">
                  <th className="w-10 py-3 px-3 text-left font-normal"></th>
                  <th className="py-3 px-4 text-left font-normal">订单号</th>
                  <th className="py-3 px-4 text-left font-normal">货主</th>
                  <th className="py-3 px-4 text-left font-normal">货物属性</th>
                  <th className="py-3 px-4 text-left font-normal">路线</th>
                  <th className="py-3 px-4 text-left font-normal">司机</th>
                  <th className="py-3 px-4 text-left font-normal">状态</th>
                  <th className="py-3 px-4 text-right font-normal">金额</th>
                  <th className="py-3 px-4 text-left font-normal">创建时间</th>
                  <th className="py-3 px-4 text-center font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => {
                  const driver = drivers.find((d) => d.id === o.driverId);
                  const pk = o.stops.find((s) => s.type === 'PICKUP');
                  const dl = o.stops.find((s) => s.type === 'DELIVERY');
                  const sc = statusTextMap[o.status];
                  const tc = tempControlMap[o.tempControl];
                  const isSel = selected.has(o.id);
                  const isWarn = o.status === 'EXCEPTION';
                  return (
                    <tr key={o.id} className={`border-b border-ink-600/30 hover:bg-orange-500/5 transition-colors ${isWarn ? 'bg-signal-red/[0.03]' : ''} ${isSel ? 'bg-orange-500/10' : ''}`}>
                      <td className="py-3.5 px-3">
                        <button onClick={() => toggleOne(o.id)} className="text-slate-400 hover:text-white">
                          {isSel ? <CheckSquare className="w-4 h-4 text-orange-500" fill="currentColor" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-display text-sm font-bold text-orange-400">{o.orderNo}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{o.insurance.enabled && <><span className="hex-tag !bg-signal-blue/10 !text-signal-blue text-[9px] !px-1.5 py-0.5 mr-1">已投保</span></>}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-sm bg-ink-700 flex items-center justify-center shrink-0">
                            <User size={14} className="text-slate-400" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-200">{o.shipperName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{o.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-200 font-medium mb-1">{o.cargoName}</div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="hex-tag text-[9px]">{formatVolume(o.volume)}</span>
                          <span className="hex-tag text-[9px]">{formatWeight(o.weight)}</span>
                          <span className="hex-tag text-[9px]">{tc.icon} {tc.label.slice(0, 3)}</span>
                          <span className={`hex-tag text-[9px] ${difficultyMap[o.loadingDifficulty].color}`}>{difficultyMap[o.loadingDifficulty].label}难度</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2 text-xs max-w-[180px]">
                          <MapPin size={12} className="text-orange-400 mt-0.5 shrink-0" />
                          <div className="space-y-0.5 min-w-0">
                            <div className="text-slate-300 truncate">取：{pk?.address.slice(0, 16)}</div>
                            <div className="text-slate-400 truncate">送：{dl?.address.slice(0, 16)}{o.stops.length > 2 && <span className="text-orange-400"> +{o.stops.length - 2}</span>}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {driver ? (
                          <div className="flex items-center gap-2">
                            <img src={driver.avatar} alt="" className="w-7 h-7 rounded-sm bg-ink-700 shrink-0" />
                            <div>
                              <div className="text-xs text-slate-200 font-medium">{driver.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{driver.licensePlate.slice(-6)} · {driver.vehicleTypeName}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">— 未派 —</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm ${sc.bg} ${sc.color} text-xs font-medium ${isWarn ? 'animate-pulse' : ''}`}>
                          <span className={`status-dot ${isWarn ? 'animate-pulse' : ''}`} style={{ backgroundColor: 'currentColor' }} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-display font-bold text-orange-400 text-base">{formatMoney(o.totalPrice)}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">货值 {formatMoney(o.cargoValue)}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{formatDateTime(o.createdAt)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button title="查看详情" className="p-1.5 rounded-sm hover:bg-signal-cyan/10 text-signal-cyan hover:text-signal-cyan transition-colors">
                            <Eye size={15} />
                          </button>
                          {!driver && (
                            <button title="人工派单" className="p-1.5 rounded-sm hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 transition-colors">
                              <Truck size={15} />
                            </button>
                          )}
                          {o.status !== 'EXCEPTION' && (
                            <button title="标记异常" className="p-1.5 rounded-sm hover:bg-signal-yellow/10 text-signal-yellow hover:text-signal-yellow transition-colors">
                              <AlertCircle size={15} />
                            </button>
                          )}
                          {['IN_TRANSIT', 'PICKING_UP', 'ACCEPTED'].includes(o.status) && (
                            <button title="强制完成" className="p-1.5 rounded-sm hover:bg-signal-green/10 text-signal-green hover:text-signal-green transition-colors">
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          <button className="p-1.5 rounded-sm hover:bg-slate-500/10 text-slate-500 hover:text-slate-300 transition-colors">
                            <MoreHorizontal size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr><td colSpan={10} className="py-16 text-center text-slate-500 text-sm">暂无符合条件的订单</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-ink-600/60 bg-ink-900/40">
            <div className="text-xs text-slate-500 font-mono">
              显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} 条，共 {filtered.length} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-sm border border-ink-600/60 bg-ink-900/60 flex items-center justify-center text-slate-400 hover:text-white hover:border-orange-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = page;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                const active = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-mono transition-all ${
                      active ? 'bg-orange-500 text-white shadow-glow-orange-sm' : 'border border-ink-600/60 bg-ink-900/60 text-slate-400 hover:text-white hover:border-orange-500/50'
                    }`}
                  >{p}</button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-sm border border-ink-600/60 bg-ink-900/60 flex items-center justify-center text-slate-400 hover:text-white hover:border-orange-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
