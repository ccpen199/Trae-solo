import { useState } from 'react'
import { Receipt, Edit2, Plus, Download, X, AlertTriangle, CheckCircle, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react'

const OPS = ['国网电动', '特来电', '星星充电']
const RULES = [
  { id: 1, operator: '国网电动', platform: 15, opShare: 55, siteShare: 30, date: '2025-01-01' },
  { id: 2, operator: '特来电', platform: 12, opShare: 58, siteShare: 30, date: '2025-02-01' },
  { id: 3, operator: '星星充电', platform: 18, opShare: 52, siteShare: 30, date: '2025-03-01' },
]
const BILLS = [
  { id: 1, operator: '国网电动', period: '2025-05', total: 5680000, platform: 852000, opAmount: 3124000, siteAmount: 1704000, status: '待结算' },
  { id: 2, operator: '特来电', period: '2025-05', total: 4320000, platform: 518400, opAmount: 2505600, siteAmount: 1296000, status: '已结算' },
  { id: 3, operator: '星星充电', period: '2025-05', total: 3450000, platform: 621000, opAmount: 1794000, siteAmount: 1035000, status: '已结算' },
  { id: 4, operator: '国网电动', period: '2025-04', total: 4920000, platform: 738000, opAmount: 2706000, siteAmount: 1476000, status: '已结算' },
  { id: 5, operator: '特来电', period: '2025-04', total: 3890000, platform: 466800, opAmount: 2256200, siteAmount: 1167000, status: '异常' },
  { id: 6, operator: '星星充电', period: '2025-04', total: 2980000, platform: 536400, opAmount: 1549600, siteAmount: 894000, status: '待结算' },
]
const LINE_ITEMS: Record<number, { orderId: string; amount: number; time: string; pileId: string }[]> = {
  1: [
    { orderId: 'ORD-0501-001', amount: 156.8, time: '2025-05-01 08:23', pileId: 'CP-BJ-001' },
    { orderId: 'ORD-0501-012', amount: 203.5, time: '2025-05-01 14:17', pileId: 'CP-BJ-003' },
    { orderId: 'ORD-0502-008', amount: 89.2, time: '2025-05-02 09:45', pileId: 'CP-BJ-002' },
    { orderId: 'ORD-0503-019', amount: 178.6, time: '2025-05-03 16:30', pileId: 'CP-BJ-005' },
    { orderId: 'ORD-0504-007', amount: 245.1, time: '2025-05-04 11:12', pileId: 'CP-BJ-004' },
  ],
  2: [
    { orderId: 'ORD-0503-005', amount: 132.0, time: '2025-05-03 10:30', pileId: 'CP-SH-007' },
    { orderId: 'ORD-0504-011', amount: 245.6, time: '2025-05-04 16:22', pileId: 'CP-SH-012' },
    { orderId: 'ORD-0505-003', amount: 67.8, time: '2025-05-05 08:15', pileId: 'CP-SH-003' },
    { orderId: 'ORD-0506-018', amount: 198.3, time: '2025-05-06 13:40', pileId: 'CP-SH-018' },
    { orderId: 'ORD-0507-009', amount: 312.5, time: '2025-05-07 19:55', pileId: 'CP-SH-009' },
  ],
}
const RECON = [
  { id: 1, operator: '国网电动', period: '2025-05', expected: 5680000, actual: 5678400, platformExp: 852000, platformAct: 851760, opExp: 3124000, opAct: 3123120, siteExp: 1704000, siteAct: 1703520 },
  { id: 2, operator: '特来电', period: '2025-05', expected: 4320000, actual: 4320000, platformExp: 518400, platformAct: 518400, opExp: 2505600, opAct: 2505600, siteExp: 1296000, siteAct: 1296000 },
  { id: 3, operator: '星星充电', period: '2025-05', expected: 3450000, actual: 3449100, platformExp: 621000, platformAct: 620838, opExp: 1794000, opAct: 1793532, siteExp: 1035000, siteAct: 1034730 },
]
const fmt = (n: number) => n.toLocaleString('zh-CN')
const SB: Record<string, { cls: string; icon: typeof Clock }> = {
  '待结算': { cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30', icon: Clock },
  '已结算': { cls: 'bg-electric-green/10 text-electric-green border border-electric-green/30', icon: CheckCircle },
  '异常': { cls: 'bg-red-500/10 text-red-400 border border-red-500/30', icon: AlertTriangle },
  '申诉中': { cls: 'bg-purple-500/10 text-purple-400 border border-purple-500/30', icon: AlertTriangle },
}
function Badge({ status }: { status: string }) {
  const c = SB[status] ?? SB['待结算']
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${c.cls}`}><c.icon className="w-3 h-3" />{status}</span>
}
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-[440px] max-h-[80vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

export default function Settlement() {
  const [tab, setTab] = useState<'规则' | '账单' | '对账'>('规则')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(RULES[0])
  const [billDetail, setBillDetail] = useState<typeof BILLS[0] | null>(null)
  const [genOpen, setGenOpen] = useState(false)
  const [genForm, setGenForm] = useState({ operator: '国网电动', period: '2025-06' })
  const [genPreview, setGenPreview] = useState(false)
  const [reconState, setReconState] = useState<'idle' | 'running' | 'done'>('idle')
  const [filterOp, setFilterOp] = useState('全部')
  const [filterPeriod, setFilterPeriod] = useState('')
  const [settleModal, setSettleModal] = useState<typeof RULES[0] | null>(null)
  const [settlePeriod, setSettlePeriod] = useState('2025-06')
  const [settlePreview, setSettlePreview] = useState(false)
  const [expandedBill, setExpandedBill] = useState<number | null>(null)
  const [reconData, setReconData] = useState(RECON.map(r => ({ ...r, status: '' as string })))
  const [appealModal, setAppealModal] = useState<number | null>(null)
  const [appealReason, setAppealReason] = useState('')

  const openEdit = (r: typeof RULES[0] | null) => { setEditForm(r ?? { id: 0, operator: '国网电动', platform: 15, opShare: 55, siteShare: 30, date: '2025-06-01' }); setEditOpen(true) }
  const total = editForm.platform + editForm.opShare + editForm.siteShare
  const valid = total === 100
  const filtered = BILLS.filter(b => (filterOp === '全部' || b.operator === filterOp) && (!filterPeriod || b.period.startsWith(filterPeriod)))

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="section-title flex items-center gap-2"><Receipt className="w-5 h-5 text-amber-orange" />分账结算</h2>

      <div className="grid grid-cols-3 gap-4">
        {[{ l: '本期待结算', v: '¥2,340,000', c: 'text-amber-orange', i: Clock, g: '' }, { l: '已结算', v: '¥18,560,000', c: 'text-electric-green', i: CheckCircle, g: 'glow-green' }, { l: '异常笔数', v: '23', c: 'text-red-400', i: AlertTriangle, g: '' }].map(c => (
          <div key={c.l} className={`stat-card ${c.g}`}>
            <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-400">{c.l}</span><c.i className={`w-4 h-4 ${c.c}`} /></div>
            <p className={`data-text text-xl font-bold ${c.c}`}>{c.v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-white/5">
        {(['规则', '账单', '对账'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm transition-colors ${tab === t ? 'text-electric-green border-b-2 border-electric-green' : 'text-gray-400 hover:text-gray-200'}`}>{t === '规则' ? '结算规则' : t === '账单' ? '账单明细' : '对账报表'}</button>
        ))}
      </div>

      {tab === '规则' && (
        <div>
          <div className="flex justify-end mb-3"><button onClick={() => openEdit(null)} className="btn-primary flex items-center gap-1 text-sm"><Plus className="w-4 h-4" />新增规则</button></div>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/5 text-gray-400 text-left"><th className="px-4 py-3">运营商</th><th className="px-4 py-3">平台分成</th><th className="px-4 py-3">运营商分成</th><th className="px-4 py-3">场地方分成</th><th className="px-4 py-3">生效日期</th><th className="px-4 py-3">操作</th></tr></thead>
              <tbody>{RULES.map(r => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-gray-200">{r.operator}</td>
                  <td className="px-4 py-3 data-text text-electric-green">{r.platform}%</td>
                  <td className="px-4 py-3 data-text text-ice-blue">{r.opShare}%</td>
                  <td className="px-4 py-3 data-text text-amber-orange">{r.siteShare}%</td>
                  <td className="px-4 py-3 text-gray-400">{r.date}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(r)} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"><Edit2 className="w-3 h-3" />编辑</button>
                    <button onClick={() => { setSettleModal(r); setSettlePeriod('2025-06'); setSettlePreview(false) }} className="btn-primary text-xs px-2 py-1">执行结算</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === '账单' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <select value={filterOp} onChange={e => setFilterOp(e.target.value)} className="input-field text-sm"><option value="全部">全部运营商</option>{OPS.map(o => <option key={o}>{o}</option>)}</select>
            <input type="month" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="input-field text-sm" />
            <button className="btn-primary flex items-center gap-1 text-sm ml-auto" onClick={() => setGenOpen(true)}><FileText className="w-4 h-4" />生成结算单</button>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/5 text-gray-400 text-left"><th className="px-4 py-3">运营商</th><th className="px-4 py-3">周期</th><th className="px-4 py-3">总金额</th><th className="px-4 py-3">平台金额</th><th className="px-4 py-3">运营商金额</th><th className="px-4 py-3">场地方金额</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">操作</th></tr></thead>
              <tbody>{filtered.map(b => (
                <>
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-gray-200">{b.operator}</td><td className="px-4 py-3 text-gray-400">{b.period}</td>
                    <td className="px-4 py-3 data-text">¥{fmt(b.total)}</td><td className="px-4 py-3 data-text text-electric-green">¥{fmt(b.platform)}</td>
                    <td className="px-4 py-3 data-text text-ice-blue">¥{fmt(b.opAmount)}</td><td className="px-4 py-3 data-text text-amber-orange">¥{fmt(b.siteAmount)}</td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                    <td className="px-4 py-3"><button onClick={() => setExpandedBill(expandedBill === b.id ? null : b.id)} className="text-ice-blue hover:text-ice-blue/80 text-xs flex items-center gap-1">{expandedBill === b.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}查看明细</button></td>
                  </tr>
                  {expandedBill === b.id && (
                    <tr key={`${b.id}-detail`}><td colSpan={8} className="px-4 py-3 bg-white/[0.02]">
                      <div className="text-xs text-gray-400 mb-2">订单明细</div>
                      <table className="w-full text-xs">
                        <thead><tr className="text-gray-500 border-b border-white/5"><th className="text-left py-1">订单ID</th><th className="text-left py-1">桩ID</th><th className="text-left py-1">时间</th><th className="text-right py-1">金额</th></tr></thead>
                        <tbody>{(LINE_ITEMS[b.id] || []).map((it, i) => (
                          <tr key={i} className="border-b border-white/5"><td className="py-1 data-text">{it.orderId}</td><td className="py-1 text-gray-400">{it.pileId}</td><td className="py-1 text-gray-400">{it.time}</td><td className="py-1 text-right data-text text-electric-green">¥{it.amount.toFixed(2)}</td></tr>
                        ))}</tbody>
                      </table>
                      <div className="flex justify-between items-center text-xs mt-2 border-t border-white/10 pt-2"><span className="text-gray-400">明细小计</span><span className="data-text text-electric-green font-bold">¥{(LINE_ITEMS[b.id] || []).reduce((s, i) => s + i.amount, 0).toFixed(2)}</span></div>
                    </td></tr>
                  )}
                </>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === '对账' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => { setReconState('running'); setTimeout(() => setReconState('done'), 2500) }} disabled={reconState === 'running'} className="btn-primary flex items-center gap-1 text-sm">
              {reconState === 'running' ? '对账中...' : '自动对账'}
            </button>
          </div>
          {reconState === 'running' && (
            <div className="stat-card p-4 mb-4"><div className="text-sm text-gray-300 mb-2">正在自动对账...</div><div className="w-full bg-white/10 rounded-full h-2 overflow-hidden"><div className="bg-electric-green h-full rounded-full animate-pulse" style={{ width: '60%' }} /></div></div>
          )}
          {reconState === 'done' && (
            <div className="stat-card p-4 mb-4 border border-electric-green/20"><div className="text-sm text-electric-green font-medium">对账完成：匹配 156 笔，差异 3 笔</div></div>
          )}
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/5 text-gray-400 text-left"><th className="px-4 py-3">运营商</th><th className="px-4 py-3">周期</th><th className="px-4 py-3">应收</th><th className="px-4 py-3">实收</th><th className="px-4 py-3">差额</th><th className="px-4 py-3">平台应收</th><th className="px-4 py-3">平台实收</th><th className="px-4 py-3">运营商应收</th><th className="px-4 py-3">运营商实收</th><th className="px-4 py-3">操作</th></tr></thead>
              <tbody>{reconData.map(r => { const d = r.actual - r.expected, pd = r.platformAct - r.platformExp, od = r.opAct - r.opExp; return (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-gray-200">{r.operator}</td><td className="px-4 py-3 text-gray-400">{r.period}</td>
                  <td className="px-4 py-3 data-text">¥{fmt(r.expected)}</td><td className="px-4 py-3 data-text">¥{fmt(r.actual)}</td>
                  <td className={`px-4 py-3 data-text font-semibold ${d ? 'text-amber-orange' : 'text-electric-green'}`}>{d ? `¥${fmt(d)}` : '—'}</td>
                  <td className="px-4 py-3 data-text text-electric-green">¥{fmt(r.platformExp)}</td>
                  <td className={`px-4 py-3 data-text ${pd ? 'text-amber-orange' : 'text-electric-green'}`}>¥{fmt(r.platformAct)}</td>
                  <td className="px-4 py-3 data-text text-ice-blue">¥{fmt(r.opExp)}</td>
                  <td className={`px-4 py-3 data-text ${od ? 'text-amber-orange' : 'text-ice-blue'}`}>¥{fmt(r.opAct)}</td>
                  <td className="px-4 py-3">{d !== 0 && !r.status ? <button onClick={() => { setAppealModal(r.id); setAppealReason('') }} className="btn-danger text-xs px-2 py-1">发起申诉</button> : r.status ? <Badge status={r.status} /> : <span className="text-gray-600 text-xs">—</span>}</td>
                </tr>
              )})}</tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="flex justify-between items-center"><h3 className="text-gray-100 font-medium">编辑结算规则</h3><button onClick={() => setEditOpen(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-200" /></button></div>
        <div><label className="text-xs text-gray-400 mb-1 block">运营商</label><select value={editForm.operator} onChange={e => setEditForm(f => ({ ...f, operator: e.target.value }))} className="input-field w-full">{OPS.map(o => <option key={o}>{o}</option>)}</select></div>
        <div className="grid grid-cols-3 gap-3">
          {([['platform', '平台'], ['opShare', '运营商'], ['siteShare', '场地方']] as const).map(([k, l]) => (
            <div key={k}><label className="text-xs text-gray-400 mb-1 block">{l}分成</label><div className="relative"><input type="number" value={editForm[k]} onChange={e => setEditForm(f => ({ ...f, [k]: +e.target.value }))} className="input-field w-full pr-6" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span></div></div>
          ))}
        </div>
        <p className={`text-xs ${valid ? 'text-electric-green' : 'text-red-400'}`}>合计：{total}%{valid ? '' : '（需100%）'}</p>
        <div><label className="text-xs text-gray-400 mb-1 block">生效日期</label><input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="input-field w-full" /></div>
        <div className="flex justify-end gap-2 pt-2"><button onClick={() => setEditOpen(false)} className="btn-secondary text-sm">取消</button><button onClick={() => setEditOpen(false)} className={`btn-primary text-sm ${!valid ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!valid}>确认</button></div>
      </Modal>

      {billDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBillDetail(null)}>
          <div className="glass-card p-6 w-[520px] max-h-[80vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-gray-100 font-medium">账单详情 — {billDetail.operator} {billDetail.period}</h3><button onClick={() => setBillDetail(null)}><X className="w-4 h-4 text-gray-400 hover:text-gray-200" /></button></div>
            <table className="w-full text-xs">
              <thead><tr className="text-gray-500 border-b border-white/5"><th className="text-left py-2">订单ID</th><th className="text-left py-2">桩ID</th><th className="text-left py-2">时间</th><th className="text-right py-2">金额</th></tr></thead>
              <tbody>{(LINE_ITEMS[billDetail.id] || []).map((it, i) => (
                <tr key={i} className="border-b border-white/5"><td className="py-2 data-text">{it.orderId}</td><td className="py-2 text-gray-400">{it.pileId}</td><td className="py-2 text-gray-400">{it.time}</td><td className="py-2 text-right data-text text-electric-green">¥{it.amount.toFixed(2)}</td></tr>
              ))}</tbody>
            </table>
            <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3"><span className="text-gray-400">明细小计</span><span className="data-text text-electric-green font-bold">¥{(LINE_ITEMS[billDetail.id] || []).reduce((s, i) => s + i.amount, 0).toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-gray-400">账单总额</span><span className="data-text text-amber-orange font-bold">¥{fmt(billDetail.total)}</span></div>
            <div className="flex justify-end pt-2"><button className="btn-primary flex items-center gap-1 text-sm"><Download className="w-4 h-4" />导出PDF</button></div>
          </div>
        </div>
      )}

      <Modal open={genOpen} onClose={() => { setGenOpen(false); setGenPreview(false) }}>
        <div className="flex justify-between items-center"><h3 className="text-gray-100 font-medium">生成结算单</h3><button onClick={() => { setGenOpen(false); setGenPreview(false) }}><X className="w-4 h-4 text-gray-400 hover:text-gray-200" /></button></div>
        <div><label className="text-xs text-gray-400 mb-1 block">运营商</label><select value={genForm.operator} onChange={e => setGenForm(f => ({ ...f, operator: e.target.value }))} className="input-field w-full">{OPS.map(o => <option key={o}>{o}</option>)}</select></div>
        <div><label className="text-xs text-gray-400 mb-1 block">结算周期</label><input type="month" value={genForm.period} onChange={e => setGenForm(f => ({ ...f, period: e.target.value }))} className="input-field w-full" /></div>
        {genPreview && (
          <div className="stat-card p-3 text-xs space-y-1">
            <div className="text-gray-300 font-medium">预览 — {genForm.operator} {genForm.period}</div>
            <div className="text-gray-400">总金额：<span className="data-text text-electric-green">¥4,280,000</span></div>
            <div className="text-gray-400">平台：<span className="data-text">¥642,000</span> / 运营商：<span className="data-text">¥2,354,000</span> / 场地：<span className="data-text">¥1,284,000</span></div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          {!genPreview ? <button onClick={() => setGenPreview(true)} className="btn-primary text-sm">预览</button>
            : <><button onClick={() => setGenPreview(false)} className="btn-secondary text-sm">返回</button><button onClick={() => { setGenOpen(false); setGenPreview(false) }} className="btn-primary text-sm">确认生成</button></>}
        </div>
      </Modal>

      <Modal open={!!settleModal} onClose={() => setSettleModal(null)}>
        <h3 className="text-gray-100 font-medium">执行结算 — {settleModal?.operator}</h3>
        <div><label className="text-xs text-gray-400 mb-1 block">结算周期</label><input type="month" value={settlePeriod} onChange={e => setSettlePeriod(e.target.value)} className="input-field w-full" /></div>
        {settlePreview && settleModal && (
          <div className="stat-card p-3 text-xs space-y-1">
            <div className="text-gray-300 font-medium">结算预览 — {settleModal.operator} {settlePeriod}</div>
            <div className="text-gray-400">总订单数：<span className="data-text text-ice-blue">1,247</span></div>
            <div className="text-gray-400">总金额：<span className="data-text text-electric-green">¥4,280,000</span></div>
            <div className="text-gray-400">平台 ({settleModal.platform}%)：<span className="data-text">¥{fmt(4280000 * settleModal.platform / 100)}</span></div>
            <div className="text-gray-400">运营商 ({settleModal.opShare}%)：<span className="data-text">¥{fmt(4280000 * settleModal.opShare / 100)}</span></div>
            <div className="text-gray-400">场地方 ({settleModal.siteShare}%)：<span className="data-text">¥{fmt(4280000 * settleModal.siteShare / 100)}</span></div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          {!settlePreview ? <button onClick={() => setSettlePreview(true)} className="btn-primary text-sm">预览结算</button>
            : <><button onClick={() => setSettlePreview(false)} className="btn-secondary text-sm">返回</button><button onClick={() => setSettleModal(null)} className="btn-primary text-sm">确认结算</button></>}
        </div>
      </Modal>

      <Modal open={appealModal !== null} onClose={() => setAppealModal(null)}>
        <h3 className="text-gray-100 font-medium">发起申诉</h3>
        <div className="text-xs text-gray-400">针对 {reconData.find(r => r.id === appealModal)?.operator} {reconData.find(r => r.id === appealModal)?.period} 对账差异</div>
        <div><label className="text-xs text-gray-400 mb-1 block">申诉原因</label>
          <textarea value={appealReason} onChange={e => setAppealReason(e.target.value)} placeholder="请输入申诉原因..." className="input-field w-full h-24 resize-none" /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setAppealModal(null)} className="btn-secondary text-sm">取消</button>
          <button onClick={() => {
            if (!appealReason.trim()) return
            setReconData(prev => prev.map(r => r.id === appealModal ? { ...r, status: '申诉中' } : r))
            setAppealModal(null)
          }} className={`btn-primary text-sm ${!appealReason.trim() ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!appealReason.trim()}>提交申诉</button>
        </div>
      </Modal>
    </div>
  )
}
