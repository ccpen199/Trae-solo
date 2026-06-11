import { useState } from 'react'
import { Search, CheckCircle, ArrowDown, MapPin, Clock, User } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { batchTrace } from '@/data/mockData'

export default function Trace() {
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = () => {
    setSearched(true)
  }

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="批次追溯" subtitle="产品全链路溯源查询" />

      <div className="relative mb-8 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="输入批次号查询，如 B20250301"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full pl-10 pr-24 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-colors"
        >
          查询
        </button>
      </div>

      {searched && (
        <div className="animate-fade-in-up">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900">{batchTrace.product}</h2>
              <span className="font-mono text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {batchTrace.batchCode}
              </span>
            </div>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-emerald-200" />

            {batchTrace.stages.map((stage, i) => (
              <div key={i} className={`relative mb-8 last:mb-0 animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm ml-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 text-sm">{stage.stage}</span>
                    {i < batchTrace.stages.length - 1 && (
                      <ArrowDown className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {stage.location}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {stage.timestamp}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {stage.operator}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3 animate-fade-in-up">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-sm text-gray-500">质检报告</span>
              <span className="ml-2 text-sm font-semibold badge-safe">合格</span>
            </div>
          </div>
        </div>
      )}

      {!searched && (
        <div className="text-center py-20 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>输入批次号开始追溯查询</p>
        </div>
      )}
    </div>
  )
}
