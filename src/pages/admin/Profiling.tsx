import { useState, useEffect } from 'react'
import { Users, ShoppingCart, Percent, Crown, Send, Tag } from 'lucide-react'

interface Overview {
  total_users: number
  total_orders: number
  avg_coupon_usage_rate: number
  high_value_users: number
  top_categories: { category: string; count: number }[]
  top_regions: { region: string; count: number }[]
}

interface Cluster {
  name: string
  user_count: number
  avg_orders: number
  avg_coupon_rate: number
}

interface Segment {
  id: string
  name: string
  description: string
  criteria: string
  user_count: number
}

const clusterColors: Record<string, string> = {
  '高频用户': 'accent',
  '普通用户': 'navy',
  '低频用户': 'gray',
}

export default function Profiling() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [targetCluster, setTargetCluster] = useState('')
  const [couponAmount, setCouponAmount] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/profiling/statistics/overview')
      .then((r) => r.json())
      .then((res) => { if (res.success) setOverview(res.data) })
    fetch('/api/profiling/clusters')
      .then((r) => r.json())
      .then((res) => { if (res.success) setClusters(res.data) })
    fetch('/api/profiling/segments')
      .then((r) => r.json())
      .then((res) => { if (res.success) setSegments(res.data) })
  }, [])

  const handleSend = () => {
    if (!targetCluster || !couponAmount) return
    setToast(`已向「${targetCluster}」发送 ¥${couponAmount} 优惠券`)
    setTimeout(() => setToast(''), 3000)
  }

  const statCards = overview ? [
    { label: '总用户数', value: overview.total_users, icon: Users, color: 'bg-navy' },
    { label: '总订单量', value: overview.total_orders, icon: ShoppingCart, color: 'bg-accent' },
    { label: '平均优惠券使用率', value: `${(overview.avg_coupon_usage_rate * 100).toFixed(1)}%`, icon: Percent, color: 'bg-success' },
    { label: '高价值用户数', value: overview.high_value_users, icon: Crown, color: 'bg-warning' },
  ] : []

  const maxCatCount = overview?.top_categories?.length ? Math.max(...overview.top_categories.map((c) => c.count)) : 1
  const maxRegCount = overview?.top_regions?.length ? Math.max(...overview.top_regions.map((r) => r.count)) : 1
  const maxSegCount = segments.length ? Math.max(...segments.map((s) => s.user_count)) : 1

  const getClusterColor = (name: string) => {
    const key = clusterColors[name]
    if (key === 'accent') return 'border-accent bg-accent/5'
    if (key === 'navy') return 'border-navy bg-navy/5'
    return 'border-gray-400 bg-gray-50'
  }

  const getClusterBadge = (name: string) => {
    const key = clusterColors[name]
    if (key === 'accent') return 'badge-info'
    if (key === 'navy') return 'badge badge-success'
    return 'badge badge-warning'
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-success text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card card-hover p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-text-light">{s.label}</p>
                <p className="text-lg font-bold text-navy">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="section-title mb-3">用户分群概览</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((c) => (
            <div key={c.name} className={`card card-hover p-4 border-l-4 ${getClusterColor(c.name)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-navy">{c.name}</span>
                <span className={getClusterBadge(c.name)}>{c.user_count} 人</span>
              </div>
              <div className="flex gap-4 text-xs text-text-light">
                <span>均订单 <b className="text-navy">{c.avg_orders}</b></span>
                <span>优惠券率 <b className="text-navy">{(c.avg_coupon_rate * 100).toFixed(1)}%</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="section-title mb-3">用户细分</h2>
        <div className="card p-4 space-y-3">
          {segments.map((seg) => (
            <div key={seg.id}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-bold text-navy">{seg.name}</span>
                  <span className="text-xs text-text-light ml-2">{seg.description}</span>
                </div>
                <span className="text-xs font-medium text-navy">{seg.user_count}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full gradient-accent rounded-full transition-all duration-500"
                  style={{ width: `${(seg.user_count / maxSegCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="section-title mb-3">品类与区域TOP排行</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="text-sm font-bold text-navy mb-3">品类排行</h3>
            <div className="space-y-2">
              {overview?.top_categories.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-2">
                  <span className="text-xs text-text-light w-5 text-right">{i + 1}</span>
                  <span className="text-xs text-navy w-16 truncate">{cat.category}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-accent/70 rounded" style={{ width: `${(cat.count / maxCatCount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-text-light w-10 text-right">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-bold text-navy mb-3">区域排行</h3>
            <div className="space-y-2">
              {overview?.top_regions.map((reg, i) => (
                <div key={reg.region} className="flex items-center gap-2">
                  <span className="text-xs text-text-light w-5 text-right">{i + 1}</span>
                  <span className="text-xs text-navy w-16 truncate">{reg.region}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-navy/70 rounded" style={{ width: `${(reg.count / maxRegCount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-text-light w-10 text-right">{reg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="section-title mb-3">精准推送优惠券</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-4 space-y-3">
            <div>
              <label className="text-xs text-text-light mb-1 block">目标分群</label>
              <select className="input-field" value={targetCluster} onChange={(e) => setTargetCluster(e.target.value)}>
                <option value="">选择分群</option>
                {clusters.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}（{c.user_count}人）</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-light mb-1 block">优惠券金额</label>
              <input className="input-field" type="number" placeholder="输入金额" value={couponAmount} onChange={(e) => setCouponAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-text-light mb-1 block">推送消息</label>
              <input className="input-field" placeholder="输入推送消息" value={couponMsg} onChange={(e) => setCouponMsg(e.target.value)} />
            </div>
            <button onClick={handleSend} disabled={!targetCluster || !couponAmount}
              className="btn-primary flex items-center justify-center gap-1.5 w-full disabled:opacity-50">
              <Send className="w-4 h-4" /> 发送
            </button>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-bold text-navy mb-3">预览</h3>
            <div className="gradient-accent rounded-xl p-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-start gap-3">
                <Tag className="w-8 h-8 opacity-80" />
                <div>
                  <p className="text-2xl font-bold">¥{couponAmount || '0'}</p>
                  <p className="text-sm opacity-80 mt-1">{couponMsg || '推送消息预览'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs opacity-70">
                <span>{targetCluster || '未选择分群'}</span>
                <span>仅限使用</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
