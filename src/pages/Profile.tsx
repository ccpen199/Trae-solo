import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Shield, Star, Coins, Clock, Edit3, TrendingUp, Gift, TrendingDown, Check, X, ArrowUpRight, ArrowDownLeft, Award, Zap, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

interface CoinData {
  balance: number
  transactions: {
    items: {
      id: string
      type: string
      amount: number
      description: string
      created_at: string
    }[]
    total: number
  }
}

interface BenefitItem {
  id: string
  name: string
  description: string
  price: number
  category: 'exposure' | 'coupon' | 'privilege'
  icon: string
  color: string
}

interface BoostTask {
  id: string
  title: string
  bounty_amount: number
  exposure_weight: number
  status: string
}

const benefitItems: BenefitItem[] = [
  { id: 'boost_10', name: '任务曝光卡', description: '提升任务曝光权重10%', price: 50, category: 'exposure', icon: 'zap', color: 'text-amber-primary' },
  { id: 'boost_30', name: '高级曝光卡', description: '提升任务曝光权重30%', price: 120, category: 'exposure', icon: 'zap', color: 'text-amber-primary' },
  { id: 'boost_50', name: '超级曝光卡', description: '提升任务曝光权重50%', price: 200, category: 'exposure', icon: 'zap', color: 'text-amber-primary' },
  { id: 'coffee', name: '咖啡优惠券', description: '连锁咖啡5元券', price: 30, category: 'coupon', icon: 'gift', color: 'text-emerald-primary' },
  { id: 'freight', name: '运费券', description: '快递10元运费抵用券', price: 50, category: 'coupon', icon: 'gift', color: 'text-emerald-primary' },
  { id: 'vip_month', name: '月度会员', description: '专属标识+优先推荐', price: 300, category: 'privilege', icon: 'award', color: 'text-purple-400' },
  { id: 'vip_year', name: '年度会员', description: '专属标识+首页推荐+客服特权', price: 3000, category: 'privilege', icon: 'award', color: 'text-purple-400' },
  { id: 'verify_gift', name: '验证员礼包', description: '解锁验证员权限+100助利币', price: 500, category: 'privilege', icon: 'award', color: 'text-blue-400' },
]

const creditLevelConfig: Record<string, { label: string; color: string; symbol: string }> = {
  bronze: { label: '青铜', color: '#CD7F32', symbol: '✦' },
  silver: { label: '白银', color: '#C0C0C0', symbol: '✦' },
  gold: { label: '黄金', color: '#FFB800', symbol: '✦' },
  diamond: { label: '钻石', color: '#00E5A0', symbol: '✦' },
}

function CreditGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#2A4268" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={radius} fill="none" stroke="#00E5A0" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: 140, height: 140, marginTop: -140 }}>
        <span className="text-3xl font-bold text-cyber-text font-heading">{animated}</span>
        <span className="text-xs text-cyber-dim">信用分</span>
      </div>
    </div>
  )
}

function getTxIcon(type: string) {
  if (type === 'earn') return <ArrowUpRight className="w-4 h-4 text-emerald-primary" />
  return <ArrowDownLeft className="w-4 h-4 text-danger" />
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, token, login, fetchProfile } = useAuthStore()
  const [coinData, setCoinData] = useState<CoinData | null>(null)
  const [stats, setStats] = useState({ published: 0, accepted: 0, completed: 0 })
  const [showBenefits, setShowBenefits] = useState(false)
  const [showConfirm, setShowConfirm] = useState<BenefitItem | null>(null)
  const [showTxHistory, setShowTxHistory] = useState(false)
  const [showBoost, setShowBoost] = useState(false)
  const [exchanging, setExchanging] = useState(false)
  const [exchangeError, setExchangeError] = useState('')
  const [exchangeSuccess, setExchangeSuccess] = useState(false)
  const [exchangedItem, setExchangedItem] = useState<BenefitItem | null>(null)
  const [benefitFilter, setBenefitFilter] = useState<string>('all')
  const [boostTasks, setBoostTasks] = useState<BoostTask[]>([])
  const [boostTaskId, setBoostTaskId] = useState('')
  const [boostAmount, setBoostAmount] = useState(50)
  const [boosting, setBoosting] = useState(false)
  const [boostMessage, setBoostMessage] = useState('')
  const [boostError, setBoostError] = useState('')

  useEffect(() => {
    if (!token) {
      login('13800000002', '123456')
      return
    }
    fetchProfile()
  }, [token, login, fetchProfile])

  useEffect(() => {
    if (!token) return
    fetch('/api/user/coins', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setCoinData(json.data) })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) return
    fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.success && json.data?.stats) setStats({ published: json.data.stats.published_count || 0, accepted: json.data.stats.accepted_count || 0, completed: json.data.stats.completed_count || 0 }) })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!showBoost || !token || !user?.id) return
    fetch(`/api/tasks?publisher_id=${user.id}&status=open&limit=20`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const items = json.data.items || []
          setBoostTasks(items)
          setBoostTaskId((current) => current || items[0]?.id || '')
        }
      })
      .catch(() => {})
  }, [showBoost, token, user?.id])

  const handleExchange = async (item: BenefitItem) => {
    setExchangeError('')
    setShowConfirm(item)
  }

  const confirmExchange = async () => {
    if (!showConfirm || !token) return
    setExchanging(true)
    setExchangeError('')
    try {
      const res = await fetch('/api/user/coins/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: showConfirm.price, description: showConfirm.name }),
      })
      const json = await res.json()
      if (json.success) {
        setExchangedItem(showConfirm)
        setShowConfirm(null)
        setExchangeSuccess(true)
        if (coinData) {
          setCoinData({ ...coinData, balance: json.data.balance })
        }
        setTimeout(() => {
          setExchangeSuccess(false)
          setShowBenefits(false)
          fetch('/api/user/coins', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(json => { if (json.success) setCoinData(json.data) })
        }, 1500)
      } else {
        setExchangeError(json.error || '兑换失败，请稍后重试')
      }
    } catch {
      setExchangeError('网络异常，兑换请求未完成')
    } finally {
      setExchanging(false)
    }
  }

  const confirmBoost = async () => {
    if (!token || !boostTaskId) return
    setBoosting(true)
    setBoostError('')
    setBoostMessage('')
    try {
      const res = await fetch('/api/user/coins/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: boostTaskId, amount: boostAmount }),
      })
      const json = await res.json()
      if (json.success) {
        setCoinData((prev) => prev ? { ...prev, balance: json.data.balance } : prev)
        setBoostTasks((prev) => prev.map((task) => (
          task.id === boostTaskId
            ? { ...task, exposure_weight: Number(task.exposure_weight || 1) + Number(json.data.boost_weight || 0) }
            : task
        )))
        setBoostMessage(`曝光提升成功，当前余额 ${json.data.balance} 助利币`)
        fetch('/api/user/coins', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(json => { if (json.success) setCoinData(json.data) })
          .catch(() => {})
      } else {
        setBoostError(json.error || '提升曝光失败，请稍后重试')
      }
    } catch {
      setBoostError('网络异常，提升曝光请求未完成')
    } finally {
      setBoosting(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-cyber-dim">加载中...</p>
      </div>
    )
  }

  const level = creditLevelConfig[user.credit_level] || creditLevelConfig.bronze
  const balance = coinData?.balance ?? user.help_coins
  const recentTx = coinData?.transactions?.items?.slice(0, 3) ?? []
  const allTx = coinData?.transactions?.items ?? []

  const filteredBenefits = benefitFilter === 'all'
    ? benefitItems
    : benefitItems.filter(b => b.category === benefitFilter)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4 pb-8">
      <div className="card-dark relative">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-primary/20 flex items-center justify-center text-emerald-primary font-heading font-bold text-2xl flex-shrink-0">
            {user.nickname?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-heading text-cyber-text truncate">{user.nickname}</h2>
              {user.is_verifier && <Shield size={16} className="text-emerald-primary flex-shrink-0" />}
            </div>
            <p className="text-sm text-cyber-muted mt-0.5">{user.phone}</p>
            <p className="text-sm text-cyber-muted">{user.email}</p>
          </div>
          <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => navigate('/profile/edit')}>
            <Edit3 size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="badge" style={{ backgroundColor: `${level.color}20`, color: level.color }}>
            {level.symbol} {level.label}
          </span>
          {user.is_verifier && (
            <span className="badge bg-emerald-primary/20 text-emerald-primary">
              <Shield size={12} className="mr-1" />验证员
            </span>
          )}
        </div>
      </div>

      <div className="card-dark relative">
        <div className="relative flex justify-center py-2">
          <CreditGauge score={user.credit_score} />
        </div>
        <p className="text-center text-sm text-cyber-muted mt-1">{level.label}信用等级</p>
        <Link to="/profile/history" className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-primary hover:underline">
          <TrendingUp size={12} /> 信用值趋势
        </Link>
      </div>

      <div className="card-dark glow-accent relative">
        <div className="bg-gradient-to-r from-amber-primary/20 to-amber-dim/10 -mx-4 -mt-4 px-4 py-2.5 rounded-t-xl border-b border-amber-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins size={18} className="text-amber-primary" />
              <span className="font-semibold text-amber-primary font-heading">助利币钱包</span>
            </div>
            <span className="text-xs text-cyber-dim">{allTx.length} 条记录</span>
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-bold text-amber-primary font-heading">{balance}</span>
          <span className="text-xs text-cyber-dim ml-2">助利币</span>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1" onClick={() => setShowBenefits(true)}>
            <Gift size={14} />兑换福利
          </button>
          <button className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1" onClick={() => setShowBoost(true)}>
            <Zap size={14} />提升曝光
          </button>
          <button className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1" onClick={() => setShowTxHistory(true)}>
            <Clock size={14} />交易记录
          </button>
        </div>
        {recentTx.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-navy-600 pt-3">
            <div className="text-xs text-cyber-dim mb-2">最近交易</div>
            {recentTx.map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-sm py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {getTxIcon(tx.type)}
                  <div className="min-w-0">
                    <span className="text-cyber-text block truncate">{tx.description}</span>
                    <span className="text-cyber-dim text-xs">{new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString().slice(0, 5)}</span>
                  </div>
                </div>
                <span className={`font-semibold ${tx.type === 'earn' ? 'text-emerald-primary' : 'text-danger'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card-dark text-center !cursor-default">
          <Star size={18} className="text-emerald-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-cyber-text font-heading">{stats.published}</div>
          <div className="text-xs text-cyber-dim">已发布</div>
        </div>
        <div className="card-dark text-center !cursor-default">
          <Clock size={18} className="text-amber-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-cyber-text font-heading">{stats.completed}</div>
          <div className="text-xs text-cyber-dim">已完成</div>
        </div>
        {user.is_verifier ? (
          <div className="card-dark text-center !cursor-default">
            <Shield size={18} className="text-emerald-primary mx-auto mb-1" />
            <div className="text-lg font-bold text-cyber-text font-heading">0</div>
            <div className="text-xs text-cyber-dim">已验证</div>
          </div>
        ) : (
          <div className="card-dark text-center !cursor-default">
            <User size={18} className="text-cyber-muted mx-auto mb-1" />
            <div className="text-lg font-bold text-cyber-text font-heading">{stats.accepted}</div>
            <div className="text-xs text-cyber-dim">已承接</div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link to="/profile/history" className="card-dark flex-1 flex items-center justify-center gap-2 text-sm text-cyber-muted hover:text-emerald-primary">
          <Clock size={16} /> 任务历史
        </Link>
        <Link to="/profile/verify" className="card-dark flex-1 flex items-center justify-center gap-2 text-sm text-cyber-muted hover:text-emerald-primary">
          <Shield size={16} /> 验证记录
        </Link>
      </div>

      {showBenefits && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={() => setShowBenefits(false)}>
          <div className="bg-navy-800 w-full md:max-w-lg md:rounded-xl rounded-t-xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-navy-600 flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-cyber-text flex items-center gap-2">
                <Gift size={18} className="text-amber-primary" /> 福利兑换
              </h3>
              <button className="p-1 text-cyber-dim hover:text-cyber-text" onClick={() => setShowBenefits(false)}><X size={18} /></button>
            </div>
            <div className="p-4 border-b border-navy-600">
              <div className="flex gap-2 mb-2">
                {[{ value: 'all', label: '全部' }, { value: 'exposure', label: '曝光' }, { value: 'coupon', label: '优惠券' }, { value: 'privilege', label: '特权' }].map(f => (
                  <button key={f.value} className={`px-3 py-1 rounded-full text-xs transition-all ${
                    benefitFilter === f.value ? 'bg-emerald-primary/20 text-emerald-primary' : 'bg-navy-700 text-cyber-dim hover:bg-navy-600'
                  }`} onClick={() => setBenefitFilter(f.value)}>{f.label}</button>
                ))}
              </div>
              <div className="text-xs text-cyber-dim">当前余额: <span className="text-amber-primary font-semibold">{balance}</span> 助利币</div>
            </div>
            <div className="p-4 overflow-y-auto max-h-96 space-y-2">
              {filteredBenefits.map(item => (
                <div key={item.id} className="card-dark p-3 flex items-center gap-3 hover:border-emerald-primary/30 transition-all">
                  <div className={`w-10 h-10 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    {item.icon === 'zap' && <Zap size={20} />}
                    {item.icon === 'gift' && <Gift size={20} />}
                    {item.icon === 'award' && <Award size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-cyber-text font-medium text-sm">{item.name}</div>
                    <div className="text-cyber-dim text-xs">{item.description}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-amber-primary font-semibold text-sm">{item.price}</span>
                    <button
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        balance >= item.price ? 'bg-emerald-primary text-navy-900 hover:bg-emerald-primary/90' : 'bg-navy-700 text-cyber-dim cursor-not-allowed'
                      }`}
                      disabled={balance < item.price}
                      onClick={() => handleExchange(item)}
                    >
                      {balance >= item.price ? '兑换' : '余额不足'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowConfirm(null)}>
          <div className="glass p-6 max-w-sm w-full mx-4 glow-primary rounded-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-cyber-text mb-1">确认兑换</h3>
            <p className="text-cyber-muted text-sm mb-4">确认消耗 <span className="text-amber-primary font-semibold">{showConfirm.price}</span> 助利币兑换 <span className="text-emerald-primary font-semibold">{showConfirm.name}</span>？</p>
            <div className="bg-navy-700/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyber-dim">当前余额</span>
                <span className="text-amber-primary font-semibold">{balance}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-cyber-dim">扣减金额</span>
                <span className="text-danger font-semibold">-{showConfirm.price}</span>
              </div>
              <div className="border-t border-navy-600 my-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyber-text font-medium">兑换后余额</span>
                <span className="text-amber-primary font-semibold">{balance - showConfirm.price}</span>
              </div>
            </div>
            {exchangeError && (
              <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {exchangeError}
              </div>
            )}
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowConfirm(null)} disabled={exchanging}>取消</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-1" onClick={confirmExchange} disabled={exchanging}>
                {exchanging ? '兑换中...' : <><Check size={14} />确认兑换</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {exchangeSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass p-8 text-center glow-primary rounded-xl max-w-sm mx-4 animate-bounce-in">
            <div className="w-16 h-16 rounded-full bg-emerald-primary/20 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-primary" />
            </div>
            <h3 className="text-xl font-bold text-cyber-text mb-2">兑换成功</h3>
            <p className="text-cyber-muted text-sm">已消耗 {exchangedItem?.price} 助利币，{exchangedItem?.name} 已发放至您的账户</p>
          </div>
        </div>
      )}

      {showTxHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={() => setShowTxHistory(false)}>
          <div className="bg-navy-800 w-full md:max-w-lg md:rounded-xl rounded-t-xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-navy-600 flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-cyber-text flex items-center gap-2">
                <ShoppingBag size={18} className="text-amber-primary" /> 助利币流水
              </h3>
              <button className="p-1 text-cyber-dim hover:text-cyber-text" onClick={() => setShowTxHistory(false)}><X size={18} /></button>
            </div>
            <div className="p-4 border-b border-navy-600 flex justify-between text-sm">
              <span className="text-cyber-dim">收入: <span className="text-emerald-primary font-semibold">{allTx.filter(t => t.type === 'earn').reduce((s, t) => s + t.amount, 0)}</span></span>
              <span className="text-cyber-dim">支出: <span className="text-danger font-semibold">{allTx.filter(t => t.type !== 'earn').reduce((s, t) => s + t.amount, 0)}</span></span>
              <span className="text-cyber-dim">净收入: <span className="text-amber-primary font-semibold">{allTx.reduce((s, t) => s + (t.type === 'earn' ? t.amount : -t.amount), 0)}</span></span>
            </div>
            <div className="p-4 overflow-y-auto max-h-96 space-y-1">
              {allTx.length === 0 ? (
                <div className="text-center py-12 text-cyber-dim">暂无交易记录</div>
              ) : (
                allTx.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-navy-700/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'earn' ? 'bg-emerald-primary/20' : 'bg-danger/20'}`}>
                        {tx.type === 'earn' ? <TrendingUp size={16} className="text-emerald-primary" /> : <TrendingDown size={16} className="text-danger" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-cyber-text text-sm">{tx.description}</div>
                        <div className="text-cyber-dim text-xs">{new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString().slice(0, 5)}</div>
                      </div>
                    </div>
                    <span className={`font-semibold ${tx.type === 'earn' ? 'text-emerald-primary' : 'text-danger'}`}>
                      {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showBoost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={() => setShowBoost(false)}>
          <div className="bg-navy-800 w-full md:max-w-lg md:rounded-xl rounded-t-xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-navy-600 flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-cyber-text flex items-center gap-2">
                <Zap size={18} className="text-amber-primary" /> 任务曝光提升
              </h3>
              <button className="p-1 text-cyber-dim hover:text-cyber-text" onClick={() => setShowBoost(false)}><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[72vh]">
              <div className="rounded-lg border border-amber-primary/20 bg-amber-primary/10 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">当前余额</span>
                  <span className="font-semibold text-amber-primary">{balance} 助利币</span>
                </div>
              </div>

              {boostTasks.length === 0 ? (
                <div className="text-center py-8 text-cyber-dim text-sm">
                  暂无可提升曝光的已发布任务
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-cyber-text">选择任务</label>
                    <div className="space-y-2">
                      {boostTasks.map((task) => (
                        <button
                          className={`w-full rounded-lg border p-3 text-left transition-all ${
                            boostTaskId === task.id
                              ? 'border-amber-primary bg-amber-primary/10'
                              : 'border-navy-600 bg-navy-700/50 hover:border-navy-500'
                          }`}
                          onClick={() => setBoostTaskId(task.id)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-cyber-text">{task.title}</span>
                            <span className="text-xs text-amber-primary">权重 ×{Number(task.exposure_weight || 1).toFixed(1)}</span>
                          </div>
                          <div className="mt-1 text-xs text-cyber-dim">悬赏 {task.bounty_amount} · 状态 {task.status}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-cyber-text">消耗助利币</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[20, 50, 100].map((amount) => (
                        <button
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                            boostAmount === amount
                              ? 'border-amber-primary bg-amber-primary/20 text-amber-primary'
                              : 'border-navy-600 bg-navy-700 text-cyber-muted hover:bg-navy-600'
                          }`}
                          onClick={() => setBoostAmount(amount)}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-cyber-dim">每消耗 1 助利币提升 0.1 曝光权重，排序会在任务广场实时生效。</p>
                  </div>

                  {boostError && (
                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{boostError}</div>
                  )}
                  {boostMessage && (
                    <div className="rounded-lg border border-emerald-primary/30 bg-emerald-primary/10 px-3 py-2 text-sm text-emerald-primary">{boostMessage}</div>
                  )}

                  <button
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    onClick={confirmBoost}
                    disabled={boosting || !boostTaskId || balance < boostAmount}
                  >
                    <Zap size={14} />{boosting ? '提升中...' : balance < boostAmount ? '余额不足' : '确认提升曝光'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
