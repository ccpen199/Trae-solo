import { useEffect, useState } from 'react'
import {
  Wallet,
  Clock,
  CheckCircle,
  DollarSign,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Banknote,
  CreditCard,
  Lock,
  ArrowRight,
  FileText,
  Calculator,
  TrendingUp,
  PieChart,
  Send,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import DataTable from '@/components/DataTable'
import Chart from '@/components/Chart'
import StatusBadge from '@/components/StatusBadge'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'

interface PendingSettlement {
  id: string
  waybillNo: string
  orderId: string
  route: string
  amount: number
  completedAt: string
  expectedArrival: string
  status: 'pending_split' | 'splitting' | 'pending_pay'
  driverName?: string
}

interface SettlementRecord {
  id: string
  batchNo: string
  waybillCount: number
  totalAmount: number
  driverIncome: number
  platformFee: number
  settledAt: string
  status: 'completed' | 'processing' | 'failed'
  transactionNo?: string
}

interface SplitDetail {
  id: string
  waybillNo: string
  orderId: string
  amount: number
  driverIncome: number
  platformFee: number
  tax: number
  actualPay: number
  splitAt: string
  voucherNo: string
  status: 'completed' | 'processing'
  expanded?: boolean
}

interface WithdrawRecord {
  id: string
  amount: number
  bankAccount: string
  applyTime: string
  arrivalTime?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

interface SettlementDetail {
  waybillNo: string
  orderId: string
  route: string
  driverName: string
  plateNo: string
  amount: number
  platformFee: number
  tax: number
  driverActual: number
  splitFormula: string
  voucherUrl?: string
}

const pendingStatusMap: Record<string, { status: 'pending' | 'active' | 'warning'; label: string }> = {
  pending_split: { status: 'pending', label: '待分账' },
  splitting: { status: 'active', label: '分账中' },
  pending_pay: { status: 'warning', label: '待打款' }
}

const settlementStatusMap: Record<string, { status: 'completed' | 'active' | 'danger'; label: string }> = {
  completed: { status: 'completed', label: '已完成' },
  processing: { status: 'active', label: '处理中' },
  failed: { status: 'danger', label: '失败' }
}

const withdrawStatusMap: Record<string, { status: 'pending' | 'active' | 'completed' | 'danger'; label: string }> = {
  pending: { status: 'pending', label: '待审核' },
  processing: { status: 'active', label: '处理中' },
  completed: { status: 'completed', label: '已到账' },
  failed: { status: 'danger', label: '失败' }
}

const mockPendingList: PendingSettlement[] = [
  { id: '1', waybillNo: 'WB20260602001', orderId: 'ORD20260601001', route: '上海→杭州', amount: 2800, completedAt: '2026-06-01 14:30', expectedArrival: '2026-06-02 10:00', status: 'pending_split', driverName: '张师傅' },
  { id: '2', waybillNo: 'WB20260602002', orderId: 'ORD20260601002', route: '广州→深圳', amount: 2200, completedAt: '2026-06-01 16:45', expectedArrival: '2026-06-02 12:00', status: 'splitting', driverName: '李师傅' },
  { id: '3', waybillNo: 'WB20260602003', orderId: 'ORD20260601003', route: '北京→天津', amount: 1800, completedAt: '2026-06-01 09:20', expectedArrival: '2026-06-02 09:00', status: 'pending_pay', driverName: '王师傅' },
  { id: '4', waybillNo: 'WB20260602004', orderId: 'ORD20260601004', route: '武汉→长沙', amount: 5400, completedAt: '2026-06-01 11:15', expectedArrival: '2026-06-02 11:00', status: 'pending_split', driverName: '赵师傅' },
  { id: '5', waybillNo: 'WB20260602005', orderId: 'ORD20260601005', route: '成都→重庆', amount: 4800, completedAt: '2026-06-01 08:30', expectedArrival: '2026-06-02 08:00', status: 'splitting', driverName: '刘师傅' },
  { id: '6', waybillNo: 'WB20260602006', orderId: 'ORD20260601006', route: '西安→郑州', amount: 6500, completedAt: '2026-05-31 15:00', expectedArrival: '2026-06-01 15:00', status: 'pending_pay', driverName: '陈师傅' },
  { id: '7', waybillNo: 'WB20260602007', orderId: 'ORD20260601007', route: '南京→苏州', amount: 1500, completedAt: '2026-06-01 13:45', expectedArrival: '2026-06-02 13:00', status: 'pending_split', driverName: '周师傅' },
  { id: '8', waybillNo: 'WB20260602008', orderId: 'ORD20260601008', route: '厦门→福州', amount: 3200, completedAt: '2026-06-01 10:00', expectedArrival: '2026-06-02 10:00', status: 'splitting', driverName: '吴师傅' }
]

const mockSettlementRecords: SettlementRecord[] = [
  { id: '1', batchNo: 'SET20260601001', waybillCount: 25, totalAmount: 86500, driverIncome: 79580, platformFee: 6920, settledAt: '2026-06-01 15:30:00', status: 'completed', transactionNo: 'TX202606010001' },
  { id: '2', batchNo: 'SET20260531002', waybillCount: 32, totalAmount: 125800, driverIncome: 115736, platformFee: 10064, settledAt: '2026-05-31 16:00:00', status: 'completed', transactionNo: 'TX202605310002' },
  { id: '3', batchNo: 'SET20260530003', waybillCount: 18, totalAmount: 68500, driverIncome: 63020, platformFee: 5480, settledAt: '2026-05-30 14:45:00', status: 'completed', transactionNo: 'TX202605300003' },
  { id: '4', batchNo: 'SET20260529004', waybillCount: 42, totalAmount: 156200, driverIncome: 143704, platformFee: 12496, settledAt: '2026-05-29 17:20:00', status: 'completed', transactionNo: 'TX202605290004' },
  { id: '5', batchNo: 'SET20260528005', waybillCount: 28, totalAmount: 98700, driverIncome: 90804, platformFee: 7896, settledAt: '2026-05-28 13:15:00', status: 'completed', transactionNo: 'TX202605280005' },
  { id: '6', batchNo: 'SET20260527006', waybillCount: 35, totalAmount: 112400, driverIncome: 103408, platformFee: 8992, settledAt: '2026-05-27 16:30:00', status: 'completed', transactionNo: 'TX202605270006' }
]

const mockSplitDetails: SplitDetail[] = [
  { id: '1', waybillNo: 'WB20260601001', orderId: 'ORD20260601001', amount: 10000, driverIncome: 9200, platformFee: 800, tax: 60, actualPay: 9140, splitAt: '2026-06-01 15:30:00', voucherNo: 'V202606010001', status: 'completed' },
  { id: '2', waybillNo: 'WB20260601002', orderId: 'ORD20260601002', amount: 5000, driverIncome: 4600, platformFee: 400, tax: 30, actualPay: 4570, splitAt: '2026-06-01 15:25:00', voucherNo: 'V202606010002', status: 'completed' },
  { id: '3', waybillNo: 'WB20260601003', orderId: 'ORD20260601003', amount: 8500, driverIncome: 7820, platformFee: 680, tax: 51, actualPay: 7769, splitAt: '2026-06-01 15:20:00', voucherNo: 'V202606010003', status: 'completed' },
  { id: '4', waybillNo: 'WB20260601004', orderId: 'ORD20260601004', amount: 12000, driverIncome: 11040, platformFee: 960, tax: 72, actualPay: 10968, splitAt: '2026-06-01 15:15:00', voucherNo: 'V202606010004', status: 'completed' },
  { id: '5', waybillNo: 'WB20260601005', orderId: 'ORD20260601005', amount: 3200, driverIncome: 2944, platformFee: 256, tax: 19.2, actualPay: 2924.8, splitAt: '2026-06-01 15:10:00', voucherNo: 'V202606010005', status: 'completed' },
  { id: '6', waybillNo: 'WB20260601006', orderId: 'ORD20260601006', amount: 15000, driverIncome: 13800, platformFee: 1200, tax: 90, actualPay: 13710, splitAt: '2026-06-01 15:05:00', voucherNo: 'V202606010006', status: 'processing' }
]

const mockWithdrawRecords: WithdrawRecord[] = [
  { id: '1', amount: 50000, bankAccount: '招商银行 **** 8888', applyTime: '2026-06-01 10:30:00', arrivalTime: '2026-06-01 14:20:00', status: 'completed' },
  { id: '2', amount: 80000, bankAccount: '工商银行 **** 6666', applyTime: '2026-06-01 09:15:00', arrivalTime: '2026-06-01 13:45:00', status: 'completed' },
  { id: '3', amount: 30000, bankAccount: '招商银行 **** 8888', applyTime: '2026-05-31 16:20:00', arrivalTime: '2026-06-01 10:30:00', status: 'completed' },
  { id: '4', amount: 100000, bankAccount: '建设银行 **** 9999', applyTime: '2026-06-02 08:45:00', status: 'processing' },
  { id: '5', amount: 25000, bankAccount: '招商银行 **** 8888', applyTime: '2026-06-02 11:00:00', status: 'pending' }
]

const timelineSteps = [
  { key: 'completed', icon: CheckCircle, label: '运单完成', desc: '司机确认签收' },
  { key: 'calculating', icon: Calculator, label: '分账计算', desc: 'T+0 自动计算' },
  { key: 'arrival', icon: Banknote, label: 'T+1 到账', desc: '次日10点前到账' }
]

export default function Settlement() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'detail' | 'withdraw'>('pending')
  const [pendingList, setPendingList] = useState<PendingSettlement[]>(mockPendingList)
  const [settlementRecords, setSettlementRecords] = useState<SettlementRecord[]>(mockSettlementRecords)
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>(mockSplitDetails)
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>(mockWithdrawRecords)
  const [detailModal, setDetailModal] = useState<{ visible: boolean; settlement: SettlementDetail | null }>({ visible: false, settlement: null })
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = useState({ start: '2026-05-01', end: '2026-06-02' })
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankAccount: '招商银行 **** 8888' })
  const [withdrawing, setWithdrawing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const stats = {
    pending: 1280000,
    todaySettled: 356800,
    monthSettled: 8650000,
    platformFee: 528000
  }

  const incomeTrendData = {
    labels: ['5/27', '5/28', '5/29', '5/30', '5/31', '6/1', '6/2'],
    values: [112400, 98700, 156200, 68500, 125800, 86500, 356800]
  }

  const pieData = {
    labels: ['司机收入(92%)', '平台服务费(8%)'],
    values: [92, 8],
    colors: ['#10B981', '#1B2A4A']
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await api.get('/settlement/list')
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const viewDetail = async (row: any) => {
    try {
      const res = await api.get(`/settlement/detail/${row.id}`)
      const settlement = res as any
      setDetailModal({
        visible: true,
        settlement: {
          waybillNo: settlement.waybill_no || row.waybillNo || 'WB20260601001',
          orderId: settlement.order_id || row.orderId || 'ORD20260601001',
          route: `${settlement.from_city || '上海'}→${settlement.to_city || '杭州'}`,
          driverName: settlement.driver_name || '张师傅',
          plateNo: settlement.plate_no || '沪A·D8521',
          amount: settlement.total_amount || row.amount || 10000,
          platformFee: settlement.platform_fee || Math.round((row.amount || 10000) * 0.08),
          tax: Math.round((row.amount || 10000) * 0.006 * 100) / 100,
          driverActual: Math.round((row.amount || 10000) * 0.914 * 100) / 100,
          splitFormula: '运费 - 平台服务费(8%) - 税费(0.6%) = 司机实得',
          voucherUrl: '/voucher/sample.pdf'
        }
      })
    } catch {
      setDetailModal({
        visible: true,
        settlement: {
          waybillNo: row.waybillNo || 'WB20260601001',
          orderId: row.orderId || 'ORD20260601001',
          route: row.route || '上海→杭州',
          driverName: row.driverName || '张师傅',
          plateNo: '沪A·D8521',
          amount: row.amount || 10000,
          platformFee: Math.round((row.amount || 10000) * 0.08),
          tax: Math.round((row.amount || 10000) * 0.006 * 100) / 100,
          driverActual: Math.round((row.amount || 10000) * 0.914 * 100) / 100,
          splitFormula: '运费 - 平台服务费(8%) - 税费(0.6%) = 司机实得',
          voucherUrl: '/voucher/sample.pdf'
        }
      })
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) {
      alert('请输入有效的提现金额')
      return
    }
    setWithdrawing(true)
    try {
      await api.post('/settlement/withdraw', {
        amount: parseFloat(withdrawForm.amount),
        bankAccount: withdrawForm.bankAccount
      })
      const newRecord: WithdrawRecord = {
        id: Date.now().toString(),
        amount: parseFloat(withdrawForm.amount),
        bankAccount: withdrawForm.bankAccount,
        applyTime: new Date().toLocaleString('zh-CN'),
        status: 'pending'
      }
      setWithdrawRecords([newRecord, ...withdrawRecords])
      setWithdrawForm({ amount: '', bankAccount: '招商银行 **** 8888' })
      alert('提现申请已提交')
    } catch (err: any) {
      alert(err.message || '提现申请失败')
    } finally {
      setWithdrawing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pendingColumns = [
    { key: 'waybillNo', title: '运单号', sortable: true },
    { key: 'orderId', title: '订单号' },
    { key: 'route', title: '线路' },
    {
      key: 'amount',
      title: '运费金额',
      sortable: true,
      render: (row: PendingSettlement) => (
        <span className="font-mono font-semibold text-primary">¥{row.amount.toLocaleString()}</span>
      )
    },
    { key: 'completedAt', title: '完成时间', sortable: true },
    { key: 'expectedArrival', title: '预计到账时间' },
    {
      key: 'status',
      title: '状态',
      render: (row: PendingSettlement) => <StatusBadge {...pendingStatusMap[row.status]} />
    },
    {
      key: 'action',
      title: '操作',
      render: (row: PendingSettlement) => (
        <button
          onClick={() => viewDetail(row)}
          className="flex items-center gap-1 text-xs text-primary hover:text-accent transition-colors"
        >
          <Eye size={12} />
          查看明细
        </button>
      )
    }
  ]

  const settlementColumns = [
    { key: 'batchNo', title: '结算批次号', sortable: true },
    { key: 'waybillCount', title: '运单数', sortable: true },
    {
      key: 'totalAmount',
      title: '总金额',
      sortable: true,
      render: (row: SettlementRecord) => (
        <span className="font-mono font-semibold text-primary">¥{row.totalAmount.toLocaleString()}</span>
      )
    },
    {
      key: 'driverIncome',
      title: '司机收入',
      render: (row: SettlementRecord) => (
        <span className="font-mono text-mint">¥{row.driverIncome.toLocaleString()}</span>
      )
    },
    {
      key: 'platformFee',
      title: '平台服务费',
      render: (row: SettlementRecord) => (
        <span className="font-mono text-secondary">¥{row.platformFee.toLocaleString()}</span>
      )
    },
    { key: 'settledAt', title: '结算时间', sortable: true },
    {
      key: 'status',
      title: '状态',
      render: (row: SettlementRecord) => <StatusBadge {...settlementStatusMap[row.status]} />
    },
    {
      key: 'action',
      title: '操作',
      render: (row: SettlementRecord) => (
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 text-xs text-primary hover:text-accent transition-colors"
            title="下载凭证"
          >
            <Download size={12} />
          </button>
          <button
            onClick={() => viewDetail(row)}
            className="flex items-center gap-1 text-xs text-primary hover:text-accent transition-colors"
          >
            <Eye size={12} />
            明细
          </button>
        </div>
      )
    }
  ]

  const splitDetailColumns = [
    { key: 'waybillNo', title: '运单号', sortable: true },
    {
      key: 'amount',
      title: '运费金额',
      sortable: true,
      render: (row: SplitDetail) => (
        <span className="font-mono font-semibold text-primary">¥{row.amount.toLocaleString()}</span>
      )
    },
    {
      key: 'driverIncome',
      title: '司机收入(92%)',
      render: (row: SplitDetail) => (
        <span className="font-mono text-mint">¥{row.driverIncome.toLocaleString()}</span>
      )
    },
    {
      key: 'platformFee',
      title: '平台服务费(8%)',
      render: (row: SplitDetail) => (
        <span className="font-mono text-secondary">¥{row.platformFee.toLocaleString()}</span>
      )
    },
    {
      key: 'tax',
      title: '税费(0.6%)',
      render: (row: SplitDetail) => (
        <span className="font-mono text-orange-600">¥{row.tax.toLocaleString()}</span>
      )
    },
    {
      key: 'actualPay',
      title: '实付金额',
      render: (row: SplitDetail) => (
        <span className="font-mono font-bold text-accent">¥{row.actualPay.toLocaleString()}</span>
      )
    },
    { key: 'splitAt', title: '分账时间', sortable: true },
    { key: 'voucherNo', title: '打款凭证号' },
    {
      key: 'status',
      title: '状态',
      render: (row: SplitDetail) => (
        <StatusBadge
          status={row.status === 'completed' ? 'completed' : 'active'}
          label={row.status === 'completed' ? '已完成' : '处理中'}
        />
      )
    },
    {
      key: 'expand',
      title: '',
      render: (row: SplitDetail) => (
        <button
          onClick={() => toggleExpand(row.id)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {expandedRows.has(row.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )
    }
  ]

  const withdrawColumns = [
    { key: 'applyTime', title: '申请时间', sortable: true },
    {
      key: 'amount',
      title: '提现金额',
      sortable: true,
      render: (row: WithdrawRecord) => (
        <span className="font-mono font-semibold text-primary">¥{row.amount.toLocaleString()}</span>
      )
    },
    { key: 'bankAccount', title: '银行账户' },
    { key: 'arrivalTime', title: '到账时间' },
    {
      key: 'status',
      title: '状态',
      render: (row: WithdrawRecord) => <StatusBadge {...withdrawStatusMap[row.status]} />
    }
  ]

  const tabs = [
    { key: 'pending', label: '待结算', count: pendingList.length, icon: Clock },
    { key: 'history', label: '结算记录', count: settlementRecords.length, icon: FileText },
    { key: 'detail', label: '分账明细', count: splitDetails.length, icon: PieChart },
    { key: 'withdraw', label: '提现管理', count: withdrawRecords.filter(w => w.status === 'pending' || w.status === 'processing').length, icon: CreditCard }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Wallet className="text-accent" size={24} />
            T+1 分账结算中心
          </h1>
          <p className="text-sm text-muted mt-0.5">自动化分账 · 次日到账 · 全程可追溯</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted font-mono bg-gray-50 px-3 py-1.5 rounded">
            {new Date().toLocaleString('zh-CN')}
          </span>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="text-xs">刷新</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Clock size={20} />}
          value={`¥${stats.pending.toLocaleString()}`}
          label="待结算金额"
          sublabel="T+1 自动结算"
          gradient="gradient-accent"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          value={`¥${stats.todaySettled.toLocaleString()}`}
          label="今日已结算"
          sublabel={new Date().toLocaleDateString('zh-CN')}
          gradient="gradient-mint"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          value={`¥${stats.monthSettled.toLocaleString()}`}
          label="本月已结算"
          sublabel="2026年6月"
          gradient="gradient-primary"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          value={`¥${stats.platformFee.toLocaleString()}`}
          label="平台服务费"
          sublabel="8% 费率"
          gradient="gradient-coral"
        />
      </div>

      <div className="card">
        <div className="flex items-center gap-1 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-secondary hover:bg-gray-100'
                )}
              >
                <Icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs',
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-muted'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                <Clock size={16} className="text-accent" />
                T+1 结算进度
              </h3>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-5 left-12 right-12 h-0.5 bg-gray-200 z-0" />
                <div className="absolute top-5 left-12 h-0.5 bg-gradient-to-r from-primary via-accent to-mint z-0" style={{ width: '66%' }} />
                {timelineSteps.map((step, idx) => {
                  const Icon = step.icon
                  const isActive = idx <= 1
                  const isCurrent = idx === 1
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center border-2',
                          isActive
                            ? isCurrent
                              ? 'bg-accent border-accent text-white'
                              : 'bg-primary border-primary text-white'
                            : 'bg-white border-gray-200 text-gray-400'
                        )}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="mt-2 text-center">
                        <div
                          className={cn(
                            'text-sm font-medium',
                            isActive ? 'text-primary' : 'text-gray-400'
                          )}
                        >
                          {step.label}
                        </div>
                        <div className="text-xs text-muted mt-0.5">{step.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary">待结算运单列表</h3>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <AlertCircle size={12} />
                  共 {pendingList.length} 笔待结算，预计 {pendingList.filter(s => s.status === 'pending_pay').length} 笔今日到账
                </div>
              </div>
              <DataTable columns={pendingColumns} data={pendingList} pageSize={10} />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    结算记录
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Calendar size={12} />
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <span>至</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <DataTable columns={settlementColumns} data={settlementRecords} pageSize={5} />
                </div>
              </div>
              <div className="col-span-4 space-y-4">
                <Chart
                  type="line"
                  data={incomeTrendData}
                  height={220}
                  title="近7日收入趋势"
                  lineColor="#F59E0B"
                />
                <Chart
                  type="pie"
                  data={pieData}
                  height={200}
                  title="分账占比"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'detail' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-mint/5 to-primary/5 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Calculator size={16} className="text-mint" />
                分账规则说明
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted">运费</span>
                  <ArrowRight size={14} className="text-gray-300" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-mint/10 text-mint rounded text-xs font-medium">司机收入 92%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">平台服务费 8%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-medium">税费 0.6%</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-muted">司机实得 = 运费 × 91.4%</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary mb-4">分账明细列表</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {splitDetailColumns.map((col) => (
                        <th
                          key={col.key}
                          className="text-left py-3 px-4 font-medium text-secondary whitespace-nowrap"
                        >
                          {col.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {splitDetails.map((row) => (
                      <>
                        <tr
                          key={row.id}
                          className="border-b border-border/50 hover:bg-gray-50 transition-colors"
                        >
                          {splitDetailColumns.map((col) => (
                            <td key={col.key} className="py-3 px-4 text-primary whitespace-nowrap">
                              {col.render ? col.render(row) : String(row[col.key as keyof SplitDetail] ?? '')}
                            </td>
                          ))}
                        </tr>
                        {expandedRows.has(row.id) && (
                          <tr className="bg-gray-50">
                            <td colSpan={splitDetailColumns.length} className="py-4 px-6">
                              <div className="bg-white rounded-lg p-4 border">
                                <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                                  <Calculator size={14} className="text-accent" />
                                  分账公式详情
                                </h4>
                                <div className="font-mono text-sm bg-gray-50 rounded-lg p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted">运费金额</span>
                                    <span className="text-primary">¥{row.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted">- 平台服务费 (8%)</span>
                                    <span className="text-secondary">- ¥{row.platformFee.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted">- 税费 (0.6%)</span>
                                    <span className="text-orange-600">- ¥{row.tax.toLocaleString()}</span>
                                  </div>
                                  <div className="border-t border-gray-200 my-2" />
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="text-primary">司机实得 =</span>
                                    <span className="text-accent text-lg">¥{row.actualPay.toLocaleString()}</span>
                                  </div>
                                  <div className="text-xs text-muted mt-2 pt-2 border-t border-gray-200">
                                    计算公式：{row.amount.toLocaleString()} - {row.platformFee.toLocaleString()} - {row.tax.toLocaleString()} = {row.actualPay.toLocaleString()}
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                                  <div className="flex items-center gap-1">
                                    <FileText size={12} />
                                    凭证号：{row.voucherNo}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    分账时间：{row.splitAt}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="card bg-gradient-to-br from-mint/10 to-emerald-50 border-mint/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-mint flex items-center justify-center text-white">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary font-mono">¥865,400</p>
                    <p className="text-sm text-muted mt-0.5">可提现金额</p>
                  </div>
                </div>
              </div>
              <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center text-white">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary font-mono">¥128,000</p>
                    <p className="text-sm text-muted mt-0.5">冻结金额</p>
                  </div>
                </div>
              </div>
              <div className="card bg-gradient-to-br from-primary/10 to-blue-50 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
                    <Send size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary font-mono">¥125,000</p>
                    <p className="text-sm text-muted mt-0.5">提现中</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-5">
                <div className="card">
                  <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                    <CreditCard size={16} className="text-primary" />
                    申请提现
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-muted mb-1.5">提现金额</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-medium">¥</span>
                        <input
                          type="number"
                          value={withdrawForm.amount}
                          onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                          placeholder="请输入提现金额"
                          className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <button
                          onClick={() => setWithdrawForm({ ...withdrawForm, amount: '10000' })}
                          className="text-xs text-primary hover:text-accent"
                        >
                          1万
                        </button>
                        <button
                          onClick={() => setWithdrawForm({ ...withdrawForm, amount: '50000' })}
                          className="text-xs text-primary hover:text-accent"
                        >
                          5万
                        </button>
                        <button
                          onClick={() => setWithdrawForm({ ...withdrawForm, amount: '100000' })}
                          className="text-xs text-primary hover:text-accent"
                        >
                          10万
                        </button>
                        <button
                          onClick={() => setWithdrawForm({ ...withdrawForm, amount: '865400' })}
                          className="text-xs text-primary hover:text-accent"
                        >
                          全部
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">收款账户</label>
                      <select
                        value={withdrawForm.bankAccount}
                        onChange={(e) => setWithdrawForm({ ...withdrawForm, bankAccount: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
                      >
                        <option>招商银行 **** 8888</option>
                        <option>工商银行 **** 6666</option>
                        <option>建设银行 **** 9999</option>
                      </select>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-muted space-y-1">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle size={12} className="text-accent" />
                        提现说明
                      </div>
                      <div>• 工作日 9:00-17:00 提交，当日到账</div>
                      <div>• 非工作日提交，下一工作日处理</div>
                      <div>• 最低提现金额：¥1,000</div>
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing || !withdrawForm.amount}
                      className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {withdrawing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {withdrawing ? '提交中...' : '提交提现申请'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-span-7">
                <div className="card h-full">
                  <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    提现记录
                  </h3>
                  <DataTable columns={withdrawColumns} data={withdrawRecords} pageSize={6} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {detailModal.visible && detailModal.settlement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FileText size={18} />
                  分账详情
                </h3>
                <p className="text-white/70 text-xs mt-0.5">运单：{detailModal.settlement.waybillNo}</p>
              </div>
              <button
                onClick={() => setDetailModal({ visible: false, settlement: null })}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">运单号</div>
                  <div className="text-sm font-mono text-primary flex items-center gap-2">
                    {detailModal.settlement.waybillNo}
                    <button
                      onClick={() => copyToClipboard(detailModal.settlement.waybillNo)}
                      className="p-0.5 hover:bg-gray-200 rounded"
                    >
                      {copied ? <Check size={12} className="text-mint" /> : <Copy size={12} className="text-muted" />}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">订单号</div>
                  <div className="text-sm font-mono text-primary">{detailModal.settlement.orderId}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">运输线路</div>
                  <div className="text-sm font-medium text-primary">{detailModal.settlement.route}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">司机信息</div>
                  <div className="text-sm font-medium text-primary">
                    {detailModal.settlement.driverName} / {detailModal.settlement.plateNo}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                  <Calculator size={14} className="text-accent" />
                  分账公式
                </h4>
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4">
                  <div className="text-center text-sm text-muted mb-4">
                    {detailModal.settlement.splitFormula}
                  </div>
                  <div className="font-mono space-y-2">
                    <div className="flex items-center justify-between bg-white rounded-lg p-3">
                      <span className="text-muted">运费金额</span>
                      <span className="text-primary font-semibold">¥{detailModal.settlement.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3">
                      <span className="text-muted">− 平台服务费 (8%)</span>
                      <span className="text-secondary">− ¥{detailModal.settlement.platformFee.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3">
                      <span className="text-muted">− 税费 (0.6%)</span>
                      <span className="text-orange-600">− ¥{detailModal.settlement.tax.toLocaleString()}</span>
                    </div>
                    <div className="border-t-2 border-dashed border-gray-200 my-2" />
                    <div className="flex items-center justify-between bg-accent/10 rounded-lg p-3">
                      <span className="font-medium text-primary">司机实得 =</span>
                      <span className="text-accent text-xl font-bold">¥{detailModal.settlement.driverActual.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted text-center">
                    验证：{detailModal.settlement.amount.toLocaleString()} - {detailModal.settlement.platformFee.toLocaleString()} - {detailModal.settlement.tax.toLocaleString()} = {detailModal.settlement.driverActual.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                    <FileText size={14} className="text-primary" />
                    电子回单
                  </h4>
                  <button className="flex items-center gap-1 text-xs text-primary hover:text-accent transition-colors">
                    <Download size={12} />
                    下载PDF
                  </button>
                </div>
                <div className="bg-white rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <FileText size={28} className="text-primary" />
                  </div>
                  <div className="text-sm text-primary font-medium mb-1">电子回单预览</div>
                  <div className="text-xs text-muted">包含完整分账明细、打款凭证、税务信息</div>
                  <button className="mt-4 px-4 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition-colors">
                    预览回单
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setDetailModal({ visible: false, settlement: null })}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-secondary hover:bg-gray-100 transition-colors"
              >
                关闭
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <Download size={14} />
                下载凭证
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
