import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { getTaxTypes, createDeclaration, getPrefillData, validateDeclaration } from '@/lib/api'
import { ArrowLeft, Save, Wand2, Shield, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

export default function DeclarationForm() {
  const navigate = useNavigate()
  const { currentTaxpayer, user } = useAppStore()
  const [taxTypes, setTaxTypes] = useState<any[]>([])
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    taxpayer_id: currentTaxpayer?.id || '',
    tax_type_id: '',
    period: '',
    decl_type: 'regular',
    revenue: 0,
    cost: 0,
    profit: 0,
    tax_rate: 0,
    tax_amount: 0,
  })
  const [prefill, setPrefill] = useState<any>(null)
  const [validation, setValidation] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getTaxTypes().then(res => { if (res.success && res.data) setTaxTypes(res.data as any[]) })
    if (currentTaxpayer) setForm(f => ({ ...f, taxpayer_id: currentTaxpayer.id }))
  }, [currentTaxpayer])

  async function handlePrefill() {
    if (!form.taxpayer_id || !form.tax_type_id) return
    const params = `taxpayer_id=${form.taxpayer_id}&tax_type_id=${form.tax_type_id}${form.period ? `&period=${form.period}` : ''}`
    const res = await getPrefillData(params)
    if (res.success && res.data) {
      setPrefill(res.data)
      const tt = taxTypes.find(t => t.id === Number(form.tax_type_id))
      if (tt) setForm(f => ({ ...f, tax_rate: tt.default_rate }))
    }
  }

  async function handleValidate() {
    const res = await validateDeclaration({
      taxpayer_id: Number(form.taxpayer_id),
      tax_type_id: Number(form.tax_type_id),
      form_data: { revenue: form.revenue, cost: form.cost, tax_rate: form.tax_rate, period: form.period },
      tax_amount: form.tax_amount,
    })
    if (res.success) setValidation(res.data)
  }

  function calcTax() {
    const amount = form.revenue * form.tax_rate
    setForm(f => ({ ...f, tax_amount: Math.round(amount * 100) / 100 }))
  }

  async function handleSave() {
    setSaving(true)
    const res = await createDeclaration({
      taxpayer_id: Number(form.taxpayer_id),
      tax_type_id: Number(form.tax_type_id),
      period: form.period,
      decl_type: form.decl_type,
      form_data: { revenue: form.revenue, cost: form.cost, tax_rate: form.tax_rate },
      tax_amount: form.tax_amount,
    })
    setSaving(false)
    if (res.success) navigate('/declarations')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/declarations')} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">新建申报</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {['选择税种', '填写表单', '风险校验', '确认提交'].map((label, i) => (
          <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
            step > i + 1 ? 'bg-emerald-100 text-emerald-700' : step === i + 1 ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">
              {step > i + 1 ? '✓' : i + 1}
            </span>
            {label}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">纳税人主体 *</label>
              <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700">
                {currentTaxpayer?.name || '请先选择纳税人主体'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">税种 *</label>
              <select value={form.tax_type_id} onChange={e => setForm({...form, tax_type_id: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">请选择税种</option>
                {taxTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name} ({tt.code})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申报期间 *</label>
              <input type="month" value={form.period} onChange={e => setForm({...form, period: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申报类型</label>
              <select value={form.decl_type} onChange={e => setForm({...form, decl_type: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="regular">定期申报</option>
                <option value="zero">零申报</option>
                <option value="correction">更正申报</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={handlePrefill} className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100">
              <Wand2 size={14} /> 智能预填
            </button>
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">下一步</button>
          </div>
          {prefill && (
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <div className="font-medium text-blue-800 mb-2">预填数据（来源于工商/社保数据对接）</div>
              <div className="grid grid-cols-2 gap-2 text-blue-700">
                <div>默认税率：{(prefill.default_rate * 100).toFixed(1)}%</div>
                <div>上期税额：¥{prefill.previous_amount.toLocaleString()}</div>
                <div>行业：{prefill.business_data?.industry}</div>
                <div>规模：{prefill.business_data?.scale}</div>
                <div>参考员工数：{prefill.social_security_data?.employee_count}</div>
                <div>参考薪资总额：¥{prefill.social_security_data?.total_salary?.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">营业收入（元）</label>
              <input type="number" value={form.revenue || ''} onChange={e => setForm({...form, revenue: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">营业成本（元）</label>
              <input type="number" value={form.cost || ''} onChange={e => setForm({...form, cost: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">税率</label>
              <input type="number" step="0.001" value={form.tax_rate || ''} onChange={e => setForm({...form, tax_rate: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">应纳税额：<span className="text-xl font-bold text-gray-900">¥{form.tax_amount.toLocaleString()}</span></div>
            <button onClick={calcTax} className="px-4 py-1.5 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600">计算税额</button>
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">上一步</button>
            <button onClick={() => setStep(3)} className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">下一步</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <button onClick={handleValidate} className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
            <Shield size={14} /> 执行风险校验
          </button>
          {validation && (
            <div className="space-y-3">
              {validation.errors?.map((e: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-red-700">{e.message}</div>
                </div>
              ))}
              {validation.warnings?.map((w: any, i: number) => (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-lg ${w.level === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                  {w.level === 'warning' ? <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" /> : <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />}
                  <div className={`text-sm ${w.level === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>{w.message}</div>
                </div>
              ))}
              {validation.valid && validation.errors?.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-sm text-green-700">校验通过，未发现风险问题</span>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">上一步</button>
            <button onClick={() => setStep(4)} className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">下一步</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">确认申报信息</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-gray-500">纳税人：<span className="text-gray-900">{currentTaxpayer?.name}</span></div>
            <div className="text-gray-500">税种：<span className="text-gray-900">{taxTypes.find(t => t.id === Number(form.tax_type_id))?.name}</span></div>
            <div className="text-gray-500">申报期间：<span className="text-gray-900">{form.period}</span></div>
            <div className="text-gray-500">申报类型：<span className="text-gray-900">{form.decl_type === 'regular' ? '定期申报' : form.decl_type === 'zero' ? '零申报' : '更正申报'}</span></div>
            <div className="text-gray-500">营业收入：<span className="text-gray-900">¥{form.revenue.toLocaleString()}</span></div>
            <div className="text-gray-500">应纳税额：<span className="text-xl font-bold text-red-600">¥{form.tax_amount.toLocaleString()}</span></div>
          </div>
          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button onClick={() => setStep(3)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">上一步</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] disabled:opacity-50 flex items-center gap-2">
              <Save size={14} /> {saving ? '保存中...' : '保存申报'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
