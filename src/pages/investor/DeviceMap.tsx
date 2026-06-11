import { useState, useMemo } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import { motion } from "framer-motion"
import { Wifi, WifiOff, AlertTriangle } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { devices } from "@/data/devices"
import type { DeviceStatus } from "@/types"

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: "", iconUrl: "", shadowUrl: "" })

const statusColor: Record<DeviceStatus, string> = {
  online: "#22c55e",
  offline: "#9ca3af",
  fault: "#ef4444",
}

const statusLabel: Record<DeviceStatus, string> = {
  online: "在线",
  offline: "离线",
  fault: "故障",
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function DeviceMap() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c = { total: devices.length, online: 0, offline: 0, fault: 0 }
    devices.forEach(d => c[d.status]++)
    return c
  }, [])

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 relative">
        <MapContainer center={[30.2741, 120.1551]} zoom={16} className="h-full w-full z-0" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {devices.map(d => (
            <CircleMarker
              key={d.id}
              center={[d.lat, d.lng]}
              radius={hoveredId === d.id ? 14 : 10}
              pathOptions={{
                color: statusColor[d.status],
                fillColor: statusColor[d.status],
                fillOpacity: hoveredId === d.id ? 0.9 : 0.6,
                weight: 2,
              }}
              eventHandlers={{
                mouseover: () => setHoveredId(d.id),
                mouseout: () => setHoveredId(null),
              }}
            >
              <Popup>
                <div className="text-sm leading-relaxed min-w-[160px]">
                  <p className="font-bold text-[#0A2E3C] mb-1">{d.name}</p>
                  <p className="text-gray-500">{d.location}</p>
                  <p className="mt-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1"
                      style={{ background: statusColor[d.status] }}
                    />
                    {statusLabel[d.status]}
                  </p>
                  <p className="text-gray-500">温度: {d.temperature > 0 ? `${d.temperature}°C` : "—"}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#0A2E3C] mb-3">设备概览</h2>
          <div className="grid grid-cols-2 gap-2">
            <StatBox icon={<Wifi size={14} />} label="在线" value={counts.online} color="text-emerald-600" />
            <StatBox icon={<WifiOff size={14} />} label="离线" value={counts.offline} color="text-gray-500" />
            <StatBox icon={<AlertTriangle size={14} />} label="故障" value={counts.fault} color="text-red-500" />
            <StatBox label="总计" value={counts.total} color="text-[#0A2E3C]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {devices.map(d => (
            <div
              key={d.id}
              onMouseEnter={() => setHoveredId(d.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                hoveredId === d.id ? "bg-[#0A2E3C]/5" : "hover:bg-gray-50"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: statusColor[d.status] }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#0A2E3C] truncate">{d.name}</p>
                <p className="text-xs text-gray-400 truncate">{d.location}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{d.temperature > 0 ? `${d.temperature}°C` : "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function StatBox({ icon, label, value, color }: { icon?: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 py-2">
      {icon && <span className={color}>{icon}</span>}
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}
