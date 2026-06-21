import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import type { PaymentMethod, Payment as PaymentType } from '@/types'
import {
  CreditCard, Landmark, CalendarDays, ArrowDownRight, Check, Clock,
  AlertTriangle, ChevronDown, ChevronUp, X, QrCode, Stamp, ArrowRight, ShieldCheck,
} from 'lucide-react'

const methodLabel: Record<PaymentMethod, string> = { ccb_card: '建行卡快捷支付', unionpay: '银联支付', installment: '租金分期' }
const statusCfg: Record<string, { label: string; color: string }> = {
  pending: { label: '待付', color: 'bg-amber-100 text-amber-700' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已付', color: 'bg-green-100 text-green-700' },
  failed: { label: '逾期', color: 'bg-red-100 text-red-700' },
}

const installmentRates = [{ months: 3, rate: 0.036 }, { months: 6, rate: 0.036 }, { months: 12, rate: 0.042 }]

function StatusBadge({ status }: { status: string }) {
  const s = statusCfg[status]
  const icon = status === 'completed' ? <Check className="w-3.5 h-3.5" /> : status === 'failed' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className={`w-3.5 h-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{icon}{s.label}</span>
}

function ChannelCard({ ch, selected, onClick }: { ch: { key: PaymentMethod; label: string; desc: string; badge?: string; badgeStyle?: string; iconBg: string }; selected: boolean; onClick: () => void }) {
  const Icon = ch.key === 'ccb_card' ? CreditCard : ch.key === 'unionpay' ? Landmark : CalendarDays
  return (
    <button onClick={onClick} className={`relative w-full p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-ccb-500 shadow-lg shadow-ccb-500/20' : 'border-gray-200 hover:border-gray-300'}`}>
      {ch.badge && <span className={`absolute -top-2 -right-2 text-xs px-2 py-0.5 rounded-full ${ch.badgeStyle}`}>{ch.badge}</span>}
      {selected && <div className="absolute top-3 right-3 w-5 h-5 bg-ccb-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${ch.iconBg}`}><Icon className="w-5 h-5" /></div>
      <p className="mt-3 font-semibold text-gray-900">{ch.label}</p>
      <p className="text-sm text-gray-500 mt-1">{ch.desc}</p>
    </button>
  )
}

function InstallmentCalc({ amount, selected, onSelect }: { amount: number; selected: number; onSelect: (m: number) => void }) {
  return (
    <div className="mt-3 p-3 bg-gold-50 rounded-lg space-y-2">
      <p className="text-sm font-medium text-gold-700">分期方案</p>
      {installmentRates.map((r) => {
        const interest = Math.round(amount * r.rate * (r.months / 12))
        const monthly = Math.round((amount + interest) / r.months)
        return (
          <button key={r.months} onClick={() => onSelect(r.months)} className={`w-full flex justify-between items-center text-sm px-3 py-2 rounded-lg transition-colors ${selected === r.months ? 'bg-gold-200 text-gold-800 font-medium' : 'text-gray-600 hover:bg-gold-100'}`}>
            <span>{r.months}期（利率{(r.rate * 100).toFixed(1)}%）</span>
            <span>月供 ¥{monthly.toLocaleString()} / 利息 ¥{interest.toLocaleString()} / 合计 ¥{(amount + interest).toLocaleString()}</span>
          </button>
        )
      })}
    </div>
  )
}

function AuditTrail({ payment }: { payment: PaymentType }) {
  const [open, setOpen] = useState(false)
  if (payment.status !== 'completed' || payment.auditTrail.length === 0) return null
  const firstTs = new Date(payment.auditTrail[0].timestamp).getTime()
  const lastTs = new Date(payment.auditTrail[payment.auditTrail.length - 1].timestamp).getTime()
  const seconds = Math.round((lastTs - firstTs) / 1000)
  return (
    <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-space-50 hover:bg-space-100 transition-colors">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800"><ShieldCheck className="w-4 h-4 text-ccb-500" />穿透式审计<span className="text-xs bg-ccb-100 text-ccb-700 px-1.5 py-0.5 rounded-full">已验证</span></span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="p-4 bg-white">
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>审计追踪编号: AT-{payment.id}-{Date.now().toString(36).toUpperCase()}</span>
            <span>资金到账耗时: {seconds}秒</span>
          </div>
          {payment.auditTrail.map((entry, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-ccb-500 border-2 border-ccb-200 shrink-0" />
                {i < payment.auditTrail.length - 1 && <div className="w-px h-full min-h-[2rem] bg-ccb-200" />}
              </div>
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{entry.from}</span>
                  <span className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString('zh-CN')}</span>
                </div>
                {entry.intermediateAccounts.map((acc, j) => (
                  <div key={j} className="flex items-center gap-1.5 my-1 ml-2">
                    <ArrowDownRight className="w-3.5 h-3.5 text-gold-500" />
                    <span className="text-xs bg-gold-50 text-gold-700 px-2 py-0.5 rounded">{acc}</span>
                    <span className="text-xs text-gray-400">¥{entry.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 my-1 ml-2">
                  <ArrowDownRight className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-sm text-gray-700">{entry.to}</span>
                  <span className="text-xs text-gray-400">¥{entry.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Receipt({ payment, onClose }: { payment: PaymentType; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2"><Check className="w-6 h-6 text-green-600" /></div>
          <p className="text-lg font-bold text-gray-900">支付成功</p>
        </div>
        <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-2 text-sm">
          {[['支付编号', payment.id], ['金额', `¥${payment.amount.toLocaleString()}`], ['支付方式', methodLabel[payment.method]], ['日期', new Date().toLocaleDateString('zh-CN')]].map(([k, v]) => (
            <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className={`${k === '金额' ? 'font-bold text-ccb-600' : k === '支付编号' ? 'font-mono' : ''} text-gray-800`}>{v}</span></div>
          ))}
          <div className="border-t border-dashed border-gray-200 pt-2 mt-2 flex items-center gap-1 text-gold-600"><Stamp className="w-4 h-4" /><span className="text-xs font-bold">建融家园资金监管专户</span></div>
          <div className="flex justify-center pt-2"><div className="w-20 h-20 border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400"><QrCode className="w-8 h-8" /><span className="text-[10px] mt-0.5">验证二维码</span></div></div>
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-lg bg-ccb-500 text-white font-medium hover:bg-ccb-600 transition-colors">关闭</button>
      </div>
    </div>
  )
}

const channels = [
  { key: 'ccb_card' as PaymentMethod, label: '建行卡快捷支付', desc: '****8888', badge: '免手续费', badgeStyle: 'bg-ccb-500 text-white', iconBg: 'bg-gradient-to-br from-ccb-400 to-ccb-600' },
  { key: 'unionpay' as PaymentMethod, label: '银联支付', desc: '支持所有银联卡', badge: '0.6%手续费', badgeStyle: 'bg-gray-500 text-white', iconBg: 'bg-gradient-to-br from-red-600 to-gold-500' },
  { key: 'installment' as PaymentMethod, label: '租金分期', desc: '3-12期灵活选择', iconBg: 'bg-gradient-to-br from-gold-400 to-gold-600' },
]

export default function Payment() {
  const navigate = useNavigate()
  const { payments, makePayment } = useStore()
  const [channel, setChannel] = useState<PaymentMethod>('ccb_card')
  const [installment, setInstallment] = useState(3)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const payingPayment = payments.find((p) => p.id === payingId)
  const hasCompleted = payments.some((p) => p.status === 'completed')

  const displayStatus = (p: PaymentType) => processingIds.has(p.id) ? 'processing' : p.status

  const handleConfirm = () => {
    if (!payingId) return
    const id = payingId
    setPayingId(null)
    setProcessingIds((prev) => new Set(prev).add(id))
    setTimeout(() => {
      makePayment(id)
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
      setShowSuccess(true)
      setTimeout(() => { setShowSuccess(false); setReceiptId(id) }, 1500)
    }, 1000)
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
      {showSuccess && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center animate-bounce">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3"><Check className="w-8 h-8 text-green-600" /></div>
            <p className="text-lg font-bold text-gray-900">支付成功</p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900">租金支付</h1>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">选择支付渠道</h2>
        <div className="grid grid-cols-3 gap-4">
          {channels.map((ch) => (
            <div key={ch.key}>
              <ChannelCard ch={ch} selected={channel === ch.key} onClick={() => setChannel(ch.key)} />
              {channel === 'installment' && ch.key === 'installment' && payingPayment && (
                <InstallmentCalc amount={payingPayment.amount} selected={installment} onSelect={setInstallment} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">账单管理</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-space-50 text-gray-600">
              <tr>{['月份', '金额', '状态', '支付方式', '日期', '操作'].map((h) => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{new Date(p.createdAt).getMonth() + 1}月</td>
                  <td className="px-4 py-3 text-gray-800">¥{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={displayStatus(p)} /></td>
                  <td className="px-4 py-3 text-gray-600">{methodLabel[p.method]}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && !processingIds.has(p.id) && <button onClick={() => setPayingId(p.id)} className="px-3 py-1 bg-ccb-500 text-white text-xs rounded-lg hover:bg-ccb-600 transition-colors">去支付</button>}
                    {p.status === 'completed' && <button onClick={() => setReceiptId(p.id)} className="px-3 py-1 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors">查看凭证</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.filter((p) => p.status === 'completed').map((p) => <AuditTrail key={p.id} payment={p} />)}
      </section>

      {hasCompleted && (
        <div className="flex justify-end">
          <button onClick={() => navigate('/service')} className="flex items-center gap-2 px-6 py-3 bg-ccb-500 text-white font-medium rounded-xl hover:bg-ccb-600 transition-colors shadow-lg shadow-ccb-500/20">前往租后服务<ArrowRight className="w-4 h-4" /></button>
        </div>
      )}

      {payingPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPayingId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">确认支付</h3>
            <p className="text-3xl font-bold text-ccb-500 mb-4">¥{payingPayment.amount.toLocaleString()}</p>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between"><span>支付方式</span><span className="font-medium text-gray-900">{methodLabel[channel]}</span></div>
              <div className="flex justify-between"><span>账单编号</span><span>{payingPayment.id}</span></div>
            </div>
            {channel === 'installment' && <InstallmentCalc amount={payingPayment.amount} selected={installment} onSelect={setInstallment} />}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPayingId(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-lg bg-ccb-500 text-white font-medium hover:bg-ccb-600 transition-colors">确认支付</button>
            </div>
          </div>
        </div>
      )}

      {receiptId && (() => { const p = payments.find((pp) => pp.id === receiptId); return p ? <Receipt payment={p} onClose={() => setReceiptId(null)} /> : null })()}
    </div>
  )
}
