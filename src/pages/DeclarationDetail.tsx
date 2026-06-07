import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDeclaration } from '@/lib/api'
import { ArrowLeft, FileText, Stamp, Send, AlertTriangle, CheckCircle2, Shield } from 'lucide-react'
import { submitDeclaration, sealDeclaration, validateDeclaration, correctDeclaration } from '@/lib/api'

export default function DeclarationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [decl, setDecl] = useState<any>(null)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    if (!id) return
    const res = await getDeclaration(Number(id))
    if (res.success && res.data) setDecl(res.data)
  }

  async function handleSubmit() {
    if (!id) return
    const res = await submitDeclaration(Number(id))
    if (res.success) loadData()
  }

  async function handleSeal() {
    if (!id) return
    const res = await sealDeclaration(Number(id))
    if (res.success) loadData()
  }

  async function handleCorrect() {
    if (!id || !decl) return
    const res = await correctDeclaration(Number(id), {
      form_data: decl.form_data,
      tax_amount: decl.tax_amount,
    })
    if (res.success) navigate('/declarations')
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    draft: { text: '草稿', color: 'bg-gray-100 text-gray-600' },
    submitted: { text: '已提交', color: 'bg-blue-100 text-blue-700' },
    approved: { text: '已审核', color: 'bg-green-100 text-green-700' },
    sealed: { text: '已签章', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { text: '已驳回', color: 'bg-red-100 text-red-700' },
  }

  if (!decl) return <div className="text-center py-12 text-gray-400">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/declarations')} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">申报详情</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full ${statusLabels[decl.status]?.color}`}>
          {statusLabels[decl.status]?.text}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-gray-500">纳税人：<span className="text-gray-900">{decl.taxpayer_name}</span></div>
              <div className="text-gray-500">税种：<span className="text-gray-900">{decl.tax_type_name}</span></div>
              <div className="text-gray-500">申报期间：<span className="text-gray-900">{decl.period}</span></div>
              <div className="text-gray-500">申报类型：<span className="text-gray-900">{decl.decl_type === 'regular' ? '定期申报' : decl.decl_type === 'zero' ? '零申报' : '更正申报'}</span></div>
              <div className="text-gray-500">应纳税额：<span className="text-xl font-bold text-red-600">¥{(decl.tax_amount || 0).toLocaleString()}</span></div>
              <div className="text-gray-500">提交时间：<span className="text-gray-900">{decl.submitted_at || '-'}</span></div>
            </div>
          </div>

          {decl.form_data && typeof decl.form_data === 'object' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">申报表数据</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(decl.form_data).map(([key, value]) => (
                  <div key={key} className="text-gray-500">
                    {key}：<span className="text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {decl.seal_data && (
            <div className="bg-white rounded-xl border border-emerald-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Stamp size={18} className="text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">电子签章已应用</span>
              </div>
              <div className="text-sm text-gray-600">签章编号：{decl.seal_data}</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
            <div className="space-y-2">
              {decl.status === 'draft' && (
                <button onClick={handleSubmit} className="w-full py-2.5 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                  <Send size={14} /> 提交申报
                </button>
              )}
              {decl.status === 'submitted' && (
                <button onClick={handleSeal} className="w-full py-2.5 text-sm text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-2">
                  <Stamp size={14} /> 电子签章
                </button>
              )}
              {(decl.status === 'submitted' || decl.status === 'approved' || decl.status === 'sealed') && (
                <button onClick={handleCorrect} className="w-full py-2.5 text-sm text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center justify-center gap-2">
                  <AlertTriangle size={14} /> 更正申报
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
