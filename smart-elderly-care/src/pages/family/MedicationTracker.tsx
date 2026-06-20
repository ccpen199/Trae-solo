import { useState, useMemo } from 'react'
import { ChevronDown, Pill, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { elderProfiles } from '../../data/mockData'
import type { ElderProfile, Medication } from '../../types'

function CircularProgress({ value, size = 140, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  const color = value >= 90 ? '#22c55e' : value >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{Math.round(value)}</span>
        <span className="text-xs text-slate-400">依从率%</span>
      </div>
    </div>
  )
}

function generateWeeklyData(medications: Medication[]) {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const avgAdherence = medications.length > 0
    ? medications.reduce((sum, m) => sum + m.adherence, 0) / medications.length
    : 0

  return days.map((day) => ({
    day,
    adherence: Math.min(100, Math.max(0, Math.round((avgAdherence + (Math.random() - 0.5) * 0.2) * 100))),
  }))
}

function adherenceColor(rate: number): string {
  if (rate >= 0.9) return 'bg-green-400'
  if (rate >= 0.7) return 'bg-yellow-400'
  return 'bg-red-400'
}

function adherenceTextColor(rate: number): string {
  if (rate >= 0.9) return 'text-green-600'
  if (rate >= 0.7) return 'text-yellow-600'
  return 'text-red-600'
}

export default function MedicationTracker() {
  const [selectedElderId, setSelectedElderId] = useState(elderProfiles[0].id)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const elder = elderProfiles.find((e) => e.id === selectedElderId) as ElderProfile
  const medications = elder.medications.filter((m) => m.isActive)

  const overallAdherence = useMemo(() => {
    if (medications.length === 0) return 0
    return (medications.reduce((sum, m) => sum + m.adherence, 0) / medications.length) * 100
  }, [medications])

  const weeklyData = useMemo(() => generateWeeklyData(medications), [medications])

  const lowAdherenceMeds = medications.filter((m) => m.adherence < 0.8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">用药依从性追踪</h2>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-elderly-300 transition-colors"
          >
            <div className="w-7 h-7 bg-elderly-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-elderly-500">{elder.name[0]}</span>
            </div>
            <span className="text-sm font-medium text-slate-700">{elder.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              {elderProfiles.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedElderId(e.id)
                    setDropdownOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-elderly-50 transition-colors ${
                    e.id === selectedElderId ? 'bg-elderly-50 text-elderly-600 font-medium' : 'text-slate-700'
                  }`}
                >
                  <div className="w-6 h-6 bg-elderly-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-elderly-500">{e.name[0]}</span>
                  </div>
                  {e.name}（{e.age}岁）
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4 text-center">总体依从性评分</h3>
        <div className="flex justify-center">
          <CircularProgress value={overallAdherence} />
        </div>
      </div>

      {medications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-center text-slate-400">
          暂无用药记录
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-700">用药清单</h3>
          {medications.map((med) => (
            <div key={med.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    med.adherence >= 0.9 ? 'bg-green-50' : med.adherence >= 0.7 ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <Pill className={`w-4 h-4 ${adherenceTextColor(med.adherence)}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{med.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        med.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {med.isActive ? '使用中' : '已停用'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{med.dosage} · {med.frequency}</span>
                  </div>
                </div>
                <span className={`text-lg font-bold ${adherenceTextColor(med.adherence)}`}>
                  {Math.round(med.adherence * 100)}%
                </span>
              </div>

              <div className="mb-3">
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${adherenceColor(med.adherence)}`}
                    style={{ width: `${med.adherence * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                {med.timeSlots.map((slot) => {
                  const taken = Math.random() > (1 - med.adherence)
                  return (
                    <div key={slot} className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">{slot}</span>
                      {taken ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>起始: {med.startDate}</span>
                <span>结束: {med.endDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-base font-semibold text-slate-700 mb-4">本周依从性趋势</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip
              formatter={(value) => [`${value}%`, '依从率']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            />
            <Bar dataKey="adherence" fill="#ec4899" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {lowAdherenceMeds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-amber-700">依从性预警</h3>
          </div>
          <div className="space-y-2">
            {lowAdherenceMeds.map((med) => (
              <div key={med.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100">
                <span className="text-sm font-medium text-slate-700">{med.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-500">{Math.round(med.adherence * 100)}%</span>
                  <span className="text-xs text-amber-600">低于80%阈值</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
