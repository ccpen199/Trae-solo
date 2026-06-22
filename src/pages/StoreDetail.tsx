import { useParams } from "react-router-dom"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import {
  MapPin,
  Building2,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Ruler,
  Eye,
  ArrowLeft,
  Share2,
  Heart,
  Phone,
  ChevronRight,
} from "lucide-react"
import { motion } from "framer-motion"
import { storefronts, districts, contractCheckItems, broker } from "@/data/mockData"

const PIE_COLORS = ["#1F3A6E", "#3A61A8", "#5779B5", "#7591C2", "#9DB1D4", "#C5D1E6"]
const BAR_COLORS = ["#1F3A6E", "#3A61A8", "#D4A843"]

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

function VerificationIcon({ status }: { status: "passed" | "failed" | "pending" }) {
  if (status === "passed") return <CheckCircle className="w-4 h-4 text-jade-500" />
  if (status === "failed") return <XCircle className="w-4 h-4 text-coral-500" />
  return <AlertTriangle className="w-4 h-4 text-amber-500" />
}

function VerificationLabel({ status }: { status: "passed" | "failed" | "pending" }) {
  if (status === "passed") return <span className="text-jade-600">已通过</span>
  if (status === "failed") return <span className="text-coral-600">未通过</span>
  return <span className="text-amber-600">审核中</span>
}

function StatusIcon({ status }: { status: "pass" | "warning" | "danger" }) {
  if (status === "pass") return <CheckCircle className="w-5 h-5 text-jade-500" />
  if (status === "warning") return <AlertTriangle className="w-5 h-5 text-amber-500" />
  return <XCircle className="w-5 h-5 text-coral-500" />
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  if (level === "low") return <span className="badge-risk-low">低风险</span>
  if (level === "medium") return <span className="badge-risk-medium">中风险</span>
  return <span className="badge-risk-high">高风险</span>
}

function RiskIndicator({ level }: { level: "low" | "medium" | "high" }) {
  const color =
    level === "low" ? "bg-jade-500" : level === "medium" ? "bg-amber-500" : "bg-coral-500"
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
}

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>()
  const store = storefronts.find((s) => s.id === id)

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-2">未找到该店铺</h2>
          <p className="text-slate-500">请检查链接是否正确</p>
        </div>
      </div>
    )
  }

  const district = districts.find((d) => d.name === store.district)

  const riskLevelConfig = {
    low: { label: "低风险", color: "text-jade-500", bg: "bg-jade-50", border: "border-jade-200" },
    medium: { label: "中风险", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
    high: { label: "高风险", color: "text-coral-500", bg: "bg-coral-50", border: "border-coral-200" },
  }
  const riskConfig = riskLevelConfig[store.riskLevel]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative h-72 md:h-80 overflow-hidden">
        <img
          src={store.imageUrl}
          alt={store.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-900/50 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-white text-2xl md:text-3xl font-bold font-serif mb-3">
            {store.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {store.verified ? (
              <span className="badge-verified">
                <Shield className="w-3 h-3" />
                已认证
              </span>
            ) : (
              <span className="badge-risk-high">
                <Shield className="w-3 h-3" />
                未认证
              </span>
            )}
            <RiskBadge level={store.riskLevel} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 space-y-6">
            <motion.div {...fadeUp} className="card p-6">
              <h2 className="section-title text-lg mb-5 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                信息面板
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-400 mb-1">产权性质</p>
                  <p className="font-medium text-navy-900">{store.propertyType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">面积</p>
                  <p className="font-medium text-navy-900">{store.area}㎡</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">月租金</p>
                  <p className="font-medium text-navy-900">¥{store.rent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">转让费</p>
                  <p className="font-medium text-navy-900">¥{store.transferFee.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">商圈</p>
                  <p className="font-medium text-navy-900">{store.district}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">地址</p>
                  <p className="font-medium text-navy-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-coral-400 flex-shrink-0" />
                    {store.address}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">经营行业</p>
                  <p className="font-medium text-navy-900">{store.industry.join("、")}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" />
                  验证状态
                </h3>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <VerificationIcon status={store.verificationDetails.commerce} />
                    <span className="text-sm text-slate-600">工商验证</span>
                    <VerificationLabel status={store.verificationDetails.commerce} />
                  </div>
                  <div className="flex items-center gap-2">
                    <VerificationIcon status={store.verificationDetails.housing} />
                    <span className="text-sm text-slate-600">住建验证</span>
                    <VerificationLabel status={store.verificationDetails.housing} />
                  </div>
                </div>
              </div>
            </motion.div>

            {district && (
              <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="card p-6">
                <h2 className="section-title text-lg mb-5 flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-amber-500" />
                  商圈画像 · {district.name}
                </h2>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold text-navy-800 mb-3">人流量趋势</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={district.footTraffic}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748B" }} />
                          <YAxis tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
                          <Tooltip
                            formatter={(value: number) => [`${value.toLocaleString()}`, "人流量"]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "13px" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#1F3A6E"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: "#1F3A6E" }}
                            activeDot={{ r: 5, fill: "#D4A843" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-navy-800 mb-3">竞品密度</h3>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={district.competitionDensity}
                              dataKey="count"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              outerRadius={72}
                              innerRadius={40}
                              paddingAngle={2}
                              label={({ category, percent }: { category: string; percent: number }) =>
                                `${category} ${(percent * 100).toFixed(0)}%`
                              }
                              labelLine={{ stroke: "#94A3B8" }}
                            >
                              {district.competitionDensity.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [`${value} 家`, "店铺数"]}
                              contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "13px" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-navy-800 mb-3">消费水平</h3>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={district.consumptionLevel}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="tier" tick={{ fontSize: 12, fill: "#64748B" }} />
                            <YAxis tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v: number) => `${v}%`} />
                            <Tooltip
                              formatter={(value: number) => [`${value}%`, "占比"]}
                              contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "13px" }}
                            />
                            <Legend />
                            <Bar dataKey="percentage" name="占比" radius={[4, 4, 0, 0]}>
                              {district.consumptionLevel.map((_, i) => (
                                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="card p-6">
              <h2 className="section-title text-lg mb-5 flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-500" />
                全景浏览
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center"
                  >
                    <div className="text-center text-navy-300">
                      <Eye className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-xs">全景 {i}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="w-full lg:w-1/3 space-y-6">
            <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="card p-6">
              <h2 className="section-title text-lg mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                风险报告
              </h2>
              <div className={`${riskConfig.bg} ${riskConfig.border} border rounded-lg p-4 mb-4 text-center`}>
                <p className={`text-3xl font-bold ${riskConfig.color} mb-1`}>{riskConfig.label}</p>
                <p className="text-xs text-slate-500">综合风险评估</p>
              </div>
              {store.riskItems.length > 0 ? (
                <div className="space-y-3">
                  {store.riskItems.map((item) => (
                    <div key={item.id} className="border border-slate-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <RiskIndicator level={item.level} />
                        <span className="text-sm font-semibold text-navy-900">{item.title}</span>
                        <RiskBadge level={item.level} />
                      </div>
                      <p className="text-xs text-slate-500 mb-1.5">{item.description}</p>
                      <p className="text-xs text-jade-700 bg-jade-50 rounded px-2 py-1">
                        💡 {item.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="w-10 h-10 text-jade-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">暂无风险项，该店铺信息已通过全面验证</p>
                </div>
              )}
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="card p-6">
              <h2 className="section-title text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-500" />
                合同合规检查
              </h2>
              <div className="space-y-3">
                {contractCheckItems.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="mt-0.5 flex-shrink-0">
                      <StatusIcon status={item.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-navy-900">{item.clause}</span>
                        <RiskBadge level={item.riskLevel} />
                      </div>
                      <p className="text-xs text-slate-400 mb-1">{item.content}</p>
                      <p className="text-xs text-slate-600">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="card p-6">
              <h2 className="section-title text-lg mb-4">联系方式</h2>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={broker.avatar}
                  alt={broker.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-200"
                />
                <div>
                  <p className="font-semibold text-navy-900">{broker.name}</p>
                  <p className="text-xs text-slate-400">
                    评分 {broker.rating} · 成交 {broker.dealCount} 单
                  </p>
                </div>
                {broker.certified && (
                  <span className="badge-verified ml-auto">
                    <CheckCircle className="w-3 h-3" />
                    认证
                  </span>
                )}
              </div>
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                联系经纪人
              </button>
              <button className="w-full mt-2 flex items-center justify-center gap-1 text-sm text-navy-600 hover:text-navy-800 transition-colors py-2">
                查看更多房源
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
