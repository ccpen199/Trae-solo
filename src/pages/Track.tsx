import { useState } from 'react'
import { Search, QrCode, AlertTriangle, MapPin } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const tabs = ['手机号', '运单号', '扫码']
const tabTypes = ['phone', 'waybill', 'scan']
const placeholders = ['请输入手机号', '请输入运单号', '扫描运单条码']

export default function Track() {
  const [activeTab, setActiveTab] = useState(1)
  const [searchValue, setSearchValue] = useState('')
  const { trackingResult, fetchTracking, loading } = useAppStore()

  const handleSearch = () => {
    if (!searchValue.trim()) return
    fetchTracking(tabTypes[activeTab], searchValue.trim())
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="card p-4">
        <div className="flex gap-1 bg-surface rounded-lg p-1 mb-4">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === i ? 'bg-white text-navy shadow-sm' : 'text-text-light'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder={placeholders[activeTab]}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="btn-primary px-4 flex items-center gap-1">
            <Search className="w-4 h-4" />
            查询
          </button>
          {activeTab === 2 && (
            <button className="btn-outline px-3">
              <QrCode className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-text-light animate-pulse-slow">查询中...</div>
      )}

      {trackingResult && !loading && (
        <>
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
              <span className="text-sm font-bold text-navy">{trackingResult.waybillNo}</span>
              <span className="badge-info">{trackingResult.status === 'in_transit' ? '运输中' : trackingResult.status === 'delivered' ? '已签收' : trackingResult.status === 'picked_up' ? '已揽收' : '异常'}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-light mb-4">
              <span>{trackingResult.sender.city}</span>
              <div className="flex-1 border-t border-dashed border-gray-300" />
              <span>{trackingResult.receiver.city}</span>
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
        </>
      )}

      {!trackingResult && !loading && (
        <div className="text-center py-16 text-text-lighter">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">输入运单号或手机号查询物流信息</p>
        </div>
      )}
    </div>
  )
}
