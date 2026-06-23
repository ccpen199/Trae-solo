import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, useInView } from "framer-motion"
import {
  Search, MapPin, TrendingUp, ArrowRight,
  Building2, Users, Shield, Star, Eye, BookOpen,
  AlertCircle, Clock, Info,
} from "lucide-react"
import { storefronts, districts, knowledgeArticles } from "@/data/mockData"

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

function AnimatedCounter({ value, formatter, duration = 3000, delay = 0 }: { value: number; formatter: (v: number) => string; duration?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [display, setDisplay] = useState("0")

  useEffect(() => {
    if (!isInView) return
    const timeoutId = setTimeout(() => {
      const start = performance.now()
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(formatter(eased * value))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timeoutId)
  }, [isInView, value, formatter, duration, delay])

  return <span ref={ref}>{display}</span>
}

const districtImages: Record<string, string> = {
  d1: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Nanjing%20Road%20Shanghai%20commercial%20street%20aerial%20view%2C%20busy%20shopping%20district%2C%20neon%20lights%2C%20luxury%20stores&image_size=landscape_16_9",
  d2: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Xujiahui%20Shanghai%20commercial%20center%20aerial%20view%2C%20shopping%20mall%2C%20modern%20buildings%2C%20urban%20district&image_size=landscape_16_9",
  d3: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Lujiazui%20Shanghai%20financial%20district%20skyline%2C%20Oriental%20Pearl%20Tower%2C%20modern%20skyscrapers%2C%20aerial%20view&image_size=landscape_16_9",
  d4: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Wujiaochang%20Shanghai%20shopping%20district%2C%20university%20area%2C%20young%20crowds%2C%20modern%20commercial%20plaza&image_size=landscape_16_9",
  d5: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jingan%20Temple%20Shanghai%20commercial%20area%2C%20luxury%20shopping%2C%20elegant%20street%2C%20blend%20of%20traditional%20and%20modern&image_size=landscape_16_9",
}

const categoryLabels: Record<string, string> = {
  transfer_tips: "转让技巧",
  location_skills: "选址技能",
  avoid_pitfalls: "避坑指南",
}

const roleLabels: Record<string, string> = {
  merchant: "商户",
  broker: "经纪人",
}

const riskLabels: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
}

const shake = {
  x: [0, -8, 8, -6, 6, -4, 4, 0],
  transition: { duration: 0.5 },
}

export default function Home() {
  const navigate = useNavigate()
  const featuredStorefronts = storefronts.slice(0, 6)
  const topArticles = knowledgeArticles.slice(0, 3)

  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchError, setSearchError] = useState("")
  const [showError, setShowError] = useState(false)
  const [searchToast, setSearchToast] = useState<{ show: boolean; count: number }>({ show: false, count: 0 })
  const [quickResults, setQuickResults] = useState<
    { type: "store" | "district" | "article"; id: string; title: string }[]
  >([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentTime = new Date()
  const formattedTime = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, "0")}-${String(currentTime.getDate()).padStart(2, "0")} ${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}`

  const performSearch = () => {
    const keyword = searchKeyword.trim()
    if (!keyword) {
      setSearchError("请输入搜索关键词")
      setShowError(true)
      return
    }

    setShowError(false)
    setSearchError("")

    const matchedStores = storefronts.filter(
      (s) =>
        s.title.includes(keyword) ||
        s.district.includes(keyword) ||
        s.address.includes(keyword) ||
        s.industry.some((ind) => ind.includes(keyword))
    )
    const matchedDistricts = districts.filter((d) => d.name.includes(keyword))
    const matchedArticles = knowledgeArticles.filter((a) => a.title.includes(keyword))
    const totalCount = matchedStores.length + matchedDistricts.length + matchedArticles.length

    navigate(`/storehall?q=${encodeURIComponent(keyword)}`)

    setSearchToast({ show: true, count: totalCount })
    setShowDropdown(false)
    setTimeout(() => {
      setSearchToast({ show: false, count: 0 })
    }, 3000)
  }

  const handleSearch = () => {
    performSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowDropdown(false)
      performSearch()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchKeyword(value)
    setShowError(false)
    setSearchError("")

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length > 1) {
      debounceRef.current = setTimeout(() => {
        const keyword = value.trim()
        const matchedStores = storefronts
          .filter((s) => s.title.includes(keyword))
          .slice(0, 1)
          .map((s) => ({ type: "store" as const, id: s.id, title: s.title }))
        const matchedDistricts = districts
          .filter((d) => d.name.includes(keyword))
          .slice(0, 1)
          .map((d) => ({ type: "district" as const, id: d.id, title: d.name }))
        const matchedArticles = knowledgeArticles
          .filter((a) => a.title.includes(keyword))
          .slice(0, 1)
          .map((a) => ({ type: "article" as const, id: a.id, title: a.title }))
        const results = [...matchedStores, ...matchedDistricts, ...matchedArticles]
        setQuickResults(results)
        setShowDropdown(results.length > 0)
      }, 300)
    } else {
      setShowDropdown(false)
      setQuickResults([])
    }
  }

  const handleQuickResultClick = (result: { type: "store" | "district" | "article"; id: string }) => {
    setShowDropdown(false)
    if (result.type === "store") {
      navigate(`/store/${result.id}`)
    } else if (result.type === "district") {
      navigate("/districts")
    } else if (result.type === "article") {
      navigate(`/knowledge/${result.id}`)
    }
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-navy-gradient py-20 lg:py-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-20 h-20 border border-amber-400/10 rotate-45 animate-float" />
          <div className="absolute top-40 right-[15%] w-32 h-32 rounded-full border border-amber-400/10 animate-float [animation-delay:2s]" />
          <div className="absolute bottom-20 left-[20%] w-16 h-16 border border-navy-300/10 rotate-12 animate-float [animation-delay:4s]" />
          <div className="absolute bottom-32 right-[25%] w-24 h-24 rounded-full bg-amber-400/5 animate-float [animation-delay:1s]" />
          <div className="absolute top-[60%] left-[50%] w-40 h-40 border border-amber-400/5 rotate-[30deg] animate-float [animation-delay:3s]" />
          <div className="absolute top-16 right-[40%] w-12 h-12 border border-white/5 rotate-45 animate-float [animation-delay:5s]" />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6"
            >
              专业<span className="text-amber-400">门面转让</span>
              与<span className="text-amber-400">商业选址</span>平台
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-navy-200 text-base md:text-lg mb-10 tracking-wide">
              工商住建交叉验证 · 智能匹配 · 风险预警
            </motion.p>

            <motion.div variants={fadeInUp} className="relative max-w-xl mx-auto mb-14">
              <motion.div
                animate={showError ? shake : {}}
                className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl border-2 border-amber-400/50 focus-within:border-amber-400 transition-colors"
              >
                <Search className="ml-4 text-amber-400 w-5 h-5 shrink-0" />
                <input
                  type="text"
                  placeholder="搜索商圈、门店、行业..."
                  value={searchKeyword}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent px-4 py-3.5 text-white placeholder:text-navy-300 outline-none"
                />
                <button onClick={handleSearch} className="btn-primary mr-1.5 px-5 py-2 text-sm">
                  搜索
                </button>
              </motion.div>

              {showError && searchError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 right-0 mt-2 flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4" style={{ color: "#FF6B6B" }} />
                  <span className="text-sm" style={{ color: "#FF6B6B" }}>
                    {searchError}
                  </span>
                </motion.div>
              )}

              {showDropdown && quickResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-20"
                >
                  {quickResults.map((result, idx) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleQuickResultClick(result)}
                      className={`px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center gap-3 ${
                        idx < quickResults.length - 1 ? "border-b border-slate-100" : ""
                      }`}
                    >
                      {result.type === "store" && <Building2 className="w-4 h-4 text-amber-500 shrink-0" />}
                      {result.type === "district" && <MapPin className="w-4 h-4 text-amber-500 shrink-0" />}
                      {result.type === "article" && <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />}
                      <span className="text-sm text-navy-800 truncate">{result.title}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {searchToast.show && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-4 bg-navy-900/90 backdrop-blur-sm text-white text-sm px-5 py-2.5 rounded-lg shadow-xl whitespace-nowrap z-30"
                >
                  搜索完成，为您找到 {searchToast.count} 个结果
                </motion.div>
              )}
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col items-center">
              <div className="flex justify-center gap-8 md:gap-16">
                {[
                  {
                    label: "今日新增",
                    value: 128,
                    formatter: (v: number) => Math.round(v).toString(),
                    delay: 0,
                    title: "今日审核通过并上线的转让门店数量",
                  },
                  {
                    label: "在线门店",
                    value: 2847,
                    formatter: (v: number) => Math.round(v).toLocaleString(),
                    delay: 200,
                    title: "通过工商住建交叉验证、无高风险且可正常展示的门店数量",
                  },
                  {
                    label: "成交总额",
                    value: 3.2,
                    formatter: (v: number) => `¥${v.toFixed(1)}亿`,
                    delay: 400,
                    title: "本月已完成交易结算的转让合同总金额（含已付定金）",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="text-center" title={stat.title}>
                    <div className="text-2xl md:text-3xl font-bold text-amber-400 font-serif">
                      <AnimatedCounter value={stat.value} formatter={stat.formatter} delay={stat.delay} />
                    </div>
                    <div className="text-navy-300 text-sm mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-1.5 text-sm text-navy-300">
                <Clock className="w-3.5 h-3.5" />
                <span>数据更新于 {formattedTime}</span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-navy-400/70 italic">
                <Info className="w-3 h-3" />
                <span>数据口径：今日新增=今日审核通过门店数，在线门店=审核通过且可展示门店数，成交总额=本月已结算交易金额，数据每5分钟自动刷新</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                  热门商圈
                </h2>
                <p className="section-subtitle mt-1">基于人流量与成交数据的智能推荐</p>
              </div>
              <Link to="/districts" className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x scrollbar-thin"
            >
              {districts.map((district) => {
                const latestTraffic = district.footTraffic[district.footTraffic.length - 1].value
                return (
                  <motion.div
                    key={district.id}
                    whileHover={{ scale: 1.03 }}
                    className="shrink-0 w-72 rounded-xl overflow-hidden relative group cursor-pointer snap-start"
                  >
                    <img
                      src={districtImages[district.id]}
                      alt={district.name}
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        {district.name}
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-amber-400 font-semibold">
                            {(latestTraffic / 10000).toFixed(1)}万
                          </div>
                          <div className="text-navy-300">人流量/月</div>
                        </div>
                        <div className="text-center">
                          <div className="text-amber-400 font-semibold">¥{district.avgRent}</div>
                          <div className="text-navy-300">均价/㎡</div>
                        </div>
                        <div className="text-center">
                          <div className="text-amber-400 font-semibold">{district.onlineStores}</div>
                          <div className="text-navy-300">在线门店</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-title">精选门店</h2>
                <p className="section-subtitle mt-1">工商住建双重验证 · 安全放心</p>
              </div>
              <Link to="/storehall" className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
                更多门店 <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {featuredStorefronts.map((store) => (
                <motion.div key={store.id} variants={fadeInUp}>
                  <Link
                    to={`/store/${store.id}`}
                    className="card flex overflow-hidden group"
                  >
                    <div className="relative w-48 shrink-0">
                      <img
                        src={store.imageUrl}
                        alt={store.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {store.verified && (
                          <span className="badge-verified">
                            <Shield className="w-3 h-3" /> 已验证
                          </span>
                        )}
                        <span className={`badge-risk-${store.riskLevel}`}>
                          {riskLabels[store.riskLevel]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-semibold text-navy-900 group-hover:text-amber-600 transition-colors truncate">
                          {store.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{store.district}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                        <div>
                          <div className="text-slate-400">面积</div>
                          <div className="font-semibold text-navy-800">{store.area}㎡</div>
                        </div>
                        <div>
                          <div className="text-slate-400">月租</div>
                          <div className="font-semibold text-navy-800">
                            ¥{(store.rent / 1000).toFixed(0)}k
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">转让费</div>
                          <div className="font-semibold text-amber-600">
                            ¥{(store.transferFee / 10000).toFixed(0)}万
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-500" />
                  经营经验精选
                </h2>
                <p className="section-subtitle mt-1">来自真实商户与经纪人的经验分享</p>
              </div>
              <Link to="/knowledge" className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
                更多文章 <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topArticles.map((article) => (
                <motion.div key={article.id} variants={fadeInUp}>
                  <div className="card overflow-hidden group cursor-pointer">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={article.coverUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-amber-400 text-navy-900 text-xs font-medium px-2.5 py-1 rounded-full">
                        {categoryLabels[article.category]}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-navy-900 line-clamp-2 group-hover:text-amber-600 transition-colors leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center">
                            <Users className="w-3 h-3 text-navy-500" />
                          </div>
                          <span className="text-xs text-slate-600">{article.author}</span>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-slate-400">{roleLabels[article.authorRole]}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Eye className="w-3 h-3" />
                            {article.comments}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Star className="w-3 h-3 text-amber-400" />
                            {article.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-navy-dark-gradient">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl font-bold text-white mb-4"
            >
              开始您的商业选址之旅
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-navy-300 mb-10 max-w-md mx-auto">
              无论您是转让门店还是寻找理想商铺，铺位通都能为您提供专业服务
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/publish"
                className="btn-primary px-8 py-3 text-base inline-flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                发布转让信息
              </Link>
              <Link
                to="/match"
                className="border-2 border-amber-400 text-amber-400 font-medium px-8 py-3 rounded-lg text-base inline-flex items-center justify-center gap-2 hover:bg-amber-400 hover:text-navy-900 transition-all duration-300"
              >
                <Search className="w-5 h-5" />
                智能匹配门店
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
