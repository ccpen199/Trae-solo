import { useState } from 'react'
import { Package, Factory, Calendar, Wallet, FileCheck, Truck, CheckCircle2 } from 'lucide-react'
import type { Inquiry } from '@/store'
import { useStore } from '@/store'

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  sent: { bg: 'bg-navy-100', text: 'text-navy-500', label: '已发送' },
  replied: { bg: 'bg-navy-100', text: 'text-navy-500', label: '已回复' },
  quoted: { bg: 'bg-blue-100', text: 'text-blue-600', label: '已报价' },
  sample_requested: { bg: 'bg-amber-100', text: 'text-amber-600', label: '样品申请中' },
  sample_shipped: { bg: 'bg-teal-100', text: 'text-teal-600', label: '样品已发出' },
  inspection_scheduled: { bg: 'bg-purple-100', text: 'text-purple-600', label: '验厂已预约' },
  inspection_completed: { bg: 'bg-purple-100', text: 'text-purple-600', label: '验厂已完成' },
  deposit_pending: { bg: 'bg-amber-100', text: 'text-amber-600', label: '待付定金' },
  deposit_paid: { bg: 'bg-amber-100', text: 'text-amber-700', label: '定金已付' },
  closed: { bg: 'bg-navy-200', text: 'text-navy-600', label: '已关闭' },
}

const sampleStatusLabels: Record<string, string> = {
  none: '未申请',
  requested: '已申请',
  shipped: '已发出',
  received: '已签收',
}

interface InquiryCardProps {
  inquiry: Inquiry
}

export default function InquiryCard({ inquiry }: InquiryCardProps) {
  const requestSample = useStore((s) => s.requestSample)
  const scheduleInspection = useStore((s) => s.scheduleInspection)
  const payDeposit = useStore((s) => s.payDeposit)
  const updateInquiryStatus = useStore((s) => s.updateInquiryStatus)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [inspectionDate, setInspectionDate] = useState('')
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')

  const status = statusStyles[inquiry.status] || statusStyles.sent
  const minQuote = inquiry.bomSupplierQuotes?.length
    ? Math.min(...inquiry.bomSupplierQuotes.map((q) => q.totalQuote))
    : 0

  const handlePayDeposit = () => {
    const amt = parseFloat(depositAmount)
    if (amt > 0) {
      payDeposit(inquiry.id, amt)
      setShowDepositModal(false)
      setDepositAmount('')
    }
  }

  const handleScheduleInspection = () => {
    if (inspectionDate) {
      scheduleInspection(inquiry.id, inspectionDate)
      setShowDatePicker(false)
      setInspectionDate('')
    }
  }

  const canRequestSample = ['quoted'].includes(inquiry.status)
  const canScheduleInspection = ['sample_requested', 'sample_shipped'].includes(inquiry.status)
  const canPayDeposit = ['quoted', 'sample_requested', 'sample_shipped', 'inspection_scheduled', 'inspection_completed'].includes(inquiry.status)
  const canClose = !['closed', 'deposit_paid'].includes(inquiry.status)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-navy-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-navy-50 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-navy-800 truncate">{inquiry.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} shrink-0`}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-navy-400">{inquiry.id} · 创建于 {inquiry.createdAt.slice(0, 10)}</p>
        </div>
      </div>

      <div className="px-5 py-3 grid grid-cols-4 gap-3 bg-surface/40 border-b border-navy-50">
        <div className="flex items-center gap-2">
          <Factory size={14} className="text-navy-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-navy-400">目标供应商</p>
            <p className="text-xs font-medium text-navy-700 truncate">{inquiry.toSupplierName || inquiry.toSupplierId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Package size={14} className="text-navy-400 shrink-0" />
          <div>
            <p className="text-[10px] text-navy-400">数量</p>
            <p className="text-xs font-medium text-navy-700">{inquiry.quantity.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wallet size={14} className="text-navy-400 shrink-0" />
          <div>
            <p className="text-[10px] text-navy-400">预算范围</p>
            <p className="text-xs font-medium text-navy-700">¥{inquiry.budget.min.toLocaleString()} ~ ¥{inquiry.budget.max.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-navy-400 shrink-0" />
          <div>
            <p className="text-[10px] text-navy-400">期望交期</p>
            <p className="text-xs font-medium text-navy-700">{inquiry.deliveryDate}</p>
          </div>
        </div>
      </div>

      {inquiry.timeline && inquiry.timeline.length > 0 && (
        <div className="px-5 py-4 border-b border-navy-50">
          <h4 className="text-xs font-medium text-navy-500 mb-3">流程进度</h4>
          <div className="flex items-start justify-between gap-1">
            {inquiry.timeline.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center text-center min-w-0">
                <div className="relative w-full flex items-center justify-center">
                  {i < inquiry.timeline!.length - 1 && (
                    <div className={`absolute left-1/2 right-[-50%] top-1/2 h-0.5 -translate-y-1/2 ${
                      t.status === 'done' ? 'bg-teal-400' : 'bg-navy-100'
                    }`} />
                  )}
                  <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                    t.status === 'done'
                      ? 'bg-teal-400 border-teal-400'
                      : t.status === 'current'
                      ? 'bg-amber-400 border-amber-400 animate-pulse-slow'
                      : 'bg-white border-navy-200'
                  }`}>
                    {t.status === 'done' && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </div>
                <p className={`mt-2 text-[10px] font-medium ${
                  t.status === 'pending' ? 'text-navy-300' : 'text-navy-600'
                }`}>{t.step}</p>
                {t.time && <p className="text-[9px] text-navy-400 mt-0.5">{t.time}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {inquiry.bomSupplierQuotes && inquiry.bomSupplierQuotes.length > 0 && (
        <div className="px-5 py-4 border-b border-navy-50">
          <h4 className="text-xs font-medium text-navy-500 mb-3 flex items-center gap-1.5">
            <FileCheck size={12} />BOM 比价对比
          </h4>
          <div className="overflow-x-auto rounded-lg border border-navy-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-navy-50 text-navy-400">
                  <th className="px-3 py-2 text-left font-medium">供应商</th>
                  {inquiry.bomItems?.map((b, i) => (
                    <th key={i} className="px-3 py-2 text-right font-medium">{b.name}</th>
                  ))}
                  <th className="px-3 py-2 text-right font-medium">总价</th>
                </tr>
              </thead>
              <tbody>
                {inquiry.bomSupplierQuotes.map((q, qi) => {
                  const isLowest = q.totalQuote === minQuote
                  return (
                    <tr key={qi} className={`border-t border-navy-50 ${isLowest ? 'bg-teal-50/60' : ''}`}>
                      <td className={`px-3 py-2 font-medium ${isLowest ? 'text-teal-700' : 'text-navy-700'}`}>
                        {q.supplierName}
                        {isLowest && <span className="ml-1 text-[9px] text-teal-600">✓ 最优</span>}
                      </td>
                      {inquiry.bomItems?.map((b, bi) => {
                        const item = q.items.find((it) => it.name === b.name)
                        return (
                          <td key={bi} className={`px-3 py-2 text-right ${isLowest ? 'text-teal-700' : 'text-navy-600'}`}>
                            ¥{item?.unitPrice.toFixed(2) || '-'}
                          </td>
                        )
                      })}
                      <td className={`px-3 py-2 text-right font-semibold ${isLowest ? 'text-teal-700' : 'text-navy-700'}`}>
                        ¥{q.totalQuote.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inquiry.sampleShipping && inquiry.sampleShipping.status !== 'none' && (
        <div className="px-5 py-4 border-b border-navy-50">
          <h4 className="text-xs font-medium text-navy-500 mb-3 flex items-center gap-1.5">
            <Truck size={12} />样品寄送
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
              inquiry.sampleShipping.status === 'shipped' ? 'bg-teal-100 text-teal-700' :
              inquiry.sampleShipping.status === 'received' ? 'bg-teal-100 text-teal-700' :
              'bg-amber-100 text-amber-700'
            }`}>{sampleStatusLabels[inquiry.sampleShipping.status]}</span>
          </h4>
          {inquiry.sampleShipping.logistics && inquiry.sampleShipping.logistics.length > 0 ? (
            <div className="relative pl-5">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-navy-100" />
              {inquiry.sampleShipping.logistics.map((l, i) => (
                <div key={i} className="relative mb-2.5 last:mb-0">
                  <div className={`absolute -left-4 top-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                    i === inquiry.sampleShipping!.logistics!.length - 1
                      ? 'border-teal-400 bg-teal-400'
                      : 'border-navy-300 bg-white'
                  }`} />
                  <p className="text-xs font-medium text-navy-700">{l.status}</p>
                  <p className="text-[10px] text-navy-400">{l.time} · {l.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-navy-400">暂无物流信息</p>
          )}
        </div>
      )}

      {inquiry.inspection && inquiry.inspection.scheduled && (
        <div className="px-5 py-4 border-b border-navy-50">
          <h4 className="text-xs font-medium text-navy-500 mb-2 flex items-center gap-1.5">
            <FileCheck size={12} />在线验厂
          </h4>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-navy-400">预约日期：</span>
            <span className="font-medium text-navy-700">{inquiry.inspection.date || '-'}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              inquiry.inspection.completed ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
            }`}>{inquiry.inspection.completed ? '已完成' : '待进行'}</span>
            {inquiry.inspection.completed && inquiry.inspection.reportUrl && (
              <a href={inquiry.inspection.reportUrl} className="text-teal-600 hover:underline">查看报告</a>
            )}
          </div>
        </div>
      )}

      {inquiry.deposit && inquiry.deposit.status !== 'none' && (
        <div className="px-5 py-4 border-b border-navy-50">
          <h4 className="text-xs font-medium text-navy-500 mb-2 flex items-center gap-1.5">
            <Wallet size={12} />定金担保
          </h4>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-navy-400">金额：</span>
            <span className="font-semibold text-amber-700">¥{inquiry.deposit.amount.toLocaleString()}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              inquiry.deposit.status === 'paid' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
            }`}>{inquiry.deposit.status === 'paid' ? '已支付' : inquiry.deposit.status === 'pending' ? '待支付' : '已退款'}</span>
            {inquiry.deposit.paidDate && <span className="text-navy-400">支付于 {inquiry.deposit.paidDate}</span>}
          </div>
        </div>
      )}

      <div className="px-5 py-3 flex items-center justify-end gap-2 bg-surface/30">
        {canRequestSample && (
          <button
            onClick={() => requestSample(inquiry.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500 text-white hover:bg-teal-600 transition-colors"
          >请求样品</button>
        )}
        {canScheduleInspection && !showDatePicker && (
          <button
            onClick={() => setShowDatePicker(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
          >预约验厂</button>
        )}
        {showDatePicker && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="px-2 py-1 rounded border border-navy-200 text-xs"
            />
            <button onClick={handleScheduleInspection} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500 text-white">确认</button>
            <button onClick={() => setShowDatePicker(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-navy-400 hover:text-navy-600">取消</button>
          </div>
        )}
        {canPayDeposit && !showDepositModal && (
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >支付定金</button>
        )}
        {showDepositModal && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="定金金额"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="px-2 py-1 rounded border border-navy-200 text-xs w-28"
            />
            <button onClick={handlePayDeposit} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white">确认支付</button>
            <button onClick={() => setShowDepositModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-navy-400 hover:text-navy-600">取消</button>
          </div>
        )}
        {canClose && (
          <button
            onClick={() => updateInquiryStatus(inquiry.id, 'closed')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-navy-500 border border-navy-200 hover:bg-navy-50 transition-colors"
          >关闭询价</button>
        )}
      </div>
    </div>
  )
}
