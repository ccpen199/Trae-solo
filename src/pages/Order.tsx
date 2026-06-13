import { useState, useEffect, useMemo, ReactNode } from 'react'
import { User, Phone, MapPin, ChevronRight, ChevronLeft, X, Check, Plus, Package, FileText, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useNavigate } from 'react-router-dom'

const categories = ['电子产品', '文件', '服装', '食品', '日用品', '化妆品', '书籍', '家电', '其他']
const tagList: { key: 'home' | 'office' | 'other'; label: string; icon: string }[] = [
  { key: 'home', label: '家', icon: '🏠' }, { key: 'office', label: '公司', icon: '🏢' }, { key: 'other', label: '其他', icon: '📍' },
]
const regionData: Record<string, Record<string, string[]>> = {
  '北京市': { '北京市': ['东城区', '西城区', '朝阳区', '海淀区'] },
  '上海市': { '上海市': ['黄浦区', '徐汇区', '浦东新区', '闵行区'] },
  '广东省': { '广州市': ['天河区', '越秀区'], '深圳市': ['福田区', '南山区'] },
  '江苏省': { '南京市': ['玄武区', '鼓楼区'], '苏州市': ['姑苏区', '吴中区'] },
  '浙江省': { '杭州市': ['西湖区', '滨江区'], '宁波市': ['海曙区', '鄞州区'] },
  '四川省': { '成都市': ['武侯区', '高新区'] },
  '湖北省': { '武汉市': ['武昌区', '洪山区'] },
  '山东省': { '济南市': ['历下区'], '青岛市': ['市南区'] },
  '福建省': { '福州市': ['鼓楼区'], '厦门市': ['思明区'] },
  '陕西省': { '西安市': ['雁塔区'] },
}
const steps = ['寄件人', '收件人', '物品信息', '确认寄件']
const provinces = Object.keys(regionData)
const svcNames: Record<string, string> = { economy: '经济件', standard: '标准件', express: '特快件' }
const defPrices: Record<string, string> = { economy: '¥12起', standard: '¥23起', express: '¥38起' }
const defDays: Record<string, string> = { economy: '3-5天', standard: '2-3天', express: '1-2天' }
const demoSender = { name: '张伟', phone: '13800138001', address: '上海市上海市浦东新区陆家嘴环路1000号', province: '上海市', city: '上海市', district: '浦东新区' }
const demoReceiver = { name: '王芳', phone: '13800138002', address: '北京市北京市朝阳区建国门外大街1号', province: '北京市', city: '北京市', district: '朝阳区' }

type AddressForm = { name: string; phone: string; province: string; city: string; district: string; address: string; isDefault: boolean; tag: 'home' | 'office' | 'other' }

export default function Order() {
  const { addressBook, fetchAddressBook, addAddress, fetchEstimate, estimateTiers, createOrder, loading } = useAppStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null)
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null)
  const [showWaybill, setShowWaybill] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState<'sender' | 'receiver' | null>(null)
  const [waybillResult, setWaybillResult] = useState<Record<string, unknown> | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newAddrErrors, setNewAddrErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const firstProv = provinces[0]
  const firstCity = Object.keys(regionData[firstProv])[0]
  const [newAddr, setNewAddr] = useState<AddressForm>({ name: '', phone: '', province: firstProv, city: firstCity, district: regionData[firstProv][firstCity][0], address: '', isDefault: false, tag: 'other' })
  const [form, setForm] = useState({ senderName: demoSender.name, senderPhone: demoSender.phone, senderAddress: demoSender.address, senderProvince: demoSender.province, senderCity: demoSender.city, senderDistrict: demoSender.district, receiverName: demoReceiver.name, receiverPhone: demoReceiver.phone, receiverAddress: demoReceiver.address, receiverProvince: demoReceiver.province, receiverCity: demoReceiver.city, receiverDistrict: demoReceiver.district, category: '文件', weight: 1, volume: 0.01, remark: '', serviceType: 'standard' })

  useEffect(() => { fetchAddressBook() }, [fetchAddressBook])
  useEffect(() => {
    if (addressBook.length > 0 && !selectedSenderId) {
      const def = addressBook.find((a) => a.isDefault) || addressBook[0]
      setSelectedSenderId(def.id); fillAddressById(def.id, 'sender')
    }
    if (addressBook.length > 1 && !selectedReceiverId) {
      const receiver = addressBook.find((a) => !a.isDefault) || addressBook[1]
      setSelectedReceiverId(receiver.id); fillAddressById(receiver.id, 'receiver')
    }
  }, [addressBook])

  const setFormField = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  function fillAddressById(id: string, prefix: 'sender' | 'receiver') {
    const addr = addressBook.find((a) => a.id === id); if (!addr) return
    setForm((p) => ({ ...p, [`${prefix}Name`]: addr.name, [`${prefix}Phone`]: addr.phone, [`${prefix}Address`]: `${addr.province}${addr.city}${addr.district}${addr.address}`, [`${prefix}Province`]: addr.province, [`${prefix}City`]: addr.city, [`${prefix}District`]: addr.district }))
  }

  const handleChipClick = (id: string, prefix: 'sender' | 'receiver') => {
    if (prefix === 'sender') setSelectedSenderId(id); else setSelectedReceiverId(id)
    fillAddressById(id, prefix); setErrors((e) => ({ ...e, [prefix]: '' }))
  }

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {}
    if (s === 0) { if (!form.senderName.trim()) e.sender = '请填写寄件人姓名'; if (!form.senderPhone.trim() && !e.sender) e.sender = '请填写寄件人手机'; if (!form.senderAddress.trim() && !e.sender) e.sender = '请填写寄件人地址' }
    else if (s === 1) { if (!form.receiverName.trim()) e.receiver = '请填写收件人姓名'; if (!form.receiverPhone.trim() && !e.receiver) e.receiver = '请填写收件人手机'; if (!form.receiverAddress.trim() && !e.receiver) e.receiver = '请填写收件人地址' }
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleNext = async () => {
    if (!validateStep(step)) return
    if (step === 1) await fetchEstimate({ origin: { province: form.senderProvince, city: form.senderCity, district: form.senderDistrict }, destination: { province: form.receiverProvince, city: form.receiverCity, district: form.receiverDistrict }, weight: form.weight, volume: form.volume })
    setStep((s) => s + 1)
  }
  const handlePrev = () => { setErrors({}); setStep((s) => Math.max(0, s - 1)) }
  const handleSubmit = async () => { const r = await createOrder(form); if (r) { setWaybillResult(r); setShowWaybill(true) } }
  const handleAddAddress = async () => {
    const e: Record<string, string> = {}
    if (!newAddr.name.trim()) e.name = '请输入姓名'
    if (!newAddr.phone.trim()) e.phone = '请输入手机号'
    else if (!/^\d{11}$/.test(newAddr.phone.trim())) e.phone = '手机号格式不正确'
    if (!newAddr.address.trim()) e.address = '请输入详细地址'
    setNewAddrErrors(e)
    if (Object.keys(e).length > 0) return
    setToast({ msg: '正在保存...', type: 'success' })
    await addAddress(newAddr)
    setShowAddAddress(null)
    setNewAddr({ name: '', phone: '', province: firstProv, city: firstCity, district: regionData[firstProv][firstCity][0], address: '', isDefault: false, tag: 'other' })
    setNewAddrErrors({})
    setToast({ msg: '地址保存成功！', type: 'success' })
    setTimeout(() => setToast(null), 2500)
  }

  const cityList = useMemo(() => Object.keys(regionData[newAddr.province] || {}), [newAddr.province])
  const districtList = useMemo(() => regionData[newAddr.province]?.[newAddr.city] || [], [newAddr.province, newAddr.city])
  const tierMap = useMemo(() => { const m: Record<string, { price: number; days: string }> = {}; estimateTiers.forEach((t) => { m[t.type] = { price: t.price, days: t.estimatedDays } }); return m }, [estimateTiers])
  const getPrice = (t: string) => tierMap[t] ? `¥${tierMap[t].price}` : defPrices[t]
  const getDays = (t: string) => tierMap[t]?.days || defDays[t]
  const selectedTier = tierMap[form.serviceType]
  const baseFee = selectedTier?.price || 0, volAdj = form.volume > 0.05 ? +(form.volume * 80).toFixed(2) : 0, totalFee = +(baseFee + volAdj + 2).toFixed(2)
  const maskPhone = (p: string) => p.length >= 11 ? p.slice(0, 3) + '****' + p.slice(7) : p
  const waybillNo = String(waybillResult?.waybillNo || '')
  const serviceTypes = ['economy', 'standard', 'express'].map((k) => ({ key: k, name: svcNames[k], desc: getDays(k), price: getPrice(k) }))

  const chipClass = (s: boolean) => `flex-shrink-0 text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${s ? 'bg-accent text-white border-accent' : 'bg-surface text-text-light border-gray-200 hover:bg-surface-dark'}`

  function AddressChips({ prefix }: { prefix: 'sender' | 'receiver' }) {
    const selId = prefix === 'sender' ? selectedSenderId : selectedReceiverId
    return (
      <div>
        <p className="text-xs text-text-light mb-2">从地址簿选择</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {addressBook.map((addr) => (
            <button key={addr.id} onClick={() => handleChipClick(addr.id, prefix)} className={chipClass(selId === addr.id)}>
              <span>{tagList.find((t) => t.key === addr.tag)?.icon || '📍'}</span>
              <span className="truncate max-w-[80px]">{addr.name}</span>
              {addr.isDefault && <span className={`text-[10px] px-1 rounded ${selId === addr.id ? 'bg-white/25' : 'bg-accent/15 text-accent'}`}>默认</span>}
            </button>
          ))}
          <button onClick={() => setShowAddAddress(prefix)} className="flex-shrink-0 text-xs px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 text-text-lighter hover:border-accent hover:text-accent transition-all flex items-center gap-1">
            <Plus className="w-3 h-3" /> 新建
          </button>
        </div>
      </div>
    )
  }

  const FieldIcon = ({ icon: Icon, pos = 'y' }: { icon: typeof User; pos?: 'y' | 't' }) => (
    <Icon className={`absolute left-3 w-4 h-4 text-text-lighter ${pos === 'y' ? 'top-1/2 -translate-y-1/2' : 'top-3'}`} />
  )

  function NavBtn(label: string, icon: typeof ChevronLeft, onClick: () => void, variant: 'primary' | 'outline', iconFirst = true, disabled = false) {
    const Icon = icon
    return (
      <button onClick={onClick} disabled={disabled} className={`${variant === 'primary' ? 'btn-primary' : 'btn-outline'} flex-1 flex items-center justify-center gap-1 disabled:opacity-50`}>
        {iconFirst && Icon && <Icon className="w-4 h-4" />}
        {label}
        {!iconFirst && Icon && <Icon className="w-4 h-4" />}
      </button>
    )
  }

  function renderBarcode(): ReactNode {
    const code = waybillNo || '123456789012'; const bars: ReactNode[] = []; let x = 5
    for (let i = 0; i < code.length * 3 + 10; i++) {
      const w = ((i * 7 + code.charCodeAt(i % code.length)) % 3 + 1) * 2
      const h = i % 5 === 0 ? 48 : i % 3 === 0 ? 36 : 42
      bars.push(<rect key={i} x={x} y={4} width={w} height={h} fill={i % 2 === 0 ? '#0F2B46' : 'transparent'} />); x += w + 1
    }
    return <svg className="w-full h-14" viewBox="0 0 300 56" preserveAspectRatio="none">{bars}<text x="150" y="54" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#0F2B46" letterSpacing="3">{waybillNo}</text></svg>
  }

  function renderQR(): ReactNode {
    const arr: ReactNode[] = []
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (((r * 13 + c * 7 + (r * c) % 5) % 3) < 2) arr.push(<rect key={`${r}-${c}`} x={6 + c * 11} y={6 + r * 11} width="9" height="9" fill="#0F2B46" rx="1" />)
    const corners = [[1, 1], [81, 1], [1, 81]]
    return (
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        {arr}
        {corners.map(([x, y], i) => (
          <g key={i}><rect x={x} y={y} width="18" height="18" fill="none" stroke="#0F2B46" strokeWidth="2" rx="2" /><rect x={x + 4} y={y + 4} width="10" height="10" fill="#0F2B46" rx="1" /></g>
        ))}
      </svg>
    )
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i <= step ? 'bg-accent text-white' : 'bg-gray-200 text-text-lighter'}`}>{i + 1}</div>
            <span className={`ml-1.5 text-xs truncate ${i <= step ? 'text-navy font-medium' : 'text-text-lighter'}`}>{s}</span>
            {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-accent' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <h3 className="section-title text-sm flex items-center gap-1.5"><User className="w-4 h-4 text-accent" /> 寄件人信息</h3>
          {addressBook.length > 0 && <AddressChips prefix="sender" />}
          {errors.sender && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{errors.sender}</p>}
          <div className="relative"><FieldIcon icon={User} /><input className="input-field pl-10" placeholder="姓名" value={form.senderName} onChange={(e) => setFormField('senderName', e.target.value)} /></div>
          <div className="relative"><FieldIcon icon={Phone} /><input className="input-field pl-10" placeholder="手机号" value={form.senderPhone} onChange={(e) => setFormField('senderPhone', e.target.value)} /></div>
          <div className="relative"><FieldIcon icon={MapPin} pos="t" /><textarea className="input-field pl-10 min-h-[72px] resize-none" placeholder="详细地址" value={form.senderAddress} onChange={(e) => setFormField('senderAddress', e.target.value)} /></div>
          {NavBtn('下一步', ChevronRight, handleNext, 'primary', false)}
        </div>
      )}

      {step === 1 && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <h3 className="section-title text-sm flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent" /> 收件人信息</h3>
          {addressBook.length > 0 && <AddressChips prefix="receiver" />}
          {errors.receiver && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{errors.receiver}</p>}
          <div className="relative"><FieldIcon icon={User} /><input className="input-field pl-10" placeholder="姓名" value={form.receiverName} onChange={(e) => setFormField('receiverName', e.target.value)} /></div>
          <div className="relative"><FieldIcon icon={Phone} /><input className="input-field pl-10" placeholder="手机号" value={form.receiverPhone} onChange={(e) => setFormField('receiverPhone', e.target.value)} /></div>
          <div className="relative"><FieldIcon icon={MapPin} pos="t" /><textarea className="input-field pl-10 min-h-[72px] resize-none" placeholder="详细地址" value={form.receiverAddress} onChange={(e) => setFormField('receiverAddress', e.target.value)} /></div>
          <div className="flex gap-3">{NavBtn('上一步', ChevronLeft, handlePrev, 'outline')}{NavBtn('下一步', ChevronRight, handleNext, 'primary', false)}</div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <h3 className="section-title text-sm flex items-center gap-1.5"><Package className="w-4 h-4 text-accent" /> 物品信息</h3>
          <p className="text-xs text-text-light mb-1">物品类别</p>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFormField('category', cat)} className={`py-2 text-xs rounded-lg border transition-all ${form.category === cat ? 'border-accent bg-accent/5 text-accent font-medium' : 'border-gray-200 text-text-light'}`}>{cat}</button>
            ))}
          </div>
          {[{ lbl: '重量', u: 'kg', v: form.weight, set: 'weight', mn: 0.1, mx: 20, st: 0.1 }, { lbl: '体积', u: 'm³', v: form.volume, set: 'volume', mn: 0.001, mx: 0.2, st: 0.001 }].map((f) => (
            <div key={f.lbl}>
              <div className="flex justify-between text-xs mb-1"><span className="text-text-light">{f.lbl}</span><span className="font-medium text-navy">{f.v}{f.u}</span></div>
              <input type="range" min={f.mn} max={f.mx} step={f.st} value={f.v} onChange={(e) => setFormField(f.set, parseFloat(e.target.value))} className="w-full" />
            </div>
          ))}
          <textarea className="input-field min-h-[56px] resize-none" placeholder="备注（选填）" value={form.remark} onChange={(e) => setFormField('remark', e.target.value)} />
          <h3 className="section-title text-sm pt-1">服务类型</h3>
          <div className="grid grid-cols-3 gap-2">
            {serviceTypes.map((svc) => (
              <button key={svc.key} onClick={() => setFormField('serviceType', svc.key)} className={`p-3 rounded-xl border text-center transition-all ${form.serviceType === svc.key ? 'border-accent bg-accent/5 shadow-sm' : 'border-gray-200'}`}>
                <p className={`text-sm font-bold ${form.serviceType === svc.key ? 'text-accent' : 'text-navy'}`}>{svc.name}</p>
                <p className="text-xs text-text-light mt-0.5">{svc.desc}</p>
                <p className="text-xs text-accent font-semibold mt-1">{svc.price}</p>
              </button>
            ))}
          </div>
          {estimateTiers.length > 0 && <p className="text-[11px] text-text-lighter text-center bg-surface rounded-lg py-2 px-3">计价依据：{form.weight}kg · {form.volume}m³ · 寄递距离估算</p>}
          <div className="flex gap-3">{NavBtn('上一步', ChevronLeft, handlePrev, 'outline')}{NavBtn('下一步', ChevronRight, handleNext, 'primary', false)}</div>
        </div>
      )}

      {step === 3 && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <h3 className="section-title text-sm flex items-center gap-1.5"><FileText className="w-4 h-4 text-accent" /> 确认订单</h3>
          <div className="space-y-3">
            {[{ label: '寄件人', name: form.senderName, phone: maskPhone(form.senderPhone), addr: form.senderAddress }, { label: '收件人', name: form.receiverName, phone: maskPhone(form.receiverPhone), addr: form.receiverAddress }].map((p) => (
              <div key={p.label} className="bg-surface rounded-lg p-3"><p className="text-xs text-text-light mb-1">{p.label}</p><p className="text-sm font-medium text-navy">{p.name} {p.phone}</p><p className="text-xs text-text-light mt-0.5">{p.addr}</p></div>
            ))}
            <div className="bg-surface rounded-lg p-3"><p className="text-xs text-text-light mb-1">物品信息</p><p className="text-sm font-medium text-navy">{form.category || '未选择'} · {form.weight}kg · {form.volume}m³</p>{form.remark && <p className="text-xs text-text-light mt-0.5">备注: {form.remark}</p>}</div>
            <div className="bg-surface rounded-lg p-3"><p className="text-xs text-text-light mb-1">服务类型</p><p className="text-sm font-bold text-accent">{svcNames[form.serviceType]} · {getDays(form.serviceType)}</p></div>
            <div className="bg-gradient-to-br from-accent/5 to-navy/5 rounded-lg p-4 border border-accent/10">
              <p className="text-sm font-bold text-navy mb-3">费用明细</p>
              <div className="space-y-2 text-xs">
                {[['基础运费', baseFee], ['体积重量附加', volAdj], ['跨区服务费', 2]].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between"><span className="text-text-light">{l}</span><span className="text-navy">¥{(v as number).toFixed(2)}</span></div>
                ))}
                <div className="border-t border-accent/20 pt-2 mt-2 flex justify-between items-center"><span className="text-sm font-bold text-navy">合计</span><span className="text-xl font-display font-bold text-accent">¥{totalFee.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {NavBtn('上一步', ChevronLeft, handlePrev, 'outline')}
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-1 disabled:opacity-50">{loading ? '提交中...' : '提交订单'} <Check className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {showAddAddress && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-6">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-navy">新建地址</h3><button onClick={() => setShowAddAddress(null)}><X className="w-5 h-5 text-text-lighter" /></button></div>
            <div className="space-y-3">
              <div className="relative"><FieldIcon icon={User} /><input className={`input-field pl-10 ${newAddrErrors.name ? 'border-red-400' : ''}`} placeholder="姓名" value={newAddr.name} onChange={(e) => { setNewAddr((p) => ({ ...p, name: e.target.value })); setNewAddrErrors((p) => ({ ...p, name: '' })) }} />{newAddrErrors.name && <p className="text-xs text-red-500 mt-1">{newAddrErrors.name}</p>}</div>
              <div className="relative"><FieldIcon icon={Phone} /><input className={`input-field pl-10 ${newAddrErrors.phone ? 'border-red-400' : ''}`} placeholder="手机号" value={newAddr.phone} onChange={(e) => { setNewAddr((p) => ({ ...p, phone: e.target.value })); setNewAddrErrors((p) => ({ ...p, phone: '' })) }} />{newAddrErrors.phone && <p className="text-xs text-red-500 mt-1">{newAddrErrors.phone}</p>}</div>
              {[{ v: newAddr.province, o: provinces, fn: (v: string) => setNewAddr((p) => ({ ...p, province: v, city: Object.keys(regionData[v])[0], district: regionData[v][Object.keys(regionData[v])[0]][0] })) }, { v: newAddr.city, o: cityList, fn: (v: string) => setNewAddr((p) => ({ ...p, city: v, district: regionData[p.province][v][0] })) }, { v: newAddr.district, o: districtList, fn: (v: string) => setNewAddr((p) => ({ ...p, district: v })) }].map((sel, i) => (
                <select key={i} className="input-field" value={sel.v} onChange={(e) => sel.fn(e.target.value)}>{sel.o.map((x) => <option key={x} value={x}>{x}</option>)}</select>
              ))}
              <textarea className={`input-field min-h-[64px] resize-none ${newAddrErrors.address ? 'border-red-400' : ''}`} placeholder="详细地址" value={newAddr.address} onChange={(e) => { setNewAddr((p) => ({ ...p, address: e.target.value })); setNewAddrErrors((p) => ({ ...p, address: '' })) }} />
              {newAddrErrors.address && <p className="text-xs text-red-500 -mt-1">{newAddrErrors.address}</p>}
              <div><p className="text-xs text-text-light mb-2">标签</p><div className="flex gap-2">{tagList.map((t) => (<button key={t.key} onClick={() => setNewAddr((p) => ({ ...p, tag: t.key }))} className={`flex-1 py-2 text-xs rounded-lg border transition-all ${newAddr.tag === t.key ? 'border-accent bg-accent/5 text-accent font-medium' : 'border-gray-200 text-text-light'}`}>{t.icon} {t.label}</button>))}</div></div>
              <label className="flex items-center gap-2 text-xs text-text-light"><input type="checkbox" checked={newAddr.isDefault} onChange={(e) => setNewAddr((p) => ({ ...p, isDefault: e.target.checked }))} />设为默认地址</label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={() => setShowAddAddress(null)} className="btn-outline flex-1">取消</button><button onClick={handleAddAddress} className="btn-primary flex-1">保存</button></div>
          </div>
        </div>
      )}

      {showWaybill && waybillResult && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md animate-slide-up my-6">
            <div className="bg-gradient-to-r from-navy to-accent rounded-t-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5" /></div><div><p className="font-bold text-sm">圆通速递</p><p className="text-[11px] text-white/70">YTO Express</p></div></div>
                <button onClick={() => setShowWaybill(false)}><X className="w-5 h-5 text-white/80" /></button>
              </div>
              <div className="text-center"><p className="text-[11px] text-white/70 mb-1">运单号码</p><p className="text-2xl font-display font-bold tracking-wider">{waybillNo}</p></div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-3 flex justify-center py-2">{renderBarcode()}</div>
              <div className="bg-surface rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="w-1.5 bg-accent rounded-full shrink-0 mt-1" />
                  <div className="flex-1 space-y-2">
                    {[{ lbl: '寄件人', n: form.senderName, p: maskPhone(form.senderPhone), a: form.senderAddress }, { lbl: '收件人', n: form.receiverName, p: maskPhone(form.receiverPhone), a: form.receiverAddress, border: true }].map((x, i) => (
                      <div key={i} className={x.border ? 'border-t border-gray-200/60 pt-2' : ''}><p className="text-[10px] text-text-lighter mb-0.5">{x.lbl}</p><p className="text-sm font-semibold text-navy">{x.n} · {x.p}</p><p className="text-[11px] text-text-light leading-relaxed">{x.a}</p></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ lbl: '物品信息', m: form.category || '未分类', s: `${form.weight}kg` }, { lbl: '服务类型', m: svcNames[form.serviceType], s: `¥${totalFee.toFixed(2)}` }].map((x) => (
                  <div key={x.lbl} className="bg-surface rounded-xl p-3 text-center"><p className="text-[10px] text-text-lighter mb-1">{x.lbl}</p><p className="text-xs font-medium text-navy">{x.m}</p><p className="text-[11px] text-accent font-semibold mt-0.5">{x.s}</p></div>
                ))}
              </div>
              <div className="flex justify-center"><div className="w-28 h-28 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center shadow-inner">{renderQR()}</div></div>
              <p className="text-[10px] text-center text-text-lighter">扫码关注物流动态</p>
            </div>
            <div className="px-5 pb-5 space-y-2">
              <button onClick={() => alert('正在生成电子面单PDF...')} className="btn-outline w-full flex items-center justify-center gap-2 py-2.5"><FileText className="w-4 h-4" /> 下载电子面单PDF</button>
              <button onClick={() => { setShowWaybill(false); navigate(`/track?q=${waybillNo}`) }} className="btn-outline w-full flex items-center justify-center gap-2 py-2.5"><Package className="w-4 h-4" /> 查看物流轨迹</button>
              <button onClick={() => setShowWaybill(false)} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"><Check className="w-4 h-4" /> 立即去支付</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium flex items-center gap-2 animate-slide-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <CheckCircle2 className="w-4 h-4" />{toast.msg}
        </div>
      )}
    </div>
  )
}
