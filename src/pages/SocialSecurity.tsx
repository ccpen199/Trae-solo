import { useEffect, useState, useRef } from 'react'
import { Building2, Heart, Umbrella, Shield, Baby, Download } from 'lucide-react'
import api from '@/lib/api'

type Tab = 'account' | 'fund' | 'records'

interface SocialData {
  pension: number
  medical: number
  unemployment: number
  workInjury: number
  maternity: number
  months: number
  status: 'normal' | 'paused' | 'stopped'
}

interface FundData {
  balance: number
  monthly: number
  months: number
  lastDeposit: string
}

interface PaymentRecord {
  id: string
  month: string
  type: string
  base: number
  personal: number
  company: number
  status: 'paid' | 'pending'
}

const defaultSocial: SocialData = {
  pension: 32568, medical: 18420, unemployment: 4120,
  workInjury: 2150, maternity: 3280, months: 86, status: 'normal',
}

const defaultFund: FundData = {
  balance: 125680, monthly: 2400, months: 62, lastDeposit: '2024-11-15',
}

const mockRecords: PaymentRecord[] = [
  { id: '1', month: '2024-11', type: '养老', base: 6000, personal: 480, company: 960, status: 'paid' },
  { id: '2', month: '2024-11', type: '医疗', base: 6000, personal: 120, company: 480, status: 'paid' },
  { id: '3', month: '2024-11', type: '公积金', base: 6000, personal: 720, company: 720, status: 'paid' },
  { id: '4', month: '2024-10', type: '养老', base: 6000, personal: 480, company: 960, status: 'paid' },
  { id: '5', month: '2024-10', type: '医疗', base: 6000, personal: 120, company: 480, status: 'paid' },
  { id: '6', month: '2024-10', type: '公积金', base: 6000, personal: 720, company: 720, status: 'pending' },
]

const socialCards = [
  { key: 'pension' as const, label: '养老', icon: Building2, from: '#0052D9', to: '#3B82F6' },
  { key: 'medical' as const, label: '医疗', icon: Heart, from: '#10B981', to: '#34D399' },
  { key: 'unemployment' as const, label: '失业', icon: Umbrella, from: '#F59E0B', to: '#FBBF24' },
  { key: 'workInjury' as const, label: '工伤', icon: Shield, from: '#EF4444', to: '#F87171' },
  { key: 'maternity' as const, label: '生育', icon: Baby, from: '#8B5CF6', to: '#A78BFA' },
]

type Range = '1' | '3' | '6'

export default function SocialSecurity() {
  const [tab, setTab] = useState<Tab>('account')
  const [social, setSocial] = useState<SocialData>(defaultSocial)
  const [fund, setFund] = useState<FundData>(defaultFund)
  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [range, setRange] = useState<Range>('1')
  const [displayBalance, setDisplayBalance] = useState(0)
  const targetRef = useRef(fund.balance)

  useEffect(() => {
    api.get('/social/account')
      .then((res) => {
        setSocial(res.data.social || defaultSocial)
        setFund(res.data.fund || defaultFund)
        targetRef.current = res.data.fund?.balance || defaultFund.balance
      })
      .catch(() => { targetRef.current = defaultFund.balance })
  }, [])

  useEffect(() => {
    api.get('/social/records')
      .then((res) => setRecords(res.data))
      .catch(() => setRecords(mockRecords))
  }, [range])

  useEffect(() => {
    if (tab !== 'fund') return
    setDisplayBalance(0)
    const target = targetRef.current
    const steps = 40
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayBalance(target)
        clearInterval(timer)
      } else {
        setDisplayBalance(Math.floor(current))
      }
    }, 30)
    return () => clearInterval(timer)
  }, [tab])

  const statusPercent = social.status === 'normal' ? 100 : social.status === 'paused' ? 50 : 0
  const statusText = social.status === 'normal' ? '正常缴费' : social.status === 'paused' ? '暂停缴费' : '停止缴费'

  return (
    <div className="px-4 pb-6 space-y-4 animate-fadeIn">
      <div className="flex bg-gray-100 rounded-xl p-1">
        {(['account', 'fund', 'records'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            {t === 'account' ? '社保账户' : t === 'fund' ? '公积金' : '缴费明细'}
          </button>
        ))}
      </div>

      {tab === 'account' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {socialCards.map((c) => (
              <div
                key={c.key}
                className="p-4 rounded-xl text-white relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
              >
                <c.icon className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-xs opacity-80">{c.label}保险</p>
                <p className="text-xl font-bold mt-0.5">¥{social[c.key].toLocaleString()}</p>
                <p className="text-xs opacity-70 mt-1">缴费{social.months}个月</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-white shadow-sm flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center relative flex-shrink-0"
              style={{
                background: `conic-gradient(#0052D9 ${statusPercent * 3.6}deg, #E5E7EB ${statusPercent * 3.6}deg)`,
              }}
            >
              <div className="w-18 h-18 rounded-full bg-white flex items-center justify-center" style={{ width: 72, height: 72 }}>
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{statusPercent}%</p>
                  <p className="text-[10px] text-text-muted">{statusText}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text-dark">缴费状态</p>
              <p className="text-xs text-text-muted mt-1">已连续缴费 {social.months} 个月</p>
              <p className="text-xs text-text-muted">当前状态：{statusText}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'fund' && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white text-center">
            <p className="text-sm opacity-80">公积金余额</p>
            <p className="text-4xl font-bold mt-2">¥{displayBalance.toLocaleString()}</p>
            <div className="flex justify-center gap-8 mt-4 text-sm">
              <div><p className="opacity-70">月缴存</p><p className="font-semibold">¥{fund.monthly}</p></div>
              <div><p className="opacity-70">缴存月数</p><p className="font-semibold">{fund.months}月</p></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white shadow-sm space-y-3">
            <p className="text-sm font-medium text-text-dark">缴存明细</p>
            {[
              { label: '最近缴存日期', value: fund.lastDeposit },
              { label: '月缴存额', value: `¥${fund.monthly}` },
              { label: '缴存月数', value: `${fund.months} 个月` },
              { label: '账户状态', value: '正常' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-text-muted">{item.label}</span>
                <span className="text-sm font-medium text-text-dark">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {([['1', '本月'], ['3', '近3月'], ['6', '近6月']] as [Range, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                className={`px-4 py-1.5 rounded-lg text-sm transition ${
                  range === val ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-text-muted">
                  <th className="py-2.5 px-3 text-left font-medium">月份</th>
                  <th className="py-2.5 px-3 text-left font-medium">类型</th>
                  <th className="py-2.5 px-3 text-right font-medium">基数</th>
                  <th className="py-2.5 px-3 text-right font-medium">个人</th>
                  <th className="py-2.5 px-3 text-right font-medium">单位</th>
                  <th className="py-2.5 px-3 text-center font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50">
                    <td className="py-2.5 px-3 text-text-dark">{r.month}</td>
                    <td className="py-2.5 px-3 text-text-dark">{r.type}</td>
                    <td className="py-2.5 px-3 text-right text-text-muted">¥{r.base}</td>
                    <td className="py-2.5 px-3 text-right text-text-muted">¥{r.personal}</td>
                    <td className="py-2.5 px-3 text-right text-text-muted">¥{r.company}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${r.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {r.status === 'paid' ? '已缴' : '待缴'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="w-full py-2.5 rounded-xl border border-primary text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/5 transition">
            <Download className="w-4 h-4" />
            导出PDF
          </button>
        </div>
      )}
    </div>
  )
}
