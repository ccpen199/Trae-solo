import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Truck,
  QrCode,
  Building2,
  CreditCard,
  Phone,
  Hash,
  FileText,
  Calendar,
  User,
  AlertCircle,
  Download,
  Share2,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { requestRaw } from '@/utils/api'

interface InvoiceDetailData {
  id: string
  order_id: string
  invoice_entity_id: string
  invoice_no: string
  invoice_code: string
  amount: number
  tax_rate: number
  tax_amount: number
  status: string
  issued_at: string
  created_at: string
  waybill_no: string
  origin: string
  destination: string
  total_fee: number
  driver_id: string
  shipper_id: string
  company_name: string
  tax_no: string
  address: string
  phone: string
  bank_name: string
  bank_account: string
  driver_name: string
  shipper_name: string
}

const statusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  pending: { variant: 'warning', label: '待开票' },
  issued: { variant: 'success', label: '已开票' },
  void: { variant: 'error', label: '已作废' },
}

export default function InvoiceDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    loadInvoice()
  }, [id])

  const loadInvoice = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await requestRaw<{ success: boolean; data: InvoiceDetailData }>(
        `/api/invoices/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      setInvoice(res.data)
    } catch (e: any) {
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-gray-400">加载中...</div>
  }

  if (error && !invoice) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-coral-400" />
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors"
        >
          返回
        </button>
      </div>
    )
  }

  if (!invoice) {
    return <div className="text-center py-16 text-gray-400">发票不存在</div>
  }

  const s = statusMap[invoice.status] || statusMap.pending
  const priceTotal = invoice.amount || 0
  const taxTotal = invoice.tax_amount || 0
  const grandTotal = priceTotal + taxTotal
  const goodsName = `货物运输服务（${invoice.origin}至${invoice.destination}）`

  const numberToChinese = (num: number): string => {
    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
    const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿']
    const decimals = ['角', '分']
    let result = ''
    const intPart = Math.floor(num)
    const decPart = Math.round((num - intPart) * 100)

    if (intPart === 0) {
      result = '零'
    } else {
      const intStr = intPart.toString()
      for (let i = 0; i < intStr.length; i++) {
        const d = parseInt(intStr[i])
        const u = intStr.length - 1 - i
        if (d !== 0) {
          result += digits[d] + units[u]
        } else if (result && !result.endsWith('零')) {
          result += '零'
        }
      }
      result = result.replace(/零+$/, '') + '元'
    }

    if (decPart === 0) {
      result += '整'
    } else {
      const jiao = Math.floor(decPart / 10)
      const fen = decPart % 10
      if (jiao > 0) result += digits[jiao] + decimals[0]
      if (fen > 0) result += digits[fen] + decimals[1]
    }

    return result
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-navy-500">发票详情</h1>
            <p className="text-sm text-gray-500">增值税专用发票</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4 text-gray-500" />
          </button>
          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Share2 className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">发票代码：</span>
                <span className="text-sm font-mono font-semibold text-navy-500">
                  {invoice.invoice_code || '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">发票号码：</span>
                <span className="text-sm font-mono font-semibold text-navy-500">
                  {invoice.invoice_no || '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">开票日期：</span>
                <span className="text-sm font-medium text-gray-700">
                  {invoice.issued_at ? invoice.issued_at.split('T')[0].replace(/-/g, '年').replace(/年(\d)$/, '年0$1').replace(/(\d{4})年(\d{2})年(\d{2})/, '$1年$2月$3日') : '-'}
                </span>
              </div>
            </div>
            <StatusBadge variant={s.variant}>{s.label}</StatusBadge>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-navy-500 to-navy-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-bold tracking-wider">增值税专用发票</h2>
                <p className="text-navy-200 text-xs mt-0.5">Value-Added Tax Special Invoice</p>
              </div>
              <div className="text-right">
                <p className="text-navy-200 text-xs">发票联次</p>
                <p className="text-white text-sm font-medium">第一联 记账联</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-7 w-7 rounded bg-navy-50 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-navy-500" />
                      </div>
                      <span className="text-xs font-semibold text-navy-500 bg-navy-50 px-2 py-0.5 rounded">
                        购 买 方
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="text-gray-400 w-16 flex-shrink-0">名称</span>
                        <span className="text-gray-800 font-medium break-all">
                          {invoice.shipper_name || invoice.company_name}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-400 w-16 flex-shrink-0">纳税人识别号</span>
                        <span className="text-gray-800 font-mono break-all">
                          {invoice.tax_no || '-'}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-400 w-16 flex-shrink-0">地址电话</span>
                        <span className="text-gray-800 break-all">
                          {invoice.address
                            ? `${invoice.address}${invoice.phone ? ` ${invoice.phone}` : ''}`
                            : '-'}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-400 w-16 flex-shrink-0">开户行及账号</span>
                        <span className="text-gray-800 font-mono break-all">
                          {invoice.bank_name
                            ? `${invoice.bank_name}${invoice.bank_account ? ` ${invoice.bank_account}` : ''}`
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-7 w-7 rounded bg-amber-100 flex items-center justify-center">
                        <Truck className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        销 售 方
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="text-gray-400 w-16 flex-shrink-0">名称</span>
                        <span className="text-gray-800 font-medium break-all">
                          运税通物流有限公司
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-400 w-16 flex-shrink-0">纳税人识别号</span>
                        <span className="text-gray-800 font-mono break-all">
                          91110105MA01234567
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-400 w-16 flex-shrink-0">地址电话</span>
                        <span className="text-gray-800 break-all">
                          北京市朝阳区建国路88号 010-88888888
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-400 w-16 flex-shrink-0">开户行及账号</span>
                        <span className="text-gray-800 font-mono break-all">
                          中国工商银行北京分行 0200123409008888888
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-navy-50 border-b border-gray-200">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-navy-500 w-10">
                          #
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-navy-500">
                          货物或应税劳务、服务名称
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-navy-500 w-20">
                          金额
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-navy-500 w-16">
                          税率
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-navy-500 w-24">
                          税额
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-gray-400 text-xs">1</td>
                        <td className="px-3 py-3">
                          <div className="text-gray-800 font-medium">{goodsName}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-gray-400">
                              运单号：{invoice.waybill_no}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-gray-800">
                          ¥{priceTotal.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-gray-700">
                          {(invoice.tax_rate * 100).toFixed(0)}%
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-mint-600 font-medium">
                          ¥{taxTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200 font-medium">
                        <td className="px-3 py-2.5 text-xs text-gray-500" colSpan={2}>
                          合 计
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-navy-500">
                          ¥{priceTotal.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5"></td>
                        <td className="px-3 py-2.5 text-right font-mono text-mint-600">
                          ¥{taxTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-1">价税合计（大写）</p>
                      <p className="text-base font-bold text-navy-500">
                        {numberToChinese(grandTotal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">（小写）</p>
                      <p className="text-2xl font-bold text-amber-500">¥{grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 bg-gray-50/50">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center justify-center gap-1.5">
                      <QrCode className="h-4 w-4" />
                      税控专用二维码
                    </p>
                    <div className="w-40 h-40 mx-auto bg-white rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
                      <div className="grid grid-cols-6 gap-0.5 w-32 h-32">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div
                            key={i}
                            className={`${
                              Math.random() > 0.4 ? 'bg-navy-500' : 'bg-white'
                            } rounded-sm`}
                          />
                        ))}
                      </div>
                      <div className="absolute top-1 left-1 w-6 h-6 border-2 border-navy-500 bg-white rounded-sm">
                        <div className="absolute inset-1 bg-navy-500 rounded-sm" />
                      </div>
                      <div className="absolute top-1 right-1 w-6 h-6 border-2 border-navy-500 bg-white rounded-sm">
                        <div className="absolute inset-1 bg-navy-500 rounded-sm" />
                      </div>
                      <div className="absolute bottom-1 left-1 w-6 h-6 border-2 border-navy-500 bg-white rounded-sm">
                        <div className="absolute inset-1 bg-navy-500 rounded-sm" />
                      </div>
                      <div className="absolute bottom-2 right-2 w-4 h-4 bg-amber-400 rounded-sm flex items-center justify-center">
                        <Truck className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3">
                      扫码查验发票真伪
                    </p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-navy-500" />
                    发票信息
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">校验码</span>
                      <span className="font-mono text-gray-600">
                        {invoice.invoice_code || '011002600311'}
                        {invoice.invoice_no || '00000000'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">密文区</span>
                      <span className="font-mono text-amber-600">已加密</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">开票类型</span>
                      <span className="text-gray-600">增值税专用发票</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-navy-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-navy-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">收款人</p>
                  <p className="text-sm font-medium text-gray-700">—</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">复核</p>
                  <p className="text-sm font-medium text-gray-700">系统自动</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-mint-50 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-mint-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">开票人</p>
                  <p className="text-sm font-medium text-gray-700">运税通</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-4 border-amber-300/70 flex items-center justify-center rotate-[-12deg]">
                  <div className="w-24 h-24 rounded-full border-2 border-amber-400/60 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-[9px] font-semibold text-amber-600 tracking-wider">
                        发票专用章
                      </p>
                      <p className="text-[7px] text-amber-500 mt-0.5">
                        INVOICE SEAL
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400/80 blur-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-500" />
            关联运单
          </h3>
          <div
            onClick={() => navigate(`/orders/${invoice.order_id}`)}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-gray-900">
                    {invoice.origin} → {invoice.destination}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>运单号：{invoice.waybill_no}</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {invoice.driver_name || '未指定'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">运单金额</p>
                <p className="text-lg font-bold text-amber-500">
                  ¥{invoice.total_fee?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
