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
              <p className="text-green-700 mt-0.5">实时更新各接种点疫苗余量，建议提前预约。</p>
            </div>
          </div>

          <div className="grid gap-4">
            {vaccineSites.map((site) => (
              <div key={site.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedVaccine(expandedVaccine === site.id ? null : site.id)}
                  className="w-full p-5 flex items-start justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{site.name}</h3>
                      <span className="badge bg-green-100 text-green-700 text-xs">{site.district}</span>
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
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>当前排队 {site.queueLength} 人</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>预计等待 {site.waitMinutes} 分钟</span>
                      </div>
                    </div>
                  </div>
                  {expandedVaccine === site.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>

                {expandedVaccine === site.id && (
                  <div className="border-t border-gray-50 p-5 bg-gray-50/50">
                    <h4 className="font-medium text-gray-700 mb-3">疫苗库存情况</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {site.vaccines.map((v, i) => {
                        const pct = v.total > 0 ? Math.round((v.available / v.total) * 100) : 0
                        return (
                          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{v.name}</span>
                              <span className={`text-sm font-bold ${
                                pct > 50 ? 'text-green-600' : pct > 10 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {v.available > 0 ? `${v.available}剂` : '已约满'}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct > 50 ? 'bg-green-500' : pct > 10 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">更新于 {v.updatedAt}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pcr' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">数据来源：医疗机构实时数据接口</p>
              <p className="text-blue-700 mt-0.5">排队人数预测基于历史数据和实时情况综合计算，仅供参考。</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedDistrict === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d === 'all' ? '全部区域' : d}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPcr.map((site) => {
              const currentHour = new Date().getHours()
              const currentPeriod = site.queuePrediction.find(p => {
                const [start] = p.time.split('-')
                const h = parseInt(start)
                return currentHour >= h && currentHour < h + 2
              }) || site.queuePrediction[0]

              return (
                <div key={site.id} className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">{site.name}</h3>
                  <span className="badge bg-blue-100 text-blue-700 text-xs mb-3 inline-block">{site.district}</span>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">{currentPeriod.time}</p>
                        <p className="text-sm font-medium text-gray-900">
                          约 {currentPeriod.peopleCount} 人
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">预计等待</p>
                        <p className={`text-sm font-bold ${
                          currentPeriod.waitMinutes > 30 ? 'text-red-600' :
                          currentPeriod.waitMinutes > 15 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {currentPeriod.waitMinutes} 分钟
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-end gap-1 h-12">
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
