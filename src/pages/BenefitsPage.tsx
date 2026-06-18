import { Wallet, TrendingUp, Calendar, CreditCard } from 'lucide-react'

const benefitStats = [
  { label: '本月待遇', value: '3,200元', icon: Wallet, color: 'text-primary', bg: 'bg-primary/10' },
  { label: '累计发放', value: '12.8万元', icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
  { label: '发放月数', value: '243个月', icon: Calendar, color: 'text-warning', bg: 'bg-warning/10' },
  { label: '社保卡', value: '已激活', icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10' },
]

const benefitRecords = [
  { id: '1', type: '养老金', amount: '3,200元', date: '2026-06-15', status: '已发放' },
  { id: '2', type: '医保个人账户', amount: '180元', date: '2026-06-10', status: '已到账' },
  { id: '3', type: '养老金', amount: '3,200元', date: '2026-05-15', status: '已发放' },
  { id: '4', type: '医保个人账户', amount: '180元', date: '2026-05-10', status: '已到账' },
  { id: '5', type: '失业补助金', amount: '1,200元', date: '2026-04-20', status: '已发放' },
]

export default function BenefitsPage() {
  return (
    <div className="flex-1 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">我的待遇</h2>

      <div className="grid grid-cols-4 gap-4">
        {benefitStats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={24} className={s.color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h3 className="text-lg font-semibold text-gray-900">待遇发放记录</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">待遇类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">发放金额</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">发放日期</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {benefitRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-sm text-gray-900">{record.type}</td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">{record.amount}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{record.date}</td>
                  <td className="py-4 px-4 text-sm text-success">{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
