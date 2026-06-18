import { useState, useEffect } from 'react'
import { api } from '@/api/client'

const separator = <span className="text-jinguan-400 mx-4 text-xs">◆</span>

function formatNumber(n: number): string {
  if (n >= 100000000) {
    return (n / 100000000).toFixed(2) + '亿'
  }
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + '万'
  }
  return n.toLocaleString()
}

function MarqueeContent({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <>
      {stats.map((stat, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className="text-jinguan-400 text-sm font-semibold mr-1.5">{stat.value}</span>
          <span className="text-white/80 text-sm">{stat.label}</span>
          {i < stats.length - 1 && separator}
        </span>
      ))}
    </>
  )
}

export default function Marquee() {
  const [stats, setStats] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const summary = await api.dashboard.summary()
        setStats([
          { label: '联盟商户', value: formatNumber(summary.totalMerchants) + '+' },
          { label: '会员总数', value: formatNumber(summary.totalMembers) + '+' },
          { label: '累计GMV', value: '¥' + formatNumber(summary.totalGmv) },
          { label: '跨城消费', value: formatNumber(summary.crossCityTransactions) + '笔' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="w-full bg-wudu-900 border-t border-b border-jinguan-400/10 py-2.5">
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-jinguan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-wudu-900 border-t border-b border-jinguan-400/10 overflow-hidden">
      <div className="animate-marquee flex items-center py-2.5 w-max">
        <MarqueeContent stats={stats} />
        {separator}
        <MarqueeContent stats={stats} />
        {separator}
      </div>
    </div>
  )
}
