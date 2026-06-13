import { Link, useNavigate } from 'react-router-dom'
import { Search, Package, Calculator, MapPin, Phone, ScanLine, AlertTriangle, ChevronRight, TrendingUp, Zap, ShoppingBag, Crown, CheckCircle2, XCircle, RefreshCw, Loader2, Camera } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'

const quickEntries = [
  { icon: Search, label: '查件', path: '/track', color: 'bg-blue-500', desc: '运单实时追踪' },
  { icon: Package, label: '下单', path: '/order', color: 'bg-accent', desc: '自助寄件下单' },
  { icon: Calculator, label: '试算', path: '/estimate', color: 'bg-green-500', desc: '运费智能报价' },
  { icon: MapPin, label: '范围', path: '/coverage', color: 'bg-purple-500', desc: '派件范围识别' },
]

const statusMap: Record<string, { label: string; cls: string; icon: string }> = {
  in_transit: { label: '运输中', cls: 'badge-info', icon: '🚚' },
  delivered: { label: '已签收', cls: 'badge-success', icon: '✅' },
  exception: { label: '异常件', cls: 'badge-danger', icon: '⚠️' },
  picked_up: { label: '已揽收', cls: 'badge-warning', icon: '📦' },
  out_for_delivery: { label: '派送中', cls: 'badge-info', icon: '🛵' },
  pending: { label: '待取件', cls: 'badge-warning', icon: '🏪' },
}

const searchTabs = [
  { key: 'waybill', label: '运单号', icon: Package, placeholder: '请输入运单号，如 YT20260602002' },
  { key: 'phone', label: '手机号', icon: Phone, placeholder: '请输入收件人/寄件人手机号' },
  { key: 'scan', label: '扫码', icon: ScanLine, placeholder: '' },
]

interface OrderTracking {
  waybillNo: string
  nodes: { time: string; location: string; status: string; description: string }[]
  exception?: { type: string; message: string }
}

export default function Home() {
  const { orders, fetchOrders, fetchTracking, loading } = useAppStore()
  const navigate = useNavigate()
  const [activeSearchTab, setActiveSearchTab] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [searchError, setSearchError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [orderTrackings, setOrderTrackings] = useState<Record<string, OrderTracking>>({})
  const [profilingData, setProfilingData] = useState<{ totalOrders: number; topCategory: string; topRegion: string; coupons: { code: string; amount: number; expiresAt: string; reason: string; tag: string; tagColor: string }[] } | null>(null)

  useEffect(() => {
    fetchOrders()
    fetchProfilingData()
  }, [fetchOrders])

  useEffect(() => {
    if (orders.length > 0) {
      orders.slice(0, 3).forEach(async (order) => {
        if (!orderTrackings[order.waybillNo]) {
          try {
            const res = await fetch(`/api/tracking?type=waybill&value=${encodeURIComponent(order.waybillNo)}`)
            const json = await res.json()
            if (json.success && json.data?.list?.[0]) {
              const t = json.data.list[0]
              let nodes: OrderTracking['nodes'] = []
              try {
                const raw = typeof t.nodes === 'string' ? JSON.parse(t.nodes) : t.nodes
                const SM: Record<string, string> = { picked_up: '已揽收', in_transit: '运输中', out_for_delivery: '派送中', delivered: '已签收', exception: '异常', pending: '待取件' }
                nodes = (Array.isArray(raw) ? raw : []).map((n: any) => ({ time: n.time, location: n.location, status: SM[n.status] || n.status, description: n.description }))
              } catch { nodes = [] }
              let exception: OrderTracking['exception']
              if (t.status === 'exception' || t.exception_type) {
                exception = { type: t.exception_type || '滞留预警', message: t.exception_message || '快件异常，已触发人工介入流程' }
              }
              setOrderTrackings((prev) => ({ ...prev, [order.waybillNo]: { waybillNo: t.waybill_no, nodes, exception } }))
            }
          } catch { /* ignore */ }
        }
      })
    }
  }, [orders])

  const fetchProfilingData = async () => {
    try {
      const res = await fetch('/api/profiling/statistics/overview')
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data
        const catStats = d.top_categories || []
        const regStats = d.top_regions || []
        const topCat = catStats.length > 0 ? catStats[0].category : '服装'
        const topReg = regStats.length > 0 ? regStats[0].region : '上海'
        const coupons = [
          { code: `FREQ${d.total_orders > 10 ? 15 : 10}`, amount: d.total_orders > 10 ? 15 : 10, expiresAt: '2026-07-30', reason: `根据您本月寄件${d.total_orders}次专属推送`, tag: '高频寄件', tagColor: 'bg-amber-100 text-amber-700' },
          { code: `CAT_${topCat.slice(0, 2).toUpperCase()}20`, amount: 20, expiresAt: '2026-07-15', reason: `${topCat}品类常用用户专享`, tag: '品类偏好', tagColor: 'bg-pink-100 text-pink-700' },
          { code: `REG_${topReg.slice(0, 2).toUpperCase()}10`, amount: 10, expiresAt: '2026-06-30', reason: `${topReg}地区专属派送券`, tag: '区域定向', tagColor: 'bg-blue-100 text-blue-700' },
        ]
        setProfilingData({ totalOrders: d.total_orders, topCategory: topCat, topRegion: topReg, coupons })
      }
    } catch {
      setProfilingData({ totalOrders: 12, topCategory: '服装', topRegion: '上海', coupons: [
        { code: 'FREQ15', amount: 15, expiresAt: '2026-07-30', reason: '根据您本月寄件12次专属推送', tag: '高频寄件', tagColor: 'bg-amber-100 text-amber-700' },
        { code: 'CLTH20', amount: 20, expiresAt: '2026-07-15', reason: '服装品类常用用户专享', tag: '品类偏好', tagColor: 'bg-pink-100 text-pink-700' },
        { code: 'SH10', amount: 10, expiresAt: '2026-06-30', reason: '上海地区专属派送券', tag: '区域定向', tagColor: 'bg-blue-100 text-blue-700' },
      ] })
    }
  }

  const handleSearch = useCallback(async () => {
    setSearchError('')
    const tab = searchTabs[activeSearchTab]
    if (tab.key === 'scan') { setScanOpen(true); return }
    if (!searchValue.trim()) { setSearchError(tab.key === 'waybill' ? '请输入运单号' : '请输入手机号'); return }
    if (tab.key === 'phone' && !/^\d{11}$/.test(searchValue.trim())) { setSearchError('手机号格式不正确，请输入11位数字'); return }
    if (tab.key === 'waybill' && searchValue.trim().length < 8) { setSearchError('运单号长度不能少于8位'); return }
    setIsSearching(true)
    try {
      await fetchTracking(tab.key, searchValue.trim())
      const current = useAppStore.getState()
      if (current.trackingResult) {
        navigate(`/track?q=${encodeURIComponent(searchValue.trim())}&type=${tab.key}`)
      } else {
        setSearchError('未查询到该运单的物流信息，请核对单号/手机号后重试')
      }
    } finally { setIsSearching(false) }
  }, [activeSearchTab, searchValue, fetchTracking, navigate])

  const handleScanSuccess = () => {
    const waybill = 'YT20260602002'
    setSearchValue(waybill); setActiveSearchTab(0); setScanOpen(false); setIsSearching(true)
    fetchTracking('waybill', waybill).then(() => { setIsSearching(false); navigate(`/track?q=${waybill}&type=waybill`) })
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="gradient-navy rounded-2xl p-5 text-white relative overflow-hidden">
        <svg className="absolute top-0 right-0 w-40 h-40 opacity-20" viewBox="0 0 200 200"><path d="M20,100 Q60,20 100,100 T180,100" fill="none" stroke="white" strokeWidth="3" strokeDasharray="8 4" className="animate-route-dash" /><circle cx="20" cy="100" r="6" fill="white" /><circle cx="100" cy="100" r="6" fill="white" /><circle cx="180" cy="100" r="6" fill="white" /></svg>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-wide mb-0.5 animate-slide-up">速运达</h1>
          <p className="text-white/60 text-xs animate-slide-up stagger-1">快递物流全生命周期服务中台</p>
          <div className="mt-4 bg-white rounded-xl p-1 flex gap-1 animate-slide-up stagger-2">
            {searchTabs.slice(0, 2).map((t, i) => (
              <button key={t.key} onClick={() => { setActiveSearchTab(i); setSearchError('') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${activeSearchTab === i ? 'bg-accent text-white' : 'text-text-light'}`}>
                <t.icon className="w-3.5 h-3.5" />{t.label}
              </button>
            ))}
            <button onClick={() => { setActiveSearchTab(2); setSearchError('') }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${activeSearchTab === 2 ? 'bg-accent text-white' : 'text-text-light'}`}>
              <ScanLine className="w-3.5 h-3.5" />扫码
            </button>
          </div>
          <div className="mt-2 animate-slide-up stagger-3">
            {activeSearchTab < 2 ? (
              <div className="relative">
                <input className="w-full h-11 rounded-xl px-4 pr-24 text-sm text-navy placeholder:text-text-lighter outline-none focus:ring-2 focus:ring-accent/30" placeholder={searchTabs[activeSearchTab].placeholder} value={searchValue} onChange={(e) => { setSearchValue(e.target.value); setSearchError('') }} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                <button onClick={handleSearch} disabled={isSearching || loading} className="absolute right-1.5 top-1.5 bottom-1.5 bg-accent hover:bg-accent/90 disabled:opacity-60 text-white text-sm font-medium px-4 rounded-lg transition-colors">{isSearching ? '查询中...' : '查询'}</button>
              </div>
            ) : (
              <button onClick={() => setScanOpen(true)} className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-dashed border-white/30 text-white/80 text-sm font-medium flex items-center justify-center gap-2 transition-all"><ScanLine className="w-4 h-4" />点击打开摄像头扫码</button>
            )}
            {searchError && <p className="text-xs text-red-300 mt-1.5 animate-fade-in">{searchError}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickEntries.map((entry, i) => (
          <Link key={entry.path} to={entry.path} className={`card card-hover p-3 animate-slide-up stagger-${i + 1}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${entry.color} rounded-lg flex items-center justify-center flex-shrink-0`}><entry.icon className="w-5 h-5 text-white" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-navy">{entry.label}</p><p className="text-[11px] text-text-light mt-0.5">{entry.desc}</p></div>
            </div>
          </Link>
        ))}
      </div>

      {orders.length > 0 && (
        <div className="animate-slide-up stagger-5">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="section-title mb-0">最近追踪</h2>
            <Link to="/track" className="text-xs text-accent hover:underline flex items-center gap-0.5">查看全部<ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2.5">
            {orders.slice(0, 3).map((order) => {
              const st = statusMap[order.status] || { label: order.status, cls: 'badge-info', icon: '📦' }
              const hasException = order.status === 'exception'
              const tracking = orderTrackings[order.waybillNo]
              const nodes = tracking?.nodes || []
              const exception = tracking?.exception
              const lastNodes = nodes.length > 0 ? nodes.slice(-2) : []
              const isDelivered = order.status === 'delivered'
              return (
                <Link to={`/track?q=${order.waybillNo}&type=waybill`} key={order.id} className={`card card-hover p-3.5 block relative overflow-hidden ${hasException ? 'border border-danger/20' : ''}`}>
                  {hasException && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-danger/10 text-danger text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      <AlertTriangle className="w-3 h-3" />异常预警：{exception?.type || '滞留超24h'}
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{st.icon}</span>
                      <span className="text-sm font-bold text-navy">{order.waybillNo}</span>
                    </div>
                    <span className={`${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-light mb-2">
                    <span>{order.senderAddress.slice(0, Math.max(order.senderAddress.indexOf('区') + 1, 4))}</span>
                    <span className="text-text-lighter">→</span>
                    <span>{order.receiverAddress.slice(0, Math.max(order.receiverAddress.indexOf('区') + 1, 4))}</span>
                    <span className="text-accent font-medium ml-auto">¥{order.fee}</span>
                  </div>
                  {lastNodes.length > 0 ? (
                    <div className="space-y-1.5 pl-1.5 border-l-2 border-gray-100">
                      {lastNodes.map((node, idx) => {
                        const isLast = idx === lastNodes.length - 1
                        return (
                          <div key={idx} className="relative pl-3">
                            <span className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${isLast && !isDelivered ? 'bg-accent animate-pulse' : isDelivered ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <p className={`text-[11px] ${isLast && !isDelivered ? 'text-accent font-medium' : isDelivered ? 'text-green-600' : 'text-text-lighter'}`}>{node.description}</p>
                            {node.time && <p className="text-[10px] text-text-lighter">{node.time}</p>}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-lighter pl-1.5 border-l-2 border-gray-100 pl-3">加载轨迹中...</p>
                  )}
                  {hasException && exception && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-danger flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-medium text-danger">{exception.type}</p>
                        <p className="text-[10px] text-red-600/70">{exception.message}</p>
                      </div>
                    </div>
                  )}
                  {isDelivered && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <p className="text-[10px] text-green-700">已签收，感谢使用速运达</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <span className="text-[10px] text-text-lighter">更新 {order.createdAt}</span>
                    <span className="text-[10px] text-accent font-medium">查看完整轨迹 →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {profilingData && (
        <div className="animate-slide-up stagger-6">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="section-title mb-0">为您推荐优惠券</h2>
              <p className="text-[11px] text-text-lighter mt-0.5">基于寄件频次·区域·品类聚类智能推送</p>
            </div>
            <Link to="/profile" state={{ tab: 'coupons' }} className="text-xs text-accent hover:underline flex items-center gap-0.5">我的优惠券<ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2.5">
            {profilingData.coupons.map((c, i) => (
              <div key={c.code} className="card card-hover p-3 flex items-center gap-3 relative overflow-hidden">
                <div className="absolute top-2 right-2"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.tagColor}`}>{c.tag}</span></div>
                <div className="w-20 h-16 rounded-xl gradient-accent text-white flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] leading-none">¥</span>
                  <span className="text-3xl font-bold leading-none mt-0.5">{c.amount}</span>
                </div>
                <div className="flex-1 min-w-0 pr-14">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-navy">{c.code}</p>
                    {i === 0 && <span className="text-[10px] bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" />推荐</span>}
                  </div>
                  <p className="text-[11px] text-text-light mt-0.5">{c.reason}</p>
                  <p className="text-[10px] text-text-lighter mt-1">有效期至 {c.expiresAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profilingData && (
        <div className="animate-slide-up stagger-7">
          <h2 className="section-title mb-2.5">寄件行为画像</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="card p-3 text-center">
              <TrendingUp className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-navy">{profilingData.totalOrders}</p>
              <p className="text-[10px] text-text-light">本月寄件</p>
            </div>
            <div className="card p-3 text-center">
              <ShoppingBag className="w-5 h-5 text-pink-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-navy">{profilingData.topCategory}</p>
              <p className="text-[10px] text-text-light">常用品类</p>
            </div>
            <div className="card p-3 text-center">
              <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-navy">{profilingData.topRegion}</p>
              <p className="text-[10px] text-text-light">高频区域</p>
            </div>
          </div>
        </div>
      )}

      {scanOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 animate-slide-up">
            <h3 className="font-bold text-navy text-lg mb-1">扫码查件</h3>
            <p className="text-xs text-text-light mb-4">将运单条码置于扫描框内</p>
            <div className="relative w-full aspect-square bg-gray-900 rounded-xl overflow-hidden mb-4">
              <div className="absolute inset-8 border-2 border-accent/70 rounded-lg">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-accent rounded-tl" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-accent rounded-tr" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-accent rounded-bl" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-accent rounded-br" />
                <div className="absolute left-2 right-2 h-0.5 bg-accent/80 shadow-[0_0_10px_#ff6b35]" style={{ animation: 'slide-up-down 1.5s ease-in-out infinite' }} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setScanOpen(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleScanSuccess} className="btn-primary flex-1">模拟识别成功</button>
            </div>
            <p className="text-[11px] text-text-lighter text-center mt-3">无法扫码？<button onClick={() => { setScanOpen(false); setActiveSearchTab(0) }} className="text-accent hover:underline">手动输入运单号</button></p>
            <style>{`@keyframes slide-up-down { 0%, 100% { transform: translateY(-80px); } 50% { transform: translateY(80px); } }`}</style>
          </div>
        </div>
      )}
    </div>
  )
}
