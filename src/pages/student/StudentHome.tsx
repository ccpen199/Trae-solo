import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Droplets, Wallet, ScanLine, Bluetooth, BluetoothSearching } from "lucide-react"
import { useStore } from "@/store"
import { devices } from "@/data/devices"
import type { DeviceStatus } from "@/types"

const statusColors: Record<DeviceStatus, string> = {
  online: "bg-green-400",
  offline: "bg-gray-400",
  fault: "bg-red-400",
}

const statusLabels: Record<DeviceStatus, string> = {
  online: "在线",
  offline: "离线",
  fault: "故障",
}

export default function StudentHome() {
  const navigate = useNavigate()
  const { currentUser } = useStore()
  const balance = currentUser?.balance ?? 0
  const boundDevices = devices.filter((d) =>
    currentUser?.boundDevices.includes(d.id)
  )

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24">
      <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/80 text-sm">当前余额</span>
          <button
            onClick={() => navigate("/student/recharge")}
            className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-white text-xs"
          >
            <Wallet className="w-3.5 h-3.5" />
            充值
          </button>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">¥{balance.toFixed(2)}</span>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => navigate("/student/bills")}
            className="flex-1 bg-white/15 rounded-xl py-2.5 text-white text-sm text-center"
          >
            账单记录
          </button>
          <button
            onClick={() => navigate("/student/recharge")}
            className="flex-1 bg-white/15 rounded-xl py-2.5 text-white text-sm text-center"
          >
            充值中心
          </button>
        </div>
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <BluetoothSearching className="w-5 h-5 text-[#0A2E3C]" />
          <span className="font-semibold text-[#0A2E3C]">蓝牙搜索</span>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xs text-[#FF6B35]"
          >
            扫描中...
          </motion.span>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl p-4 mb-6 border border-gray-100">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Bluetooth className="w-6 h-6 text-[#0A2E3C]" />
          </motion.div>
          <span className="text-sm text-gray-500">正在搜索附近设备...</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-[#0A2E3C]" />
            <span className="font-semibold text-[#0A2E3C]">已绑定设备</span>
          </div>
          <span className="text-xs text-gray-400">{boundDevices.length} 台</span>
        </div>

        <div className="space-y-3">
          {boundDevices.map((device, i) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() =>
                navigate("/student/dispense", {
                  state: { deviceId: device.id, deviceName: device.name, temperature: device.temperature },
                })
              }
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0A2E3C]/10 rounded-xl flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-[#0A2E3C]" />
                  </div>
                  <div>
                    <div className="font-medium text-[#0A2E3C] text-sm">{device.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{device.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{device.temperature}°C</span>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${statusColors[device.status]}`} />
                    <span className="text-xs text-gray-400">{statusLabels[device.status]}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate("/student/dispense")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <ScanLine className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}
