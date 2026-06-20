import { useState } from 'react'
import { Search, Filter, User, MapPin, Heart, Pill, Monitor, Phone, ChevronRight, X, Activity, AlertTriangle } from 'lucide-react'
import type { ElderProfile as ElderProfileType } from '../../types'
import { elderProfiles } from '../../data/mockData'

const healthLevelConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  healthy: { label: '健康', color: 'text-green-700', bgColor: 'bg-green-100' },
  mild: { label: '轻度', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  moderate: { label: '中度', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  severe: { label: '重度', color: 'text-red-700', bgColor: 'bg-red-100' },
}

const deviceStatusConfig: Record<string, { color: string }> = {
  online: { color: 'bg-green-400' },
  offline: { color: 'bg-slate-300' },
  alert: { color: 'bg-red-400' },
}

function HealthLevelBadge({ level }: { level: string }) {
  const config = healthLevelConfig[level]
  if (!config) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  )
}

function ElderCard({ elder, onViewDetail }: { elder: ElderProfileType; onViewDetail: (e: ElderProfileType) => void }) {
  const avatarColor = elder.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
  const activeMedications = elder.medications.filter(m => m.isActive).length
  const onlineDevices = elder.healthDevices.filter(d => d.status === 'online').length
  const alertDevices = elder.healthDevices.filter(d => d.status === 'alert').length

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
          {elder.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-slate-800">{elder.name}</h3>
            <User className={`w-4 h-4 ${elder.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`} />
            <span className="text-sm text-slate-500">{elder.age}岁</span>
            <HealthLevelBadge level={elder.healthLevel} />
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-400 mb-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{elder.address}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {elder.chronicDiseases.map((d, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                {d}
              </span>
            ))}
            {elder.chronicDiseases.length === 0 && (
              <span className="text-xs text-green-500">无慢性病</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Pill className="w-3.5 h-3.5" />
              <span>{activeMedications}项用药</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Monitor className="w-3.5 h-3.5" />
              <span>{elder.healthDevices.length}台设备</span>
              {alertDevices > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              )}
              {onlineDevices > 0 && (
                <span className="w-2 h-2 rounded-full bg-green-400" />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => onViewDetail(elder)}
          className="w-full flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
        >
          查看详情
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function DetailModal({ elder, onClose }: { elder: ElderProfileType; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'basic' | 'devices' | 'medications' | 'contacts'>('basic')
  const tabs = [
    { key: 'basic' as const, label: '基本信息' },
    { key: 'devices' as const, label: '健康设备' },
    { key: 'medications' as const, label: '用药记录' },
    { key: 'contacts' as const, label: '紧急联系人' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${elder.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'} flex items-center justify-center text-white font-bold`}>
              {elder.name[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{elder.name}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{elder.age}岁</span>
                <HealthLevelBadge level={elder.healthLevel} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex border-b border-slate-200 px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'basic' && <BasicInfoTab elder={elder} />}
          {activeTab === 'devices' && <DevicesTab elder={elder} />}
          {activeTab === 'medications' && <MedicationsTab elder={elder} />}
          {activeTab === 'contacts' && <ContactsTab elder={elder} />}
        </div>
      </div>
    </div>
  )
}

function BasicInfoTab({ elder }: { elder: ElderProfileType }) {
  const infoItems = [
    { label: '性别', value: elder.gender === 'male' ? '男' : '女' },
    { label: '年龄', value: `${elder.age}岁` },
    { label: '血型', value: elder.bloodType },
    { label: '联系电话', value: elder.phone },
    { label: '身份证号', value: elder.idNumber },
    { label: '地址', value: elder.address },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {infoItems.map((item, i) => (
          <div key={i}>
            <span className="text-xs text-slate-400">{item.label}</span>
            <p className="text-sm text-slate-800 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          过敏信息
        </h4>
        <div className="flex flex-wrap gap-2">
          {elder.allergies.length > 0 ? elder.allergies.map((a, i) => (
            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700">
              {a}
            </span>
          )) : (
            <span className="text-sm text-slate-400">无过敏记录</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-red-500" />
          慢性病
        </h4>
        <div className="flex flex-wrap gap-2">
          {elder.chronicDiseases.length > 0 ? elder.chronicDiseases.map((d, i) => (
            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-700">
              {d}
            </span>
          )) : (
            <span className="text-sm text-slate-400">无慢性病记录</span>
          )}
        </div>
      </div>
    </div>
  )
}

function DevicesTab({ elder }: { elder: ElderProfileType }) {
  return (
    <div>
      {elder.healthDevices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">暂无健康设备</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-3 text-slate-500 font-medium">设备名称</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">最新读数</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">状态</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">阈值范围</th>
                <th className="text-left py-3 px-3 text-slate-500 font-medium">最后更新</th>
              </tr>
            </thead>
            <tbody>
              {elder.healthDevices.map(device => (
                <tr key={device.id} className="border-b border-slate-100">
                  <td className="py-3 px-3 text-slate-800 font-medium">{device.name}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800">{device.lastReading}</span>
                    <span className="text-slate-400 ml-1">{device.unit}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${deviceStatusConfig[device.status]?.color || 'bg-slate-300'}`} />
                      <span className={
                        device.status === 'online' ? 'text-green-600' :
                        device.status === 'alert' ? 'text-red-600' : 'text-slate-500'
                      }>
                        {device.status === 'online' ? '在线' : device.status === 'alert' ? '告警' : '离线'}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {device.alertThreshold
                      ? `${device.alertThreshold.min} ~ ${device.alertThreshold.max} ${device.unit}`
                      : '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {new Date(device.lastUpdate).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MedicationsTab({ elder }: { elder: ElderProfileType }) {
  const activeMeds = elder.medications.filter(m => m.isActive)

  return (
    <div>
      {activeMeds.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">暂无用药记录</p>
      ) : (
        <div className="space-y-3">
          {activeMeds.map(med => (
            <div key={med.id} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{med.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{med.dosage} · {med.frequency}</p>
                </div>
                <span className="text-xs text-slate-400">{med.startDate} ~ {med.endDate}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500">服药依从性</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      med.adherence >= 0.9 ? 'bg-green-500' :
                      med.adherence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${med.adherence * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold ${
                  med.adherence >= 0.9 ? 'text-green-600' :
                  med.adherence >= 0.7 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(med.adherence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {med.timeSlots.map((slot, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white text-slate-600 border border-slate-200">
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactsTab({ elder }: { elder: ElderProfileType }) {
  return (
    <div>
      {elder.emergencyContacts.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">暂无紧急联系人</p>
      ) : (
        <div className="space-y-3">
          {elder.emergencyContacts.map(contact => (
            <div key={contact.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{contact.name}</h4>
                  <p className="text-xs text-slate-500">{contact.relationship}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">{contact.phone}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  contact.level === 1 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {contact.level === 1 ? '第一联系人' : '第二联系人'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ElderProfile() {
  const [search, setSearch] = useState('')
  const [healthFilter, setHealthFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [selectedElder, setSelectedElder] = useState<ElderProfileType | null>(null)

  const filtered = elderProfiles.filter(elder => {
    const matchSearch = elder.name.includes(search) || elder.address.includes(search) || elder.idNumber.includes(search)
    const matchHealth = healthFilter === 'all' || elder.healthLevel === healthFilter
    const matchGender = genderFilter === 'all' || elder.gender === genderFilter
    return matchSearch && matchHealth && matchGender
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">老人数字档案</h1>
        <p className="text-slate-500 mt-1">管理老人健康档案、用药记录与设备监控</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索姓名、地址、身份证号..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={healthFilter}
              onChange={e => setHealthFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部健康等级</option>
              <option value="healthy">健康</option>
              <option value="mild">轻度</option>
              <option value="moderate">中度</option>
              <option value="severe">重度</option>
            </select>
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部性别</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
          <span>共 <strong className="text-slate-800">{filtered.length}</strong> 位老人</span>
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-green-500" />
            健康 {elderProfiles.filter(e => e.healthLevel === 'healthy').length}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            轻度 {elderProfiles.filter(e => e.healthLevel === 'mild').length}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-orange-500" />
            中度 {elderProfiles.filter(e => e.healthLevel === 'moderate').length}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-red-500" />
            重度 {elderProfiles.filter(e => e.healthLevel === 'severe').length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(elder => (
          <ElderCard key={elder.id} elder={elder} onViewDetail={setSelectedElder} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">未找到匹配的老人档案</p>
        </div>
      )}

      {selectedElder && (
        <DetailModal elder={selectedElder} onClose={() => setSelectedElder(null)} />
      )}
    </div>
  )
}
