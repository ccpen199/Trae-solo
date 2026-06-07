import { useEffect, useState } from 'react'
import { getTaxTypes } from '@/lib/api'
import { Receipt, Info } from 'lucide-react'

export default function TaxTypes() {
  const [taxTypes, setTaxTypes] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const res = await getTaxTypes()
    if (res.success && res.data) setTaxTypes(res.data as any[])
  }

  const categoryLabels: Record<string, string> = { '流转税': '流转税', '所得税': '所得税', '附加税': '附加税', '财产行为税': '财产行为税' }
  const periodLabels: Record<string, string> = { monthly: '按月', quarterly: '按季', yearly: '按年' }
  const categories = [...new Set(taxTypes.map(t => t.category))]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">税种管理</h1>

      {categories.map(cat => (
        <div key={cat}>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{categoryLabels[cat] || cat}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {taxTypes.filter(t => t.category === cat).map(tt => (
              <div key={tt.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Receipt size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{tt.name}</div>
                    <div className="text-xs text-gray-500">{tt.code}</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">默认税率</span>
                    <span className="font-medium text-gray-900">{(tt.default_rate * 100).toFixed(tt.default_rate < 0.01 ? 2 : 1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">申报周期</span>
                    <span className="text-gray-700">{periodLabels[tt.period_type]}</span>
                  </div>
                  {tt.scope && (
                    <div className="flex items-start gap-1 pt-1">
                      <Info size={12} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-500">{tt.scope}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
