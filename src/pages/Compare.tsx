import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Star, Clock, MapPin, ShieldCheck, CheckCircle, ChevronDown, ChevronUp, Zap, BadgeCheck, Users, X, FileText, Scale } from 'lucide-react'
import { mockServices, categories, mockEngineers } from '@/mocks/data'
import { useSearchParams, useNavigate } from 'react-router-dom'

const categoryFilters = [
  { key: 'all', label: '全部' },
  ...categories.slice(0, 5).map(c => ({ key: c.key, label: c.label })),
]

type ConfirmModalData = {
  service: typeof mockServices[number]
  provider: typeof mockServices[number]['providers'][number]
} | null

export default function Compare() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlCategory = searchParams.get('category') || 'all'
  const [activeCategory, setActiveCategory] = useState(urlCategory)
  const [expandedId, setExpandedId] = useState<string | null>(mockServices[0]?.id || null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData>(null)
  const [bookingStep, setBookingStep] = useState(1)
  const [agreementChecked, setAgreementChecked] = useState(true)

  const contractNo = useMemo(() => `HT-${Date.now()}`, [confirmModal])
  const workOrderNo = useMemo(() => `WO-${Math.floor(10000 + Math.random() * 90000)}`, [confirmModal])
  const assignedEngineer = mockEngineers[0]

  useEffect(() => { if (urlCategory && urlCategory !== activeCategory) setActiveCategory(urlCategory) }, [urlCategory])
  useEffect(() => {
    const firstInCategory = activeCategory === 'all' ? mockServices[0] : mockServices.find(s => s.category === activeCategory)
    if (firstInCategory) setExpandedId(firstInCategory.id)
  }, [activeCategory])

  const filtered = activeCategory === 'all' ? mockServices : mockServices.filter((s) => s.category === activeCategory)
  const getPriceRange = (service: typeof mockServices[number]) => {
    const prices = service.providers.map(p => p.price)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }
  const getLowestPrice = (service: typeof mockServices[number]) => Math.min(...service.providers.map((p) => p.price))

  const StepIndicator = () => (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              bookingStep >= step ? 'bg-cyber-400 text-navy-900 shadow-lg shadow-cyber-400/30' : 'bg-white/5 text-white/40 border border-white/10'
            }`}>
              {bookingStep > step ? <CheckCircle className="w-4 h-4" /> : step}
            </div>
            {i < 2 && <div className={`w-10 h-0.5 rounded transition-all duration-300 ${bookingStep > step ? 'bg-cyber-400' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>
    </div>
  )

  const ModalHeader = () => (
    <div className="p-5 border-b border-cyber-400/10 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {bookingStep === 1 && <Scale className="w-5 h-5 text-cyber-400" />}
        {bookingStep === 2 && <FileText className="w-5 h-5 text-cyber-400" />}
        {bookingStep === 3 && <CheckCircle className="w-5 h-5 text-green-400" />}
        <h3 className="text-lg font-bold text-white">
          {bookingStep === 1 && '电子价目确认'}
          {bookingStep === 2 && '电子服务合同签署'}
          {bookingStep === 3 && '预约成功'}
        </h3>
      </div>
      <button onClick={() => setConfirmModal(null)} className="text-white/40 hover:text-white transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  )

  const Step1 = () => confirmModal && (
    <div className="space-y-4">
      <div><p className="text-xs text-white/40 mb-1">服务项目</p><p className="text-white font-medium">{confirmModal.service.name}</p></div>
      <div><p className="text-xs text-white/40 mb-1">服务商</p><p className="text-cyber-400 font-medium">{confirmModal.provider.name}</p></div>
      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-white/60">上门费</span><span className="text-white">¥{confirmModal.provider.visitFee}</span></div>
        <div className="flex justify-between text-sm"><span className="text-white/60">人工费</span><span className="text-white">¥{confirmModal.provider.laborFee}</span></div>
        <div className="flex justify-between text-sm"><span className="text-white/60">配件费</span><span className="text-white">¥{confirmModal.provider.partsFee}</span></div>
        <div className="flex justify-between text-sm"><span className="text-white/60">质保期</span><span className="text-cyber-400">{confirmModal.provider.warranty}</span></div>
        <div className="h-px bg-white/10 my-2" />
        <div className="flex justify-between"><span className="text-white font-medium">合计</span><span className="text-2xl font-bold text-cyber-400">¥{confirmModal.provider.price}</span></div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-white/40 mb-2">服务保障</p>
        {confirmModal.provider.guarantees.map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-white/70">
            <CheckCircle className="w-3.5 h-3.5 text-cyber-400 shrink-0" />{g}
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-warm-500/10 border border-warm-500/20 p-3">
        <p className="text-xs text-warm-400 leading-relaxed">根据《家庭服务业管理暂行办法》，确认后将生成电子服务合同，服务过程全程可追溯。</p>
      </div>
    </div>
  )

  const Step2 = () => confirmModal && (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-br from-cyber-400/5 to-transparent border border-cyber-400/20 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <span className="text-xs text-white/40">合同编号</span>
          <span className="text-xs font-mono text-cyber-400">{contractNo}</span>
        </div>
        <div className="flex justify-between"><span className="text-sm text-white/60">甲方（客户）</span><span className="text-sm text-white font-medium">李女士</span></div>
        <div className="flex justify-between"><span className="text-sm text-white/60">乙方（服务商）</span><span className="text-sm text-cyber-400 font-medium">{confirmModal.provider.name}</span></div>
        <div className="flex justify-between"><span className="text-sm text-white/60">服务内容</span><span className="text-sm text-white font-medium">{confirmModal.service.name}</span></div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-sm text-white/60">合同金额</span>
          <span className="text-3xl font-bold text-cyber-400 tracking-tight">¥{confirmModal.provider.price}</span>
        </div>
        <div className="flex justify-between"><span className="text-sm text-white/60">质保条款</span><span className="text-sm text-green-400 font-medium">{confirmModal.provider.warranty}</span></div>
        <div className="pt-2 mt-2 border-t border-white/5">
          <p className="text-[11px] text-white/40 leading-relaxed"><span className="text-warm-400">合规提示：</span>根据《家庭服务业管理暂行办法》第12、14条</p>
        </div>
      </div>
      <div
        onClick={() => setAgreementChecked(!agreementChecked)}
        className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
          agreementChecked ? 'bg-cyber-400/10 border-cyber-400/40' : 'bg-white/[0.02] border-white/10 hover:border-white/20'
        }`}
      >
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 border-2 ${
          agreementChecked ? 'bg-cyber-400 border-cyber-400 shadow-lg shadow-cyber-400/30' : 'border-white/30'
        }`}>
          {agreementChecked && <CheckCircle className="w-4 h-4 text-navy-900" />}
        </div>
        <span className={`text-sm leading-relaxed ${agreementChecked ? 'text-white' : 'text-white/70'}`}>我已阅读并同意以上服务条款</span>
      </div>
      <div className="space-y-1.5">
        {confirmModal.provider.guarantees.slice(0, 2).map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-white/50">
            <ShieldCheck className="w-3 h-3 text-cyber-400/60 shrink-0" />{g}
          </div>
        ))}
      </div>
    </div>
  )

  const Step3 = () => confirmModal && (
    <div className="space-y-4">
      <div className="flex justify-center py-2">
        <motion.div
          initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center ring-4 ring-green-500/30"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', damping: 15 }}>
            <CheckCircle className="w-12 h-12 text-green-400" strokeWidth={2.5} />
          </motion.div>
        </motion.div>
      </div>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center text-lg font-bold text-white">工单已生成</motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-xl bg-gradient-to-br from-green-400/5 to-transparent border border-green-400/20 p-4 space-y-3"
      >
        <div className="flex items-center justify-between"><span className="text-sm text-white/60">工单号</span><span className="text-sm font-mono font-bold text-cyber-400">{workOrderNo}</span></div>
        <div className="flex items-center justify-between"><span className="text-sm text-white/60">预计上门时间</span><span className="text-sm text-white font-medium">明天 09:00-11:00</span></div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">服务工程师</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-cyber-400/20 flex items-center justify-center text-xs font-bold text-cyber-400">{assignedEngineer.name[0]}</div>
            <span className="text-sm text-white font-medium">{assignedEngineer.name}</span>
          </div>
        </div>
        <div className="flex items-center justify-between"><span className="text-sm text-white/60">工单金额</span><span className="text-xl font-bold text-cyber-400">¥{confirmModal.provider.price}</span></div>
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-sm text-white/60">合同状态</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyber-400/15 text-cyber-400 border border-cyber-400/30">已签署待存证</span>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="rounded-lg bg-cyber-400/5 border border-cyber-400/10 p-3">
        <p className="text-[11px] text-white/50 leading-relaxed text-center">服务工程师将在上门前 30 分钟电话联系您，请保持手机畅通</p>
      </motion.div>
    </div>
  )

  const ModalFooter = () => (
    <div className="p-5 border-t border-cyber-400/10 flex gap-3">
      {bookingStep === 1 && (
        <>
          <button onClick={() => setConfirmModal(null)} className="btn-secondary flex-1 text-sm py-2.5">返回比价</button>
          <button onClick={() => setBookingStep(2)} className="btn-warm flex-1 text-sm py-2.5 flex items-center justify-center gap-1">
            <FileText className="w-4 h-4" />下一步：签署合同
          </button>
        </>
      )}
      {bookingStep === 2 && (
        <>
          <button onClick={() => setBookingStep(1)} className="btn-secondary flex-1 text-sm py-2.5">返回修改</button>
          <button
            onClick={() => agreementChecked && setBookingStep(3)} disabled={!agreementChecked}
            className={`flex-1 text-sm py-2.5 flex items-center justify-center gap-1 transition-all duration-200 ${
              agreementChecked ? 'btn-warm' : 'bg-white/5 text-white/30 cursor-not-allowed rounded-lg border border-white/5'
            }`}
          >
            <BadgeCheck className="w-4 h-4" />确认签署并生成工单
          </button>
        </>
      )}
      {bookingStep === 3 && (
        <>
          <button onClick={() => setConfirmModal(null)} className="btn-secondary flex-1 text-sm py-2.5">关闭</button>
          <button onClick={() => { setConfirmModal(null); navigate('/engineer') }} className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-1">
            <FileText className="w-4 h-4" />查看工单详情
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold gradient-text-cyber">服务商比价</h1>
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((f) => (
            <button
              key={f.key} onClick={() => setActiveCategory(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                activeCategory === f.key
                  ? 'bg-cyber-400/20 border-cyber-400 text-cyber-400 shadow-lg shadow-cyber-400/10'
                  : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white/80'
              }`}
            >{f.label}</button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((service) => {
            const isExpanded = expandedId === service.id
            const priceRange = getPriceRange(service)
            const lowest = getLowestPrice(service)
            return (
              <div key={service.id} className={`glass-card glass-card-hover transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-1 ring-cyber-400/30' : ''}`}>
                <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : service.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-bold text-white">{service.name}</span>
                        <span className="tag-cyber">{service.categoryLabel}</span>
                      </div>
                      <p className="text-sm text-white/60 line-clamp-2">{service.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-white/50"><Clock className="w-4 h-4" />{service.estimatedDuration}</div>
                        <div className="flex items-center gap-1.5 text-white/50"><ShieldCheck className="w-4 h-4" />{service.warranty}</div>
                        <div className="flex items-center gap-1.5 text-white/50"><Users className="w-4 h-4" />{service.providers.length}位服务商</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {service.guarantees.slice(0, 4).map((g, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs rounded bg-white/5 text-white/60 border border-white/10">{g}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyber-400">
                          ¥{priceRange.min}
                          {priceRange.min !== priceRange.max && <span className="text-base text-cyber-400/60"> - ¥{priceRange.max}</span>}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">价格区间</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {!isExpanded && <span className="text-[10px] text-cyber-400/70 animate-pulse">点击展开查看服务商比价</span>}
                        <div className="flex items-center justify-end gap-1 text-cyber-400">
                          {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6 animate-bounce" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-4 border-t border-cyber-400/20 bg-gradient-to-b from-cyber-400/[0.02] to-transparent">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cyber-400/20 flex items-center justify-center"><Zap className="w-4 h-4 text-cyber-400" /></div>
                            <div>
                              <span className="text-base font-bold text-white">服务商比价</span>
                              <p className="text-[10px] text-white/40">共{service.providers.length}位服务商，点击查看详情</p>
                            </div>
                          </div>
                          <span className="text-xs text-cyber-400/70 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" />明码标价</span>
                        </div>
                        <div className={`grid gap-3 ${
                          service.providers.length >= 4 ? 'grid-cols-2 lg:grid-cols-4'
                            : service.providers.length >= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                            : 'grid-cols-1 sm:grid-cols-2'
                        }`}>
                          {service.providers.map((provider) => {
                            const isLowest = provider.price === lowest && service.providers.length > 1
                            return (
                              <div key={provider.id} className={`rounded-xl p-4 border-2 transition-all duration-300 relative ${
                                isLowest ? 'bg-warm-500/10 border-warm-500/50 shadow-xl shadow-warm-500/10 scale-[1.02]'
                                  : 'bg-navy-800/40 border-cyber-400/20 hover:border-cyber-400/50 hover:shadow-lg hover:shadow-cyber-400/10'
                              }`}>
                                {isLowest && (
                                  <div className="absolute -top-2 -right-2">
                                    <span className="tag-warm font-bold flex items-center gap-1"><BadgeCheck className="w-3 h-3" />最优价</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-full bg-cyber-400/20 flex items-center justify-center text-base font-bold text-cyber-400">{provider.name[0]}</div>
                                  <div>
                                    <div className="font-medium text-white text-sm">{provider.name}</div>
                                    <div className="flex items-center gap-1">
                                      <div className="flex">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(provider.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                                        ))}
                                      </div>
                                      <span className="text-xs text-white/50">{provider.rating}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-white/40 mb-2">已完成 <span className="text-white/60 font-medium">{provider.totalOrders}单</span></div>
                                <div className="text-2xl font-bold text-white mb-2">¥{provider.price}</div>
                                <div className="space-y-1 text-xs text-white/50 mb-3">
                                  <div className="flex justify-between"><span>上门费</span><span className="text-white/70">¥{provider.visitFee}</span></div>
                                  <div className="flex justify-between"><span>人工费</span><span className="text-white/70">¥{provider.laborFee}</span></div>
                                  <div className="flex justify-between"><span>配件费</span><span className="text-white/70">¥{provider.partsFee}</span></div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{provider.estimatedArrival}</span>
                                  <span>完成率 {provider.completionRate}%</span>
                                </div>
                                <div className="text-xs text-cyber-400/80 mb-3 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />质保{provider.warranty}</div>
                                <div className="space-y-1 mb-3">
                                  {provider.guarantees.slice(0, 3).map((g, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
                                      <CheckCircle className="w-3 h-3 text-cyber-400/70 shrink-0" />
                                      <span className="truncate">{g}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-white/40 mb-4 hover:text-cyber-400/70 cursor-pointer transition-colors">
                                  <FileText className="w-3 h-3" /><span>查看服务合同条款</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setBookingStep(1); setAgreementChecked(true); setConfirmModal({ service, provider }) }}
                                  className={isLowest ? 'btn-warm w-full text-sm py-2' : 'btn-secondary w-full text-sm py-2'}
                                >选择此服务商</button>
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

        {filtered.length === 0 && <div className="glass-card p-12 text-center text-white/30">暂无该分类下的服务项目</div>}
      </div>

      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card cyber-border w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader />
              <StepIndicator />
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={bookingStep}
                    initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="p-5 min-h-[420px]"
                  >
                    {bookingStep === 1 && <Step1 />}
                    {bookingStep === 2 && <Step2 />}
                    {bookingStep === 3 && <Step3 />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <ModalFooter />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
