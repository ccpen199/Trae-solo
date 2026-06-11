import { useState } from 'react'
import { useStore } from '@/store'
import {
  Shield, FileText, Lock, CheckCircle2, Circle, AlertTriangle,
  Trash2, LogIn, Eye, PenLine, Download, ShieldCheck, ChevronDown, LockIcon
} from 'lucide-react'

const TABS = [
  { key: 'data', label: '数据管理', icon: Shield },
  { key: 'audit', label: '审计日志', icon: FileText },
] as const

const ACTION_MAP: Record<string, { label: string; color: string; icon: typeof LogIn }> = {
  login: { label: '登录', color: 'bg-navy-100 text-navy-600', icon: LogIn },
  create: { label: '数据访问', color: 'bg-blue-100 text-blue-600', icon: Eye },
  update: { label: '数据修改', color: 'bg-amber-100 text-amber-600', icon: PenLine },
  delete: { label: '数据删除', color: 'bg-red-100 text-red-500', icon: Trash2 },
  diagnosis: { label: '数据访问', color: 'bg-blue-100 text-blue-600', icon: Eye },
  export: { label: '数据访问', color: 'bg-blue-100 text-blue-600', icon: Eye },
  update_settings: { label: '合规操作', color: 'bg-emerald-100 text-emerald-600', icon: ShieldCheck },
  no_external_training: { label: '合规操作', color: 'bg-emerald-100 text-emerald-600', icon: ShieldCheck },
}

const FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'login', label: '登录' },
  { value: 'access', label: '数据访问' },
  { value: 'modify', label: '数据修改' },
  { value: 'delete', label: '数据删除' },
  { value: 'compliance', label: '合规操作' },
]

const GDPR_ITEMS = [
  { key: 'dataMinimization', label: '数据最小化' },
  { key: 'encryptedStorage', label: '加密存储' },
  { key: 'oneClickDelete', label: '一键删除权' },
  { key: 'dataPortability', label: '数据可携带' },
  { key: 'informedConsent', label: '知情同意' },
  { key: 'auditTrail', label: '审计追踪' },
  { key: 'noExternalTraining', label: '禁止外部模型训练' },
] as const

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-navy-500' : 'bg-gray-300'} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-6' : ''}`} />
    </button>
  )
}

export default function Compliance() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['key']>('data')
  const [deleteInput, setDeleteInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [retentionInput, setRetentionInput] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [logPage, setLogPage] = useState(1)
  const { compliance, updateCompliance, auditLogs } = useStore()

  const lastAudit = auditLogs.length > 0
    ? new Date(auditLogs[0].timestamp).toLocaleDateString('zh-CN')
    : '—'

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter === 'access' && !['create', 'diagnosis', 'export'].includes(log.action)) return false
    if (actionFilter === 'modify' && log.action !== 'update') return false
    if (actionFilter === 'delete' && log.action !== 'delete') return false
    if (actionFilter === 'compliance' && !['update_settings', 'no_external_training'].includes(log.action)) return false
    if (actionFilter === 'login' && log.action !== 'login') return false
    if (dateFrom && new Date(log.timestamp) < new Date(dateFrom)) return false
    if (dateTo && new Date(log.timestamp) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const visibleLogs = filteredLogs.slice(0, logPage * 5)

  const complianceMap: Record<string, boolean> = {
    dataMinimization: compliance.dataMinimization,
    encryptedStorage: compliance.encryptedStorage,
    oneClickDelete: true,
    dataPortability: true,
    informedConsent: true,
    auditTrail: auditLogs.length > 0,
    noExternalTraining: true,
  }

  const handleRetentionUpdate = () => {
    const days = parseInt(retentionInput)
    if (days > 0) {
      updateCompliance({ retentionDays: days })
      setRetentionInput('')
    }
  }

  return (
    <div className="min-h-screen bg-ivory p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">合规中心</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-navy-500 text-white shadow-md'
                : 'bg-white/70 text-graphite/60 hover:bg-white hover:text-navy-500'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-navy-500" />
            <h2 className="text-lg font-semibold text-navy-700">数据与隐私管理</h2>
          </div>

          <div className="glass-card p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                {compliance.encryptedStorage
                  ? <Lock className="h-5 w-5 text-emerald-500" />
                  : <Lock className="h-5 w-5 text-red-500" />}
                <span className="text-sm text-graphite/80">
                  {compliance.encryptedStorage ? '已启用加密存储' : '未启用加密存储'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {compliance.dataMinimization
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : <Circle className="h-5 w-5 text-gray-400" />}
                <span className="text-sm text-graphite/80">已开启数据最小化采集</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-navy-400" />
                <span className="text-sm text-graphite/80">数据保留期限: {compliance.retentionDays}天</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-graphite/80">最近审计: {lastAudit}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-5">
            <h3 className="font-semibold text-navy-700">隐私设置</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-graphite/80">数据最小化采集</span>
              <Toggle on={compliance.dataMinimization} onChange={() => updateCompliance({ dataMinimization: !compliance.dataMinimization })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-graphite/80">加密存储</span>
              <Toggle on={compliance.encryptedStorage} onChange={() => updateCompliance({ encryptedStorage: !compliance.encryptedStorage })} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-graphite/80">外部训练禁止</span>
                <LockIcon className="h-3.5 w-3.5 text-graphite/30" />
              </div>
              <Toggle on={true} onChange={() => {}} disabled />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-graphite/80">数据保留期限</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={String(compliance.retentionDays)}
                  value={retentionInput}
                  onChange={(e) => setRetentionInput(e.target.value)}
                  className="input-field w-24 text-sm text-center"
                />
                <span className="text-xs text-graphite/50">天</span>
                <button className="btn-primary text-xs px-3 py-1.5" onClick={handleRetentionUpdate}>更新</button>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border-l-4 border-amber-400">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-navy-700">数据保护承诺</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-graphite/80">禁止外部模型训练</span>
                  <p className="text-xs text-graphite/50 mt-0.5">所有简历内容不会用于训练任何外部AI模型，数据仅用于平台内服务</p>
                </div>
                <button onClick={() => alert('所有简历内容不会用于训练任何外部AI模型，数据仅用于平台内服务。此设置为强制开启，不可关闭。')} className="text-xs text-amber-500 hover:text-amber-600 whitespace-nowrap">了解详情</button>
              </div>
              <div className="flex items-start gap-3">
                {compliance.dataMinimization
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  : <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <span className="text-sm font-medium text-graphite/80">数据最小化采集</span>
                  <p className="text-xs text-graphite/50 mt-0.5">仅收集提供服务所必需的最少数据</p>
                </div>
                <button onClick={() => alert('我们仅收集为您提供服务所必需的最少数据，不会收集任何无关信息。您可以在隐私设置中开启或关闭此选项。')} className="text-xs text-amber-500 hover:text-amber-600 whitespace-nowrap">了解详情</button>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-graphite/80">加密存储</span>
                  <p className="text-xs text-graphite/50 mt-0.5">所有个人数据使用AES-256加密存储</p>
                </div>
                <button onClick={() => alert('所有个人数据均使用AES-256加密算法进行存储，确保数据在静态状态下也无法被未授权访问。')} className="text-xs text-amber-500 hover:text-amber-600 whitespace-nowrap">了解详情</button>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-graphite/80">知情同意</span>
                  <p className="text-xs text-graphite/50 mt-0.5">数据使用前需获得用户明确授权</p>
                </div>
                <button onClick={() => alert('在使用您的任何个人数据之前，我们都会获得您的明确授权和同意，您有权随时撤回授权。')} className="text-xs text-amber-500 hover:text-amber-600 whitespace-nowrap">了解详情</button>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold text-navy-700 mb-4">GDPR / 个保法 合规状态</h3>
            <div className="grid grid-cols-2 gap-3">
              {GDPR_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  {complianceMap[item.key]
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    : <Circle className="h-5 w-5 text-gray-300 shrink-0" />}
                  <span className="text-sm text-graphite/80">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 border-2 border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-red-600">危险操作区</h3>
            </div>
            {!showDeleteConfirm ? (
              <button
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                onClick={() => setShowDeleteConfirm(true)}
              >
                一键删除账户及所有数据
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 font-medium">确认删除? 此操作不可恢复</p>
                <input
                  type="text"
                  placeholder='输入 "DELETE" 以确认'
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="input-field w-64 text-sm"
                />
                <div className="flex gap-3">
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={deleteInput !== 'DELETE'}
                  >
                    确认删除
                  </button>
                  <button
                    className="btn-secondary text-sm"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-navy-500" />
              <h2 className="text-lg font-semibold text-navy-700">审计日志</h2>
            </div>
            <button className="btn-secondary text-sm inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> 导出报告
            </button>
          </div>

          <div className="glass-card p-4 flex items-center gap-4">
            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setLogPage(1) }}
                className="input-field text-sm pr-8 appearance-none"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-graphite/40 pointer-events-none" />
            </div>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setLogPage(1) }} className="input-field text-sm" />
            <span className="text-graphite/40 text-sm">至</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setLogPage(1) }} className="input-field text-sm" />
          </div>

          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-4">
              {visibleLogs.map((log) => {
                const meta = ACTION_MAP[log.action] ?? { label: log.action, color: 'bg-gray-100 text-gray-600', icon: Eye }
                const Icon = meta.icon
                return (
                  <div key={log.id} className="relative flex items-start gap-4">
                    <div className={`absolute -left-5 p-1.5 rounded-full ${meta.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="glass-card p-4 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-navy-700">{meta.label}</span>
                          <span className="text-xs text-graphite/50">{log.resource}</span>
                        </div>
                        <span className="text-xs text-graphite/40">
                          {new Date(log.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-xs text-graphite/60">{log.details}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {visibleLogs.length < filteredLogs.length && (
            <div className="text-center">
              <button className="btn-secondary text-sm" onClick={() => setLogPage((p) => p + 1)}>加载更多</button>
            </div>
          )}

          {filteredLogs.length === 0 && (
            <div className="glass-card p-12 text-center text-graphite/40">暂无审计日志</div>
          )}
        </div>
      )}
    </div>
  )
}
