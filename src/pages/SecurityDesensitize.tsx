import React, { useEffect, useState } from 'react'
import {
  Shield,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
  RefreshCw,
  Search,
  Clock,
  User,
  Phone,
  MapPin,
  CreditCard,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  CheckCircle,
  History,
  Key,
  UserCheck,
  Calendar,
  ExternalLink,
  Eye as ViewIcon,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { useNavigate } from 'react-router-dom'

interface DesensitizeRule {
  field: string
  rule: string
  example: string
  enabled: boolean
}

interface TestData {
  phone: string
  name: string
  idCard: string
  address: string
}

interface DecryptRecord {
  id: number
  applicant: string
  field: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approver?: string
  applyTime: string
  approveTime?: string
  expireTime?: string
  orderNo: string
  trackingNo: string
  viewedAt?: string
}

interface ReviewRecord {
  id: number
  reviewer: string
  type: string
  result: string
  time: string
  remark: string
}

interface RuleChangeRequest {
  id: number
  field: string
  oldValue: string
  newValue: string
  operator: string
  status: 'pending' | 'approved' | 'rejected'
  approver?: string
  applyTime: string
  approveTime?: string
}

const getNow = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const SecurityDesensitize: React.FC = () => {
  const { addNotification } = useAppStore()
  const navigate = useNavigate()
  const [rules, setRules] = useState<DesensitizeRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [testData, setTestData] = useState<TestData>({
    phone: '13812345678',
    name: '张三丰',
    idCard: '110101199001011234',
    address: '北京市朝阳区建国路88号顺丰大厦',
  })
  const [activeTab, setActiveTab] = useState<'rules' | 'preview' | 'decrypt' | 'review' | 'logs'>('rules')
  const [showRawData, setShowRawData] = useState(false)
  const [decryptPassword, setDecryptPassword] = useState('')
  const [saveConfirm, setSaveConfirm] = useState<{ field: string; oldValue: string; newValue: string } | null>(null)
  const [decryptRecords, setDecryptRecords] = useState<DecryptRecord[]>([
    { id: 1, applicant: '客服经理小王', field: '收件人手机号', reason: '客户投诉处理需要联系收件人', status: 'approved', approver: '安全主管李总', applyTime: '2026-05-29 10:30:00', approveTime: '2026-05-29 10:35:00', expireTime: '2026-05-30 10:35:00', orderNo: 'SF20260529001', trackingNo: 'SF1234567890', viewedAt: '2026-05-29 11:00:00' },
    { id: 2, applicant: '片区经理老张', field: '寄件人地址', reason: '异常件上门核实', status: 'approved', approver: '安全主管李总', applyTime: '2026-05-28 14:20:00', approveTime: '2026-05-28 14:25:00', expireTime: '2026-05-29 14:25:00', orderNo: 'SF20260528002', trackingNo: 'SF9876543210' },
    { id: 3, applicant: '运营专员小李', field: '收件人身份证号', reason: '大件物流身份验证', status: 'pending', applyTime: '2026-05-29 15:40:00', orderNo: 'SF20260529003', trackingNo: 'SF5678901234' },
    { id: 4, applicant: '实习生小陈', field: '寄件人手机号', reason: '数据统计分析', status: 'rejected', approver: '安全主管李总', applyTime: '2026-05-27 09:15:00', approveTime: '2026-05-27 09:20:00', orderNo: 'SF20260527004', trackingNo: 'SF3456789012' },
  ])
  const [reviewRecords] = useState<ReviewRecord[]>([
    { id: 1, reviewer: 'ISO27001审核员', type: '年度合规复查', result: '通过', time: '2026-05-20 16:00:00', remark: '数据脱敏机制符合ISO27001要求，建议持续优化规则配置' },
    { id: 2, reviewer: '内部审计组', type: '季度安全审计', result: '通过', time: '2026-04-15 14:30:00', remark: '脱敏规则执行正常，解密审批流程完整' },
    { id: 3, reviewer: '安全主管李总', type: '月度合规检查', result: '通过', time: '2026-05-01 10:00:00', remark: '所有敏感字段均已正确脱敏' },
  ])
  const [logs, setLogs] = useState<Array<{
    id: number
    action: string
    operator: string
    target: string
    time: string
    detail?: string
  }>>([
    { id: 1, action: '修改脱敏规则', operator: '系统管理员', target: '手机号规则', time: '2026-05-28 14:30:00', detail: '规则由 "中间4位脱敏" 变更为 "中间4位脱敏(严格)"' },
    { id: 2, action: '启用脱敏规则', operator: '安全主管', target: '身份证号规则', time: '2026-05-27 10:15:00' },
    { id: 3, action: '新增脱敏规则', operator: '系统管理员', target: '地址规则', time: '2026-05-26 16:45:00' },
    { id: 4, action: '批准解密申请', operator: '安全主管', target: '运单#10086', time: '2026-05-29 10:35:00' },
    { id: 5, action: '拒绝解密申请', operator: '安全主管', target: '实习生小陈', time: '2026-05-27 09:20:00' },
  ])
  const [ruleChangeRequests, setRuleChangeRequests] = useState<RuleChangeRequest[]>([])
  const [nextLogId, setNextLogId] = useState(6)
  const [nextChangeRequestId, setNextChangeRequestId] = useState(1)

  const fieldIcons: Record<string, any> = {
    '手机号': Phone,
    '姓名': User,
    '身份证号': CreditCard,
    '地址': MapPin,
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const result = await api.security.desensitizeRules()
      if (result.success && result.data) {
        setRules(result.data as DesensitizeRule[])
      }
    } catch (error) {
      console.error('Failed to fetch desensitize rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const addLog = (action: string, operator: string, target: string, detail?: string) => {
    const newLog = { id: nextLogId, action, operator, target, time: getNow(), detail }
    setLogs(prev => [newLog, ...prev])
    setNextLogId(prev => prev + 1)
  }

  const desensitizeValue = (value: string, field: string): string => {
    const rule = rules.find(r => r.field === field)
    if (!rule || !rule.enabled) return value

    switch (field) {
      case '手机号':
        return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      case '姓名':
        if (value.length <= 2) return value.charAt(0) + '*'
        return value.charAt(0) + '*'.repeat(value.length - 2) + value.charAt(value.length - 1)
      case '身份证号':
        return value.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
      case '地址':
        return value.replace(/(.{6}).+/, '$1***')
      default:
        return value
    }
  }

  const handleEdit = (rule: DesensitizeRule) => {
    setEditingRule(rule.field)
    setEditValue(rule.rule)
  }

  const handleSave = (field: string) => {
    const oldRule = rules.find(r => r.field === field)
    if (!oldRule) return

    const oldValue = oldRule.rule
    const newValue = editValue

    setRules(rules.map(r => r.field === field ? { ...r, rule: editValue } : r))
    setEditingRule(null)
    setEditValue('')

    const changeRequest: RuleChangeRequest = {
      id: nextChangeRequestId,
      field,
      oldValue,
      newValue,
      operator: '系统管理员',
      status: 'pending',
      applyTime: getNow(),
    }
    setRuleChangeRequests(prev => [changeRequest, ...prev])
    setNextChangeRequestId(prev => prev + 1)

    addLog('提交规则变更', '系统管理员', `${field}规则`, `规则由 "${oldValue}" 变更为 "${newValue}"，等待审批`)

    setSaveConfirm({ field, oldValue, newValue })
  }

  const handleApproveRuleChange = (requestId: number) => {
    setRuleChangeRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'approved' as const, approver: '安全主管李总', approveTime: getNow() } : r
    ))
    const request = ruleChangeRequests.find(r => r.id === requestId)
    if (request) {
      addLog('批准规则变更', '安全主管李总', `${request.field}规则`, `规则由 "${request.oldValue}" 变更为 "${request.newValue}" 已批准`)
    }
  }

  const handleRejectRuleChange = (requestId: number) => {
    const request = ruleChangeRequests.find(r => r.id === requestId)
    if (request) {
      setRules(prev => prev.map(r =>
        r.field === request.field ? { ...r, rule: request.oldValue } : r
      ))
      addLog('拒绝规则变更', '安全主管李总', `${request.field}规则`, `规则变更 "${request.oldValue}" → "${request.newValue}" 已拒绝，已恢复原规则`)
    }
    setRuleChangeRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const, approver: '安全主管李总', approveTime: getNow() } : r
    ))
  }

  const toggleRule = (field: string) => {
    const rule = rules.find(r => r.field === field)
    const willEnable = !rule?.enabled
    setRules(rules.map(r => r.field === field ? { ...r, enabled: !r.enabled } : r))
    addLog(willEnable ? '启用脱敏规则' : '禁用脱敏规则', '系统管理员', `${field}规则`)
  }

  const getMaskedTestData = () => ({
    phone: desensitizeValue(testData.phone, '手机号'),
    name: desensitizeValue(testData.name, '姓名'),
    idCard: desensitizeValue(testData.idCard, '身份证号'),
    address: desensitizeValue(testData.address, '地址'),
  })

  const handleViewRawData = () => {
    if (decryptPassword === 'admin123') {
      setShowRawData(true)
      addLog('查看原始数据', '当前用户', '数据预览', '通过授权密码查看原始敏感数据')
    } else {
      addNotification({ type: 'error', message: '密码错误，演示密码: admin123' })
    }
  }

  const handleDecryptApprove = (recordId: number) => {
    const now = getNow()
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    const expireTime = `${expireDate.getFullYear()}-${pad(expireDate.getMonth() + 1)}-${pad(expireDate.getDate())} ${pad(expireDate.getHours())}:${pad(expireDate.getMinutes())}:${pad(expireDate.getSeconds())}`

    setDecryptRecords(prev => prev.map(r =>
      r.id === recordId ? { ...r, status: 'approved' as const, approver: '安全主管李总', approveTime: now, expireTime } : r
    ))
    const record = decryptRecords.find(r => r.id === recordId)
    if (record) {
      addLog('批准解密申请', '安全主管李总', `${record.applicant} - ${record.field}`, `运单号: ${record.trackingNo}，有效期至 ${expireTime}`)
    }
  }

  const handleDecryptReject = (recordId: number) => {
    const now = getNow()
    setDecryptRecords(prev => prev.map(r =>
      r.id === recordId ? { ...r, status: 'rejected' as const, approver: '安全主管李总', approveTime: now } : r
    ))
    const record = decryptRecords.find(r => r.id === recordId)
    if (record) {
      addLog('拒绝解密申请', '安全主管李总', `${record.applicant} - ${record.field}`, `运单号: ${record.trackingNo}，理由不合规`)
    }
  }

  const handleMarkViewed = (recordId: number) => {
    const now = getNow()
    setDecryptRecords(prev => prev.map(r =>
      r.id === recordId ? { ...r, viewedAt: now } : r
    ))
    const record = decryptRecords.find(r => r.id === recordId)
    if (record) {
      addLog('查看解密数据', record.applicant, record.field, `运单号: ${record.trackingNo}，已查看敏感数据`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={32} className="animate-spin text-sf-red" />
      </div>
    )
  }

  const maskedData = getMaskedTestData()

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return { bg: 'bg-sf-green/10', color: 'text-sf-green', label: '已批准' }
      case 'rejected': return { bg: 'bg-sf-red/10', color: 'text-sf-red', label: '已拒绝' }
      case 'pending': return { bg: 'bg-sf-yellow/10', color: 'text-sf-yellow', label: '待审批' }
      default: return { bg: 'bg-sf-blue/10', color: 'text-sf-blue', label: '未知' }
    }
  }

  const getPendingChangeForField = (field: string) => ruleChangeRequests.find(r => r.field === field && r.status === 'pending')

  return (
    <div className="space-y-6">
      {saveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-sf-dark border border-sf-green/40 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-sf-green/10 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} className="text-sf-green" />
              </div>
              <div>
                <h3 className="text-lg font-display text-sf-light">规则变更已提交，等待审批</h3>
                <p className="text-sf-light/50 text-sm">变更已记录，需安全主管审批后方可正式生效</p>
              </div>
            </div>
            <div className="p-4 bg-sf-dark/50 rounded-lg border border-sf-blue/20 space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sf-light/50">字段</span>
                <span className="text-sf-light">{saveConfirm.field}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-sf-light/50">原规则</span>
                <span className="text-sf-red line-through">{saveConfirm.oldValue}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-sf-light/50">新规则</span>
                <span className="text-sf-green">{saveConfirm.newValue}</span>
              </div>
            </div>
            <button
              onClick={() => setSaveConfirm(null)}
              className="w-full h-11 bg-sf-green/10 text-sf-green border border-sf-green/30 rounded-lg hover:bg-sf-green/20 transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-sf-light">数据脱敏管理</h1>
          <p className="text-sf-light/50 text-sm mt-1">ISO27001 合规的数据脱敏体系，保护用户隐私数据全生命周期安全</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-sf-green/10 border border-sf-green/30 rounded-lg flex items-center gap-2">
            <Shield size={16} className="text-sf-green" />
            <span className="text-sf-green text-sm">{rules.filter(r => r.enabled).length} 条规则已启用</span>
          </div>
          <div className="px-4 py-2 bg-sf-blue/10 border border-sf-blue/30 rounded-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-sf-blue" />
            <span className="text-sf-blue text-sm">ISO27001 合规</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'rules', label: '脱敏规则', icon: Shield },
          { key: 'preview', label: '效果预览', icon: Eye },
          { key: 'decrypt', label: '解密审批', icon: Key },
          { key: 'review', label: '复查记录', icon: History },
          { key: 'logs', label: '操作日志', icon: Clock },
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
            {tab.key === 'logs' && ruleChangeRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-sf-yellow text-sf-dark text-xs rounded-full">
                {ruleChangeRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className="text-sf-green" />
                <span className="text-sf-light/50 text-sm">已启用规则</span>
              </div>
              <div className="text-2xl font-display text-sf-light">{rules.filter(r => r.enabled).length}</div>
            </div>
            <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <Unlock size={16} className="text-sf-yellow" />
                <span className="text-sf-light/50 text-sm">已禁用规则</span>
              </div>
              <div className="text-2xl font-display text-sf-light">{rules.filter(r => !r.enabled).length}</div>
            </div>
            <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <Key size={16} className="text-sf-blue" />
                <span className="text-sf-light/50 text-sm">待审批解密</span>
              </div>
              <div className="text-2xl font-display text-sf-light">{decryptRecords.filter(r => r.status === 'pending').length}</div>
            </div>
            <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-sf-green" />
                <span className="text-sf-light/50 text-sm">本月复查通过</span>
              </div>
              <div className="text-2xl font-display text-sf-light">{reviewRecords.filter(r => r.result === '通过').length}</div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sf-light/50" />
                <input
                  type="text"
                  placeholder="搜索字段名称..."
                  className="w-full h-11 pl-12 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                />
              </div>
              <button
                onClick={fetchRules}
                className="h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:text-sf-light hover:border-sf-blue/40 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                刷新
              </button>
            </div>

            <div className="space-y-4">
              {rules.map((rule) => {
                const FieldIcon = fieldIcons[rule.field] || Shield
                const isEditing = editingRule === rule.field
                const pendingChange = getPendingChangeForField(rule.field)

                return (
                  <div
                    key={rule.field}
                    className={`glass rounded-xl p-5 border ${pendingChange ? 'border-sf-orange/50' : rule.enabled ? 'border-sf-green/30' : 'border-sf-light/20'} card-hover`}
                  >
                    {pendingChange && (
                      <div className="mb-3 p-2.5 bg-sf-orange/10 border border-sf-orange/30 rounded-lg flex items-center gap-2">
                        <Clock size={14} className="text-sf-orange" />
                        <span className="text-sf-orange text-sm">规则变更审批中："{pendingChange.oldValue}" → "{pendingChange.newValue}"</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${rule.enabled ? 'bg-sf-green/10' : 'bg-sf-dark/50'} rounded-xl flex items-center justify-center`}>
                          <FieldIcon size={22} className={rule.enabled ? 'text-sf-green' : 'text-sf-light/50'} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-medium text-sf-light">{rule.field}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${rule.enabled ? 'bg-sf-green/10 text-sf-green' : 'bg-sf-light/10 text-sf-light/50'}`}>
                              {rule.enabled ? '已启用' : '已禁用'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-3 py-1.5 bg-sf-dark/80 border border-sf-blue/30 rounded-lg text-sf-light text-sm focus:outline-none focus:border-sf-red/50"
                                autoFocus
                              />
                            ) : (
                              <span className="text-sf-light/70 text-sm">
                                规则: <span className="text-sf-blue">{rule.rule}</span>
                              </span>
                            )}
                            <span className="text-sf-light/50 text-sm font-mono">
                              示例: {rule.example}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSave(rule.field)}
                              className="p-2 bg-sf-green/10 text-sf-green rounded-lg hover:bg-sf-green/20 transition-colors"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setEditingRule(null)}
                              className="p-2 bg-sf-red/10 text-sf-red rounded-lg hover:bg-sf-red/20 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(rule)}
                              className="p-2 bg-sf-blue/10 text-sf-blue rounded-lg hover:bg-sf-blue/20 transition-colors"
                              title="编辑规则"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => toggleRule(rule.field)}
                              className={`p-2 rounded-lg transition-colors ${rule.enabled ? 'bg-sf-yellow/10 text-sf-yellow hover:bg-sf-yellow/20' : 'bg-sf-green/10 text-sf-green hover:bg-sf-green/20'}`}
                              title={rule.enabled ? '禁用规则' : '启用规则'}
                            >
                              {rule.enabled ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-sf-yellow/30 bg-sf-yellow/5">
            <div className="flex items-start gap-4">
              <AlertTriangle size={24} className="text-sf-yellow flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-display text-sf-light mb-2">数据预览授权说明</h3>
                <p className="text-sf-light/60 text-sm">
                  根据 ISO27001 安全规范，敏感数据默认以脱敏形式展示。如需查看完整原始数据，
                  必须提交解密申请并获得安全主管审批。以下为模拟演示效果。
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6 border border-sf-red/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display text-sf-light flex items-center gap-2">
                  <EyeOff size={20} className="text-sf-red" />
                  脱敏后数据（默认展示）
                </h3>
                <span className="px-3 py-1 bg-sf-green/10 text-sf-green text-xs rounded-full">
                  安全合规
                </span>
              </div>
              <div className="space-y-4">
                {[
                  { label: '手机号', value: maskedData.phone, icon: Phone },
                  { label: '姓名', value: maskedData.name, icon: User },
                  { label: '身份证号', value: maskedData.idCard, icon: CreditCard },
                  { label: '地址', value: maskedData.address, icon: MapPin },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-sf-green/5 rounded-lg border border-sf-green/20">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon size={16} className="text-sf-green" />
                      <span className="text-sm text-sf-light/70">{item.label}</span>
                    </div>
                    <div className="font-mono text-sf-green">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-sf-blue/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display text-sf-light flex items-center gap-2">
                  <Eye size={20} className="text-sf-blue" />
                  原始数据（需授权）
                </h3>
                {showRawData ? (
                  <span className="px-3 py-1 bg-sf-yellow/10 text-sf-yellow text-xs rounded-full flex items-center gap-1">
                    <Unlock size={12} />
                    已授权
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-sf-red/10 text-sf-red text-xs rounded-full flex items-center gap-1">
                    <Lock size={12} />
                    已加密
                  </span>
                )}
              </div>

              {!showRawData ? (
                <div className="space-y-4">
                  {[
                    { label: '手机号', value: '•••••••••••', icon: Phone },
                    { label: '姓名', value: '•••', icon: User },
                    { label: '身份证号', value: '••••••••••••••••', icon: CreditCard },
                    { label: '地址', value: '•••••••••••', icon: MapPin },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-sf-dark/50 rounded-lg border border-sf-blue/10">
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon size={16} className="text-sf-light/50" />
                        <span className="text-sm text-sf-light/70">{item.label}</span>
                      </div>
                      <div className="font-mono text-sf-light/50 tracking-wider">{item.value}</div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-sf-blue/20">
                    <p className="text-sf-light/50 text-sm mb-3">
                      输入授权密码查看原始数据（演示密码: admin123）
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={decryptPassword}
                        onChange={(e) => setDecryptPassword(e.target.value)}
                        placeholder="请输入授权密码"
                        className="flex-1 h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleViewRawData()}
                      />
                      <button
                        onClick={handleViewRawData}
                        className="px-6 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
                      >
                        授权查看
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: '手机号', value: testData.phone, icon: Phone },
                    { label: '姓名', value: testData.name, icon: User },
                    { label: '身份证号', value: testData.idCard, icon: CreditCard },
                    { label: '地址', value: testData.address, icon: MapPin },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-sf-yellow/5 rounded-lg border border-sf-yellow/30">
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon size={16} className="text-sf-yellow" />
                        <span className="text-sm text-sf-light/70">{item.label}</span>
                        <span className="ml-auto text-xs text-sf-yellow">⚠️ 敏感数据</span>
                      </div>
                      <div className="font-mono text-sf-light">{item.value}</div>
                    </div>
                  ))}

                  <div className="p-4 bg-sf-yellow/10 rounded-lg border border-sf-yellow/30">
                    <div className="flex items-center gap-2 text-sf-yellow text-sm">
                      <AlertTriangle size={16} />
                      <span>您正在查看原始敏感数据，所有操作已被审计记录</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowRawData(false)
                      setDecryptPassword('')
                    }}
                    className="w-full h-11 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:text-sf-light hover:border-sf-blue/40 transition-colors"
                  >
                    隐藏原始数据
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-4">测试自定义数据</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: '手机号', key: 'phone' },
                { label: '姓名', key: 'name' },
                { label: '身份证号', key: 'idCard' },
                { label: '地址', key: 'address' },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-sm text-sf-light/70 mb-2">{item.label}</label>
                  <input
                    type="text"
                    value={testData[item.key as keyof TestData]}
                    onChange={(e) => setTestData({ ...testData, [item.key]: e.target.value })}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'decrypt' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
              <div className="text-sf-light/50 text-sm mb-1">总申请数</div>
              <div className="text-2xl font-display text-sf-light">{decryptRecords.length}</div>
            </div>
            <div className="p-4 bg-sf-green/5 rounded-xl border border-sf-green/30">
              <div className="text-sf-green/70 text-sm mb-1">已批准</div>
              <div className="text-2xl font-display text-sf-green">{decryptRecords.filter(r => r.status === 'approved').length}</div>
            </div>
            <div className="p-4 bg-sf-yellow/5 rounded-xl border border-sf-yellow/30">
              <div className="text-sf-yellow/70 text-sm mb-1">待审批</div>
              <div className="text-2xl font-display text-sf-yellow">{decryptRecords.filter(r => r.status === 'pending').length}</div>
            </div>
            <div className="p-4 bg-sf-red/5 rounded-xl border border-sf-red/30">
              <div className="text-sf-red/70 text-sm mb-1">已拒绝</div>
              <div className="text-2xl font-display text-sf-red">{decryptRecords.filter(r => r.status === 'rejected').length}</div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-4">解密申请记录</h3>
            <div className="space-y-4">
              {decryptRecords.map((record) => {
                const statusStyle = getStatusStyle(record.status)
                const isExpired = record.expireTime && new Date(record.expireTime) < new Date()
                return (
                  <div key={record.id} className="p-5 bg-sf-dark/50 rounded-xl border border-sf-blue/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${statusStyle.bg} rounded-xl flex items-center justify-center`}>
                          <Key size={22} className={statusStyle.color} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sf-light font-medium">{record.applicant}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${statusStyle.bg} ${statusStyle.color}`}>
                              {statusStyle.label}
                            </span>
                            <span className="px-2 py-0.5 bg-sf-blue/10 text-sf-blue text-xs rounded">
                              {record.field}
                            </span>
                            <span className="px-2 py-0.5 bg-sf-dark text-sf-light/50 text-xs rounded font-mono">
                              订单: {record.orderNo}
                            </span>
                            <span className="px-2 py-0.5 bg-sf-dark text-sf-light/50 text-xs rounded font-mono">
                              运单: {record.trackingNo}
                            </span>
                          </div>
                          <p className="text-sf-light/60 text-sm mt-1">申请理由: {record.reason}</p>

                          <div className="mt-3 p-3 bg-sf-dark/30 rounded-lg border border-sf-blue/10">
                            <div className="text-xs text-sf-light/50 mb-2 font-medium">解密生命周期</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sf-blue/10 rounded text-xs">
                                <Calendar size={11} className="text-sf-blue" />
                                <span className="text-sf-blue">申请</span>
                                <span className="text-sf-light/50 ml-1">{record.applyTime}</span>
                              </div>
                              <div className="text-sf-light/30">→</div>
                              {record.approveTime ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sf-green/10 rounded text-xs">
                                  <UserCheck size={11} className="text-sf-green" />
                                  <span className="text-sf-green">{record.status === 'rejected' ? '拒绝' : '审批'}</span>
                                  <span className="text-sf-light/50 ml-1">{record.approveTime}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sf-yellow/10 rounded text-xs">
                                  <Clock size={11} className="text-sf-yellow" />
                                  <span className="text-sf-yellow">待审批</span>
                                </div>
                              )}
                              <div className="text-sf-light/30">→</div>
                              {record.viewedAt ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sf-blue/10 rounded text-xs">
                                  <ViewIcon size={11} className="text-sf-blue" />
                                  <span className="text-sf-blue">已查看</span>
                                  <span className="text-sf-light/50 ml-1">{record.viewedAt}</span>
                                </div>
                              ) : record.status === 'approved' ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sf-dark/50 rounded text-xs">
                                  <ViewIcon size={11} className="text-sf-light/30" />
                                  <span className="text-sf-light/30">未查看</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sf-dark/50 rounded text-xs">
                                  <ViewIcon size={11} className="text-sf-light/20" />
                                  <span className="text-sf-light/20">-</span>
                                </div>
                              )}
                              <div className="text-sf-light/30">→</div>
                              {record.expireTime ? (
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 ${isExpired ? 'bg-sf-red/10' : 'bg-sf-orange/10'} rounded text-xs`}>
                                  <Clock size={11} className={isExpired ? 'text-sf-red' : 'text-sf-orange'} />
                                  <span className={isExpired ? 'text-sf-red' : 'text-sf-orange'}>{isExpired ? '已过期' : '有效期至'}</span>
                                  <span className="text-sf-light/50 ml-1">{record.expireTime}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sf-dark/50 rounded text-xs">
                                  <Clock size={11} className="text-sf-light/20" />
                                  <span className="text-sf-light/20">-</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-sf-light/50">
                            {record.approver && (
                              <div className="flex items-center gap-1">
                                <UserCheck size={12} />
                                审批人: {record.approver}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {record.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDecryptApprove(record.id)}
                              className="px-4 py-2 bg-sf-green/10 text-sf-green rounded-lg hover:bg-sf-green/20 transition-colors text-sm"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => handleDecryptReject(record.id)}
                              className="px-4 py-2 bg-sf-red/10 text-sf-red rounded-lg hover:bg-sf-red/20 transition-colors text-sm"
                            >
                              拒绝
                            </button>
                          </div>
                        )}
                        {record.status === 'approved' && !record.viewedAt && (
                          <button
                            onClick={() => handleMarkViewed(record.id)}
                            className="px-4 py-2 bg-sf-blue/10 text-sf-blue rounded-lg hover:bg-sf-blue/20 transition-colors text-sm flex items-center gap-1"
                          >
                            <ViewIcon size={14} />
                            标记已查看
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/track/${record.trackingNo}`)}
                          className="px-4 py-2 bg-sf-orange/10 text-sf-orange rounded-lg hover:bg-sf-orange/20 transition-colors text-sm flex items-center gap-1"
                        >
                          <ExternalLink size={14} />
                          查看关联运单
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-4">授权边界说明</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-sf-dark/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={18} className="text-sf-green" />
                  <span className="text-sf-light font-medium">允许场景</span>
                </div>
                <ul className="space-y-2 text-sm text-sf-light/70">
                  <li>• 客户投诉处理，需要联系收件人/寄件人</li>
                  <li>• 异常件处理，需要上门核实地址</li>
                  <li>• 大件物流，需要身份验证</li>
                  <li>• 司法协助，有正规法律文书</li>
                </ul>
              </div>
              <div className="p-4 bg-sf-dark/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <X size={18} className="text-sf-red" />
                  <span className="text-sf-light font-medium">禁止场景</span>
                </div>
                <ul className="space-y-2 text-sm text-sf-light/70">
                  <li>• 数据统计分析（应使用脱敏数据）</li>
                  <li>• 营销推广活动</li>
                  <li>• 个人好奇或其他非业务原因</li>
                  <li>• 未获得审批私自查看</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'review' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-6">ISO27001 合规复查记录</h3>
            <div className="space-y-4">
              {reviewRecords.map((record) => (
                <div key={record.id} className="p-5 bg-sf-dark/50 rounded-xl border border-sf-blue/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${record.result === '通过' ? 'bg-sf-green/10' : 'bg-sf-red/10'} rounded-xl flex items-center justify-center`}>
                        <FileText size={22} className={record.result === '通过' ? 'text-sf-green' : 'text-sf-red'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-sf-light font-medium">{record.type}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${record.result === '通过' ? 'bg-sf-green/10 text-sf-green' : 'bg-sf-red/10 text-sf-red'}`}>
                            {record.result}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-sf-light/50">
                          <div className="flex items-center gap-1">
                            <UserCheck size={14} />
                            复查人: {record.reviewer}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            时间: {record.time}
                          </div>
                        </div>
                        <p className="text-sf-light/60 text-sm mt-2 p-3 bg-sf-dark/30 rounded-lg">
                          复查意见: {record.remark}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-sf-green/30 bg-sf-green/5">
            <div className="flex items-start gap-4">
              <CheckCircle size={24} className="text-sf-green flex-shrink-0" />
              <div>
                <h3 className="text-lg font-display text-sf-light mb-2">ISO27001 合规状态</h3>
                <p className="text-sf-light/60 text-sm">
                  本系统已通过 ISO27001 信息安全管理体系认证，数据脱敏机制符合以下控制域要求：
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-3 bg-sf-dark/50 rounded-lg">
                    <div className="text-sf-green text-sm font-medium">A.8.2.1</div>
                    <div className="text-sf-light/50 text-xs mt-1">数据分类与标记</div>
                  </div>
                  <div className="p-3 bg-sf-dark/50 rounded-lg">
                    <div className="text-sf-green text-sm font-medium">A.9.2.1</div>
                    <div className="text-sf-light/50 text-xs mt-1">访问权限控制</div>
                  </div>
                  <div className="p-3 bg-sf-dark/50 rounded-lg">
                    <div className="text-sf-green text-sm font-medium">A.10.1.1</div>
                    <div className="text-sf-light/50 text-xs mt-1">加密控制</div>
                  </div>
                  <div className="p-3 bg-sf-dark/50 rounded-lg">
                    <div className="text-sf-green text-sm font-medium">A.12.4.1</div>
                    <div className="text-sf-light/50 text-xs mt-1">审计日志记录</div>
                  </div>
                  <div className="p-3 bg-sf-dark/50 rounded-lg">
                    <div className="text-sf-green text-sm font-medium">A.15.2.1</div>
                    <div className="text-sf-light/50 text-xs mt-1">供应商安全</div>
                  </div>
                  <div className="p-3 bg-sf-dark/50 rounded-lg">
                    <div className="text-sf-green text-sm font-medium">A.18.2.1</div>
                    <div className="text-sf-light/50 text-xs mt-1">合规审查</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-4">脱敏规则操作日志</h3>
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-sf-dark/50 rounded-lg border border-sf-blue/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sf-blue/10 rounded-lg flex items-center justify-center">
                      <Shield size={18} className="text-sf-blue" />
                    </div>
                    <div>
                      <div className="text-sf-light">{log.action}</div>
                      <div className="text-sm text-sf-light/50 mt-0.5">
                        操作对象: <span className="text-sf-blue">{log.target}</span>
                      </div>
                      {log.detail && (
                        <div className="text-xs text-sf-light/40 mt-1">{log.detail}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-sf-light/70">{log.operator}</div>
                    <div className="text-xs text-sf-light/40 mt-0.5">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {ruleChangeRequests.length > 0 && (
            <div className="glass rounded-xl p-6 border border-sf-orange/30">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} className="text-sf-orange" />
                <h3 className="text-lg font-display text-sf-light">规则变更审批</h3>
                <span className="px-2 py-0.5 bg-sf-yellow/10 text-sf-yellow text-xs rounded">
                  {ruleChangeRequests.filter(r => r.status === 'pending').length} 待审批
                </span>
              </div>
              <div className="space-y-3">
                {ruleChangeRequests.map((request) => {
                  const reqStatusStyle = getStatusStyle(request.status)
                  return (
                    <div
                      key={request.id}
                      className="p-4 bg-sf-dark/50 rounded-lg border border-sf-orange/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 ${reqStatusStyle.bg} rounded-lg flex items-center justify-center`}>
                            <Edit3 size={18} className={reqStatusStyle.color} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-sf-light">{request.field}规则变更</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${reqStatusStyle.bg} ${reqStatusStyle.color}`}>
                                {reqStatusStyle.label}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm">
                              <span className="text-sf-red line-through">{request.oldValue}</span>
                              <span className="text-sf-light/30">→</span>
                              <span className="text-sf-green">{request.newValue}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-sf-light/50">
                              <div className="flex items-center gap-1">
                                <User size={12} />
                                申请人: {request.operator}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                申请时间: {request.applyTime}
                              </div>
                              {request.approver && (
                                <div className="flex items-center gap-1">
                                  <UserCheck size={12} />
                                  审批人: {request.approver}
                                </div>
                              )}
                              {request.approveTime && (
                                <div className="flex items-center gap-1">
                                  <Clock size={12} />
                                  审批时间: {request.approveTime}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRuleChange(request.id)}
                              className="px-4 py-2 bg-sf-green/10 text-sf-green rounded-lg hover:bg-sf-green/20 transition-colors text-sm"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => handleRejectRuleChange(request.id)}
                              className="px-4 py-2 bg-sf-red/10 text-sf-red rounded-lg hover:bg-sf-red/20 transition-colors text-sm"
                            >
                              拒绝
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SecurityDesensitize
