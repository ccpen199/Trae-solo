import { useState } from 'react'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Eye,
  FileText,
  MapPin,
  DollarSign,
  Filter,
  ChevronRight,
  AlertOctagon,
  Ban,
  Search,
  Users,
  TrendingDown,
  Clock,
} from 'lucide-react'

type TabKey = 'ai_audit' | 'aml' | 'geofence'

export default function Compliance() {
  const [activeTab, setActiveTab] = useState<TabKey>('ai_audit')
  const [keyword, setKeyword] = useState('')

  const stats = [
    { label: '今日审核', value: '2,861', icon: Eye, color: 'from-sky-500 to-blue-600' },
    { label: '风险预警', value: 23, icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
    { label: '违规拦截', value: 8, icon: Ban, color: 'from-rose-500 to-pink-600' },
    { label: '合规率', value: '99.6%', icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
  ]

  // AI话术审核
  const aiAuditLogs = [
    {
      id: 'LOG001',
      user: '赵XX',
      userId: 'DS0234',
      content: '这个产品可以治疗高血压和糖尿病，三个月见效',
      risk: 'high',
      type: '夸大宣传',
      keywords: ['治疗', '高血压', '糖尿病', '见效'],
      time: '10 分钟前',
      status: 'blocked',
    },
    {
      id: 'LOG002',
      user: '孙XX',
      userId: 'DS0178',
      content: '保证年收益30%，投入10万年赚3万',
      risk: 'high',
      type: '违规承诺收益',
      keywords: ['保证', '收益', '投入', '赚'],
      time: '35 分钟前',
      status: 'blocked',
    },
    {
      id: 'LOG003',
      user: '周XX',
      userId: 'DS0056',
      content: '松花粉是国珍最好的产品，推荐您试试',
      risk: 'low',
      type: '正常内容',
      keywords: [],
      time: '1 小时前',
      status: 'passed',
    },
    {
      id: 'LOG004',
      user: '吴XX',
      userId: 'DS0092',
      content: '买我们的产品可以参与返利，推荐朋友还有佣金',
      risk: 'medium',
      type: '疑似传销话术',
      keywords: ['返利', '推荐', '佣金'],
      time: '2 小时前',
      status: 'review',
    },
    {
      id: 'LOG005',
      user: '郑XX',
      userId: 'DS0145',
      content: '竹康宁可以替代降压药，长期服用无副作用',
      risk: 'high',
      type: '医疗宣称',
      keywords: ['替代', '降压药', '无副作用'],
      time: '3 小时前',
      status: 'blocked',
    },
  ]

  // 反洗钱
  const amlRecords = [
    {
      id: 'AML001',
      user: '钱XX',
      userId: 'DS0067',
      amount: '¥86,500',
      type: '大额提现',
      frequency: '本月第 5 次',
      risk: 'high',
      time: '2026-06-17',
      status: 'frozen',
    },
    {
      id: 'AML002',
      user: '冯XX',
      userId: 'DS0189',
      amount: '¥12,800',
      type: '多笔小额累计',
      frequency: '近7天 18 笔',
      risk: 'medium',
      time: '2026-06-17',
      status: 'review',
    },
    {
      id: 'AML003',
      user: '陈XX',
      userId: 'DS0023',
      amount: '¥256,000',
      type: '跨区域大额交易',
      frequency: '异常区域',
      risk: 'high',
      time: '2026-06-16',
      status: 'frozen',
    },
    {
      id: 'AML004',
      user: '褚XX',
      userId: 'DS0078',
      amount: '¥8,900',
      type: '正常提现',
      frequency: '本月第 2 次',
      risk: 'low',
      time: '2026-06-16',
      status: 'passed',
    },
  ]

  // 地理围栏
  const geoAlerts = [
    {
      id: 'GEO001',
      user: '卫XX',
      userId: 'DS0201',
      region: '授权：华东区 · 实际：北京市朝阳区',
      distance: '1,082 km',
      duration: '连续 3 天',
      risk: 'high',
      time: '2026-06-17',
    },
    {
      id: 'GEO002',
      user: '蒋XX',
      userId: 'DS0134',
      region: '授权：上海市 · 实际：江苏省苏州市',
      distance: '86 km',
      duration: '单日异常',
      risk: 'medium',
      time: '2026-06-17',
    },
    {
      id: 'GEO003',
      user: '沈XX',
      userId: 'DS0089',
      region: '授权：华南区 · 实际：深圳市',
      distance: '正常区域',
      duration: '合规',
      risk: 'low',
      time: '2026-06-17',
    },
  ]

  const riskColors: Record<string, string> = {
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  const riskLabels: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  }

  const statusColors: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
    blocked: { label: '已拦截', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Ban },
    review: { label: '待复核', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
    passed: { label: '已通过', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    frozen: { label: '已冻结', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Ban },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-7 h-7 text-rose-600" />
          合规风控中心
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          敏感话术 AI 识别 · 收入提现反洗钱校验 · 跨区域展业地理围栏
        </p>
      </div>

      {/* 数据统计 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 inline-flex">
        {[
          { key: 'ai_audit', label: 'AI 话术审核', icon: AlertOctagon, badge: aiAuditLogs.filter((l) => l.status !== 'passed').length },
          { key: 'aml', label: '反洗钱监控', icon: DollarSign, badge: amlRecords.filter((r) => r.risk !== 'low').length },
          { key: 'geofence', label: '地理围栏', icon: MapPin, badge: geoAlerts.filter((g) => g.risk !== 'low').length },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* AI 话术审核 */}
      {activeTab === 'ai_audit' && (
        <>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索用户ID、内容关键词..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent focus:bg-white transition"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                {['全部', '高风险', '中风险', '低风险', '待复核', '已拦截'].map((f) => (
                  <button
                    key={f}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition whitespace-nowrap"
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition flex items-center gap-2 whitespace-nowrap">
                <Filter className="w-4 h-4" />
                高级筛选
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {aiAuditLogs
                .filter((l) => !keyword || l.content.includes(keyword) || l.user.includes(keyword))
                .map((log) => {
                  const sc = statusColors[log.status]
                  const StatusIcon = sc.icon
                  return (
                    <div key={log.id} className="p-6 hover:bg-slate-50 transition">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              log.risk === 'high'
                                ? 'bg-rose-100'
                                : log.risk === 'medium'
                                ? 'bg-amber-100'
                                : 'bg-emerald-100'
                            }`}
                          >
                            {log.risk === 'high' ? (
                              <AlertOctagon className="w-5 h-5 text-rose-600" />
                            ) : log.risk === 'medium' ? (
                              <AlertTriangle className="w-5 h-5 text-amber-600" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-semibold text-slate-800">{log.user}</span>
                              <span className="text-xs text-slate-400 font-mono">{log.userId}</span>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${riskColors[log.risk]}`}
                              >
                                {riskLabels[log.risk]}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${sc.color}`}
                              >
                                <StatusIcon className="w-3 h-3 inline mr-1" />
                                {sc.label}
                              </span>
                              <span className="text-xs text-slate-400">{log.time}</span>
                            </div>
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <p className="text-slate-700 text-sm leading-relaxed">
                                {log.content.split(/(治疗|高血压|糖尿病|见效|保证|收益|投入|赚|替代|降压药|无副作用|返利|佣金)/g).map((part, i) =>
                                  ['治疗', '高血压', '糖尿病', '见效', '保证', '收益', '投入', '赚', '替代', '降压药', '无副作用', '返利', '佣金'].includes(part) ? (
                                    <mark key={i} className="bg-rose-200 text-rose-800 px-0.5 rounded">
                                      {part}
                                    </mark>
                                  ) : (
                                    part
                                  )
                                )}
                              </p>
                            </div>
                            {log.keywords.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                <span className="text-xs text-slate-500 mr-1">敏感关键词：</span>
                                {log.keywords.map((k) => (
                                  <span
                                    key={k}
                                    className="px-2 py-0.5 text-xs bg-rose-50 text-rose-700 rounded border border-rose-200"
                                  >
                                    {k}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 text-xs text-slate-500">违规类型：{log.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.status === 'review' && (
                            <>
                              <button className="px-4 py-1.5 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
                                标记合规
                              </button>
                              <button className="px-4 py-1.5 text-sm font-medium bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition">
                                确认拦截
                              </button>
                            </>
                          )}
                          <button className="px-4 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            详情
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </>
      )}

      {/* 反洗钱 */}
      {activeTab === 'aml' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-rose-600" />
              提现交易风控记录
            </h3>
            <button className="text-sm text-rose-600 hover:text-rose-700 font-medium">
              批量处理
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">用户</th>
                  <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">交易金额</th>
                  <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">风险类型</th>
                  <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">频次异常</th>
                  <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">风险等级</th>
                  <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">时间</th>
                  <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">状态</th>
                  <th className="text-right py-3.5 px-6 text-sm font-semibold text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {amlRecords.map((r) => {
                  const sc = statusColors[r.status]
                  const StatusIcon = sc.icon
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-medium text-slate-700">
                            {r.user.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{r.user}</div>
                            <div className="text-xs text-slate-500 font-mono">{r.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800 text-lg">{r.amount}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-700">{r.type}</td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-1 text-sm text-slate-600">
                          <TrendingDown className={`w-4 h-4 ${r.risk === 'high' ? 'text-rose-500' : 'text-amber-500'}`} />
                          {r.frequency}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${riskColors[r.risk]}`}
                        >
                          {riskLabels[r.risk]}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-sm">{r.time}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${sc.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 ml-auto justify-end">
                          处理
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 地理围栏 */}
      {activeTab === 'geofence' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  跨区域展业地理围栏
                </h3>
                <p className="mt-1 text-white/80 text-sm">实时监控展业区域合规性，防止跨区违规展业</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{geoAlerts.filter((g) => g.risk === 'high').length}</div>
                  <div className="text-xs text-white/70">高风险越界</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{geoAlerts.filter((g) => g.risk === 'medium').length}</div>
                  <div className="text-xs text-white/70">中风险异常</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">98.7%</div>
                  <div className="text-xs text-white/70">区域合规率</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {geoAlerts.map((g) => (
              <div
                key={g.id}
                className={`bg-white rounded-2xl p-6 border transition hover:shadow-lg ${
                  g.risk === 'high'
                    ? 'border-rose-200'
                    : g.risk === 'medium'
                    ? 'border-amber-200'
                    : 'border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-medium text-slate-700">
                      {g.user.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{g.user}</div>
                      <div className="text-xs text-slate-500 font-mono">{g.userId}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full border ${riskColors[g.risk]}`}
                  >
                    {riskLabels[g.risk]}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{g.region}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>📏 {g.distance}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {g.duration}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">异常时间：{g.time}</div>
                </div>
                {g.risk !== 'low' && (
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 py-2 text-sm font-medium bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition">
                      发送预警
                    </button>
                    <button className="flex-1 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">
                      联系确认
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
