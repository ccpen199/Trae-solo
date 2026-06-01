import React, { useEffect, useState } from 'react'
import {
  Shield,
  Award,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  TrendingUp,
  Lock,
  Eye,
  Activity,
  Database,
  Users,
  Settings,
  FileText,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Area, AreaChart, XAxis, YAxis, CartesianGrid, RadialBar, RadialBarChart } from 'recharts'
import { api } from '@/lib/api'
import type { AuditLog } from '../../api/types'

interface ComplianceData {
  iso27001_certified: boolean
  certification_number: string
  valid_until: string
  last_audit_date: string
  security_policies: Array<{
    name: string
    version: string
    last_updated: string
  }>
}

interface SecurityDomain {
  name: string
  completed: number
  total: number
  icon: any
  color: string
}

interface ComplianceCheckItem {
  id: number
  category: string
  checkItem: string
  status: 'compliant' | 'partial' | 'non_compliant'
  lastChecked: string
  description: string
}

const SecurityCompliance: React.FC = () => {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [auditLogs, setAuditLogs] = useState<(AuditLog & { admin_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'controls' | 'checklist' | 'audit'>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  const securityDomains: SecurityDomain[] = [
    { name: '安全策略', completed: 12, total: 12, icon: FileText, color: '#2A9D8F' },
    { name: '访问控制', completed: 18, total: 20, icon: Lock, color: '#457B9D' },
    { name: '数据安全', completed: 15, total: 15, icon: Database, color: '#E63946' },
    { name: '人员安全', completed: 8, total: 10, icon: Users, color: '#F4A261' },
    { name: '物理安全', completed: 9, total: 10, icon: Shield, color: '#E76F51' },
    { name: '运维安全', completed: 14, total: 15, icon: Settings, color: '#457B9D' },
  ]

  const [checkItems] = useState<ComplianceCheckItem[]>([
    { id: 1, category: '数据安全', checkItem: '敏感数据加密存储', status: 'compliant', lastChecked: '2026-05-28', description: '数据库中敏感字段已全部采用AES-256加密' },
    { id: 2, category: '访问控制', checkItem: '双因素认证启用', status: 'compliant', lastChecked: '2026-05-28', description: '所有管理员账号已启用双因素认证' },
    { id: 3, category: '访问控制', checkItem: '最小权限原则执行', status: 'partial', lastChecked: '2026-05-27', description: '部分岗位权限需进一步细化' },
    { id: 4, category: '数据安全', checkItem: '数据脱敏规则执行', status: 'compliant', lastChecked: '2026-05-27', description: '接口返回数据脱敏规则正常执行' },
    { id: 5, category: '运维安全', checkItem: '日志审计完整性', status: 'compliant', lastChecked: '2026-05-26', description: '系统日志完整保存180天以上' },
    { id: 6, category: '运维安全', checkItem: '漏洞扫描定期执行', status: 'compliant', lastChecked: '2026-05-25', description: '每周一次漏洞扫描，无高危漏洞' },
    { id: 7, category: '人员安全', checkItem: '安全培训覆盖率', status: 'non_compliant', lastChecked: '2026-05-24', description: '新员工安全培训需在入职3天内完成' },
    { id: 8, category: '物理安全', checkItem: '机房环境监控', status: 'compliant', lastChecked: '2026-05-23', description: '温湿度、监控系统运行正常' },
  ])

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    compliant: { label: '合规', color: 'text-sf-green', bgColor: 'bg-sf-green/10', icon: CheckCircle },
    partial: { label: '部分合规', color: 'text-sf-yellow', bgColor: 'bg-sf-yellow/10', icon: AlertTriangle },
    non_compliant: { label: '不合规', color: 'text-sf-red', bgColor: 'bg-sf-red/10', icon: XCircle },
  }

  const actionConfig: Record<string, { label: string; color: string }> = {
    'DECRYPT_REQUEST_CREATE': { label: '创建解密申请', color: 'text-sf-blue' },
    'DECRYPT_REQUEST_APPROVE': { label: '批准解密申请', color: 'text-sf-green' },
    'DECRYPT_REQUEST_REJECT': { label: '拒绝解密申请', color: 'text-sf-red' },
    'LOGIN_SUCCESS': { label: '登录成功', color: 'text-sf-green' },
    'LOGIN_FAILED': { label: '登录失败', color: 'text-sf-red' },
    'POLICY_UPDATED': { label: '策略更新', color: 'text-sf-yellow' },
    'RULE_CHANGED': { label: '规则变更', color: 'text-sf-orange' },
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [complianceResult, auditResult] = await Promise.all([
        api.security.compliance(),
        api.security.auditLog({ page: 1, pageSize: 50 }),
      ])

      if (complianceResult.success && complianceResult.data) {
        setComplianceData(complianceResult.data as ComplianceData)
      }
      if (auditResult.success && auditResult.data) {
        setAuditLogs(auditResult.data as (AuditLog & { admin_name?: string })[])
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const overallScore = securityDomains.reduce((acc, d) => acc + d.completed, 0) /
    securityDomains.reduce((acc, d) => acc + d.total, 0) * 100

  const pieData = [
    { name: '已合规', value: checkItems.filter(c => c.status === 'compliant').length, color: '#2A9D8F' },
    { name: '部分合规', value: checkItems.filter(c => c.status === 'partial').length, color: '#F4A261' },
    { name: '不合规', value: checkItems.filter(c => c.status === 'non_compliant').length, color: '#E63946' },
  ]

  const trendData = [
    { month: '1月', score: 82 },
    { month: '2月', score: 85 },
    { month: '3月', score: 88 },
    { month: '4月', score: 91 },
    { month: '5月', score: Math.round(overallScore) },
  ]

  const gaugeData = [
    { name: '合规度', value: Math.round(overallScore), fill: overallScore >= 90 ? '#2A9D8F' : overallScore >= 70 ? '#F4A261' : '#E63946' },
  ]

  const filteredLogs = auditLogs.filter(log => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.action.toLowerCase().includes(query) ||
      (log.admin_name || '').toLowerCase().includes(query) ||
      log.target.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={32} className="animate-spin text-sf-red" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-sf-light">ISO27001合规中心</h1>
          <p className="text-sf-light/50 text-sm mt-1">信息安全管理体系合规性监控与审计</p>
        </div>
        <div className="flex items-center gap-3">
          {complianceData?.iso27001_certified && (
            <div className="px-4 py-2 bg-sf-green/10 border border-sf-green/30 rounded-lg flex items-center gap-2">
              <Award size={16} className="text-sf-green" />
              <span className="text-sf-green text-sm">ISO27001已认证</span>
            </div>
          )}
          <button
            onClick={fetchData}
            className="h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:text-sf-light hover:border-sf-blue/40 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'overview', label: '合规概览', icon: Activity },
          { key: 'controls', label: '安全控制域', icon: Shield },
          { key: 'checklist', label: '合规检查项', icon: FileCheck },
          { key: 'audit', label: '审计日志', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === tab.key
                ? 'bg-sf-red text-white'
                : 'bg-sf-dark/50 text-sf-light/70 hover:text-sf-light border border-sf-blue/20'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display text-sf-light">ISO27001证书信息</h3>
              <div className="px-3 py-1.5 bg-sf-green/10 text-sf-green rounded-lg text-sm flex items-center gap-2">
                <CheckCircle size={14} />
                证书有效
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="p-4 bg-sf-dark/50 rounded-lg">
                <div className="text-sm text-sf-light/50 mb-1">证书编号</div>
                <div className="text-sf-light font-mono">{complianceData?.certification_number}</div>
              </div>
              <div className="p-4 bg-sf-dark/50 rounded-lg">
                <div className="text-sm text-sf-light/50 mb-1">认证标准</div>
                <div className="text-sf-light">ISO/IEC 27001:2022</div>
              </div>
              <div className="p-4 bg-sf-dark/50 rounded-lg">
                <div className="text-sm text-sf-light/50 mb-1">上次审计日期</div>
                <div className="text-sf-light">{complianceData?.last_audit_date}</div>
              </div>
              <div className="p-4 bg-sf-dark/50 rounded-lg">
                <div className="text-sm text-sf-light/50 mb-1">有效期至</div>
                <div className="text-sf-green">{complianceData?.valid_until}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="glass rounded-xl p-6 border border-sf-green/30">
              <h3 className="text-lg font-display text-sf-light mb-4">综合合规度</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    barSize={20}
                    data={gaugeData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      fill={gaugeData[0].fill}
                    />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-3xl font-display"
                      fill={gaugeData[0].fill}
                    >
                      {gaugeData[0].value}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sf-green">
                  <TrendingUp size={16} />
                  <span className="text-sm">较上月 +3%</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-sf-blue/30">
              <h3 className="text-lg font-display text-sf-light mb-4">合规状态分布</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1A2E',
                        border: '1px solid #457B9D',
                        borderRadius: '8px',
                        color: '#F1FAEE',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-sf-light/70">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-sf-yellow/30">
              <h3 className="text-lg font-display text-sf-light mb-4">合规趋势</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B2D42" />
                    <XAxis dataKey="month" stroke="#F1FAEE" strokeOpacity={0.5} fontSize={12} />
                    <YAxis stroke="#F1FAEE" strokeOpacity={0.5} fontSize={12} domain={[60, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1A2E',
                        border: '1px solid #457B9D',
                        borderRadius: '8px',
                        color: '#F1FAEE',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#2A9D8F"
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-4">安全策略文档</h3>
            <div className="grid grid-cols-4 gap-4">
              {complianceData?.security_policies.map((policy, index) => (
                <div
                  key={index}
                  className="p-4 bg-sf-dark/50 rounded-lg border border-sf-blue/10 card-hover"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-sf-blue/10 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-sf-blue" />
                    </div>
                    <div>
                      <div className="text-sf-light font-medium">{policy.name}</div>
                      <div className="text-xs text-sf-light/50">{policy.version}</div>
                    </div>
                  </div>
                  <div className="text-xs text-sf-light/40">
                    最后更新: {policy.last_updated}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'controls' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {securityDomains.map((domain, index) => {
              const DomainIcon = domain.icon
              const percentage = Math.round(domain.completed / domain.total * 100)
              return (
                <div
                  key={index}
                  className="glass rounded-xl p-6 border border-sf-blue/30 card-hover"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${domain.color}20` }}>
                        <DomainIcon size={22} style={{ color: domain.color }} />
                      </div>
                      <div>
                        <div className="text-lg font-medium text-sf-light">{domain.name}</div>
                        <div className="text-sm text-sf-light/50">
                          {domain.completed}/{domain.total} 项已完成
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-display" style={{ color: domain.color }}>
                      {percentage}%
                    </div>
                  </div>
                  <div className="h-2 bg-sf-dark rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: domain.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="glass rounded-xl p-6 border border-sf-blue/30">
          <h3 className="text-lg font-display text-sf-light mb-6">合规检查项</h3>
          <div className="space-y-4">
            {checkItems.map((item) => {
              const status = statusConfig[item.status]
              const StatusIcon = status.icon
              return (
                <div
                  key={item.id}
                  className="p-5 bg-sf-dark/50 rounded-lg border border-sf-blue/10 card-hover"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 ${status.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon size={20} className={status.color} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-sf-light font-medium">{item.checkItem}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${status.bgColor} ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-sf-blue/10 text-sf-blue">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-sf-light/50 text-sm mt-1">{item.description}</p>
                        <div className="text-xs text-sf-light/40 mt-2">
                          上次检查: {item.lastChecked}
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-sf-blue/10 text-sf-blue rounded-lg text-sm hover:bg-sf-blue/20 transition-colors flex items-center gap-2">
                      <Eye size={14} />
                      详情
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sf-light/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索操作类型、管理员、操作对象..."
                  className="w-full h-11 pl-12 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const action = actionConfig[log.action] || { label: log.action, color: 'text-sf-light' }
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 bg-sf-dark/50 rounded-lg border border-sf-blue/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-sf-blue/10 rounded-lg flex items-center justify-center">
                        <Activity size={18} className="text-sf-blue" />
                      </div>
                      <div>
                        <div className={`font-medium ${action.color}`}>
                          {action.label}
                        </div>
                        <div className="text-sm text-sf-light/50 mt-0.5">
                          操作对象: <span className="text-sf-light">{log.target}</span>
                          {log.detail && (
                            <span className="ml-2">· {log.detail}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-sf-light/70">{log.admin_name || '系统'}</div>
                      <div className="text-xs text-sf-light/40 mt-0.5">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <Clock size={48} className="text-sf-light/30 mx-auto mb-4" />
                  <p className="text-sf-light/50">暂无审计日志记录</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityCompliance
