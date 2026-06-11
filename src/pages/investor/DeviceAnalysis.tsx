import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Clock, Droplets, Zap, Thermometer, AlertCircle } from "lucide-react"
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts"
import KPICard from "@/components/KPICard"
import { devices } from "@/data/devices"
import { energyTrend } from "@/data/mock"

const BRAND = "#0A2E3C"
const ORANGE = "#FF6B35"

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function DeviceAnalysis() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const [selectedId, setSelectedId] = useState(deviceId || devices[0].id)

  const device = useMemo(
    () => devices.find(d => d.id === selectedId) ?? devices[0],
    [selectedId]
  )

  const trend = useMemo(() => [...energyTrend].reverse(), [])

  const avgUsage = useMemo(
    () => Math.round(trend.reduce((s, t) => s + t.usage, 0) / trend.length),
    [trend]
  )
  const avgEnergy = useMemo(
    () => +(trend.reduce((s, t) => s + t.energy, 0) / trend.length).toFixed(1),
    [trend]
  )

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-[#0A2E3C]">设备分析</h2>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-[#0A2E3C] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
        >
          {devices.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Clock size={18} />} title="累计运行时长" value={device.totalRunHours} unit="h" />
        <KPICard icon={<Droplets size={18} />} title="日均用水量" value={avgUsage} unit="L" />
        <KPICard icon={<Zap size={18} />} title="日均能耗" value={avgEnergy} unit="kWh" />
        <KPICard icon={<Thermometer size={18} />} title="当前温度" value={device.temperature > 0 ? `${device.temperature}°C` : "—"} />
      </div>

      {device.faultCode && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-5 py-3"
        >
          <AlertCircle className="text-red-500 shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-red-700">故障码: {device.faultCode}</p>
            <p className="text-xs text-red-500">设备当前处于故障状态，请及时处理</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="运行时长（近30天）">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" interval={4} />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke={BRAND} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="能耗（近30天）">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" interval={4} />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="energy" stroke={ORANGE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="用水量（近30天）">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" interval={4} />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip />
            <Bar dataKey="usage" fill={BRAND} radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </motion.div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">{title}</h3>
      {children}
    </motion.div>
  )
}
