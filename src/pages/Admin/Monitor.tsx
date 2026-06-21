import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, Clock, CheckCircle, Star, AlertTriangle,
  ChevronDown, BarChart3, Activity,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { mockEfficiencyMetrics } from '@/data/mockData'

const metrics = mockEfficiencyMetrics
const totalApplications = metrics.reduce((s, m) => s + m.totalApplications, 0)
const avgDays = +(metrics.reduce((s, m) => s + m.avgProcessingDays, 0) / metrics.length).toFixed(1)
const avgCompletion = +(metrics.reduce((s, m) => s + m.completionRate, 0) / metrics.length).toFixed(1)
const avgSatisfaction = +(metrics.reduce((s, m) => s + m.satisfactionAvg, 0) / metrics.length).toFixed(1)

const allInterruptions = metrics.flatMap(m => m.abnormalInterruptions)

const typeBadge: Record<string, string> = {
  '材料不全': 'bg-yellow-500/20 text-yellow-400',
  '系统超时': 'bg-blue-500/20 text-blue-400',
  '用户放弃': 'bg-gray-500/20 text-gray-400',
  '审核驳回': 'bg-red-500/20 text-red-400',
}

const pieColors = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444']

const lineColors = ['#eab308', '#3b82f6', '#22c55e']

const trendDates = metrics[0].trendData.map(d => d.date)
const combinedTrend = trendDates.map((date, i) => {
  const point: Record<string, string | number> = { date }
  metrics.forEach(m => { point[m.serviceName] = m.trendData[i].applications })
  return point
})

const barData = metrics.map(m => ({ name: m.serviceName, days: m.avgProcessingDays }))

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
}

export default function Monitor() {
  const [selectedService, setSelectedService] = useState(0)
  const selected = metrics[selectedService]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold">服务效能监控面板</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '服务总量', value: totalApplications.toLocaleString(), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: '平均办结天数', value: avgDays, icon: Clock, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: '综合完成率', value: `${avgCompletion}%`, icon: CheckCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: '平均满意度', value: `${avgSatisfaction}/5`, icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`${card.bg} rounded-xl p-5 border border-gray-700/50`}
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl p-5 border border-gray-700/50"
          style={{ backgroundColor: '#1f2937' }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            办件量趋势
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={combinedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
              <Legend />
              {metrics.map((m, i) => (
                <Line key={m.serviceId} type="monotone" dataKey={m.serviceName} stroke={lineColors[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl p-5 border border-gray-700/50"
          style={{ backgroundColor: '#1f2937' }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            平均办理天数对比
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
              <Bar dataKey="days" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl p-5 border border-gray-700/50"
          style={{ backgroundColor: '#1f2937' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              满意度分布
            </h2>
            <div className="relative">
              <select
                value={selectedService}
                onChange={e => setSelectedService(Number(e.target.value))}
                className="appearance-none bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 pr-8 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {metrics.map((m, i) => (
                  <option key={m.serviceId} value={i}>{m.serviceName}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={selected.satisfactionDistribution.map(d => ({ name: `${d.score}星`, value: d.count }))}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {selected.satisfactionDistribution.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-xl p-5 border border-gray-700/50"
          style={{ backgroundColor: '#1f2937' }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            异常中断分析
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-2">申请编号</th>
                  <th className="text-left py-2 px-2">中断类型</th>
                  <th className="text-left py-2 px-2">发生时间</th>
                  <th className="text-left py-2 px-2">描述</th>
                  <th className="text-left py-2 px-2">处理状态</th>
                </tr>
              </thead>
              <tbody>
                {allInterruptions.map(item => (
                  <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                    <td className="py-2 px-2 font-mono text-xs">{item.applicationId}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${typeBadge[item.type]}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-300 text-xs">{item.occurredAt}</td>
                    <td className="py-2 px-2 text-gray-300 text-xs">{item.description}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${item.resolution ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {item.resolution ? '已解决' : '未解决'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
