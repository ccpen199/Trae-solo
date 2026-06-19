import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Upload, Check, ChevronRight, Eye, Send, Image,
  Sparkles, ArrowLeft, Briefcase, Home, Users, Building2,
  Package, Car, Wrench, GraduationCap, Heart, HeartHandshake,
  TrendingUp, MoreHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/utils/api'
import { CATEGORIES, CATEGORY_FIELD_SCHEMAS, type CategoryType } from '@/types'
import type { GeoRegion } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase, Home, Users, Building2, Package, Car,
  Wrench, GraduationCap, Heart, HeartHandshake,
  TrendingUp, MoreHorizontal,
}

const STEPS = ['选择类目', '填写信息', '预览提交']

const inputClass = 'w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-navy-800 focus:ring-1 focus:ring-navy-800 outline-none transition'
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

export default function Publish() {
  const { category } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({ title: '', price: '', description: '', phone: '' })
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'uploading' | 'recognizing' | 'done'>('idle')
  const [ocrImage, setOcrImage] = useState(false)
  const [agreementChecked, setAgreementChecked] = useState(false)
  const [provinces, setProvinces] = useState<GeoRegion[]>([])
  const [cities, setCities] = useState<GeoRegion[]>([])
  const [districts, setDistricts] = useState<GeoRegion[]>([])
  const [location, setLocation] = useState({ province: '', city: '', district: '' })
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (category && CATEGORIES.some(c => c.key === category)) {
      setSelectedCategory(category as CategoryType)
      setStep(2)
    }
  }, [category])

  useEffect(() => { api.geo.regions().then(setProvinces).catch(() => {}) }, [])
  useEffect(() => {
    const p = provinces.find(p => p.name === location.province)
    if (p) api.geo.regions(p.code).then(setCities).catch(() => {})
    else setCities([])
    if (location.province) setLocation(prev => ({ ...prev, city: '', district: '' }))
  }, [location.province, provinces])
  useEffect(() => {
    const c = cities.find(c => c.name === location.city)
    if (c) api.geo.regions(c.code).then(setDistricts).catch(() => {})
    else setDistricts([])
    if (location.city) setLocation(prev => ({ ...prev, district: '' }))
  }, [location.city, cities])

  const selectCategory = (key: CategoryType) => {
    setSelectedCategory(key)
    setStep(2)
  }

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const simulateOcr = () => {
    setOcrImage(true)
    setOcrStatus('recognizing')
    setTimeout(() => {
      setOcrStatus('done')
      const autoFields: Record<string, string> = { title: '精装修两室一厅 出租', price: '3500', description: '靠近地铁站，家电齐全，拎包入住' }
      setFormData(prev => ({ ...prev, ...autoFields }))
      setFlashFields(new Set(Object.keys(autoFields)))
      setTimeout(() => setFlashFields(new Set()), 1500)
    }, 2000)
  }

  const handleSubmit = async () => {
    if (!selectedCategory || !agreementChecked) return
    try {
      await api.posts.create({
        category: selectedCategory,
        title: formData.title,
        description: formData.description,
        price: formData.price ? Number(formData.price) : undefined,
        province: location.province,
        city: location.city,
        district: location.district,
      })
      navigate('/list')
    } catch { alert('发布失败，请稍后重试') }
  }

  const selectedCat = CATEGORIES.find(c => c.key === selectedCategory)
  const dynamicFields = selectedCategory ? CATEGORY_FIELD_SCHEMAS[selectedCategory] : []

  const maskedPhone = formData.phone ? formData.phone.slice(0, 3) + '****' + formData.phone.slice(-4) : ''

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => {
          const n = i + 1
          const isCompleted = n < step
          const isActive = n === step
          return (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                  isCompleted && 'bg-emerald-500 text-white',
                  isActive && 'bg-navy-800 text-white',
                  !isActive && !isCompleted && 'bg-slate-200 text-slate-500'
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : n}
                </div>
                <span className={cn('text-xs mt-1.5', isActive ? 'text-navy-800 font-medium' : 'text-slate-500')}>{label}</span>
              </div>
              {n < 3 && <div className={cn('flex-1 h-0.5 mx-3 mt-[-18px]', n < step ? 'bg-emerald-500' : 'bg-slate-200')} />}
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            const Icon = ICON_MAP[cat.icon] || MoreHorizontal
            const isSelected = selectedCategory === cat.key
            return (
              <button key={cat.key} onClick={() => selectCategory(cat.key)}
                className={cn(
                  'relative card flex flex-col items-center justify-center gap-3 p-6 rounded-xl transition-all duration-200',
                  'hover:scale-105 hover:shadow-lg cursor-pointer',
                  isSelected ? 'ring-2 ring-navy-800 shadow-lg' : 'border border-slate-200'
                )}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                  <Icon className="w-7 h-7" style={{ color: cat.color }} />
                </div>
                <span className="text-sm font-medium text-slate-700">{cat.label}</span>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-navy-800 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-6">
            <div className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              ocrImage ? 'border-emerald-300' : 'border-slate-300 hover:border-navy-400'
            )} onClick={!ocrImage ? simulateOcr : undefined}>
              {ocrImage ? (
                <div className="space-y-3">
                  <Image className="w-12 h-12 mx-auto text-emerald-500" />
                  {ocrStatus === 'recognizing' && (
                    <p className="text-sm text-slate-500 animate-pulse">识别中...</p>
                  )}
                  {ocrStatus === 'done' && (
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">识别完成！已自动填充以下字段</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">拖拽或点击上传图片，OCR自动识别</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>标题 <span className="text-red-500">*</span></label>
              <input className={cn(inputClass, flashFields.has('title') && 'border-accent-500 ring-1 ring-accent-500')} value={formData.title} onChange={e => updateField('title', e.target.value)} placeholder="请输入标题" />
            </div>
            <div>
              <label className={labelClass}>价格 <span className="text-red-500">*</span></label>
              <input type="number" className={cn(inputClass, flashFields.has('price') && 'border-accent-500 ring-1 ring-accent-500')} value={formData.price} onChange={e => updateField('price', e.target.value)} placeholder="请输入价格" />
            </div>
            <div>
              <label className={labelClass}>描述 <span className="text-red-500">*</span></label>
              <textarea className={cn(inputClass, 'h-32 resize-none', flashFields.has('description') && 'border-accent-500 ring-1 ring-accent-500')} value={formData.description} onChange={e => updateField('description', e.target.value)} placeholder="请详细描述" />
            </div>

            {dynamicFields.map(field => (
              <div key={field.key}>
                <label className={labelClass}>{field.label} <span className="text-red-500">*</span></label>
                {field.type === 'select' ? (
                  <select className={inputClass} value={formData[field.key] || ''} onChange={e => updateField(field.key, e.target.value)}>
                    <option value="">请选择</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={field.type === 'number' ? 'number' : 'text'} className={inputClass} value={formData[field.key] || ''} onChange={e => updateField(field.key, e.target.value)} placeholder={`请输入${field.label}`} />
                )}
              </div>
            ))}

            <div>
              <label className={labelClass}>所在地区 <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select className={cn(inputClass, 'flex-1')} value={location.province} onChange={e => setLocation(prev => ({ province: e.target.value, city: '', district: '' }))}>
                  <option value="">选择省份</option>
                  {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                </select>
                <select className={cn(inputClass, 'flex-1')} value={location.city} onChange={e => setLocation(prev => ({ ...prev, city: e.target.value, district: '' }))}>
                  <option value="">选择城市</option>
                  {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
                <select className={cn(inputClass, 'flex-1')} value={location.district} onChange={e => setLocation(prev => ({ ...prev, district: e.target.value }))}>
                  <option value="">选择区县</option>
                  {districts.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>联系电话 <span className="text-red-500">*</span></label>
              <input className={inputClass} value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="请输入联系电话" />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="btn-outline flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" />上一步</button>
            <button onClick={() => setStep(3)} className="btn-accent flex items-center gap-1.5">下一步<ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: selectedCat?.color }}>{selectedCat?.label}</span>
              <Eye className="w-4 h-4 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{formData.title || '未填写标题'}</h2>
            <p className="text-xl font-bold text-accent-600">{formData.price ? `¥${formData.price}` : '价格未填'}</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{formData.description || '未填写描述'}</p>
            {dynamicFields.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {dynamicFields.map(field => formData[field.key] && (
                  <div key={field.key} className="text-sm">
                    <span className="text-slate-500">{field.label}：</span>
                    <span className="text-slate-800 font-medium">{formData[field.key]}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 text-sm text-slate-500">
              📍 {[location.province, location.city, location.district].filter(Boolean).join(' / ') || '未选择地区'}
            </div>
            <div className="text-sm text-slate-500">
              📞 {maskedPhone || '未填写电话'}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={agreementChecked} onChange={e => setAgreementChecked(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-navy-800 focus:ring-navy-800" />
            <span className="text-sm text-slate-600">我已阅读并同意《信息发布协议》</span>
          </label>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="btn-outline flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" />上一步</button>
            <button onClick={handleSubmit} disabled={!agreementChecked}
              className={cn('btn-accent flex items-center gap-1.5', !agreementChecked && 'opacity-50 cursor-not-allowed')}>
              <Send className="w-4 h-4" />提交发布
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
