import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, ClipboardList, Settings, Store, CheckCircle, AlertCircle, X, Radio, Wifi, Navigation, Shield, Target, ToggleLeft, ToggleRight } from 'lucide-react'
import useStore from '@/store/useStore'

const SONGJIANG_FENCE = { minLat: 30.90, maxLat: 31.15, minLng: 121.05, maxLng: 121.35 }

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [showLocPanel, setShowLocPanel] = useState(false)
  const [simulateOutside, setSimulateOutside] = useState(false)
  const { locInfo, isInSongjiang, setLocSource, addInterceptRecord, setLocation, setIsInSongjiang, setSearchQuery, interceptRecords } = useStore()
  const navigate = useNavigate()

  const effectiveInFence = simulateOutside ? false : isInSongjiang

  const handleSearch = () => {
    setSearchQuery(query)
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleLocSourceChange = (k: 'default' | 'gps' | 'cell') => {
    const oldCoords = `${locInfo.lat.toFixed(4)},${locInfo.lng.toFixed(4)}`
    setLocSource(k)
    setTimeout(() => {
      const state = window['__zustand_store']?.getState?.() || require('@/store/useStore').default.getState()
      const newLat = state.locInfo.lat
      const newLng = state.locInfo.lng
      const newLabel = state.locInfo.label
      const dist = Math.round(Math.sqrt(Math.pow(newLat - 31.03, 2) + Math.pow(newLng - 121.22, 2)) * 111000)
      addInterceptRecord?.(new Date().toLocaleTimeString(), newLat, newLng,
        `定位切换：${oldCoords}→${newLat.toFixed(4)},${newLng.toFixed(4)}(${newLabel})，距中心${dist}m`)
    }, 50)
  }

  const handleSimulateOutside = (enable: boolean) => {
    setSimulateOutside(enable)
    if (enable) {
      const outsideLat = 31.16  // 嘉定区
      const outsideLng = 121.38  // 闵行区
      setLocation(outsideLat, outsideLng)
      setIsInSongjiang(false)
      addInterceptRecord?.(new Date().toLocaleTimeString(), outsideLat, outsideLng,
        '越界定位模拟·已切换至嘉定区(31.16,121.38)·推荐范围降级')
    } else {
      setLocation(31.03, 121.22)
      setIsInSongjiang(true)
      setLocSource('default')
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex-shrink-0 font-serif-title text-lg font-bold text-primary">
            松江生活
          </Link>

          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索商户、套餐..."
              className="input-field pl-9 py-2 text-sm"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer"
              onClick={handleSearch}
            />
          </div>

          <button
            onClick={() => setShowLocPanel(true)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <MapPin className={`w-4 h-4 ${effectiveInFence ? 'text-secondary' : 'text-danger'}`} />
            <span className={`${effectiveInFence ? '' : 'text-danger'}`}>
              {effectiveInFence ? '松江区·' : '区外·'}{locInfo.label}
            </span>
            {!effectiveInFence && (
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            )}
          </button>

          <Link
            to="/merchant-join"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">商户入驻</span>
          </Link>

          <Link
            to="/orders"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors relative"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">我的订单</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] flex items-center justify-center">3</span>
          </Link>

          <Link
            to="/admin"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
            title="运营后台"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">运营后台</span>
          </Link>
        </div>
      </nav>

      {showLocPanel && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowLocPanel(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">定位与围栏设置</h3>
              <button onClick={() => setShowLocPanel(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className={`p-4 rounded-lg ${effectiveInFence ? 'bg-secondary-50 border border-secondary-100' : 'bg-danger-50 border border-danger-100'}`}>
                <div className="flex items-start gap-2.5">
                  {effectiveInFence ? (
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${effectiveInFence ? 'text-secondary' : 'text-danger'}`}>
                      {effectiveInFence ? '松江区围栏内·服务正常' : '松江区围栏外·服务受限'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      当前坐标：({locInfo.lat.toFixed(4)}, {locInfo.lng.toFixed(4)}) · {locInfo.label} · 精度±{locInfo.acc}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Navigation className="w-4 h-4 text-primary" />
                  定位来源（点击切换）
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: 'default', label: '默认松江', desc: '兜底坐标', acc: '1000m', coord: '31.030,121.220' },
                    { k: 'gps', label: 'GPS卫星', desc: 'WGS84', acc: '50m', coord: '31.051,121.247' },
                    { k: 'cell', label: '基站三角', desc: 'LBS', acc: '500m', coord: '31.042,121.228' },
                  ].map((fb) => (
                    <button
                      key={fb.k}
                      onClick={() => handleLocSourceChange(fb.k as any)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        locInfo.source === fb.k
                          ? 'border-primary bg-primary-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-primary/40'
                      }`}
                    >
                      <p className={`text-xs font-medium ${locInfo.source === fb.k ? 'text-primary' : 'text-gray-700'}`}>{fb.label}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{fb.desc} · ±{fb.acc}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5 font-mono">{fb.coord}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Shield className="w-4 h-4 text-primary" />
                  地理围栏参数
                </p>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">纬度范围</span>
                    <span className="font-mono">{SONGJIANG_FENCE.minLat} ~ {SONGJIANG_FENCE.maxLat}°N</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">经度范围</span>
                    <span className="font-mono">{SONGJIANG_FENCE.minLng} ~ {SONGJIANG_FENCE.maxLng}°E</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">覆盖范围</span>
                    <span className="font-mono">约605km² · 10街镇</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Target className="w-4 h-4 text-primary" />
                  越界模拟（验收用）
                </p>
                <div className={`p-3 rounded-lg border ${simulateOutside ? 'bg-danger-50 border-danger-200' : 'bg-gray-50 border-gray-200'} text-[11px]`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${simulateOutside ? 'text-danger' : 'text-gray-700'}`}>
                        {simulateOutside ? '已模拟越界（嘉定区）' : '模拟区外定位'}
                      </p>
                      <p className="text-gray-500 mt-0.5">
                        {simulateOutside
                          ? '当前坐标(31.1600,121.3800)·嘉定区外冈镇·围栏外'
                          : '点击开关切换至围栏外坐标，测试拦截逻辑'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSimulateOutside(!simulateOutside)}
                      className="inline-flex items-center gap-1"
                    >
                      {simulateOutside
                        ? <ToggleRight className="w-8 h-8 text-danger" />
                        : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {interceptRecords && interceptRecords.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Wifi className="w-4 h-4 text-primary" />
                    最近拦截留痕（{interceptRecords.length}条·可追溯）
                  </p>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1 max-h-28 overflow-y-auto">
                    {interceptRecords.slice(0, 5).map((l: any, i: number) => (
                      <p key={i} className="text-[10px] text-amber-700 pl-3">· {l.time} {l.reason}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Link
                  to="/admin/geofence"
                  onClick={() => setShowLocPanel(false)}
                  className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium text-center transition-colors"
                >
                  进入围栏管理后台
                </Link>
                <button
                  onClick={() => setShowLocPanel(false)}
                  className="flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
