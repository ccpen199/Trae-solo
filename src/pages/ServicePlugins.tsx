import React from 'react'
import { useApp } from '../context/AppContext'
import {
  Syringe, Activity, Fuel, MapPin, Clock, Users, Phone,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertCircle, Calendar
} from 'lucide-react'
import { vaccineSites, pcrSites, oilPrices } from '../data/services'

type TabType = 'vaccine' | 'pcr' | 'oil'

export default function ServicePlugins() {
  const { currentCity } = useApp()
  const [activeTab, setActiveTab] = React.useState<TabType>('vaccine')
  const [expandedVaccine, setExpandedVaccine] = React.useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>('all')

  const cityOil = oilPrices.find(o => o.cityId === currentCity.id) || oilPrices[0]

  const districts = ['all', ...Array.from(new Set(pcrSites.map(s => s.district)))]

  const filteredPcr = selectedDistrict === 'all' ? pcrSites : pcrSites.filter(s => s.district === selectedDistrict)

  const tabs = [
    { id: 'vaccine' as TabType, label: '疫苗接种点余量', icon: Syringe, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'pcr' as TabType, label: '核酸检测机构', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'oil' as TabType, label: '油价浮动提醒', icon: Fuel, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">便民服务插件</h2>
        <p className="text-sm text-gray-500">集成第三方实时数据，提供便捷生活服务查询</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? `${tab.bg} ${tab.color} shadow-sm ring-2 ring-offset-1 ring-current/20`
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'vaccine' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium">数据来源：对接卫健委预约系统</p>
              <p className="text-green-700 mt-0.5">实时更新各接种点疫苗余量，可预约名额实时变动，建议提前预约。</p>
            </div>
          </div>

          <div className="grid gap-4">
            {vaccineSites.map((site) => {
              const totalAvailable = site.vaccines.reduce((sum, v) => sum + v.available, 0)
              const availableTypes = site.vaccines.filter(v => v.available > 0).length
              const isExpanded = expandedVaccine === site.id

              return (
                <div key={site.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpandedVaccine(isExpanded ? null : site.id)}
                    className="w-full p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-lg">{site.name}</h3>
                          <span className="badge bg-green-100 text-green-700 text-xs">{site.district}</span>
                          <span className={`badge text-xs ${
                            availableTypes > 2 ? 'bg-green-100 text-green-700' :
                            availableTypes > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {availableTypes > 0 ? `${availableTypes}种可预约` : '暂无疫苗'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{site.address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{site.phone}</span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">可预约总剂数</p>
                        <p className="text-xl font-bold text-green-600">{totalAvailable}</p>
                        <p className="text-xs text-gray-400">剂</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">当前排队</p>
                        <p className="text-xl font-bold text-blue-600">{site.queueLength}</p>
                        <p className="text-xs text-gray-400">人</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">预计等待</p>
                        <p className="text-xl font-bold text-orange-600">{site.waitMinutes}</p>
                        <p className="text-xs text-gray-400">分钟</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">疫苗种类</p>
                        <p className="text-xl font-bold text-purple-600">{site.vaccines.length}</p>
                        <p className="text-xs text-gray-400">种</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {site.vaccines.slice(0, 3).map((v, i) => {
                        const pct = v.total > 0 ? Math.round((v.available / v.total) * 100) : 0
                        const status = pct > 50 ? '充足' : pct > 10 ? '紧张' : '紧缺'
                        const statusColor = pct > 50 ? 'text-green-600 bg-green-50' :
                                           pct > 10 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
                        return (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-xs">
                            <span className="text-gray-700">{v.name}</span>
                            <span className={`font-medium px-1.5 py-0.5 rounded ${statusColor}`}>
                              {v.available > 0 ? `${v.available}剂 · ${status}` : '已约满'}
                            </span>
                          </div>
                        )
                      })}
                      {site.vaccines.length > 3 && (
                        <span className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500">
                          +{site.vaccines.length - 3}种
                        </span>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Syringe className="w-4 h-4 text-green-600" />
                        详细疫苗库存
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {site.vaccines.map((v, i) => {
                          const pct = v.total > 0 ? Math.round((v.available / v.total) * 100) : 0
                          const status = pct > 50 ? '库存充足' : pct > 10 ? '库存紧张' : '即将缺货'
                          return (
                            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{v.name}</span>
                                <span className={`text-sm font-bold ${
                                  pct > 50 ? 'text-green-600' : pct > 10 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {v.available > 0 ? `${v.available} / ${v.total} 剂` : '已约满'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      pct > 50 ? 'bg-green-500' : pct > 10 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs ${
                                  pct > 50 ? 'text-green-600' : pct > 10 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {status}
                                </span>
                                <span className="text-xs text-gray-400">更新于 {v.updatedAt}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'pcr' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">数据来源：医疗机构实时数据接口</p>
              <p className="text-blue-700 mt-0.5">排队人数预测基于历史数据和实时情况综合计算，地图标注实时更新。</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {districts.map((d) => {
                const count = d === 'all' ? pcrSites.length : pcrSites.filter(s => s.district === d).length
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDistrict(d)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedDistrict === d
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d === 'all' ? '全部区域' : d}
                    <span className={`ml-1 text-xs ${
                      selectedDistrict === d ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>
            <span className="text-sm text-gray-500">
              共 {filteredPcr.length} 家机构
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    区域分布地图
                  </h3>
                  <span className="text-xs text-gray-400">点击标记查看详情</span>
                </div>
                <div className="relative h-80 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                  <div className="absolute inset-0 opacity-30">
                    <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
                      <path d="M50 50 L350 50 L350 250 L50 250 Z" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                      <path d="M50 120 L350 120" stroke="#cbd5e1" strokeWidth="1" />
                      <path d="M50 180 L350 180" stroke="#cbd5e1" strokeWidth="1" />
                      <path d="M150 50 L150 250" stroke="#cbd5e1" strokeWidth="1" />
                      <path d="M250 50 L250 250" stroke="#cbd5e1" strokeWidth="1" />
                      <circle cx="200" cy="150" r="80" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 6" opacity="0.5" />
                    </svg>
                  </div>

                  {filteredPcr.map((site, idx) => {
                    const positions = [
                      { top: '25%', left: '30%' },
                      { top: '40%', left: '60%' },
                      { top: '65%', left: '45%' },
                      { top: '55%', left: '75%' },
                      { top: '35%', left: '80%' },
                    ]
                    const pos = positions[idx % positions.length]
                    const currentHour = new Date().getHours()
                    const currentPeriod = site.queuePrediction.find(p => {
                      const [start] = p.time.split('-')
                      const h = parseInt(start)
                      return currentHour >= h && currentHour < h + 2
                    }) || site.queuePrediction[0]
                    const isBusy = currentPeriod.waitMinutes > 30
                    const isModerate = currentPeriod.waitMinutes > 15

                    return (
                      <div
                        key={site.id}
                        className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group"
                        style={{ top: pos.top, left: pos.left }}
                        onClick={() => {
                          const el = document.getElementById(`pcr-site-${site.id}`)
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}
                      >
                        <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg transition-transform group-hover:scale-125 ${
                          isBusy ? 'bg-red-500' : isModerate ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-white rounded-lg shadow-lg px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <p className="font-medium text-gray-900">{site.name}</p>
                          <p className="text-gray-500">排队约{currentPeriod.peopleCount}人 · 等{currentPeriod.waitMinutes}分钟</p>
                        </div>
                      </div>
                    )
                  })}

                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-lg p-2 text-xs space-y-1">
                    <p className="font-medium text-gray-700 mb-1">拥堵图例</p>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-gray-600">畅通</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      <span className="text-gray-600">一般</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <span className="text-gray-600">繁忙</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                各区域排队情况
              </h3>
              <div className="space-y-3">
                {districts.filter(d => d !== 'all').map((district) => {
                  const districtSites = pcrSites.filter(s => s.district === district)
                  const avgWait = districtSites.length > 0
                    ? Math.round(districtSites.reduce((sum, s) => {
                        const currentHour = new Date().getHours()
                        const currentPeriod = s.queuePrediction.find(p => {
                          const [start] = p.time.split('-')
                          const h = parseInt(start)
                          return currentHour >= h && currentHour < h + 2
                        }) || s.queuePrediction[0]
                        return sum + currentPeriod.waitMinutes
                      }, 0) / districtSites.length)
                    : 0
                  const totalPeople = districtSites.reduce((sum, s) => {
                    const currentHour = new Date().getHours()
                    const currentPeriod = s.queuePrediction.find(p => {
                      const [start] = p.time.split('-')
                      const h = parseInt(start)
                      return currentHour >= h && currentHour < h + 2
                    }) || s.queuePrediction[0]
                    return sum + currentPeriod.peopleCount
                  }, 0)
                  const maxWait = Math.max(...districtSites.map(s => {
                    const currentHour = new Date().getHours()
                    const currentPeriod = s.queuePrediction.find(p => {
                      const [start] = p.time.split('-')
                      const h = parseInt(start)
                      return currentHour >= h && currentHour < h + 2
                    }) || s.queuePrediction[0]
                    return currentPeriod.waitMinutes
                  }))
                  const isSelected = selectedDistrict === district
                  const isBusy = avgWait > 30

                  return (
                    <button
                      key={district}
                      onClick={() => setSelectedDistrict(isSelected ? 'all' : district)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${
                          isSelected ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {district}
                        </span>
                        <span className="text-xs text-gray-500">
                          {districtSites.length} 家机构
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`${
                          isBusy ? 'text-red-600' : 'text-green-600'
                        }`}>
                          平均等 {avgWait} 分钟
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">
                          约 {totalPeople} 人在排队
                        </span>
                      </div>
                      <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isBusy ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(maxWait / 60 * 100, 100)}%` }}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              机构列表
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPcr.map((site, idx) => {
                const currentHour = new Date().getHours()
                const currentPeriod = site.queuePrediction.find(p => {
                  const [start] = p.time.split('-')
                  const h = parseInt(start)
                  return currentHour >= h && currentHour < h + 2
                }) || site.queuePrediction[0]
                const isBusy = currentPeriod.waitMinutes > 30
                const isModerate = currentPeriod.waitMinutes > 15

                return (
                  <div
                    key={site.id}
                    id={`pcr-site-${site.id}`}
                    className="card p-5 hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                        isBusy ? 'bg-red-500' : isModerate ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{site.name}</h3>
                        <span className="badge bg-blue-100 text-blue-700 text-xs">{site.district}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{site.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{site.openHours}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-blue-600">¥{site.price}</span>
                        <span className="text-gray-400">/人次</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-50 pt-4">
                      <p className="text-xs text-gray-500 mb-2">当前时段排队预测</p>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-400">{currentPeriod.time}</p>
                          <p className="text-sm font-medium text-gray-900">
                            约 {currentPeriod.peopleCount} 人
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">预计等待</p>
                          <p className={`text-sm font-bold ${
                            isBusy ? 'text-red-600' :
                            isModerate ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {currentPeriod.waitMinutes} 分钟
                          </p>
                        </div>
                      </div>

                      <div className="flex items-end gap-1 h-12">
                        {site.queuePrediction.map((p, i) => {
                          const max = Math.max(...site.queuePrediction.map(q => q.peopleCount))
                          const h = max > 0 ? (p.peopleCount / max) * 100 : 0
                          const isCurrent = p.time === currentPeriod.time
                          return (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center gap-0.5"
                              title={`${p.time}: ${p.peopleCount}人`}
                            >
                              <div
                                className={`w-full rounded-t transition-all ${
                                  isCurrent ? 'bg-blue-500' : 'bg-blue-200'
                                }`}
                                style={{ height: `${Math.max(h, 5)}%` }}
                              />
                              <span className="text-[10px] text-gray-400">
                                {p.time.split('-')[0]}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'oil' && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">数据来源：国家发展和改革委员会公示价格</p>
              <p className="text-orange-700 mt-0.5">
                数据更新日期：{cityOil.date}，下次调价窗口：{cityOil.nextAdjustDate}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Fuel className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-lg text-gray-900">汽油价格</h3>
              </div>
              <div className="space-y-4">
                {cityOil.gasoline.map((g, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">{g.type}</p>
                      <p className="text-xs text-gray-500">元/升</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ¥{g.price.toFixed(2)}
                      </p>
                      <div className={`flex items-center gap-1 text-sm font-medium justify-end ${
                        g.change > 0 ? 'text-red-500' : g.change < 0 ? 'text-green-500' : 'text-gray-500'
                      }`}>
                        {g.change > 0 ? <TrendingUp className="w-4 h-4" /> : g.change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                        <span>
                          {g.change > 0 ? '+' : ''}{g.change.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Fuel className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-lg text-gray-900">柴油价格</h3>
              </div>
              <div className="space-y-4">
                {cityOil.diesel.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">{d.type}</p>
                      <p className="text-xs text-gray-500">元/升</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ¥{d.price.toFixed(2)}
                      </p>
                      <div className={`flex items-center gap-1 text-sm font-medium justify-end ${
                        d.change > 0 ? 'text-red-500' : d.change < 0 ? 'text-green-500' : 'text-gray-500'
                      }`}>
                        {d.change > 0 ? <TrendingUp className="w-4 h-4" /> : d.change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                        <span>
                          {d.change > 0 ? '+' : ''}{d.change.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Calendar className="w-4 h-4" />
                  <span>下次调价预计：</span>
                  <span className="font-bold">{cityOil.nextAdjustDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
