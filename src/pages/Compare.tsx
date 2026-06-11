import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Star, Clock, MapPin, ChevronDown, ChevronUp, BadgeCheck, Zap } from 'lucide-react'
import { mockServices } from '@/mocks/data'

const categoryFilters = [
  { key: 'all', label: '全部' },
  { key: 'air_conditioner', label: '空调维修' },
  { key: 'water_heater', label: '热水器维修' },
  { key: 'washing_machine', label: '洗衣机维修' },
  { key: 'refrigerator', label: '冰箱维修' },
  { key: 'tv', label: '电视维修' },
]

export default function Compare() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = activeCategory === 'all'
    ? mockServices
    : mockServices.filter((s) => s.category === activeCategory)

  const getLowestPrice = (service: typeof mockServices[number]) =>
    Math.min(...service.providers.map((p) => p.price))

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold gradient-text-cyber">服务商比价</h1>

        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveCategory(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                activeCategory === f.key
                  ? 'bg-cyber-400/20 border-cyber-400 text-cyber-400 shadow-lg shadow-cyber-400/10'
                  : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((service) => {
            const isExpanded = expandedId === service.id
            const lowest = getLowestPrice(service)

            return (
              <div key={service.id} className="glass-card p-5 space-y-3">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : service.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-white">{service.name}</span>
                      <span className="tag-cyber">{service.categoryLabel}</span>
                    </div>
                    <p className="text-sm text-white/50">{service.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <div className="flex items-center gap-1 text-white/50 text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      {service.estimatedDuration}
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-5 h-5 text-cyber-400" />
                      : <ChevronDown className="w-5 h-5 text-white/40" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-4 h-4 text-cyber-400" />
                          <span className="text-sm font-medium text-white/80">费用明细</span>
                        </div>
                        <div className="flex gap-6 mb-4 text-sm">
                          <div className="text-white/60">人工费: <span className="text-cyber-400 font-medium">¥{service.laborFee}</span></div>
                          <div className="text-white/60">配件费: <span className="text-cyber-400 font-medium">按实际</span></div>
                        </div>

                        {service.providers.length > 1 && (
                          <div className="mb-2 flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-cyber-400" />
                            <span className="text-sm font-medium text-white/80">多服务商对比</span>
                          </div>
                        )}

                        <div className={`grid gap-3 ${service.providers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {service.providers.map((provider) => {
                            const isLowest = provider.price === lowest && service.providers.length > 1
                            return (
                              <div
                                key={provider.id}
                                className={`rounded-xl p-4 border transition-all duration-300 ${
                                  isLowest
                                    ? 'bg-warm-500/5 border-warm-500/30 shadow-lg shadow-warm-500/5'
                                    : 'bg-white/[0.02] border-white/5'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-cyber-400/20 flex items-center justify-center text-sm font-bold text-cyber-400">
                                      {provider.name[0]}
                                    </div>
                                    <span className="font-medium text-white text-sm">{provider.name}</span>
                                  </div>
                                  {isLowest && (
                                    <span className="tag-warm font-bold">最优价</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 mb-2">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < Math.floor(provider.rating)
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-white/20'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs text-white/50 ml-1">{provider.rating}</span>
                                </div>

                                <div className="text-xl font-bold text-white mb-1">¥{provider.price}</div>
                                <div className="flex gap-4 text-xs text-white/40 mb-3">
                                  <span>人工 ¥{provider.laborFee}</span>
                                  <span>配件 ¥{provider.partsFee}</span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />{provider.estimatedArrival}
                                  </span>
                                  <span>完成率 {provider.completionRate}%</span>
                                </div>

                                <button className={isLowest ? 'btn-warm w-full text-sm' : 'btn-secondary w-full text-sm'}>
                                  选择此服务商
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="glass-card p-12 text-center text-white/30">
            暂无该分类下的服务项目
          </div>
        )}
      </div>
    </div>
  )
}
