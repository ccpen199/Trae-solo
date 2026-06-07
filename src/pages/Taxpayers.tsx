import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getTaxpayers, createTaxpayer, updateTaxpayer } from '@/lib/api'
import { Plus, Building2, User, Edit2, X } from 'lucide-react'

export default function Taxpayers() {
  const { user, setCurrentTaxpayer } = useAppStore()
  const [taxpayers, setTaxpayers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', type: 'enterprise', unified_code: '', id_number: '',
    legal_person: '', address: '', industry: '', scale: '', region: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const res = await getTaxpayers()
    if (res.success && res.data) setTaxpayers(res.data as any[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editId) {
      await updateTaxpayer(editId, form)
    } else {
      await createTaxpayer(form)
    }
    setShowModal(false)
    setEditId(null)
    setForm({ name: '', type: 'enterprise', unified_code: '', id_number: '', legal_person: '', address: '', industry: '', scale: '', region: '' })
    loadData()
  }

  function handleEdit(tp: any) {
    setForm({
      name: tp.name, type: tp.type, unified_code: tp.unified_code || '',
      id_number: tp.id_number || '', legal_person: tp.legal_person || '',
      address: tp.address || '', industry: tp.industry || '', scale: tp.scale || '', region: tp.region || '',
    })
    setEditId(tp.id)
    setShowModal(true)
  }

  const typeLabels: Record<string, string> = { enterprise: '企业', individual: '个体户', natural_person: '自然人' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">纳税人中心</h1>
        <button
          onClick={() => { setEditId(null); setForm({ name: '', type: 'enterprise', unified_code: '', id_number: '', legal_person: '', address: '', industry: '', scale: '', region: '' }); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#2a4f7f] transition-colors"
        >
          <Plus size={16} /> 新增纳税人
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {taxpayers.map((tp) => (
          <div key={tp.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  {tp.type === 'natural_person' ? <User size={20} className="text-blue-600" /> : <Building2 size={20} className="text-blue-600" />}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{tp.name}</div>
                  <span className="text-xs text-gray-500">{typeLabels[tp.type] || tp.type}</span>
                </div>
              </div>
              <button onClick={() => handleEdit(tp)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                <Edit2 size={14} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {tp.unified_code && <div className="text-gray-500">统一社会信用代码：<span className="text-gray-700">{tp.unified_code}</span></div>}
              {tp.legal_person && <div className="text-gray-500">法定代表人：<span className="text-gray-700">{tp.legal_person}</span></div>}
              <div className="flex gap-4">
                {tp.industry && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tp.industry}</span>}
                {tp.scale && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tp.scale}</span>}
                {tp.region && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tp.region}</span>}
              </div>
            </div>
            <button
              onClick={() => setCurrentTaxpayer(tp)}
              className="mt-4 w-full py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
            >
              切换为当前主体
            </button>
          </div>
        ))}
        {taxpayers.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-50" />
            <p>暂无纳税人主体，请点击上方按钮新增</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? '编辑纳税人' : '新增纳税人'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="enterprise">企业</option>
                    <option value="individual">个体户</option>
                    <option value="natural_person">自然人</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码</label>
                  <input type="text" value={form.unified_code} onChange={e => setForm({...form, unified_code: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身份证号</label>
                  <input type="text" value={form.id_number} onChange={e => setForm({...form, id_number: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">法定代表人</label>
                  <input type="text" value={form.legal_person} onChange={e => setForm({...form, legal_person: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">行业</label>
                  <input type="text" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：信息技术" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">规模</label>
                  <select value={form.scale} onChange={e => setForm({...form, scale: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="">请选择</option>
                    <option value="大型">大型</option>
                    <option value="中型">中型</option>
                    <option value="小型">小型</option>
                    <option value="微型">微型</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地区</label>
                  <input type="text" value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：上海" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
