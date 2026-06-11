import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { FileSpreadsheet, Download, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Reconciliation() {
  const { merchants } = useStore()

  const totalCount = merchants.filter((m) => m.status === 'active' || m.status === 'suspended').length
  const diffCount = merchants.filter((m) => m.verifyRate < 0.7).length
  const diffAmount = merchants.filter((m) => m.verifyRate < 0.7).reduce((s, m) => s + m.verifyAmount, 0)

  return (
    <div>
      <PageHeader
        title="核销对账"
        description="商户核销对账报告与差异处理"
        actions={
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm hover:opacity-90">
            <Download className="w-4 h-4" />导出全部对账单
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><FileSpreadsheet className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-[#6B7A99]">对账商户数</p>
              <p className="text-xl font-bold text-primary">{totalCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-[#6B7A99]">差异笔数</p>
              <p className="text-xl font-bold text-red-600">{diffCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-[#6B7A99]">差异金额</p>
              <p className="text-xl font-bold text-amber-600">¥{diffAmount.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[#6B7A99]">
                <th className="px-5 py-3 font-medium">商户名称</th>
                <th className="px-5 py-3 font-medium">核销笔数</th>
                <th className="px-5 py-3 font-medium">核销金额</th>
                <th className="px-5 py-3 font-medium">对账状态</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => {
                const normal = m.verifyRate >= 0.7
                return (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium">{m.name}</td>
                    <td className="px-5 py-3">{m.verifyCount}</td>
                    <td className="px-5 py-3">¥{m.verifyAmount.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', normal ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200')}>
                        {normal ? '正常' : '有差异'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button className="text-primary text-xs hover:underline">查看详情</button>
                        <button className="text-[#6B7A99] text-xs hover:underline flex items-center gap-1"><Download className="w-3 h-3" />导出</button>
                      </div>
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
