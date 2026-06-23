import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Search,
  Filter,
  Map,
  List,
  SlidersHorizontal,
  MapPin,
  Building2,
  Shield,
  ChevronDown,
  X,
  FileCheck,
  Landmark,
  XCircle,
  CheckCircle,
  Clock,
  Info,
} from "lucide-react"
import { storefronts, districts } from "@/data/mockData"

const INDUSTRY_OPTIONS = ["餐饮", "零售", "美业", "服装", "数码", "教育", "金融服务"]
const PROPERTY_OPTIONS = ["全部", "自有", "租赁", "合作"] as const
const SORT_OPTIONS = [
  { value: "newest", label: "最新发布" },
  { value: "rent-asc", label: "租金从低到高" },
  { value: "rent-desc", label: "租金从高到低" },
  { value: "area-asc", label: "面积从小到大" },
  { value: "area-desc", label: "面积从大到小" },
]

function formatMoney(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return value.toLocaleString()
}

export default function StoreHall() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get("q") || ""
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [areaMin, setAreaMin] = useState("")
  const [areaMax, setAreaMax] = useState("")
  const [propertyType, setPropertyType] = useState<string>("全部")
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [sortBy, setSortBy] = useState("newest")
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [infoModalStoreId, setInfoModalStoreId] = useState<string | null>(null)

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    )
  }

  const resetFilters = () => {
    setSelectedDistrict("")
    setSelectedIndustries([])
    setBudgetMin("")
    setBudgetMax("")
    setAreaMin("")
    setAreaMax("")
    setPropertyType("全部")
  }

  const hasActiveFilters =
    selectedDistrict !== "" ||
    selectedIndustries.length > 0 ||
    budgetMin !== "" ||
    budgetMax !== "" ||
    areaMin !== "" ||
    areaMax !== "" ||
    propertyType !== "全部"

  const filteredStorefronts = storefronts.filter((s) => {
    if (q) {
      const lowerQ = q.toLowerCase()
      const matchTitle = s.title.toLowerCase().includes(lowerQ)
      const matchDistrict = s.district.toLowerCase().includes(lowerQ)
      const matchIndustry = s.industry.some((ind) => ind.toLowerCase().includes(lowerQ))
      const matchAddress = s.address.toLowerCase().includes(lowerQ)
      if (!matchTitle && !matchDistrict && !matchIndustry && !matchAddress) return false
    }
    if (selectedDistrict && s.district !== selectedDistrict) return false
    if (selectedIndustries.length > 0 && !selectedIndustries.some((ind) => s.industry.includes(ind)))
      return false
    if (budgetMin && s.transferFee < Number(budgetMin) * 10000) return false
    if (budgetMax && s.transferFee > Number(budgetMax) * 10000) return false
    if (areaMin && s.area < Number(areaMin)) return false
    if (areaMax && s.area > Number(areaMax)) return false
    if (propertyType !== "全部" && s.propertyType !== propertyType) return false
    return true
  })

  const sortedStorefronts = [...filteredStorefronts].sort((a, b) => {
    switch (sortBy) {
      case "rent-asc":
        return a.rent - b.rent
      case "rent-desc":
        return b.rent - a.rent
      case "area-asc":
        return a.area - b.area
      case "area-desc":
        return b.area - a.area
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const districtStoreCounts = districts.map((d) => ({
    name: d.name,
    count: storefronts.filter((s) => s.district === d.name).length,
    x: Math.random() * 70 + 15,
    y: Math.random() * 60 + 20,
  }))

  const riskBadgeClass = (level: "low" | "medium" | "high") => {
    if (level === "low") return "badge-risk-low"
    if (level === "medium") return "badge-risk-medium"
    return "badge-risk-high"
  }

  const riskLabel = (level: "low" | "medium" | "high") => {
    if (level === "low") return "低风险"
    if (level === "medium") return "中风险"
    return "高风险"
  }

  const propertyBadgeClass = (type: "自有" | "租赁" | "合作") => {
    if (type === "自有") return "bg-jade-100 text-jade-700"
    if (type === "租赁") return "bg-navy-100 text-navy-700"
    return "bg-amber-100 text-amber-700"
  }

  const verificationIcon = (status: "passed" | "failed" | "pending") => {
    if (status === "passed") return <CheckCircle className="w-3.5 h-3.5 text-jade-600" />
    if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-coral-600" />
    return <Clock className="w-3.5 h-3.5 text-amber-600" />
  }

  const verificationLabel = (status: "passed" | "failed" | "pending") => {
    if (status === "passed") return "已通过"
    if (status === "failed") return "未通过"
    return "审核中"
  }

  const verificationTextClass = (status: "passed" | "failed" | "pending") => {
    if (status === "passed") return "text-jade-600"
    if (status === "failed") return "text-coral-600"
    return "text-amber-600"
  }

  const FilterPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-navy-900 font-semibold">
          <SlidersHorizontal className="w-4 h-4" />
          <span>筛选条件</span>
        </div>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-xs text-coral-500 hover:text-coral-600 flex items-center gap-1">
            <X className="w-3 h-3" />
            重置
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <MapPin className="w-3.5 h-3.5 inline mr-1" />
          商圈选择
        </label>
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="select-field"
          >
            <option value="">全部商圈</option>
            {districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Building2 className="w-3.5 h-3.5 inline mr-1" />
          行业类型
        </label>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_OPTIONS.map((ind) => (
            <button
              key={ind}
              onClick={() => toggleIndustry(ind)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                selectedIndustries.includes(ind)
                  ? "bg-navy-900 text-white border-navy-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-navy-300"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">预算区间（转让费/万元）</label>
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
        <label className="block text-sm font-medium text-slate-700 mb-2">面积区间（㎡）</label>
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

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Shield className="w-3.5 h-3.5 inline mr-1" />
          产权性质
        </label>
        <div className="flex flex-wrap gap-3">
          {PROPERTY_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="propertyType"
                value={opt}
                checked={propertyType === opt}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-4 h-4 text-navy-900 border-slate-300 focus:ring-navy-900"
              />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <button onClick={resetFilters} className="btn-secondary w-full text-sm py-2">
        重置筛选
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                <Link to="/" className="hover:text-navy-600 transition-colors">首页</Link>
                <span>/</span>
                <span className="text-slate-600">门店大厅</span>
              </nav>
              <h1 className="text-2xl font-bold text-navy-900">门店大厅</h1>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
              >
                <Filter className="w-4 h-4" />
                筛选
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="card p-5 sticky top-6">
              <FilterPanel />
            </div>
          </aside>

          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="absolute left-0 top-0 bottom-0 w-72 bg-white p-5 overflow-y-auto"
              >
                <FilterPanel />
              </motion.div>
            </div>
          )}

          <main className="flex-1 min-w-0">
            {q && (
              <div className="card p-4 mb-5 bg-navy-50/50 border-navy-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-navy-600" />
                    <p className="text-sm text-slate-600">
                      搜索关键词：<span className="font-semibold text-navy-900">"{q}"</span>，
                      为您找到 <span className="font-semibold text-navy-900">{sortedStorefronts.length}</span> 个匹配结果
                    </p>
                  </div>
                  <Link
                    to="/storehall"
                    className="text-xs text-slate-500 hover:text-coral-600 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    清除搜索
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500">
                共 <span className="font-semibold text-navy-900">{sortedStorefronts.length}</span> 个铺位
              </p>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === "list" ? "bg-white shadow-sm text-navy-900" : "text-slate-400"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === "map" ? "bg-white shadow-sm text-navy-900" : "text-slate-400"
                    }`}
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="select-field pr-8 text-sm py-2 w-40"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {viewMode === "list" ? (
              sortedStorefronts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {sortedStorefronts.map((store, index) => (
                    <motion.div
                      key={store.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.06 }}
                      className="card overflow-hidden group"
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={store.imageUrl}
                          alt={store.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className={riskBadgeClass(store.riskLevel)}>
                            {riskLabel(store.riskLevel)}
                          </span>
                          {store.verified && (
                            <span className="badge-verified">
                              <Shield className="w-3 h-3" />
                              已验证
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 relative">
                        <h3 className="font-semibold text-navy-900 mb-1.5 line-clamp-1 group-hover:text-amber-600 transition-colors">
                          {store.title}
                        </h3>
                        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {store.district} · {store.address}
                        </p>
                        <div className="mb-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${propertyBadgeClass(store.propertyType)}`}>
                            产权：{store.propertyType}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {store.industry.slice(0, 3).map((ind) => (
                            <span
                              key={ind}
                              className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs rounded"
                            >
                              {ind}
                            </span>
                          ))}
                        </div>
                        {store.verified ? (
                          <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 bg-jade-50 rounded-lg">
                            <div className="flex -space-x-1">
                              <CheckCircle className="w-4 h-4 text-jade-600" />
                              <CheckCircle className="w-4 h-4 text-jade-600" />
                            </div>
                            <span className="text-xs font-medium text-jade-700">双验证通过</span>
                            <span className="text-xs text-jade-600">工商验证 · 住建验证</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 mb-3 px-2.5 py-1.5 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-1">
                              <Landmark className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs text-slate-500">工商验证</span>
                              {verificationIcon(store.verificationDetails.commerce)}
                              <span className={`text-xs font-medium ${verificationTextClass(store.verificationDetails.commerce)}`}>
                                {verificationLabel(store.verificationDetails.commerce)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs text-slate-500">住建验证</span>
                              {verificationIcon(store.verificationDetails.housing)}
                              <span className={`text-xs font-medium ${verificationTextClass(store.verificationDetails.housing)}`}>
                                {verificationLabel(store.verificationDetails.housing)}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 text-center py-2.5 border-t border-slate-50">
                          <div>
                            <p className="text-xs text-slate-400">面积</p>
                            <p className="text-sm font-semibold text-navy-800">{store.area}㎡</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">租金</p>
                            <p className="text-sm font-semibold text-navy-800">
                              {formatMoney(store.rent)}/月
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">转让费</p>
                            <p className="text-sm font-semibold text-amber-600">
                              {formatMoney(store.transferFee)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Link
                            to={`/store/${store.id}`}
                            className="flex-1 text-center btn-primary text-sm py-2"
                          >
                            查看详情
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              setInfoModalStoreId(store.id)
                            }}
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-navy-600 hover:border-navy-200 hover:bg-slate-50 transition-all duration-200"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="card p-16 text-center">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg font-medium">暂无符合条件的铺位</p>
                  <p className="text-slate-400 text-sm mt-1">请尝试调整筛选条件</p>
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="btn-secondary text-sm mt-4 py-2">
                      重置筛选
                    </button>
                  )}
                </div>
              )
            ) : (
              <div className="card-dark p-6 relative overflow-hidden" style={{ minHeight: 520 }}>
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin className="w-5 h-5 text-amber-400" />
                    <h3 className="text-white font-semibold">商圈分布概览</h3>
                  </div>
                  <div className="relative" style={{ height: 400 }}>
                    {districtStoreCounts.map((d, i) => (
                      <motion.div
                        key={d.name}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className="absolute"
                        style={{ left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%, -50%)" }}
                      >
                        <div className="relative group cursor-pointer">
                          <div className="w-16 h-16 rounded-full bg-navy-600/60 border-2 border-amber-400/50 flex flex-col items-center justify-center hover:bg-navy-600/80 hover:border-amber-400 transition-all duration-300">
                            <span className="text-amber-400 font-bold text-lg leading-none">{d.count}</span>
                            <span className="text-navy-200 text-[10px]">店铺</span>
                          </div>
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-navy-200 bg-navy-800/80 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {d.name}
                          </div>
                          <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-ping" style={{ animationDuration: "3s" }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-navy-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-400/50 border border-amber-400" />
                      商圈节点
                    </span>
                    <span>悬停查看商圈名称</span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      {infoModalStoreId && (() => {
        const store = storefronts.find((s) => s.id === infoModalStoreId)
        if (!store) return null
        const mockLicense = {
          companyName: `上海${store.title.replace(/转让|底商|精品店|急转|机构|配件店/g, "").trim()}有限公司`,
          unifiedCode: "91310" + Math.random().toString().slice(2, 16),
          legalPerson: "张" + ["伟", "芳", "强", "敏", "磊", "静"][Math.floor(Math.random() * 6)],
        }
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setInfoModalStoreId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-navy-gradient px-5 py-4 flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  资质与验证详情
                </h3>
                <button
                  onClick={() => setInfoModalStoreId(null)}
                  className="text-navy-200 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-navy-500" />
                    商户营业执照OCR识别结果
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-500 w-24 shrink-0">公司名称</span>
                      <span className="text-sm text-navy-800 font-medium text-right">{mockLicense.companyName}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-500 w-24 shrink-0">统一社会信用代码</span>
                      <span className="text-sm text-navy-800 font-medium font-mono text-right">{mockLicense.unifiedCode}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-500 w-24 shrink-0">法定代表人</span>
                      <span className="text-sm text-navy-800 font-medium text-right">{mockLicense.legalPerson}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-500 w-24 shrink-0">注册资本</span>
                      <span className="text-sm text-navy-800 font-medium text-right">50万元人民币</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-500 w-24 shrink-0">成立日期</span>
                      <span className="text-sm text-navy-800 font-medium text-right">2022-03-15</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-navy-500" />
                    验证详情
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-700">工商验证</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {verificationIcon(store.verificationDetails.commerce)}
                        <span className={`text-xs font-medium ${verificationTextClass(store.verificationDetails.commerce)}`}>
                          {verificationLabel(store.verificationDetails.commerce)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-700">住建验证</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {verificationIcon(store.verificationDetails.housing)}
                        <span className={`text-xs font-medium ${verificationTextClass(store.verificationDetails.housing)}`}>
                          {verificationLabel(store.verificationDetails.housing)}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">提交验证</p>
                        <p className="text-navy-800 font-medium mt-0.5">{store.createdAt}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">最后更新</p>
                        <p className="text-navy-800 font-medium mt-0.5">{store.updatedAt}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setInfoModalStoreId(null)}
                  className="w-full btn-secondary text-sm py-2"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )
      })()}
    </div>
  )
}
