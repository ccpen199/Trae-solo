import { useState, useMemo } from 'react'
import {
  serviceProviders,
  bills,
  invoices,
  paymentRecords,
  reconciliationRecords,
  nonTaxVouchers,
  businessFlowLogs,
} from '@/data'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  Flame,
  Droplets,
  HeartPulse,
  Bus,
  Zap,
  Wifi,
  Building2,
  Leaf,
  GraduationCap,
  Tv,
  Shield,
  Landmark,
  Stethoscope,
  Trees,
  CloudSun,
  Ticket,
  ShieldCheck,
  Download,
  Eye,
  QrCode,
  CheckSquare,
  Square,
  Receipt,
  FileText,
  CheckCircle,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  X,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  flame: Flame,
  droplet: Droplets,
  'heart-pulse': HeartPulse,
  bus: Bus,
  zap: Zap,
  wifi: Wifi,
  building: Building2,
  leaf: Leaf,
  'graduation-cap': GraduationCap,
  tv: Tv,
  shield: Shield,
  landmark: Landmark,
  stethoscope: Stethoscope,
  trees: Trees,
  'cloud-sun': CloudSun,
  ticket: Ticket,
  'shield-check': ShieldCheck,
}

type BillFilter = 'all' | 'unpaid' | 'paid' | 'overdue'

const statusMap: Record<string, { label: string; className: string }> = {
  paid: { label: '已缴费', className: 'gov-badge gov-badge-green' },
  unpaid: { label: '待缴费', className: 'gov-badge gov-badge-yellow' },
  overdue: { label: '逾期', className: 'gov-badge gov-badge-red' },
}

const invoiceTypeColor: Record<string, string> = {
  增值税: 'bg-blue-500',
  缴费凭证: 'bg-green-500',
  医保凭证: 'bg-purple-500',
  社保: 'bg-orange-500',
}

function getInvoiceBarColor(type: string) {
  if (type.includes('增值税')) return invoiceTypeColor['增值税']
  if (type.includes('医保')) return invoiceTypeColor['医保凭证']
  if (type.includes('社保')) return invoiceTypeColor['社保']
  if (type.includes('凭证')) return invoiceTypeColor['缴费凭证']
  return 'bg-gray-400'
}

const tabs: { key: 'bills' | 'invoices' | 'vouchers'; label: string }[] = [
  { key: 'bills', label: '缴费中心' },
  { key: 'invoices', label: '电子发票' },
  { key: 'vouchers', label: '缴款凭证' },
]

const filterTabs: { key: BillFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unpaid', label: '待缴费' },
  { key: 'paid', label: '已缴费' },
  { key: 'overdue', label: '逾期' },
]

const flowSteps = [
  { key: 0, label: '待缴', icon: Clock },
  { key: 1, label: '缴费中', icon: Loader2 },
  { key: 2, label: '已缴', icon: CheckCircle2 },
  { key: 3, label: '已开票', icon: Receipt },
  { key: 4, label: '已开凭证', icon: Ticket },
]

const flowDescriptionSteps = [
  { label: '账单生成', icon: FileText, desc: '服务商出账，系统生成待缴账单' },
  { label: '支付', icon: DollarSign, desc: '用户在线缴费，资金划转' },
  { label: '对账', icon: TrendingUp, desc: '日终系统与服务商自动对账' },
  { label: '开票', icon: Receipt, desc: '对账完成后自动开具电子发票' },
  { label: '凭证', icon: Ticket, desc: '非税收入生成缴款凭证' },
]

export default function Life() {
  const [billFilter, setBillFilter] = useState<BillFilter>('all')
  const [isPaying, setIsPaying] = useState(false)
  const [newInvoiceIds, setNewInvoiceIds] = useState<string[]>([])
  const [previewInvoice, setPreviewInvoice] = useState<string | null>(null)
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null)
  const {
    selectedBillIds,
    toggleBillSelection,
    clearBillSelection,
    paymentSuccessIds,
    addPaymentSuccess,
    lifeTab,
    setLifeTab,
    selectedBillDetailId,
    setSelectedBillDetailId,
  } = useStore()

  const filteredBills = useMemo(() => {
    if (billFilter === 'all') return bills
    return bills.filter((b) => b.status === billFilter)
  }, [billFilter])

  const selectedBills = bills.filter((b) => selectedBillIds.includes(b.id))
  const selectedTotal = selectedBills.reduce((sum, b) => sum + b.amount, 0)

  const selectedBillDetail = bills.find((b) => b.id === selectedBillDetailId) || null
  const billFlowLogs = businessFlowLogs.filter((l) => l.billId === selectedBillDetailId)
  const billPaymentRecord = paymentRecords.find((p) => p.billId === selectedBillDetailId)
  const billReconciliation = reconciliationRecords.find((r) => r.billId === selectedBillDetailId)

  const invoicesWithNewFlag = invoices.map((inv) => ({
    ...inv,
    isNew: newInvoiceIds.includes(inv.id),
  }))

  const handleBatchPay = async () => {
    if (selectedBillIds.length === 0 || isPaying) return

    setIsPaying(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newInvoices: string[] = []
    selectedBillIds.forEach((billId) => {
      addPaymentSuccess(billId)
      const existingInvoice = invoices.find((inv) => inv.billId === billId)
      if (existingInvoice) {
        newInvoices.push(existingInvoice.id)
      }
    })

    setNewInvoiceIds((prev) => [...prev, ...newInvoices])
    setIsPaying(false)
    clearBillSelection()
    setLifeTab('invoices')
  }

  const handleBillClick = (billId: string) => {
    setSelectedBillDetailId(billId)
  }

  const previewInvoiceData = invoices.find((inv) => inv.id === previewInvoice) || null
  const selectedVoucher = nonTaxVouchers.find((v) => v.id === selectedVoucherId) || null

  const getBillCurrentStep = (bill: typeof bills[0]) => {
    if (paymentSuccessIds.includes(bill.id)) {
      return 3
    }
    return bill.currentStep
  }

  const getBillStatus = (bill: typeof bills[0]) => {
    if (paymentSuccessIds.includes(bill.id)) {
      return { label: '已缴费', className: 'gov-badge gov-badge-green' }
    }
    return statusMap[bill.status]
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setLifeTab(tab.key)}
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors relative',
              lifeTab === tab.key
                ? 'text-gov-blue'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            {lifeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-blue" />
            )}
          </button>
        ))}
      </div>

      {lifeTab === 'bills' && (
        <div className="flex gap-6">
          <div className={cn('space-y-6 transition-all', selectedBillDetailId ? 'flex-1' : 'w-full')}>
            <div className="gov-card p-4">
              <h3 className="text-sm font-semibold text-gov-navy mb-4">服务提供商</h3>
              <div className="grid grid-cols-6 gap-3">
                {serviceProviders.slice(0, 12).map((sp) => {
                  const Icon = iconMap[sp.icon] || FileText
                  return (
                    <div
                      key={sp.id}
                      className="flex flex-col items-center justify-center py-3 px-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gov-blue/10 flex items-center justify-center mb-2">
                        <Icon className="w-5 h-5 text-gov-blue" />
                      </div>
                      <span className="text-xs text-gray-700 text-center leading-tight">
                        {sp.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {filterTabs.map((ft) => (
                  <button
                    key={ft.key}
                    onClick={() => setBillFilter(ft.key)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-xs font-medium transition-colors',
                      billFilter === ft.key
                        ? 'bg-gov-blue text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                共 {filteredBills.length} 条记录
              </span>
            </div>

            <div className="gov-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="w-10 px-4 py-3" />
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">服务商 / 类型</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">金额</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">到期日</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">状态</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">流程进度</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => {
                    const status = getBillStatus(bill)
                    const isSelected = selectedBillIds.includes(bill.id)
                    const isDetail = selectedBillDetailId === bill.id
                    const currentStep = getBillCurrentStep(bill)
                    const isUnpaid = bill.status === 'unpaid' || bill.status === 'overdue'

                    return (
                      <tr
                        key={bill.id}
                        className={cn(
                          'border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer',
                          isDetail && 'bg-gov-blue/5'
                        )}
                        onClick={() => handleBillClick(bill.id)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleBillSelection(bill.id)}>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-gov-blue" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 font-medium">{bill.providerName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{bill.type}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-800 font-medium">
                          ¥{bill.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{bill.dueDate}</td>
                        <td className="px-4 py-3">
                          <span className={status.className}>{status.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            {flowSteps.slice(0, 4).map((step, idx) => {
                              const StepIcon = step.icon
                              const isActive = currentStep >= step.key
                              const isCurrent = currentStep === step.key
                              return (
                                <div key={step.key} className="flex items-center">
                                  <div
                                    className={cn(
                                      'w-5 h-5 rounded-full flex items-center justify-center',
                                      isActive
                                        ? 'bg-gov-blue text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    )}
                                  >
                                    {isCurrent && isUnpaid ? (
                                      <StepIcon className="w-3 h-3 animate-spin" />
                                    ) : isActive ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    )}
                                  </div>
                                  {idx < 3 && (
                                    <div
                                      className={cn(
                                        'w-6 h-0.5',
                                        currentStep > step.key
                                          ? 'bg-gov-blue'
                                          : 'bg-gray-200'
                                      )}
                                    />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {isUnpaid ? (
                            <button
                              onClick={() => {
                                toggleBillSelection(bill.id)
                              }}
                              className="text-xs text-gov-blue hover:text-gov-navy font-medium"
                            >
                              立即缴费
                            </button>
                          ) : (
                            <button
                              onClick={() => setLifeTab('invoices')}
                              className="text-xs text-gov-blue hover:text-gov-navy font-medium"
                            >
                              查看票据
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {selectedBillIds.length > 0 && (
              <div className="gov-card flex items-center justify-between px-6 py-4 sticky bottom-0 z-10">
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-600">
                    已选择 <span className="font-semibold text-gov-blue">{selectedBillIds.length}</span> 项
                  </span>
                  <span className="text-gray-600">
                    合计 <span className="font-mono font-semibold text-gov-navy">¥{selectedTotal.toFixed(2)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={clearBillSelection}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    取消选择
                  </button>
                  <button
                    onClick={handleBatchPay}
                    disabled={isPaying}
                    className="gov-btn-gold flex items-center gap-2"
                  >
                    {isPaying && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPaying ? '缴费中...' : '批量缴费'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedBillDetail && (
            <div className="w-96 gov-card p-5 space-y-5 h-fit sticky top-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gov-navy">{selectedBillDetail.providerName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{selectedBillDetail.type}</p>
                </div>
                <button
                  onClick={() => setSelectedBillDetailId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gold-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">账单金额</p>
                <p className="font-mono text-2xl font-bold text-gold-600 mt-1">
                  ¥{selectedBillDetail.amount.toFixed(2)}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">账单编号</span>
                  <span className="font-mono text-gray-800">{selectedBillDetail.accountNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">出账日期</span>
                  <span className="text-gray-800">{selectedBillDetail.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">到期日期</span>
                  <span className="text-gray-800">{selectedBillDetail.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前状态</span>
                  <span className={getBillStatus(selectedBillDetail).className}>
                    {getBillStatus(selectedBillDetail).label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">费用说明</span>
                  <span className="text-gray-800">{selectedBillDetail.details}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">业务流程</h4>
                <div className="space-y-3">
                  {billFlowLogs.length > 0 ? (
                    billFlowLogs.map((log, idx) => (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full mt-1.5',
                              log.status === 'success'
                                ? 'bg-green-500'
                                : log.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            )}
                          />
                          {idx < billFlowLogs.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gray-100 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-800">{log.details}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{log.timestamp}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">暂无流程记录</p>
                  )}
                </div>
              </div>

              {billPaymentRecord && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">支付记录</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">支付方式</span>
                      <span className="text-gray-800">
                        {billPaymentRecord.payMethod === 'wechat' && '微信支付'}
                        {billPaymentRecord.payMethod === 'alipay' && '支付宝'}
                        {billPaymentRecord.payMethod === 'unionpay' && '银联支付'}
                        {billPaymentRecord.payMethod === 'bank' && '银行卡代扣'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">交易号</span>
                      <span className="font-mono text-gray-800">
                        {billPaymentRecord.transactionNo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">支付时间</span>
                      <span className="text-gray-800">{billPaymentRecord.payTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">状态</span>
                      <span
                        className={cn(
                          'text-xs',
                          billPaymentRecord.status === 'success' && 'text-green-600',
                          billPaymentRecord.status === 'pending' && 'text-yellow-600',
                          billPaymentRecord.status === 'failed' && 'text-red-600',
                          billPaymentRecord.status === 'refunded' && 'text-gray-500'
                        )}
                      >
                        {billPaymentRecord.status === 'success' && '支付成功'}
                        {billPaymentRecord.status === 'pending' && '处理中'}
                        {billPaymentRecord.status === 'failed' && '支付失败'}
                        {billPaymentRecord.status === 'refunded' && '已退款'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {billReconciliation && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">对账记录</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">对账日期</span>
                      <span className="text-gray-800">
                        {billReconciliation.reconciliationDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">系统金额</span>
                      <span className="font-mono text-gray-800">
                        ¥{billReconciliation.systemAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">渠道金额</span>
                      <span className="font-mono text-gray-800">
                        ¥{billReconciliation.providerAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">状态</span>
                      <span
                        className={cn(
                          'text-xs',
                          billReconciliation.status === 'matched' && 'text-green-600',
                          billReconciliation.status === 'pending' && 'text-yellow-600',
                          billReconciliation.status === 'mismatch' && 'text-red-600'
                        )}
                      >
                        {billReconciliation.status === 'matched' && '对账一致'}
                        {billReconciliation.status === 'pending' && '对账中'}
                        {billReconciliation.status === 'mismatch' && '对账差异'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {lifeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="gov-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gov-navy">状态流转说明</h3>
            </div>
            <div className="flex items-center justify-between">
              {flowDescriptionSteps.map((step, idx) => {
                const StepIcon = step.icon
                return (
                  <div key={step.label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 rounded-full bg-gov-blue/10 flex items-center justify-center mb-2">
                        <StepIcon className="w-6 h-6 text-gov-blue" />
                      </div>
                      <p className="text-xs font-medium text-gray-800">{step.label}</p>
                      <p className="text-xs text-gray-400 mt-1 text-center max-w-24">
                        {step.desc}
                      </p>
                    </div>
                    {idx < flowDescriptionSteps.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-300 -mt-8" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">我的发票</h3>
            <span className="text-xs text-gray-500">共 {invoices.length} 张</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoicesWithNewFlag.map((inv) => (
              <div key={inv.id} className="gov-card flex flex-col overflow-hidden relative">
                {inv.isNew && (
                  <div className="absolute top-3 right-3">
                    <span className="gov-badge gov-badge-red animate-pulse">NEW</span>
                  </div>
                )}
                <div className={cn('h-1.5', getInvoiceBarColor(inv.type))} />
                <div className="flex-1 p-4 space-y-3">
                  <div>
                    <p className="font-mono text-xs text-gray-500">{inv.invoiceNo}</p>
                    <p className="font-semibold text-gray-800 mt-1">{inv.providerName}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xs text-gray-500">开票金额</span>
                    <span className="font-mono text-xl font-bold text-gov-navy">
                      ¥{inv.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{inv.issueDate}</span>
                    <span className="gov-badge gov-badge-blue">{inv.type}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewInvoice(inv.id)}
                    className="flex items-center gap-1 text-xs text-gov-blue hover:text-gov-navy transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    预览
                  </button>
                  <button className="flex items-center gap-1 text-xs text-gov-blue hover:text-gov-navy transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    下载
                  </button>
                  <button className="flex items-center gap-1 text-xs text-gov-blue hover:text-gov-navy transition-colors">
                    <Send className="w-3.5 h-3.5" />
                    发送邮箱
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="gov-card p-5 mt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">开票记录</h3>
            <div className="space-y-3">
              {bills
                .filter((b) => b.hasInvoice)
                .map((bill) => {
                  const invoice = invoices.find((inv) => inv.billId === bill.id)
                  return (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-800">{bill.providerName}</p>
                          <p className="text-xs text-gray-500">{bill.type} · {bill.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium text-gray-800">
                          ¥{bill.amount.toFixed(2)}
                        </p>
                        {invoice && (
                          <p className="text-xs text-gray-400 font-mono">{invoice.invoiceNo}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {lifeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="gov-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gov-navy">凭证生成流程</h3>
            </div>
            <div className="flex items-center justify-between">
              {['支付完成', '对账完成', '凭证生成', '验证生效'].map((step, idx) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center mb-2',
                        idx < 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                      )}
                    >
                      {idx < 3 ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{idx + 1}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-700">{step}</p>
                  </div>
                  {idx < 3 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2 -mt-5',
                        idx < 2 ? 'bg-green-500' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">非税收入缴款凭证</h3>
            <span className="text-xs text-gray-500">共 {nonTaxVouchers.length} 张</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nonTaxVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="gov-card p-5 space-y-4 cursor-pointer hover:border-gov-blue/30 transition-colors"
                onClick={() => setSelectedVoucherId(voucher.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-gray-500">{voucher.voucherNo}</p>
                    <p className="font-semibold text-gray-800 mt-1">{voucher.itemName}</p>
                    <p className="text-xs text-gray-500 mt-1">{voucher.issuingAuthority}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-gov-navy">
                      ¥{voucher.amount.toFixed(2)}
                    </p>
                    <span
                      className={cn(
                        'text-xs gov-badge',
                        voucher.status === 'valid'
                          ? 'gov-badge-green'
                          : 'gov-badge-gray'
                      )}
                    >
                      {voucher.status === 'valid' ? '有效' : '无效'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center bg-gray-50">
                    <QrCode className="w-10 h-10 text-gray-400" />
                    <span className="text-[10px] text-gray-400 mt-1">扫码验证</span>
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">缴款人</span>
                      <span className="text-gray-800">{voucher.payerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">项目编码</span>
                      <span className="font-mono text-gray-800">{voucher.itemCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">开具日期</span>
                      <span className="text-gray-800">{voucher.issueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">校验码</span>
                      <span className="font-mono text-gray-800">{voucher.verifyCode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button className="flex-1 gov-btn-primary flex items-center justify-center gap-1.5 text-xs py-2">
                    <Download className="w-3.5 h-3.5" />
                    下载凭证
                  </button>
                  <button className="flex-1 gov-btn-outline flex items-center justify-center gap-1.5 text-xs py-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    验证真伪
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewInvoice && previewInvoiceData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">发票预览</h3>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-b from-blue-50/50 to-white">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-gov-navy">增值税电子普通发票</h2>
                  <p className="text-xs text-gray-500 mt-1">发票代码：044032100211</p>
                  <p className="text-xs font-mono text-gray-500">发票号码：{previewInvoiceData.invoiceNo}</p>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">开票日期：</span>
                    <span className="text-gray-800">{previewInvoiceData.issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">购买方：</span>
                    <span className="text-gray-800">张三</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">销售方：</span>
                    <span className="text-gray-800">{previewInvoiceData.providerName}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 mt-4 pt-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left font-medium pb-2">项目名称</th>
                        <th className="text-right font-medium pb-2">金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-gray-800 py-2">{previewInvoiceData.type}</td>
                        <td className="text-right font-mono text-gray-800 py-2">
                          ¥{previewInvoiceData.amount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between items-end">
                  <div className="w-20 h-20 border border-gray-200 rounded flex items-center justify-center bg-gray-50">
                    <QrCode className="w-14 h-14 text-gray-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">价税合计</p>
                    <p className="text-lg font-bold text-gov-navy font-mono">
                      ¥{previewInvoiceData.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-center mt-4 text-[10px] text-gray-400">
                  <p>本发票由电子税务局开具，可登录官网查验真伪</p>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="flex-1 gov-btn-outline text-sm py-2"
                >
                  关闭
                </button>
                <button className="flex-1 gov-btn-primary flex items-center justify-center gap-2 text-sm py-2">
                  <Download className="w-4 h-4" />
                  下载发票
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedVoucher && selectedVoucherId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">凭证详情</h3>
              <button
                onClick={() => setSelectedVoucherId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="border-2 border-gov-red/20 rounded-lg p-6 bg-gradient-to-b from-red-50/30 to-white">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gov-red/10 flex items-center justify-center mb-2">
                    <Ticket className="w-6 h-6 text-gov-red" />
                  </div>
                  <h2 className="text-lg font-bold text-gov-navy">深圳市非税收入缴款凭证</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    凭证编号：{selectedVoucher.voucherNo}
                  </p>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 w-24">项目名称</span>
                    <span className="text-gray-800 text-right flex-1">{selectedVoucher.itemName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 w-24">项目编码</span>
                    <span className="font-mono text-gray-800">{selectedVoucher.itemCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 w-24">缴款人</span>
                    <span className="text-gray-800">{selectedVoucher.payerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 w-24">证件号码</span>
                    <span className="font-mono text-gray-800">{selectedVoucher.payerIdNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 w-24">执收单位</span>
                    <span className="text-gray-800">{selectedVoucher.issuingAuthority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 w-24">开具日期</span>
                    <span className="text-gray-800">{selectedVoucher.issueDate}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 mt-4 pt-4">
                  <div className="flex items-center justify-between bg-gold-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">缴款金额（大写）</span>
                    <span className="font-mono text-xl font-bold text-gold-600">
                      ¥{selectedVoucher.amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between items-center">
                  <div className="text-center">
                    <div className="w-24 h-24 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">扫码查验</p>
                  </div>
                  <div className="text-right text-xs space-y-1">
                    <p className="text-gray-500">校验码</p>
                    <p className="font-mono text-gray-800">{selectedVoucher.verifyCode}</p>
                    <p className="text-gray-400 mt-2">
                      状态：
                      <span
                        className={cn(
                          selectedVoucher.status === 'valid' ? 'text-green-600' : 'text-red-500'
                        )}
                      >
                        {selectedVoucher.status === 'valid' ? '有效' : '无效'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-center mt-4 pt-4 border-t border-dashed border-gray-200 text-[10px] text-gray-400">
                  <p>本凭证由深圳市财政局监制，与纸质凭证具有同等法律效力</p>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setSelectedVoucherId(null)}
                  className="flex-1 gov-btn-outline text-sm py-2"
                >
                  关闭
                </button>
                <button className="flex-1 gov-btn-primary flex items-center justify-center gap-2 text-sm py-2">
                  <Download className="w-4 h-4" />
                  下载凭证
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
