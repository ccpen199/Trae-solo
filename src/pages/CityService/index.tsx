import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bus, Mountain, Stethoscope, GraduationCap, ChevronRight } from 'lucide-react'

const entries = [
  {
    title: '扫码乘车',
    subtitle: '公交地铁一码通行',
    icon: Bus,
    to: '/city-service/transport',
    gradient: 'bg-gradient-to-br from-blue-500 to-purple-600',
  },
  {
    title: '景点预约',
    subtitle: '热门景点在线预约',
    icon: Mountain,
    to: '/city-service/scenic',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
  },
  {
    title: '医院挂号',
    subtitle: '预约挂号智慧就医',
    icon: Stethoscope,
    to: '/city-service/hospital',
    gradient: 'bg-gradient-to-br from-red-500 to-pink-600',
  },
  {
    title: '教育缴费',
    subtitle: '学费杂费一键缴纳',
    icon: GraduationCap,
    to: '/city-service/education',
    gradient: 'bg-gradient-to-br from-yellow-500 to-orange-500',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function CityService() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="section-title">城市服务</h1>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {entries.map(({ title, subtitle, icon: Icon, to, gradient }) => (
            <motion.div key={to} variants={itemVariants}>
              <Link
                to={to}
                className="block rounded-2xl p-6 text-white shadow-lg
                           transition-all duration-300 hover:scale-[1.03] hover:shadow-xl
                           group relative overflow-hidden"
              >
                <div className={`absolute inset-0 ${gradient}`} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="text-white/80 text-sm mt-1">{subtitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
