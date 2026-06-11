import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Star, Clock, MapPin, ShieldCheck, CheckCircle, ChevronDown, ChevronUp, Zap, BadgeCheck, Users, X, FileText, Scale } from 'lucide-react'
import { mockServices, categories } from '@/mocks/data'
import { useSearchParams } from 'react-router-dom'

const categoryFilters = [
  { key: 'all', label: '全部' },
  ...categories.slice(0, 5).map(c => ({ key: c.key, label: c.label })),
]

type ConfirmModalData = {
  service: typeof mockServices[number]
  provider: typeof mockServices[number]['providers'][number]
} | null

export default function Compare() {
  const [searchParams] = useSearchParams()
  const urlCategory = searchParams.get('category') || 'all'
  const [activeCategory, setActiveCategory] = useState(urlCategory)
  const [expandedId, setExpandedId] = useState<string | null>(mockServices[0]?.id || null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData>(null)

  useEffect(() => {
    if (urlCategory && urlCategory !== activeCategory) {
      setActiveCategory(urlCategory)
      const firstInCategory = mockServices.find(s => s.category === urlCategory)
      if (firstInCategory) setExpandedId(firstInCategory.id)
    }
  }, [urlCategory])

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
                      <div className="flex flex-col items-end gap-1">
                        {!isExpanded && (
                          <span className="text-[10px] text-cyber-400/70 animate-pulse">点击展开查看服务商比价</span>
                        )}
                        <div className="flex items-center justify-end gap-1 text-cyber-400">
                          {isExpanded ? (
                            <ChevronUp className="w-6 h-6" />
                          ) : (
                            <ChevronDown className="w-6 h-6 animate-bounce" />
                          )}
                        </div>
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

                                <div className="space-y-1 mb-3">
                                  {provider.guarantees.slice(0, 3).map((g, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
                                      <CheckCircle className="w-3 h-3 text-cyber-400/70 shrink-0" />
                                      <span className="truncate">{g}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex items-center gap-1 text-[10px] text-white/40 mb-4 hover:text-cyber-400/70 cursor-pointer transition-colors">
                                  <FileText className="w-3 h-3" />
                                  <span>查看服务合同条款</span>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setConfirmModal({ service, provider })
                                  }}
                                  className={isLowest ? 'btn-warm w-full text-sm py-2' : 'btn-secondary w-full text-sm py-2'}
                                >
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

      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card cyber-border w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-cyber-400/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-cyber-400" />
                  <h3 className="text-lg font-bold text-white">电子价目确认</h3>
                </div>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">服务项目</p>
                  <p className="text-white font-medium">{confirmModal.service.name}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">服务商</p>
                  <p className="text-cyber-400 font-medium">{confirmModal.provider.name}</p>
                </div>

                <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">上门费</span>
                    <span className="text-white">¥{confirmModal.provider.visitFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">人工费</span>
                    <span className="text-white">¥{confirmModal.provider.laborFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">配件费</span>
                    <span className="text-white">¥{confirmModal.provider.partsFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">质保期</span>
                    <span className="text-cyber-400">{confirmModal.provider.warranty}</span>
                  </div>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between">
                    <span className="text-white font-medium">合计</span>
                    <span className="text-2xl font-bold text-cyber-400">¥{confirmModal.provider.price}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-white/40 mb-2">服务保障</p>
                  {confirmModal.provider.guarantees.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                      <CheckCircle className="w-3.5 h-3.5 text-cyber-400 shrink-0" />
                      {g}
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-warm-500/10 border border-warm-500/20 p-3">
                  <p className="text-xs text-warm-400 leading-relaxed">
                    根据《家庭服务业管理暂行办法》，确认后将生成电子服务合同，服务过程全程可追溯。
                  </p>
                </div>
              </div>

              <div className="p-5 border-t border-cyber-400/10 flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="btn-secondary flex-1 text-sm py-2.5"
                >
                  返回比价
                </button>
                <button className="btn-warm flex-1 text-sm py-2.5 flex items-center justify-center gap-1">
                  <FileText className="w-4 h-4" />
                  确认预约
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
