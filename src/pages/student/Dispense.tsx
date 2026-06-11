import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { Shield, ShieldCheck, Droplets, ArrowLeft, AlertTriangle } from "lucide-react"
import { useStore } from "@/store"
import { apiFetch } from "@/lib/api"

const temperatures = [85, 90, 95, 100]

export default function Dispense() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, dispenseSession, startDispense, stopDispense, updateDispense } = useStore()

  const stateDeviceId = (location.state as { deviceId?: string })?.deviceId || "DEV001"
  const stateDeviceName = (location.state as { deviceName?: string })?.deviceName || "1号教学楼-A1"
  const stateTemp = (location.state as { temperature?: number })?.temperature || 95

  const [selectedTemp, setSelectedTemp] = useState(stateTemp)
  const [isAuth, setIsAuth] = useState(false)
  const [volume, setVolume] = useState(0)
  const [amount, setAmount] = useState(0)
  const [actionMsg, setActionMsg] = useState("")
  const [actionError, setActionError] = useState("")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isActive = dispenseSession?.isActive ?? false
  const balance = currentUser?.balance ?? 0
  const lowBalance = balance < 3

  useEffect(() => {
    const timer = setTimeout(() => setIsAuth(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isActive && dispenseSession) {
      setVolume(dispenseSession.currentVolume)
      setAmount(dispenseSession.currentAmount)
      intervalRef.current = setInterval(() => {
        setVolume((v) => {
          const nv = Math.round((v + 0.1) * 10) / 10
          updateDispense(nv, Math.round(nv * 3 * 100) / 100)
          return nv
        })
        setAmount((a) => Math.round((a + 0.3) * 100) / 100)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, dispenseSession, updateDispense])

  const handleStart = async () => {
    if (lowBalance) return
    setActionMsg("")
    setActionError("")
    try {
      const response = await apiFetch("/api/student/dispense/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: stateDeviceId, temperature: selectedTemp, userId: currentUser?.id }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "取水启动失败")
      }
      setActionMsg(`取水会话已建立：${payload?.sessionId || "DSP-DEMO"}`)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "取水启动失败，已切换为本地演示")
    }
    startDispense(stateDeviceId, stateDeviceName, selectedTemp)
  }

  const handleStop = async () => {
    const session = dispenseSession
    const finalVolume = session?.currentVolume || volume
    const finalAmount = session?.currentAmount || amount
    stopDispense()
    setVolume(0)
    setAmount(0)
    setActionMsg("")
    setActionError("")
    try {
      const response = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          deviceId: session?.deviceId || stateDeviceId,
          volume: finalVolume,
          amount: finalAmount,
          temperature: session?.waterTemperature || selectedTemp,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "订单提交失败")
      }
      setActionMsg(payload?.message || `取水订单已提交：${payload?.order?.id || "ORD-DEMO"}`)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "订单提交失败，请稍后查看账单")
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0A2E3C] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium">{stateDeviceName}</span>
        </div>

        <div className="flex items-center gap-2">
          {isAuth ? (
            <ShieldCheck className="w-4 h-4 text-green-400" />
          ) : (
            <Shield className="w-4 h-4 text-yellow-400" />
          )}
          <span className={`text-xs ${isAuth ? "text-green-400" : "text-yellow-400"}`}>
            {isAuth ? "双向认证已建立" : "认证中..."}
          </span>
        </div>
      </div>

      <div className="px-5 -mt-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative bg-gradient-to-b from-[#0A2E3C]/5 to-white px-6 py-8 text-center">
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 -translate-y-1/2 h-24 w-[200%] opacity-10"
                style={{
                  background: "repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(10,46,60,0.3) 20px, rgba(10,46,60,0.3) 22px)",
                }}
              />
            </div>

            <div className="relative">
              <Droplets className="w-8 h-8 text-[#0A2E3C] mx-auto mb-3" />
              <div className="text-5xl font-bold text-[#0A2E3C]">{selectedTemp}°C</div>
              <div className="text-xs text-gray-400 mt-1">水温</div>
            </div>

            <div className="flex justify-center gap-10 mt-6 relative">
              <div>
                <div className="text-2xl font-bold text-[#0A2E3C]">
                  {isActive ? volume.toFixed(1) : "0.0"}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">水量 (L)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#FF6B35]">
                  ¥{isActive ? amount.toFixed(2) : "0.00"}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">金额 (元)</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="text-sm font-medium text-[#0A2E3C] mb-3">选择水温</div>
            <div className="flex gap-2">
              {temperatures.map((t) => (
                <button
                  key={t}
                  onClick={() => !isActive && setSelectedTemp(t)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTemp === t
                      ? "bg-[#0A2E3C] text-white"
                      : "bg-[#F5F7FA] text-gray-500 hover:bg-gray-200"
                  } ${isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {t}°C
                </button>
              ))}
            </div>
          </div>
        </div>

        {lowBalance && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm text-red-600">余额不足</span>
            <button
              onClick={() => navigate("/student/recharge")}
              className="ml-auto text-sm text-[#FF6B35] font-medium"
            >
              去充值
            </button>
          </motion.div>
        )}

        <button
          onClick={isActive ? handleStop : handleStart}
          disabled={!isActive && lowBalance}
          className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg text-white transition-all active:scale-[0.98] ${
            isActive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-[#FF6B35] hover:bg-[#e55a28] disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {isActive ? "停止取水" : "开始取水"}
        </button>

        {(actionMsg || actionError) && (
          <div className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
            actionError
              ? "border-red-100 bg-red-50 text-red-600"
              : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}>
            {actionError || actionMsg}
          </div>
        )}

        <div className="mt-4 text-center text-xs text-gray-400">
          余额: ¥{balance.toFixed(2)}
        </div>
      </div>
    </div>
  )
}
