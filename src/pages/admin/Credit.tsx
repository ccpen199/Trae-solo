import { useEffect, useState } from 'react'
import {
  CreditCard,
  Edit2,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Phone,
  DollarSign,
  Clock,
  User,
  FileText,
  Eye,
  XCircle,
  Gavel,
  AlertCircle,
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import StatCard from '@/components/StatCard'
import Chart from '@/components/Chart'
import { api } from '@/utils/api'

interface CreditItem {
  id: string
  companyName: string
  contact: string
  phone: string
  creditLimit: number
  usedCredit: number
  rating: 'A' | 'B' | 'C' | 'D'
  status: 'active' | 'frozen' | 'review'
}

interface CreditRecord {
  id: string
  companyName: string
  amount: number
  purpose: string
  orderNo: string
  useTime: string
  remainingCredit: number
}

interface OverdueItem {
  id: string
  companyName: string
  creditLimit: number
  usedCredit: number
  overdueAmount: number
  overdueDays: number
  lastRepayDate: string
  collectionStatus: 'pending' | 'contacted' | 'promised' | 'legal'
}

const defaultCredits: CreditItem[] = [
  { id: '1', companyName: '上海鑫达物流', contact: '陈经理', phone: '021-5555****', creditLimit: 500000, usedCredit: 320000, rating: 'A', status: 'active' },
  { id: '2', companyName: '杭州远航贸易', contact: '林总', phone: '0571-8888****', creditLimit: 300000, usedCredit: 280000, rating: 'B', status: 'active' },
  { id: '3', companyName: '广州兴盛供应链', contact: '黄经理', phone: '020-3333****', creditLimit: 200000, usedCredit: 195000, rating: 'C', status: 'review' },
  { id: '4', companyName: '北京中运达', contact: '王总', phone: '010-6666****', creditLimit: 800000, usedCredit: 150000, rating: 'A', status: 'active' },
  { id: '5', companyName: '武汉通惠物流', contact: '张经理', phone: '027-7777****', creditLimit: 100000, usedCredit: 98000, rating: 'D', status: 'frozen' },
  { id: '6', companyName: '成都蜀通贸易', contact: '李总', phone: '028-9999****', creditLimit: 400000, usedCredit: 120000, rating: 'B', status: 'active' },
]

const defaultRecords: CreditRecord[] = [
  { id: '1', companyName: '上海鑫达物流', amount: 50000, purpose: '运单抵扣', orderNo: 'YD202606010001', useTime: '2026-06-02 10:30', remainingCredit: 180000 },
  { id: '2', companyName: '杭州远航贸易', amount: 35000, purpose: '运单抵扣', orderNo: 'YD202606010002', useTime: '2026-06-02 09:15', remainingCredit: 20000 },
  { id: '3', companyName: '北京中运达', amount: 80000, purpose: '运单抵扣', orderNo: 'YD202605310003', useTime: '2026-06-01 16:45', remainingCredit: 650000 },
  { id: '4', companyName: '上海鑫达物流', amount: 42000, purpose: '运单抵扣', orderNo: 'YD202605310004', useTime: '2026-06-01 14:20', remainingCredit: 230000 },
  { id: '5', companyName: '成都蜀通贸易', amount: 28000, purpose: '运单抵扣', orderNo: 'YD202605310005', useTime: '2026-05-31 11:30', remainingCredit: 280000 },
  { id: '6', companyName: '广州兴盛供应链', amount: 15000, purpose: '运单抵扣', orderNo: 'YD202605300006', useTime: '2026-05-31 08:45', remainingCredit: 5000 },
  { id: '7', companyName: '杭州远航贸易', amount: 45000, purpose: '运单抵扣', orderNo: 'YD202605300007', useTime: '2026-05-30 15:20', remainingCredit: 55000 },
  { id: '8', companyName: '北京中运达', amount: 62000, purpose: '运单抵扣', orderNo: 'YD202605290008', useTime: '2026-05-30 10:00', remainingCredit: 730000 },
]

const defaultOverdue: OverdueItem[] = [
  { id: '1', companyName: '广州兴盛供应链', creditLimit: 200000, usedCredit: 195000, overdueAmount: 85000, overdueDays: 15, lastRepayDate: '2026-05-18', collectionStatus: 'contacted' },
  { id: '2', companyName: '武汉通惠物流', creditLimit: 100000, usedCredit: 98000, overdueAmount: 62000, overdueDays: 32, lastRepayDate: '2026-05-01', collectionStatus: 'legal' },
]

const ratingColors: Record<string, string> = {
  A: 'text-mint bg-emerald-50',
  B: 'text-accent bg-amber-50',
  C: 'text-orange-500 bg-orange-50',
  D: 'text-coral bg-red-50',
}

const statusMap: Record<string, { status: 'active' | 'pending' | 'cancelled'; label: string }> = {
  active: { status: 'active', label: '正常' },
  frozen: { status: 'cancelled', label: '冻结' },
  review: { status: 'pending', label: '审核中' },
}

const collectionStatusMap: Record<string, { status: 'pending' | 'active' | 'warning' | 'danger'; label: string }> = {
  pending: { status: 'pending', label: '待催收' },
  contacted: { status: 'active', label: '已联系' },
  promised: { status: 'warning', label: '已承诺' },
  legal: { status: 'danger', label: '法律途径' },
}

export default function Credit() {
  const [activeTab, setActiveTab] = useState<'credit' | 'record' | 'overdue'>('credit')
  const [credits, setCredits] = useState<CreditItem[]>(defaultCredits)
  const [records, setRecords] = useState<CreditRecord[]>(defaultRecords)
  const [overdue, setOverdue] = useState<OverdueItem[]>(defaultOverdue)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [detailModal, setDetailModal] = useState<{ show: boolean; data: CreditItem | null }>({ show: false, data: null })
  const [overdueDetailModal, setOverdueDetailModal] = useState<{ show: boolean; data: OverdueItem | null }>({ show: false, data: null })

  useEffect(() => {
    api.get<CreditItem[]>('/admin/credits').then(setCredits).catch(() => {})
    api.get<CreditRecord[]>('/admin/credit-records').catch(() => {})
  }, [])

  const totalLimit = credits.reduce((s, c) => s + c.creditLimit, 0)
  const totalUsed = credits.reduce((s, c) => s + c.usedCredit, 0)
  const totalAvailable = totalLimit - totalUsed
  const overdueCount = overdue.length

  const ratingDistribution = {
    labels: ['A级', 'B级', 'C级', 'D级'],
    values: [
      credits.filter(c => c.rating === 'A').length,
      credits.filter(c => c.rating === 'B').length,
      credits.filter(c => c.rating === 'C').length,
      credits.filter(c => c.rating === 'D').length,
    ],
    colors: ['#10B981', '#F59E0B', '#F97316', '#EF4444'],
  }

  const usageTrendData = {
    labels: ['5/27', '5/28', '5/29', '5/30', '5/31', '6/1', '6/2'],
    values: [185, 210, 195, 230, 245, 268, 285],
  }

  const handleSave = async (id: string) => {
    try {
      await api.patch(`/admin/credits/${id}`, { creditLimit: editValue })
      setCredits(credits.map((c) => (c.id === id ? { ...c, creditLimit: editValue } : c)))
    } catch {
      setCredits(credits.map((c) => (c.id === id ? { ...c, creditLimit: editValue } : c)))
    }
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const startEdit = (item: CreditItem) => {
    setEditingId(item.id)
    setEditValue(item.creditLimit)
  }

  const handleFreeze = async (id: string) => {
    try {
      await api.patch(`/admin/credits/${id}`, { status: 'frozen' })
      setCredits(credits.map((c) => (c.id === id ? { ...c, status: 'frozen' } : c)))
    } catch {
      setCredits(credits.map((c) => (c.id === id ? { ...c, status: 'frozen' } : c)))
    }
  }

  const handleCollection = async (id: string, status: 'contacted' | 'promised' | 'legal') => {
    try {
      await api.patch(`/admin/credits/overdue/${id}`, { collectionStatus: status })
      setOverdue(overdue.map((o) => (o.id === id ? { ...o, collectionStatus: status } : o)))
    } catch {
      setOverdue(overdue.map((o) => (o.id === id ? { ...o, collectionStatus: status } : o)))
    }
    setOverdueDetailModal({ show: false, data: null })
  }

  const creditColumns = [
    { key: 'companyName', title: '企业名称', sortable: true, render: (row: CreditItem) => (
      <div>
        <span className="font-medium text-primary">{row.companyName}</span>
      </div>
    )},
    { key: 'contact', title: '联系人', render: (row: CreditItem) => (
      <div>
        <p className="text-sm text-primary">{row.contact}</p>
        <p className="text-[10px] text-muted">{row.phone}</p>
      </div>
    )},
    { key: 'creditLimit', title: '授信额度', sortable: true, render: (row: CreditItem) => (
      editingId === row.id ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(Number(e.target.value))}
            className="w-28 h-7 px-2 rounded border border-accent text-xs font-mono focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); handleSave(row.id) }} className="p-1 rounded text-mint hover:bg-green-50">
            <Check size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleCancel() }} className="p-1 rounded text-coral hover:bg-red-50">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-primary">¥{row.creditLimit.toLocaleString()}</span>
          <button
            onClick={(e) => { e.stopPropagation(); startEdit(row) }}
            className="p-1 rounded hover:bg-gray-100 text-muted"
          >
            <Edit2 size={12} />
          </button>
        </div>
      )
    )},
    { key: 'usedCredit', title: '已用额度', sortable: true, render: (row: CreditItem) => {
      const pct = row.creditLimit > 0 ? (row.usedCredit / row.creditLimit) * 100 : 0
      return (
        <div>
          <span className="font-mono text-sm text-secondary">¥{row.usedCredit.toLocaleString()}</span>
          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct > 90 ? 'bg-coral' : pct > 70 ? 'bg-accent' : 'bg-mint'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
      )
    }},
    { key: 'available', title: '可用额度', render: (row: CreditItem) => (
      <span className="font-mono text-sm text-mint">¥{(row.creditLimit - row.usedCredit).toLocaleString()}</span>
    )},
    { key: 'rating', title: '评级', render: (row: CreditItem) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${ratingColors[row.rating]}`}>{row.rating}</span>
    )},
    { key: 'status', title: '状态', render: (row: CreditItem) => <StatusBadge {...statusMap[row.status]} /> },
    { key: 'actions', title: '操作', render: (row: CreditItem) => (
      <div className="flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); setDetailModal({ show: true, data: row }) }}
          className="p-1.5 rounded hover:bg-gray-100 text-primary transition-colors"
          title="查看详情"
        >
          <Eye size={16} />
        </button>
        {row.status === 'active' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleFreeze(row.id) }}
            className="p-1.5 rounded hover:bg-red-50 text-coral transition-colors"
            title="冻结额度"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>
    )},
  ]

  const recordColumns = [
    { key: 'companyName', title: '企业名称', render: (row: CreditRecord) => (
      <span className="font-medium text-primary">{row.companyName}</span>
    )},
    { key: 'amount', title: '使用额度', render: (row: CreditRecord) => (
      <span className="font-mono text-sm text-coral">-¥{row.amount.toLocaleString()}</span>
    )},
    { key: 'purpose', title: '用途', render: (row: CreditRecord) => (
      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs">{row.purpose}</span>
    )},
    { key: 'orderNo', title: '运单号', render: (row: CreditRecord) => (
      <span className="font-mono text-sm text-secondary">{row.orderNo}</span>
    )},
    { key: 'useTime', title: '使用时间' },
    { key: 'remainingCredit', title: '剩余额度', render: (row: CreditRecord) => (
      <span className="font-mono text-sm text-mint">¥{row.remainingCredit.toLocaleString()}</span>
    )},
  ]

  const overdueColumns = [
    { key: 'companyName', title: '企业名称', render: (row: OverdueItem) => (
      <span className="font-medium text-primary">{row.companyName}</span>
    )},
    { key: 'creditLimit', title: '授信额度', render: (row: OverdueItem) => (
      <span className="font-mono text-sm text-secondary">¥{row.creditLimit.toLocaleString()}</span>
    )},
    { key: 'usedCredit', title: '已用额度', render: (row: OverdueItem) => (
      <span className="font-mono text-sm text-secondary">¥{row.usedCredit.toLocaleString()}</span>
    )},
    { key: 'overdueAmount', title: '逾期金额', render: (row: OverdueItem) => (
      <span className="font-mono text-sm font-medium text-coral">¥{row.overdueAmount.toLocaleString()}</span>
    )},
    { key: 'overdueDays', title: '逾期天数', render: (row: OverdueItem) => (
      <span className={`text-sm font-medium ${row.overdueDays > 30 ? 'text-coral' : 'text-accent'}`}>
        {row.overdueDays}天
      </span>
    )},
    { key: 'lastRepayDate', title: '最后还款日' },
    { key: 'collectionStatus', title: '催收状态', render: (row: OverdueItem) => (
      <StatusBadge
        status={collectionStatusMap[row.collectionStatus].status as any}
        label={collectionStatusMap[row.collectionStatus].label}
      />
    )},
    { key: 'actions', title: '操作', render: (row: OverdueItem) => (
      <div className="flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); setOverdueDetailModal({ show: true, data: row }) }}
          className="p-1.5 rounded hover:bg-gray-100 text-primary transition-colors"
          title="查看详情"
        >
          <Eye size={16} />
        </button>
        {row.collectionStatus === 'pending' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCollection(row.id, 'contacted') }}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors text-xs"
            title="催收"
          >
            催收
          </button>
        )}
        {row.collectionStatus === 'contacted' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleFreeze(credits.find(c => c.companyName === row.companyName)?.id || '') }}
            className="p-1.5 rounded hover:bg-red-50 text-coral transition-colors text-xs"
            title="冻结额度"
          >
            冻结
          </button>
        )}
        {row.overdueDays > 30 && row.collectionStatus !== 'legal' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCollection(row.id, 'legal') }}
            className="p-1.5 rounded hover:bg-red-50 text-coral transition-colors text-xs"
            title="法律途径"
          >
            法务
          </button>
        )}
      </div>
    )},
  ]

  const tabs = [
    { key: 'credit' as const, label: '授信额度', icon: <CreditCard size={16} /> },
    { key: 'record' as const, label: '额度使用记录', icon: <FileText size={16} /> },
    { key: 'overdue' as const, label: '逾期管理', icon: <AlertTriangle size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">授信管理</h1>
        <p className="text-sm text-secondary mt-0.5">管理货主企业授信额度、使用记录及逾期情况</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign size={20} />}
          value={`¥${(totalLimit / 10000).toFixed(0)}万`}
          label="总授信额度"
          gradient="gradient-primary"
          trend={{ value: 12.5, positive: true }}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          value={`¥${(totalUsed / 10000).toFixed(0)}万`}
          label="已用额度"
          gradient="gradient-accent"
          trend={{ value: 8.3, positive: true }}
        />
        <StatCard
          icon={<TrendingDown size={20} />}
          value={`¥${(totalAvailable / 10000).toFixed(0)}万`}
          label="可用额度"
          gradient="gradient-mint"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          value={overdueCount}
          label="逾期企业"
          sublabel="家"
          gradient="gradient-coral"
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

        {activeTab === 'credit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <DataTable
                  columns={creditColumns}
                  data={credits}
                  onRowClick={(row) => setDetailModal({ show: true, data: row })}
                />
              </div>
              <div>
                <Chart
                  type="pie"
                  data={ratingDistribution}
                  title="企业评级分布"
                  height={280}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'record' && (
          <div className="space-y-6">
            <Chart
              type="line"
              data={usageTrendData}
              title="近7天额度使用趋势（万元）"
              height={240}
              lineColor="#1B2A4A"
            />
            <DataTable
              columns={recordColumns}
              data={records}
            />
          </div>
        )}

        {activeTab === 'overdue' && (
          <div className="space-y-4">
            <div className="p-4 bg-coral/5 border border-coral/20 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-coral shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-coral">逾期风险提示</p>
                <p className="text-xs text-secondary mt-1">
                  当前共有 {overdueCount} 家企业存在逾期情况，其中 {overdue.filter(o => o.overdueDays > 30).length} 家逾期超过30天，建议尽快采取催收措施，必要时启动法律程序。
                </p>
              </div>
            </div>
            <DataTable
              columns={overdueColumns}
              data={overdue}
              onRowClick={(row) => setOverdueDetailModal({ show: true, data: row })}
            />
          </div>
        )}
      </div>

      {detailModal.show && detailModal.data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailModal({ show: false, data: null })}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">企业授信详情</h3>
              <button onClick={() => setDetailModal({ show: false, data: null })} className="p-1 rounded hover:bg-gray-100">
                <X size={20} className="text-muted" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center text-white">
                  <User size={28} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-primary">{detailModal.data.companyName}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-sm text-secondary">
                      <User size={14} />
                      {detailModal.data.contact}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-secondary">
                      <Phone size={14} />
                      {detailModal.data.phone}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${ratingColors[detailModal.data.rating]}`}>
                      {detailModal.data.rating}级
                    </span>
                    <StatusBadge {...statusMap[detailModal.data.status]} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg text-center">
                  <p className="text-xs text-muted mb-1">授信额度</p>
                  <p className="text-2xl font-bold text-primary">¥{detailModal.data.creditLimit.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-accent/5 rounded-lg text-center">
                  <p className="text-xs text-muted mb-1">已用额度</p>
                  <p className="text-2xl font-bold text-accent">¥{detailModal.data.usedCredit.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-mint/5 rounded-lg text-center">
                  <p className="text-xs text-muted mb-1">可用额度</p>
                  <p className="text-2xl font-bold text-mint">¥{(detailModal.data.creditLimit - detailModal.data.usedCredit).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary">额度使用情况</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">使用率</span>
                    <span className="font-medium text-primary">
                      {((detailModal.data.usedCredit / detailModal.data.creditLimit) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (detailModal.data.usedCredit / detailModal.data.creditLimit) > 0.9
                          ? 'bg-coral'
                          : (detailModal.data.usedCredit / detailModal.data.creditLimit) > 0.7
                          ? 'bg-accent'
                          : 'bg-mint'
                      }`}
                      style={{ width: `${Math.min((detailModal.data.usedCredit / detailModal.data.creditLimit) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>0</span>
                    <span>70%</span>
                    <span>90%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary">最近使用记录</h5>
                <div className="border border-border rounded-lg overflow-hidden">
                  {records
                    .filter(r => r.companyName === detailModal.data?.companyName)
                    .slice(0, 5)
                    .map((record, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 ${idx > 0 ? 'border-t border-border' : ''}`}>
                        <div>
                          <p className="text-sm text-primary">{record.purpose}</p>
                          <p className="text-xs text-muted">{record.useTime} · {record.orderNo}</p>
                        </div>
                        <span className="font-mono text-sm text-coral">-¥{record.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  {records.filter(r => r.companyName === detailModal.data?.companyName).length === 0 && (
                    <div className="p-6 text-center text-muted text-sm">暂无使用记录</div>
                  )}
                </div>
              </div>

              {detailModal.data.status === 'active' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => { startEdit(detailModal.data!); setDetailModal({ show: false, data: null }) }}
                    className="flex-1 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    调整额度
                  </button>
                  <button
                    onClick={() => handleFreeze(detailModal.data!.id)}
                    className="flex-1 py-2 rounded bg-gray-100 text-primary text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    冻结额度
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {overdueDetailModal.show && overdueDetailModal.data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOverdueDetailModal({ show: false, data: null })}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">逾期详情</h3>
              <button onClick={() => setOverdueDetailModal({ show: false, data: null })} className="p-1 rounded hover:bg-gray-100">
                <X size={20} className="text-muted" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-coral/10 flex items-center justify-center text-coral">
                  <AlertTriangle size={28} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-primary">{overdueDetailModal.data.companyName}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <StatusBadge
                      status={collectionStatusMap[overdueDetailModal.data.collectionStatus].status as any}
                      label={collectionStatusMap[overdueDetailModal.data.collectionStatus].label}
                    />
                    <span className={`text-sm font-medium ${overdueDetailModal.data.overdueDays > 30 ? 'text-coral' : 'text-accent'}`}>
                      逾期 {overdueDetailModal.data.overdueDays} 天
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-muted mb-1">授信额度</p>
                  <p className="text-lg font-bold text-primary">¥{overdueDetailModal.data.creditLimit.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-muted mb-1">已用额度</p>
                  <p className="text-lg font-bold text-secondary">¥{overdueDetailModal.data.usedCredit.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-coral/5 rounded-lg text-center">
                  <p className="text-xs text-muted mb-1">逾期金额</p>
                  <p className="text-lg font-bold text-coral">¥{overdueDetailModal.data.overdueAmount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-muted mb-1">最后还款日</p>
                  <p className="text-lg font-bold text-secondary">{overdueDetailModal.data.lastRepayDate}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary">催收记录</h5>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-mint mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-primary">系统自动提醒</p>
                      <p className="text-xs text-muted mt-0.5">2026-05-20 09:00 · 还款提醒短信已发送</p>
                    </div>
                  </div>
                  {overdueDetailModal.data.collectionStatus !== 'pending' && (
                    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-primary">人工催收</p>
                        <p className="text-xs text-muted mt-0.5">2026-05-25 14:30 · 已与企业负责人取得联系</p>
                      </div>
                    </div>
                  )}
                  {overdueDetailModal.data.collectionStatus === 'legal' && (
                    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-coral mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-primary">法律途径</p>
                        <p className="text-xs text-muted mt-0.5">2026-06-01 10:00 · 已移交法务部门处理</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {overdueDetailModal.data.collectionStatus === 'pending' && (
                  <button
                    onClick={() => handleCollection(overdueDetailModal.data!.id, 'contacted')}
                    className="flex-1 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    标记已联系
                  </button>
                )}
                {overdueDetailModal.data.collectionStatus === 'contacted' && (
                  <button
                    onClick={() => handleCollection(overdueDetailModal.data!.id, 'promised')}
                    className="flex-1 py-2 rounded bg-mint text-white text-sm font-medium hover:bg-mint/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    标记已承诺还款
                  </button>
                )}
                {overdueDetailModal.data.overdueDays > 30 && overdueDetailModal.data.collectionStatus !== 'legal' && (
                  <button
                    onClick={() => handleCollection(overdueDetailModal.data!.id, 'legal')}
                    className="flex-1 py-2 rounded bg-coral text-white text-sm font-medium hover:bg-coral/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Gavel size={16} />
                    启动法律程序
                  </button>
                )}
                <button
                  onClick={() => handleFreeze(credits.find(c => c.companyName === overdueDetailModal.data?.companyName)?.id || '')}
                  className="flex-1 py-2 rounded bg-gray-100 text-primary text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  冻结额度
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
