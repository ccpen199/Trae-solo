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
import { motion } from "framer-motion"
import {
  Search,
  Filter,
  Target,
  MapPin,
  Building2,
  TrendingUp,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react"
import { storefronts, districts } from "@/data/mockData"

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

  const toggleDistrict = (name: string) => {
    setPreferredDistricts((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    )
  }

  const handleMatch = () => {
    if (!industry || !budgetMin || !budgetMax) return
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
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="select-field"
                  >
                    <option value="">请选择行业</option>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    预算区间（转让费/万元）
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="最低"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      className="input-field text-center"
                    />
                    <span className="text-slate-400 text-sm">—</span>
                    <input
                      type="number"
                      placeholder="最高"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      className="input-field text-center"
                    />
                  </div>
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
                  disabled={!industry || !budgetMin || !budgetMax}
                  className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  return (
                    <motion.div
                      key={item.storeId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.06 }}
                    >
                      <Link
                        to={`/store/${store.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedId(store.id)
                        }}
                        className={`card flex overflow-hidden group cursor-pointer transition-all duration-200 ${
                          selectedId === store.id
                            ? "ring-2 ring-amber-400 shadow-amber-glow"
                            : "hover:shadow-md"
                        }`}
                      >
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
                      </Link>
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
                      <div>
                        <h3 className="font-bold text-navy-900 text-lg">{selectedStore.title}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {selectedStore.district} · {selectedStore.address}
                        </p>
                      </div>
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
                      className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
                    >
                      查看详情
                      <ChevronRight className="w-4 h-4" />
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
    </div>
  )
}
