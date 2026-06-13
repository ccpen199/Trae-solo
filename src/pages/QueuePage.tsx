import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Crown, Shield, Users, Sparkles } from 'lucide-react'
import useQueueStore from '@/stores/queueStore'
import useAuthStore from '@/stores/authStore'

export default function QueuePage() {
  const { showtimeId } = useParams<{ showtimeId: string }>()
  const navigate = useNavigate()
  const { queueId, position, status, estimatedWait, priorityWeight, orderId, joinQueue, fetchStatus, boost, reset } = useQueueStore()
  const { user, isLoggedIn, login } = useAuthStore()
  const [boosted, setBoosted] = useState<Record<string, boolean>>({})
  const timerRef = useRef<number | null>(null)
  const joinedRef = useRef(false)

  useEffect(() => {
    if (!showtimeId) return
    if (!joinedRef.current) {
      joinedRef.current = true
      const seatStr = localStorage.getItem(`pending_seats_${showtimeId}`)
      const seatIds = seatStr ? JSON.parse(seatStr) : []
      const join = async () => {
        if (!isLoggedIn) {
          await login('user1', '123456')
        }
        await joinQueue(parseInt(showtimeId), seatIds)
      }
      join().catch(() => {})
    }
  }, [showtimeId, joinQueue, isLoggedIn, login])

  useEffect(() => {
    if (status === 'waiting' || status === 'processing') {
      timerRef.current = window.setInterval(() => {
        fetchStatus()
      }, 2000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, fetchStatus])

  useEffect(() => {
    return () => {
      reset()
      joinedRef.current = false
    }
  }, [reset])

  const handleBoost = async (type: 'member' | 'credit' | 'invite', value: number) => {
    if (boosted[type]) return
    await boost(type, value)
    setBoosted((prev) => ({ ...prev, [type]: true }))
  }

  const progress = Math.max(0, Math.min(100, 100 - (position / 50) * 100))
  const circumference = 2 * Math.PI * 120

  const statusText = {
    idle: '准备中...',
    waiting: '⏳ 排队等待中...',
    processing: '🔄 正在处理您的订单...',
    success: '🎉 抢票成功！',
    failed: '😢 很遗憾，票已售罄',
  }

  const statusColor = {
    idle: 'text-carbon-400',
    waiting: 'text-yellow-400',
    processing: 'text-gold-500',
    success: 'text-green-400',
    failed: 'text-wine-500',
  }

  const boostOptions = [
    { type: 'member' as const, icon: Crown, name: '会员加速', desc: 'VIP会员专享', value: 0.3, label: '+0.3 权重' },
    { type: 'credit' as const, icon: Shield, name: '信用加速', desc: `芝麻信用 ${user?.creditScore || 600}+`, value: 0.2, label: '+0.2 权重' },
    { type: 'invite' as const, icon: Users, name: '邀请加速', desc: '邀请好友助力', value: 0.15, label: '+0.15 权重' },
  ]

  return (
    <div className="min-h-screen bg-gradient-dark">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="flex-1" />
          <span className="text-gold-400 text-sm">{user?.realName}</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="font-display text-3xl text-gold-400 text-center mb-12">抢票排队</h1>

        <div className="glass-card p-12 mb-8">
          <div className="relative w-72 h-72 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B1A2B" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="#2d2d44"
                strokeWidth="12"
              />
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`font-display text-6xl text-gold-500 ${status === 'waiting' ? 'animate-pulse' : ''}`}>
                {position || '--'}
              </div>
              <div className="text-sm text-carbon-400 mt-2">当前位置</div>
              <div className="text-gold-400 mt-1">
                预计等待 {estimatedWait || '--'} 分钟
              </div>
            </div>
          </div>

          <div className={`text-center font-display text-2xl ${statusColor[status as keyof typeof statusColor]}`}>
            {statusText[status as keyof typeof statusText]}
          </div>

          {orderId && status === 'success' && (
            <div className="text-center mt-4 text-green-400">
              订单号: #{orderId}
            </div>
          )}
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="section-title text-center mb-6">
            <Sparkles size={20} className="inline mr-2" />
            加速通道
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {boostOptions.map((opt) => {
              const Icon = opt.icon
              const isBoosted = boosted[opt.type]
              return (
                <div
                  key={opt.type}
                  className={`glass-card p-5 text-center transition-all ${
                    isBoosted ? 'border-gold-500/50 shadow-glow-gold' : 'hover:shadow-glow-gold hover:-translate-y-1'
                  }`}
                >
                  <Icon size={32} className="mx-auto text-gold-500 mb-3" />
                  <div className="text-white font-medium mb-2">{opt.name}</div>
                  <div className="text-xs text-carbon-400 mb-3 h-8">{opt.desc}</div>
                  <div className="text-gold-400 font-display mb-4">{opt.label}</div>
                  <button
                    onClick={() => handleBoost(opt.type, user?.creditScore || 600)}
                    disabled={isBoosted}
                    className={`w-full py-2 text-xs rounded-lg transition-all ${
                      isBoosted
                        ? 'bg-gold-500/20 text-gold-500 cursor-default'
                        : 'wine-gradient-btn hover:scale-[1.02]'
                    }`}
                  >
                    {isBoosted ? '✓ 已使用' : '立即使用'}
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-carbon-700/50 text-center text-sm">
            <span className="text-carbon-400">当前优先级权重: </span>
            <span className="text-gold-500 font-bold font-display text-xl">
              {priorityWeight.toFixed(2)}x
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {status === 'success' && (
            <Link to="/orders" className="gold-gradient-btn px-12 py-4 text-lg font-bold">
              查看订单
            </Link>
          )}
          {status === 'failed' && (
            <Link to="/" className="wine-gradient-btn px-12 py-4 text-lg">
              返回首页
            </Link>
          )}
          {(status === 'waiting' || status === 'processing') && (
            <button
              onClick={() => {
                reset()
                navigate(-1)
              }}
              className="px-8 py-3 rounded-lg border border-carbon-600 text-carbon-400 hover:text-white hover:border-carbon-500 transition"
            >
              取消排队
            </button>
          )}
          {status === 'idle' && (
            <div className="text-carbon-500">正在加入队列...</div>
          )}
        </div>

        <div className="mt-12 text-center text-xs text-carbon-500 space-y-1">
          <p>✓ 优先级越高，排队位置越靠前</p>
          <p>✓ 多种加速方式可叠加使用，上限 2.0x</p>
          <p>✓ 排队成功后请在 15 分钟内完成支付</p>
        </div>
      </div>
    </div>
  )
}
