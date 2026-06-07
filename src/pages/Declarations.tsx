import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { getDeclarations, submitDeclaration, sealDeclaration } from '@/lib/api'
import { FileText, Plus, Search, Filter, Send, Stamp, Eye } from 'lucide-react'

export default function Declarations() {
  const { currentTaxpayer } = useAppStore()
  const navigate = useNavigate()
  const [declarations, setDeclarations] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [statusFilter])

  async function loadData() {
    setLoading(true)
    const params = statusFilter ? `status=${statusFilter}` : ''
    const res = await getDeclarations(params)
    if (res.success && res.data) setDeclarations(res.data as any[])
    setLoading(false)
  }

  async function handleSubmit(id: number) {
    const res = await submitDeclaration(id)
    if (res.success) loadData()
  }

  async function handleSeal(id: number) {
    const res = await sealDeclaration(id)
    if (res.success) loadData()
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    draft: { text: '草稿', color: 'bg-gray-100 text-gray-600' },
    submitted: { text: '已提交', color: 'bg-blue-100 text-blue-700' },
    approved: { text: '已审核', color: 'bg-green-100 text-green-700' },
    sealed: { text: '已签章', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { text: '已驳回', color: 'bg-red-100 text-red-700' },
  }

  const declTypeLabels: Record<string, string> = { regular: '定期申报', zero: '零申报', correction: '更正申报' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">申报管理</h1>
        <button
          onClick={() => navigate('/declarations/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#2a4f7f]"
        >
          <Plus size={16} /> 新建申报
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={16} className="text-gray-400 mr-2" />
          <input type="text" placeholder="搜索申报记录..." className="text-sm outline-none flex-1" />
        </div>
        <div className="flex gap-2">
          {['', 'draft', 'submitted', 'approved', 'sealed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                statusFilter === s ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === '' ? '全部' : statusLabels[s]?.text || s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">纳税人</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">税种</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">申报期间</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">申报类型</th>
              <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">应纳税额</th>
              <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">状态</th>
              <th className="text-center text-xs font-medium text-gray-500 px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {declarations.map((d) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3.5 text-sm text-gray-900">{d.taxpayer_name}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{d.tax_type_name}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{d.period}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{declTypeLabels[d.decl_type] || d.decl_type}</td>
                <td className="px-5 py-3.5 text-sm text-gray-900 text-right font-medium">¥{(d.tax_amount || 0).toLocaleString()}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[d.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[d.status]?.text || d.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => navigate(`/declarations/${d.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="查看">
                      <Eye size={14} />
                    </button>
                    {d.status === 'draft' && (
                      <button onClick={() => handleSubmit(d.id)} className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50" title="提交">
                        <Send size={14} />
                      </button>
                    )}
                    {d.status === 'submitted' && (
                      <button onClick={() => handleSeal(d.id)} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50" title="签章">
                        <Stamp size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {declarations.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p>暂无申报记录</p>
          </div>
        )}
      </div>
    </div>
  )
}
