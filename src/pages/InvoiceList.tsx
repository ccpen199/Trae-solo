import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt,
  FileText,
  Building2,
  Truck,
  ChevronRight,
  Filter,
  Building,
  QrCode,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { requestRaw } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'

interface InvoiceItem {
  id: string
  invoice_no: string
  invoice_code: string
  amount: number
  tax_rate: number
  tax_amount: number
  status: string
  waybill_no: string
  company_name: string
  tax_no: string
  issued_at: string
  created_at: string
}

type TabKey = 'all' | 'pending' | 'issued' | 'void'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待开' },
  { key: 'issued', label: '已开' },
  { key: 'void', label: '作废' },
]

const statusMap: Record<
  string,
  { variant: 'success' | 'warning' | 'error' | 'info'; label: string; color: string }
> = {
  pending: { variant: 'warning', label: '待开票', color: 'border-l-amber-400' },
  issued: { variant: 'success', label: '已开票', color: 'border-l-mint-400' },
  void: { variant: 'error', label: '已作废', color: 'border-l-coral-400' },
}

export default function InvoiceList() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadInvoices()
  }, [activeTab])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = '/api/invoices?pageSize=100'
      if (activeTab === 'pending') url += '&status=pending'
      if (activeTab === 'issued') url += '&status=issued'
      if (activeTab === 'void') url += '&status=void'
      const res = await requestRaw<{
        success: boolean
        list: InvoiceItem[]
        total: number
      }>(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      setInvoices(res.list || [])
      setTotal(res.total || 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const totalTax = invoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0)

  return (
    <div>
      <PageHeader
        title="发票管理"
        action={
          user?.role === 'shipper'
            ? {
                label: '开票主体',
                icon: Building2,
                onClick: () => navigate('/invoices/entity'),
              }
            : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-navy-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">发票数量</p>
              <p className="text-xl font-bold text-navy-500">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">金额合计</p>
              <p className="text-xl font-bold text-amber-500">
                ¥{totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-mint-50 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-mint-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">税额合计</p>
              <p className="text-xl font-bold text-mint-600">¥{totalTax.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">状态筛选</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center py-8 text-gray-400">加载中...</div>}

      <div className="space-y-3">
        {!loading && invoices.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>暂无发票记录</p>
          </div>
        )}
        {invoices.map((invoice) => {
          const s = statusMap[invoice.status] || statusMap.pending
          return (
            <div
              key={invoice.id}
              onClick={() => navigate(`/invoices/${invoice.id}`)}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${s.color} p-4 hover:shadow-md cursor-pointer transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="h-8 w-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                      <Receipt className="h-4 w-4 text-navy-500" />
                    </div>
                    <span className="text-base font-semibold text-gray-900">
                      {invoice.invoice_no || '待生成'}
                    </span>
                    {invoice.invoice_code && (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                        代码 {invoice.invoice_code}
                      </span>
                    )}
                    <StatusBadge variant={s.variant}>{s.label}</StatusBadge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Building className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{invoice.company_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Truck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">运单号：{invoice.waybill_no}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4 flex flex-col items-end gap-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">金额</p>
                    <p className="text-lg font-bold text-navy-500">
                      ¥{invoice.amount?.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>税率 {(invoice.tax_rate * 100).toFixed(0)}%</span>
                    <span className="text-mint-600 font-medium">
                      税 ¥{invoice.tax_amount?.toFixed(2)}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 mt-1" />
                </div>
              </div>

              {invoice.issued_at && (
                <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                  开票时间：{invoice.issued_at}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
