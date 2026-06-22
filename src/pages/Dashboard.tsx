import { motion } from 'framer-motion'
import { FileText, Store, Users } from 'lucide-react'
import { dashboardStats } from '@/data'
import { HotCategoriesChart, UpdateTrendChart } from '@/components/dashboard/Charts'
import TownshipHeatMap from '@/components/dashboard/HeatMap'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const statCards = [
  { label: '信息总量', value: dashboardStats.totalPosts, icon: FileText, color: 'text-jade-400' },
  { label: '入驻商家', value: dashboardStats.totalMerchants, icon: Store, color: 'text-ember-400' },
  { label: '注册用户', value: dashboardStats.totalUsers, icon: Users, color: 'text-blue-400' },
]

export default function Dashboard() {
  const maxUsers = Math.max(...dashboardStats.activeTownships.map(t => t.activeUsers))

  return (
    <div className="bg-rock-900 min-h-screen pb-10">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={sectionVariants} className="px-4 pt-6 pb-2">
          <h1 className="font-serif text-2xl font-bold text-white">数据看板</h1>
          <p className="text-rock-400 text-sm mt-1">数据更新于 2025年6月20日 18:00</p>
        </motion.div>

        <motion.div variants={sectionVariants} className="px-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-rock-800 rounded-xl p-5 border border-rock-700/50 shadow-lg shadow-black/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rock-400 text-sm">{label}</p>
                    <p className="font-number text-3xl font-bold text-white mt-1">
                      {value.toLocaleString()}
                    </p>
                  </div>
                  <Icon size={28} className={color} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={sectionVariants} className="px-4 mt-6">
          <h2 className="font-serif text-lg font-semibold text-white mb-3">热门分类</h2>
          <div className="bg-rock-800 rounded-xl p-4 border border-rock-700/50 shadow-lg shadow-black/20">
            <HotCategoriesChart />
          </div>
        </motion.div>

        <motion.div variants={sectionVariants} className="px-4 mt-6">
          <h2 className="font-serif text-lg font-semibold text-white mb-3">乡镇活跃度 TOP 10</h2>
          <div className="bg-rock-800 rounded-xl p-4 border border-rock-700/50 shadow-lg shadow-black/20">
            <div className="space-y-3">
              {dashboardStats.activeTownships.map((t) => (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="text-rock-300 text-sm w-16 flex-shrink-0 truncate">{t.name}</span>
                  <div className="flex-1 h-6 bg-rock-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-jade-600 to-jade-400 transition-all duration-500"
                      style={{ width: `${(t.activeUsers / maxUsers) * 100}%` }}
                    />
                  </div>
                  <span className="font-number text-sm text-rock-300 w-14 text-right">
                    {t.activeUsers.toLocaleString()}
                  </span>
                  <span className="font-number text-xs text-rock-500 w-12 text-right">
                    {t.postCount}帖
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={sectionVariants} className="px-4 mt-6">
          <h2 className="font-serif text-lg font-semibold text-white mb-3">更新趋势</h2>
          <div className="bg-rock-800 rounded-xl p-4 border border-rock-700/50 shadow-lg shadow-black/20">
            <UpdateTrendChart />
          </div>
        </motion.div>

        <motion.div variants={sectionVariants} className="px-4 mt-6">
          <h2 className="font-serif text-lg font-semibold text-white mb-3">乡镇热力图</h2>
          <div className="bg-rock-800 rounded-xl p-4 border border-rock-700/50 shadow-lg shadow-black/20">
            <TownshipHeatMap />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
