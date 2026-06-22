import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Shuffle,
  UserPlus,
  ClipboardList,
  Play,
  CheckCircle2,
  Hash,
  Lock,
  ListOrdered,
  Users,
  Clock,
  Trophy,
  Search,
} from 'lucide-react'
import type { LotteryParticipant, LotteryResult, LotteryResultEntry } from '@/types'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'

type TabKey = 'register' | 'simulate' | 'results'

const DEMO_PARTICIPANTS: LotteryParticipant[] = Array.from({ length: 20 }, (_, i) => ({
  id: `demo-${i + 1}`,
  building_id: 'demo',
  name: `报名者${i + 1}号`,
  phone: `138${String(i + 1).padStart(8, '0')}`,
}))

const DEMO_SEED = 'a3f7c2e1b9d4f6a8c0e5d2b7f1a3c9e4'
const DEMO_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

export default function Lottery() {
  const { buildingId } = useParams<{ buildingId: string }>()
  const isDemo = buildingId === 'demo'

  const [activeTab, setActiveTab] = useState<TabKey>('register')
  const [participants, setParticipants] = useState<LotteryParticipant[]>([])
  const [result, setResult] = useState<LotteryResult | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [registered, setRegistered] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [seedValue, setSeedValue] = useState('')
  const [hashPreview, setHashPreview] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [ballOrder, setBallOrder] = useState<number[]>([])
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (isDemo) {
      setParticipants(DEMO_PARTICIPANTS)
      setBallOrder(Array.from({ length: 20 }, (_, i) => i + 1))
    }
  }, [isDemo])

  useEffect(() => {
    if (!isDemo && buildingId) {
      api.getLotteryResult(buildingId).then((res) => {
        if (res.success && res.data) {
          setResult(res.data as LotteryResult)
          setParticipants((res.data as LotteryResult).participants || [])
        }
      }).catch(() => {})
    }
  }, [buildingId, isDemo])

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim()) return
    if (isDemo) {
      setParticipants((prev) => [
        ...prev,
        { id: `demo-new-${Date.now()}`, building_id: 'demo', name: name.trim(), phone: phone.trim() },
      ])
      setRegistered(true)
      setName('')
      setPhone('')
      setTimeout(() => setRegistered(false), 3000)
      return
    }
    try {
      const res = await api.registerLottery(buildingId!, { name: name.trim(), phone: phone.trim() })
      if (res.success) {
        setRegistered(true)
        setName('')
        setPhone('')
        setTimeout(() => setRegistered(false), 3000)
      }
    } catch {}
  }

  const handleRunLottery = async () => {
    setIsRunning(true)
    setCurrentStep(0)
    setSettled(false)
    setSeedValue('')
    setHashPreview('')

    const shuffled = [...ballOrder].sort(() => Math.random() - 0.5)
    setBallOrder(shuffled)

    await new Promise((r) => setTimeout(r, 500))
    setCurrentStep(1)
    const seed = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    setSeedValue(seed)

    await new Promise((r) => setTimeout(r, 800))
    setCurrentStep(2)
    const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    setHashPreview(hash)

    await new Promise((r) => setTimeout(r, 800))
    setCurrentStep(3)

    if (!isDemo && buildingId) {
      try {
        const res = await api.runLottery(buildingId)
        if (res.success && res.data) {
          setResult(res.data as LotteryResult)
        }
      } catch {}
    } else {
      const demoResults: LotteryResultEntry[] = participants.map((p, i) => ({
        rank: i + 1,
        participant: p,
        hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      }))
      setResult({
        building_id: 'demo',
        participants,
        results: demoResults,
        seed,
        timestamp: new Date().toISOString(),
      })
    }

    const finalOrder = Array.from({ length: participants.length }, (_, i) => i + 1).sort(
      () => Math.random() - 0.5
    )
    setBallOrder(finalOrder)

    await new Promise((r) => setTimeout(r, 600))
    setSettled(true)
    setIsRunning(false)
  }

  const filteredResults = result?.results.filter(
    (r) =>
      r.participant.name.includes(searchQuery) ||
      r.participant.phone.includes(searchQuery)
  ) || []

  const tabs: { key: TabKey; label: string; icon: typeof UserPlus }[] = [
    { key: 'register', label: '摇号报名', icon: UserPlus },
    { key: 'simulate', label: '摇号模拟', icon: Shuffle },
    { key: 'results', label: '结果公示', icon: ClipboardList },
  ]

  const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

  const rankBg = (rank: number) => {
    if (rank === 1) return 'bg-gold text-white'
    if (rank === 2) return 'bg-gold-100 text-gold-dark'
    if (rank === 3) return 'bg-gold-50 text-gold-dark'
    return 'bg-brand-50 text-brand'
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {isDemo && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold-50 px-4 py-1.5 text-sm font-medium text-gold-dark border border-gold-200">
            <Shuffle size={14} />
            演示模式
          </div>
        )}

        <h1 className="section-title mb-6 flex items-center gap-3">
          <Shuffle className="text-brand" size={28} />
          摇号选房
        </h1>

        <div className="flex gap-2 mb-8 border-b border-brand-100 pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                  activeTab === tab.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-charcoal/50 hover:text-charcoal/80'
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-6 mb-6 text-sm text-charcoal/60">
          <span className="flex items-center gap-1.5">
            <Users size={14} />
            参与人数: {participants.length}
          </span>
          {result?.timestamp && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              结果时间: {new Date(result.timestamp).toLocaleString('zh-CN')}
            </span>
          )}
        </div>

        {activeTab === 'register' && (
          <div className="card p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-charcoal mb-4">摇号报名</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="input-field"
                />
              </div>
              <button
                onClick={handleRegister}
                disabled={!name.trim() || !phone.trim()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                提交报名
              </button>
            </div>
            {registered && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 animate-fade-in">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">报名成功！您的摇号资格已确认</span>
                <span className="badge-info ml-2">已确认</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'simulate' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-4">摇号模拟</h2>
              <div className="flex flex-wrap gap-3 justify-center p-6 bg-brand-50/50 rounded-xl min-h-[160px]">
                {ballOrder.map((num, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500',
                      settled
                        ? 'bg-brand text-white shadow-md'
                        : isRunning
                        ? 'bg-gold text-white animate-ball-shuffle'
                        : 'bg-brand-100 text-brand'
                    )}
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleRunLottery}
                  disabled={isRunning || participants.length === 0}
                  className={cn(
                    'flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-all duration-200',
                    isRunning
                      ? 'bg-charcoal/30 cursor-not-allowed'
                      : 'btn-gold animate-pulse-gold'
                  )}
                >
                  <Play size={18} />
                  {isRunning ? '摇号进行中...' : '开始摇号'}
                </button>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-base font-semibold text-charcoal mb-4">算法演示</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    step: 1,
                    icon: Hash,
                    label: '生成随机种子',
                    value: currentStep >= 1 ? seedValue : '等待中...',
                    active: currentStep === 1,
                  },
                  {
                    step: 2,
                    icon: Lock,
                    label: 'SHA256哈希运算',
                    value: currentStep >= 2 ? `${hashPreview.slice(0, 16)}...` : '等待中...',
                    active: currentStep === 2,
                  },
                  {
                    step: 3,
                    icon: ListOrdered,
                    label: '生成选房顺序',
                    value: currentStep >= 3 ? '已完成排序' : '等待中...',
                    active: currentStep === 3,
                  },
                ].map((s) => {
                  const Icon = s.icon
                  return (
                    <div
                      key={s.step}
                      className={cn(
                        'rounded-xl p-4 border-2 transition-all duration-300',
                        s.active
                          ? 'border-gold bg-gold-50 shadow-md'
                          : currentStep > s.step
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-brand-100 bg-white'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                            s.active
                              ? 'bg-gold text-white'
                              : currentStep > s.step
                              ? 'bg-emerald-500 text-white'
                              : 'bg-brand-100 text-brand/50'
                          )}
                        >
                          {currentStep > s.step ? '✓' : s.step}
                        </div>
                        <span className="text-sm font-medium text-charcoal">{s.label}</span>
                      </div>
                      <div className="font-mono text-xs text-charcoal/60 break-all">{s.value}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                <Trophy size={18} className="text-gold" />
                结果公示
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索姓名/手机号"
                  className="input-field pl-9 w-56 text-sm"
                />
              </div>
            </div>
            {!result ? (
              <div className="text-center py-12 text-charcoal/40">
                <Shuffle size={40} className="mx-auto mb-3 opacity-30" />
                <p>暂无摇号结果，请先进行摇号模拟</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-100 text-charcoal/60">
                      <th className="text-left py-3 px-3 font-medium">排名</th>
                      <th className="text-left py-3 px-3 font-medium">姓名</th>
                      <th className="text-left py-3 px-3 font-medium">手机号</th>
                      <th className="text-left py-3 px-3 font-medium">哈希值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((entry) => (
                      <tr
                        key={entry.rank}
                        className={cn(
                          'border-b border-brand-50 transition-colors hover:bg-brand-50/30',
                          entry.rank <= 3 && 'bg-gold-50/30'
                        )}
                      >
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                              rankBg(entry.rank)
                            )}
                          >
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-charcoal">
                          {entry.rank <= 3 && <Trophy size={12} className="inline mr-1 text-gold" />}
                          {entry.participant.name}
                        </td>
                        <td className="py-3 px-3 text-charcoal/60 font-mono text-xs">
                          {maskPhone(entry.participant.phone)}
                        </td>
                        <td className="py-3 px-3 text-charcoal/40 font-mono text-xs">
                          {entry.hash.slice(0, 16)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
