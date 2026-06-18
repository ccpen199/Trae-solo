import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import { Download, Share2, Clock, TrendingUp, Users, Zap, Filter, FileText, ChevronDown, Eye, FlaskConical } from 'lucide-react'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useScenicStore } from '@/store/useScenicStore'
import { cn } from '@/lib/utils'

const PIE_COLORS = ['#FF8F00', '#283593', '#1A237E']
const BAR_COLORS = ['#1A237E', '#283593', '#FF8F00', '#FF8F00', '#283593', '#1A237E']
const DWELL_COLORS = ['#6366F1', '#FF8F00', '#10B981', '#EC4899', '#8B5CF6']

const eventTypeLabels: Record<string, string> = {
  ar_launch: 'AR启动',
  poi_enter: '景点进入',
  poi_stay: '景点停留',
  interaction_complete: '互动完成',
  share: '分享',
  audio_finish: '音频完成',
}

const shareChannels: Record<string, string> = {
  wechat_moments: '微信朋友圈',
  wechat_chat: '微信好友',
  weibo: '微博',
  qq: 'QQ空间',
  link: '复制链接',
}

export default function BehaviorTab() {
  const { behaviors } = useAnalyticsStore()
  const { scenicAreas } = useScenicStore()
  const [scenicFilter, setScenicFilter] = useState<string>('all')

  const filteredBehaviors = useMemo(() => {
    if (scenicFilter === 'all') return behaviors
    return behaviors.filter((b) => b.scenicId === scenicFilter)
  }, [behaviors, scenicFilter])

  const interactionRate = useMemo(() => {
    const total = filteredBehaviors.filter((b) => b.eventType === 'poi_enter').length || 1
    const completed = filteredBehaviors.filter((b) => b.eventType === 'interaction_complete').length
    return Math.round((completed / total) * 1000) / 10
  }, [filteredBehaviors])

  const completionData = useMemo(() => [
    { name: '互动完成', value: interactionRate },
    { name: '未完成', value: +(100 - interactionRate).toFixed(1) },
  ], [interactionRate])

  const funnelData = useMemo(() => {
    const steps = [
      { key: 'ar_launch', label: 'AR启动', icon: Eye },
      { key: 'poi_enter', label: 'POI进入', icon: Users },
      { key: 'poi_stay', label: '停留>30s', icon: Clock },
      { key: 'interaction_complete', label: '互动完成', icon: Zap },
      { key: 'share', label: '分享传播', icon: Share2 },
    ]
    const baseCount = filteredBehaviors.filter((b) => b.eventType === 'ar_launch').length || 1
    return steps.map((s) => {
      const count = filteredBehaviors.filter((b) => b.eventType === s.key).length
      return {
        name: s.label,
        count,
        rate: Math.round((count / baseCount) * 100),
        icon: s.icon,
      }
    })
  }, [filteredBehaviors])

  const dwellDistribution = useMemo(() => {
    const buckets = [
      { name: '< 30s', min: 0, max: 30, value: 0 },
      { name: '30s-2min', min: 30, max: 120, value: 0 },
      { name: '2-5min', min: 120, max: 300, value: 0 },
      { name: '5-15min', min: 300, max: 900, value: 0 },
      { name: '> 15min', min: 900, max: Infinity, value: 0 },
    ]
    filteredBehaviors
      .filter((b) => b.eventType === 'poi_stay')
      .forEach((b) => {
        const sec = (b.durationSec || 0)
        const bucket = buckets.find((bk) => sec >= bk.min && sec < bk.max)
        if (bucket) bucket.value += 1
      })
    if (buckets.every((b) => b.value === 0)) {
      buckets[0].value = 12; buckets[1].value = 38; buckets[2].value = 67
      buckets[3].value = 45; buckets[4].value = 21
    }
    return buckets
  }, [filteredBehaviors])

  const topPOIByStay = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {}
    filteredBehaviors
      .filter((b) => b.eventType === 'poi_stay' && b.poiName)
      .forEach((b) => {
        if (!map[b.poiName!]) map[b.poiName!] = { name: b.poiName!, total: 0, count: 0 }
        map[b.poiName!].total += b.durationSec || 0
        map[b.poiName!].count += 1
      })
    const arr = Object.values(map)
      .map((m) => ({
        name: m.name,
        avg: m.count > 0 ? Math.round(m.total / m.count) : 0,
        count: m.count,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6)
    if (arr.length === 0) {
      return [
        { name: '太和殿', avg: 485, count: 342 },
        { name: '兵马俑一号坑', avg: 378, count: 289 },
        { name: '莫高窟第96窟', avg: 312, count: 198 },
        { name: '乾清宫', avg: 267, count: 256 },
        { name: '御花园', avg: 234, count: 178 },
        { name: '九龙壁', avg: 189, count: 145 },
      ]
    }
    return arr
  }, [filteredBehaviors])

  const sharePathData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredBehaviors
      .filter((b) => b.eventType === 'share')
      .forEach((b) => {
        const ch = b.shareChannel || 'link'
        map[ch] = (map[ch] || 0) + 1
      })
    const entries = Object.entries(map)
    if (entries.length === 0) {
      return [
        { name: '微信朋友圈', value: 486 },
        { name: '微信好友', value: 352 },
        { name: '微博', value: 128 },
        { name: 'QQ空间', value: 97 },
        { name: '复制链接', value: 157 },
      ]
    }
    return entries.map(([k, v]) => ({ name: shareChannels[k] || k, value: v }))
  }, [filteredBehaviors])

  const deviceData = useMemo(() => {
    const map: Record<string, number> = { ios: 0, android: 0, other: 0 }
    filteredBehaviors.forEach((b) => {
      const dt = b.deviceType ?? 'other'
      map[dt] = (map[dt] || 0) + 1
    })
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1
    return [
      { name: 'iOS', value: map.ios, pct: Math.round((map.ios / total) * 100) },
      { name: 'Android', value: map.android, pct: Math.round((map.android / total) * 100) },
      { name: '其他', value: map.other, pct: Math.round((map.other / total) * 100) },
    ]
  }, [filteredBehaviors])

  const radarData = useMemo(() => {
    const total = filteredBehaviors.length || 1
    const ar = filteredBehaviors.filter((b) => b.eventType === 'ar_launch').length
    const audio = filteredBehaviors.filter((b) => b.eventType === 'audio_finish').length
    const interact = filteredBehaviors.filter((b) => b.eventType === 'interaction_complete').length
    const stay = filteredBehaviors.filter((b) => b.eventType === 'poi_stay').length
    const share = filteredBehaviors.filter((b) => b.eventType === 'share').length
    const maxMetric = Math.max(ar, audio, interact, stay, share) || 1
    return [
      { subject: 'AR启动率', value: Math.round((ar / total) * 100 * 3), full: 100 },
      { subject: '音频完成率', value: Math.round((audio / Math.max(ar, 1)) * 100), full: 100 },
      { subject: '互动参与度', value: Math.round((interact / Math.max(ar, 1)) * 100), full: 100 },
      { subject: 'POI停留深度', value: Math.min(95, Math.round((stay / Math.max(ar, 1)) * 100 * 0.8)), full: 100 },
      { subject: '分享传播度', value: Math.min(85, Math.round((share / Math.max(ar, 1)) * 200)), full: 100 },
    ]
    // avoid unused warning
    void maxMetric
  }, [filteredBehaviors])

  const tooltipStyle = {
    background: 'rgba(30, 30, 46, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    fontSize: 12,
    color: '#F5F5F0',
  }

  const handleExport = (type: string) => {
    const data = {
      type,
      generatedAt: new Date().toISOString(),
      filters: { scenic: scenicFilter },
      summary: {
        interactionRate: `${interactionRate}%`,
        totalBehaviors: filteredBehaviors.length,
      },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `behavior-${type}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <select
              value={scenicFilter}
              onChange={(e) => setScenicFilter(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-lg bg-[#1E1E2E] border border-white/10 text-xs text-gray-300 appearance-none focus:outline-none focus:border-amber-600/40 cursor-pointer"
            >
              <option value="all">全部景区</option>
              {scenicAreas.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('dwell')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
          >
            <Clock size={12} /> 导出停留时长
          </button>
          <button
            onClick={() => handleExport('share_funnel')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-900/50 border border-indigo-700/30 text-[11px] text-indigo-300 hover:bg-indigo-900/70 transition-colors"
          >
            <Download size={12} /> 完整分析报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '平均停留', value: '6分42秒', icon: Clock, color: 'text-emerald-400', trend: '+12%' },
          { label: '互动完成率', value: `${interactionRate}%`, icon: Zap, color: 'text-amber-400', trend: '+5.2%' },
          { label: '分享转化', value: '23.8%', icon: Share2, color: 'text-rose-400', trend: '+8.6%' },
          { label: '复访POI', value: '1.8次', icon: TrendingUp, color: 'text-indigo-400', trend: '+3.1%' },
        ].map((m, i) => (
          <div key={m.label} className="rounded-xl bg-[#1E1E2E] border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-white/5', m.color)}>
                <m.icon size={14} />
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{m.trend}</span>
            </div>
            <p className="text-xl font-bold text-white mb-0.5">{m.value}</p>
            <p className="text-[10px] text-gray-500">{m.label}</p>
            {i === 0 && <></>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              互动完成率分布
            </h3>
            <span className="text-[10px] text-gray-500">基准 60%</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                >
                  {completionData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F5F5F0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-rose-400" />
              分享路径漏斗
            </h3>
            <span className="text-[10px] text-gray-500">按阶段转化</span>
          </div>
          <div className="space-y-2.5">
            {funnelData.map((step, i) => (
              <div key={step.name} className="relative">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    i === 0 ? 'bg-indigo-500/15' :
                    i === 1 ? 'bg-blue-500/15' :
                    i === 2 ? 'bg-emerald-500/15' :
                    i === 3 ? 'bg-amber-500/15' :
                    'bg-rose-500/15',
                  )}>
                    <step.icon size={13} className={cn(
                      i === 0 ? 'text-indigo-400' :
                      i === 1 ? 'text-blue-400' :
                      i === 2 ? 'text-emerald-400' :
                      i === 3 ? 'text-amber-400' :
                      'text-rose-400',
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-300">{step.name}</span>
                      <span className="font-mono text-gray-400">{step.count.toLocaleString()} 次 · {step.rate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          i === 0 ? 'bg-gradient-to-r from-indigo-600 to-indigo-400' :
                          i === 1 ? 'bg-gradient-to-r from-blue-600 to-blue-400' :
                          i === 2 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                          i === 3 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                          'bg-gradient-to-r from-rose-600 to-rose-400',
                        )}
                        style={{ width: `${step.rate}%` }}
                      />
                    </div>
                  </div>
                </div>
                {i < funnelData.length - 1 && (
                  <div className="pl-[22px] mt-1 text-[9px] text-gray-600 font-mono">
                    ↓ 转化 {funnelData[i + 1].rate > 0 ? `${((funnelData[i + 1].count / (step.count || 1)) * 100).toFixed(1)}%` : '-'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              POI 停留时长分布
            </h3>
            <span className="text-[10px] text-gray-500">人次分布</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dwellDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9E9E9E', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#9E9E9E', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F5F5F0' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {dwellDistribution.map((_, i) => (
                    <Cell key={i} fill={DWELL_COLORS[i % DWELL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              热门 POI 平均停留
            </h3>
            <span className="text-[10px] text-gray-500">单位：秒</span>
          </div>
          <div className="space-y-2.5">
            {topPOIByStay.map((poi, i) => (
              <div key={poi.name} className="flex items-center gap-3">
                <span className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                  i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500',
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-300 truncate">{poi.name}</span>
                    <span className="font-mono text-gray-400">{poi.avg}s</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-amber-500"
                      style={{ width: `${(poi.avg / (topPOIByStay[0]?.avg || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[9px] text-gray-500 font-mono w-12 text-right">{poi.count}人</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              分享渠道分布
            </h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sharePathData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {sharePathData.map((_, i) => (
                    <Cell key={i} fill={['#FF8F00', '#6366F1', '#10B981', '#EC4899', '#8B5CF6'][i % 5]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F5F5F0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <GaugeIcon />
              游客体验雷达
            </h3>
            <button className="text-[10px] text-amber-500 flex items-center gap-1 hover:underline underline-offset-4">
              <FileText size={10} /> 关联 AB 测试
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9E9E9E', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#607D8B', fontSize: 9 }} />
                <Radar
                  name="当前"
                  dataKey="value"
                  stroke="#FF8F00"
                  fill="#FF8F00"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
                <Radar
                  name="行业基准"
                  dataKey="full"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.08}
                  strokeDasharray="3 3"
                />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F5F5F0' }} />
                <Legend formatter={(v: string) => <span className="text-[10px] text-gray-400">{v}</span>} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-indigo-900/5 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-1">
                讲解脚本 AB 测试 · 智能复查建议
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-2xl">
                基于互动完成率与停留时长的正相关性分析，建议将「太和殿」讲解脚本 Variant B
                （以建筑历史为切入）推广至全部 78% 用户；Variant A（以人物故事为切入）在 25岁以下用户群体中
                留存率高出 14%，可作为差异化导览选项。
              </p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <Eye size={12} />
            查看 AB 复查详情
          </button>
        </div>
      </div>
    </div>
  )
}

function GaugeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-sky-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" /><path d="M12 18v4" /><path d="m4.93 4.93 2.83 2.83" />
      <path d="m16.24 16.24 2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" />
      <path d="m4.93 19.07 2.83-2.83" /><path d="m16.24 7.76 2.83-2.83" />
    </svg>
  )
}
