import { useState } from 'react'
import { mockBlockchainRecords } from '@/store/platformStore'
import {
  Shield,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Link2,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Eye,
  X,
  ArrowRight,
  Lock,
  Users,
  Banknote,
  ClipboardCheck,
  PenTool,
  FileEdit,
} from 'lucide-react'

const typeConfig: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  合同: { icon: FileText, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-100 dark:bg-brand-900/30' },
  支付凭证: { icon: CreditCard, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-100 dark:bg-accent-900/30' },
  验收报告: { icon: ClipboardCheck, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  设计确认: { icon: PenTool, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  变更单: { icon: FileEdit, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30' },
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  已确认: { icon: CheckCircle2, color: 'badge-accent' },
  待确认: { icon: Clock, color: 'badge-brand' },
  争议中: { icon: AlertTriangle, color: 'badge-warn' },
}

export default function Blockchain() {
  const [filterType, setFilterType] = useState<string>('全部')
  const [filterStatus, setFilterStatus] = useState<string>('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const filtered = mockBlockchainRecords.filter((r) => {
    if (filterType !== '全部' && r.type !== filterType) return false
    if (filterStatus !== '全部' && r.status !== filterStatus) return false
    if (searchQuery && !r.title.includes(searchQuery) && !r.txHash.includes(searchQuery)) return false
    return true
  })

  const activeRecord = selectedRecord ? mockBlockchainRecords.find((r) => r.id === selectedRecord) : null

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash).catch(() => {})
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const totalAmount = mockBlockchainRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
  const confirmedCount = mockBlockchainRecords.filter((r) => r.status === '已确认').length
  const disputedCount = mockBlockchainRecords.filter((r) => r.status === '争议中').length

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-title">上链存证</h1>
          <p className="mt-1 text-surface-500">所有合同与支付凭证上链存证，确保装修纠纷可追溯</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-accent-500" />
          <span className="text-sm font-medium text-accent-600 dark:text-accent-400">区块链存证保护中</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <FileText size={20} className="text-brand-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-900 dark:text-white">{mockBlockchainRecords.length}</div>
              <div className="text-xs text-surface-500">存证总数</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-900/20">
              <CheckCircle2 size={20} className="text-accent-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-900 dark:text-white">{confirmedCount}</div>
              <div className="text-xs text-surface-500">已确认</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warn-50 dark:bg-warn-900/20">
              <AlertTriangle size={20} className="text-warn-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-900 dark:text-white">{disputedCount}</div>
              <div className="text-xs text-surface-500">争议中</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Banknote size={20} className="text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-900 dark:text-white">¥{totalAmount.toLocaleString()}</div>
              <div className="text-xs text-surface-500">涉及金额</div>
            </div>
          </div>
        </div>
      </div>

      {disputedCount > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-warn-200 bg-warn-50 px-4 py-3 dark:border-warn-800 dark:bg-warn-900/20">
          <AlertTriangle size={18} className="text-warn-500" />
          <div className="flex-1">
            <span className="font-medium text-warn-700 dark:text-warn-300">争议提醒</span>
            <span className="ml-2 text-sm text-warn-600 dark:text-warn-400">
              水电隐蔽工程验收报告存争议，链上证据已锁定，请尽快处理
            </span>
          </div>
          <button className="text-sm font-medium text-warn-600 hover:text-warn-700 dark:text-warn-400">查看</button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="搜索存证标题/交易哈希..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300"
        >
          <option value="全部">全部类型</option>
          <option value="合同">合同</option>
          <option value="支付凭证">支付凭证</option>
          <option value="验收报告">验收报告</option>
          <option value="设计确认">设计确认</option>
          <option value="变更单">变更单</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300"
        >
          <option value="全部">全部状态</option>
          <option value="已确认">已确认</option>
          <option value="待确认">待确认</option>
          <option value="争议中">争议中</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800">
                <th className="px-4 py-3 text-left font-medium text-surface-600 dark:text-surface-400">类型</th>
                <th className="px-4 py-3 text-left font-medium text-surface-600 dark:text-surface-400">标题</th>
                <th className="px-4 py-3 text-left font-medium text-surface-600 dark:text-surface-400">交易哈希</th>
                <th className="px-4 py-3 text-left font-medium text-surface-600 dark:text-surface-400">金额</th>
                <th className="px-4 py-3 text-left font-medium text-surface-600 dark:text-surface-400">状态</th>
                <th className="px-4 py-3 text-left font-medium text-surface-600 dark:text-surface-400">时间</th>
                <th className="px-4 py-3 text-left font-medium text-surface-600 dark:text-surface-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {filtered.map((record) => {
                const tc = typeConfig[record.type]
                const TypeIcon = tc.icon
                const sc = statusConfig[record.status]
                const StatusIcon = sc.icon
                return (
                  <tr key={record.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tc.bg}`}>
                          <TypeIcon size={14} className={tc.color} />
                        </div>
                        <span className="text-surface-700 dark:text-surface-300">{record.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">{record.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-surface-500 font-mono">{record.txHash}</code>
                        <button
                          onClick={() => copyHash(record.txHash)}
                          className="text-surface-400 hover:text-brand-600"
                          title="复制哈希"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {record.amount ? (
                        <span className="font-medium text-surface-900 dark:text-white">¥{record.amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-surface-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={sc.color}>
                        <StatusIcon size={10} className="mr-1 inline" />{record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-500">{record.timestamp}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRecord(record.id)}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="mb-4 font-semibold text-surface-900 dark:text-white flex items-center gap-2">
          <Link2 size={16} className="text-brand-500" /> 存证链条
        </h3>
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-surface-200 dark:bg-surface-700" />
          <div className="space-y-4">
            {mockBlockchainRecords.map((record) => {
              const tc = typeConfig[record.type]
              const TypeIcon = tc.icon
              const sc = statusConfig[record.status]
              const StatusIcon = sc.icon
              return (
                <div key={record.id} className="relative flex gap-4 pl-2">
                  <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tc.bg}`}>
                    <TypeIcon size={14} className={tc.color} />
                  </div>
                  <div className="flex-1 rounded-lg border border-surface-200 dark:border-surface-700 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-900 dark:text-white">{record.title}</span>
                        <span className={sc.color}>
                          <StatusIcon size={10} className="mr-0.5 inline" />{record.status}
                        </span>
                      </div>
                      <span className="text-xs text-surface-400">{record.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-surface-500">
                      <span className="flex items-center gap-0.5">
                        <Lock size={10} /> {record.txHash}
                      </span>
                      {record.amount && (
                        <span className="font-medium text-surface-700 dark:text-surface-300">¥{record.amount.toLocaleString()}</span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Users size={10} /> {record.parties.join(' → ')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {activeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedRecord(null)}>
          <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-surface-200 px-5 py-3 dark:border-surface-700">
              <h3 className="font-semibold text-surface-900 dark:text-white">存证详情</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-surface-400 hover:text-surface-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const tc = typeConfig[activeRecord.type]
                  const TypeIcon = tc.icon
                  return (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tc.bg}`}>
                      <TypeIcon size={20} className={tc.color} />
                    </div>
                  )
                })()}
                <div>
                  <div className="font-medium text-surface-900 dark:text-white">{activeRecord.title}</div>
                  <div className="text-sm text-surface-500">{activeRecord.type}</div>
                </div>
              </div>

              <div className="rounded-lg bg-surface-50 p-4 dark:bg-surface-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500">交易哈希</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs font-mono text-surface-700 dark:text-surface-300">{activeRecord.txHash}</code>
                    <button onClick={() => copyHash(activeRecord.txHash)} className="text-surface-400 hover:text-brand-600">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500">区块高度</span>
                  <span className="text-sm text-surface-700 dark:text-surface-300">
                    {activeRecord.blockNumber > 0 ? `#${activeRecord.blockNumber.toLocaleString()}` : '待上链'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500">状态</span>
                  {(() => {
                    const sc = statusConfig[activeRecord.status]
                    const StatusIcon = sc.icon
                    return (
                      <span className={sc.color}>
                        <StatusIcon size={10} className="mr-0.5 inline" />{activeRecord.status}
                      </span>
                    )
                  })()}
                </div>
                {activeRecord.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-500">金额</span>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">¥{activeRecord.amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500">时间</span>
                  <span className="text-sm text-surface-700 dark:text-surface-300">{activeRecord.timestamp}</span>
                </div>
              </div>

              <div>
                <span className="text-sm text-surface-500 mb-2 block">参与方</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeRecord.parties.map((party, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="rounded-full bg-surface-100 px-3 py-1 text-sm text-surface-700 dark:bg-surface-700 dark:text-surface-300">
                        {party}
                      </span>
                      {i < activeRecord.parties.length - 1 && <ArrowRight size={12} className="text-surface-400" />}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-accent-200 bg-accent-50 p-3 dark:border-accent-800 dark:bg-accent-900/20">
                <Lock size={16} className="text-accent-500" />
                <div className="text-xs text-accent-700 dark:text-accent-300">
                  该存证已通过区块链加密保护，数据不可篡改，可作为法律有效证据
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="btn-primary flex-1">
                  <ExternalLink size={14} className="mr-1.5" /> 区块浏览器查看
                </button>
                <button className="btn-secondary flex-1" onClick={() => setSelectedRecord(null)}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
