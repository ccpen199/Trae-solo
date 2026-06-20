import { useState } from 'react'
import {
  ChevronDown,
  Phone,
  Calendar,
  FileText,
  MapPin,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  AlertCircle,
  Clock,
  Pill,
} from 'lucide-react'
import { elderProfiles, behaviorAlerts } from '../../data/mockData'
import StatusBadge from '../../components/StatusBadge'
import type { ElderProfile, HealthDevice } from '../../types'

const healthLevelMap: Record<string, string> = {
  healthy: '健康',
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
}

const healthLevelColorMap: Record<string, string> = {
  healthy: 'bg-green-100 text-green-700',
  mild: 'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  severe: 'bg-red-100 text-red-700',
}

const deviceIconMap: Record<string, React.ReactNode> = {
  blood_pressure: <Activity className="w-5 h-5" />,
  heart_rate: <Heart className="w-5 h-5" />,
  blood_sugar: <Droplets className="w-5 h-5" />,
  fall_detector: <AlertCircle className="w-5 h-5" />,
  thermometer: <Thermometer className="w-5 h-5" />,
}

function isReadingAbnormal(device: HealthDevice): boolean {
  if (!device.alertThreshold) return false
  return device.lastReading < device.alertThreshold.min || device.lastReading > device.alertThreshold.max
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const alertTypeLabel: Record<string, string> = {
  fall: '跌倒',
  wandering: '走失',
  medication_miss: '漏药',
  abnormal_vital: '体征异常',
  inactivity: '活动异常',
}

export default function Overview() {
  const [selectedElderId, setSelectedElderId] = useState(elderProfiles[0].id)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const elder = elderProfiles.find((e) => e.id === selectedElderId) as ElderProfile
  const recentAlerts = behaviorAlerts
    .filter((a) => a.elderId === selectedElderId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3)

  const todayMedications = elder.medications.filter((m) => m.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">家庭概览</h2>
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

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-elderly-200 to-elderly-400 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-white">{elder.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-slate-800">{elder.name}</h3>
              <span className="text-sm text-slate-400">{elder.age}岁</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${healthLevelColorMap[elder.healthLevel]}`}>
                {healthLevelMap[elder.healthLevel]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{elder.address}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {elder.chronicDiseases.map((d) => (
                <span key={d} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                  {d}
                </span>
              ))}
              {elder.allergies.map((a) => (
                <span key={a} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                  过敏: {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-3">健康设备状态</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {elder.healthDevices.map((device) => (
            <div key={device.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    device.status === 'alert' ? 'bg-red-50 text-red-500' :
                    device.status === 'online' ? 'bg-green-50 text-green-500' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {deviceIconMap[device.type]}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{device.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    device.status === 'online' ? 'bg-green-500' :
                    device.status === 'alert' ? 'bg-red-500 animate-pulse' :
                    'bg-slate-300'
                  }`} />
                  <span className={`text-xs ${
                    device.status === 'online' ? 'text-green-600' :
                    device.status === 'alert' ? 'text-red-600' :
                    'text-slate-400'
                  }`}>
                    {device.status === 'online' ? '在线' : device.status === 'alert' ? '告警' : '离线'}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold ${
                  isReadingAbnormal(device) ? 'text-red-500' : 'text-slate-800'
                }`}>
                  {device.lastReading}
                </span>
                <span className="text-sm text-slate-400">{device.unit}</span>
              </div>
              {isReadingAbnormal(device) && (
                <span className="inline-block mt-1 text-xs text-red-500 font-medium">⚠ 超出阈值范围</span>
              )}
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {formatTime(device.lastUpdate)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-3">今日用药计划</h3>
        {todayMedications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-center text-slate-400">
            暂无用药计划
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="space-y-4">
              {todayMedications.map((med) => (
                <div key={med.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-elderly-50 rounded-lg flex items-center justify-center">
                      <Pill className="w-4 h-4 text-elderly-500" />
                    </div>
                    <div className="w-px h-full bg-slate-200 mt-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-700">{med.name}</span>
                      <span className="text-xs text-slate-400">{med.dosage} · {med.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {med.timeSlots.map((slot) => (
                        <span key={slot} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                          {slot}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            med.adherence >= 0.9 ? 'bg-green-400' :
                            med.adherence >= 0.7 ? 'bg-yellow-400' :
                            'bg-red-400'
                          }`}
                          style={{ width: `${med.adherence * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        med.adherence >= 0.9 ? 'text-green-600' :
                        med.adherence >= 0.7 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(med.adherence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-3">最近预警</h3>
        {recentAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-center text-slate-400">
            暂无预警记录
          </div>
        ) : (
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-start gap-3">
                <StatusBadge status={alert.severity} type="alert" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700">{alertTypeLabel[alert.type]}</span>
                    <span className="text-xs text-slate-400">{formatTime(alert.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-500">{alert.description}</p>
                </div>
                {alert.resolved && (
                  <span className="text-xs text-green-500 font-medium shrink-0">已处理</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 font-medium hover:bg-red-100 transition-colors">
          <Phone className="w-4 h-4" />
          一键呼叫
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-elderly-50 border border-elderly-100 rounded-xl text-elderly-600 font-medium hover:bg-elderly-100 transition-colors">
          <Calendar className="w-4 h-4" />
          预约服务
        </button>
        <button className="flex items-center justify-center gap-2 py-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 font-medium hover:bg-blue-100 transition-colors">
          <FileText className="w-4 h-4" />
          查看报告
        </button>
      </div>
    </div>
  )
}
