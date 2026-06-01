import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { Plus, Search } from 'lucide-react'

export default function UsageRecordList() {
  const navigate = useNavigate()
  const { usageRecords, usageRecordsTotal, fetchUsageRecords, loading } = useStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [stationFilter, setStationFilter] = useState('')
  const [anomalyFilter, setAnomalyFilter] = useState('')
  const pageSize = 10

  useEffect(() => {
    const params: Record<string, string> = { page: String(page), page_size: String(pageSize) }
    if (search) params.battery_code = search
    if (vehicleFilter) params.vehicle_id = vehicleFilter
    if (stationFilter) params.station_id = stationFilter
    if (anomalyFilter) params.has_anomaly = anomalyFilter
    fetchUsageRecords(params)
  }, [page, search, vehicleFilter, stationFilter, anomalyFilter, fetchUsageRecords])

  const totalPages = Math.ceil(usageRecordsTotal / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">使用记录</h2>
        <button
          onClick={() => navigate('/usage/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />新增记录
        </button>
      </div>

      <div className="flex items-center gap-3 bg-[#1E293B] p-3 rounded-lg border border-slate-700/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="搜索电池编码..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
        <input
          value={vehicleFilter}
          onChange={(e) => { setVehicleFilter(e.target.value); setPage(1) }}
          placeholder="车辆编号"
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-32"
        />
        <input
          value={stationFilter}
          onChange={(e) => { setStationFilter(e.target.value); setPage(1) }}
          placeholder="站点编号"
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-32"
        />
        <select
          value={anomalyFilter}
          onChange={(e) => { setAnomalyFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
        >
          <option value="">全部异常</option>
          <option value="1">有异常</option>
          <option value="0">无异常</option>
        </select>
      </div>

      {loading.usageRecords ? (
        <div className="text-slate-400 text-center py-20">加载中...</div>
      ) : (
        <div className="bg-[#1E293B] rounded-lg border border-slate-700/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left px-4 py-3 font-medium">电池编码</th>
                <th className="text-left px-4 py-3 font-medium">车辆</th>
                <th className="text-left px-4 py-3 font-medium">站点</th>
                <th className="text-left px-4 py-3 font-medium">充放电次数</th>
                <th className="text-left px-4 py-3 font-medium">温度(°C)</th>
                <th className="text-left px-4 py-3 font-medium">SOC(%)</th>
                <th className="text-left px-4 py-3 font-medium">SOH(%)</th>
                <th className="text-left px-4 py-3 font-medium">异常</th>
                <th className="text-left px-4 py-3 font-medium">记录时间</th>
              </tr>
            </thead>
            <tbody>
              {usageRecords.map((r, i) => (
                <tr key={r.id} className={`border-t border-slate-700/50 ${i % 2 === 1 ? 'bg-slate-800/30' : ''}`}>
                  <td className="px-4 py-3 text-sky-400">{r.battery_code || r.battery_id}</td>
                  <td className="px-4 py-3 text-slate-300">{r.vehicle_id || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{r.station_id || '-'}</td>
                  <td className="px-4 py-3 text-slate-300">{r.charge_cycles}</td>
                  <td className="px-4 py-3 text-slate-300">{r.temperature}</td>
                  <td className="px-4 py-3 text-slate-300">{r.soc}</td>
                  <td className="px-4 py-3 text-slate-300">{r.soh}</td>
                  <td className="px-4 py-3">
                    {r.has_anomaly ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">异常</span>
                    ) : (
                      <span className="text-xs text-slate-500">正常</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{r.recorded_at?.slice(0, 16)}</td>
                </tr>
              ))}
              {usageRecords.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">共 {usageRecordsTotal} 条</span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm rounded bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600">上一页</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-sm rounded ${p === page ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm rounded bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600">下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
