import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Building2, TrendingUp, Target, FileText } from 'lucide-react'
import { useStore, cacheStats } from '@/store'

function useCountUp(target: number, duration: number, decimal: boolean, animate: boolean) {
  const [count, setCount] = useState(animate ? 0 : target)
  const ref = useRef(false)
  useEffect(() => {
    if (!animate || ref.current) return
    ref.current = true
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * target)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, animate])
  return decimal ? count.toFixed(1) : Math.floor(count).toLocaleString()
}

function StatCard({ icon: Icon, label, value, suffix, color, decimal, animate }: {
  icon: React.ElementType; label: string; value: number; suffix: string; color: string; decimal?: boolean; animate: boolean
}) {
  const display = useCountUp(value, 1500, !!decimal, animate)
  return (
    <div className="bg-navy-800/60 backdrop-blur-sm border border-navy-500/30 rounded-lg p-5 text-center animate-fade-in card-hover">
      <Icon size={28} className={`${color} mx-auto mb-2`} />
      <p className="text-2xl font-bold text-white font-serif">
        {display}<span className="text-base font-normal text-navy-200 ml-1">{suffix}</span>
      </p>
      <p className="text-sm text-navy-300 mt-1">{label}</p>
    </div>
  )
}

export default function HeroSection() {
  const { platformStats, statsAnimated, setPlatformStatsAnimated } = useStore()
  const animatedRef = useRef(false)

  useEffect(() => {
    if (statsAnimated || animatedRef.current) return
    animatedRef.current = true
    const timer = setTimeout(() => {
      setPlatformStatsAnimated(true)
      cacheStats(platformStats)
    }, 1700)
    return () => clearTimeout(timer)
  }, [statsAnimated, setPlatformStatsAnimated, platformStats])

  const stats = [
    { icon: Building2, label: '注册企业', value: platformStats.registeredCompanies, suffix: '+', color: 'text-amber-400' },
    { icon: TrendingUp, label: '成交金额', value: platformStats.transactionAmount, suffix: '亿+', color: 'text-teal-400', decimal: true },
    { icon: Target, label: '匹配成功率', value: platformStats.matchSuccessRate, suffix: '%', color: 'text-amber-300', decimal: true },
  ]

  const lastUpdatedDate = new Date(platformStats.lastUpdated).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="relative bg-gradient-to-br from-navy-800 via-navy-700 to-navy-900 rounded-lg p-8 mb-6 overflow-hidden bg-pattern-textile">
      <div className="relative z-10">
        <h1 className="font-serif text-5xl font-bold text-gradient-gold mb-3">织链</h1>
        <p className="text-navy-200 text-lg mb-6">
          毛衫与服装产业链智能撮合平台 — 从寻源到交付的全链路数字化服务
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} animate={!statsAnimated} />
          ))}
        </div>
        <p className="text-[11px] text-navy-400 mt-3">数据更新于 {lastUpdatedDate}</p>
        <Link
          to="/news"
          className="inline-flex items-center gap-1.5 mt-3 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          <FileText size={14} />
          查看详细报告
        </Link>
      </div>
    </div>
  )
}
