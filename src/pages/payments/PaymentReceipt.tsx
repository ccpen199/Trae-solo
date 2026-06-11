import { Printer, Download } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

export default function PaymentReceipt() {
  const receipt = {
    receiptNo: 'RCT-20260610-001',
    payerName: '张三',
    item: '物业费 - 2026年6月',
    amount: 1280.00,
    date: '2026年06月10日',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="电子收据"
        actions={
          <div className="flex gap-3">
            <button className="h-9 px-4 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              <Printer size={16} />打印
            </button>
            <button className="h-9 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
              <Download size={16} />下载
            </button>
          </div>
        }
      />

      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8 relative">
              <h2 className="text-2xl font-bold text-slate-800">收 据</h2>
              <div className="absolute top-0 right-0">
                <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center transform rotate-[-15deg] opacity-70">
                  <span className="text-red-500 text-[10px] font-bold text-center leading-tight">阳光花园<br/>物业专用</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-6 text-sm text-slate-500">
              <div className="flex justify-between">
                <span>收据编号</span>
                <span className="font-mono text-slate-700">{receipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span>开据日期</span>
                <span className="text-slate-700">{receipt.date}</span>
              </div>
            </div>

            <div className="border-t border-b border-slate-200 py-6 my-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">缴款人</span>
                  <span className="text-base font-medium text-slate-800">{receipt.payerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">缴费项目</span>
                  <span className="text-base font-medium text-slate-800">{receipt.item}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">金额</span>
                  <span className="text-2xl font-bold text-emerald-600">¥{receipt.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <div className="w-32 h-32 mx-auto bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center mb-3">
                <div className="text-xs text-slate-400 text-center">二维码<br/>占位区域</div>
              </div>
              <p className="text-xs text-slate-400">扫码验证收据真伪</p>
            </div>
          </div>

          <div className="bg-slate-50 px-8 py-4 text-center">
            <p className="text-xs text-slate-400">本收据加盖电子印章后有效 · 阳光花园社区物业服务中心</p>
          </div>
        </div>
      </div>
    </div>
  )
}
