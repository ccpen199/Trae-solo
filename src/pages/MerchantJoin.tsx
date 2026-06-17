import { useState, useRef } from 'react'
import { Upload, ChevronLeft, ChevronRight, Check, AlertCircle, FileText, Image, Clock, Tag, CheckCircle2 } from 'lucide-react'
import { applyMerchant } from '@/utils/api'

const STEPS = ['基本信息', '资质上传', '营业时间', '优惠标签']
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const PRESET_TAGS = ['满100减20', '新人首单立减', '双人同行8折', '下午茶特惠', '周末狂欢', '会员专享', '限时折扣', '第二件半价']
const STREETS = ['方松街道', '中山街道', '岳阳街道', '永丰街道', '广富林街道', '九里亭街道', '泗泾镇', '佘山镇', '车墩镇', '新桥镇']

export default function MerchantJoin() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '', category: 'food', street: '', address: '', phone: '',
    license: null as File | null, permit: null as File | null, facade: null as File | null,
    licensePreview: '', permitPreview: '', facadePreview: '',
    hours: DAYS.map(() => ({ start: '09:00', end: '22:00', closed: false })),
    tags: [] as string[], customTag: '',
  })

  const updateField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const updateHours = (i: number, field: 'start' | 'end' | 'closed', val: string | boolean) =>
    setForm((prev) => {
      const hours = [...prev.hours]
      hours[i] = { ...hours[i], [field]: val }
      return { ...prev, hours }
    })

  const toggleTag = (tag: string) =>
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))

  const handleFileUpload = (key: 'license' | 'permit' | 'facade', file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      updateField(`${key}Preview` as any, e.target?.result as string)
    }
    reader.readAsDataURL(file)
    updateField(key, file)
  }

  const validateStep = (): string[] => {
    const errs: string[] = []
    if (step === 0) {
      if (!form.name.trim()) errs.push('请输入商户名称')
      if (!form.street) errs.push('请选择所在街道')
      if (!form.address.trim()) errs.push('请输入详细地址')
      if (!form.phone.trim()) errs.push('请输入联系电话')
      else if (!/^1[3-9]\d{9}$/.test(form.phone.trim()) && !/^\d{3,4}-?\d{7,8}$/.test(form.phone.trim())) {
        errs.push('请输入有效的联系电话')
      }
    } else if (step === 1) {
      if (!form.license) errs.push('请上传营业执照')
      if (!form.permit) errs.push('请上传经营许可证')
      if (!form.facade) errs.push('请上传门头照')
    } else if (step === 2) {
      const allClosed = form.hours.every((h) => h.closed)
      if (allClosed) errs.push('至少选择一天营业时间')
      const invalidHours = form.hours.filter((h) => !h.closed && h.start >= h.end)
      if (invalidHours.length > 0) errs.push('营业开始时间必须早于结束时间')
    }
    return errs
  }

  const nextStep = () => {
    const errs = validateStep()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    const errs = validateStep()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('category', form.category)
      formData.append('street', form.street)
      formData.append('address', form.address)
      formData.append('phone', form.phone)
      formData.append('lng', '121.22')
      formData.append('lat', '31.03')
      formData.append('description', '')
      if (form.license) formData.append('license', form.license)
      if (form.permit) formData.append('permit', form.permit)
      if (form.facade) formData.append('facade', form.facade)
      formData.append('business_hours', JSON.stringify(
        form.hours.map((h, i) => ({
          day_of_week: i + 1 > 6 ? 0 : i + 1,
          open_time: h.closed ? '' : h.start,
          close_time: h.closed ? '' : h.end,
          closed: h.closed,
        }))
      ))
      formData.append('tags', JSON.stringify(form.tags))

      await applyMerchant(formData)
      setSubmitted(true)
    } catch (e: any) {
      setErrors([e.message || '提交失败，请重试'])
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 pb-20 animate-fade-in text-center">
        <div className="w-20 h-20 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-secondary" />
        </div>
        <h2 className="font-serif-title text-2xl font-bold mb-3">入驻申请已提交</h2>
        <p className="text-gray-500 mb-2">您的商户入驻申请已成功提交，我们将在1-3个工作日内完成审核。</p>
        <p className="text-gray-400 text-sm mb-8">审核结果将通过短信通知您，请保持电话畅通。</p>
        <div className="card p-5 text-left space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-gray-500">商户名称：</span>
            <span className="font-medium">{form.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-gray-500">资质状态：</span>
            <span className="text-secondary font-medium">已上传，待核验</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-gray-500">营业时间：</span>
            <span className="font-medium">
              {form.hours.filter((h) => !h.closed).length}天营业
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-gray-500">优惠标签：</span>
            <span className="font-medium">{form.tags.length}个</span>
          </div>
        </div>

        <div className="card p-4 text-left mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">提交与复查链路</h4>
          <div className="space-y-2">
            {[
              { step: '基本信息提交', status: 'done', desc: `商户名·分类·街道·地址·电话 已提交` },
              { step: '资质证照上传', status: 'done', desc: `营业执照${form.license ? '✓' : '✗'} · 经营许可证${form.permit ? '✓' : '✗'} · 门头照${form.facade ? '✓' : '✗'}` },
              { step: '营业时间配置', status: 'done', desc: `${form.hours.filter((h) => !h.closed).length}天营业时间已设定` },
              { step: '优惠标签配置', status: 'done', desc: `${form.tags.length}个标签已提交` },
              { step: '资质核验审核', status: 'pending', desc: '1-3工作日内完成 · 审核人/审核时间/证照编号/有效期将记录' },
              { step: '审核结果通知', status: 'waiting', desc: '通过→上线营业 / 驳回→查看驳回原因→修改重新提交' },
            ].map((item, i, arr) => (
              <div key={i} className="flex items-start gap-2 relative">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                  item.status === 'done' ? 'bg-secondary text-white' : item.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {item.status === 'done' ? '✓' : i + 1}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-xs font-medium text-gray-800">{item.step}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                {i < arr.length - 1 && <div className="absolute left-2.5 top-5 w-px h-full bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>

        {form.licensePreview && (
          <div className="card p-4 text-left mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">门头照核验预览</h4>
            <div className="grid grid-cols-3 gap-2">
              {form.facadePreview && (
                <div className="relative rounded-md overflow-hidden aspect-[3/2] border border-gray-200">
                  <img src={form.facadePreview} alt="门头照" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-secondary/90 text-[9px] text-white">门头照·已上传</span>
                </div>
              )}
              {form.licensePreview && (
                <div className="relative rounded-md overflow-hidden aspect-[3/2] border border-gray-200">
                  <img src={form.licensePreview} alt="营业执照" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-yellow-500/90 text-[9px] text-white">营业执照·待核验</span>
                </div>
              )}
              {form.permitPreview && (
                <div className="relative rounded-md overflow-hidden aspect-[3/2] border border-gray-200">
                  <img src={form.permitPreview} alt="经营许可证" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-yellow-500/90 text-[9px] text-white">许可证·待核验</span>
                </div>
              )}
            </div>
          </div>
        )}

        <a href="/" className="btn-primary inline-block">返回首页</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 animate-fade-in">
      <h1 className="section-title mb-6">商户入驻</h1>

      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i < step ? 'bg-secondary text-white' : i === step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`ml-2 text-xs hidden sm:inline ${i <= step ? 'text-primary font-medium' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-secondary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-danger-50 text-danger text-sm rounded-lg space-y-1">
          {errors.map((e, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">商户名称 <span className="text-danger">*</span></label>
            <input className="input-field" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="请输入商户名称" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">分类 <span className="text-danger">*</span></label>
            <select className="input-field" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
              <option value="food">餐饮</option>
              <option value="entertainment">娱乐</option>
              <option value="leisure">休闲</option>
              <option value="shopping">商超</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">所在街道 <span className="text-danger">*</span></label>
            <select className="input-field" value={form.street} onChange={(e) => updateField('street', e.target.value)}>
              <option value="">请选择街道</option>
              {STREETS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">详细地址 <span className="text-danger">*</span></label>
            <input className="input-field" value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="松江区XXX路XXX号" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">联系电话 <span className="text-danger">*</span></label>
            <input className="input-field" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="手机号或固话" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <p className="text-xs text-gray-400 mb-2">请上传以下资质文件，支持 JPG/PNG 格式，审核将在1-3个工作日内完成</p>
          {([
            { key: 'license' as const, label: '营业执照', required: true, desc: '三证合一或营业执照正本' },
            { key: 'permit' as const, label: '经营许可证', required: true, desc: '食品经营许可证/卫生许可证等' },
            { key: 'facade' as const, label: '门头照', required: true, desc: '商户门头实景照片' },
          ] as const).map(({ key, label, required, desc }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">
                {label} {required && <span className="text-danger">*</span>}
              </label>
              <p className="text-xs text-gray-400 mb-2">{desc}</p>
              {form[`${key}Preview` as keyof typeof form] ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
                  <img src={form[`${key}Preview` as keyof typeof form] as string} alt={label} className="w-full h-full object-cover" />
                  <button
                    onClick={() => { updateField(key, null); updateField(`${key}Preview` as any, '') }}
                    className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
                  >
                    重新上传
                  </button>
                  <div className="absolute bottom-2 left-2 bg-secondary/90 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />已上传
                  </div>
                </div>
              ) : (
                <label className="card flex flex-col items-center justify-center h-32 cursor-pointer hover:border-primary/30 border-dashed border-2">
                  <Upload className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-sm text-gray-400">点击上传{label}</span>
                  <span className="text-xs text-gray-300 mt-1">JPG/PNG, 最大5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(key, e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 mb-2">设置每周营业时间，休息日可不设置</p>
          {DAYS.map((day, i) => (
            <div key={day} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="w-12 text-sm font-medium">{day}</span>
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hours[i].closed}
                  onChange={(e) => updateHours(i, 'closed', e.target.checked)}
                  className="accent-primary rounded"
                />
                <span className="text-gray-400 text-xs">休息</span>
              </label>
              {!form.hours[i].closed && (
                <>
                  <input type="time" className="input-field w-28 text-sm" value={form.hours[i].start} onChange={(e) => updateHours(i, 'start', e.target.value)} />
                  <span className="text-gray-400 text-sm">~</span>
                  <input type="time" className="input-field w-28 text-sm" value={form.hours[i].end} onChange={(e) => updateHours(i, 'end', e.target.value)} />
                </>
              )}
            </div>
          ))}
          <div className="mt-4 p-3 bg-primary-50 rounded-lg text-xs text-primary">
            <p className="font-medium mb-1">营业时间预览</p>
            <p className="text-gray-500">
              {form.hours.map((h, i) => {
                if (h.closed) return `${DAYS[i]}休息`
                return `${DAYS[i]} ${h.start}-${h.end}`
              }).join(' / ')}
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400 mb-2">选择优惠标签可提升商户曝光度，最多选择5个标签</p>
          <div>
            <label className="block text-sm font-medium mb-2">选择预设标签</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (form.tags.includes(tag)) toggleTag(tag)
                    else if (form.tags.length < 5) toggleTag(tag)
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    form.tags.includes(tag)
                      ? 'bg-primary text-white'
                      : form.tags.length >= 5
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">自定义标签</label>
            <div className="flex gap-2">
              <input className="input-field flex-1" value={form.customTag} onChange={(e) => updateField('customTag', e.target.value)} placeholder="输入自定义标签" />
              <button
                className="btn-outline text-sm"
                onClick={() => {
                  if (form.customTag.trim() && form.tags.length < 5) { toggleTag(form.customTag.trim()); updateField('customTag', '') }
                }}
              >
                添加
              </button>
            </div>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span key={tag} className="badge-tag cursor-pointer" onClick={() => toggleTag(tag)}>
                  {tag} ✕
                </span>
              ))}
            </div>
          )}

          <div className="card p-4 mt-6 space-y-2 text-sm">
            <h3 className="font-semibold text-gray-700">提交信息确认</h3>
            <div className="flex justify-between text-gray-500">
              <span>商户名称</span><span className="text-gray-700">{form.name || '未填写'}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>所在街道</span><span className="text-gray-700">{form.street || '未选择'}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>资质文件</span>
              <span className={form.license && form.permit ? 'text-secondary' : 'text-danger'}>
                {form.license && form.permit ? '已上传' : '未上传'}
              </span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>门头照</span>
              <span className={form.facade ? 'text-secondary' : 'text-danger'}>{form.facade ? '已上传' : '未上传'}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>营业天数</span><span className="text-gray-700">{form.hours.filter((h) => !h.closed).length}天</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>优惠标签</span><span className="text-gray-700">{form.tags.length}个</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={() => { setErrors([]); setStep((s) => s - 1) }}
          disabled={step === 0}
          className="btn-outline flex items-center gap-1 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> 上一步
        </button>
        {step < 3 ? (
          <button onClick={nextStep} className="btn-primary flex items-center gap-1">
            下一步 <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="btn-accent flex items-center gap-1 disabled:opacity-50">
            {submitting ? '提交中...' : <><Check className="w-4 h-4" /> 提交申请</>}
          </button>
        )}
      </div>
    </div>
  )
}
