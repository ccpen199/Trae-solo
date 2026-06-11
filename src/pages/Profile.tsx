import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Shield, Star, Coins, Clock, Edit3, TrendingUp } from 'lucide-react'
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

export default function Profile() {
  const navigate = useNavigate()
  const { user, token, fetchProfile } = useAuthStore()
  const [coinData, setCoinData] = useState<CoinData | null>(null)
  const [stats, setStats] = useState({ published: 0, accepted: 0, completed: 0 })

  useEffect(() => { fetchProfile() }, [fetchProfile])

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
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-amber-primary" />
            <span className="font-semibold text-amber-primary font-heading">助利币钱包</span>
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-bold text-amber-primary font-heading">{balance}</span>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn-secondary flex-1 text-xs py-1.5">兑换福利</button>
          <button className="btn-secondary flex-1 text-xs py-1.5">提升曝光</button>
          <button className="btn-secondary flex-1 text-xs py-1.5">交易记录</button>
        </div>
        {recentTx.length > 0 && (
          <div className="mt-3 space-y-2">
            {recentTx.map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Coins size={14} className={tx.type === 'earn' ? 'text-emerald-primary' : 'text-cyber-dim'} />
                  <span className="text-cyber-muted truncate">{tx.description}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={tx.type === 'earn' ? 'text-emerald-primary' : 'text-danger'}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                  </span>
                  <span className="text-cyber-dim text-xs">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </span>
                </div>
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
        {user.is_verifier && (
          <div className="card-dark text-center !cursor-default">
            <Shield size={18} className="text-emerald-primary mx-auto mb-1" />
            <div className="text-lg font-bold text-cyber-text font-heading">0</div>
            <div className="text-xs text-cyber-dim">已验证</div>
          </div>
        )}
        {!user.is_verifier && (
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
    </div>
  )
}
