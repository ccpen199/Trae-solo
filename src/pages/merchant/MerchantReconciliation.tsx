import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { FileSpreadsheet, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const reconciliationData = [
  { date: '2026-06-08', count: 86, amount: 4300, status: 'reconciled' as const },
  { date: '2026-06-07', count: 92, amount: 4600, status: 'reconciled' as const },
  { date: '2026-06-06', count: 78, amount: 3900, status: 'pending' as const },
  { date: '2026-06-05', count: 105, amount: 5250, status: 'reconciled' as const },
  { date: '2026-06-04', count: 68, amount: 3400, status: 'pending' as const },
  { date: '2026-06-03', count: 95, amount: 4750, status: 'reconciled' as const },
  { date: '2026-06-02', count: 110, amount: 5500, status: 'reconciled' as const },
]

const statusConfig = {
  reconciled: { label: '已对账', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
  pending: { label: '待对账', icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
}

export default function MerchantReconciliation() {
  const { merchants, verifyRecords } = useStore()
  const merchant = merchants[0]
  const merchantRecords = verifyRecords.filter((r) => r.merchantName === merchant.name)
  const monthCount = merchantRecords.length
  const monthAmount = merchantRecords.reduce((s, r) => s + r.amount, 0)
  const pendingDays = reconciliationData.filter((d) => d.status === 'pending').length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="核销对账"
        description="核对商户核销记录与结算金额"
        actions={
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" /> 导出
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-[#6B7A99]">本月核销笔数</div>
            <div className="text-lg font-bold text-gray-800">{monthCount} 笔</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-[#6B7A99]">核销金额</div>
            <div className="text-lg font-bold text-gray-800">¥{monthAmount.toLocaleString()}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', pendingDays > 0 ? 'bg-amber-50' : 'bg-emerald-50')}>
            {pendingDays > 0
              ? <AlertCircle className="w-5 h-5 text-amber-600" />
              : <CheckCircle className="w-5 h-5 text-emerald-600" />}
          </div>
          <div>
            <div className="text-xs text-[#6B7A99]">对账状态</div>
            <div className={cn('text-lg font-bold', pendingDays > 0 ? 'text-amber-600' : 'text-emerald-600')}>
              {pendingDays > 0 ? `${pendingDays}天待对账` : '已全部对账'}
            </div>
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="px-5 py-3 font-medium text-left">日期</th>
                <th className="px-5 py-3 font-medium text-left">核销笔数</th>
                <th className="px-5 py-3 font-medium text-left">金额</th>
                <th className="px-5 py-3 font-medium text-left">状态</th>
              </tr>
            </thead>
            <tbody>
              {reconciliationData.map((row) => {
                const cfg = statusConfig[row.status]
                return (
                  <tr key={row.date} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{row.date}</td>
                    <td className="px-5 py-3">{row.count} 笔</td>
                    <td className="px-5 py-3 font-medium">¥{row.amount.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', cfg.color)}>
                        <cfg.icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
