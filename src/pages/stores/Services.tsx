import { ClipboardList, Star, MessageSquare } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { serviceRecords } from '@/data/mockData'

export default function Services() {
  const avgScore = (serviceRecords.reduce((sum, r) => sum + r.score, 0) / serviceRecords.length).toFixed(1)

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader title="服务记录" subtitle="查看门店服务评价与反馈" />

      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 mb-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-emerald-100 text-sm">平均服务评分</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-3xl font-bold">{avgScore}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className={i < Math.round(Number(avgScore)) ? 'fill-amber-300 text-amber-300' : 'text-white/40'} />
                ))}
              </div>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-emerald-100 text-sm">总服务数</p>
            <p className="text-2xl font-bold">{serviceRecords.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">客户</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">服务项目</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">日期</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">服务人员</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">评分</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">反馈</th>
            </tr>
          </thead>
          <tbody>
            {serviceRecords.map(record => (
              <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-gray-900">{record.customerName}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-600">{record.service}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-500">{record.date}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-600">{record.staff}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < record.score ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500 max-w-[200px] truncate">{record.feedback}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
