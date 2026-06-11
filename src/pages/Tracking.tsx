import { useState } from 'react'
import { Search, MapPin, Share2, Copy, X, QrCode, Clock, Truck, PackageCheck } from 'lucide-react'

const MOCK_PLATFORMS = [
  { platform: '淘宝', orderId: 'TB20260611001', waybillNo: 'SF1234567890', color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  { platform: '京东', orderId: 'JD20260611002', waybillNo: 'JD9876543210', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  { platform: '拼多多', orderId: 'PDD20260611003', waybillNo: 'YT5678901234', color: 'bg-pink-500/15 text-pink-400 border-pink-500/20' },
  { platform: '抖音', orderId: 'DY20260611004', waybillNo: 'ZTO3456789012', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
]

const MOCK_SUGGESTIONS = ['SF1234567890', 'JD9876543210', 'YT5678901234']

const MOCK_NODES = [
  { time: '2026-06-11 14:32', location: '上海市浦东新区', desc: '快件已签收，签收人：本人', status: 'delivered' },
  { time: '2026-06-11 10:15', location: '上海市浦东新区', desc: '快件派送中，快递员：张师傅 138****5678', status: 'delivering' },
  { time: '2026-06-11 06:40', location: '上海转运中心', desc: '快件已到达上海转运中心', status: 'transit' },
  { time: '2026-06-10 22:10', location: '杭州转运中心', desc: '快件已从杭州转运中心发出', status: 'transit' },
  { time: '2026-06-10 18:30', location: '杭州市西湖区', desc: '快件已揽收', status: 'picked_up' },
]

type TrackingNode = { time: string; location: string; desc: string; status: string }

const statusIcon = (s: string) => {
  if (s === 'delivered') return PackageCheck
  if (s === 'delivering') return Truck
  return MapPin
}

const statusColor = (s: string) => {
  if (s === 'delivered') return 'text-emerald-400'
  if (s === 'delivering') return 'text-amber-400'
  return 'text-slate-300'
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = { delivered: '已签收', delivering: '派送中', transit: '运输中', picked_up: '已揽收' }
  return m[s] ?? s
}

export default function Tracking() {
  const [waybillNo, setWaybillNo] = useState('')
  const [nodes, setNodes] = useState<TrackingNode[] | null>(null)
  const [platform, setPlatform] = useState('')
  const [showProxy, setShowProxy] = useState(false)
  const [proxyLink, setProxyLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const doSearch = async (no: string) => {
    if (!no.trim()) return
    setLoading(true)
    setPlatform('')
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(no.trim())}`)
      const data = await res.json()
      setNodes(data.nodes ?? MOCK_NODES)
      if (data.platform) setPlatform(data.platform)
    } catch {
      setNodes(MOCK_NODES)
    }
    setLoading(false)
  }

  const handlePlatformClick = (no: string, p: string) => {
    setWaybillNo(no)
    setPlatform(p)
    doSearch(no)
  }

  const handleGenerateProxy = async () => {
    try {
      const res = await fetch('/api/tracking/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waybillNo: waybillNo || MOCK_NODES[0]?.time.slice(0, 10) }),
      })
      const data = await res.json()
      setProxyLink(data.link ?? `https://track.example.com/proxy/${Date.now().toString(36)}`)
    } catch {
      setProxyLink(`https://track.example.com/proxy/${Date.now().toString(36)}`)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(proxyLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const currentStatus = nodes?.[0]?.status
  const currentLocation = nodes?.[0]?.location

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="input-field w-full pl-9"
              placeholder="输入运单号"
              value={waybillNo}
              onChange={(e) => setWaybillNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch(waybillNo)}
            />
          </div>
          <button className="btn-primary" onClick={() => doSearch(waybillNo)} disabled={loading}>
            查询
          </button>
          <button className="btn-secondary flex items-center gap-1.5" onClick={() => { setShowProxy(true); setProxyLink('') }}>
            <Share2 className="w-4 h-4" />代查分享
          </button>
        </div>

        <div className="mt-4">
          <h3 className="section-title !text-sm !mb-2">平台订单</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MOCK_PLATFORMS.map((p) => (
              <button
                key={p.orderId}
                onClick={() => handlePlatformClick(p.waybillNo, p.platform)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-800 hover:border-amber-500/30 hover:bg-slate-800/50 transition-all text-left"
              >
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${p.color}`}>{p.platform}</span>
                <span className="text-sm text-slate-300 truncate flex-1">{p.orderId}</span>
                <span className="font-mono-num text-xs text-slate-500">{p.waybillNo}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {nodes === null && !loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <MapPin className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-slate-400 text-lg mb-6">输入运单号查询物流信息</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">常用运单：</span>
            {MOCK_SUGGESTIONS.map((no) => (
              <button
                key={no}
                onClick={() => { setWaybillNo(no); doSearch(no) }}
                className="font-mono-num text-xs text-amber-500 hover:text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
              >
                {no}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {currentStatus && (
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${statusColor(currentStatus)}`}>
                    {statusLabel(currentStatus)}
                  </p>
                  {currentLocation && (
                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />{currentLocation}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="font-mono-num text-sm text-slate-300">{waybillNo}</p>
                  {platform && (
                    <span className="badge badge-info">{platform}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="section-title">物流轨迹</h2>
            <div className="relative pl-7">
              {nodes?.map((node, i) => {
                const isLatest = i === 0
                const Icon = statusIcon(node.status)
                return (
                  <div
                    key={i}
                    className="relative pb-8 last:pb-0 animate-slide-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`absolute left-[-1.75rem] top-1 w-3.5 h-3.5 rounded-full border-2 z-10 ${
                      isLatest
                        ? 'bg-amber-500 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] w-4 h-4 left-[-1.875rem] top-0.5'
                        : 'bg-slate-800 border-slate-600'
                    }`} />
                    {i < (nodes?.length ?? 0) - 1 && (
                      <div className={`absolute left-[-1.125rem] top-4 w-0.5 h-full ${
                        isLatest ? 'bg-amber-500/60' : 'bg-slate-700'
                      }`} />
                    )}
                    <div className={`rounded-lg p-3 ${isLatest ? 'bg-amber-500/5 border border-amber-500/10' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isLatest ? 'text-amber-500' : 'text-slate-500'}`} />
                        <span className={`font-mono-num text-xs ${isLatest ? 'text-amber-400' : 'text-slate-500'}`}>
                          {node.time}
                        </span>
                      </div>
                      <p className={`text-sm flex items-center gap-1 ${isLatest ? 'text-slate-200' : 'text-slate-400'}`}>
                        <MapPin className="w-3 h-3 shrink-0" />{node.location}
                      </p>
                      <p className={`text-sm mt-0.5 ${isLatest ? 'text-amber-300' : 'text-slate-400'}`}>
                        {node.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {showProxy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowProxy(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">亲友代查</h3>
              <button onClick={() => setShowProxy(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">运单号</label>
                <input
                  className="input-field w-full"
                  value={waybillNo}
                  onChange={(e) => setWaybillNo(e.target.value)}
                  placeholder="输入运单号"
                />
              </div>

              {!proxyLink ? (
                <button className="btn-primary w-full" onClick={handleGenerateProxy}>
                  生成代查链接
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">代查链接</p>
                    <p className="text-sm text-amber-400 break-all">{proxyLink}</p>
                  </div>
                  <button
                    className={`btn-secondary w-full flex items-center justify-center gap-1.5 ${copied ? '!text-emerald-400 !border-emerald-500/50' : ''}`}
                    onClick={handleCopy}
                  >
                    <Copy className="w-4 h-4" />{copied ? '已复制' : '复制链接'}
                  </button>
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="w-20 h-20 text-slate-900 mx-auto" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />链接7天内有效
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
