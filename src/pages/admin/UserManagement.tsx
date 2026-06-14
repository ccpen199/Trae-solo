import { useEffect, useMemo, useState } from 'react';
import {
  Users, Truck, Search, Ban, Unlock, Settings2, Star, CheckCircle2,
  Thermometer, ClipboardList, Shield, Zap, MapPin, TrendingUp, TrendingDown,
  ChevronDown, MoreHorizontal, AlertTriangle, CircleDot,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatMoney, tempControlMap, vehicleTypeMap } from '@/utils/format';
import type { Driver, TempControl } from '@/types';

type TabType = 'SHIPPER' | 'DRIVER';

export default function UserManagement() {
  const { orders, drivers, init, loading } = useOrderStore();
  useEffect(() => { init(); }, [init]);
  const [tab, setTab] = useState<TabType>('DRIVER');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tempFilter, setTempFilter] = useState<string>('ALL');
  const [frozen, setFrozen] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const shipperStats = useMemo(() => {
    const map = new Map<string, { count: number; gmv: number; name: string }>();
    orders.forEach((o) => {
      const cur = map.get(o.shipperId) || { count: 0, gmv: 0, name: o.shipperName };
      cur.count++;
      cur.gmv += o.totalPrice;
      map.set(o.shipperId, cur);
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v, avg: v.gmv / Math.max(1, v.count) }));
  }, [orders]);

  const driverList = useMemo(() => {
    return drivers
      .filter((d) => {
        if (search && !d.name.includes(search) && !d.licensePlate.includes(search)) return false;
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'FROZEN' && !frozen.has(d.id)) return false;
          if (statusFilter !== 'FROZEN' && d.currentStatus !== statusFilter) return false;
        }
        if (tempFilter !== 'ALL' && !(d.tempCapability || []).includes(tempFilter as TempControl)) return false;
        return true;
      })
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }, [drivers, search, statusFilter, tempFilter, frozen]);

  const pagedDrivers = driverList.slice((page - 1) * pageSize, page * pageSize);
  const totalPagesD = Math.max(1, Math.ceil(driverList.length / pageSize));

  const dStats = useMemo(() => ({
    total: drivers.length,
    idle: drivers.filter((d) => d.currentStatus === 'IDLE').length,
    busy: drivers.filter((d) => d.currentStatus === 'IN_TRANSIT').length,
    frozen: frozen.size,
    avgRate: (drivers.reduce((s, d) => s + d.historyFulfillmentRate, 0) / Math.max(1, drivers.length) * 100).toFixed(1),
  }), [drivers, frozen]);

  const sStats = useMemo(() => ({
    total: shipperStats.length,
    totalOrders: orders.length,
    totalGmv: orders.reduce((s, o) => s + o.totalPrice, 0),
    avgOrderValue: (orders.reduce((s, o) => s + o.totalPrice, 0) / Math.max(1, orders.length)),
  }), [shipperStats, orders]);

  const SelectField = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-industrial appearance-none pr-8 cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value} className="bg-ink-900">{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    </div>
  );

  const toggleFreeze = (id: string) => {
    const n = new Set(frozen);
    n.has(id) ? n.delete(id) : n.add(id);
    setFrozen(n);
  };

  if (loading) return <div className="h-full flex items-center justify-center text-slate-400">加载中...</div>;

  const ShipperPanel = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '货主总数', v: sStats.total, u: '家', icon: Users, c: 'text-orange-400', bg: 'bg-orange-500/15' },
          { label: '累计订单', v: sStats.totalOrders, u: '单', icon: ClipboardList, c: 'text-signal-cyan', bg: 'bg-signal-cyan/15' },
          { label: '累计GMV', v: `¥${(sStats.totalGmv / 10000).toFixed(2)}`, u: '万', icon: Shield, c: 'text-signal-green', bg: 'bg-signal-green/15' },
          { label: '平均客单', v: formatMoney(sStats.avgOrderValue), u: '', icon: TrendingUp, c: 'text-signal-blue', bg: 'bg-signal-blue/15' },
        ].map((k, i) => (
          <div key={i} className="stat-panel corner-brackets">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-400 font-mono tracking-wider mb-1">{k.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className={`font-display font-extrabold text-2xl ${k.c} tabular-nums`}>{k.v}</span>
                  <span className="text-xs text-slate-500 font-mono">{k.u}</span>
                </div>
              </div>
              <div className={`w-11 h-11 rounded-sm ${k.bg} flex items-center justify-center`}>
                <k.icon size={20} className={k.c} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="industrial-card corner-brackets overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur-sm">
              <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-ink-600/60">
                <th className="py-3 px-4 text-left font-normal">货主信息</th>
                <th className="py-3 px-4 text-left font-normal">公司</th>
                <th className="py-3 px-4 text-right font-normal">累计订单</th>
                <th className="py-3 px-4 text-right font-normal">累计GMV</th>
                <th className="py-3 px-4 text-right font-normal">平均客单</th>
                <th className="py-3 px-4 text-left font-normal">异常单率</th>
                <th className="py-3 px-4 text-left font-normal">信用等级</th>
                <th className="py-3 px-4 text-center font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {shipperStats.sort((a, b) => b.count - a.count).map((s, i) => {
                const excRate = (Math.random() * 5).toFixed(1);
                const lv = i < 3 ? 'S' : i < 8 ? 'A' : i < 14 ? 'B' : 'C';
                return (
                  <tr key={s.id} className="border-b border-ink-600/30 hover:bg-orange-500/5">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center font-display font-bold text-sm ${
                          lv === 'S' ? 'bg-gradient-to-br from-orange-500/40 to-orange-550/20 text-orange-400 border border-orange-500/30' :
                          lv === 'A' ? 'bg-signal-cyan/15 text-signal-cyan border border-signal-cyan/30' :
                          lv === 'B' ? 'bg-signal-blue/15 text-signal-blue border border-signal-blue/30' :
                          'bg-ink-700 text-slate-400 border border-ink-600/60'
                        }`}>
                          {s.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">{s.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">{['上海鲜达供应链', '沪上快仓物流', '申城速运', '长三角冷链', '顺丰同城仓配', '京东云仓物流'][i % 6]}</td>
                    <td className="py-3.5 px-4 text-right font-display font-bold text-lg text-signal-cyan tabular-nums">{s.count}</td>
                    <td className="py-3.5 px-4 text-right font-display font-bold text-lg text-orange-400 tabular-nums">¥{(s.gmv / 10000).toFixed(2)}万</td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-slate-300">{formatMoney(s.avg)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${+excRate * 8}%`, background: +excRate > 3 ? '#EF4444' : '#10B981' }} />
                        </div>
                        <span className={`font-mono text-xs ${+excRate > 3 ? 'text-signal-red' : 'text-signal-green'}`}>{excRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`hex-tag text-[10px] font-bold ${
                        lv === 'S' ? '!bg-orange-500/15 !text-orange-400' :
                        lv === 'A' ? '!bg-signal-cyan/15 !text-signal-cyan' :
                        lv === 'B' ? '!bg-signal-blue/15 !text-signal-blue' :
                        '!bg-ink-700 !text-slate-400'
                      }`}>
                        LV.{lv}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded-sm hover:bg-signal-cyan/10 text-signal-cyan"><Users size={15} /></button>
                        <button className="p-1.5 rounded-sm hover:bg-orange-500/10 text-orange-400"><Settings2 size={15} /></button>
                        <button className="p-1.5 rounded-sm hover:bg-slate-500/10 text-slate-500"><MoreHorizontal size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const DriverPanel = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: '司机总数', v: dStats.total, u: '人', icon: Truck, c: 'text-orange-400', bg: 'bg-orange-500/15' },
          { label: '在线待命', v: dStats.idle, u: '人', icon: CircleDot, c: 'text-signal-green', bg: 'bg-signal-green/15' },
          { label: '配送中', v: dStats.busy, u: '人', icon: Zap, c: 'text-signal-blue', bg: 'bg-signal-blue/15' },
          { label: '已冻结', v: dStats.frozen, u: '人', icon: AlertTriangle, c: 'text-signal-red', bg: 'bg-signal-red/15' },
          { label: '平均履约率', v: dStats.avgRate, u: '%', icon: CheckCircle2, c: 'text-signal-cyan', bg: 'bg-signal-cyan/15' },
        ].map((k, i) => (
          <div key={i} className="stat-panel corner-brackets">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-400 font-mono tracking-wider mb-1">{k.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className={`font-display font-extrabold text-2xl ${k.c} tabular-nums`}>{k.v}</span>
                  <span className="text-xs text-slate-500 font-mono">{k.u}</span>
                </div>
              </div>
              <div className={`w-11 h-11 rounded-sm ${k.bg} flex items-center justify-center`}>
                <k.icon size={20} className={k.c} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="industrial-card corner-brackets p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="司机姓名/车牌" className="input-industrial pl-8" />
          </div>
          <div className="w-48">
            <SelectField
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: '全部状态' },
                { value: 'IDLE', label: '在线待命' },
                { value: 'ON_DUTY', label: '在岗' },
                { value: 'IN_TRANSIT', label: '配送中' },
                { value: 'FROZEN', label: '已冻结' },
              ]}
            />
          </div>
          <div className="w-48">
            <SelectField
              value={tempFilter}
              onChange={setTempFilter}
              options={[
                { value: 'ALL', label: '全部温控能力' },
                { value: 'NORMAL', label: '常温' },
                { value: 'FRESH', label: '保鲜' },
                { value: 'REFRIGERATED', label: '冷藏' },
                { value: 'DEEP_FREEZE', label: '深冷' },
              ]}
            />
          </div>
          <div className="flex-1" />
          <span className="font-mono text-xs text-slate-500">共 {driverList.length} 名司机</span>
        </div>
      </div>

      <div className="industrial-card corner-brackets overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-520px)] overflow-y-auto">
          <table className="w-full min-w-[1300px]">
            <thead className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur-sm">
              <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-ink-600/60">
                <th className="py-3 px-4 text-left font-normal">司机信息</th>
                <th className="py-3 px-4 text-left font-normal">车牌/车型</th>
                <th className="py-3 px-4 text-left font-normal">温控能力</th>
                <th className="py-3 px-4 text-right font-normal">总订单</th>
                <th className="py-3 px-4 text-left font-normal">履约率</th>
                <th className="py-3 px-4 text-left font-normal">评分</th>
                <th className="py-3 px-4 text-left font-normal">当前状态</th>
                <th className="py-3 px-4 text-left font-normal">饱和度</th>
                <th className="py-3 px-4 text-left font-normal">所属区域</th>
                <th className="py-3 px-4 text-center font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedDrivers.map((d) => {
                const isFrozen = frozen.has(d.id);
                const rateColor = d.historyFulfillmentRate >= 0.95 ? 'text-signal-green' : d.historyFulfillmentRate >= 0.88 ? 'text-signal-cyan' : d.historyFulfillmentRate >= 0.8 ? 'text-signal-yellow' : 'text-signal-red';
                const satColor = d.saturation > 0.85 ? 'text-signal-red' : d.saturation > 0.7 ? 'text-orange-400' : d.saturation > 0.5 ? 'text-signal-yellow' : 'text-signal-green';
                return (
                  <tr key={d.id} className={`border-b border-ink-600/30 hover:bg-orange-500/5 ${isFrozen ? 'bg-signal-red/[0.04]' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={d.avatar} alt="" className="w-10 h-10 rounded-sm bg-ink-700" />
                          {isFrozen && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-signal-red flex items-center justify-center"><Ban size={9} className="text-white" /></div>}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            {d.name}
                            {d.rating >= 4.8 && <span className="hex-tag text-[9px] !bg-orange-500/15 !text-orange-400">金牌司机</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{d.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-display font-bold text-sm text-orange-400 tracking-wider">{d.licensePlate}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{vehicleTypeMap[d.vehicleType].icon}</span>
                        <span>{d.vehicleTypeName}</span>
                        <span className="text-slate-600">·</span>
                        <span>{d.maxVolume}m³/{(d.maxWeight / 1000).toFixed(1)}t</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(d.tempCapability || ['NORMAL']).map((t) => (
                          <span key={t} className="hex-tag text-[9px]">{tempControlMap[t].icon} {tempControlMap[t].label.slice(0, 2)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-display font-bold text-lg text-signal-cyan tabular-nums">{d.totalOrders}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">今日 ¥{(d.todayEarnings || 0).toFixed(0)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${d.historyFulfillmentRate * 100}%`, background: d.historyFulfillmentRate >= 0.95 ? '#10B981' : d.historyFulfillmentRate >= 0.88 ? '#06B6D4' : '#F59E0B' }} />
                        </div>
                        <span className={`font-display font-bold text-sm ${rateColor}`}>{(d.historyFulfillmentRate * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="text-signal-yellow fill-signal-yellow" />
                        <span className="font-display font-bold text-base text-signal-yellow tabular-nums">{d.rating}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isFrozen ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-signal-red/10 text-signal-red text-xs font-medium">
                          <span className="status-dot bg-signal-red animate-pulse" />已冻结
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium ${
                          d.currentStatus === 'IDLE' ? 'bg-signal-green/10 text-signal-green' :
                          d.currentStatus === 'IN_TRANSIT' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-signal-blue/10 text-signal-blue'
                        }`}>
                          <span className={`status-dot ${d.currentStatus === 'IDLE' ? 'bg-signal-green' : d.currentStatus === 'IN_TRANSIT' ? 'bg-orange-500 animate-pulse' : 'bg-signal-blue'}`} />
                          {d.currentStatus === 'IDLE' ? '待命' : d.currentStatus === 'IN_TRANSIT' ? '配送中' : '在岗'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${d.saturation * 100}%`, background: d.saturation > 0.85 ? '#EF4444' : d.saturation > 0.7 ? '#F97316' : '#10B981' }} />
                        </div>
                        <span className={`font-display font-bold text-xs ${satColor}`}>{(d.saturation * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <MapPin size={12} className="text-orange-400" />
                        {d.region}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {isFrozen ? (
                          <button onClick={() => toggleFreeze(d.id)} title="解冻" className="p-1.5 rounded-sm hover:bg-signal-green/10 text-signal-green"><Unlock size={15} /></button>
                        ) : (
                          <button onClick={() => toggleFreeze(d.id)} title="冻结账号" className="p-1.5 rounded-sm hover:bg-signal-red/10 text-signal-red"><Ban size={15} /></button>
                        )}
                        <button title="调整派单系数" className="p-1.5 rounded-sm hover:bg-orange-500/10 text-orange-400"><Settings2 size={15} /></button>
                        <button className="p-1.5 rounded-sm hover:bg-slate-500/10 text-slate-500"><MoreHorizontal size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end px-5 py-3 border-t border-ink-600/60 bg-ink-900/40 gap-2">
          {Array.from({ length: Math.min(4, totalPagesD) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-mono ${
                p === page ? 'bg-orange-500 text-white' : 'border border-ink-600/60 bg-ink-900/60 text-slate-400 hover:border-orange-500/50'
              }`}
            >{p}</button>
          ))}
          <span className="text-xs text-slate-500 font-mono ml-2">共 {totalPagesD} 页</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-ink-950 p-5">
      <div className="max-w-[1800px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-signal-cyan/40 to-signal-blue/20 border border-signal-cyan/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-signal-cyan" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white tracking-wide">用户管理</h1>
              <p className="font-mono text-[11px] text-slate-500 mt-0.5 tracking-wider">USER MANAGEMENT · ADMIN</p>
            </div>
          </div>
        </div>

        <div className="industrial-card corner-brackets overflow-hidden">
          <div className="flex border-b border-ink-600/60">
            {[
              { key: 'SHIPPER', label: '货主列表', icon: ClipboardList, count: sStats.total },
              { key: 'DRIVER', label: '司机列表', icon: Truck, count: dStats.total },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as TabType)}
                className={`relative flex items-center gap-2.5 px-6 py-3.5 transition-all ${
                  tab === t.key ? 'text-orange-400 bg-orange-500/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/3'
                }`}
              >
                <t.icon size={17} />
                <span className="text-sm font-semibold tracking-wide">{t.label}</span>
                <span className={`hex-tag text-[10px] ${tab === t.key ? '' : '!bg-ink-700 !text-slate-400'}`}>{t.count}</span>
                {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
              </button>
            ))}
          </div>
        </div>

        {tab === 'SHIPPER' ? <ShipperPanel /> : <DriverPanel />}
      </div>
    </div>
  );
}
