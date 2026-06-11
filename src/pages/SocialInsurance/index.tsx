import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Shield, Lock } from 'lucide-react'
import { mockSocialInsurance } from '@/mock/data'
import { INSURANCE_LABELS, INSURANCE_COLORS } from '@/types'
import type { InsuranceType, SocialInsuranceRecord } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { useAuditLog } from '@/hooks/useAuditLog'
import DualFactorModal from '@/components/auth/DualFactorModal'

const statusMap: Record<SocialInsuranceRecord['status'], { label: string; cls: string }> = {
  active: { label: '参保中', cls: 'bg-green-100 text-green-700' },
  suspended: { label: '暂停', cls: 'bg-yellow-100 text-yellow-700' },
  closed: { label: '终止', cls: 'bg-red-100 text-red-700' },
}

const insuranceTypes: InsuranceType[] = ['pension', 'medical', 'unemployment', 'workInjury', 'maternity']

const roleAccessMap: Record<string, InsuranceType[]> = {
  insured: ['pension', 'medical', 'unemployment', 'workInjury', 'maternity'],
  employed: ['pension', 'medical', 'unemployment', 'workInjury', 'maternity'],
  retired: ['pension', 'medical'],
  agent: [],
}

export default function SocialInsurance() {
  const { currentRole, user } = useAppStore()
  const { logAction } = useAuditLog()
  const [selected, setSelected] = useState<InsuranceType | null>(null)
  const [verified, setVerified] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [pendingType, setPendingType] = useState<InsuranceType | null>(null)

  const accessibleTypes = roleAccessMap[currentRole] ?? []
  const isAgent = currentRole === 'agent'

  const handleSelectType = (type: InsuranceType) => {
    if (isAgent) return
    if (!accessibleTypes.includes(type)) return
    if (selected === type && verified) return
    setPendingType(type)
    setAuthOpen(true)
  }

  const handleAuthSuccess = () => {
    setAuthOpen(false)
    if (pendingType) {
      setSelected(pendingType)
      setVerified(true)
      logAction(`查询${INSURANCE_LABELS[pendingType]}缴费明细`, 'query', '个人社保账户')
    }
    setPendingType(null)
  }

  const handleAuthClose = () => {
    setAuthOpen(false)
    setPendingType(null)
  }

  const selectedRecord = selected ? mockSocialInsurance.find((r) => r.type === selected) : null

  const totalPersonal = mockSocialInsurance.reduce((s, r) => s + r.personalAmount * r.months, 0)
  const totalCompany = mockSocialInsurance.reduce((s, r) => s + r.companyAmount * r.months, 0)
  const totalMonths = Math.max(...mockSocialInsurance.map((r) => r.months))

  const chartData = selectedRecord?.monthlyDetails.map((d) => ({
    month: d.month.slice(5),
    个人缴纳: d.personalPay,
    单位缴纳: d.companyPay,
  })) ?? []

  if (isAgent) {
    return (
      <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
        <h1 className="gov-section-title text-2xl">社保查询</h1>
        <div className="mt-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-gov-blue-dark">仅限参保人本人查询</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            个人社保数据受实名认证和本人权限保护，基层经办人员不可直接查看个人明细，仅可通过数据看板查看汇总统计。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-primary p-6 space-y-6 animate-fade-in-up">
      <h1 className="gov-section-title text-2xl">社保查询</h1>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-gov-blue/5 border border-gov-blue/10">
        <Shield className="w-4 h-4 text-gov-blue shrink-0" />
        <p className="text-xs text-gov-blue/80">
          个人社保数据受本人权限保护，查看缴费明细前需完成双因子身份认证。当前角色：{user?.name}（{INSURANCE_LABELS[accessibleTypes[0]] && accessibleTypes.length > 0 ? '可查询' + accessibleTypes.map(t => INSURANCE_LABELS[t]).join('、') : '无可查询险种'}）
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
        {mockSocialInsurance.map((rec) => {
          const st = statusMap[rec.status]
          const accessible = accessibleTypes.includes(rec.type)
          const isActive = selected === rec.type && verified
          return (
            <div
              key={rec.type}
              onClick={() => accessible && handleSelectType(rec.type)}
              className={`gov-card p-4 border-l-4 transition-all ${
                accessible ? 'hover:shadow-card-hover cursor-pointer' : 'opacity-50 cursor-not-allowed'
              } ${isActive ? 'ring-2 ring-gov-gold/40' : ''}`}
              style={{ borderLeftColor: INSURANCE_COLORS[rec.type] }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{INSURANCE_LABELS[rec.type]}</span>
                <span className={`gov-badge ${st.cls}`}>{st.label}</span>
              </div>
              <p className="text-xs text-gray-500">累计 <span className="text-gov-blue font-bold">{rec.months}</span> 个月</p>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-gray-500">个人 <span className="text-gov-blue font-semibold">¥{rec.personalAmount}</span></span>
                <span className="text-gray-500">单位 <span className="text-gov-gold-dark font-semibold">¥{rec.companyAmount}</span></span>
              </div>
              {!accessible && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                  <Lock className="w-3 h-3" />
                  <span>当前角色无权查看</span>
                </div>
              )}
              {accessible && !isActive && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gov-blue/50">
                  <Lock className="w-3 h-3" />
                  <span>点击认证后查看</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected && verified && selectedRecord && (
        <>
          <div className="gov-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-1 overflow-x-auto">
                {accessibleTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSelectType(t)}
                    className={`px-4 py-2 rounded-t-md text-sm font-medium whitespace-nowrap transition-colors ${
                      selected === t
                        ? 'bg-gov-blue text-white shadow-sm'
                        : 'text-gray-500 hover:text-gov-blue hover:bg-gov-blue/5'
                    }`}
                  >
                    {INSURANCE_LABELS[t]}
                  </button>
                ))}
              </div>
              <span className="gov-badge bg-green-100 text-green-700 shrink-0">已认证</span>
            </div>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradPersonal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={INSURANCE_COLORS[selected]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={INSURANCE_COLORS[selected]} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="个人缴纳" stroke={INSURANCE_COLORS[selected]} fill="url(#gradPersonal)" strokeWidth={2} />
                  <Area type="monotone" dataKey="单位缴纳" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.08} strokeWidth={2} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="gov-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gov-blue/5 text-gov-blue">
                  <th className="text-left px-4 py-3 font-semibold">月份</th>
                  <th className="text-right px-4 py-3 font-semibold">缴费基数</th>
                  <th className="text-right px-4 py-3 font-semibold">个人缴纳</th>
                  <th className="text-right px-4 py-3 font-semibold">单位缴纳</th>
                </tr>
              </thead>
              <tbody>
                {selectedRecord.monthlyDetails.map((d, i) => (
                  <tr
                    key={d.month}
                    className={`border-t border-gray-50 hover:bg-gov-gold/5 transition-colors ${
                      i % 2 === 1 ? 'bg-surface-secondary/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-gray-700">{d.month}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">¥{d.base.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gov-blue font-medium">¥{d.personalPay.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gov-gold-dark font-medium">¥{d.companyPay.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="gov-card p-4 flex items-center justify-around text-sm">
            <div className="text-center">
              <p className="text-gray-500">个人缴费总计</p>
              <p className="text-lg font-bold text-gov-blue">¥{totalPersonal.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-gray-500">单位缴费总计</p>
              <p className="text-lg font-bold text-gov-gold-dark">¥{totalCompany.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-gray-500">累计缴费月数</p>
              <p className="text-lg font-bold text-gov-blue-dark">{totalMonths} 个月</p>
            </div>
          </div>
        </>
      )}

      <DualFactorModal
        open={authOpen}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
        title="社保数据查询验证"
      />
    </div>
  )
}
