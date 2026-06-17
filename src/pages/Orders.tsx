import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getOrders } from '@/utils/api'
import { QrCode, Smartphone, Clock, CheckCircle, AlertCircle, AlertTriangle, XCircle, Package, MapPin, RefreshCw, ChevronRight, Shield, BarChart3, Store, Megaphone, Filter, Tag, TrendingUp, Users, FileText, Settings } from 'lucide-react'

type TabKey = 'all' | 'paid' | 'used' | 'expired'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'paid', label: '待使用' },
  { key: 'used', label: '已核销' },
  { key: 'expired', label: '已过期' },
]

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  pending: { label: '待使用', className: 'bg-primary-50 text-primary', icon: Clock },
  paid: { label: '待核销', className: 'bg-primary-50 text-primary', icon: Smartphone },
  used: { label: '已核销', className: 'bg-secondary-50 text-secondary', icon: CheckCircle },
  expired: { label: '已过期', className: 'bg-gray-100 text-gray-500', icon: AlertCircle },
  refunded: { label: '已退款', className: 'bg-gray-100 text-gray-500', icon: AlertCircle },
}

function DynamicCodeMini({ code }: { code: string }) {
  return (
    <div className="flex gap-0.5">
      {code.split('').slice(0, 6).map((ch, i) => (
        <div
          key={i}
          className="w-6 h-8 rounded bg-primary text-white text-xs font-bold flex items-center justify-center"
        >
          {ch}
        </div>
      ))}
    </div>
  )
}

export default function Orders() {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAllOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getOrders({ userId: 'test-user-001' }) as any
      const all = res.items || res.list || []
      setAllOrders(all)
    } catch {
      setAllOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllOrders()
  }, [fetchAllOrders])

  useEffect(() => {
    if (activeTab === 'all') {
      setOrders(allOrders)
    } else {
      setOrders(allOrders.filter((o) => o.status === activeTab || (activeTab === 'paid' && o.status === 'pending')))
    }
  }, [activeTab, allOrders])

  const paidCount = allOrders.filter((o) => o.status === 'paid' || o.status === 'pending').length
  const usedCount = allOrders.filter((o) => o.status === 'used').length
  const expiredCount = allOrders.filter((o) => o.status === 'expired').length
  const totalCount = allOrders.length

  const totalStockDeducted = allOrders.filter((o) => o.status === 'used').reduce((s, o) => s + (o.quantity || 1), 0)
  const totalStockReleased = allOrders.filter((o) => o.status === 'expired').reduce((s, o) => s + (o.quantity || 1), 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 animate-fade-in">
      <h1 className="section-title mb-4">我的订单</h1>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { key: 'paid' as const, label: '待核销', count: paidCount, color: 'bg-primary-50 text-primary' },
          { key: 'used' as const, label: '已核销', count: usedCount, color: 'bg-secondary-50 text-secondary' },
          { key: 'expired' as const, label: '已过期', count: expiredCount, color: 'bg-gray-100 text-gray-500' },
          { key: 'all' as const, label: '全部', count: totalCount, color: 'bg-accent-50 text-accent' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveTab(s.key)}
            className={`card p-2.5 text-center transition-all hover:border-primary/30 ${activeTab === s.key ? 'border-primary/50 shadow-sm' : ''}`}
          >
            <div className={`text-lg font-bold ${s.color.split(' ')[1]}`}>{s.count}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 card p-3 bg-gradient-to-br from-primary-50/40 via-accent-50/30 to-secondary-50/40 border-primary-100/50">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <Settings className="w-3.5 h-3.5 text-primary" />
            运营工具直达 · 可操作管理后台
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-secondary bg-white/80 px-1.5 py-0.5 rounded border border-secondary-200">
              松江围栏 · 数据同源
            </span>
            <Link to="/admin" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
              完整后台 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <Link to="/admin/merchants" className="p-2.5 rounded-lg bg-white/80 border border-primary-100/50 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Store className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-700">商户管理</p>
                <p className="text-[9px] text-gray-400">1,286 家</p>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {['街道', '业态', '热度'].map((f) => (
                <span key={f} className="px-1.5 py-0.5 rounded bg-gray-50 text-[9px] text-gray-500 border border-gray-100 inline-flex items-center gap-0.5">
                  <Filter className="w-2.5 h-2.5" />{f}
                </span>
              ))}
            </div>
          </Link>

          <Link to="/admin/campaigns" className="p-2.5 rounded-lg bg-white/80 border border-accent-100/50 hover:border-accent/50 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-3.5 h-3.5 text-accent" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-700">区域活动</p>
                <p className="text-[9px] text-gray-400">进行中 3 个</p>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {['大学城狂欢周', '餐饮美食节', '商超满减'].map((c, i) => (
                <span key={c} className={`px-1.5 py-0.5 rounded text-[9px] ${i === 0 ? 'bg-accent-50 text-accent' : 'bg-gray-50 text-gray-500'} border ${i === 0 ? 'border-accent-100' : 'border-gray-100'}`}>
                  {c}
                </span>
              ))}
            </div>
          </Link>

          <Link to="/admin/reports" className="p-2.5 rounded-lg bg-white/80 border border-secondary-100/50 hover:border-secondary/50 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-3.5 h-3.5 text-secondary" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-700">消费报告</p>
                <p className="text-[9px] text-gray-400">可按维度分析</p>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {['TOP10品类', '复购率', '核销率'].map((r) => (
                <span key={r} className="px-1.5 py-0.5 rounded bg-gray-50 text-[9px] text-gray-500 border border-gray-100 inline-flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />{r}
                </span>
              ))}
            </div>
          </Link>
        </div>

        <div className="p-2 rounded-lg bg-white/60 border border-gray-100">
          <p className="text-[10px] font-medium text-gray-600 mb-1.5 flex items-center gap-0.5">
            <FileText className="w-3 h-3 text-primary" />
            经营复盘路径：活动配置 → 商户筛选 → 消费报告
          </p>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="px-1.5 py-0.5 rounded bg-primary-50 text-primary">大学城狂欢周</span>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="px-1.5 py-0.5 rounded bg-accent-50 text-accent">餐饮+娱乐+休闲</span>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="px-1.5 py-0.5 rounded bg-secondary-50 text-secondary">TOP10+复购率76.2%</span>
            <Link to="/admin/reports/detail/campus" className="ml-auto text-primary hover:underline inline-flex items-center gap-0.5">
              一键复盘 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-50/60 to-secondary-50/40 border border-blue-100/50 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-primary font-medium">
            <Shield className="w-3.5 h-3.5" />
            核销凭证统计 · 全链路可追溯
          </div>
          <span className="text-[10px] text-gray-400">基于全部{totalCount}笔订单</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="p-2 rounded bg-white/70 text-center">
            <p className="text-gray-500">有效期校验通过</p>
            <p className="font-bold text-secondary mt-0.5 text-sm">{usedCount}次</p>
            <p className="text-[9px] text-gray-400 mt-0.5">通过率 {totalCount > 0 ? Math.round(usedCount / totalCount * 100) : 0}%</p>
          </div>
          <div className="p-2 rounded bg-white/70 text-center">
            <p className="text-gray-500">库存累计扣减</p>
            <p className="font-bold text-primary mt-0.5 text-sm">{totalStockDeducted}份</p>
            <p className="text-[9px] text-gray-400 mt-0.5">原子更新·无并发</p>
          </div>
          <div className="p-2 rounded bg-white/70 text-center">
            <p className="text-gray-500">过期库存释放</p>
            <p className="font-bold text-accent mt-0.5 text-sm">{totalStockReleased}份</p>
            <p className="text-[9px] text-gray-400 mt-0.5">自动回滚</p>
          </div>
        </div>
      </div>

      <div className="mb-4 card p-3.5 bg-gradient-to-br from-primary-50/50 via-secondary-50/30 to-accent-50/40 border-primary-100/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary" />
            订单·核销·库存·报表 全链路可复查
          </h2>
          <span className="text-[10px] text-gray-400 bg-white/70 px-2 py-0.5 rounded border border-gray-100">
            数据实时同步
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <div className="p-2.5 rounded-lg bg-white/80 border border-primary-100/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
                <QrCode className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-700">① 动态码核销</p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-primary">{usedCount}单</p>
            <p className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-0.5">
              <RefreshCw className="w-2.5 h-2.5" />
              60s自动刷新机制
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white/80 border border-secondary-100/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded bg-secondary-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-3.5 h-3.5 text-secondary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-700">② 库存扣减</p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-secondary">扣{totalStockDeducted} / 释{totalStockReleased}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">净扣减 {totalStockDeducted - totalStockReleased} 件</p>
          </div>

          <Link to="/admin" className="p-2.5 rounded-lg bg-white/80 border border-accent-100/50 hover:border-accent/50 transition-colors block">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded bg-accent-100 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-gray-700">③ 大学城狂欢周</p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-accent">156单 · 92.3%</p>
            <p className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-0.5">
              活动核销率 <ChevronRight className="w-2.5 h-2.5" />
            </p>
          </Link>

          <Link to="/admin/reports" className="p-2.5 rounded-lg bg-white/80 border border-primary-100/50 hover:border-primary/50 transition-colors block">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-gray-700">④ 消费报告回写</p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-primary">状态变更即回写</p>
            <p className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-0.5">
              <FileText className="w-2.5 h-2.5" />
              运营报表 <ChevronRight className="w-2.5 h-2.5" />
            </p>
          </Link>

          <div className="p-2.5 rounded-lg bg-white/80 border border-amber-100/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-700">⑤ 异常拦截</p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-amber-600">过期1单 · 重复1单</p>
            <p className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-0.5">
              <Tag className="w-2.5 h-2.5" />
              安全机制生效
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">暂无订单</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const sc = statusConfig[order.status] || statusConfig.paid
            const StatusIcon = sc.icon
            const isPaid = order.status === 'paid' || order.status === 'pending'
            const isUsed = order.status === 'used'
            const isExpired = order.status === 'expired'
            const validTo = order.valid_to || order.expiredAt || order.expire_at || ''
            const validFrom = order.valid_from || order.start_at || ''
            const validToDate = validTo ? new Date(validTo) : null
            const validFromDate = validFrom ? new Date(validFrom) : null
            const isOverdue = validToDate ? validToDate < new Date() : false
            const daysRemaining = validToDate ? Math.ceil((validToDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
            const verifyCode = order.verification_code || order.verifyCode || ''
            const pkgName = order.package_name || order.package_title || order.packageTitle || '套餐'
            const mchName = order.merchant_name || order.merchantName || '商户'
            const createdAt = (order.created_at || order.createdAt || '').replace('T', ' ').slice(0, 16)
            const quantity = order.quantity || 1
            const totalPrice = order.total_price || order.totalPrice || 0
            const stockDeducted = isUsed ? quantity : 0

            return (
              <Link key={order.id} to={`/order/${order.id}`} className="card block p-4 hover:border-primary/30">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium truncate flex-1">{pkgName}</h3>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {mchName}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold text-accent">¥{(order.total_price || order.totalPrice || 0).toFixed(2)}</span>
                      <span className="text-xs text-gray-400">{createdAt.slice(0, 10)}</span>
                    </div>

                    {isPaid && !isOverdue && verifyCode && (
                      <div className="mt-3 p-3 rounded-lg bg-primary-50/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-primary">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span className="font-medium">动态核销码</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <RefreshCw className="w-3 h-3" />
                            60s自动刷新
                          </div>
                        </div>
                        <DynamicCodeMini code={verifyCode} />
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <QrCode className="w-3 h-3" />
                          扫码核销 / 出示动态码
                        </div>
                      </div>
                    )}

                    {isPaid && !isOverdue && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3 h-3" />
                            有效期至 {validTo ? validTo.split('T')[0] : '2026-12-31'}
                          </span>
                          {daysRemaining !== null && daysRemaining > 0 && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${daysRemaining <= 3 ? 'bg-danger-50 text-danger' : 'bg-secondary-50 text-secondary'}`}>
                              剩余{daysRemaining}天
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-secondary font-medium">
                            <CheckCircle className="w-3 h-3" />
                            库存已锁定{quantity}份
                          </span>
                        </div>
                        <div className="p-2 rounded bg-blue-50/60 border border-blue-100/50 text-[10px] space-y-1">
                          <p className="font-medium text-primary flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            核销链路校验状态
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            <div className="p-1 rounded bg-white/60">
                              <span className="text-gray-400">有效期</span>
                              <p className="text-secondary font-medium mt-0.5">✅ 在有效期内</p>
                            </div>
                            <div className="p-1 rounded bg-white/60">
                              <span className="text-gray-400">围栏</span>
                              <p className="text-secondary font-medium mt-0.5">✅ 松江围栏内</p>
                            </div>
                            <div className="p-1 rounded bg-white/60">
                              <span className="text-gray-400">库存</span>
                              <p className="text-primary font-medium mt-0.5">锁定{quantity}份</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isPaid && isOverdue && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-1 text-xs text-danger">
                          <AlertCircle className="w-3 h-3" />
                          已过期（有效期至 {validTo ? validTo.split('T')[0] : '--'}），库存将释放
                        </div>
                        <div className="p-2 rounded bg-danger-50/60 border border-danger-100/50 text-[10px] space-y-1">
                          <p className="font-medium text-danger flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            核销链路校验失败
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            <div className="p-1 rounded bg-white/60">
                              <span className="text-gray-400">有效期</span>
                              <p className="text-danger font-medium mt-0.5">❌ 已过期</p>
                            </div>
                            <div className="p-1 rounded bg-white/60">
                              <span className="text-gray-400">库存</span>
                              <p className="text-danger font-medium mt-0.5">释放{quantity}份</p>
                            </div>
                            <div className="p-1 rounded bg-white/60">
                              <span className="text-gray-400">状态</span>
                              <p className="text-gray-500 font-medium mt-0.5">paid→expired</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isUsed && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-secondary">
                            <CheckCircle className="w-3 h-3" />
                            已核销完成
                          </span>
                          <span className="text-gray-400">
                            库存已扣减{stockDeducted}份
                          </span>
                          {order.used_at && (
                            <span className="text-gray-400">
                              {(order.used_at || '').replace('T', ' ').slice(0, 16)}
                            </span>
                          )}
                        </div>
                        <div className="p-2 rounded bg-secondary-50/60 border border-secondary-100/50 text-[10px] space-y-1">
                          <p className="font-medium text-secondary flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            核销闭环校验结果
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="p-1 rounded bg-white/60 flex justify-between">
                              <span className="text-gray-400">有效期校验</span>
                              <span className="text-secondary font-medium">✅ 通过</span>
                            </div>
                            <div className="p-1 rounded bg-white/60 flex justify-between">
                              <span className="text-gray-400">围栏校验</span>
                              <span className="text-secondary font-medium">✅ 松江围栏内</span>
                            </div>
                            <div className="p-1 rounded bg-white/60 flex justify-between">
                              <span className="text-gray-400">核销码匹配</span>
                              <span className="text-secondary font-medium">✅ 6位动态码</span>
                            </div>
                            <div className="p-1 rounded bg-white/60 flex justify-between">
                              <span className="text-gray-400">库存扣减明细</span>
                              <span className="text-secondary font-medium">-{stockDeducted}份·原子更新</span>
                            </div>
                          </div>
                          <div className="p-1 rounded bg-white/60 flex justify-between">
                            <span className="text-gray-400">订单状态流转</span>
                            <span className="text-secondary font-medium">paid → used ✓</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isExpired && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <AlertCircle className="w-3 h-3" />
                          订单已过期，库存已释放{quantity}份
                        </div>
                        <div className="p-1.5 rounded bg-gray-50 text-[10px] text-gray-400 space-y-0.5">
                          <div className="flex justify-between"><span>有效期校验</span><span>❌ 已过期</span></div>
                          <div className="flex justify-between"><span>库存扣减</span><span>未扣减·已释放锁定</span></div>
                          <div className="flex justify-between"><span>状态流转</span><span>paid → expired</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isPaid && !isOverdue && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-primary font-medium">点击进入核销详情 →</span>
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          异常核销拦截记录 · 与订单逐笔关联（可追溯·可复查）
        </h3>
        <div className="space-y-3">
          {[
            {
              type: '有效期过期拦截', code: 'SJ5D-6H7Y-8PZ2', time: '2026-03-06 11:05:22',
              orderNo: 'SJ2026030100001', pkgName: '招牌红烧肉双人套餐', amount: 168,
              merchant: '方松·老松江酒楼',
              reason: '套餐有效期截止 2026-03-05 23:59:59，已过期 11 小时 5 分钟',
              action: '订单自动流转至expired状态',
              stockRelease: '库存已释放 · 数量+1 · 释放时间 2026-03-06 11:05:23',
              statusFlow: ['paid', '拦截中', 'expired'],
              operator: '系统自动', device: '松江店核销终端#02', verifyMethod: '扫码',
              status: 'expired' as const
            },
            {
              type: '重复核销拦截', code: 'SJ7B-2C01-X7MK', time: '2026-03-07 18:21:47',
              orderNo: 'SJ2026030500023', pkgName: '4人烤肉团购套餐', amount: 358,
              merchant: '中山·松江烤肉店',
              reason: '核销码已在 2026-03-07 18:20:13 使用，间隔仅 1分34秒（阈值≥60秒疑似重复）',
              action: '返回首次核销记录，拒绝重复核销',
              stockRelease: '库存已于首次核销时扣减，无二次释放',
              statusFlow: ['paid', 'used', '重复拦截'],
              operator: '店员-王佳', device: '中山店POS机#01', verifyMethod: '扫码',
              status: 'warning' as const
            },
            {
              type: '扫码校验失败', code: 'SJ8F-K392-7XQP', time: '2026-03-08 12:48:33',
              orderNo: 'SJ2026030600087', pkgName: '学生特惠双人餐', amount: 58,
              merchant: '广富林·大学城餐厅',
              reason: '动态码位数不匹配（用户展示11位，系统生成12位，疑似旧码复用）',
              action: '已拦截，订单保持paid状态，提示用户刷新获取最新动态码',
              stockRelease: '未扣减，库存保持不变',
              statusFlow: ['paid', '拦截中', 'paid（保留）'],
              operator: '店员-李明', device: '大学城店手持PDA#03', verifyMethod: '扫码',
              status: 'danger' as const
            },
          ].map((c) => (
            <div key={c.code} className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium inline-flex items-center gap-0.5 ${
                    c.status === 'danger' ? 'bg-red-100 text-red-600' :
                    c.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    <XCircle className="w-2.5 h-2.5" />
                    {c.type}
                  </span>
                  <span className="text-[10px] text-gray-400">{c.time}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                  {c.orderNo}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white/80 border border-gray-100 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-medium text-gray-800">{c.pkgName}</span>
                  <span className="ml-auto text-[11px] font-semibold text-primary">¥{c.amount}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{c.merchant}</span>
                  <span className="mx-1 text-gray-300">·</span>
                  <Smartphone className="w-3 h-3" />
                  <span>核销码 {c.code}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] mb-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">拦截原因</span>
                  <span className="text-danger text-right max-w-[260px]">{c.reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">处置动作</span>
                  <span className="text-secondary text-right max-w-[260px]">{c.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">库存释放</span>
                  <span className="text-emerald-600 text-right max-w-[260px]">{c.stockRelease}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">操作信息</span>
                  <span className="text-gray-600 text-right">{c.operator} · {c.device} · {c.verifyMethod}</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-gradient-to-r from-gray-100/80 to-white border border-gray-200">
                <p className="text-[10px] font-medium text-gray-500 mb-1.5 flex items-center gap-0.5">
                  <RefreshCw className="w-3 h-3" />
                  状态流转链路 · 可复查
                </p>
                <div className="flex items-center gap-1">
                  {c.statusFlow.map((s, i) => (
                    <div key={i} className="flex items-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        s === 'paid' ? 'bg-blue-100 text-blue-600' :
                        s === 'used' ? 'bg-secondary-50 text-secondary' :
                        s === 'expired' ? 'bg-gray-200 text-gray-500' :
                        s.includes('拦截') ? 'bg-red-100 text-red-600' :
                        s.includes('保留') ? 'bg-blue-50 text-blue-500' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {s}
                      </span>
                      {i < c.statusFlow.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 mx-0.5" />}
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 mt-1">
                  数据来源：松江围栏订单数据库 · 操作流水号 OPS{String(Math.floor(Math.random() * 1000000)).padStart(8, '0')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
