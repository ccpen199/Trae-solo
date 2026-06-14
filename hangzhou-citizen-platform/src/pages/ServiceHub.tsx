import { useState } from 'react'
import { Mountain, TrainFront, School, FileText, Calendar, Download, Search, MapPin, Clock, Tag } from 'lucide-react'
import { scenicSpots, transitLines, schoolVenues, socialSecurityCerts } from '../data/mockData'

const overviewStats = [
  { icon: Mountain, value: '27个', label: '接入景区', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { icon: TrainFront, value: '200+条', label: '公交地铁线路', iconBg: 'bg-blue-100', iconColor: 'text-primary' },
  { icon: School, value: '150所', label: '学校场馆', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { icon: FileText, value: '5类', label: '社保证明', iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
]

const tabs = ['景区预约', '交通出行', '校园场馆', '社保服务'] as const
type TabIndex = 0 | 1 | 2 | 3

const districts = ['全部', '西湖区', '上城区', '余杭区', '萧山区', '淳安县', '临平区', '临安区', '桐庐县', '富阳区', '滨江区', '钱塘区']

const levelColors: Record<string, string> = {
  '5A': 'bg-red-100 text-red-600',
  '4A': 'bg-orange-100 text-orange-600',
  '3A': 'bg-blue-100 text-blue-600',
}

const schoolTypeColors: Record<string, string> = {
  '小学': 'bg-green-100 text-green-700',
  '初中': 'bg-blue-100 text-blue-700',
  '高中': 'bg-purple-100 text-purple-700',
  '大学': 'bg-orange-100 text-orange-700',
}

const categoryColors: Record<string, string> = {
  '养老保险': 'bg-blue-100 text-blue-700',
  '失业保险': 'bg-yellow-100 text-yellow-700',
  '工伤保险': 'bg-red-100 text-red-700',
  '生育保险': 'bg-pink-100 text-pink-700',
  '住房公积金': 'bg-green-100 text-green-700',
}

export default function ServiceHub() {
  const [activeTab, setActiveTab] = useState<TabIndex>(0)
  const [scenicSearch, setScenicSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('全部')
  const [activeLineIdx, setActiveLineIdx] = useState(0)
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('全部')

  const filteredScenicSpots = scenicSpots.filter((s) => {
    const matchSearch = s.name.includes(scenicSearch)
    const matchDistrict = districtFilter === '全部' || s.district === districtFilter
    return matchSearch && matchDistrict
  })

  const filteredSchools = schoolVenues.filter((s) => {
    return schoolTypeFilter === '全部' || s.type === schoolTypeFilter
  })

  const activeLine = transitLines[activeLineIdx]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {overviewStats.map((card) => (
          <div key={card.label} className="rounded-xl bg-bg-card p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary">{card.value}</p>
                <p className="text-sm text-text-secondary">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-bg-card shadow-sm border border-border">
        <div className="border-b border-border px-5 pt-4">
          <div className="flex gap-1">
            {tabs.map((tab, idx) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(idx as TabIndex)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === idx
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
                {activeTab === idx && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 0 && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="搜索景区名称..."
                    value={scenicSearch}
                    onChange={(e) => setScenicSearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-bg-main py-2 pl-9 pr-3 text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="rounded-lg border border-border bg-bg-main px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-text-secondary">共{filteredScenicSpots.length}个景区</p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredScenicSpots.map((spot) => (
                  <div key={spot.id} className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-text-primary">{spot.name}</h4>
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${levelColors[spot.level] || 'bg-gray-100 text-gray-600'}`}>
                            {spot.level}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                          <MapPin className="h-3.5 w-3.5" />
                          {spot.district}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${spot.ticketPrice === 0 ? 'text-green-600' : 'text-text-primary'}`}>
                          {spot.ticketPrice === 0 ? '免费' : `¥${spot.ticketPrice}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                      <Clock className="h-3.5 w-3.5" />
                      {spot.openHours}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        预约
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {transitLines.map((line, idx) => (
                  <button
                    key={line.lineName}
                    type="button"
                    onClick={() => setActiveLineIdx(idx)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      activeLineIdx === idx
                        ? 'ring-2 shadow-sm'
                        : 'bg-bg-main text-text-secondary hover:bg-gray-200'
                    }`}
                    style={activeLineIdx === idx ? { backgroundColor: line.color + '15', color: line.color } : undefined}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: line.color }}
                    />
                    {line.lineName}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-border p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: activeLine.color }}
                  />
                  <h4 className="text-base font-semibold text-text-primary">{activeLine.lineName}</h4>
                  <span className="text-sm text-text-secondary">共{activeLine.stations.length}站</span>
                </div>

                <div className="overflow-x-auto pb-4">
                  <div className="flex items-start gap-0" style={{ minWidth: activeLine.stations.length * 80 }}>
                    <div className="relative flex items-start" style={{ width: activeLine.stations.length * 80 }}>
                      <div
                        className="absolute top-3 left-0 h-1"
                        style={{ width: (activeLine.stations.length - 1) * 80, backgroundColor: activeLine.color }}
                      />
                      {activeLine.stations.map((station) => (
                        <div key={station} className="flex flex-col items-center" style={{ width: 80 }}>
                          <div
                            className="relative z-10 h-6 w-6 rounded-full border-2 border-white"
                            style={{ backgroundColor: activeLine.color }}
                          />
                          <span className="mt-2 text-center text-xs text-text-primary whitespace-nowrap">{station}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-6 rounded-lg bg-bg-main p-3">
                  <div>
                    <p className="text-xs text-text-secondary">下一班</p>
                    <p className="mt-0.5 text-base font-semibold" style={{ color: activeLine.color }}>2分钟</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">下下班</p>
                    <p className="mt-0.5 text-base font-semibold text-text-primary">5分钟</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">运营状态</p>
                    <p className="mt-0.5 text-base font-semibold text-success">正常运行</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-5">
                <h4 className="mb-4 text-base font-semibold text-text-primary">公交路线查询</h4>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm text-text-secondary">出发地</label>
                    <input
                      type="text"
                      placeholder="输入出发站点..."
                      className="w-full rounded-lg border border-border bg-bg-main px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-sm text-text-secondary">目的地</label>
                    <input
                      type="text"
                      placeholder="输入目的站点..."
                      className="w-full rounded-lg border border-border bg-bg-main px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                  >
                    <Search className="h-4 w-4" />
                    查询
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {['全部', '小学', '初中', '高中', '大学'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSchoolTypeFilter(type)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      schoolTypeFilter === type
                        ? 'bg-primary text-white'
                        : 'bg-bg-main text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <p className="text-sm text-text-secondary">共{filteredSchools.length}所示范学校（全市150所）</p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSchools.map((school) => (
                  <div key={school.id} className="rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-text-primary">{school.name}</h4>
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${schoolTypeColors[school.type]}`}>
                            {school.type}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                          <MapPin className="h-3.5 w-3.5" />
                          {school.district}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {school.facilities.map((f) => (
                        <span key={f} className="inline-flex items-center gap-0.5 rounded bg-gray-100 px-2 py-0.5 text-xs text-text-secondary">
                          <Tag className="h-3 w-3" />
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        预约
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-5">
              <div className="space-y-3">
                {socialSecurityCerts.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between rounded-lg border border-border p-4 transition-shadow hover:shadow-md">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-text-primary">{cert.name}</h4>
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${categoryColors[cert.category] || 'bg-gray-100 text-gray-600'}`}>
                          {cert.category}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                        <span>开具机构：{cert.issuer}</span>
                        <span>有效期：{cert.validFrom} 至 {cert.validTo}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ml-4 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                    >
                      <Download className="h-3.5 w-3.5" />
                      自动开具
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border bg-bg-main p-5">
                <h4 className="mb-4 text-base font-semibold text-text-primary">自动开具引擎</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-bg-card p-4 border border-border">
                    <p className="text-sm text-text-secondary">引擎状态</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                      <span className="text-lg font-semibold text-success">运行中</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-bg-card p-4 border border-border">
                    <p className="text-sm text-text-secondary">今日已开具</p>
                    <p className="mt-2 text-lg font-semibold text-text-primary">1,286 份</p>
                  </div>
                  <div className="rounded-lg bg-bg-card p-4 border border-border">
                    <p className="text-sm text-text-secondary">平均处理时间</p>
                    <p className="mt-2 text-lg font-semibold text-text-primary">3.2 秒</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
