import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getPayments, payPayment } from '@/lib/api'
import { CreditCard, Search, CheckCircle2, Clock, XCircle } from 'lucide-react'

export default function Payments() {
  const { currentTaxpayer } = useAppStore()
  const [payments, setPayments] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [payingId, setPayingId] = useState<number | null>(null)

  useEffect(() => { loadData() }, [statusFilter])

  async function loadData() {
    const params = statusFilter ? `status=${statusFilter}` : ''
    const res = await getPayments(params)
    if (res.success && res.data) setPayments(res.data as any[])
  }

  async function handlePay(id: number) {
    setPayingId(id)
    const res = await payPayment(id, 'treasury_gateway')
    setPayingId(null)
    if (res.success) loadData()
  }

  const statusLabels: Record<string, { text: string; color: string; icon: any }> = {
    pending: { text: '待缴款', color: 'bg-amber-100 text-amber-700', icon: Clock },
    paid: { text: '已缴款', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    failed: { text: '缴款失败', color: 'bg-red-100 text-red-700', icon: XCircle },
    refunded: { text: '已退库', color: 'bg-blue-100 text-blue-700', icon: CreditCard },
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">缴款中心</h1>

      <div className="flex gap-2">
        {['', 'pending', 'paid', 'failed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              statusFilter === s ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === '' ? '全部' : statusLabels[s]?.text || s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">纳税人</th>
              <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">金额</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">凭证号</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">支付方式</th>
              <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">状态</th>
              <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3.5 text-sm text-gray-900">{p.taxpayer_name}</td>
                <td className="px-5 py-3.5 text-sm text-gray-900 text-right font-medium">¥{(p.amount || 0).toLocaleString()}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700 font-mono">{p.voucher_no || '-'}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{p.pay_method || '-'}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[p.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[p.status]?.text || p.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  {p.status === 'pending' && (
                    <button
                      onClick={() => handlePay(p.id)}
                      disabled={payingId === p.id}
                      className="px-3 py-1.5 text-xs text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {payingId === p.id ? '支付中...' : '国库支付'}
                    </button>
                  )}
                  {p.paid_at && <span className="text-xs text-gray-500">{p.paid_at}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CreditCard size={40} className="mx-auto mb-3 opacity-50" />
            <p>暂无缴款记录</p>
          </div>
        )}
      </div>
    </div>
  )
}
