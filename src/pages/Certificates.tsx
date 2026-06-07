import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getCertificates, createCertificate } from '@/lib/api'
import { Award, Plus, X, Download, FileCheck } from 'lucide-react'

export default function Certificates() {
  const { currentTaxpayer } = useAppStore()
  const [certificates, setCertificates] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [certType, setCertType] = useState('tax_paid')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const res = await getCertificates()
    if (res.success && res.data) setCertificates(res.data as any[])
  }

  async function handleApply() {
    if (!currentTaxpayer) return
    const res = await createCertificate({ taxpayer_id: currentTaxpayer.id, cert_type: certType })
    if (res.success) { setShowModal(false); loadData() }
  }

  const typeLabels: Record<string, string> = { tax_paid: '完税证明', no_debt: '无欠税证明' }
  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: '待开具', color: 'bg-amber-100 text-amber-700' },
    issued: { text: '已开具', color: 'bg-green-100 text-green-700' },
    rejected: { text: '已驳回', color: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">涉税证明</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#2a4f7f]">
          <Plus size={16} /> 申请证明
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certificates.map(cert => (
          <div key={cert.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Award size={20} className="text-amber-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{typeLabels[cert.cert_type] || cert.cert_type}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabels[cert.status]?.color}`}>
                    {statusLabels[cert.status]?.text}
                  </span>
                </div>
              </div>
            </div>
            {cert.cert_no && <div className="text-sm text-gray-500 mb-2">证明编号：<span className="text-gray-700 font-mono">{cert.cert_no}</span></div>}
            {cert.content && <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-3">{cert.content}</div>}
            <div className="text-xs text-gray-400">{cert.taxpayer_name} · {cert.issued_at || '待开具'}</div>
            {cert.status === 'issued' && (
              <button className="mt-3 w-full py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-2">
                <Download size={14} /> 下载证明
              </button>
            )}
          </div>
        ))}
        {certificates.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <FileCheck size={40} className="mx-auto mb-3 opacity-50" />
            <p>暂无涉税证明</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">申请涉税证明</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">证明类型</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCertType('tax_paid')}
                    className={`p-4 rounded-xl border-2 text-center transition-colors ${
                      certType === 'tax_paid' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Award size={24} className={certType === 'tax_paid' ? 'text-blue-600 mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
                    <div className="text-sm font-medium">完税证明</div>
                    <div className="text-xs text-gray-500 mt-1">证明已按规定缴纳税款</div>
                  </button>
                  <button
                    onClick={() => setCertType('no_debt')}
                    className={`p-4 rounded-xl border-2 text-center transition-colors ${
                      certType === 'no_debt' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileCheck size={24} className={certType === 'no_debt' ? 'text-blue-600 mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
                    <div className="text-sm font-medium">无欠税证明</div>
                    <div className="text-xs text-gray-500 mt-1">证明无欠缴税款记录</div>
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
                <button onClick={handleApply} className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">提交申请</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
