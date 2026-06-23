import { useState } from "react"
import { Link } from "react-router-dom"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Filter,
  Target,
  MapPin,
  Building2,
  TrendingUp,
  ChevronRight,
  SlidersHorizontal,
  AlertCircle,
  Calendar,
  Heart,
  Phone,
  FileCheck,
  ThumbsUp,
  Minus,
  Star,
  X,
} from "lucide-react"
import { storefronts, districts, broker } from "@/data/mockData"

const INDUSTRY_OPTIONS = ["餐饮", "零售", "美业", "服装", "数码", "教育", "金融服务"]

interface MatchDimensions {
  industry: number
  budget: number
  experience: number
  location: number
}

interface MatchResultItem {
  storeId: string
  score: number
  dimensions: MatchDimensions
}

interface MatchReason {
  icon: "thumbsup" | "minus"
  text: string
}

interface FormErrors {
  industry?: string
  budgetMin?: string
  budgetMax?: string
}

function calculateMatch(
  industry: string,
  budgetMin: number,
  budgetMax: number,
  preferredDistricts: string[]
): MatchResultItem[] {
  return storefronts
    .map((store) => {
      const industryScore = store.industry.includes(industry) ? 40 : 10
      const budgetScore =
        store.transferFee >= budgetMin * 10000 && store.transferFee <= budgetMax * 10000 ? 30 : 15
      const experienceScore = 25
      const locationScore = preferredDistricts.includes(store.district) ? 35 : 10
      const rawTotal = industryScore + budgetScore + experienceScore + locationScore
      const score = Math.round((rawTotal / 130) * 100)

      return {
        storeId: store.id,
        score,
        dimensions: {
          industry: Math.round((industryScore / 40) * 100),
          budget: Math.round((budgetScore / 30) * 100),
          experience: Math.round((experienceScore / 25) * 100),
          location: Math.round((locationScore / 35) * 100),
        },
      }
    })
    .sort((a, b) => b.score - a.score)
}

function getScoreColor(score: number) {
  if (score > 80) return "text-jade-600 border-jade-500"
  if (score > 60) return "text-amber-600 border-amber-500"
  return "text-coral-600 border-coral-500"
}

function getScoreBg(score: number) {
  if (score > 80) return "bg-jade-50"
  if (score > 60) return "bg-amber-50"
  return "bg-coral-50"
}

function formatMoney(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return value.toLocaleString()
}

function getMatchReasons(
  dimensions: MatchDimensions,
  store: typeof storefronts[0],
  industry: string
): MatchReason[] {
  const reasons: MatchReason[] = []

  if (dimensions.industry > 80) {
    reasons.push({
      icon: "thumbsup",
      text: `行业匹配度高：该门店经营行业与您选择的${industry}高度契合`,
    })
  } else if (dimensions.industry > 50) {
    reasons.push({
      icon: "minus",
      text: `行业部分匹配：该门店经营行业与您选择的${industry}有一定关联`,
    })
  }

  if (dimensions.budget > 80) {
    reasons.push({
      icon: "thumbsup",
      text: `预算匹配：转让费${formatMoney(store.transferFee)}在您的预算区间内`,
    })
  } else if (dimensions.budget > 50) {
    reasons.push({
      icon: "minus",
      text: `预算接近：转让费${formatMoney(store.transferFee)}与您的预算区间略有偏差`,
    })
  }

  if (dimensions.location > 80) {
    reasons.push({
      icon: "thumbsup",
      text: `区位匹配：位于您偏好的${store.district}`,
    })
  } else if (dimensions.location > 50) {
    reasons.push({
      icon: "minus",
      text: `区位一般：位于${store.district}，非您首选商圈`,
    })
  }

  if (reasons.length === 0) {
    reasons.push({
      icon: "minus",
      text: "综合评分：各维度匹配度处于平均水平",
    })
  }

  return reasons.slice(0, 3)
}

const shakeVariants = {
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.5 },
  },
}

export default function SmartMatch() {
  const [industry, setIndustry] = useState("")
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [businessYears, setBusinessYears] = useState("")
  const [preferredDistricts, setPreferredDistricts] = useState<string[]>([])
  const [areaMin, setAreaMin] = useState("")
  const [areaMax, setAreaMax] = useState("")
  const [results, setResults] = useState<MatchResultItem[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [shakeKeys, setShakeKeys] = useState<{ [key: string]: number }>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const [bookingMessage, setBookingMessage] = useState<string | null>(null)

  const toggleDistrict = (name: string) => {
    setPreferredDistricts((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    )
  }

  const triggerShake = (field: string) => {
    setShakeKeys((prev) => ({ ...prev, [field]: (prev[field] || 0) + 1 }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    let hasError = false

    if (!industry) {
      newErrors.industry = "请选择行业属性"
      triggerShake("industry")
      hasError = true
    }
    if (!budgetMin) {
      newErrors.budgetMin = "请输入预算最低值"
      triggerShake("budgetMin")
      hasError = true
    }
    if (!budgetMax) {
      newErrors.budgetMax = "请输入预算最高值"
      triggerShake("budgetMax")
      hasError = true
    }
    if (budgetMin && budgetMax && Number(budgetMax) <= Number(budgetMin)) {
      newErrors.budgetMax = "预算上限必须大于下限"
      triggerShake("budgetMax")
      hasError = true
    }

    setErrors(newErrors)
    return !hasError
  }

  const handleMatch = () => {
    if (!validate()) return
    const matched = calculateMatch(industry, Number(budgetMin), Number(budgetMax), preferredDistricts)
    setResults(matched)
    if (matched.length > 0) setSelectedId(matched[0].storeId)
  }

  const handleReset = () => {
    setResults(null)
    setSelectedId(null)
    setIndustry("")
    setBudgetMin("")
    setBudgetMax("")
    setBusinessYears("")
    setPreferredDistricts([])
    setAreaMin("")
    setAreaMax("")
    setErrors({})
    setBookingMessage(null)
  }

  const toggleFavorite = (storeId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(storeId)) {
        next.delete(storeId)
      } else {
        next.add(storeId)
      }
      return next
    })
  }

  const handleBooking = () => {
    setBookingMessage("预约成功！经纪人将在24小时内联系您确认带看时间。")
    setTimeout(() => setBookingMessage(null), 4000)
  }

  const selectedStore = results
    ? storefronts.find((s) => s.id === selectedId)
    : null
  const selectedMatch = results?.find((r) => r.storeId === selectedId)

  const radarData = selectedMatch
    ? [
        { dimension: "行业匹配", value: selectedMatch.dimensions.industry },
        { dimension: "预算匹配", value: selectedMatch.dimensions.budget },
        { dimension: "经验匹配", value: selectedMatch.dimensions.experience },
        { dimension: "区位匹配", value: selectedMatch.dimensions.location },
      ]
    : []

  const renderReasonIcon = (icon: "thumbsup" | "minus") => {
    if (icon === "thumbsup") {
      return <ThumbsUp className="w-3.5 h-3.5 text-jade-500 shrink-0" />
    }
    return <Minus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/" className="hover:text-navy-600 transition-colors">
              首页
            </Link>
            <span>/</span>
            <span className="text-slate-600">智能匹配</span>
          </nav>
          <h1 className="text-2xl font-bold text-navy-900">智能匹配</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence>
          {bookingMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-jade-50 border border-jade-200 text-jade-700 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              {bookingMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {!results ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-navy-900 mb-4">
                <Target className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">智能匹配</h2>
              <p className="text-slate-500">填写您的经营需求，为您精准推荐</p>
            </div>

            <div className="card max-w-2xl mx-auto p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Building2 className="w-3.5 h-3.5 inline mr-1" />
                    行业属性
                  </label>
                  <motion.div
                    key={shakeKeys.industry || 0}
                    animate={errors.industry ? "shake" : undefined}
                    variants={shakeVariants}
                  >
                    <select
                      value={industry}
                      onChange={(e) => {
                        setIndustry(e.target.value)
                        if (errors.industry) setErrors((prev) => ({ ...prev, industry: undefined }))
                      }}
                      className={`select-field ${errors.industry ? "border-coral-400 focus:ring-coral-400/50 focus:border-coral-400" : ""}`}
                    >
                      <option value="">请选择行业</option>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                  {errors.industry && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-coral-600">
                      <AlertCircle className="w-3 h-3" />
                      {errors.industry}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    预算区间（转让费/万元）
                  </label>
                  <div className="flex items-center gap-2">
                    <motion.div
                      key={shakeKeys.budgetMin || 0}
                      animate={errors.budgetMin ? "shake" : undefined}
                      variants={shakeVariants}
                      className="flex-1"
                    >
                      <input
                        type="number"
                        placeholder="最低"
                        value={budgetMin}
                        onChange={(e) => {
                          setBudgetMin(e.target.value)
                          if (errors.budgetMin) setErrors((prev) => ({ ...prev, budgetMin: undefined }))
                        }}
                        className={`input-field text-center ${errors.budgetMin ? "border-coral-400 focus:ring-coral-400/50 focus:border-coral-400" : ""}`}
                      />
                    </motion.div>
                    <span className="text-slate-400 text-sm">—</span>
                    <motion.div
                      key={shakeKeys.budgetMax || 0}
                      animate={errors.budgetMax ? "shake" : undefined}
                      variants={shakeVariants}
                      className="flex-1"
                    >
                      <input
                        type="number"
                        placeholder="最高"
                        value={budgetMax}
                        onChange={(e) => {
                          setBudgetMax(e.target.value)
                          if (errors.budgetMax) setErrors((prev) => ({ ...prev, budgetMax: undefined }))
                        }}
                        className={`input-field text-center ${errors.budgetMax ? "border-coral-400 focus:ring-coral-400/50 focus:border-coral-400" : ""}`}
                      />
                    </motion.div>
                  </div>
                  {(errors.budgetMin || errors.budgetMax) && (
                    <div className="mt-1.5 flex flex-col gap-1">
                      {errors.budgetMin && (
                        <p className="flex items-center gap-1 text-xs text-coral-600">
                          <AlertCircle className="w-3 h-3" />
                          {errors.budgetMin}
                        </p>
                      )}
                      {errors.budgetMax && (
                        <p className="flex items-center gap-1 text-xs text-coral-600">
                          <AlertCircle className="w-3 h-3" />
                          {errors.budgetMax}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    经营年限
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="请输入经营年限"
                      value={businessYears}
                      onChange={(e) => setBusinessYears(e.target.value)}
                      className="input-field"
                    />
                    <span className="text-sm text-slate-500 shrink-0">年</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    偏好商圈
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {districts.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => toggleDistrict(d.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                          preferredDistricts.includes(d.name)
                            ? "bg-navy-900 text-white border-navy-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-navy-300"
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    面积需求（㎡）<span className="text-slate-400 font-normal">（选填）</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="最小"
                      value={areaMin}
                      onChange={(e) => setAreaMin(e.target.value)}
                      className="input-field text-center"
                    />
                    <span className="text-slate-400 text-sm">—</span>
                    <input
                      type="number"
                      placeholder="最大"
                      value={areaMax}
                      onChange={(e) => setAreaMax(e.target.value)}
                      className="input-field text-center"
                    />
                  </div>
                </div>

                <button
                  onClick={handleMatch}
                  className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  开始匹配
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  为您推荐 {results.length} 个门店
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  基于您的需求画像智能匹配
                </p>
              </div>
              <button onClick={handleReset} className="btn-secondary text-sm py-2 flex items-center gap-1.5">
                <Filter className="w-4 h-4" />
                重新匹配
              </button>
            </div>

            <div className="flex gap-6">
              <div className="w-[420px] shrink-0 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {results.map((item, index) => {
                  const store = storefronts.find((s) => s.id === item.storeId)!
                  const reasons = getMatchReasons(item.dimensions, store, industry)
                  return (
                    <motion.div
                      key={item.storeId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.06 }}
                    >
                      <div
                        onClick={() => setSelectedId(store.id)}
                        className={`card flex flex-col overflow-hidden group cursor-pointer transition-all duration-200 ${
                          selectedId === store.id
                            ? "ring-2 ring-amber-400 shadow-amber-glow"
                            : "hover:shadow-md"
                        }`}
                      >
                        <div className="flex">
                          <div className="relative w-32 shrink-0">
                            <img
                              src={store.imageUrl}
                              alt={store.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                            <div>
                              <h3 className="font-semibold text-navy-900 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                                {store.title}
                              </h3>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {store.district}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {store.industry.slice(0, 2).map((ind) => (
                                  <span
                                    key={ind}
                                    className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] rounded"
                                  >
                                    {ind}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-center pt-2 border-t border-slate-50">
                              <div>
                                <p className="text-[10px] text-slate-400">面积</p>
                                <p className="text-xs font-semibold text-navy-800">{store.area}㎡</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400">月租</p>
                                <p className="text-xs font-semibold text-navy-800">
                                  {formatMoney(store.rent)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400">转让费</p>
                                <p className="text-xs font-semibold text-amber-600">
                                  {formatMoney(store.transferFee)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center pr-3">
                            <div
                              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getScoreBg(item.score)} ${getScoreColor(item.score)}`}
                            >
                              <span className="text-sm font-bold">{item.score}</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-3 pb-3 pt-2 border-t border-slate-50">
                          <p className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                            <Target className="w-3 h-3 text-amber-500" />
                            命中理由
                          </p>
                          <div className="space-y-1">
                            {reasons.map((reason, idx) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                {renderReasonIcon(reason.icon)}
                                <span className="text-[11px] text-slate-500 leading-relaxed">
                                  {reason.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="flex-1 min-w-0">
                {selectedStore && selectedMatch ? (
                  <motion.div
                    key={selectedStore.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="card p-6 sticky top-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${getScoreBg(selectedMatch.score)} ${getScoreColor(selectedMatch.score)}`}
                      >
                        <span className="text-xl font-bold">{selectedMatch.score}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-navy-900 text-lg">{selectedStore.title}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {selectedStore.district} · {selectedStore.address}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleFavorite(selectedStore.id)}
                        className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 transition-colors ${
                            favorites.has(selectedStore.id)
                              ? "text-coral-500 fill-coral-500"
                              : "text-slate-400"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-amber-500" />
                        匹配维度分析
                      </h4>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height={280}>
                          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis
                              dataKey="dimension"
                              tick={{ fill: "#475569", fontSize: 13 }}
                            />
                            <PolarRadiusAxis
                              angle={90}
                              domain={[0, 100]}
                              tick={{ fill: "#94a3b8", fontSize: 10 }}
                            />
                            <Radar
                              name="匹配度"
                              dataKey="value"
                              stroke="#0A2540"
                              fill="#0A2540"
                              fillOpacity={0.15}
                              strokeWidth={2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-6">
                      {[
                        { label: "行业匹配", value: selectedMatch.dimensions.industry },
                        { label: "预算匹配", value: selectedMatch.dimensions.budget },
                        { label: "经验匹配", value: selectedMatch.dimensions.experience },
                        { label: "区位匹配", value: selectedMatch.dimensions.location },
                      ].map((dim) => (
                        <div key={dim.label} className="text-center">
                          <div className="text-2xl font-bold text-navy-900">{dim.value}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{dim.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-amber-500" />
                        命中理由
                      </h4>
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                        {getMatchReasons(selectedMatch.dimensions, selectedStore, industry).map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                reason.icon === "thumbsup" ? "bg-jade-100" : "bg-amber-100"
                              }`}
                            >
                              {renderReasonIcon(reason.icon)}
                            </div>
                            <span className="text-sm text-slate-600 leading-relaxed pt-0.5">
                              {reason.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-100 mb-5">
                      <div className="text-center">
                        <div className="text-xs text-slate-400">面积</div>
                        <div className="text-sm font-semibold text-navy-800">
                          {selectedStore.area}㎡
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-400">月租</div>
                        <div className="text-sm font-semibold text-navy-800">
                          {formatMoney(selectedStore.rent)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-400">转让费</div>
                        <div className="text-sm font-semibold text-amber-600">
                          {formatMoney(selectedStore.transferFee)}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/store/${selectedStore.id}`}
                      className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 mb-3"
                    >
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        onClick={handleBooking}
                        className="py-2.5 text-sm font-medium rounded-lg border-2 border-amber-500 text-amber-600 hover:bg-amber-50 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        预约带看
                      </button>
                      <button
                        onClick={() => toggleFavorite(selectedStore.id)}
                        className="btn-ghost border border-slate-200 flex items-center justify-center gap-2"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            favorites.has(selectedStore.id) ? "fill-coral-500 text-coral-500" : ""
                          }`}
                        />
                        收藏门店
                      </button>
                    </div>

                    <button
                      onClick={() => setShowBrokerModal(true)}
                      className="w-full py-2.5 text-sm font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-all duration-200 flex items-center justify-center gap-2 mb-3"
                    >
                      <Phone className="w-4 h-4" />
                      联系经纪人
                    </button>

                    <Link
                      to="/risk"
                      className="w-full py-2 text-sm text-navy-600 hover:text-navy-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-4 h-4" />
                      合同合规检查
                    </Link>
                  </motion.div>
                ) : (
                  <div className="card p-16 text-center">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">请从左侧选择门店查看匹配详情</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showBrokerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowBrokerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="card w-[400px] p-6 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-navy-900">经纪人信息</h3>
                <button
                  onClick={() => setShowBrokerModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-5">
                <img
                  src={broker.avatar}
                  alt={broker.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-900 text-lg">{broker.name}</span>
                    {broker.certified && (
                      <span className="px-2 py-0.5 bg-jade-50 text-jade-600 text-xs font-medium rounded-full">
                        认证经纪人
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm text-slate-600 font-medium">{broker.rating}</span>
                    <span className="text-sm text-slate-400">· 成交{broker.dealCount}单</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">联系电话</span>
                  <span className="text-sm font-semibold text-navy-900">138****8888</span>
                </div>
              </div>
              <a
                href="tel:13888888888"
                className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                立即拨打
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
