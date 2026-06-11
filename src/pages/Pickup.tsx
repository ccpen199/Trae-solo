import { useState, useMemo } from 'react'
import {
  User,
  Phone,
  MapPin,
  Package,
  Weight,
  ChevronRight,
  ChevronLeft,
  Check,
  Sun,
  CloudSun,
  Moon,
  Send,
  Clock,
  FileText,
  Box,
} from 'lucide-react'

const ADDRESSES = [
  '北京市朝阳区建国路88号',
  '上海市浦东新区陆家嘴环路1000号',
  '广州市天河区天河路385号',
  '深圳市南山区科技园南路18号',
  '杭州市西湖区文三路478号',
  '成都市武侯区人民南路四段1号',
  '武汉市江汉区解放大道688号',
  '南京市鼓楼区中山北路283号',
  '重庆市渝中区解放碑民权路28号',
  '西安市雁塔区高新路2号',
  '苏州市工业园区星湖街218号',
  '天津市和平区南京路189号',
]

const ITEM_TYPES = ['文件', '电子产品', '服装', '食品', '日用品', '其他']
const TIME_SLOTS = [
  { key: 'morning', label: '上午', time: '08:00-12:00', icon: Sun },
  { key: 'afternoon', label: '下午', time: '12:00-18:00', icon: CloudSun },
  { key: 'evening', label: '晚上', time: '18:00-21:00', icon: Moon },
]
const STEPS = ['寄件信息', '时间选择', '确认提交']

type FormData = {
  senderName: string; senderPhone: string; senderAddress: string
  receiverName: string; receiverPhone: string; receiverAddress: string
  itemType: string; weight: string; date: string; timeSlot: string
}

const initial: FormData = {
  senderName: '', senderPhone: '', senderAddress: '',
  receiverName: '', receiverPhone: '', receiverAddress: '',
  itemType: '文件', weight: '1', date: '', timeSlot: '',
}

function AddressInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const filtered = useMemo(
    () => ADDRESSES.filter((a) => a.includes(value) && a !== value).slice(0, 5),
    [value],
  )
  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="input-field w-full pl-9"
          placeholder="输入地址"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => value.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {filtered.map((addr) => (
            <button
              key={addr}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
              onMouseDown={() => { onChange(addr); setOpen(false) }}
            >{addr}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoCard({ title, icon: Icon, name, phone, address, setName, setPhone, setAddress }: any) {
  return (
    <div className="card">
      <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
        <Icon className="w-4 h-4 text-amber-500" />{title}
      </h3>
      <div className="space-y-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input-field w-full pl-9" placeholder="姓名" value={name} onChange={(e: any) => setName(e.target.value)} />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input-field w-full pl-9" placeholder="手机号" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
        </div>
        <AddressInput value={address} onChange={setAddress} />
      </div>
    </div>
  )
}

export default function Pickup() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initial)
  const [fee, setFee] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [waybillNo, setWaybillNo] = useState('')

  const set = (k: keyof FormData) => (v: string) => setForm((p) => ({ ...p, [k]: v }))

  const next7Days = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i)
      days.push({ value: d.toISOString().slice(0, 10), label: d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }), weekday: d.toLocaleDateString('zh-CN', { weekday: 'short' }), isToday: i === 0 })
    }
    return days
  }, [])

  const canNext = () => {
    if (step === 1) return form.senderName && form.senderPhone && form.senderAddress && form.receiverName && form.receiverPhone && form.receiverAddress && form.itemType && form.weight
    if (step === 2) return form.date && form.timeSlot
    return true
  }

  const handleNext = async () => {
    if (step === 2) {
      try {
        const res = await fetch('/api/freight/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const data = await res.json()
        setFee(data.fee ?? 15)
      } catch { setFee(15) }
    }
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/pickup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      setWaybillNo(data.waybillNo ?? `WD${Date.now().toString().slice(-10)}`)
    } catch { setWaybillNo(`WD${Date.now().toString().slice(-10)}`) }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-amber-500/15 flex items-center justify-center mb-6 animate-bounce">
          <Check className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-100 mb-2">预约成功！</h2>
        <p className="text-slate-400 mb-1">运单号</p>
        <p className="font-mono-num text-2xl text-amber-400 font-bold">{waybillNo}</p>
        <p className="text-sm text-slate-500 mt-4">快递员将在约定时间上门取件</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => {
          const s = i + 1
          const done = s < step
          const active = s === step
          return (
            <div key={s} className="flex items-center flex-1 last:flex-initial">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${done ? 'bg-amber-500 text-slate-900' : active ? 'border-2 border-amber-500 text-amber-500' : 'border border-slate-700 text-slate-500'}`}>
                  {done ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={`text-sm hidden sm:inline ${active ? 'text-amber-400 font-medium' : done ? 'text-slate-300' : 'text-slate-500'}`}>{label}</span>
              </div>
              {s < 3 && <div className={`flex-1 h-px mx-3 ${s < step ? 'bg-amber-500' : 'bg-slate-700'}`} />}
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="寄件人信息" icon={Send} name={form.senderName} phone={form.senderPhone} address={form.senderAddress} setName={set('senderName')} setPhone={set('senderPhone')} setAddress={set('senderAddress')} />
            <InfoCard title="收件人信息" icon={Package} name={form.receiverName} phone={form.receiverPhone} address={form.receiverAddress} setName={set('receiverName')} setPhone={set('receiverPhone')} setAddress={set('receiverAddress')} />
          </div>
          <div className="card">
            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
              <Box className="w-4 h-4 text-amber-500" />物品信息
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">物品类型</label>
                <select className="input-field w-full" value={form.itemType} onChange={(e) => set('itemType')(e.target.value)}>
                  {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">重量 (kg)</label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="number" min="0.1" step="0.1" className="input-field w-full pl-9" value={form.weight} onChange={(e) => set('weight')(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-slide-up">
          <div>
            <h3 className="section-title flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" />选择日期</h3>
            <div className="grid grid-cols-7 gap-2">
              {next7Days.map((d) => (
                <button
                  key={d.value}
                  onClick={() => set('date')(d.value)}
                  className={`card p-3 text-center cursor-pointer transition-all ${form.date === d.value ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30' : 'hover:border-slate-600'}`}
                >
                  <p className="text-xs text-slate-500">{d.weekday}</p>
                  <p className={`text-sm font-medium mt-1 ${form.date === d.value ? 'text-amber-400' : 'text-slate-200'}`}>{d.label}</p>
                  {d.isToday && <p className="text-[10px] text-amber-500 mt-0.5">今天</p>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="section-title flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" />选择时段</h3>
            <div className="grid grid-cols-3 gap-3">
              {TIME_SLOTS.map((slot) => {
                const Icon = slot.icon
                const selected = form.timeSlot === slot.key
                return (
                  <button
                    key={slot.key}
                    onClick={() => set('timeSlot')(slot.key)}
                    className={`card p-4 text-center cursor-pointer transition-all ${selected ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30' : 'hover:border-slate-600'}`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${selected ? 'text-amber-500' : 'text-slate-500'}`} />
                    <p className={`text-sm font-medium ${selected ? 'text-amber-400' : 'text-slate-200'}`}>{slot.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{slot.time}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-slide-up">
          <div className="card">
            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
              <FileText className="w-4 h-4 text-amber-500" />预约信息确认
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-slate-500">寄件人</p>
                <p className="text-slate-200">{form.senderName} · {form.senderPhone}</p>
                <p className="text-slate-400 text-xs">{form.senderAddress}</p>
              </div>
              <div className="space-y-2">
                <p className="text-slate-500">收件人</p>
                <p className="text-slate-200">{form.receiverName} · {form.receiverPhone}</p>
                <p className="text-slate-400 text-xs">{form.receiverAddress}</p>
              </div>
            </div>
            <div className="border-t border-slate-800 mt-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><p className="text-slate-500">物品类型</p><p className="text-slate-200">{form.itemType}</p></div>
              <div><p className="text-slate-500">重量</p><p className="text-slate-200">{form.weight} kg</p></div>
              <div><p className="text-slate-500">取件日期</p><p className="text-slate-200">{form.date}</p></div>
              <div><p className="text-slate-500">取件时段</p><p className="text-slate-200">{TIME_SLOTS.find((s) => s.key === form.timeSlot)?.label} {TIME_SLOTS.find((s) => s.key === form.timeSlot)?.time}</p></div>
            </div>
          </div>
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">预估运费</p>
              <p className="font-mono-num text-2xl text-amber-400 font-bold mt-1">¥{fee?.toFixed(2) ?? '--'}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>实际运费以快递员称重为准</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        {step > 1 ? (
          <button className="btn-secondary flex items-center gap-1" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="w-4 h-4" />上一步
          </button>
        ) : <div />}
        {step < 3 ? (
          <button className="btn-primary flex items-center gap-1" disabled={!canNext()} onClick={handleNext}
            style={canNext() ? {} : { opacity: 0.4, cursor: 'not-allowed' }}>
            下一步<ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button className="btn-primary flex items-center gap-1" onClick={handleSubmit}>
            <Send className="w-4 h-4" />提交预约
          </button>
        )}
      </div>
    </div>
  )
}
