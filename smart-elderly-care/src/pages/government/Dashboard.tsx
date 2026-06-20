import { Users, Target, MessageSquare, CheckCircle, FileText, UserCircle, Route, Clock, TrendingUp, AlertCircle, ChevronRight, MapPin, Phone, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { govDashboard, complaintRecords, subsidyRecords, elderProfiles, institutions, serviceOrders, behaviorAlerts } from '../../data/mockData'
import type { ComplaintRecord, SubsidyRecord, ElderProfile, Institution, ServiceOrder, BehaviorAlert } from '../../types'

const agingTrendData = [
  { month: '1月', rate: 19.5 },
  { month: '2月', rate: 19.8 },
  { month: '3月', rate: 20.3 },
  { month: '4月', rate: 20.9 },
  { month: '5月', rate: 21.2 },
  { month: '6月', rate: 21.8 },
]

const subsidyByTypeData = [
  { type: '养老金', amount: 1280 },
  { type: '失能补贴', amount: 560 },
  { type: '护理补贴', amount: 680 },
  { type: '医疗救助', amount: 336 },
]

const complaintTypeMap: Record<string, string> = {
  service_quality: '服务质量',
  subsidy: '补贴问题',
  facility: '设施问题',
  personnel: '人员问题',
}

const subsidyTypeMap: Record<string, string> = {
  pension: '养老金',
  disability: '失能补贴',
  nursing: '护理补贴',
  medical: '医疗救助',
}

const alertTypeMap: Record<string, { label: string; color: string }> = {
  fall: { label: '跌倒预警', color: 'text-red-600 bg-red-50' },
  miss: { label: '走失预警', color: 'text-orange-600 bg-orange-50' },
  medication: { label: '漏药预警', color: 'text-yellow-600 bg-yellow-50' },
  vital: { label: '体征异常', color: 'text-purple-600 bg-purple-50' },
  activity: { label: '活动异常', color: 'text-blue-600 bg-blue-50' },
}

function QuickEntryCard() {
  const entries = [
    { label: '老人数字档案', icon: <UserCircle className="w-6 h-6" />, path: '/government/elders', count: elderProfiles.length, color: 'from-blue-500 to-blue-600', desc: `${elderProfiles.length}位老人完整档案`, total: '共8位老人' },
    { label: '居家服务工单', icon: <FileText className="w-6 h-6" />, path: '/government/orders', count: serviceOrders.length, color: 'from-primary-500 to-primary-600', desc: '含服务人员资质核验', total: '共12条工单' },
    { label: '智能调度匹配', icon: <Route className="w-6 h-6" />, path: '/government/dispatch', count: 6, color: 'from-green-500 to-green-600', desc: '三维匹配算法', total: '健康等级×距离×紧迫度' },
    { label: '异常行为预警', icon: <AlertCircle className="w-6 h-6" />, path: '/government/orders', count: behaviorAlerts.length, color: 'from-orange-500 to-orange-600', desc: '跌倒/走失/漏药等', total: '共8条预警' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {entries.map((entry) => (
        <Link
          key={entry.label}
          to={entry.path}
          className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-r ${entry.color} text-white shadow-md`}>
              {entry.icon}
            </div>
            <div className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
              {entry.total}
            </div>
          </div>
          <div className="font-semibold text-slate-800 text-base mb-1 group-hover:text-primary-600 transition-colors">
            {entry.label}
          </div>
          <div className="text-xs text-slate-500 mb-3">{entry.desc}</div>
          <div className="flex items-center justify-between text-xs">
            <div className="text-slate-400">点击查看详情</div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      ))}
    </div>
  )
}

function KeyMetricsRow() {
  const metrics = [
    { label: '健康老人', value: '5', total: '8位', color: 'text-green-600', desc: '健康等级A' },
    { label: '养老机构', value: '6', total: '家', color: 'text-primary-600', desc: '平均3.8星' },
    { label: '服务人员', value: '24', total: '人', color: 'text-blue-600', desc: '持证上岗' },
    { label: '待处理工单', value: '3', total: '件', color: 'text-orange-600', desc: '需紧急调度' },
  ]
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">核心业务数据总览</h3>
        <span className="text-xs text-slate-400">实时更新</span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="text-center">
            <div className={`text-2xl font-bold ${m.color} mb-1`}>
              {m.value}<span className="text-sm font-normal text-slate-400">/{m.total}</span>
            </div>
            <div className="text-xs font-medium text-slate-600 mb-0.5">{m.label}</div>
            <div className="text-xs text-slate-400">{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComplaintsTable() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">近期投诉 · 闭环责任链追踪</h3>
        <Link to="/government/complaints" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
          全部投诉 <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-50">
              <th className="px-4 py-3 font-medium">投诉人</th>
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">责任方</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">处理人</th>
              <th className="px-4 py-3 font-medium">闭环率</th>
              <th className="px-4 py-3 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {complaintRecords.slice(0, 5).map((c: ComplaintRecord) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-700">{c.elderName}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{complaintTypeMap[c.type]}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.institutionName || '阳光康养中心'}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} type="complaint" /></td>
                <td className="px-4 py-3 text-sm text-slate-600">李监管</td>
                <td className="px-4 py-3">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                      style={{ width: `${c.status === 'resolved' ? 100 : c.status === 'processing' ? 60 : 20}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">{c.createdAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SubsidyStatsTable() {
  const statsByType: Record<string, { count: number; total: number; disbursed: number; auditRate: number }> = {}
  for (const r of subsidyRecords) {
    const label = subsidyTypeMap[r.type]
    if (!statsByType[label]) statsByType[label] = { count: 0, total: 0, disbursed: 0, auditRate: 0 }
    statsByType[label].count++
    statsByType[label].total += r.amount
    if (r.status === 'disbursed') statsByType[label].disbursed += r.amount
    statsByType[label].auditRate = Math.round((statsByType[label].disbursed / statsByType[label].total) * 100)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">补贴发放统计 · 资金流向追溯</h3>
        <Link to="/government/subsidy" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
          资金追踪 <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-50">
              <th className="px-4 py-3 font-medium">补贴类型</th>
              <th className="px-4 py-3 font-medium">申请数</th>
              <th className="px-4 py-3 font-medium">申请总额</th>
              <th className="px-4 py-3 font-medium">已发放</th>
              <th className="px-4 py-3 font-medium">发放精准度</th>
              <th className="px-4 py-3 font-medium">资金流向</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(statsByType).map(([type, s]) => (
              <tr key={type} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-700 font-medium">{type}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.count} 人</td>
                <td className="px-4 py-3 text-sm text-slate-600">¥{s.total.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-green-600 font-medium">¥{s.disbursed.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gov-400 to-gov-500 rounded-full"
                        style={{ width: `${s.auditRate}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gov-600">{s.auditRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                    民政局 → 机构 → 个人
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RecentEldersPreview() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">重点关注老人 · 业务记录直达</h3>
        <Link to="/government/elders" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
          全部档案 <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {elderProfiles.slice(0, 4).map((elder: ElderProfile) => (
          <div key={elder.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-elderly-400 to-elderly-500 flex items-center justify-center text-white font-medium shrink-0">
                {elder.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-slate-800 text-sm">{elder.name}</span>
                  <span className="text-xs text-slate-400">{elder.age}岁</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${elder.healthLevel === 'A' ? 'bg-green-50 text-green-600' : elder.healthLevel === 'B' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                    健康{elder.healthLevel}级
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{elder.address}</span>
                  <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{elder.emergencyContacts[0]?.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/government/orders" className="text-xs text-primary-600 hover:bg-primary-50 px-2 py-1 rounded transition-colors">
                  工单记录
                </Link>
                <Link to="/government/elders" className="text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded transition-colors">
                  查看档案
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentAlertsPreview() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">异常预警 · 服务真实性核验</h3>
        <Link to="/government/audit" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
          穿透审计 <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {behaviorAlerts.slice(0, 4).map((alert: BehaviorAlert) => (
          <div key={alert.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alertTypeMap[alert.type]?.color || 'bg-slate-100 text-slate-600'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {alert.elderName}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${alertTypeMap[alert.type]?.color || 'bg-slate-100 text-slate-600'}`}>
                    {alertTypeMap[alert.type]?.label || '未知预警'}
                  </span>
                  {alert.reviewed && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> 已核验
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">{alert.description}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">{alert.timestamp.slice(5, 16)}</div>
                {alert.reviewed && (
                  <div className="text-xs text-slate-400 mt-0.5">复核人：{alert.reviewer}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentInstitutionsPreview() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">养老机构 · 服务质量巡查</h3>
        <Link to="/government/orders" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
          服务工单 <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {institutions.slice(0, 4).map((inst: Institution) => (
          <div key={inst.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-400 to-primary-500 flex items-center justify-center text-white shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-slate-800 text-sm">{inst.name}</span>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < inst.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>床位 {inst.bedsOccupied}/{inst.totalBeds}</span>
                  <span>入住率 {Math.round(inst.bedsOccupied / inst.totalBeds * 100)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/government/orders" className="text-xs text-primary-600 hover:bg-primary-50 px-2 py-1 rounded transition-colors">
                  服务记录
                </Link>
                <Link to="/government/audit" className="text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded transition-colors">
                  巡查记录
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="区域老龄化率"
          value={govDashboard.regionAgingRate}
          unit="%"
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 1.2, isUp: true }}
          color="blue"
          subText="较上月 +1.2%"
        />
        <StatCard
          title="补贴发放精准度"
          value={govDashboard.subsidyPrecision}
          unit="%"
          icon={<Target className="w-5 h-5" />}
          trend={{ value: 0.8, isUp: true }}
          color="green"
          subText="96.5% 发放准确"
        />
        <StatCard
          title="投诉闭环率"
          value={govDashboard.complaintResolutionRate}
          unit="%"
          icon={<MessageSquare className="w-5 h-5" />}
          trend={{ value: 2.3, isUp: true }}
          color="orange"
          subText="较上月 +2.3%"
        />
        <StatCard
          title="工单完成率"
          value={govDashboard.completedOrderRate}
          unit="%"
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: 1.5, isUp: true }}
          color="purple"
          subText="服务调度响应正常"
        />
      </div>

      <QuickEntryCard />

      <KeyMetricsRow />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">老龄化率月度趋势</h3>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> 上升趋势
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={agingTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[18, 23]} tick={{ fontSize: 12, fill: '#94a3b8' }} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(value) => [`${value}%`, '老龄化率']}
              />
              <Area type="monotone" dataKey="rate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">补贴发放类型分布</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" /> 单位：万元
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={subsidyByTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} unit="万" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(value) => [`${value}万元`, '发放金额']}
              />
              <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplaintsTable />
        <SubsidyStatsTable />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentEldersPreview />
        <RecentAlertsPreview />
      </div>

      <RecentInstitutionsPreview />
    </div>
  )
}
