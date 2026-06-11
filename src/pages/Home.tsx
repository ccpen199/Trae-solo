import { useNavigate } from 'react-router-dom'
import { Wind, Flame, Waves, Snowflake, Monitor, Wrench, Star, Clock, MapPin } from 'lucide-react'
import { mockServices, mockEngineers, categories } from '@/mocks/data'
import { motion } from 'framer-motion'

const iconMap: Record<string, React.ElementType> = {
  Wind, Flame, Waves, Snowflake, Monitor, Wrench,
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-800 via-navy-700 to-navy-600 py-20 grid-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-cyber-400/20 animate-float"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${Math.random() * 4 + 4}s`,
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyber-400/40 to-transparent animate-scan-line" />
      </div>
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          <span className="gradient-text-cyber">智能家修</span>
          <span className="text-navy-50"> 透明服务</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-navy-200 text-lg mb-8 max-w-xl mx-auto"
        >
          AI智能诊断 · 透明报价 · 直播服务 · 品质保障
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/diagnosis')}
            className="btn-primary animate-pulse-slow"
          >
            AI智能诊断
          </button>
          <button
            onClick={() => navigate('/compare')}
            className="btn-secondary"
          >
            服务比价
          </button>
        </motion.div>
      </div>
    </section>
  )
}

function CategorySection() {
  return (
    <section className="container mx-auto px-4 py-12">
      <motion.h2
        variants={fadeUp} initial="hidden" whileInView="visible" custom={0} viewport={{ once: true }}
        className="text-2xl font-bold mb-6 gradient-text-cyber"
      >
        服务品类
      </motion.h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map((cat, i) => {
          const Icon = iconMap[cat.icon]
          return (
            <motion.div
              key={cat.key}
              variants={fadeUp} initial="hidden" whileInView="visible" custom={i + 1} viewport={{ once: true }}
              className="glass-card glass-card-hover cyber-border flex flex-col items-center gap-2 py-6 px-2 cursor-pointer transition-all"
            >
              {Icon && <Icon className="w-8 h-8 text-cyber-400" />}
              <span className="text-sm text-navy-100">{cat.label}</span>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function PopularServicesSection() {
  const navigate = useNavigate()

  return (
    <section className="container mx-auto px-4 py-12">
      <motion.h2
        variants={fadeUp} initial="hidden" whileInView="visible" custom={0} viewport={{ once: true }}
        className="text-2xl font-bold mb-6 gradient-text-cyber"
      >
        热门服务
      </motion.h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {mockServices.map((svc, i) => {
          const prices = svc.providers.map(p => p.price)
          const minPrice = Math.min(...prices)
          const maxPrice = Math.max(...prices)
          const avgRating = svc.providers.reduce((s, p) => s + p.rating, 0) / svc.providers.length
          return (
            <motion.div
              key={svc.id}
              variants={fadeUp} initial="hidden" whileInView="visible" custom={i + 1} viewport={{ once: true }}
              className="glass-card glass-card-hover cyber-border min-w-[260px] max-w-[280px] p-5 flex flex-col gap-3 shrink-0"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-navy-50 text-sm">{svc.name}</h3>
                <span className="tag-cyber">{svc.categoryLabel}</span>
              </div>
              <div className="text-cyber-400 font-bold text-lg">
                ¥{minPrice} - ¥{maxPrice}
              </div>
              <div className="flex items-center gap-3 text-xs text-navy-200">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-warm-400 fill-warm-400" />
                  {avgRating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {svc.estimatedDuration}
                </span>
              </div>
              <button
                onClick={() => navigate('/compare')}
                className="btn-primary text-sm py-1.5 mt-auto"
              >
                立即预约
              </button>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function RecommendedEngineersSection() {
  return (
    <section className="container mx-auto px-4 py-12">
      <motion.h2
        variants={fadeUp} initial="hidden" whileInView="visible" custom={0} viewport={{ once: true }}
        className="text-2xl font-bold mb-6 gradient-text-cyber"
      >
        推荐工程师
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockEngineers.map((eng, i) => (
          <motion.div
            key={eng.id}
            variants={fadeUp} initial="hidden" whileInView="visible" custom={i + 1} viewport={{ once: true }}
            className="glass-card glass-card-hover cyber-border p-5 flex gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center text-navy-900 font-bold text-lg shrink-0">
              {eng.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-navy-50">{eng.name}</span>
                {eng.isOnline && (
                  <span className="w-2 h-2 rounded-full bg-cyber-400 animate-pulse" />
                )}
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {eng.skills.map(s => (
                  <span key={s} className="tag-cyber">{s}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-navy-200">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-warm-400 fill-warm-400" />
                  {eng.rating}
                </span>
                <span>完成率 {eng.completionRate}%</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {eng.distance}km
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div>
      <HeroSection />
      <CategorySection />
      <PopularServicesSection />
      <RecommendedEngineersSection />
    </div>
  )
}
