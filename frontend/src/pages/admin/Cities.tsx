import { useState } from 'react'
import { Search, MapPin, Building2, ToggleLeft, ToggleRight } from 'lucide-react'
import { CITIES } from '../../constants'

interface CityConfig {
  code: string
  name: string
  province: string
  enabled: boolean
  riderCount: number
  merchantCount: number
  dailyOrders: number
  coverage: string
}

const mockCities: CityConfig[] = CITIES.map((c) => ({
  code: c.code,
  name: c.name,
  province: c.province,
  enabled: ['110000', '310000', '440100', '440300', '330100'].includes(c.code),
  riderCount: Math.floor(Math.random() * 500) + 100,
  merchantCount: Math.floor(Math.random() * 300) + 50,
  dailyOrders: Math.floor(Math.random() * 2000) + 200,
  coverage: `${(Math.random() * 20 + 5).toFixed(0)}km`,
}))

const provinceOptions = [...new Set(CITIES.map((c) => c.province))]

export default function Cities() {
  const [search, setSearch] = useState('')
  const [provinceFilter, setProvinceFilter] = useState<string>('all')
  const [cities, setCities] = useState<CityConfig[]>(mockCities)

  const filtered = cities.filter((c) => {
    const matchSearch = !search || c.name.includes(search) || c.code.includes(search)
    const matchProvince = provinceFilter === 'all' || c.province === provinceFilter
    return matchSearch && matchProvince
  })

  const toggleCity = (code: string) => {
    setCities((prev) =>
      prev.map((c) => (c.code === code ? { ...c, enabled: !c.enabled } : c)),
    )
  }

  const enabledCount = cities.filter((c) => c.enabled).length

  return (
    <div className="space-y-6" style={{ backgroundColor: '#0F172A', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">城市配置</h1>
        <div className="text-sm text-gray-400">
          已开通 <span className="text-green-400 font-medium">{enabledCount}</span> / {cities.length} 个城市
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="搜索城市名称/编码"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={provinceFilter}
          onChange={(e) => setProvinceFilter(e.target.value)}
          className="py-2.5 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部省份</option>
          {provinceOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((city) => (
          <div
            key={city.code}
            className={`bg-slate-800 rounded-2xl p-5 border transition-colors ${
              city.enabled ? 'border-slate-700/50' : 'border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-semibold text-white">{city.name}</h3>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{city.province} · {city.code}</div>
              </div>
              <button onClick={() => toggleCity(city.code)} className="text-gray-400 hover:text-white">
                {city.enabled ? (
                  <ToggleRight className="w-8 h-8 text-green-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>

            {city.enabled && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/50">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{city.riderCount}</div>
                  <div className="text-xs text-gray-500">骑手</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{city.merchantCount}</div>
                  <div className="text-xs text-gray-500">商户</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{city.dailyOrders}</div>
                  <div className="text-xs text-gray-500">日单量</div>
                </div>
              </div>
            )}

            {city.enabled && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>配送覆盖 {city.coverage}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
