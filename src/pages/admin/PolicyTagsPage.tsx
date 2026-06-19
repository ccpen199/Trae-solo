import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { policyDocuments } from '@/mocks/data'
import type { PolicyTag } from '@/types'

const categoryConfig: Record<string, { label: string; color: string; bg: string; badge: string }> = {
  '人群': { label: '人群标签', color: 'text-gov-blue', bg: 'bg-gov-blue/10', badge: 'gov-badge-blue' },
  '场景': { label: '场景标签', color: 'text-amber-700', bg: 'bg-amber-100', badge: 'gov-badge-gold' },
  '时效': { label: '时效标签', color: 'text-emerald-700', bg: 'bg-emerald-100', badge: 'gov-badge-green' },
}

export default function PolicyTagsPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const tagStats = useMemo(() => {
    const stats: Record<string, { count: number; category: PolicyTag['category'] }> = {}
    policyDocuments.forEach((doc) => {
      doc.tags.forEach((tag) => {
        if (!stats[tag.name]) {
          stats[tag.name] = { count: 0, category: tag.category }
        }
        stats[tag.name].count++
      })
    })
    return stats
  }, [])

  const filteredPolicies = useMemo(() => {
    if (!selectedTag) return policyDocuments
    return policyDocuments.filter((doc) =>
      doc.tags.some((tag) => tag.name === selectedTag)
    )
  }, [selectedTag])

  const maxCount = Math.max(...Object.values(tagStats).map((t) => t.count))

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">政策智能标签</h1>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 gov-card p-5">
          <h2 className="font-semibold text-gov-text mb-4">标签云</h2>
          {(['人群', '场景', '时效'] as const).map((category) => {
            const config = categoryConfig[category]
            const tags = Object.entries(tagStats)
              .filter(([, v]) => v.category === category)
              .sort((a, b) => b[1].count - a[1].count)

            return (
              <div key={category} className="mb-5 last:mb-0">
                <p className={`text-xs font-medium mb-2 ${config.color}`}>{config.label}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map(([name, stat]) => {
                    const size = 0.75 + (stat.count / maxCount) * 0.5
                    const isSelected = selectedTag === name
                    return (
                      <motion.button
                        key={name}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedTag(isSelected ? null : name)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? `${config.bg} ${config.color} ring-2 ring-current ring-offset-1`
                            : `${config.bg} ${config.color} opacity-80 hover:opacity-100`
                        }`}
                        style={{ fontSize: `${size}rem` }}
                      >
                        {name}
                        <span className="ml-1 text-xs opacity-70">({stat.count})</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="col-span-3 gov-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gov-text">
              政策列表
              {selectedTag && (
                <span className="ml-2 text-sm font-normal text-gov-text-secondary">
                  筛选：{selectedTag}
                </span>
              )}
            </h2>
            <span className="text-sm text-gov-text-secondary">
              共 {filteredPolicies.length} 篇
            </span>
          </div>
          <div className="space-y-3">
            {filteredPolicies.map((doc, i) => (
              <motion.div
                key={doc.policyId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg border border-gov-border/50 hover:bg-gov-bg-light transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-gov-text leading-snug">
                    {doc.title}
                  </h3>
                  <span className="shrink-0 text-xs text-gov-text-muted">
                    {doc.publishDate}
                  </span>
                </div>
                <p className="text-xs text-gov-text-secondary mt-2 leading-relaxed line-clamp-2">
                  {doc.summary}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {doc.tags.map((tag) => {
                    const config = categoryConfig[tag.category]
                    return (
                      <span
                        key={tag.name}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.badge} cursor-pointer hover:opacity-80`}
                        onClick={() => setSelectedTag(tag.name)}
                      >
                        {tag.name}
                        <span className="opacity-60">{tag.confidence.toFixed(2)}</span>
                      </span>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
