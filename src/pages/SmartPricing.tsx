import { useState } from "react"
import { motion } from "framer-motion"
import {
  Calculator, TrendingUp, BarChart3, ArrowRight, Info, DollarSign, Home,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts"
import { districts, pricingResult } from "@/data/mockData"

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const propertyTypes = ["自有", "租赁", "合作"] as const
const industries = ["餐饮", "零售", "美业", "服装", "数码", "教育", "金融服务"] as const

function RangeBar({ min, avg, max }: { min: number; avg: number; max: number }) {
  const range = max - min
  const leftPercent = 0
  const avgPercent = ((avg - min) / range) * 100

  return (
    <div className="relative h-3 rounded-full overflow-hidden bg-navy-100">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: "100%",
          background: "linear-gradient(90deg, #1e3a5f, #d4a017, #1e3a5f)",
        }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-md"
        style={{ left: `calc(${avgPercent}% - 8px)` }}
      />
      <div
        className="absolute -top-6 text-xs font-semibold text-amber-500"
        style={{ left: `calc(${avgPercent}% - 16px)` }}
      >
        ¥{avg.toLocaleString()}
      </div>
    </div>
  )
}

function formatMonth(m: string) {
  const parts = m.split("-")
  return `${parts[0].slice(2)}'${parts[1]}`
}

export default function SmartPricing() {
  const [district, setDistrict] = useState("")
  const [area, setArea] = useState("")
  const [propertyType, setPropertyType] = useState<string>("")
  const [industry, setIndustry] = useState<string>("")
  const [showResult, setShowResult] = useState(false)

  const handleSubmit = () => {
    setShowResult(true)
  }

  const isCloseToAvg = (rent: number) => {
    const diff = Math.abs(rent - pricingResult.suggestedAvg)
    return diff <= 2000
  }

  const chartData = pricingResult.historicalData.map((d) => ({
    ...d,
    month: formatMonth(d.month),
  }))

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container">
        <div className="flex gap-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="w-1/3"
          >
            <motion.div variants={fadeInUp} className="card p-6 sticky top-6">
              <h2 className="section-title flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-amber-500" />
                智能定价
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">
                    所在商圈
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="select-field w-full"
                  >
                    <option value="">请选择商圈</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">
                    门店面积
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="请输入面积"
                      className="input-field w-full pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      ㎡
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">
                    产权性质
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="select-field w-full"
                  >
                    <option value="">请选择产权性质</option>
                    {propertyTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">
                    经营行业
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="select-field w-full"
                  >
                    <option value="">请选择行业</option>
                    {industries.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSubmit}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  获取定价建议
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>

          {showResult && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="w-2/3 space-y-6"
            >
              <motion.div variants={fadeInUp} className="card p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-navy-900 text-lg">
                    定价建议
                  </h3>
                </div>
                <div className="text-center my-6">
                  <span className="text-4xl font-bold text-amber-500 font-serif">
                    ¥{pricingResult.suggestedAvg.toLocaleString()}
                  </span>
                  <span className="text-lg text-slate-500 ml-1">/月</span>
                </div>
                <div className="px-4 mb-8">
                  <RangeBar
                    min={pricingResult.suggestedMin}
                    avg={pricingResult.suggestedAvg}
                    max={pricingResult.suggestedMax}
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>最低 ¥{pricingResult.suggestedMin.toLocaleString()}</span>
                    <span>最高 ¥{pricingResult.suggestedMax.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5" />
                  参考同商圈历史成交数据
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-navy-900 text-lg">
                    历史数据趋势
                  </h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis
                        yAxisId="rent"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="transfer"
                        orientation="right"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickFormatter={(v: number) => `¥${(v / 10000).toFixed(0)}万`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "avgRent") return [`¥${value.toLocaleString()}/月`, "月均租金"]
                          return [`¥${value.toLocaleString()}`, "转让费"]
                        }}
                      />
                      <Legend
                        formatter={(value: string) => {
                          if (value === "avgRent") return "月均租金"
                          return "转让费"
                        }}
                      />
                      <defs>
                        <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="transferGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d4a017" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Line
                        yAxisId="rent"
                        type="monotone"
                        dataKey="avgRent"
                        stroke="#1e3a5f"
                        strokeWidth={2.5}
                        dot={{ fill: "#1e3a5f", r: 3 }}
                        activeDot={{ r: 5 }}
                        fill="url(#rentGrad)"
                      />
                      <Line
                        yAxisId="transfer"
                        type="monotone"
                        dataKey="avgTransferFee"
                        stroke="#d4a017"
                        strokeWidth={2.5}
                        dot={{ fill: "#d4a017", r: 3 }}
                        activeDot={{ r: 5 }}
                        fill="url(#transferGrad)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Home className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-navy-900 text-lg">
                    同商圈参考门店
                  </h3>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-navy-50">
                        <th className="text-left px-4 py-3 font-medium text-navy-700">
                          门店名称
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-navy-700">
                          月租金
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-navy-700">
                          转让费
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-navy-700">
                          面积
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingResult.comparables.map((c, idx) => (
                        <tr
                          key={idx}
                          className={`border-t border-slate-100 transition-colors ${
                            isCloseToAvg(c.rent)
                              ? "bg-amber-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-navy-800">
                            {c.title}
                          </td>
                          <td
                            className={`text-right px-4 py-3 font-semibold ${
                              isCloseToAvg(c.rent)
                                ? "text-amber-600"
                                : "text-navy-700"
                            }`}
                          >
                            ¥{c.rent.toLocaleString()}/月
                          </td>
                          <td className="text-right px-4 py-3 text-navy-700">
                            ¥{c.transferFee.toLocaleString()}
                          </td>
                          <td className="text-right px-4 py-3 text-navy-700">
                            {c.area}㎡
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {!showResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-2/3 flex flex-col items-center justify-center text-center py-20"
            >
              <div className="w-20 h-20 rounded-2xl bg-navy-50 flex items-center justify-center mb-5">
                <BarChart3 className="w-10 h-10 text-navy-300" />
              </div>
              <h3 className="text-lg font-semibold text-navy-700 mb-2">
                填写门店信息，获取智能定价建议
              </h3>
              <p className="text-sm text-slate-400 max-w-sm">
                基于同商圈历史成交数据与市场趋势分析，为您生成专业定价参考
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
