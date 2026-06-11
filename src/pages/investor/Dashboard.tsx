import { useMemo } from "react"
import { motion } from "framer-motion"
import { Cpu, Wifi, Droplets, Banknote } from "lucide-react"
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts"
import KPICard from "@/components/KPICard"
import { devices } from "@/data/devices"
import { roiData } from "@/data/mock"

const BRAND = "#0A2E3C"
const ORANGE = "#FF6B35"

const mkSpark = (base: number, range: number) =>
  Array.from({ length: 7 }, () => ({ v: base + Math.random() * range }))

const sparkDevices = mkSpark(18, 6)
const sparkOnline = mkSpark(75, 12)
const sparkWater = mkSpark(5000, 2000)
const sparkRevenue = mkSpark(22000, 8000)

function MiniSpark({ data, color }: { data: { v: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Dashboard() {
  const statusCounts = useMemo(() => {
    const c = { online: 0, offline: 0, fault: 0 }
    devices.forEach(d => c[d.status]++)
    return c
  }, [])

  const statusPie = [
    { name: "在线", value: statusCounts.online, color: "#22c55e" },
    { name: "离线", value: statusCounts.offline, color: "#9ca3af" },
    { name: "故障", value: statusCounts.fault, color: "#ef4444" },
  ]

  const revenueTrend = useMemo(() => {
    const trend = roiData[0]?.trend.slice(-7) ?? []
    return trend.map(t => ({ date: t.date, revenue: t.revenue }))
  }, [])

  const topDevices = useMemo(
    () => [...devices].sort((a, b) => b.dailyWaterUsage - a.dailyWaterUsage).slice(0, 5),
    []
  )

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 p-6">
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Cpu size={18} />} title="设备总数" value={22} trend={5} unit="台">
          <MiniSpark data={sparkDevices} color="#22C55E" />
        </KPICard>
        <KPICard icon={<Wifi size={18} />} title="在线率" value="81.8%" trend={2.3}>
          <MiniSpark data={sparkOnline} color="#22C55E" />
        </KPICard>
        <KPICard icon={<Droplets size={18} />} title="日均用水量" value={5850} trend={8} unit="L">
          <MiniSpark data={sparkWater} color={ORANGE} />
        </KPICard>
        <KPICard icon={<Banknote size={18} />} title="日营收" value="¥27,150" trend={12}>
          <MiniSpark data={sparkRevenue} color={ORANGE} />
        </KPICard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">设备状态分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {statusPie.map(s => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-2">
            {statusPie.map(s => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                {s.name} {s.value}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">营收趋势（近7天）</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke={ORANGE} strokeWidth={2.5} dot={{ r: 3, fill: ORANGE }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">日用水量 TOP5 设备</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topDevices} layout="vertical" margin={{ left: 100 }}>
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" width={100} />
            <Tooltip />
            <Bar dataKey="dailyWaterUsage" fill={BRAND} radius={[0, 6, 6, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  )
}
