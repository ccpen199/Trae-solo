import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  UserX,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Search,
  Filter,
  CheckSquare,
  Square,
  Plus,
  Clock,
  FileText,
  AlertTriangle,
  X,
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import StatCard from '@/components/StatCard'
import { api } from '@/utils/api'

interface DriverApplication {
  id: string
  driverName: string
  phone: string
  idCard: string
  vehicleType: string
  plateNumber: string
  driverLicensePhoto: string
  vehicleLicensePhoto: string
  applyTime: string
  status: 'pending' | 'approved' | 'rejected'
  riskScore: number
  reviewOpinion?: string
}

interface RiskEvent {
  id: string
  driverName: string
  phone: string
  vehicleType: string
  riskLevel: 'high' | 'medium' | 'low'
  riskType: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  eventTime: string
}

interface BlacklistItem {
  id: string
  driverName: string
  phone: string
  vehicleType: string
  reason: string
  blockTime: string
  operator: string
  expireTime: string
  status: 'active' | 'expired'
}

const defaultApplications: DriverApplication[] = [
  { id: '1', driverName: '张明', phone: '138****1234', idCard: '310***********1234', vehicleType: '冷藏车', plateNumber: '沪A12345', driverLicensePhoto: '/mock/license1.jpg', vehicleLicensePhoto: '/mock/vehicle1.jpg', applyTime: '2026-06-01 10:30', status: 'pending', riskScore: 85 },
  { id: '2', driverName: '李强', phone: '139****5678', idCard: '320***********5678', vehicleType: '平板车', plateNumber: '苏B67890', driverLicensePhoto: '/mock/license2.jpg', vehicleLicensePhoto: '/mock/vehicle2.jpg', applyTime: '2026-06-01 14:20', status: 'pending', riskScore: 72 },
  { id: '3', driverName: '王磊', phone: '137****9012', idCard: '330***********9012', vehicleType: '厢式车', plateNumber: '浙C11111', driverLicensePhoto: '/mock/license3.jpg', vehicleLicensePhoto: '/mock/vehicle3.jpg', applyTime: '2026-05-31 09:15', status: 'pending', riskScore: 45 },
  { id: '4', driverName: '刘伟', phone: '136****3456', idCard: '340***********3456', vehicleType: '高栏车', plateNumber: '皖D22222', driverLicensePhoto: '/mock/license4.jpg', vehicleLicensePhoto: '/mock/vehicle4.jpg', applyTime: '2026-05-31 16:45', status: 'pending', riskScore: 92 },
  { id: '5', driverName: '陈刚', phone: '135****7890', idCard: '350***********7890', vehicleType: '冷藏车', plateNumber: '闽E33333', driverLicensePhoto: '/mock/license5.jpg', vehicleLicensePhoto: '/mock/vehicle5.jpg', applyTime: '2026-05-30 11:00', status: 'pending', riskScore: 68 },
  { id: '6', driverName: '赵华', phone: '134****2345', idCard: '360***********2345', vehicleType: '平板车', plateNumber: '赣F44444', driverLicensePhoto: '/mock/license6.jpg', vehicleLicensePhoto: '/mock/vehicle6.jpg', applyTime: '2026-05-29 15:30', status: 'approved', riskScore: 78, reviewOpinion: '资质齐全，风险可控' },
  { id: '7', driverName: '孙伟', phone: '133****6789', idCard: '370***********6789', vehicleType: '厢式车', plateNumber: '鲁G55555', driverLicensePhoto: '/mock/license7.jpg', vehicleLicensePhoto: '/mock/vehicle7.jpg', applyTime: '2026-05-28 08:45', status: 'rejected', riskScore: 35, reviewOpinion: '驾驶证有多次违章记录' },
]

const defaultRisks: RiskEvent[] = [
  { id: '1', driverName: '周某', phone: '138****1234', vehicleType: '冷藏车', riskLevel: 'high', riskType: '资质过期', description: '驾驶证已过期 30 天', status: 'pending', eventTime: '2026-06-02 09:00' },
  { id: '2', driverName: '吴某', phone: '139****5678', vehicleType: '平板车', riskLevel: 'medium', riskType: '异常行驶', description: '近7天偏离路线 3 次', status: 'pending', eventTime: '2026-06-02 10:30' },
  { id: '3', driverName: '郑某', phone: '137****9012', vehicleType: '厢式车', riskLevel: 'low', riskType: '投诉较多', description: '近30天收到 2 次货损投诉', status: 'pending', eventTime: '2026-06-01 14:20' },
  { id: '4', driverName: '孙某', phone: '136****3456', vehicleType: '高栏车', riskLevel: 'high', riskType: '保险到期', description: '车辆保险已于上周到期', status: 'pending', eventTime: '2026-06-01 16:45' },
  { id: '5', driverName: '马某', phone: '135****7890', vehicleType: '冷藏车', riskLevel: 'medium', riskType: '频繁取消', description: '近30天取消订单 8 次', status: 'approved', eventTime: '2026-05-31 11:00' },
  { id: '6', driverName: '朱某', phone: '134****2345', vehicleType: '平板车', riskLevel: 'low', riskType: '超时送达', description: '近30天超时送达 3 次', status: 'rejected', eventTime: '2026-05-30 09:30' },
]

const defaultBlacklist: BlacklistItem[] = [
  { id: '1', driverName: '钱某', phone: '138****1111', vehicleType: '平板车', reason: '恶意拒单5次，造成严重损失', blockTime: '2026-05-15 10:00', operator: '管理员', expireTime: '2026-08-15 23:59', status: 'active' },
  { id: '2', driverName: '徐某', phone: '139****2222', vehicleType: '冷藏车', reason: '伪造资质证件', blockTime: '2026-04-20 14:30', operator: '管理员', expireTime: '永久', status: 'active' },
  { id: '3', driverName: '胡某', phone: '137****3333', vehicleType: '厢式车', reason: '货损逃逸，拒不赔偿', blockTime: '2026-03-10 09:15', operator: '运营主管', expireTime: '2026-06-10 23:59', status: 'expired' },
]

const riskBadge: Record<string, { status: 'danger' | 'warning' | 'info'; label: string }> = {
  high: { status: 'danger', label: '高风险' },
  medium: { status: 'warning', label: '中风险' },
  low: { status: 'info', label: '低风险' },
}

const statusBadge: Record<string, { status: 'pending' | 'active' | 'cancelled'; label: string }> = {
  pending: { status: 'pending', label: '待审核' },
  approved: { status: 'active', label: '已通过' },
  rejected: { status: 'cancelled', label: '已拒绝' },
}

const blacklistStatusBadge: Record<string, { status: 'active' | 'cancelled'; label: string }> = {
  active: { status: 'active', label: '生效中' },
  expired: { status: 'cancelled', label: '已过期' },
}

export default function Risk() {
  const [activeTab, setActiveTab] = useState<'application' | 'risk' | 'blacklist'>('application')
  const [applications, setApplications] = useState<DriverApplication[]>(defaultApplications)
  const [risks, setRisks] = useState<RiskEvent[]>(defaultRisks)
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>(defaultBlacklist)
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set())
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [detailModal, setDetailModal] = useState<{ show: boolean; data: DriverApplication | null }>({ show: false, data: null })
  const [blacklistModal, setBlacklistModal] = useState<{ show: boolean; data: DriverApplication | null }>({ show: false, data: null })
  const [reviewOpinion, setReviewOpinion] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockDuration, setBlockDuration] = useState<'7' | '30' | '90' | 'permanent'>('30')
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    api.get<DriverApplication[]>('/admin/risks').catch(() => {})
    api.get<BlacklistItem[]>('/admin/blacklist').catch(() => {})
  }, [])

  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const highRiskCount = risks.filter((r) => r.riskLevel === 'high').length
  const blacklistActiveCount = blacklist.filter((b) => b.status === 'active').length

  const filteredRisks = risks.filter((r) => {
    if (levelFilter !== 'all' && r.riskLevel !== levelFilter) return false
    if (typeFilter !== 'all' && r.riskType !== typeFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (searchKeyword && !r.driverName.includes(searchKeyword) && !r.phone.includes(searchKeyword)) return false
    return true
  })

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/admin/risks/${id}`, { status: 'approved', reviewOpinion })
      setApplications(applications.map((a) => (a.id === id ? { ...a, status: 'approved', reviewOpinion } : a)))
    } catch {
      setApplications(applications.map((a) => (a.id === id ? { ...a, status: 'approved', reviewOpinion } : a)))
    }
    setDetailModal({ show: false, data: null })
    setReviewOpinion('')
  }

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/admin/risks/${id}`, { status: 'rejected', reviewOpinion })
      setApplications(applications.map((a) => (a.id === id ? { ...a, status: 'rejected', reviewOpinion } : a)))
    } catch {
      setApplications(applications.map((a) => (a.id === id ? { ...a, status: 'rejected', reviewOpinion } : a)))
    }
    setDetailModal({ show: false, data: null })
    setReviewOpinion('')
  }

  const handleRiskAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/risks/${id}`, { status: action })
      setRisks(risks.map((r) => (r.id === id ? { ...r, status: action } : r)))
    } catch {
      setRisks(risks.map((r) => (r.id === id ? { ...r, status: action } : r)))
    }
  }

  const handleBatchApprove = async () => {
    const ids = Array.from(selectedRisks)
    for (const id of ids) {
      await handleRiskAction(id, 'approved')
    }
    setSelectedRisks(new Set())
    setSelectAll(false)
  }

  const handleBatchReject = async () => {
    const ids = Array.from(selectedRisks)
    for (const id of ids) {
      await handleRiskAction(id, 'rejected')
    }
    setSelectedRisks(new Set())
    setSelectAll(false)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRisks(new Set())
    } else {
      const pendingIds = filteredRisks.filter((r) => r.status === 'pending').map((r) => r.id)
      setSelectedRisks(new Set(pendingIds))
    }
    setSelectAll(!selectAll)
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedRisks)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRisks(newSelected)
  }

  const handleAddToBlacklist = async () => {
    if (!detailModal.data) return
    const now = new Date()
    let expireTime = '永久'
    if (blockDuration !== 'permanent') {
      const expire = new Date(now.getTime() + parseInt(blockDuration) * 24 * 60 * 60 * 1000)
      expireTime = expire.toLocaleString('zh-CN')
    }
    const newItem: BlacklistItem = {
      id: Date.now().toString(),
      driverName: detailModal.data.driverName,
      phone: detailModal.data.phone,
      vehicleType: detailModal.data.vehicleType,
      reason: blockReason,
      blockTime: now.toLocaleString('zh-CN'),
      operator: '当前管理员',
      expireTime,
      status: 'active',
    }
    try {
      await api.post('/admin/blacklist', newItem)
      setBlacklist([newItem, ...blacklist])
    } catch {
      setBlacklist([newItem, ...blacklist])
    }
    setBlacklistModal({ show: false, data: null })
    setBlockReason('')
    setBlockDuration('30')
  }

  const handleRemoveBlacklist = async (id: string) => {
    try {
      await api.delete(`/admin/blacklist/${id}`)
      setBlacklist(blacklist.map((b) => (b.id === id ? { ...b, status: 'expired' } : b)))
    } catch {
      setBlacklist(blacklist.map((b) => (b.id === id ? { ...b, status: 'expired' } : b)))
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-mint'
    if (score >= 60) return 'text-accent'
    return 'text-coral'
  }

  const getRiskScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50'
    if (score >= 60) return 'bg-amber-50'
    return 'bg-red-50'
  }

  const applicationColumns = [
    { key: 'driverName', title: '司机', render: (row: DriverApplication) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs">
          {row.driverName[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-primary">{row.driverName}</p>
          <p className="text-[10px] text-muted">{row.phone}</p>
        </div>
      </div>
    )},
    { key: 'idCard', title: '身份证号', render: (row: DriverApplication) => (
      <span className="text-sm font-mono text-secondary">{row.idCard}</span>
    )},
    { key: 'vehicleType', title: '车型' },
    { key: 'plateNumber', title: '车牌号' },
    { key: 'driverLicensePhoto', title: '驾驶证', render: () => (
      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs">已上传</span>
    )},
    { key: 'vehicleLicensePhoto', title: '行驶证', render: () => (
      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs">已上传</span>
    )},
    { key: 'applyTime', title: '申请时间' },
    { key: 'status', title: '状态', render: (row: DriverApplication) => <StatusBadge {...statusBadge[row.status]} /> },
    { key: 'actions', title: '操作', render: (row: DriverApplication) => (
      <div className="flex gap-1">
        {row.status === 'pending' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleApprove(row.id) }}
              className="p-1.5 rounded hover:bg-green-50 text-mint transition-colors"
              title="审核通过"
            >
              <CheckCircle size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleReject(row.id) }}
              className="p-1.5 rounded hover:bg-red-50 text-coral transition-colors"
              title="拒绝"
            >
              <XCircle size={16} />
            </button>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setDetailModal({ show: true, data: row }) }}
          className="p-1.5 rounded hover:bg-gray-100 text-primary transition-colors"
          title="查看详情"
        >
          <Eye size={16} />
        </button>
      </div>
    )},
  ]

  const riskColumns = [
    { key: 'select', title: '选择', render: (row: RiskEvent) => (
      row.status === 'pending' ? (
        <button onClick={(e) => { e.stopPropagation(); toggleSelect(row.id) }} className="p-1">
          {selectedRisks.has(row.id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-muted" />}
        </button>
      ) : null
    )},
    { key: 'driverName', title: '司机', render: (row: RiskEvent) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs">
          {row.driverName[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-primary">{row.driverName}</p>
          <p className="text-[10px] text-muted">{row.phone}</p>
        </div>
      </div>
    )},
    { key: 'vehicleType', title: '车型' },
    { key: 'riskLevel', title: '风险等级', render: (row: RiskEvent) => <StatusBadge {...riskBadge[row.riskLevel]} /> },
    { key: 'riskType', title: '风险类型', render: (row: RiskEvent) => (
      <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{row.riskType}</span>
    )},
    { key: 'description', title: '描述', render: (row: RiskEvent) => (
      <span className="text-sm text-secondary max-w-xs truncate block">{row.description}</span>
    )},
    { key: 'eventTime', title: '发生时间' },
    { key: 'status', title: '状态', render: (row: RiskEvent) => <StatusBadge {...statusBadge[row.status]} /> },
    { key: 'actions', title: '操作', render: (row: RiskEvent) => (
      row.status === 'pending' ? (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleRiskAction(row.id, 'approved') }}
            className="p-1.5 rounded hover:bg-green-50 text-mint transition-colors"
            title="通过"
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRiskAction(row.id, 'rejected') }}
            className="p-1.5 rounded hover:bg-red-50 text-coral transition-colors"
            title="拒绝"
          >
            <XCircle size={16} />
          </button>
        </div>
      ) : (
        <span className="text-xs text-muted">-</span>
      )
    )},
  ]

  const blacklistColumns = [
    { key: 'driverName', title: '司机', render: (row: BlacklistItem) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-coral/10 flex items-center justify-center text-coral text-xs">
          {row.driverName[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-primary">{row.driverName}</p>
          <p className="text-[10px] text-muted">{row.phone}</p>
        </div>
      </div>
    )},
    { key: 'vehicleType', title: '车型' },
    { key: 'reason', title: '拉黑原因', render: (row: BlacklistItem) => (
      <span className="text-sm text-secondary max-w-[200px] truncate block">{row.reason}</span>
    )},
    { key: 'blockTime', title: '拉黑时间' },
    { key: 'operator', title: '操作人' },
    { key: 'expireTime', title: '到期时间' },
    { key: 'status', title: '状态', render: (row: BlacklistItem) => <StatusBadge {...blacklistStatusBadge[row.status]} /> },
    { key: 'actions', title: '操作', render: (row: BlacklistItem) => (
      <div className="flex gap-1">
        {row.status === 'active' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleRemoveBlacklist(row.id) }}
            className="p-1.5 rounded hover:bg-green-50 text-mint transition-colors text-xs"
            title="解除拉黑"
          >
            解除
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setDetailModal({ show: true, data: applications.find(a => a.driverName === row.driverName) || null }) }}
          className="p-1.5 rounded hover:bg-gray-100 text-primary transition-colors"
          title="查看详情"
        >
          <Eye size={16} />
        </button>
      </div>
    )},
  ]

  const tabs = [
    { key: 'application' as const, label: '司机准入审核', icon: <User size={16} /> },
    { key: 'risk' as const, label: '风险事件', icon: <AlertTriangle size={16} /> },
    { key: 'blacklist' as const, label: '黑名单管理', icon: <Ban size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">风控管理</h1>
        <p className="text-sm text-secondary mt-0.5">司机准入审核、风险事件处理、黑名单管理</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Clock size={20} />}
          value={pendingCount}
          label="待审核司机"
          sublabel="人"
          gradient="gradient-primary"
        />
        <StatCard
          icon={<ShieldAlert size={20} />}
          value={highRiskCount}
          label="高风险司机"
          sublabel="人"
          gradient="gradient-coral"
        />
        <StatCard
          icon={<UserX size={20} />}
          value={blacklistActiveCount}
          label="黑名单司机"
          sublabel="人"
          gradient="gradient-danger"
        />
        <StatCard
          icon={<Ban size={20} />}
          value={28}
          label="本月拒单数"
          sublabel="次"
          gradient="gradient-accent"
        />
      </div>

      <div className="card">
        <div className="flex items-center gap-1 border-b border-border mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-primary border-primary'
                  : 'text-secondary border-transparent hover:text-primary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'application' && (
          <div>
            <DataTable
              columns={applicationColumns}
              data={applications}
              onRowClick={(row) => setDetailModal({ show: true, data: row })}
            />
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-muted" />
                <input
                  type="text"
                  placeholder="搜索司机姓名/手机号"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-48 h-8 px-3 rounded border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-muted" />
                <span className="text-xs text-secondary">风险等级:</span>
                {['all', 'high', 'medium', 'low'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevelFilter(l)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      levelFilter === l ? 'bg-primary text-white' : 'bg-gray-100 text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {l === 'all' ? '全部' : riskBadge[l]?.label || l}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-secondary">类型:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-8 px-2 rounded border border-border text-sm focus:outline-none focus:border-primary"
                >
                  <option value="all">全部类型</option>
                  <option value="资质过期">资质过期</option>
                  <option value="异常行驶">异常行驶</option>
                  <option value="投诉较多">投诉较多</option>
                  <option value="保险到期">保险到期</option>
                  <option value="频繁取消">频繁取消</option>
                  <option value="超时送达">超时送达</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-secondary">状态:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2 rounded border border-border text-sm focus:outline-none focus:border-primary"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </div>
            </div>

            {selectedRisks.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                <span className="text-sm text-primary">已选择 {selectedRisks.size} 条记录</span>
                <button
                  onClick={handleBatchApprove}
                  className="px-3 py-1.5 rounded bg-mint text-white text-xs font-medium hover:bg-mint/90 transition-colors"
                >
                  批量通过
                </button>
                <button
                  onClick={handleBatchReject}
                  className="px-3 py-1.5 rounded bg-coral text-white text-xs font-medium hover:bg-coral/90 transition-colors"
                >
                  批量拒绝
                </button>
              </div>
            )}

            <DataTable
              columns={riskColumns}
              data={filteredRisks}
            />
          </div>
        )}

        {activeTab === 'blacklist' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-secondary">共 {blacklist.filter(b => b.status === 'active').length} 名司机在黑名单中</p>
              <button
                onClick={() => setBlacklistModal({ show: true, data: null })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={14} />
                加入黑名单
              </button>
            </div>
            <DataTable
              columns={blacklistColumns}
              data={blacklist}
            />
          </div>
        )}
      </div>

      {detailModal.show && detailModal.data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailModal({ show: false, data: null })}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">司机详情</h3>
              <button onClick={() => setDetailModal({ show: false, data: null })} className="p-1 rounded hover:bg-gray-100">
                <X size={20} className="text-muted" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {detailModal.data.driverName[0]}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-primary">{detailModal.data.driverName}</h4>
                  <p className="text-sm text-secondary mt-1">{detailModal.data.phone}</p>
                  <p className="text-sm text-muted mt-0.5">身份证: {detailModal.data.idCard}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg ${getRiskScoreBg(detailModal.data.riskScore)}`}>
                  <p className="text-xs text-muted">风控评分</p>
                  <p className={`text-2xl font-bold ${getRiskScoreColor(detailModal.data.riskScore)}`}>{detailModal.data.riskScore}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">车型</p>
                  <p className="text-sm font-medium text-primary">{detailModal.data.vehicleType}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">车牌号</p>
                  <p className="text-sm font-medium text-primary">{detailModal.data.plateNumber}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">申请时间</p>
                  <p className="text-sm font-medium text-primary">{detailModal.data.applyTime}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">当前状态</p>
                  <StatusBadge {...statusBadge[detailModal.data.status]} />
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary">证件照片</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border rounded-lg p-3">
                    <p className="text-xs text-muted mb-2 flex items-center gap-1">
                      <FileText size={12} />
                      驾驶证
                    </p>
                    <div className="h-24 bg-gray-100 rounded flex items-center justify-center text-muted text-sm">
                      驾驶证照片
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <p className="text-xs text-muted mb-2 flex items-center gap-1">
                      <FileText size={12} />
                      行驶证
                    </p>
                    <div className="h-24 bg-gray-100 rounded flex items-center justify-center text-muted text-sm">
                      行驶证照片
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary">自动风控评估</h5>
                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">身份核验</span>
                    <span className="text-sm font-medium text-mint">通过</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">驾驶证状态</span>
                    <span className="text-sm font-medium text-mint">有效</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">车辆保险</span>
                    <span className="text-sm font-medium text-mint">有效</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">历史违章</span>
                    <span className="text-sm font-medium text-accent">3次（已处理）</span>
                  </div>
                </div>
              </div>

              {detailModal.data.status === 'pending' && (
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-primary">人工审核</h5>
                  <textarea
                    value={reviewOpinion}
                    onChange={(e) => setReviewOpinion(e.target.value)}
                    placeholder="请输入审核意见..."
                    className="w-full h-24 px-3 py-2 rounded border border-border text-sm focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(detailModal.data!.id)}
                      className="flex-1 py-2 rounded bg-mint text-white text-sm font-medium hover:bg-mint/90 transition-colors"
                    >
                      审核通过
                    </button>
                    <button
                      onClick={() => handleReject(detailModal.data!.id)}
                      className="flex-1 py-2 rounded bg-coral text-white text-sm font-medium hover:bg-coral/90 transition-colors"
                    >
                      拒绝申请
                    </button>
                    <button
                      onClick={() => { setBlacklistModal({ show: true, data: detailModal.data }); setDetailModal({ show: false, data: null }) }}
                      className="flex-1 py-2 rounded bg-gray-200 text-primary text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      加入黑名单
                    </button>
                  </div>
                </div>
              )}

              {detailModal.data.reviewOpinion && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-primary">审核意见</h5>
                  <p className="text-sm text-secondary p-3 bg-gray-50 rounded">{detailModal.data.reviewOpinion}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {blacklistModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setBlacklistModal({ show: false, data: null })}>
          <div className="bg-white rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">加入黑名单</h3>
              <button onClick={() => setBlacklistModal({ show: false, data: null })} className="p-1 rounded hover:bg-gray-100">
                <X size={20} className="text-muted" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">选择司机</label>
                <select
                  value={blacklistModal.data?.id || ''}
                  onChange={(e) => {
                    const driver = applications.find(a => a.id === e.target.value)
                    setBlacklistModal({ show: true, data: driver || null })
                  }}
                  className="w-full h-10 px-3 rounded border border-border text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">请选择司机</option>
                  {applications.filter(a => !blacklist.some(b => b.driverName === a.driverName && b.status === 'active')).map((a) => (
                    <option key={a.id} value={a.id}>{a.driverName} - {a.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">拉黑原因</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="请输入拉黑原因..."
                  className="w-full h-24 px-3 py-2 rounded border border-border text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">拉黑期限</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: '7' as const, label: '7天' },
                    { key: '30' as const, label: '30天' },
                    { key: '90' as const, label: '90天' },
                    { key: 'permanent' as const, label: '永久' },
                  ].map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setBlockDuration(d.key)}
                      className={`py-2 rounded text-sm font-medium transition-colors ${
                        blockDuration === d.key
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-border">
              <button
                onClick={() => setBlacklistModal({ show: false, data: null })}
                className="flex-1 py-2 rounded bg-gray-100 text-primary text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddToBlacklist}
                disabled={!blacklistModal.data || !blockReason}
                className="flex-1 py-2 rounded bg-coral text-white text-sm font-medium hover:bg-coral/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认加入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
