import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getInvoices, createInvoice, redFlushInvoice, verifyInvoice } from '@/lib/api'
import { FileCheck, Plus, Search, X, Upload, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function Invoices() {
  const { currentTaxpayer } = useAppStore()
  const [invoices, setInvoices] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [verifyNo, setVerifyNo] = useState('')
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [form, setForm] = useState({
    taxpayer_id: '', invoice_type: 'agency', amount: '',
    buyer_name: '', buyer_code: '', seller_name: '', seller_code: '',
  })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (currentTaxpayer) setForm(f => ({ ...f, taxpayer_id: String(currentTaxpayer.id) })) }, [currentTaxpayer])

  async function loadData() {
    const res = await getInvoices()
    if (res.success && res.data) setInvoices(res.data as any[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('taxpayer_id', form.taxpayer_id)
    fd.append('invoice_type', form.invoice_type)
    fd.append('amount', form.amount)
    fd.append('buyer_name', form.buyer_name)
    fd.append('buyer_code', form.buyer_code)
    fd.append('seller_name', form.seller_name)
    fd.append('seller_code', form.seller_code)
    if (file) fd.append('attachment', file)
    const res = await createInvoice(fd)
    if (res.success) { setShowModal(false); loadData() }
  }

  async function handleRedFlush(id: number) {
    const res = await redFlushInvoice(id)
    if (res.success) loadData()
  }

  async function handleVerify() {
    const res = await verifyInvoice(verifyNo)
    if (res.success) setVerifyResult(res.data)
  }

  const typeLabels: Record<string, string> = { normal: '增值税普票', special: '增值税专票', agency: '代开发票', red_flush: '红冲发票' }
  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: '待审核', color: 'bg-amber-100 text-amber-700' },
    approved: { text: '已审核', color: 'bg-blue-100 text-blue-700' },
    issued: { text: '已开具', color: 'bg-green-100 text-green-700' },
    red_flushed: { text: '已红冲', color: 'bg-red-100 text-red-700' },
    verified: { text: '已查验', color: 'bg-emerald-100 text-emerald-700' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">发票管理</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowVerify(true)} className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">发票查验</button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#2a4f7f]">
            <Plus size={16} /> 代开发票
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">发票号码</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">类型</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">纳税人</th>
              <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">金额</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">购方</th>
              <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">状态</th>
              <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3.5 text-sm text-gray-900 font-mono">{inv.invoice_no || '-'}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{typeLabels[inv.invoice_type] || inv.invoice_type}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{inv.taxpayer_name}</td>
                <td className="px-5 py-3.5 text-sm text-gray-900 text-right font-medium">¥{Math.abs(inv.amount || 0).toLocaleString()}{inv.amount < 0 ? ' (红冲)' : ''}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{inv.buyer_name || '-'}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[inv.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[inv.status]?.text || inv.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  {inv.status === 'issued' && inv.invoice_type !== 'red_flush' && (
                    <button onClick={() => handleRedFlush(inv.id)} className="text-xs text-red-600 hover:text-red-700">红冲</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileCheck size={40} className="mx-auto mb-3 opacity-50" />
            <p>暂无发票记录</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">代开发票申请</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">发票类型</label>
                  <select value={form.invoice_type} onChange={e => setForm({...form, invoice_type: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="agency">代开发票</option>
                    <option value="normal">增值税普票</option>
                    <option value="special">增值税专票</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额（元）</label>
                  <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">购方名称</label>
                  <input type="text" value={form.buyer_name} onChange={e => setForm({...form, buyer_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">购方税号</label>
                  <input type="text" value={form.buyer_code} onChange={e => setForm({...form, buyer_code: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">销方名称</label>
                  <input type="text" value={form.seller_name} onChange={e => setForm({...form, seller_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">销方税号</label>
                  <input type="text" value={form.seller_code} onChange={e => setForm({...form, seller_code: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">附件上传（OCR识别）</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm" accept="image/*,.pdf" />
                  <p className="text-xs text-gray-400 mt-2">支持图片和PDF，系统将自动OCR识别</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">提交申请</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVerify && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">发票查验</h2>
              <button onClick={() => { setShowVerify(false); setVerifyResult(null) }} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <input type="text" value={verifyNo} onChange={e => setVerifyNo(e.target.value)} placeholder="请输入发票号码" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <button onClick={handleVerify} className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">查验</button>
            </div>
            {verifyResult && (
              <div className={`p-4 rounded-lg ${verifyResult.verified ? 'bg-green-50' : 'bg-red-50'}`}>
                {verifyResult.verified ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-green-700 font-medium"><CheckCircle2 size={16} /> 查验通过</div>
                    <div>发票号码：{verifyResult.invoice_no}</div>
                    <div>金额：¥{verifyResult.amount?.toLocaleString()}</div>
                    <div>购方：{verifyResult.buyer_name}</div>
                    <div>销方：{verifyResult.seller_name}</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-700 text-sm"><AlertTriangle size={16} /> {verifyResult.message}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
