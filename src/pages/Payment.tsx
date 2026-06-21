import { useState } from 'react'
import { useStore } from '@/store/useStore'
import type { PaymentMethod, Payment as PaymentType } from '@/types'
import {
  CreditCard,
  Landmark,
  CalendarDays,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const channels: { key: PaymentMethod; label: string; desc: string; badge?: string; iconBg: string }[] = [
  { key: 'ccb_card', label: '建行卡快捷支付', desc: '建行借记卡/信用卡免手续费', badge: '推荐', iconBg: 'bg-gradient-to-br from-ccb-400 to-ccb-600' },
  { key: 'unionpay', label: '银联支付', desc: '支持他行银联卡', iconBg: 'bg-gradient-to-br from-red-600 to-gold-500' },
  { key: 'installment', label: '租金分期', desc: '3-12期灵活选择，利率低至3.6%', iconBg: 'bg-gradient-to-br from-gold-400 to-gold-600' },
]

const methodLabel: Record<PaymentMethod, string> = {
  ccb_card: '建行卡快捷支付',
  unionpay: '银联支付',
  installment: '租金分期',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待付', color: 'bg-amber-100 text-amber-700' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已付', color: 'bg-green-100 text-green-700' },
  failed: { label: '逾期', color: 'bg-red-100 text-red-700' },
}

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  completed: <Check className="w-3.5 h-3.5" />,
  failed: <AlertTriangle className="w-3.5 h-3.5" />,
  processing: <Clock className="w-3.5 h-3.5" />,
}

function ChannelIcon({ channelKey }: { channelKey: PaymentMethod }) {
  const ch = channels.find((c) => c.key === channelKey)!
  const Icon = channelKey === 'ccb_card' ? CreditCard : channelKey === 'unionpay' ? Landmark : CalendarDays
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${ch.iconBg}`}>
      <Icon className="w-5 h-5" />
    </div>
  )
}

function InstallmentCalculator({ amount }: { amount: number }) {
  const rates = [
    { months: 3, rate: 0.036 },
    { months: 6, rate: 0.036 },
    { months: 12, rate: 0.042 },
  ]
  return (
    <div className="space-y-2 mt-3 p-3 bg-gold-50 rounded-lg">
      <p className="text-sm font-medium text-gold-700">分期方案</p>
      {rates.map((r) => {
        const totalInterest = Math.round(amount * r.rate * (r.months / 12))
        const monthlyAmount = Math.round((amount + totalInterest) / r.months)
        return (
          <div key={r.months} className="flex justify-between text-sm text-gray-600">
            <span>{r.months}期（利率{(r.rate * 100).toFixed(1)}%）</span>
            <span>月供 ¥{monthlyAmount.toLocaleString()}，总利息 ¥{totalInterest.toLocaleString()}，合计 ¥{(amount + totalInterest).toLocaleString()}</span>
          </div>
        )
      })}
    </div>
  )
}

function AuditTrailPanel({ payment }: { payment: PaymentType }) {
  const [open, setOpen] = useState(false)
  if (payment.status !== 'completed' || payment.auditTrail.length === 0) return null
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-ccb-500 hover:underline">
        资金流水穿透式审计
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="mt-2 p-3 bg-space-50 rounded-lg">
          {payment.auditTrail.map((entry, i) => (
            <div key={i}>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-ccb-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{entry.from}</p>
                  {entry.intermediateAccounts.map((acc, j) => (
                    <div key={j} className="flex items-center gap-1 ml-2 my-0.5">
                      <ArrowDownRight className="w-3 h-3 text-gold-500" />
                      <span className="text-xs text-gold-600">{acc}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 ml-2 my-0.5">
                    <ArrowDownRight className="w-3 h-3 text-ccb-500" />
                    <span className="text-sm text-gray-700">{entry.to}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              {i < payment.auditTrail.length - 1 && <div className="ml-1 w-px h-4 bg-gray-200" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Payment() {
  const { payments, makePayment } = useStore()
  const [selectedChannel, setSelectedChannel] = useState<PaymentMethod>('ccb_card')
  const [payingId, setPayingId] = useState<string | null>(null)

  const payingPayment = payments.find((p) => p.id === payingId)

  const handlePay = (id: string) => setPayingId(id)

  const handleConfirm = () => {
    if (payingId) {
      makePayment(payingId)
      setPayingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">租金支付</h1>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">选择支付渠道</h2>
        <div className="grid grid-cols-3 gap-4">
          {channels.map((ch) => (
            <button
              key={ch.key}
              onClick={() => setSelectedChannel(ch.key)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                selectedChannel === ch.key
                  ? 'border-ccb-500 shadow-lg shadow-ccb-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {ch.badge && (
                <span className="absolute -top-2 -right-2 bg-ccb-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {ch.badge}
                </span>
              )}
              <ChannelIcon channelKey={ch.key} />
              <p className="mt-3 font-semibold text-gray-900">{ch.label}</p>
              <p className="text-sm text-gray-500 mt-1">{ch.desc}</p>
              {selectedChannel === ch.key && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-ccb-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">账单管理</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-space-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">月份</th>
                <th className="text-left px-4 py-3 font-medium">金额</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">支付方式</th>
                <th className="text-left px-4 py-3 font-medium">日期</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => {
                const sc = statusConfig[p.status]
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {new Date(p.createdAt).getMonth() + 1}月
                    </td>
                    <td className="px-4 py-3 text-gray-800">¥{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                        {statusIcon[p.status]}
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{methodLabel[p.method]}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td className="px-4 py-3">
                      {p.status === 'pending' && (
                        <button onClick={() => handlePay(p.id)} className="px-3 py-1 bg-ccb-500 text-white text-xs rounded-lg hover:bg-ccb-600 transition-colors">
                          去支付
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {payments.filter((p) => p.status === 'completed').map((p) => (
          <AuditTrailPanel key={p.id} payment={p} />
        ))}
      </section>

      {payingPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPayingId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">确认支付</h3>
            <p className="text-3xl font-bold text-ccb-500 mb-4">¥{payingPayment.amount.toLocaleString()}</p>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>支付方式</span>
                <span className="font-medium text-gray-900">{methodLabel[selectedChannel]}</span>
              </div>
              <div className="flex justify-between">
                <span>账单编号</span>
                <span>{payingPayment.id}</span>
              </div>
            </div>
            {selectedChannel === 'installment' && <InstallmentCalculator amount={payingPayment.amount} />}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPayingId(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-lg bg-ccb-500 text-white font-medium hover:bg-ccb-600 transition-colors">
                确认支付
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
