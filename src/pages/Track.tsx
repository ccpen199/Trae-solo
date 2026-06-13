import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, QrCode, AlertTriangle, MapPin, CheckCircle2, XCircle, Loader2, Camera, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const tabs = ['手机号', '运单号', '扫码']
const tabTypes = ['phone', 'waybill', 'scan']
const placeholders = ['请输入手机号', '请输入运单号', '扫描运单条码']

const statusBadgeMap: Record<string, { label: string; cls: string }> = {
  picked_up: { label: '已揽收', cls: 'badge-warning' },
  in_transit: { label: '运输中', cls: 'badge-info' },
  out_for_delivery: { label: '派送中', cls: 'badge-info' },
  pending: { label: '待取件', cls: 'badge-warning' },
  delivered: { label: '已签收', cls: 'badge-success' },
  exception: { label: '异常件', cls: 'badge-danger' },
}

export default function Track() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { trackingResult, fetchTracking, loading } = useAppStore()

  const [activeTab, setActiveTab] = useState(1)
  const [searchValue, setSearchValue] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [scanManual, setScanManual] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && q.trim()) {
      setSearchValue(q.trim())
      setActiveTab(1)
      setHasSearched(true)
      setQueryError(null)
      fetchTracking('waybill', q.trim())
    }
  }, [])

  const resetAll = () => {
    setSearchValue('')
    setHasSearched(false)
    setQueryError(null)
    setScanManual(false)
    useAppStore.setState({ trackingResult: null })
    setSearchParams({})
  }

  const handleSearch = async () => {
    const value = searchValue.trim()
    if (!value) return

    const type = activeTab === 2 ? 'waybill' : tabTypes[activeTab]

    setHasSearched(true)
    setQueryError(null)

    if (type === 'phone') {
      if (!/^\d{11}$/.test(value)) {
        setQueryError('手机号格式不正确，请输入11位数字')
        return
      }
    } else if (type === 'waybill') {
      if (value.length < 8) {
        setQueryError('运单号长度不能少于8位')
        return
      }
    }

    await fetchTracking(type, value)

    const state = useAppStore.getState()
    if (!state.trackingResult) {
      setQueryError('未查询到该运单的物流信息，请核对单号/手机号后重试')
    }
  }

  const handleScanSuccess = () => {
    const waybill = 'YT20250602002'
    setSearchValue(waybill)
    setActiveTab(1)
    setScanManual(false)
    setHasSearched(true)
    setQueryError(null)
    fetchTracking('waybill', waybill)
  }

  const renderScanArea = () => {
    if (scanManual) return null

    return (
      <div className="space-y-4">
        <div className="relative mx-auto w-64 h-64 rounded-xl border-2 border-dashed border-navy/30 flex items-center justify-center bg-surface overflow-hidden">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl" />
          <div className="absolute left-4 right-4 h-1 bg-accent/60 animate-pulse-slow rounded-full" style={{ animation: 'slide-up-down 1.5s ease-in-out infinite' }} />
          <div className="flex flex-col items-center gap-2">
            <Camera className="w-12 h-12 text-navy/40" />
            <div className="flex items-center gap-2 text-text-light text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              正在扫描条码...
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={handleScanSuccess} className="btn-primary px-5 py-2 flex items-center gap-1 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            模拟识别成功
          </button>
          <button onClick={() => setScanManual(true)} className="btn-outline px-5 py-2 flex items-center gap-1 text-sm">
            <XCircle className="w-4 h-4" />
            扫码失败，手动输入
          </button>
        </div>
        <style>{`
          @keyframes slide-up-down {
            0%, 100% { transform: translateY(-80px); }
            50% { transform: translateY(80px); }
          }
        `}</style>
      </div>
    )
  }

  const renderInputRow = () => {
    if (activeTab === 2 && !scanManual) return null
    return (
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder={activeTab === 2 ? '请输入运单号' : placeholders[activeTab]}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} className="btn-primary px-4 flex items-center gap-1">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          查询
        </button>
        {activeTab === 2 && (
          <button onClick={() => setScanManual(false)} className="btn-outline px-3">
            <QrCode className="w-5 h-5" />
          </button>
        )}
      </div>
    )
  }

  const renderNoResults = () => {
    if (!hasSearched || loading || trackingResult) return null
    return (
      <div className="card p-8 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-danger" />
        </div>
        <div>
          <h3 className="font-bold text-navy mb-1">未找到物流信息</h3>
          <p className="text-sm text-danger mt-2">
            {queryError || '未查询到该运单的物流信息，请核对单号/手机号后重试'}
          </p>
        </div>
        <button onClick={resetAll} className="btn-outline px-6 py-2 text-sm flex items-center gap-1 mx-auto">
          <RefreshCw className="w-4 h-4" />
          清除查询
        </button>
      </div>
    )
  }

  const renderEmptyState = () => {
    if (hasSearched || loading || trackingResult) return null
    return (
      <div className="text-center py-16 text-text-lighter">
        <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">输入运单号或手机号查询物流信息</p>
      </div>
    )
  }

  const renderTracking = () => {
    if (!trackingResult || loading) return null
    const st = statusBadgeMap[trackingResult.status] || { label: trackingResult.status, cls: 'badge-info' }

    return (
      <div className="space-y-4 animate-fade-in">
        {trackingResult.exception && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-danger text-sm">{trackingResult.exception.type}</p>
              <p className="text-xs text-red-600/70 mt-0.5">{trackingResult.exception.message}</p>
            </div>
          </div>
        )}

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-navy text-base">{trackingResult.waybillNo}</span>
            <span className={st.cls}>{st.label}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-light mb-4">
            <MapPin className="w-3 h-3 text-navy/60" />
            <span className="text-navy/80">{trackingResult.sender.city}</span>
            <div className="flex-1 h-px border-t border-dashed border-gray-300 relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white flex items-center justify-center">
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-accent" />
              </div>
            </div>
            <MapPin className="w-3 h-3 text-accent" />
            <span className="text-accent">{trackingResult.receiver.city}</span>
          </div>

          <div className="relative pl-6">
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />
            {trackingResult.nodes.map((node, i) => {
              const isLast = i === trackingResult.nodes.length - 1
              return (
                <div key={i} className={`relative pb-4 ${isLast ? 'pb-0' : ''}`}>
                  <div className={`absolute left-[-15px] top-1.5 w-3 h-3 rounded-full border-2 ${
                    isLast ? 'bg-accent border-accent animate-pulse-slow' : 'bg-white border-gray-300'
                  }`} />
                  <div className="ml-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${isLast ? 'text-accent' : 'text-text-light'}`}>
                        {node.time}
                      </span>
                      <span className={`text-xs ${isLast ? 'font-bold text-navy' : 'text-text-light'}`}>
                        {node.status}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isLast ? 'text-text' : 'text-text-lighter'}`}>
                      {node.location} - {node.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="section-title text-sm mb-3">物流轨迹</h3>
          <div className="relative h-32 bg-surface rounded-lg overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 300 120">
              <line x1="50" y1="60" x2="250" y2="60" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6 4" />
              <circle cx="50" cy="60" r="8" fill="#0F2B46" />
              <text x="50" y="90" textAnchor="middle" className="text-xs" fill="#718096">{trackingResult.sender.city}</text>
              <circle cx="250" cy="60" r="8" fill="#38A169" />
              <text x="250" y="90" textAnchor="middle" className="text-xs" fill="#718096">{trackingResult.receiver.city}</text>
              <circle cx="170" cy="60" r="5" fill="#FF6B35" className="animate-pulse-slow" />
              <MapPin x="162" y="38" width="16" height="16" fill="#FF6B35" />
            </svg>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-text-light">
            <span>预计送达: {trackingResult.estimatedDelivery}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="card p-4">
        <div className="flex gap-1 bg-surface rounded-lg p-1 mb-4">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(i); if (i !== 2) setScanManual(false) }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === i ? 'bg-white text-navy shadow-sm' : 'text-text-light'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 2 ? renderScanArea() : renderInputRow()}
        {activeTab === 2 && scanManual && (
          <div className="mt-3">
            {renderInputRow()}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-text-light flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          查询中...
        </div>
      )}

      {renderNoResults()}
      {renderTracking()}
      {renderEmptyState()}
    </div>
  )
}
