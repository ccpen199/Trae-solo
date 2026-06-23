import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Upload, Check, ChevronRight, Eye, Send, Image,
  Sparkles, ArrowLeft, Briefcase, Home, Users, Building2,
  Package, Car, Wrench, GraduationCap, Heart, HeartHandshake,
  TrendingUp, MoreHorizontal, AlertCircle, Loader2,
  ShieldCheck, AlertTriangle, Clock, FileCheck, ArrowRight, Gauge, SearchX,
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

const STEPS = ['选择类目', '填写信息', '预览提交', '审核追踪']

const SENSITIVE_WORDS = ['代开发票', '虚假', '色情', '赌博', '贷款', '催收', '返利', '刷单', '高薪兼职', '保过']
const TRACK_STAGES = [
  { key: 'submitted', label: '提交成功', desc: '内容已投递到审核系统', icon: FileCheck, color: 'bg-emerald-500' },
  { key: 'first_review', label: '地市级初审', desc: '区县/市级管理员人工审核中', icon: ShieldCheck, color: 'bg-navy-500' },
  { key: 'second_review', label: '省级复审', desc: '疑似敏感内容进入复核队列', icon: Eye, color: 'bg-amber-500' },
  { key: 'published', label: '已发布', desc: '审核通过，内容已进入首页推荐流', icon: Sparkles, color: 'bg-emerald-600' },
]

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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [ocrRecognizedFields, setOcrRecognizedFields] = useState<Record<string, string>>({})
  const [submittedId, setSubmittedId] = useState<string | null>(null)

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
      setOcrRecognizedFields(autoFields)
      setFormData(prev => ({ ...prev, ...autoFields }))
      setFlashFields(new Set(Object.keys(autoFields)))
      setTimeout(() => setFlashFields(new Set()), 1500)
    }, 2000)
  }

  const riskInfo = useMemo(() => {
    const text = `${formData.title || ''} ${formData.description || ''}`
    const found = SENSITIVE_WORDS.filter(w => text.includes(w))
    const score = Math.min(100, 10 + found.length * 30 + (formData.description?.length < 5 ? 20 : 0))
    return { score, found }
  }, [formData.title, formData.description])

  const handleSubmit = async () => {
    if (!selectedCategory || !agreementChecked) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const resp = await api.posts.create({
        category: selectedCategory,
        title: formData.title,
        description: formData.description,
        price: formData.price ? Number(formData.price) : undefined,
        province: location.province,
        city: location.city,
        district: location.district,
      })
      const id = (resp && typeof resp === 'object' && (resp as { id?: string }).id) || `T${Date.now()}`
      setSubmittedId(id)
      setStep(4)
    } catch {
      setSubmitError('发布失败，请检查网络或稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCat = CATEGORIES.find(c => c.key === selectedCategory)
  const dynamicFields = selectedCategory ? CATEGORY_FIELD_SCHEMAS[selectedCategory] : []

  const maskedPhone = formData.phone ? formData.phone.slice(0, 3) + '****' + formData.phone.slice(-4) : ''
  const lastStage = TRACK_STAGES[TRACK_STAGES.length - 1]
  const LastStageIcon = lastStage.icon

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

            {ocrStatus === 'done' && Object.keys(ocrRecognizedFields).length > 0 && (
              <div className="mt-4 bg-white rounded-lg border border-emerald-200 overflow-hidden">
                <div className="bg-emerald-50 px-4 py-2.5 flex items-center gap-2 border-b border-emerald-100">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">OCR识别字段清单（已自动填入，可手动修改）</span>
                </div>
                <div className="divide-y divide-emerald-50">
                  {Object.entries(ocrRecognizedFields).map(([k, v]) => (
                    <div key={k} className="flex items-center px-4 py-2 text-xs">
                      <span className="w-20 text-slate-500">
                        {k === 'title' ? '标题' : k === 'price' ? '价格' : k === 'description' ? '描述' : k}
                      </span>
                      <span className="text-slate-700 font-medium flex-1 truncate">
                        {k === 'price' && v ? `¥${v}` : v}
                      </span>
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
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

          {(formData.title || formData.description) && (
            <div className={cn(
              'rounded-xl border p-4',
              riskInfo.score >= 60 ? 'border-amber-300 bg-amber-50'
                : riskInfo.score >= 30 ? 'border-amber-200 bg-amber-50/50'
                : 'border-emerald-200 bg-emerald-50/50'
            )}>
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                  riskInfo.score >= 60 ? 'bg-amber-500' : riskInfo.score >= 30 ? 'bg-amber-400' : 'bg-emerald-500'
                )}>
                  {riskInfo.score >= 60 ? <AlertTriangle className="w-5 h-5 text-white" /> : <Gauge className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      {riskInfo.score >= 60 ? '内容存在风险，建议修改'
                        : riskInfo.score >= 30 ? '内容质量一般，请补充'
                        : '内容质量良好'}
                    </span>
                    <span className="text-xs font-mono text-slate-500">风险分 {riskInfo.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        riskInfo.score >= 60 ? 'bg-amber-500' : riskInfo.score >= 30 ? 'bg-amber-400' : 'bg-emerald-500'
                      )}
                      style={{ width: `${riskInfo.score}%` }}
                    />
                  </div>
                </div>
              </div>
              {riskInfo.found.length > 0 && (
                <div className="pt-2 border-t border-current/10">
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    检测到敏感词：
                    {riskInfo.found.map((w, i) => (
                      <span key={w} className="font-mono font-bold ml-1">
                        {w}{i < riskInfo.found.length - 1 && '、'}
                      </span>
                    ))}
                    ，建议修改后再提交
                  </p>
                </div>
              )}
              {riskInfo.score < 30 && (
                <div className="pt-2 border-t border-current/10">
                  <p className="text-xs text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    内容合规，可直接进入审核流程
                  </p>
                </div>
              )}
            </div>
          )}

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
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">风控预检：</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full font-medium',
                  riskInfo.score >= 60 ? 'bg-amber-100 text-amber-700'
                    : riskInfo.score >= 30 ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-100 text-emerald-700'
                )}>
                  {riskInfo.score >= 60 ? '高风险' : riskInfo.score >= 30 ? '中风险' : '低风险'}
                </span>
                {riskInfo.found.length > 0 && (
                  <span className="text-amber-600">
                    含 {riskInfo.found.length} 个敏感词
                  </span>
                )}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={agreementChecked} onChange={e => setAgreementChecked(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-navy-800 focus:ring-navy-800" />
            <span className="text-sm text-slate-600">我已阅读并同意《信息发布协议》</span>
          </label>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-700 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              审核流程说明（正常工作日约 2 小时内完成）
            </div>
            <div className="flex items-start gap-2">
              {TRACK_STAGES.slice(0, -1).map((s, i) => {
                const SIcon = s.icon
                return (
                  <div key={s.key} className="flex items-start shrink-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${s.color} text-white`}>
                        <SIcon className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 text-center w-12">{s.label}</span>
                    </div>
                    <div className="flex items-center mt-3 mx-1">
                      {i < TRACK_STAGES.length - 2 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                    </div>
                  </div>
                )
              })}
              <div className="flex items-start shrink-0 ml-auto">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${lastStage.color} text-white`}>
                    <LastStageIcon className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 text-center w-12">{lastStage.label}</span>
                </div>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="btn-outline flex items-center gap-1.5" disabled={submitting}>
              <ArrowLeft className="w-4 h-4" />上一步
            </button>
            <button onClick={handleSubmit} disabled={!agreementChecked || submitting}
              className={cn('btn-accent flex items-center gap-1.5', (!agreementChecked || submitting) && 'opacity-50 cursor-not-allowed')}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? '提交中...' : '提交发布'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">发布成功！</h2>
          <p className="text-sm text-slate-500 mb-2">
            信息编号：<span className="font-mono text-slate-700">{submittedId}</span>
          </p>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            您发布的<span className="font-medium text-slate-700">「{formData.title}」</span>
            已进入审核流程，我们将在 2 小时内完成审核。
          </p>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {TRACK_STAGES.map((stage, i) => {
              const StageIcon = stage.icon
              const isActive = i <= 1
              const isCurrent = i === 1
              return (
                <div key={stage.key} className={cn('flex items-center gap-4 px-5 py-4', i < TRACK_STAGES.length - 1 && 'border-b border-slate-100')}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    isActive ? stage.color : 'bg-slate-200'
                  )}>
                    <StageIcon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', isActive ? 'text-slate-800' : 'text-slate-400')}>
                        {stage.label}
                      </span>
                      {isCurrent && (
                        <span className="badge badge-info text-[10px]">进行中</span>
                      )}
                    </div>
                    <p className={cn('text-xs mt-0.5', isActive ? 'text-slate-500' : 'text-slate-400')}>
                      {isActive ? stage.desc : '等待中...'}
                    </p>
                  </div>
                  {isActive && i === 0 && (
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Link to={`/list/${submittedId}`} className="btn-outline flex items-center justify-center gap-1.5">
              <Eye className="w-4 h-4" />
              查看详情
            </Link>
            <Link to={`/list?category=${selectedCategory}`} className="btn-accent flex items-center justify-center gap-1.5">
              <ArrowRight className="w-4 h-4" />
              返回列表
            </Link>
          </div>
          <button onClick={() => { setStep(1); setOcrImage(false); setOcrStatus('idle'); setOcrRecognizedFields({}); setFormData({ title: '', price: '', description: '', phone: '' }); setSubmittedId(null); }} className="mt-3 text-sm text-slate-400 hover:text-slate-600">
            继续发布新信息
          </button>
          </div>
        </div>
      )}
    </div>
  )
}
