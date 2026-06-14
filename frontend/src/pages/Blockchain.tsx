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
  Eye,
  X,
  ArrowRight,
  Lock,
  Users,
  Banknote,
  ClipboardCheck,
  PenTool,
  FileEdit,
  ChevronRight,
  Gavel,
  History,
  AlertCircle,
  Camera,
  Fingerprint,
  Scale,
  BadgeCheck,
  Building,
  Download,
  ShieldAlert,
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

interface EvidenceDetail {
  contractNo: string
  signer: string
  signerRole: string
  signDate: string
  validUntil: string
  clauses: string[]
  attachments: { name: string; type: string; size: string }[]
}

interface DisputeLink {
  id: string
  title: string
  status: string
  type: string
  description: string
  relatedEvidences: string[]
  timeline: { time: string; event: string; actor: string }[]
}

const evidenceDetails: Record<string, EvidenceDetail> = {
  '1': { contractNo: 'HT-2026-0515-001', signer: '陈先生', signerRole: '业主', signDate: '2026-05-15', validUntil: '2027-08-15', clauses: ['施工范围：全屋装修（水电/泥木/油漆/安装/软装）', '合同总价：¥185,000（含税）', '付款方式：30%+40%+25%+5%分四期', '工期：61个自然日', '质保期：水电5年/其他2年', '争议解决：协商→平台仲裁→诉讼'], attachments: [{ name: '主施工合同.pdf', type: 'PDF', size: '2.3MB' }, { name: '附件一-工程量清单.xlsx', type: 'XLSX', size: '156KB' }, { name: '附件二-材料品牌清单.pdf', type: 'PDF', size: '890KB' }] },
  '2': { contractNo: 'ZJ-2026-0516-001', signer: '陈先生', signerRole: '业主', signDate: '2026-05-16', validUntil: '-', clauses: ['首期款：¥55,500（合同总价30%）', '支付方式：银行转账', '收款方：匠心装饰工程有限公司', '到账时间：2026-05-16 14:30', '关联合同：HT-2026-0515-001'], attachments: [{ name: '转账凭证.png', type: '图片', size: '450KB' }, { name: '收款确认函.pdf', type: 'PDF', size: '120KB' }] },
  '3': { contractNo: 'ZJ-2026-0605-002', signer: '陈先生', signerRole: '业主', signDate: '2026-06-05', validUntil: '-', clauses: ['二期款：¥74,000（合同总价40%）', '支付方式：银行转账', '收款方：匠心装饰工程有限公司', '到账时间：2026-06-05 16:00', '关联合同：HT-2026-0515-001'], attachments: [{ name: '转账凭证.png', type: '图片', size: '380KB' }] },
  '4': { contractNo: 'YS-2026-0612-001', signer: '刘工', signerRole: '质检工程师', signDate: '2026-06-12', validUntil: '-', clauses: ['验收项目：水电隐蔽工程', '验收结果：3项通过，1项不通过（客厅电路地线未接）', '整改要求：3日内完成地线整改', '争议标记：业主对验收流程存疑', '关联合同：HT-2026-0515-001'], attachments: [{ name: '水电验收报告.pdf', type: 'PDF', size: '1.8MB' }, { name: '电路检测照片_01.jpg', type: '图片', size: '2.1MB' }, { name: '电路检测照片_02.jpg', type: '图片', size: '1.9MB' }] },
  '5': { contractNo: 'SJ-2026-0528-001', signer: '陈先生', signerRole: '业主', signDate: '2026-05-28', validUntil: '-', clauses: ['确认方案：平面布局方案A（投票62%胜出）', '设计师：张设计师', '业主批注：5条（已全部处理）', '关联合同：HT-2026-0515-001'], attachments: [{ name: '设计方案V4_确认版.pdf', type: 'PDF', size: '5.6MB' }, { name: '效果图_日景.png', type: '图片', size: '3.2MB' }] },
  '6': { contractNo: 'BG-2026-0610-001', signer: '陈先生', signerRole: '业主', signDate: '2026-06-10', validUntil: '-', clauses: ['变更内容：厨房地砖由普通砖升级为进口大理石纹砖', '变更差价：+¥3,200', '支付状态：待支付', '关联合同：HT-2026-0515-001'], attachments: [{ name: '变更申请单.pdf', type: 'PDF', size: '680KB' }, { name: '新旧材料对比图.png', type: '图片', size: '1.2MB' }] },
  '7': { contractNo: 'ZJ-2026-0610-003', signer: '陈先生', signerRole: '业主', signDate: '2026-06-10', validUntil: '-', clauses: ['变更差价支付：¥3,200', '支付状态：待支付', '关联变更单：BG-2026-0610-001', '关联合同：HT-2026-0515-001'], attachments: [{ name: '变更差价明细.pdf', type: 'PDF', size: '230KB' }] },
}

const disputeLinks: Record<string, DisputeLink> = {
  '4': {
    id: 'D001',
    title: '水电隐蔽工程验收争议',
    status: '争议中',
    type: '验收争议',
    description: '业主对水电隐蔽工程验收流程存疑，认为部分检测项目未充分覆盖，客厅电路地线未接问题整改后仍有疑虑。',
    relatedEvidences: ['YS-2026-0612-001', 'HT-2026-0515-001', 'ZJ-2026-0516-001'],
    timeline: [
      { time: '6/12 14:00', event: '质检工程师出具验收报告，1项不通过', actor: '刘工' },
      { time: '6/12 15:30', event: '验收报告上链存证，证据锁定', actor: '系统' },
      { time: '6/12 17:00', event: '业主提出异议，认为检测覆盖不充分', actor: '陈先生' },
      { time: '6/13 09:00', event: '施工方完成地线整改', actor: '王工' },
      { time: '6/13 14:00', event: '业主对整改结果仍有疑虑，争议升级', actor: '陈先生' },
      { time: '6/14 09:15', event: '触发严重级延期预警，通知全方', actor: '系统' },
      { time: '6/14 11:30', event: '项目经理申请平台监理介入', actor: '李工' },
    ],
  },
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
  const activeDetail = selectedRecord ? evidenceDetails[selectedRecord] : null
  const activeDispute = selectedRecord ? disputeLinks[selectedRecord] : null

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
          <button
            onClick={() => setSelectedRecord('4')}
            className="btn-secondary text-sm border-warn-300 text-warn-700 hover:bg-warn-100 dark:border-warn-700 dark:text-warn-300"
          >
            查看争议详情
          </button>
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
                const hasDispute = !!disputeLinks[record.id]
                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer ${hasDispute ? 'bg-warn-50/30 dark:bg-warn-900/5' : ''}`}
                    onClick={() => setSelectedRecord(record.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tc.bg}`}>
                          <TypeIcon size={14} className={tc.color} />
                        </div>
                        <span className="text-surface-700 dark:text-surface-300">{record.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-surface-900 dark:text-white">{record.title}</span>
                        {hasDispute && (
                          <span className="flex items-center gap-0.5 rounded bg-warn-500 px-1 py-0.5 text-[10px] font-bold text-white">
                            <AlertTriangle size={8} /> 争议
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-surface-500 font-mono">{record.txHash}</code>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyHash(record.txHash) }}
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
                        onClick={(e) => { e.stopPropagation(); setSelectedRecord(record.id) }}
                        className="flex items-center gap-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 text-sm"
                      >
                        <Eye size={14} /> 查看详情
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
              const hasDispute = !!disputeLinks[record.id]
              return (
                <div
                  key={record.id}
                  className={`relative flex gap-4 pl-2 cursor-pointer group ${hasDispute ? 'ring-2 ring-warn-200 dark:ring-warn-800 rounded-lg' : ''}`}
                  onClick={() => setSelectedRecord(record.id)}
                >
                  <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tc.bg} ${hasDispute ? 'ring-2 ring-warn-400' : ''}`}>
                    <TypeIcon size={14} className={tc.color} />
                  </div>
                  <div className="flex-1 rounded-lg border border-surface-200 dark:border-surface-700 p-3 group-hover:border-brand-300 dark:group-hover:border-brand-700 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-900 dark:text-white">{record.title}</span>
                        <span className={sc.color}>
                          <StatusIcon size={10} className="mr-0.5 inline" />{record.status}
                        </span>
                        {hasDispute && (
                          <span className="rounded bg-warn-500 px-1.5 py-0.5 text-[10px] font-bold text-white">争议关联</span>
                        )}
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
                      <span className="flex items-center gap-0.5 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        点击查看 <ChevronRight size={10} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={() => setSelectedRecord(null)}>
          <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-surface-700 dark:bg-surface-900/95">
              <div className="flex items-center gap-3">
                {(() => {
                  const tc = typeConfig[activeRecord.type]
                  const TypeIcon = tc.icon
                  return (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tc.bg}`}>
                      <TypeIcon size={20} className={tc.color} />
                    </div>
                  )
                })()}
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">{activeRecord.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <span>{activeRecord.type}</span>
                    {activeDispute && (
                      <span className="rounded bg-warn-500 px-1.5 py-0.5 text-[10px] font-bold text-white">争议中</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-800">
                <X size={18} className="text-surface-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-5 dark:border-brand-800 dark:from-brand-900/20 dark:to-surface-800">
                <div className="flex items-center gap-2 mb-4">
                  <Fingerprint size={16} className="text-brand-600 dark:text-brand-400" />
                  <h4 className="font-semibold text-surface-900 dark:text-white">链上存证信息</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/70 p-3 dark:bg-surface-800/60">
                    <div className="text-[11px] text-surface-500 mb-1">交易哈希</div>
                    <div className="flex items-center gap-1">
                      <code className="text-xs font-mono font-semibold text-surface-900 dark:text-white break-all">{activeRecord.txHash}</code>
                      <button onClick={() => copyHash(activeRecord.txHash)} className="shrink-0 text-surface-400 hover:text-brand-600">
                        {copiedHash === activeRecord.txHash ? <CheckCircle2 size={12} className="text-accent-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3 dark:bg-surface-800/60">
                    <div className="text-[11px] text-surface-500 mb-1">区块高度</div>
                    <div className="text-sm font-semibold text-surface-900 dark:text-white">
                      {activeRecord.blockNumber > 0 ? `#${activeRecord.blockNumber.toLocaleString()}` : '待上链'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3 dark:bg-surface-800/60">
                    <div className="text-[11px] text-surface-500 mb-1">上链时间</div>
                    <div className="text-sm font-semibold text-surface-900 dark:text-white">{activeRecord.timestamp}</div>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3 dark:bg-surface-800/60">
                    <div className="text-[11px] text-surface-500 mb-1">存证状态</div>
                    <div className="text-sm">
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
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent-200 bg-accent-50 p-2.5 dark:border-accent-800 dark:bg-accent-900/20">
                  <Lock size={14} className="text-accent-500 shrink-0" />
                  <span className="text-xs text-accent-700 dark:text-accent-300">
                    该存证已通过区块链加密保护，数据不可篡改，可作为法律有效证据
                  </span>
                </div>
              </div>

              {activeDetail && (
                <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 dark:border-surface-700 dark:bg-surface-800">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={16} className="text-brand-600 dark:text-brand-400" />
                    <h4 className="font-semibold text-surface-900 dark:text-white">证据详情</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <div className="text-[11px] text-surface-500 mb-0.5">单据编号</div>
                      <div className="text-sm font-medium text-surface-900 dark:text-white font-mono">{activeDetail.contractNo}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-surface-500 mb-0.5">签署人 / 角色</div>
                      <div className="text-sm text-surface-900 dark:text-white">{activeDetail.signer} · {activeDetail.signerRole}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-surface-500 mb-0.5">签署日期</div>
                      <div className="text-sm text-surface-900 dark:text-white">{activeDetail.signDate}</div>
                    </div>
                    {activeDetail.validUntil !== '-' && (
                      <div>
                        <div className="text-[11px] text-surface-500 mb-0.5">有效期至</div>
                        <div className="text-sm text-surface-900 dark:text-white">{activeDetail.validUntil}</div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="text-[11px] text-surface-500 mb-2">关键条款</div>
                    <div className="space-y-1.5">
                      {activeDetail.clauses.map((clause, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                          {clause}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-surface-500 mb-2">附件材料</div>
                    <div className="space-y-2">
                      {activeDetail.attachments.map((att, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-2.5 dark:border-surface-600 dark:bg-surface-900">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                              {att.type === 'PDF' ? <FileText size={14} className="text-brand-500" /> : <Camera size={14} className="text-purple-500" />}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-surface-900 dark:text-white">{att.name}</div>
                              <div className="text-[10px] text-surface-500">{att.type} · {att.size}</div>
                            </div>
                          </div>
                          <button className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400">
                            <Download size={12} /> 下载
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-brand-600 dark:text-brand-400" />
                  <h4 className="font-semibold text-surface-900 dark:text-white">签署方</h4>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeRecord.parties.map((party, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-sm text-surface-700 dark:border-surface-600 dark:text-surface-300">
                        <Building size={12} className="text-surface-400" />
                        {party}
                      </span>
                      {i < activeRecord.parties.length - 1 && <ArrowRight size={14} className="text-surface-400" />}
                    </span>
                  ))}
                </div>
              </div>

              {activeDispute && (
                <div className="rounded-xl border-2 border-warn-300 bg-gradient-to-br from-warn-50/80 to-white p-5 dark:border-warn-800 dark:from-warn-900/20 dark:to-surface-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Gavel size={18} className="text-warn-600 dark:text-warn-400" />
                    <h4 className="font-semibold text-surface-900 dark:text-white">争议关联 & 纠纷追溯</h4>
                    <span className="badge-warn">{activeDispute.status}</span>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-surface-700 dark:text-surface-300 mb-3">{activeDispute.description}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-surface-500 mb-2 flex items-center gap-1">
                      <Link2 size={12} /> 关联链上证据
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeDispute.relatedEvidences.map((evId) => {
                        const ev = mockBlockchainRecords.find((r) => evidenceDetails[r.id]?.contractNo === evId)
                        return (
                          <button
                            key={evId}
                            onClick={() => ev && setSelectedRecord(ev.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-warn-200 px-3 py-1.5 text-xs text-warn-700 hover:bg-warn-100 dark:border-warn-700 dark:text-warn-300 dark:hover:bg-warn-900/20 transition"
                          >
                            <FileText size={11} />
                            {evId}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-surface-500 mb-2 flex items-center gap-1">
                      <History size={12} /> 纠纷追溯时间线
                    </div>
                    <div className="relative">
                      <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-warn-200 dark:bg-warn-800" />
                      <div className="space-y-0">
                        {activeDispute.timeline.map((item, i) => (
                          <div key={i} className="relative flex gap-3 pl-1 pb-3">
                            <div className={`z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              i === activeDispute.timeline.length - 1
                                ? 'bg-warn-500 text-white'
                                : item.actor === '系统'
                                  ? 'bg-brand-500 text-white'
                                  : 'bg-surface-300 dark:bg-surface-600 text-white'
                            }`}>
                              {i === activeDispute.timeline.length - 1 ? (
                                <AlertCircle size={10} />
                              ) : item.actor === '系统' ? (
                                <Lock size={10} />
                              ) : (
                                <CheckCircle2 size={10} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-surface-900 dark:text-white">{item.event}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-surface-500">
                                <span>{item.time}</span>
                                <span>· {item.actor}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-warn-200 dark:border-warn-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Scale size={14} className="text-warn-600 dark:text-warn-400" />
                      <span className="text-sm font-medium text-surface-900 dark:text-white">争议解决路径</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[
                        { step: '双方协商', done: false, current: true },
                        { step: '平台仲裁', done: false, current: false },
                        { step: '法律诉讼', done: false, current: false },
                      ].map((s, i, arr) => (
                        <div key={s.step} className="flex items-center gap-2 flex-1">
                          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium flex-1 justify-center ${
                            s.current
                              ? 'bg-warn-500 text-white'
                              : s.done
                                ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                                : 'bg-surface-100 text-surface-500 dark:bg-surface-700'
                          }`}>
                            {s.done ? <CheckCircle2 size={10} /> : <span className="text-[10px]">{i + 1}</span>}
                            {s.step}
                          </div>
                          {i < arr.length - 1 && <ArrowRight size={12} className="text-surface-400 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="btn-primary flex-1 text-sm">
                      <ShieldAlert size={14} className="mr-1" /> 申请平台仲裁
                    </button>
                    <button className="btn-secondary flex-1 text-sm border-warn-300 text-warn-700 hover:bg-warn-100 dark:border-warn-700 dark:text-warn-300">
                      <Gavel size={14} className="mr-1" /> 发起法律诉讼
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button className="btn-outline flex-1">
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
