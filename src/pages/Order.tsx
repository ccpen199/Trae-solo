import { useState, useEffect } from 'react'
import { User, Phone, MapPin, ChevronRight, X, Check } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const categories = ['电子产品', '文件', '服装', '食品', '日用品', '化妆品', '书籍', '家电', '其他']
const serviceTypes = [
  { key: 'economy', name: '经济件', desc: '3-5天', price: '¥12起' },
  { key: 'standard', name: '标准件', desc: '2-3天', price: '¥23起' },
  { key: 'express', name: '特快件', desc: '1-2天', price: '¥38起' },
]
const steps = ['寄件人', '收件人', '物品信息', '确认']

export default function Order() {
  const { addressBook, fetchAddressBook, createOrder, loading } = useAppStore()
  const [step, setStep] = useState(0)
  const [showWaybill, setShowWaybill] = useState(false)
  const [waybillResult, setWaybillResult] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState({
    senderName: '', senderPhone: '', senderAddress: '',
    receiverName: '', receiverPhone: '', receiverAddress: '',
    category: '', weight: 1, volume: 0.01, remark: '', serviceType: 'standard',
  })

  useEffect(() => { fetchAddressBook() }, [fetchAddressBook])

  const set = (key: string, val: string | number) => setForm((p) => ({ ...p, [key]: val }))

  const fillAddress = (addr: typeof addressBook[0], prefix: 'sender' | 'receiver') => {
    setForm((p) => ({
      ...p,
      [`${prefix}Name`]: addr.name,
      [`${prefix}Phone`]: addr.phone,
      [`${prefix}Address`]: `${addr.province}${addr.city}${addr.district}${addr.address}`,
    }))
  }

  const handleSubmit = async () => {
    const result = await createOrder(form)
    if (result) {
      setWaybillResult(result)
      setShowWaybill(true)
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              i <= step ? 'bg-accent text-white' : 'bg-gray-200 text-text-lighter'
            }`}>{i + 1}</div>
            <span className={`ml-1.5 text-xs ${i <= step ? 'text-navy font-medium' : 'text-text-lighter'}`}>{s}</span>
            {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-accent' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <h3 className="section-title text-sm">寄件人信息</h3>
          {addressBook.length > 0 && (
            <div>
              <p className="text-xs text-text-light mb-2">从地址簿选择</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {addressBook.filter((a) => a.tag === 'office' || a.tag === 'home').map((addr) => (
                  <button key={addr.id} onClick={() => fillAddress(addr, 'sender')}
                    className="flex-shrink-0 text-xs bg-surface px-3 py-2 rounded-lg hover:bg-surface-dark transition-colors">
                    {addr.tag === 'home' ? '🏠' : '🏢'} {addr.district}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
            <input className="input-field pl-10" placeholder="姓名" value={form.senderName} onChange={(e) => set('senderName', e.target.value)} />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
            <input className="input-field pl-10" placeholder="手机号" value={form.senderPhone} onChange={(e) => set('senderPhone', e.target.value)} />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-text-lighter" />
            <textarea className="input-field pl-10 min-h-[72px] resize-none" placeholder="详细地址" value={form.senderAddress} onChange={(e) => set('senderAddress', e.target.value)} />
          </div>
          <button onClick={() => setStep(1)} className="btn-primary w-full flex items-center justify-center gap-1">
            下一步 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <h3 className="section-title text-sm">收件人信息</h3>
          {addressBook.length > 0 && (
            <div>
              <p className="text-xs text-text-light mb-2">从地址簿选择</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {addressBook.map((addr) => (
                  <button key={addr.id} onClick={() => fillAddress(addr, 'receiver')}
                    className="flex-shrink-0 text-xs bg-surface px-3 py-2 rounded-lg hover:bg-surface-dark transition-colors">
                    {addr.name} - {addr.district}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
            <input className="input-field pl-10" placeholder="姓名" value={form.receiverName} onChange={(e) => set('receiverName', e.target.value)} />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
            <input className="input-field pl-10" placeholder="手机号" value={form.receiverPhone} onChange={(e) => set('receiverPhone', e.target.value)} />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-text-lighter" />
            <textarea className="input-field pl-10 min-h-[72px] resize-none" placeholder="详细地址" value={form.receiverAddress} onChange={(e) => set('receiverAddress', e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-outline flex-1">上一步</button>
            <button onClick={() => setStep(2)} className="btn-primary flex-1 flex items-center justify-center gap-1">
              下一步 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <h3 className="section-title text-sm">物品信息</h3>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => set('category', cat)}
                className={`py-2 text-xs rounded-lg border transition-all ${
                  form.category === cat ? 'border-accent bg-accent/5 text-accent font-medium' : 'border-gray-200 text-text-light'
                }`}>{cat}</button>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-light">重量</span>
              <span className="font-medium text-navy">{form.weight}kg</span>
            </div>
            <input type="range" min="0.1" max="20" step="0.1" value={form.weight} onChange={(e) => set('weight', parseFloat(e.target.value))} className="w-full" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-light">体积</span>
              <span className="font-medium text-navy">{form.volume}m³</span>
            </div>
            <input type="range" min="0.001" max="0.2" step="0.001" value={form.volume} onChange={(e) => set('volume', parseFloat(e.target.value))} className="w-full" />
          </div>
          <textarea className="input-field min-h-[56px] resize-none" placeholder="备注信息（选填）" value={form.remark} onChange={(e) => set('remark', e.target.value)} />
          <h3 className="section-title text-sm pt-2">服务类型</h3>
          <div className="grid grid-cols-3 gap-2">
            {serviceTypes.map((svc) => (
              <button key={svc.key} onClick={() => set('serviceType', svc.key)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.serviceType === svc.key ? 'border-accent bg-accent/5 shadow-sm' : 'border-gray-200'
                }`}>
                <p className={`text-sm font-bold ${form.serviceType === svc.key ? 'text-accent' : 'text-navy'}`}>{svc.name}</p>
                <p className="text-xs text-text-light mt-0.5">{svc.desc}</p>
                <p className="text-xs text-accent font-medium mt-1">{svc.price}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-outline flex-1">上一步</button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1 flex items-center justify-center gap-1">
              下一步 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <h3 className="section-title text-sm">确认订单</h3>
          <div className="space-y-3">
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs text-text-light mb-1">寄件人</p>
              <p className="text-sm font-medium text-navy">{form.senderName} {form.senderPhone}</p>
              <p className="text-xs text-text-light mt-0.5">{form.senderAddress}</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs text-text-light mb-1">收件人</p>
              <p className="text-sm font-medium text-navy">{form.receiverName} {form.receiverPhone}</p>
              <p className="text-xs text-text-light mt-0.5">{form.receiverAddress}</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs text-text-light mb-1">物品信息</p>
              <p className="text-sm font-medium text-navy">{form.category || '未选择'} · {form.weight}kg · {form.volume}m³</p>
              {form.remark && <p className="text-xs text-text-light mt-0.5">备注: {form.remark}</p>}
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs text-text-light mb-1">服务类型</p>
              <p className="text-sm font-bold text-accent">{serviceTypes.find((s) => s.key === form.serviceType)?.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-outline flex-1">上一步</button>
            <button onClick={handleSubmit} disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-1 disabled:opacity-50">
              {loading ? '提交中...' : '提交订单'} <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showWaybill && waybillResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">下单成功</h3>
              <button onClick={() => setShowWaybill(false)}><X className="w-5 h-5 text-text-lighter" /></button>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="text-2xl font-bold text-navy font-display">{String(waybillResult.waybillNo || '')}</p>
              <div className="bg-surface rounded-lg p-3">
                <svg className="w-full h-10" viewBox="0 0 300 40">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <rect key={i} x={i * 10} y={5} width={Math.random() > 0.4 ? 7 : 3} height={30} fill="#0F2B46" />
                  ))}
                </svg>
              </div>
              <p className="text-xs text-text-light">预计费用: ¥{String(waybillResult.estimatedFee || '')} · {String(waybillResult.estimatedDelivery || '')}</p>
            </div>
            <button onClick={() => setShowWaybill(false)} className="btn-primary w-full mt-4">完成</button>
          </div>
        </div>
      )}
    </div>
  )
}
