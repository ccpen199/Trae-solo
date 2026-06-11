import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Droplets, Coins, Banknote, Wrench } from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts"
import KPICard from "@/components/KPICard"
import { roiData } from "@/data/mock"

const BRAND = "#0A2E3C"
const ORANGE = "#FF6B35"

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function ROI() {
  const [activeIdx, setActiveIdx] = useState(0)
  const project = roiData[activeIdx]

  const trendSlice = useMemo(() => project.trend.slice(-30), [project])

  const waterfallData = useMemo(() => {
    const latest = project.trend[project.trend.length - 1]
    return [
      { name: "营收", value: latest.revenue, fill: ORANGE },
      { name: "维保成本", value: -latest.cost, fill: "#ef4444" },
      { name: "净利润", value: latest.revenue - latest.cost, fill: BRAND },
    ]
  }, [project])

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        {roiData.map((p, i) => (
          <button
            key={p.projectId}
            onClick={() => setActiveIdx(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              i === activeIdx
                ? "bg-[#0A2E3C] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#0A2E3C]/30"
            }`}
          >
            {p.projectName}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-6 rounded-xl bg-[#0A2E3C] p-6 text-white">
        <div>
          <p className="text-sm text-gray-300 mb-1">投资回报率 (ROI)</p>
          <p className="text-5xl font-bold">{project.dailyROI}%</p>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 mb-2">
          <TrendingUp size={18} />
          <span className="text-sm font-medium">正向回报</span>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-400 mb-1">计算公式</p>
          <p className="text-sm text-gray-300">日均用水量 × 单价 － 维保成本</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Droplets size={18} />} title="日均用水量" value={project.dailyWaterVolume} unit="L" />
        <KPICard icon={<Coins size={18} />} title="单价" value={`¥${project.unitPrice}`} unit="/L" />
        <KPICard icon={<Banknote size={18} />} title="日营收" value={`¥${project.dailyRevenue.toLocaleString()}`} />
        <KPICard icon={<Wrench size={18} />} title="维保成本" value={`¥${project.maintenanceCost.toLocaleString()}`} unit="/日" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">营收 vs 成本</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={48}>
                {waterfallData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">ROI 趋势（近30天）</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendSlice}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" interval={4} />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="roi" stroke={ORANGE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-600 px-5 pt-5 pb-3">项目对比</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">项目</th>
                <th className="px-5 py-3 font-medium">日均用水量</th>
                <th className="px-5 py-3 font-medium">单价</th>
                <th className="px-5 py-3 font-medium">日营收</th>
                <th className="px-5 py-3 font-medium">维保成本</th>
                <th className="px-5 py-3 font-medium">ROI</th>
              </tr>
            </thead>
            <tbody>
              {roiData.map(p => (
                <tr key={p.projectId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-[#0A2E3C]">{p.projectName}</td>
                  <td className="px-5 py-3">{p.dailyWaterVolume.toLocaleString()} L</td>
                  <td className="px-5 py-3">¥{p.unitPrice}/L</td>
                  <td className="px-5 py-3">¥{p.dailyRevenue.toLocaleString()}</td>
                  <td className="px-5 py-3">¥{p.maintenanceCost.toLocaleString()}</td>
                  <td className="px-5 py-3 font-bold text-[#FF6B35]">{p.dailyROI}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
