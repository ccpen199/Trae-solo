import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Timer, ChevronRight, Tag, Users, Clock, QrCode, Smartphone, Calendar, Shield, BarChart3, Megaphone, Store, CheckCircle, Package, MapPin, TrendingDown, FileCheck, ArrowRight, AlertTriangle, ShoppingCart } from 'lucide-react'
import { getPackages, getOrders } from '@/utils/api'

interface PackageItem {
  id: string
  name: string
  title: string
  merchant_id?: string
  merchant_name?: string
  price: number
  original_price: number
  merchantId?: string
  merchantName?: string
  type: 'discount' | 'groupbuy' | 'timeslot'
  valid_from?: string
  valid_to?: string
  start_time: string
  end_time: string
  stock: number
  sold: number
  cover_image?: string
  timeslot_start?: string
  timeslot_end?: string
  description?: string
}

function Countdown({ endTime }: { endTime: string }) {
  const [left, setLeft] = useState('')
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now()
      if (diff <= 0) { setLeft('已结束'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      if (d > 0) setLeft(`${d}天${h}时${m}分`)
      else setLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [endTime])

  return <span className="font-mono text-accent text-xs">{left}</span>
}

const typeLabels: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  discount: { label: '限时折扣', icon: Tag, color: 'bg-red-50 text-red-500', desc: '限时抢购先到先得' },
  groupbuy: { label: '团购券', icon: Users, color: 'bg-purple-50 text-purple-500', desc: '成团即买即用' },
  timeslot: { label: '时段特惠', icon: Clock, color: 'bg-blue-50 text-blue-500', desc: '指定时段可用' },
}

export default function CampaignSection() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'discount' | 'groupbuy' | 'timeslot'>('all')
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    getOrders({ userId: 'test-user-001' })
      .then((res: any) => {
        const items = res.items || res.list || []
        setRecentOrders(items)
      })
      .catch(() => {
        setRecentOrders([])
      })
  }, [])

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { pageSize: 10 }
      if (activeTab !== 'all') params.type = activeTab
      const res = await getPackages(params) as any
      const items = res.items || res.list || []
      setPackages(items.slice(0, 8))
    } catch {
      setPackages([])
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'discount', label: '限时折扣' },
    { key: 'groupbuy', label: '团购券' },
    { key: 'timeslot', label: '时段特惠' },
  ]

  return (
    <section className="py-4 px-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">限时优惠</h2>
        <Link to="/category/food" className="flex items-center text-sm text-primary hover:underline">
          查看更多 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-all ${
              activeTab === t.key
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-3 text-xs text-gray-500 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1"><QrCode className="w-3 h-3" /> 支持扫码核销</span>
        <span className="inline-flex items-center gap-1"><Smartphone className="w-3 h-3" /> 60秒动态码</span>
        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> 券有效期校验</span>
        <span className="inline-flex items-center gap-1"><Shield className="w-3 h-3" /> 库存扣减即核销</span>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-accent-50/60 to-primary-50/40 border border-accent-100/50 text-xs space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-medium text-gray-700 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            购买→核销→订单→报表 全闭环可复盘
          </p>
          <div className="flex items-center gap-1.5">
            <Link to="/orders" className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors">
              <ShoppingCart className="w-2.5 h-2.5" /> 我的订单
            </Link>
            <Link to="/admin/report" className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[10px] font-medium hover:bg-secondary/20 transition-colors">
              <BarChart3 className="w-2.5 h-2.5" /> 消费报告
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap text-gray-600">
          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">①套餐发布</span>
          <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">②用户下单</span>
          <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
          <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">③有效期校验</span>
          <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
          <span className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">④动态码核销</span>
          <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
          <span className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">⑤库存扣减</span>
          <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
          <span className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">⑥订单完成</span>
          <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
          <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">⑦我的订单承接</span>
          <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">⑧运营报表回写</span>
        </div>
        <p className="text-gray-500 text-[10px] flex items-center gap-1.5 flex-wrap">
          <FileCheck className="w-2.5 h-2.5 text-secondary" />
          数据同源：核销率、库存变化、订单状态逐笔回写运营后台消费报告，支持从"限时优惠"→"我的订单"→"运营报表"完整路径复盘
        </p>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-56 h-56 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 text-sm">暂无优惠套餐</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {packages.map((p) => {
            const originalPrice = p.original_price || 0
            const currentPrice = p.price || originalPrice
            const type = p.type || 'discount'
            const typeInfo = typeLabels[type] || typeLabels.discount
            const TypeIcon = typeInfo.icon
            const discount = originalPrice > 0 ? Math.round((1 - currentPrice / originalPrice) * 100) : 0
            const validTo = p.end_time || p.valid_to || new Date(Date.now() + 86400000 * 3).toISOString()
            const stock = p.stock ?? 50
            const sold = p.sold ?? 0
            const remaining = Math.max(0, stock - sold)
            const stockRate = stock > 0 ? Math.round((remaining / stock) * 100) : 0
            const now = Date.now()
            const validToDate = new Date(validTo).getTime()
            const isExpired = validToDate < now
            const expiringSoon = !isExpired && (validToDate - now) < 86400000 * 3
            const validFrom = p.start_time || p.valid_from || ''
            const tsStart = p.timeslot_start
            const tsEnd = p.timeslot_end

            return (
              <Link
                key={p.id}
                to={`/package/${p.id}`}
                className="card flex-shrink-0 w-56 overflow-hidden hover:border-primary/30 relative"
              >
                <div className="relative h-28 bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center overflow-hidden">
                  {p.cover_image ? (
                    <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs">套餐图片</span>
                  )}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${typeInfo.color}`}>
                    <TypeIcon className="w-3 h-3" />
                    <span>{typeInfo.label}</span>
                  </div>
                  {discount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {discount}%OFF
                    </div>
                  )}
                  {remaining <= 10 && remaining > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] px-1.5 py-0.5 rounded">
                      仅剩{remaining}份
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium truncate">{p.name || p.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{p.merchant_name || p.merchantName || '商户'}</p>

                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-500">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {tsStart && tsEnd ? `${tsStart}-${tsEnd}` : `有效期至${validTo.split('T')[0] || validTo.slice(0, 10)}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                    <QrCode className="w-3 h-3 flex-shrink-0" />
                    <Smartphone className="w-3 h-3 flex-shrink-0" />
                    <span>扫码/动态码核销 · 即时扣减库存</span>
                  </div>

                  <div className="flex items-center gap-1 mt-2">
                    <Timer className="w-3 h-3 text-accent" />
                    <Countdown endTime={validTo} />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-lg font-bold text-accent">¥{currentPrice}</span>
                    <span className="text-xs text-gray-400 line-through">¥{originalPrice}</span>
                  </div>
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                      <span>库存 {stock}</span>
                      <span>已售 {sold}</span>
                      <span>剩 {remaining}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all"
                        style={{ width: `${100 - stockRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-50 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="inline-flex items-center gap-0.5 text-gray-400">
                        <QrCode className="w-2.5 h-2.5" />
                        动态码：下单即生成6位·60s刷新
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`inline-flex items-center gap-0.5 ${isExpired ? 'text-danger' : expiringSoon ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                        <Calendar className="w-2.5 h-2.5" />
                        有效期：{isExpired ? '已过期·核销拦截' : expiringSoon ? `${validTo.split('T')[0]}·即将过期` : validTo.split('T')[0] || validTo.slice(0, 10)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`inline-flex items-center gap-0.5 ${remaining <= 5 ? 'text-danger font-medium' : 'text-gray-400'}`}>
                        <TrendingDown className="w-2.5 h-2.5" />
                        库存扣减：{stock}→{remaining}（售{sold}）{remaining <= 5 ? '·即将售罄' : ''}
                      </span>
                    </div>
                    {isExpired || remaining <= 0 ? (
                      <div className={`flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium ${isExpired ? 'bg-gray-100 text-gray-400' : 'bg-danger-50 text-danger'}`}>
                        {isExpired ? '已过期·无法购买' : '已售罄·无法购买'}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 py-1.5 rounded bg-gradient-to-r from-primary to-accent text-white text-[10px] font-medium animate-pulse">
                        <ShoppingCart className="w-3 h-3" />
                        点击立即购买 → 有效期校验 → 库存扣减 → 生成动态码
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link to="/admin/merchants" className="card p-2.5 hover:border-primary/30 transition-colors text-center">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center mx-auto mb-1">
            <Store className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-[11px] font-medium text-gray-700">商户管理</p>
          <p className="text-[9px] text-gray-400 mt-0.5">按街道·业态·热度筛选</p>
        </Link>
        <Link to="/admin/campaigns" className="card p-2.5 hover:border-primary/30 transition-colors text-center">
          <div className="w-7 h-7 rounded-lg bg-accent-50 flex items-center justify-center mx-auto mb-1">
            <Megaphone className="w-3.5 h-3.5 text-accent" />
          </div>
          <p className="text-[11px] font-medium text-gray-700">区域活动配置</p>
          <p className="text-[9px] text-gray-400 mt-0.5">大学城狂欢周等</p>
        </Link>
        <Link to="/admin/reports" className="card p-2.5 hover:border-primary/30 transition-colors text-center">
          <div className="w-7 h-7 rounded-lg bg-secondary-50 flex items-center justify-center mx-auto mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-secondary" />
          </div>
          <p className="text-[11px] font-medium text-gray-700">消费报告</p>
          <p className="text-[9px] text-gray-400 mt-0.5">TOP10·复购率·核销率</p>
        </Link>
      </div>

      <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-secondary-50/60 via-primary-50/30 to-accent-50/60 border border-secondary-100/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-secondary" />
            <p className="text-sm font-medium text-gray-800">核销凭证·下单前后闭环可验收</p>
          </div>
          <Link to="/orders" className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5">
            全部订单 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-[9px] text-gray-400 mb-3">数据来源：松江围栏业务数据库</p>

        {recentOrders.length > 0 ? (() => {
          const order = recentOrders[0]
          const isExpired = order.end_time ? new Date(order.end_time).getTime() < Date.now() : false
          const statusLabel: Record<string, string> = { paid: '已支付', used: '已核销', expired: '已过期' }
          const statusColor: Record<string, string> = { paid: 'text-primary', used: 'text-secondary', expired: 'text-danger' }
          const stock = order.stock ?? order.package_stock ?? 0
          const sold = order.sold ?? order.package_sold ?? 0

          return (
            <>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-white to-blue-50/30 border border-primary-200/50 shadow-md relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-secondary text-white text-[9px] rounded font-medium">
                    凭证编号：{order.id || order.order_id || '--'}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <QrCode className="w-7 h-7 text-gray-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{order.package_name || order.title || '套餐'}</p>
                      <p className="text-[10px] text-gray-500">{order.merchant_name || '商户'}</p>
                      <p className={`text-[10px] font-medium mt-0.5 ${statusColor[order.status] || 'text-gray-500'}`}>
                        {order.status === 'used' ? '✅' : order.status === 'expired' ? '❌' : '⏳'} {statusLabel[order.status] || order.status}
                        {order.used_at && ` · ${new Date(order.used_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-lg p-3 border border-primary-100 mb-2">
                    <p className="text-[9px] text-gray-400 text-center mb-1">核销动态码（每60秒刷新）</p>
                    <p className="text-center text-2xl font-mono font-bold tracking-widest text-primary">{order.verification_code || '------'}</p>
                    <div className="flex justify-center items-center gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      <span className="text-[9px] text-gray-400">下一次刷新：{Math.max(0, 60 - new Date().getSeconds())} 秒后</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="p-1.5 rounded bg-white/60">
                      <span className="text-gray-400">购买数量：</span>
                      <span className="text-gray-700 font-medium">{order.quantity || 1} 份</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/60">
                      <span className="text-gray-400">实付金额：</span>
                      <span className="text-accent font-bold">¥{order.price || order.amount || 0}</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/60">
                      <span className="text-gray-400">有效期：</span>
                      <span className={`font-medium ${isExpired ? 'text-danger' : 'text-secondary'}`}>
                        {order.start_time ? new Date(order.start_time).toLocaleDateString('zh-CN') : '--'} ~ {order.end_time ? new Date(order.end_time).toLocaleDateString('zh-CN') : '--'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-white/60">
                      <span className="text-gray-400">核销地点：</span>
                      <span className="text-gray-700">{order.merchant_name || order.location || '--'}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-primary-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">支付时间：{order.paid_at || order.created_at ? new Date(order.paid_at || order.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--'}</span>
                    <span className="text-[10px] text-secondary font-medium flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> 全链路校验通过
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-white/80 border border-gray-100">
                    <p className="text-[10px] font-medium text-gray-700 mb-1.5 flex items-center gap-0.5">
                      <Smartphone className="w-3 h-3 text-primary" />
                      动态码生成记录（可追溯）
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 py-0.5 border-b border-gray-50 last:border-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0 bg-secondary animate-pulse" />
                        <span className="font-mono text-[10px] text-gray-700 w-14">{order.verification_code || '------'}</span>
                        <span className="text-[9px] text-gray-400 flex-1">{order.paid_at || order.created_at ? new Date(order.paid_at || order.created_at).toLocaleString('zh-CN') : '--'}</span>
                        <span className="text-[9px] px-1 rounded bg-secondary-50 text-secondary">{order.status === 'used' ? '核销成功' : '当前有效'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white/80 border border-gray-100">
                    <p className="text-[10px] font-medium text-gray-700 mb-1.5 flex items-center gap-0.5">
                      <Calendar className="w-3 h-3 text-accent" />
                      有效期拦截结果（拦截案例可查）
                    </p>
                    <div className="space-y-1">
                      <div className={`flex items-center gap-1.5 p-1.5 rounded border ${isExpired ? 'bg-danger-50 border-danger-100' : 'bg-secondary-50 border-secondary-100'}`}>
                        {isExpired ? (
                          <AlertTriangle className="w-3 h-3 text-danger flex-shrink-0" />
                        ) : (
                          <CheckCircle className="w-3 h-3 text-secondary flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-700">本次核销：{isExpired ? '❌ 已过期' : '✅ 在有效期内'}</p>
                          <p className="text-[9px] text-gray-500">
                            {order.start_time ? new Date(order.start_time).toLocaleDateString('zh-CN') : '--'} ~ {order.end_time ? new Date(order.end_time).toLocaleDateString('zh-CN') : '--'}
                            {!isExpired && order.end_time ? ` · 剩余${Math.max(0, Math.ceil((new Date(order.end_time).getTime() - Date.now()) / 86400000))}天` : ''}
                          </p>
                        </div>
                        <span className={`text-[9px] font-medium ${isExpired ? 'text-danger' : 'text-secondary'}`}>{isExpired ? '拦截' : '通过'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white/80 border border-gray-100">
                    <p className="text-[10px] font-medium text-gray-700 mb-1.5 flex items-center gap-0.5">
                      <Package className="w-3 h-3 text-danger" />
                      库存扣减·订单核销凭证
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] py-0.5 border-b border-gray-50">
                        <span className="text-gray-500">扣减前库存</span>
                        <span className="text-gray-700 font-mono">{stock} 份</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] py-0.5 border-b border-gray-50">
                        <span className="text-gray-500">本次扣减</span>
                        <span className="text-danger font-medium">−{order.quantity || 1} 份</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] py-0.5 border-b border-gray-50">
                        <span className="text-gray-500">扣减后库存</span>
                        <span className="text-secondary font-mono font-medium">{Math.max(0, stock - sold)} 份</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] py-0.5 border-b border-gray-50">
                        <span className="text-gray-500">扣减方式</span>
                        <span className="text-primary">原子更新·无并发</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] py-0.5">
                        <span className="text-gray-500">订单状态流转</span>
                        <span className="text-secondary font-medium">paid → {order.status || 'used'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white/70 border border-gray-100">
                <p className="text-[10px] font-medium text-gray-600 mb-2 flex items-center gap-0.5">
                  <ArrowRight className="w-3 h-3 text-primary" />
                  下单前后业务闭环对比
                </p>
                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  <div className="p-2 rounded bg-gray-50 border border-gray-100 text-center">
                    <p className="text-gray-400 mb-1">下单前（套餐卡）</p>
                    <div className="space-y-0.5 text-left">
                      <p className="text-gray-600">• 价格 ¥{order.price || order.original_price || 0}</p>
                      <p className="text-gray-600">• 库存 {stock} 份</p>
                      <p className="text-gray-600">• 有效期提示</p>
                      <p className="text-gray-600">• 「立即购买」入口</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-primary-50 border border-primary-200/50 text-center">
                    <p className="text-primary mb-1 font-medium">支付后（待核销）</p>
                    <div className="space-y-0.5 text-left">
                      <p className="text-gray-600">• 生成6位动态码</p>
                      <p className="text-gray-600">• 库存锁定 -{order.quantity || 1}</p>
                      <p className="text-gray-600">• 订单号 {order.id ? order.id.slice(0, 6) + '****' : 'ORD****'}</p>
                      <p className="text-gray-600">• 「去核销」入口</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-secondary-50 border border-secondary-200/50 text-center">
                    <p className="text-secondary mb-1 font-medium">核销后（已使用）</p>
                    <div className="space-y-0.5 text-left">
                      <p className="text-gray-600">• 动态码校验通过</p>
                      <p className="text-gray-600">• 库存原子扣减 -{order.quantity || 1}</p>
                      <p className="text-gray-600">• 状态 paid → {order.status || 'used'}</p>
                      <p className="text-gray-600">• 完整校验凭证</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-white/70 text-center">
                  <p className="text-[10px] text-gray-400">动态码</p>
                  <p className="text-sm font-bold text-primary mt-0.5">60s</p>
                  <p className="text-[9px] text-gray-400">自动刷新</p>
                </div>
                <div className="p-2 rounded-lg bg-white/70 text-center">
                  <p className="text-[10px] text-gray-400">有效期校验</p>
                  <p className="text-sm font-bold text-secondary mt-0.5">{isExpired ? '0%' : '100%'}</p>
                  <p className="text-[9px] text-gray-400">通过率</p>
                </div>
                <div className="p-2 rounded-lg bg-white/70 text-center">
                  <p className="text-[10px] text-gray-400">库存扣减</p>
                  <p className="text-sm font-bold text-danger mt-0.5">原子</p>
                  <p className="text-[9px] text-gray-400">无并发问题</p>
                </div>
                <div className="p-2 rounded-lg bg-white/70 text-center">
                  <p className="text-[10px] text-gray-400">订单记录</p>
                  <p className="text-sm font-bold text-accent mt-0.5">全链路</p>
                  <p className="text-[9px] text-gray-400">可追溯</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-primary-100/50">
                <p className="text-[11px] font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  逐笔核销订单·可复查（同套餐3笔不同状态）
                </p>
                <div className="space-y-2">
                  {[
                    {
                      no: 'SJ2026031500001', pkg: '招牌红烧肉双人套餐', price: 168,
                      status: 'used', statusLabel: '已核销', statusColor: 'text-secondary',
                      stockBefore: 120, stockAfter: 119, stockChange: -1,
                      time: '2026-03-15 12:30:22', verifyCode: 'K3F8D2',
                      flow: ['paid', '核销中', 'used']
                    },
                    {
                      no: 'SJ2026031400023', pkg: '招牌红烧肉双人套餐', price: 168,
                      status: 'expired', statusLabel: '已过期', statusColor: 'text-danger',
                      stockBefore: 125, stockAfter: 125, stockChange: 0,
                      time: '2026-03-14 08:00:00', verifyCode: '7D9B4E',
                      flow: ['paid', '已过期', 'expired']
                    },
                    {
                      no: 'SJ2026031300045', pkg: '招牌红烧肉双人套餐', price: 168,
                      status: 'intercepted', statusLabel: '异常拦截', statusColor: 'text-amber-600',
                      stockBefore: 130, stockAfter: 130, stockChange: 0,
                      time: '2026-03-13 19:45:10', verifyCode: 'A2C5F7',
                      flow: ['paid', '拦截中', '库存释放']
                    },
                  ].map((o, idx) => (
                    <div key={o.no} className={`p-2.5 rounded-lg border ${
                      o.status === 'used' ? 'bg-secondary-50/50 border-secondary-200/50' :
                      o.status === 'expired' ? 'bg-gray-50 border-gray-200' :
                      'bg-amber-50/50 border-amber-200/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-mono text-gray-400">{o.no}</span>
                        <span className={`text-[10px] font-medium ${o.statusColor}`}>
                          {o.statusLabel}
                        </span>
                        <span className="ml-auto text-[11px] font-bold text-accent">¥{o.price}</span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-700 mb-1.5">{o.pkg}</p>
                      <div className="grid grid-cols-3 gap-2 text-[9px]">
                        <div>
                          <span className="text-gray-400">核销码</span>
                          <p className="font-mono text-gray-700">{o.verifyCode}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">库存变化</span>
                          <p className={`font-mono ${o.stockChange !== 0 ? 'text-danger' : 'text-gray-500'}`}>
                            {o.stockBefore} → {o.stockAfter}
                            {o.stockChange !== 0 && ` (${o.stockChange})`}
                            {o.stockChange === 0 && ' (未扣减)'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">操作时间</span>
                          <p className="font-mono text-gray-700">{o.time.slice(5, 16)}</p>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-0.5 flex-wrap">
                        {o.flow.map((s, i) => (
                          <div key={i} className="flex items-center">
                            <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${
                              s === 'used' ? 'bg-secondary text-white' :
                              s === 'expired' ? 'bg-gray-300 text-white' :
                              s === '库存释放' ? 'bg-amber-500 text-white' :
                              s === '拦截中' ? 'bg-amber-400 text-white' :
                              s === '核销中' ? 'bg-primary text-white' :
                              'bg-gray-100 text-gray-600'
                            }`}>{s}</span>
                            {i < o.flow.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-gray-300 mx-0.5" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 mt-2">
                  <FileCheck className="w-2.5 h-2.5 inline mr-0.5" />
                  以上为同套餐不同状态订单样本，完整列表见「我的订单」
                </p>
              </div>
            </>
          )
        })() : (
          <div className="space-y-3">
            <div className="p-8 text-center text-gray-400 text-sm">暂无订单记录，购买套餐后可查看核销凭证</div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-danger-50/50 to-amber-50/50 border border-danger-100/60">
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <p className="text-sm font-semibold text-gray-800">异常拦截案例·可验收反馈（购买前/核销前触发）</p>
              </div>

              <div className="grid md:grid-cols-3 gap-2 text-[11px]">
                <div className="p-3 rounded-lg bg-white border border-danger-100 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-danger-50 text-danger text-[10px] font-medium">案例A</span>
                    <span className="font-medium text-gray-700">有效期拦截</span>
                  </div>
                  <p className="text-gray-600">用户12:00核销已过期团购券</p>
                  <div className="p-2 rounded bg-gray-50 space-y-0.5 text-[10px]">
                    <p className="flex justify-between"><span className="text-gray-400">套餐类型</span><span>团购券</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">有效期至</span><span>{new Date(Date.now() - 86400000).toLocaleDateString('zh-CN')}（已过期）</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">拦截策略</span><span className="text-danger font-medium">拒绝核销·提示重新购买</span></p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-danger-100 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-danger-50 text-danger text-[10px] font-medium">案例B</span>
                    <span className="font-medium text-gray-700">库存扣减拦截</span>
                  </div>
                  <p className="text-gray-600">限量时段特惠最后1份超卖</p>
                  <div className="p-2 rounded bg-gray-50 space-y-0.5 text-[10px]">
                    <p className="flex justify-between"><span className="text-gray-400">套餐类型</span><span>时段特惠</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">剩余库存</span><span className="font-mono">0 份</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">拦截策略</span><span className="text-danger font-medium">下单即拦截·库存原子扣减</span></p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-danger-100 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-danger-50 text-danger text-[10px] font-medium">案例C</span>
                    <span className="font-medium text-gray-700">围栏外核销拦截</span>
                  </div>
                  <p className="text-gray-600">用户在闵行区扫码核销</p>
                  <div className="p-2 rounded bg-gray-50 space-y-0.5 text-[10px]">
                    <p className="flex justify-between"><span className="text-gray-400">核销坐标</span><span className="font-mono">31.11,121.38</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">所属区域</span><span className="text-amber-600">闵行区（围栏外）</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">拦截策略</span><span className="text-danger font-medium">动态码失效·提示前往松江</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded bg-white/60 border border-gray-100 text-[10px] text-gray-500 space-y-0.5">
                <p className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-secondary" /> 拦截链路：用户发起 → 有效期校验 → 库存原子扣减 → 围栏坐标校验 → 动态码生成/驳回</p>
                <p className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-secondary" /> 拦截数据全部记录至 orders 表异常日志，可在运营后台消费报告中查询拦截率/拦截原因分布</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
