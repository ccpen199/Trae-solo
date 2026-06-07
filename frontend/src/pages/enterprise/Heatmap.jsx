import React, { useState, useEffect } from 'react'
import { ChartBarIcon, BuildingOfficeIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { enterpriseAPI } from '../../api/client'

const Heatmap = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await enterpriseAPI.getHeatmap()
        setData(res.data)
      } catch (err) {
        setError('获取热力图数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const categories = data?.categories || []
  const departments = data?.departments || []
  const monthlyTrend = data?.monthlyTrend || []
  const maxCategory = Math.max(...categories.map((c) => c.count || c.value || 0), 1)

  const categoryColors = [
    'bg-indigo-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-teal-500',
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">福利热力图</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      {categories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-indigo-500" />
            分类使用统计
          </h3>
          <div className="space-y-4">
            {categories.map((cat, i) => {
              const count = cat.count || cat.value || 0
              const width = (count / maxCategory) * 100
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat.name || cat.category}</span>
                    <span className="text-gray-800 font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div
                      className={`${categoryColors[i % categoryColors.length]} h-4 rounded-full transition-all`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {departments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-indigo-500" />
            部门使用情况
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">部门</th>
                  <th className="text-right py-2 text-gray-500 font-medium">使用次数</th>
                  <th className="text-right py-2 text-gray-500 font-medium">人数</th>
                  <th className="text-right py-2 text-gray-500 font-medium">人均</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-700">{dept.name || dept.department}</td>
                    <td className="py-2.5 text-right text-gray-700">{dept.usageCount || dept.count || 0}</td>
                    <td className="py-2.5 text-right text-gray-700">{dept.employeeCount || dept.people || 0}</td>
                    <td className="py-2.5 text-right text-indigo-600 font-medium">
                      {dept.employeeCount || dept.people
                        ? ((dept.usageCount || dept.count || 0) / (dept.employeeCount || dept.people)).toFixed(1)
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {monthlyTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            月度趋势
          </h3>
          <div className="flex items-end gap-2 h-48">
            {monthlyTrend.map((item, i) => {
              const count = item.count || item.value || 0
              const maxVal = Math.max(...monthlyTrend.map((m) => m.count || m.value || 0), 1)
              const height = (count / maxVal) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{count}</span>
                  <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100%' }}>
                    <div
                      className="absolute bottom-0 w-full bg-indigo-500 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{item.month || item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Heatmap
