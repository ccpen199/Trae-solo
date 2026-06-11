import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Wallet, CreditCard, CheckCircle } from "lucide-react"
import { useStore } from "@/store"
import { apiFetch } from "@/lib/api"

const quickAmounts = [10, 20, 50, 100]

export default function Recharge() {
  const navigate = useNavigate()
  const { currentUser, addBalance, addTransaction, transactions } = useStore()
  const balance = currentUser?.balance ?? 0

  const [selectedQuick, setSelectedQuick] = useState<number | null>(20)
  const [customAmount, setCustomAmount] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [successAmount, setSuccessAmount] = useState(0)
  const [successOrderNo, setSuccessOrderNo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const amount = customAmount ? parseFloat(customAmount) || 0 : (selectedQuick ?? 0)

  const rechargeHistory = useMemo(
    () =>
      transactions
        .filter((t) => t.volume === 0)
        .slice(0, 5),
    [transactions]
  )

  const handlePay = async () => {
    if (amount <= 0 || loading) return
    setLoading(true)
    setError("")
    try {
      const response = await apiFetch("/api/student/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, payMethod: "alipay", userId: currentUser?.id }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "充值提交失败")
      }
      const now = new Date().toISOString()
      const orderNo = payload?.orderNo || `RCG${Date.now()}`
      addBalance(amount)
      addTransaction({
        id: orderNo,
        userId: currentUser?.id || "U001",
        deviceId: "账户充值",
        startTime: now,
        endTime: now,
        waterTemperature: 0,
        volume: 0,
        amount,
        encrypted: true,
        nonce: `recharge_${orderNo}`,
      })
      setSuccessAmount(amount)
      setSuccessOrderNo(orderNo)
      setShowSuccess(true)
      setSelectedQuick(null)
      setCustomAmount("")
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "充值失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="bg-[#0A2E3C] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium">充值中心</span>
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-[#0A2E3C]" />
            <span className="text-sm text-gray-500">当前余额</span>
          </div>
          <div className="text-4xl font-bold text-[#0A2E3C]">¥{balance.toFixed(2)}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
          <div className="text-sm font-medium text-[#0A2E3C] mb-3">选择充值金额</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {quickAmounts.map((a) => (
              <button
                key={a}
                onClick={() => {
                  setSelectedQuick(a)
                  setCustomAmount("")
                }}
                className={`py-4 rounded-xl text-lg font-bold transition-all ${
                  selectedQuick === a
                    ? "bg-[#0A2E3C] text-white"
                    : "bg-[#F5F7FA] text-[#0A2E3C] border border-gray-200"
                }`}
              >
                ¥{a}
              </button>
            ))}
          </div>

          <div className="text-sm font-medium text-[#0A2E3C] mb-2">自定义金额</div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">¥</span>
            <input
              type="number"
              placeholder="输入金额"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setSelectedQuick(null)
              }}
              className="w-full pl-8 pr-4 py-3 bg-[#F5F7FA] rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0A2E3C] transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={amount <= 0 || loading}
          className="w-full py-4 bg-[#FF6B35] hover:bg-[#e55a28] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
        >
          <CreditCard className="w-5 h-5" />
          {loading ? "订单提交中..." : `提交充值订单并支付 ¥${amount.toFixed(2)}`}
        </button>
        {error && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6">
          <div className="text-sm font-medium text-[#0A2E3C] mb-3">充值记录</div>
          {rechargeHistory.length > 0 ? (
            <div className="space-y-2">
              {rechargeHistory.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100">
                  <div>
                    <div className="text-sm text-[#0A2E3C] font-medium">充值</div>
                    <div className="text-xs text-gray-400">{t.startTime}</div>
                  </div>
                  <span className="text-sm font-medium text-green-500">+¥{t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">暂无充值记录</div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
              <div className="text-lg font-bold text-[#0A2E3C]">充值成功</div>
              <div className="text-2xl font-bold text-[#FF6B35]">¥{successAmount.toFixed(2)}</div>
              {successOrderNo && (
                <div className="rounded-lg bg-gray-50 px-3 py-1.5 font-mono text-xs text-gray-500">
                  订单号 {successOrderNo}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
