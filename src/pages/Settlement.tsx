import { useState, useEffect, useMemo } from 'react'
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  Loader2,
  TrendingUp,
  Banknote,
  Lock,
  PieChart,
  Truck,
  Fuel,
  ShieldCheck,
  Building2,
  ChevronRight,
  X,
  Check,
  History,
  RefreshCw,
  CreditCard,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { requestRaw } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'

interface Summary {
  availableBalance: number
  frozenAmount: number
  totalIncome: number
  totalWithdraw?: number
}

interface SettlementItem {
  id: string
  order_id: string
  payer_id: string
  payee_id: string
  total_amount: number
  freight_amount: number
  fuel_amount: number
  insurance_amount: number
  platform_fee: number
  status: string
  created_at: string
  settled_at?: string
  waybill_no?: string
  origin?: string
  destination?: string
  payer_name?: string
  payee_name?: string
}

interface Withdrawal {
  id: string
  driver_id: string
  amount: number
  bank_card_no: string
  bank_name?: string
  status: string
  created_at: string
  applied_at?: string
}

type TabKey = 'settlements' | 'withdrawals'

const settlementStatusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  pending: { variant: 'warning', label: '待结算' },
  completed: { variant: 'success', label: '已结算' },
  failed: { variant: 'error', label: '结算失败' },
}

const withdrawalStatusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  pending: { variant: 'warning', label: '处理中' },
  completed: { variant: 'success', label: '已完成' },
  failed: { variant: 'error', label: '提现失败' },
}

const SUBJECT_COLORS = {
  freight: '#0F2B46',
  fuel: '#F59E0B',
  insurance: '#10B981',
  platform: '#EF4444',
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function PieChartVisual({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="rounded-full border-8 border-gray-100" style={{ width: size, height: size }} />
      </div>
    )
  }

  let cumulativeAngle = -90
  const radius = size / 2
  const center = radius

  const paths = data.map((d, i) => {
    const angle = (d.value / total) * 360
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + angle
    cumulativeAngle = endAngle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    return <path key={i} d={pathData} fill={d.color} />
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <circle cx={center} cy={center} r={radius * 0.55} fill="white" />
      <text
        x={center}
        y={center - 6}
        textAnchor="middle"
        className="fill-gray-500"
        style={{ fontSize: 11 }}
      >
        合计
      </text>
      <text
        x={center}
        y={center + 14}
        textAnchor="middle"
        className="fill-navy-500 font-bold"
        style={{ fontSize: 16 }}
      >
        ¥{total.toFixed(2)}
      </text>
    </svg>
  )
}

function SubjectBreakdown({ item }: { item: SettlementItem }) {
  const subjects = [
    { key: 'freight', label: '运费', icon: Truck, value: item.freight_amount, color: SUBJECT_COLORS.freight },
    { key: 'fuel', label: '油费', icon: Fuel, value: item.fuel_amount, color: SUBJECT_COLORS.fuel },
    { key: 'insurance', label: '保险', icon: ShieldCheck, value: item.insurance_amount, color: SUBJECT_COLORS.insurance },
    { key: 'platform', label: '平台费', icon: Building2, value: item.platform_fee, color: SUBJECT_COLORS.platform },
  ]

  const pieData = subjects.map((s) => ({ label: s.label, value: s.value, color: s.color }))

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="h-4 w-4 text-navy-400" />
        <span className="text-sm font-medium text-gray-700">T+0 分账明细</span>
      </div>
      <div className="flex gap-6 items-start">
        <PieChartVisual data={pieData} size={120} />
        <div className="flex-1 space-y-2">
          {subjects.map((s) => {
            const pct = item.total_amount > 0 ? ((s.value / item.total_amount) * 100).toFixed(1) : '0'
            return (
              <div key={s.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
                  <s.icon className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{pct}%</span>
                  <span className="text-xs font-semibold text-gray-800">¥{s.value?.toFixed(2)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Settlement() {
  const { user, profile } = useAuthStore()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [settlements, setSettlements] = useState<SettlementItem[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('settlements')
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedCard, setSelectedCard] = useState('')
  const [settlingId, setSettlingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isDriver = user?.role === 'driver'
  const isShipper = user?.role === 'shipper' || user?.role === 'admin'

  const bankCards = useMemo(() => {
    if (profile?.bank_card_no) {
      return [
        {
          no: profile.bank_card_no,
          name: profile.bank_name || '默认银行卡',
        },
      ]
    }
    return []
  }, [profile])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()

      const reqs: Promise<any>[] = [
        requestRaw<{ success: boolean; data: Summary }>('/api/settlements/summary', { method: 'GET', headers }),
        requestRaw<{ success: boolean; list: SettlementItem[] }>('/api/settlements?pageSize=100', { method: 'GET', headers }),
      ]

      if (isDriver) {
        reqs.push(
          requestRaw<{ success: boolean; list: Withdrawal[] }>('/api/settlements/withdrawals?pageSize=100', {
            method: 'GET',
            headers,
          })
        )
      }

      const [summaryRes, settlementsRes, withdrawalsRes] = await Promise.all(reqs)

      setSummary(summaryRes.data || null)
      setSettlements(settlementsRes.list || [])
      if (withdrawalsRes) setWithdrawals(withdrawalsRes.list || [])
      if (bankCards.length > 0 && !selectedCard) setSelectedCard(bankCards[0].no)
    } catch (err) {
      console.error('Load data failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount)
    if (!amount || amount <= 0) {
      alert('请输入有效金额')
      return
    }
    if (summary && amount > summary.availableBalance) {
      alert('提现金额不能超过可用余额')
      return
    }
    if (!selectedCard) {
      alert('请选择提现银行卡')
      return
    }
    setWithdrawing(true)
    try {
      const headers = getAuthHeaders()
      await requestRaw<{ success: boolean }>('/api/settlements/withdraw', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount, bank_card_no: selectedCard }),
      })
      setShowWithdraw(false)
      setWithdrawAmount('')
      await loadData()
    } catch (err: any) {
      alert(err.message || '提现失败')
    } finally {
      setWithdrawing(false)
    }
  }

  const handleSettle = async (orderId: string) => {
    setSettlingId(orderId)
    try {
      const headers = getAuthHeaders()
      await requestRaw<{ success: boolean }>(`/api/settlements/${orderId}/settle`, {
        method: 'POST',
        headers,
      })
      await loadData()
    } catch (err: any) {
      alert(err.message || '结算失败')
    } finally {
      setSettlingId(null)
    }
  }

  const aggregateSubjects = useMemo(() => {
    const completed = settlements.filter((s) => s.status === 'completed')
    return {
      freight: completed.reduce((sum, s) => sum + (s.freight_amount || 0), 0),
      fuel: completed.reduce((sum, s) => sum + (s.fuel_amount || 0), 0),
      insurance: completed.reduce((sum, s) => sum + (s.insurance_amount || 0), 0),
      platform: completed.reduce((sum, s) => sum + (s.platform_fee || 0), 0),
    }
  }, [settlements])

  const stats = [
    { icon: Banknote, value: summary?.availableBalance || 0, label: '可用余额', variant: 'mint' as const, prefix: '¥' },
    { icon: Lock, value: summary?.frozenAmount || 0, label: '冻结金额', variant: 'coral' as const, prefix: '¥' },
    { icon: TrendingUp, value: summary?.totalIncome || 0, label: '累计收入', variant: 'navy' as const, prefix: '¥' },
    { icon: ArrowDownToLine, value: summary?.totalWithdraw || 0, label: '已提现', variant: 'amber' as const, prefix: '¥' },
  ]

  const totalPieData = [
    { label: '运费', value: aggregateSubjects.freight, color: SUBJECT_COLORS.freight },
    { label: '油费', value: aggregateSubjects.fuel, color: SUBJECT_COLORS.fuel },
    { label: '保险', value: aggregateSubjects.insurance, color: SUBJECT_COLORS.insurance },
    { label: '平台费', value: aggregateSubjects.platform, color: SUBJECT_COLORS.platform },
  ]

  const maskCardNo = (no: string) => {
    if (no.length <= 8) return no
    return no.substring(0, 4) + ' **** **** ' + no.substring(no.length - 4)
  }

  return (
    <div>
      <PageHeader
        title="结算中心"
        action={
          isDriver
            ? { label: '申请提现', icon: ArrowDownToLine, onClick: () => setShowWithdraw(true) }
            : { label: '刷新', icon: RefreshCw, onClick: loadData }
        }
      />

      {showWithdraw && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-amber-500" />
              申请提现
            </h2>
            <button
              onClick={() => setShowWithdraw(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-navy-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-400">可提现金额</span>
                <span className="text-2xl font-bold text-navy-500">
                  ¥{summary?.availableBalance?.toFixed(2) || '0.00'}
                </span>
              </div>
              <button
                onClick={() => setWithdrawAmount(String(summary?.availableBalance || 0))}
                className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                全部提现
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">提现金额</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">¥</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-lg font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">到账银行卡</label>
              {bankCards.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                  <p className="text-sm text-gray-500">暂未绑定银行卡，请先去认证页面绑定</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bankCards.map((card) => (
                    <label
                      key={card.no}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedCard === card.no
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bankCard"
                        checked={selectedCard === card.no}
                        onChange={() => setSelectedCard(card.no)}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedCard === card.no ? 'bg-amber-500' : 'bg-gray-100'
                        }`}
                      >
                        <CreditCard
                          className={`h-5 w-5 ${selectedCard === card.no ? 'text-white' : 'text-gray-500'}`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{card.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{maskCardNo(card.no)}</p>
                      </div>
                      {selectedCard === card.no && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowWithdraw(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount || !selectedCard}
                className="flex-1 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
                确认提现
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
                variant={stat.variant}
                prefix={stat.prefix}
              />
            ))}
          </div>

          {settlements.filter((s) => s.status === 'completed').length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-navy-500" />
                <h3 className="text-base font-semibold text-gray-900">收入科目占比</h3>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <PieChartVisual data={totalPieData} size={180} />
                <div className="flex-1 w-full space-y-3">
                  {totalPieData.map((d) => {
                    const total = totalPieData.reduce((s, x) => s + x.value, 0)
                    const pct = total > 0 ? (d.value / total) * 100 : 0
                    return (
                      <div key={d.label} className="w-full">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                            <span className="text-sm text-gray-700">{d.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                            <span className="text-sm font-semibold text-gray-800">¥{d.value.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: d.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('settlements')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'settlements' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Wallet className="h-4 w-4" />
              分账流水
            </button>
            {isDriver && (
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'withdrawals'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <History className="h-4 w-4" />
                提现记录
              </button>
            )}
          </div>

          {activeTab === 'settlements' && (
            settlements.length === 0 ? (
              <EmptyState icon={Wallet} message="暂无分账流水" />
            ) : (
              <div className="space-y-3">
                {settlements.map((item) => {
                  const s = settlementStatusMap[item.status]
                  const isExpanded = expandedId === item.id
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {item.waybill_no && (
                              <span className="text-xs font-mono text-navy-500 bg-navy-50 px-2 py-0.5 rounded">
                                {item.waybill_no}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-gray-900">
                              {item.origin || '—'} → {item.destination || '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {s && <StatusBadge variant={s.variant}>{s.label}</StatusBadge>}
                            {isShipper && item.status === 'pending' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSettle(item.order_id)
                                }}
                                disabled={settlingId === item.order_id}
                                className="px-3 py-1.5 text-xs font-medium bg-navy-500 text-white rounded-lg hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                              >
                                {settlingId === item.order_id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                确认结算
                              </button>
                            )}
                            <ChevronRight
                              className={`h-4 w-4 text-gray-400 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500 space-x-3">
                            {!isDriver && item.payee_name && (
                              <span>收款方：{item.payee_name}</span>
                            )}
                            {isDriver && item.payer_name && (
                              <span>付款方：{item.payer_name}</span>
                            )}
                          </div>
                          <span className="text-base font-bold text-amber-600">
                            ¥{item.total_amount?.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {(item.settled_at || item.created_at)?.substring(0, 16)}
                        </p>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <SubjectBreakdown item={item} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}

          {activeTab === 'withdrawals' && isDriver && (
            withdrawals.length === 0 ? (
              <EmptyState icon={ArrowDownToLine} message="暂无提现记录" />
            ) : (
              <div className="space-y-3">
                {withdrawals.map((item) => {
                  const s = withdrawalStatusMap[item.status]
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                            <ArrowDownToLine className="h-4 w-4 text-amber-500" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">提现申请</span>
                        </div>
                        {s && <StatusBadge variant={s.variant}>{s.label}</StatusBadge>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {profile?.bank_name || '银行卡'} ({maskCardNo(item.bank_card_no)})
                          </div>
                        </div>
                        <span className="text-base font-bold text-amber-600">¥{item.amount?.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {(item.applied_at || item.created_at)?.substring(0, 16)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
