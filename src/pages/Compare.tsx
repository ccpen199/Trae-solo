import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Star, Clock, MapPin, ShieldCheck, CheckCircle, ChevronDown, ChevronUp, Zap, BadgeCheck, Users } from 'lucide-react'
import { mockServices, categories } from '@/mocks/data'

const categoryFilters = [
  { key: 'all', label: '全部' },
  ...categories.slice(0, 5).map(c => ({ key: c.key, label: c.label })),
]

export default function Compare() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = activeCategory === 'all'
    ? mockServices
    : mockServices.filter((s) => s.category === activeCategory)

  const getPriceRange = (service: typeof mockServices[number]) => {
    const prices = service.providers.map(p => p.price)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }

  const getLowestPrice = (service: typeof mockServices[number]) =>
    Math.min(...service.providers.map((p) => p.price))

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="max-w-6xl mx-auto space-y-6">
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
            const priceRange = getPriceRange(service)
            const lowest = getLowestPrice(service)

            return (
              <div
                key={service.id}
                className={`glass-card glass-card-hover transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'ring-1 ring-cyber-400/30' : ''
                }`}
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : service.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-bold text-white">{service.name}</span>
                        <span className="tag-cyber">{service.categoryLabel}</span>
                      </div>

                      <p className="text-sm text-white/60 line-clamp-2">{service.description}</p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-white/50">
                          <Clock className="w-4 h-4" />
                          {service.estimatedDuration}
                        </div>
                        <div className="flex items-center gap-1.5 text-white/50">
                          <ShieldCheck className="w-4 h-4" />
                          {service.warranty}
                        </div>
                        <div className="flex items-center gap-1.5 text-white/50">
                          <Users className="w-4 h-4" />
                          {service.providers.length}位服务商
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {service.guarantees.slice(0, 4).map((g, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded bg-white/5 text-white/60 border border-white/10"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyber-400">
                          ¥{priceRange.min}
                          {priceRange.min !== priceRange.max && (
                            <span className="text-base text-cyber-400/60"> - ¥{priceRange.max}</span>
                          )}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">价格区间</div>
                      </div>
                      <div className="flex items-center gap-1 text-cyber-400">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
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
                      <div className="px-5 pb-5 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                          <Zap className="w-4 h-4 text-cyber-400" />
                          <span className="text-sm font-medium text-white/80">服务商比价</span>
                        </div>

                        <div className={`grid gap-3 ${
                          service.providers.length >= 4
                            ? 'grid-cols-2 lg:grid-cols-4'
                            : service.providers.length >= 3
                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                            : 'grid-cols-1 sm:grid-cols-2'
                        }`}>
                          {service.providers.map((provider) => {
                            const isLowest = provider.price === lowest && service.providers.length > 1
                            return (
                              <div
                                key={provider.id}
                                className={`rounded-xl p-4 border transition-all duration-300 relative ${
                                  isLowest
                                    ? 'bg-warm-500/5 border-warm-500/30 shadow-lg shadow-warm-500/5'
                                    : 'bg-white/[0.02] border-white/5 hover:border-cyber-400/20'
                                }`}
                              >
                                {isLowest && (
                                  <div className="absolute -top-2 -right-2">
                                    <span className="tag-warm font-bold flex items-center gap-1">
                                      <BadgeCheck className="w-3 h-3" />
                                      最优价
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-full bg-cyber-400/20 flex items-center justify-center text-base font-bold text-cyber-400">
                                    {provider.name[0]}
                                  </div>
                                  <div>
                                    <div className="font-medium text-white text-sm">{provider.name}</div>
                                    <div className="flex items-center gap-1">
                                      <div className="flex">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-3 h-3 ${
                                              i < Math.floor(provider.rating)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-white/20'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-xs text-white/50">{provider.rating}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-xs text-white/40 mb-2">
                                  已完成 <span className="text-white/60 font-medium">{provider.totalOrders}单</span>
                                </div>

                                <div className="text-2xl font-bold text-white mb-2">¥{provider.price}</div>

                                <div className="space-y-1 text-xs text-white/50 mb-3">
                                  <div className="flex justify-between">
                                    <span>上门费</span>
                                    <span className="text-white/70">¥{provider.visitFee}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>人工费</span>
                                    <span className="text-white/70">¥{provider.laborFee}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>配件费</span>
                                    <span className="text-white/70">¥{provider.partsFee}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {provider.estimatedArrival}
                                  </span>
                                  <span>完成率 {provider.completionRate}%</span>
                                </div>

                                <div className="text-xs text-cyber-400/80 mb-3 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  质保{provider.warranty}
                                </div>

                                <div className="space-y-1 mb-4">
                                  {provider.guarantees.slice(0, 3).map((g, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
                                      <CheckCircle className="w-3 h-3 text-cyber-400/70 shrink-0" />
                                      <span className="truncate">{g}</span>
                                    </div>
                                  ))}
                                </div>

                                <button className={isLowest ? 'btn-warm w-full text-sm py-2' : 'btn-secondary w-full text-sm py-2'}>
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
