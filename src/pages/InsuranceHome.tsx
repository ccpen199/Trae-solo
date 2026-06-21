import { useState } from 'react'
import { useAppStore } from '@/store'
import {
  Shield,
  CheckCircle2,
  FileCheck,
  Calculator,
  DollarSign,
  Clock,
  Truck,
  ArrowUpRight,
  Sparkles,
  Download,
  Eye,
  Plus,
  Search,
  FileWarning,
  FileDigit,
  ChevronRight,
  Package,
  AlertCircle,
  FileText,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { InsurancePolicy } from '@/types'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const typeLabels: Record<InsurancePolicy['insuranceType'], { label: string; desc: string; rate: number }> = {
  basic: { label: '基本险', desc: '自然灾害、交通事故', rate: 0.08 },
  comprehensive: { label: '综合险', desc: '基本险+雨淋+破损+失窃', rate: 0.12 },
  all_risk: { label: '一切险', desc: '综合险+温控异常+延误', rate: 0.18 },
}

const statusInfo: Record<InsurancePolicy['status'], { label: string; className: string }> = {
  pending: { label: '待生效', className: 'bg-amber-50 text-amber-600' },
  active: { label: '保障中', className: 'bg-success-50 text-success-600' },
  expired: { label: '已过期', className: 'bg-slate2-100 text-slate2-500' },
  claimed: { label: '理赔中', className: 'bg-accent-50 text-accent-600' },
}

const coverageData = [
  { name: '电子产品', value: 38 },
  { name: '汽车零部件', value: 26 },
  { name: '化工原料', value: 16 },
  { name: '冷链食品', value: 12 },
  { name: '其他', value: 8 },
]
const COLORS = ['#0F3460', '#16C79A', '#E94560', '#6C5CE7', '#808C9C']

const premiumTrend = [
  { m: '1月', v: 28.5 },
  { m: '2月', v: 32.1 },
  { m: '3月', v: 36.8 },
  { m: '4月', v: 34.2 },
  { m: '5月', v: 42.6 },
  { m: '6月', v: 48.3 },
]

export default function InsuranceHome() {
  const { insurancePolicies, claims } = useAppStore()
  const [search, setSearch] = useState('')

  const totalPremium = insurancePolicies.reduce((s, p) => s + p.premium, 0)
  const totalCoverage = insurancePolicies.reduce((s, p) => s + p.coverageAmount, 0)
  const activePolicies = insurancePolicies.filter(p => p.status === 'active').length

  return (
    <div className="space-y-6">
      {/* 顶部人保品牌条 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#C8102E] via-[#E4002B] to-[#C8102E] text-white p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-yellow-400/10 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Shield className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <div className="text-xs opacity-80 mb-1">战略合作伙伴</div>
              <h1 className="text-2xl font-bold tracking-wide">中国人民财产保险 PICC</h1>
              <p className="text-sm opacity-90 mt-1">货物运输保险 · 在线投保 · 实时出单 · 电子存证</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-xs opacity-80">24小时理赔热线</div>
              <div className="text-2xl font-bold font-mono tracking-wider">95518</div>
            </div>
            <Link
              to="/insurance/apply"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#C8102E] font-bold hover:bg-yellow-300 hover:shadow-lg transition-all shadow-md"
            >
              <Zap className="w-5 h-5" />
              立即投保
            </Link>
          </div>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '有效保单', count: activePolicies, unit: '份', icon: Shield, color: 'from-primary-500 to-primary-600' },
          { label: '累计保费', count: (totalPremium / 10000).toFixed(1), unit: '万元', icon: DollarSign, color: 'from-success-500 to-success-600' },
          { label: '累计保额', count: (totalCoverage / 100000000).toFixed(2), unit: '亿元', icon: FileDigit, color: 'from-violet-500 to-violet-600' },
          { label: '理赔申请', count: claims.length, unit: '件', icon: FileWarning, color: 'from-amber-500 to-amber-600' },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="card-base p-5 card-hover relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-28 h-28 rounded-full bg-gradient-to-br ${item.color} opacity-5 -translate-y-1/3 translate-x-1/3`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate2-400 font-medium">{item.label}</span>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono text-slate2-800 tracking-tight">{item.count}</span>
                  <span className="text-sm text-slate2-400 font-medium">{item.unit}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左：保费趋势 + 货类分布 */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="card-base p-6 card-hover">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate2-800">月度保费趋势</h3>
              <span className="text-xs text-success-600 bg-success-50 px-2 py-0.5 rounded-full font-medium">
                同比 +38.2%
              </span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={premiumTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="premiumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C8102E" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#C8102E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#808C9C' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#808C9C' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #ECEEF1',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px rgba(15, 52, 96, 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => [`${v}万元`, '保费']}
                  />
                  <Area type="monotone" dataKey="v" stroke="#C8102E" strokeWidth={2.5} fill="url(#premiumGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 快速计算器 */}
          <div className="card-base p-6 card-hover bg-gradient-to-br from-red-50/30 via-white to-primary-50/30">
            <h3 className="font-bold text-slate2-800 mb-5 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#C8102E]" />
              保费快速计算器
              <span className="text-[10px] font-normal text-slate2-400 ml-1">(按货物价值实时估算)</span>
            </h3>
            <PremiumCalculator />
          </div>
        </div>

        {/* 右：货类分布 + 险别 + 最近保单 */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* 货类分布 */}
          <div className="card-base p-6 card-hover">
            <h3 className="font-bold text-slate2-800 mb-4">承保货类分布</h3>
            <div className="h-[200px] flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={coverageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={68}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {coverageData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-1.5">
                {coverageData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                    <span className="text-[11px] text-slate2-600 truncate flex-1">{item.name}</span>
                    <span className="text-[11px] font-bold font-mono text-slate2-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 险别对比 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="px-5 py-3 border-b border-slate2-100 bg-gradient-to-r from-[#C8102E]/5 to-transparent">
              <h3 className="font-bold text-slate2-800 text-sm">三大险种对比</h3>
            </div>
            <div className="divide-y divide-slate2-50">
              {Object.entries(typeLabels).map(([k, v]) => (
                <div key={k} className="p-4 flex items-center gap-3 hover:bg-slate2-50/50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C8102E]/10 to-primary-50 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate2-800">{v.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C8102E]/10 text-[#C8102E] font-bold font-mono">
                        费率 {v.rate}‰
                      </span>
                    </div>
                    <div className="text-[11px] text-slate2-500 mt-0.5">{v.desc}</div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate2-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 最近保单列表 */}
      <div className="card-base overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate2-800">最近电子保单</h3>
            <span className="text-xs text-slate2-400">共 {insurancePolicies.length} 份</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate2-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="保单号/运单号"
                className="w-52 h-8 pl-9 pr-3 rounded-lg bg-slate2-50 border border-transparent text-xs focus:outline-none focus:bg-white focus:border-primary-300 transition-all"
              />
            </div>
            <Link to="/insurance/policies" className="text-xs text-primary-500 hover:text-primary-600 font-medium px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors">
              全部保单 →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate2-50/70 border-b border-slate2-100">
              <tr>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">保单信息</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">关联运单</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">险种</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">保费</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">保额</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">保障期限</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">状态</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate2-50">
              {insurancePolicies
                .filter(p => !search || p.policyNo.includes(search) || p.cargoOrderNo.includes(search))
                .map((p) => (
                  <tr key={p.id} className="hover:bg-slate2-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C8102E]/10 to-amber-50 flex items-center justify-center border border-amber-100/50">
                          <FileCheck className="w-5 h-5 text-[#C8102E]" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold text-slate2-700">{p.policyNo}</div>
                          <div className="text-[10px] text-slate2-400 mt-0.5 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {p.cargoName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs text-slate2-600">{p.cargoOrderNo}</span>
                      <div className="text-[10px] text-slate2-400 mt-0.5">{p.route}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        p.insuranceType === 'all_risk' ? 'bg-[#C8102E]/10 text-[#C8102E]' :
                        p.insuranceType === 'comprehensive' ? 'bg-violet-50 text-violet-600' :
                        'bg-slate2-50 text-slate2-600'
                      }`}>
                        {typeLabels[p.insuranceType].label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-mono text-sm font-bold text-[#C8102E]">¥ {p.premium.toLocaleString()}</div>
                      <div className="text-[10px] text-slate2-400 mt-0.5">{(p.premium / p.cargoValue * 1000).toFixed(2)}‰费率</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-mono text-sm font-bold text-slate2-800">¥ {(p.coverageAmount / 10000).toFixed(0)}万</div>
                      <div className="text-[10px] text-slate2-400 mt-0.5">货值 ¥{(p.cargoValue / 10000).toFixed(0)}万</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[11px] text-slate2-600 font-mono">{p.startDate.slice(5, 10)} → {p.endDate.slice(5, 10)}</div>
                      <div className="text-[10px] text-slate2-400 mt-0.5">
                        {p.status === 'active' ? (
                          <span className="text-success-600 flex items-center gap-1"><Clock className="w-3 h-3" />保障中</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusInfo[p.status].className}`}>
                        {p.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />}
                        {statusInfo[p.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button className="w-8 h-8 rounded-lg bg-slate2-50 text-slate2-500 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center justify-center" title="查看保单">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-slate2-50 text-slate2-500 hover:bg-[#C8102E]/10 hover:text-[#C8102E] transition-colors flex items-center justify-center" title="下载电子保单">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PremiumCalculator() {
  const [value, setValue] = useState(1000000)
  const [weight, setWeight] = useState(10000)
  const [type, setType] = useState<'basic' | 'comprehensive' | 'all_risk'>('comprehensive')

  const basePremium = (value * typeLabels[type].rate) / 1000
  const weightFee = Math.max(0, (weight - 5000) / 1000 * 50)
  const total = Math.round(basePremium + weightFee)

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
      <div>
        <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">货物申报价值 (元)</label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate2-200 text-sm font-mono font-bold focus:outline-none focus:border-[#C8102E]/40 focus:ring-2 focus:ring-[#C8102E]/10 transition-all"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">货物重量 (kg)</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate2-200 text-sm font-mono font-bold focus:outline-none focus:border-[#C8102E]/40 focus:ring-2 focus:ring-[#C8102E]/10 transition-all"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">投保险种</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate2-200 text-sm font-medium focus:outline-none focus:border-[#C8102E]/40 focus:ring-2 focus:ring-[#C8102E]/10 transition-all cursor-pointer"
        >
          <option value="basic">基本险 ({typeLabels.basic.rate}‰)</option>
          <option value="comprehensive">综合险 ({typeLabels.comprehensive.rate}‰)</option>
          <option value="all_risk">一切险 ({typeLabels.all_risk.rate}‰)</option>
        </select>
      </div>
      <div className="p-3 rounded-xl bg-gradient-to-br from-[#C8102E]/5 to-[#C8102E]/10 border border-[#C8102E]/15 text-center">
        <div className="text-[10px] text-[#C8102E]/80 font-semibold mb-0.5">估算保费</div>
        <div className="text-2xl font-extrabold font-mono text-[#C8102E] tracking-tight">¥ {total.toLocaleString()}</div>
      </div>
      <Link
        to="/insurance/apply"
        className="flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#E4002B] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#C8102E]/25 transition-all-smooth"
      >
        <Sparkles className="w-4 h-4" />
        去投保
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
