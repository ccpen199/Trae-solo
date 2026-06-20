import { useState } from 'react'
import { Building2, Star, BedDouble, ClipboardCheck, Phone, MapPin, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { institutions } from '../../data/mockData'

const bedOccupancyData = institutions.map((inst) => ({
  name: inst.name.length > 6 ? inst.name.slice(0, 6) + '…' : inst.name,
  入住率: Math.round(((inst.totalBeds - inst.availableBeds) / inst.totalBeds) * 100),
  空置率: Math.round((inst.availableBeds / inst.totalBeds) * 100),
}))

const allInspectionRecords = institutions.flatMap((inst) =>
  inst.inspectionRecords.map((r) => ({ ...r, institutionName: inst.name }))
).sort((a, b) => b.date.localeCompare(a.date))

export default function Overview() {
  const [selectedInst, setSelectedInst] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="总机构数" value={1247} icon={<Building2 className="w-5 h-5" />} color="blue" trend={{ value: 3.2, isUp: true }} />
        <StatCard title="五星机构" value={2} icon={<Star className="w-5 h-5" />} color="green" />
        <StatCard title="床位利用率" value="86.5%" icon={<BedDouble className="w-5 h-5" />} color="orange" trend={{ value: 1.8, isUp: true }} />
        <StatCard title="平均巡查评分" value={87.3} icon={<ClipboardCheck className="w-5 h-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          <h2 className="text-base font-semibold text-slate-700">机构列表</h2>
          <div className="space-y-3">
            {institutions.map((inst) => {
              const occupancy = ((inst.totalBeds - inst.availableBeds) / inst.totalBeds) * 100
              const latestInspection = inst.inspectionRecords[0]
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInst(selectedInst === inst.id ? null : inst.id)}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{inst.name}</h3>
                        <StatusBadge status={latestInspection?.status ?? 'pending'} type="inspection" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />
                        {inst.address}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < inst.starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">床位可用</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${occupancy}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">
                          {inst.availableBeds}/{inst.totalBeds}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">最近巡查评分</div>
                      <span className={`text-lg font-bold ${latestInspection && latestInspection.score >= 90 ? 'text-green-600' : latestInspection && latestInspection.score >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                        {latestInspection?.score ?? '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone className="w-3 h-3" />
                      {inst.contactPhone}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${selectedInst === inst.id ? 'rotate-90' : ''}`} />
                  </div>
                  {selectedInst === inst.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-400 mb-2">服务项目</div>
                      <div className="flex flex-wrap gap-1.5">
                        {inst.services.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full">{s}</span>
                        ))}
                      </div>
                      <div className="text-xs text-slate-400 mt-3 mb-1">许可证号</div>
                      <div className="text-xs text-slate-600">{inst.licenseNumber}</div>
                      <div className="text-xs text-slate-400 mt-1">成立日期: {inst.established}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="col-span-2">
          <h2 className="text-base font-semibold text-slate-700 mb-4">床位入住率</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={bedOccupancyData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="入住率" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="空置率" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">最近巡查记录</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
            <div className="space-y-5">
              {allInspectionRecords.map((record, idx) => (
                <div key={record.id} className="relative pl-10">
                  <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 ${record.status === 'passed' ? 'bg-green-500 border-green-300' : record.status === 'failed' ? 'bg-red-500 border-red-300' : 'bg-yellow-500 border-yellow-300'}`} />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm text-slate-800">{record.institutionName}</span>
                        <StatusBadge status={record.status} type="inspection" />
                      </div>
                      <div className="text-xs text-slate-400">
                        {record.date} · {record.inspector} · 评分 {record.score}
                      </div>
                      {record.issues.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {record.issues.map((issue, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">{issue}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {idx === 0 && (
                      <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full">最新</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
