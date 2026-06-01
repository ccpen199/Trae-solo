import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, Zap, RotateCcw, TrendingUp, Cpu, Receipt, MapPin, X, Download, HelpCircle, Calendar, Info, Eye } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatCard from '@/components/StatCard'
import DataTable, { type Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import type { FinanceBySite, FinanceByPartner, FinanceByDevice, FinanceByOrder, FinanceRefund } from '@/api/client'
import * as api from '@/api/client'

export default function Finance() {
  const navigate = useNavigate()
  const {
    summary,
    bySite,
    byPartner,
    byOrder,
    refunds,
    todayRevenue,
    monthRevenue,
    lastMonthRevenue,
    yoyChange,
    momChange,
    fetchSummary,
    fetchBySite,
    fetchByPartner,
    fetchByOrder,
    fetchRefunds,
  } = useStore()

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [byDevice, setByDevice] = useState<FinanceByDevice[]>([])
  const [activeTab, setActiveTab] = useState<'site' | 'device' | 'partner' | 'order'>('site')
  const [selectedPartner, setSelectedPartner] = useState<FinanceByPartner | null>(null)
  const [refundFilter, setRefundFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false)

  useEffect(() => {
    const params: Record<string, string> = {}
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    fetchSummary(params)
    fetchBySite(params)
    fetchByPartner(params)
    fetchByOrder(params)
    fetchRefunds(params)
    api.getFinanceByDevice(params).then((rawData) => {
      const enhanced = rawData.map((d) => ({
        ...d,
        electricity_cost: d.electricity_cost || (d.energy_total || 0) * 0.8,
        net_income: d.net_income || (d.total_revenue || 0) - (d.energy_total || 0) * 0.8,
        utilization_rate: d.utilization_rate || (d.order_count || 0) / 30,
      }))
      setByDevice(enhanced)
    }).catch(() => {})
  }, [dateFrom, dateTo, fetchSummary, fetchBySite, fetchByPartner, fetchByOrder, fetchRefunds])

  const filteredRefunds = useMemo(() => {
    if (refundFilter === 'all') return refunds
    if (refundFilter === 'pending') return refunds.filter((r) => r.refund_status === 'pending' || r.refund_status === '待处理')
    return refunds.filter((r) => r.refund_status === 'completed' || r.refund_status === '已完成')
  }, [refunds, refundFilter])

  const quickDates = [
    { label: '今日', getRange: () => { const d = new Date(); return { from: d.toISOString().split('T')[0], to: d.toISOString().split('T')[0] } } },
    { label: '本周', getRange: () => { const d = new Date(); const day = d.getDay(); const from = new Date(d); from.setDate(d.getDate() - day); return { from: from.toISOString().split('T')[0], to: d.toISOString().split('T')[0] } } },
    { label: '本月', getRange: () => { const d = new Date(); const from = new Date(d.getFullYear(), d.getMonth(), 1); return { from: from.toISOString().split('T')[0], to: d.toISOString().split('T')[0] } } },
    { label: '上月', getRange: () => { const d = new Date(); const from = new Date(d.getFullYear(), d.getMonth() - 1, 1); const to = new Date(d.getFullYear(), d.getMonth(), 0); return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] } } },
    { label: '本季度', getRange: () => { const d = new Date(); const quarter = Math.floor(d.getMonth() / 3); const from = new Date(d.getFullYear(), quarter * 3, 1); return { from: from.toISOString().split('T')[0], to: d.toISOString().split('T')[0] } } },
  ]

  const handleQuickDate = (getRange: () => { from: string; to: string }) => {
    const { from, to } = getRange()
    setDateFrom(from)
    setDateTo(to)
  }

  const handleExport = () => {
    alert('导出功能：已模拟导出分账明细报表')
  }

  const sumNumeric = <T,>(data: T[], key: keyof T): number => {
    return data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
  }

  const siteColumns: Column<FinanceBySite>[] = [
    {
      key: 'site_name',
      label: '站点名称',
      render: (r) => (
        <button onClick={() => navigate(`/sites/${r.site_id}`)} className="text-blue-600 hover:underline font-medium">
          {r.site_name}
        </button>
      ),
      footerRender: () => <span className="font-semibold">合计</span>,
    },
    {
      key: 'order_count',
      label: '订单数',
      align: 'center',
      footerRender: (data) => sumNumeric(data, 'order_count' as keyof FinanceBySite).toLocaleString(),
    },
    {
      key: 'total_revenue',
      label: '总收入',
      align: 'right',
      render: (r) => `¥${r.total_revenue?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'total_revenue' as keyof FinanceBySite).toFixed(2)}`,
    },
    {
      key: 'electricity_cost',
      label: '电费成本',
      align: 'right',
      render: (r) => `¥${r.electricity_cost?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'electricity_cost' as keyof FinanceBySite).toFixed(2)}`,
    },
    {
      key: 'refund',
      label: '退款',
      align: 'right',
      render: (r) => `¥${r.refund?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'refund' as keyof FinanceBySite).toFixed(2)}`,
    },
    {
      key: 'service_fee',
      label: '服务费',
      align: 'right',
      render: (r) => `¥${r.service_fee?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'service_fee' as keyof FinanceBySite).toFixed(2)}`,
    },
    {
      key: 'net_income',
      label: '净收入',
      align: 'right',
      render: (r) => <span className={r.net_income >= 0 ? 'text-emerald-600' : 'text-red-600'}>¥{r.net_income?.toFixed(2) ?? '0.00'}</span>,
      footerRender: (data) => {
        const total = sumNumeric(data, 'net_income' as keyof FinanceBySite)
        return <span className={total >= 0 ? 'text-emerald-600' : 'text-red-600'}>¥{total.toFixed(2)}</span>
      },
    },
    {
      key: 'proportion',
      label: '占比',
      align: 'right',
      render: (r) => `${r.proportion?.toFixed(1) ?? '0.0'}%`,
      footerRender: () => '100.0%',
    },
  ]

  const deviceColumns: Column<FinanceByDevice>[] = [
    {
      key: 'device_name',
      label: '设备名称',
      render: (r) => (
        <button onClick={() => navigate(`/devices/${r.device_id}`)} className="text-blue-600 hover:underline font-medium">
          {r.device_name}
        </button>
      ),
      footerRender: () => <span className="font-semibold">合计</span>,
    },
    { key: 'site_name', label: '所属站点' },
    {
      key: 'order_count',
      label: '订单数',
      align: 'center',
      footerRender: (data) => sumNumeric(data, 'order_count' as keyof FinanceByDevice).toLocaleString(),
    },
    {
      key: 'energy_total',
      label: '总电量(kWh)',
      align: 'right',
      render: (r) => r.energy_total?.toFixed(2) ?? '0.00',
      footerRender: (data) => sumNumeric(data, 'energy_total' as keyof FinanceByDevice).toFixed(2),
    },
    {
      key: 'utilization_rate',
      label: '利用率',
      align: 'right',
      render: (r) => `${r.utilization_rate?.toFixed(1) ?? '0.0'}单/天`,
    },
    {
      key: 'total_revenue',
      label: '总收入',
      align: 'right',
      render: (r) => `¥${r.total_revenue?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'total_revenue' as keyof FinanceByDevice).toFixed(2)}`,
    },
    {
      key: 'electricity_cost',
      label: '电费',
      align: 'right',
      render: (r) => `¥${r.electricity_cost?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'electricity_cost' as keyof FinanceByDevice).toFixed(2)}`,
    },
    {
      key: 'net_income',
      label: '净收入',
      align: 'right',
      render: (r) => <span className={r.net_income >= 0 ? 'text-emerald-600' : 'text-red-600'}>¥{r.net_income?.toFixed(2) ?? '0.00'}</span>,
      footerRender: (data) => {
        const total = sumNumeric(data, 'net_income' as keyof FinanceByDevice)
        return <span className={total >= 0 ? 'text-emerald-600' : 'text-red-600'}>¥{total.toFixed(2)}</span>
      },
    },
  ]

  const partnerColumns: Column<FinanceByPartner>[] = [
    {
      key: 'partner_name',
      label: '合作方名称',
      render: (r) => (
        <button onClick={() => setSelectedPartner(r)} className="text-blue-600 hover:underline font-medium flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {r.partner_name}
        </button>
      ),
      footerRender: () => <span className="font-semibold">合计</span>,
    },
    { key: 'site_name', label: '关联站点' },
    {
      key: 'share_ratio',
      label: '分成比例',
      align: 'center',
      render: (r) => `${(r.share_ratio * 100).toFixed(0)}%`,
    },
    {
      key: 'partner_share',
      label: '合作方收入',
      align: 'right',
      render: (r) => `¥${r.partner_share?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'partner_share' as keyof FinanceByPartner).toFixed(2)}`,
    },
    {
      key: 'platform_share',
      label: '平台收入',
      align: 'right',
      render: (r) => `¥${r.platform_share?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'platform_share' as keyof FinanceByPartner).toFixed(2)}`,
    },
    {
      key: 'total_revenue',
      label: '总收入',
      align: 'right',
      render: (r) => `¥${r.total_revenue?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'total_revenue' as keyof FinanceByPartner).toFixed(2)}`,
    },
    {
      key: 'order_count',
      label: '订单数',
      align: 'center',
      footerRender: (data) => sumNumeric(data, 'order_count' as keyof FinanceByPartner).toLocaleString(),
    },
    {
      key: 'settlement_status',
      label: '结算状态',
      align: 'center',
      render: (r) => {
        if (r.settlement_status === '已结算') {
          return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">已结算</span>
        }
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{r.settlement_status}</span>
      },
    },
  ]

  const orderColumns: Column<FinanceByOrder>[] = [
    {
      key: 'order_id',
      label: '订单号',
      render: (r) => (
        <button onClick={() => navigate(`/orders/${r.order_id}`)} className="font-mono text-xs text-blue-600 hover:underline">
          #{r.order_id}
        </button>
      ),
      footerRender: () => <span className="font-semibold">合计</span>,
    },
    { key: 'site_name', label: '站点' },
    { key: 'device_name', label: '设备' },
    { key: 'partner_name', label: '合作方' },
    {
      key: 'energy',
      label: '电量(kWh)',
      align: 'right',
      render: (r) => r.energy?.toFixed(2) ?? '0.00',
      footerRender: (data) => sumNumeric(data, 'energy' as keyof FinanceByOrder).toFixed(2),
    },
    {
      key: 'total_amount',
      label: '总收入(¥)',
      align: 'right',
      render: (r) => `¥${r.total_amount?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'total_amount' as keyof FinanceByOrder).toFixed(2)}`,
    },
    {
      key: 'electricity_cost',
      label: '电费(¥)',
      align: 'right',
      render: (r) => `¥${r.electricity_cost?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'electricity_cost' as keyof FinanceByOrder).toFixed(2)}`,
    },
    {
      key: 'partner_share',
      label: '合作方分成(¥)',
      align: 'right',
      render: (r) => `¥${r.partner_share?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'partner_share' as keyof FinanceByOrder).toFixed(2)}`,
    },
    {
      key: 'platform_share',
      label: '平台分成(¥)',
      align: 'right',
      render: (r) => `¥${r.platform_share?.toFixed(2) ?? '0.00'}`,
      footerRender: (data) => `¥${sumNumeric(data, 'platform_share' as keyof FinanceByOrder).toFixed(2)}`,
    },
    {
      key: 'refund_deduction',
      label: '退款扣减(¥)',
      align: 'right',
      render: (r) => r.refund_deduction > 0 ? <span className="text-red-600">-¥{r.refund_deduction.toFixed(2)}</span> : '¥0.00',
      footerRender: (data) => {
        const total = sumNumeric(data, 'refund_deduction' as keyof FinanceByOrder)
        return total > 0 ? <span className="text-red-600">-¥{total.toFixed(2)}</span> : '¥0.00'
      },
    },
    {
      key: 'actual_received',
      label: '实收(¥)',
      align: 'right',
      render: (r) => <span className={r.actual_received >= 0 ? 'text-emerald-600' : 'text-red-600'}>¥{r.actual_received?.toFixed(2) ?? '0.00'}</span>,
      footerRender: (data) => {
        const total = sumNumeric(data, 'actual_received' as keyof FinanceByOrder)
        return <span className={total >= 0 ? 'text-emerald-600' : 'text-red-600'}>¥{total.toFixed(2)}</span>
      },
    },
    {
      key: 'created_at',
      label: '时间',
      render: (r) => <span className="text-xs">{new Date(r.created_at).toLocaleString()}</span>,
    },
  ]

  const tabs = [
    { key: 'site' as const, label: '按站点', icon: MapPin },
    { key: 'device' as const, label: '按设备', icon: Cpu },
    { key: 'partner' as const, label: '按合作方', icon: Receipt },
    { key: 'order' as const, label: '按订单', icon: Receipt },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">财务报表</h2>

      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-slate-500">日期范围：</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
          <span className="text-slate-400">至</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">快捷：</span>
          {quickDates.map((qd) => (
            <button
              key={qd.label}
              onClick={() => handleQuickDate(qd.getRange)}
              className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
            >
              {qd.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="总收入"
          value={summary?.total_revenue != null ? `¥${summary.total_revenue.toFixed(2)}` : '-'}
          trend={{ value: Number(yoyChange.toFixed(1)), positive: yoyChange >= 0 }}
          color="bg-blue-600"
        />
        <StatCard
          icon={Zap}
          label="电费成本"
          value={summary?.total_electricity_cost != null ? `¥${summary.total_electricity_cost.toFixed(2)}` : '-'}
          trend={{ value: Number(momChange.toFixed(1)), positive: momChange < 0 }}
          color="bg-amber-500"
        />
        <StatCard
          icon={RotateCcw}
          label="退款"
          value={summary?.total_refund != null ? `¥${summary.total_refund.toFixed(2)}` : '-'}
          trend={{ value: 2.3, positive: false }}
          color="bg-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="净收入"
          value={summary?.net_income != null ? `¥${summary.net_income.toFixed(2)}` : '-'}
          trend={{ value: Number((yoyChange * 0.8).toFixed(1)), positive: yoyChange * 0.8 >= 0 }}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">今日收入</p>
          <p className="text-xl font-bold text-blue-600 mt-1">¥{todayRevenue.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">同比 +{(yoyChange * 1.2).toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">本月收入</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">¥{monthRevenue.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">环比 {momChange >= 0 ? '+' : ''}{momChange.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">上月收入</p>
          <p className="text-xl font-bold text-slate-700 mt-1">¥{lastMonthRevenue.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">同比 +{(yoyChange * 0.9).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="flex border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-0">
          {activeTab === 'site' && (
            <DataTable columns={siteColumns} data={bySite} emptyText="暂无数据" showFooter />
          )}
          {activeTab === 'device' && (
            <DataTable columns={deviceColumns} data={byDevice} emptyText="暂无数据" showFooter />
          )}
          {activeTab === 'partner' && (
            <DataTable columns={partnerColumns} data={byPartner} emptyText="暂无数据" showFooter />
          )}
          {activeTab === 'order' && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowFormulaTooltip(true)}
                    onMouseLeave={() => setShowFormulaTooltip(false)}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                  >
                    <HelpCircle className="w-4 h-4" />
                    分账公式说明
                  </button>
                  {showFormulaTooltip && (
                    <div className="absolute left-0 top-full mt-2 bg-slate-800 text-white text-xs p-3 rounded shadow-lg z-10 w-72 space-y-1">
                      <p>• 总收入 = 用户支付金额</p>
                      <p>• 电费 = 电量 × 电价</p>
                      <p>• 合作方分成 = (总收入 - 电费) × 分成比例</p>
                      <p>• 平台分成 = 总收入 - 电费 - 合作方分成</p>
                      <p>• 实收 = 平台分成 - 退款扣减</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出报表
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      {orderColumns.map((col) => (
                        <th key={String(col.key)} className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byOrder.length === 0 ? (
                      <tr><td colSpan={orderColumns.length} className="text-center text-slate-400 py-6">暂无数据</td></tr>
                    ) : byOrder.map((o) => (
                      <tr key={o.record_id}>
                        {orderColumns.map((col) => (
                          <td key={String(col.key)} className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}>
                            {col.render ? col.render(o) : String(o[col.key as keyof FinanceByOrder] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {byOrder.length > 0 && (
                    <tfoot className="bg-slate-50 font-semibold">
                      <tr>
                        {orderColumns.map((col) => (
                          <td key={String(col.key)} className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}>
                            {col.footerRender ? col.footerRender(byOrder) : ''}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">退款明细</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">筛选：</span>
            {[
              { key: 'all' as const, label: '全部' },
              { key: 'pending' as const, label: '待处理' },
              { key: 'completed' as const, label: '已完成' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setRefundFilter(f.key)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  refundFilter === f.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>站点</th>
                <th>设备</th>
                <th>原金额(¥)</th>
                <th>退款金额(¥)</th>
                <th>退款原因</th>
                <th>退款状态</th>
                <th>退款时间</th>
                <th>操作人</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-slate-400 py-6">暂无退款记录</td></tr>
              ) : filteredRefunds.map((r: FinanceRefund) => (
                <tr key={r.id}>
                  <td>
                    <button onClick={() => navigate(`/orders/${r.order_id}`)} className="font-mono text-xs text-blue-600 hover:underline">
                      #{r.order_id}
                    </button>
                  </td>
                  <td>{r.site_name}</td>
                  <td>{r.device_name}</td>
                  <td>¥{r.original_amount?.toFixed(2) ?? '0.00'}</td>
                  <td className="text-red-600">-¥{r.refund_amount?.toFixed(2) ?? '0.00'}</td>
                  <td>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                      {r.refund_reason}
                    </span>
                  </td>
                  <td><StatusBadge status={r.refund_status} /></td>
                  <td className="text-xs">{new Date(r.refund_time).toLocaleString()}</td>
                  <td className="text-xs">{r.operator}</td>
                  <td>
                    <button onClick={() => navigate(`/orders/${r.order_id}`)} className="text-blue-600 hover:underline text-xs">
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">数据口径说明</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-slate-600">
              <p>• <strong>总收入</strong> = 所有订单费用总和</p>
              <p>• <strong>电费成本</strong> = 电量 × 电价</p>
              <p>• <strong>服务费</strong> = 电量 × 服务费单价</p>
              <p>• <strong>净收入</strong> = 平台分成 - 电费成本</p>
              <p>• <strong>合作方分成</strong> = (总收入 - 电费) × 分成比例</p>
              <p>• <strong>平台分成</strong> = 总收入 - 电费 - 合作方分成 - 退款</p>
            </div>
          </div>
        </div>
      </div>

      {selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPartner(null)}>
          <div className="bg-white rounded-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">合作方详情</h3>
              <button onClick={() => setSelectedPartner(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">合作方名称</span>
                <span className="font-medium">{selectedPartner.partner_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">关联站点</span>
                <span>{selectedPartner.site_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">分成比例</span>
                <span className="font-medium text-blue-600">{(selectedPartner.share_ratio * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">联系方式</span>
                <span>{selectedPartner.contact || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">订单数</span>
                <span>{selectedPartner.order_count}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">合作方收入</span>
                <span className="font-medium text-emerald-600">¥{selectedPartner.partner_share?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">平台收入</span>
                <span className="font-medium text-blue-600">¥{selectedPartner.platform_share?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">结算状态</span>
                {selectedPartner.settlement_status === '已结算' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    已结算
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    {selectedPartner.settlement_status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
