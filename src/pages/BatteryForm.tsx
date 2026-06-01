import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'

export default function BatteryForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { currentBattery, fetchBattery, createBattery, updateBattery, fetchBatteries } = useStore()

  const [form, setForm] = useState({
    code: '',
    model: '',
    supplier: '',
    purchase_batch: '',
    capacity: '',
    warranty_date: '',
    initial_test_result: 'pass',
    status: 'in_stock',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (id) fetchBattery(id)
  }, [id, fetchBattery])

  useEffect(() => {
    if (isEdit && currentBattery) {
      setForm({
        code: currentBattery.code || '',
        model: currentBattery.model || '',
        supplier: currentBattery.supplier || '',
        purchase_batch: currentBattery.purchase_batch || '',
        capacity: String(currentBattery.capacity ?? ''),
        warranty_date: currentBattery.warranty_date ? String(currentBattery.warranty_date).slice(0, 10) : '',
        initial_test_result: currentBattery.initial_test_result || 'pass',
        status: currentBattery.status || 'in_stock',
      })
    }
  }, [isEdit, currentBattery])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.code.trim()) errs.code = '编码不能为空'
    if (!form.model.trim()) errs.model = '型号不能为空'
    if (!form.supplier.trim()) errs.supplier = '供应商不能为空'
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) errs.capacity = '请输入有效容量'
    if (!form.warranty_date) errs.warranty_date = '质保期不能为空'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const data = {
      ...form,
      capacity: Number(form.capacity),
    }

    const ok = isEdit && id
      ? await updateBattery(id, data)
      : await createBattery(data)

    if (ok) {
      await fetchBatteries({ page: '1', page_size: '10' })
      navigate('/batteries')
    }
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">{isEdit ? '编辑电池' : '新增电池'}</h2>

      <form onSubmit={handleSubmit} className="bg-[#1E293B] rounded-lg p-6 border border-slate-700/50 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">编码 <span className="text-red-400">*</span></label>
            <input value={form.code} onChange={(e) => updateField('code', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
            {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">型号 <span className="text-red-400">*</span></label>
            <input value={form.model} onChange={(e) => updateField('model', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
            {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">供应商 <span className="text-red-400">*</span></label>
            <input value={form.supplier} onChange={(e) => updateField('supplier', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
            {errors.supplier && <p className="text-red-400 text-xs mt-1">{errors.supplier}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">采购批次</label>
            <input value={form.purchase_batch} onChange={(e) => updateField('purchase_batch', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">容量(Ah) <span className="text-red-400">*</span></label>
            <input type="number" step="0.01" value={form.capacity} onChange={(e) => updateField('capacity', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
            {errors.capacity && <p className="text-red-400 text-xs mt-1">{errors.capacity}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">质保期 <span className="text-red-400">*</span></label>
            <input type="date" value={form.warranty_date} onChange={(e) => updateField('warranty_date', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500" />
            {errors.warranty_date && <p className="text-red-400 text-xs mt-1">{errors.warranty_date}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">初始检测结果</label>
            <select value={form.initial_test_result} onChange={(e) => updateField('initial_test_result', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="pass">合格</option>
              <option value="fail">不合格</option>
              <option value="pending">待检测</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">状态</label>
            <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
              <option value="in_stock">在库</option>
              <option value="in_use">使用中</option>
              <option value="maintenance">维护中</option>
              <option value="retired">已退役</option>
              <option value="cascaded">梯次利用</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors">
            {isEdit ? '保存' : '创建'}
          </button>
          <button type="button" onClick={() => navigate('/batteries')} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
