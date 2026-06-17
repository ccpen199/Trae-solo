import { useState, useRef } from 'react'
import { Upload, ChevronLeft, ChevronRight, Check, AlertCircle, FileText, Image, Clock, Tag, CheckCircle2, CheckCircle, XCircle, History } from 'lucide-react'
import { applyMerchant } from '@/utils/api'

const STEPS = ['基本信息', '资质上传', '营业时间', '优惠标签']
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const PRESET_TAGS = ['满100减20', '新人首单立减', '双人同行8折', '下午茶特惠', '周末狂欢', '会员专享', '限时折扣', '第二件半价']
const STREETS = ['方松街道', '中山街道', '岳阳街道', '永丰街道', '广富林街道', '九里亭街道', '泗泾镇', '佘山镇', '车墩镇', '新桥镇']

export default function MerchantJoin() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showRejectDemo, setShowRejectDemo] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '', category: 'food', street: '', address: '', phone: '',
    license: null as File | null, permit: null as File | null, facade: null as File | null,
    licensePreview: '', permitPreview: '', facadePreview: '',
    licenseNo: '', licenseExpire: '',
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

  const handleDemoAll = () => {
    setForm((prev) => ({
      ...prev,
      name: '示例商户·松江烤肉店',
      category: 'food',
      street: '方松街道',
      address: '方松路128号',
      phone: '13800138000',
      licenseNo: '91310117MA1FL8X62D',
      licenseExpire: '2028-06-30',
      tags: ['满100减20', '周末狂欢'],
      licensePreview: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20license%20document%20Chinese%20official%20red%20stamp&image_size=landscape_4_3',
      permitPreview: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=food%20business%20permit%20document%20Chinese&image_size=landscape_4_3',
      facadePreview: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=restaurant%20storefront%20signage%20Chinese%20bbq%20shop&image_size=landscape_16_9',
      hours: DAYS.map(() => ({ start: '10:00', end: '22:00', closed: false })),
    }))
    setErrors([])
    setSubmitted(true)
  }

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
      if (!form.licenseNo.trim()) errs.push('请输入营业执照编号')
      if (!form.licenseExpire) errs.push('请选择营业执照有效期')
      else if (new Date(form.licenseExpire) < new Date()) errs.push('营业执照已过期，请重新办理后再申请')
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
              { step: '资质核验审核', status: 'pending', desc: '1-3工作日内完成 · 审核人将逐项核验门头照/营业执照/经营许可证/营业时间/优惠标签共5项内容，每项独立留痕' },
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

        <div className="card p-4 text-left mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">逐项审核回写状态</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Image className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">门头照</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-50 text-secondary border border-secondary-200">✓审核通过（如不合格将驳回，需重新上传清晰门头照）</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>审核人：运营-赵经理</span>
                  <span>审核时间：2026-06-18</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">营业执照</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-50 text-secondary border border-secondary-200">✓已核验（如过期将驳回，需更新有效期）</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                  <span>证照编号：{form.licenseNo || '91310117MA1FL8X62D'}</span>
                  <span>有效期：{form.licenseExpire || '2028-06-30'}</span>
                  <span>审核人：运营-赵经理</span>
                  <span>审核时间：2026-06-18</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">经营许可证</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-50 text-secondary border border-secondary-200">✓已核验（如经营范围不符将驳回，需补充对应许可证）</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>审核人：运营-赵经理</span>
                  <span>审核时间：2026-06-18</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">营业时间</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-50 text-secondary border border-secondary-200">✓已审核（如设置不合理将驳回，需调整营业时间）</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>审核人：运营-赵经理</span>
                  <span>审核时间：2026-06-18</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">优惠标签</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-50 text-secondary border border-secondary-200">✓已审核（如标签违规将驳回，需修改或删除违规标签）</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>审核人：运营-赵经理</span>
                  <span>审核时间：2026-06-18</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 text-left mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <History className="w-4 h-4 text-primary" />
            变更复查留痕
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-secondary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-3 h-3 text-secondary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">2026-06-22 营业时间变更</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-50 text-secondary border border-secondary-200">✓审批通过</span>
                </div>
                <p className="text-[11px] text-gray-500">原10:00-21:00 → 新09:30-22:30</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-3 h-3 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">2026-06-25 优惠标签新增</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-50 text-yellow-600 border border-yellow-200">⏳审核中</span>
                </div>
                <p className="text-[11px] text-gray-500">新增"学生特惠""下午茶"</p>
              </div>
            </div>
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

        <div className="card p-4 text-left mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <XCircle className="w-4 h-4 text-danger" />
              审核驳回→修改重审链路演示
            </h4>
            <button
              onClick={() => setShowRejectDemo(!showRejectDemo)}
              className={`px-2 py-0.5 rounded text-[10px] border ${
                showRejectDemo
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-primary border-primary/30 hover:bg-primary-50'
              }`}
            >
              {showRejectDemo ? '收起演示' : '查看驳回→重审链路'}
            </button>
          </div>

          {showRejectDemo && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
                <p className="text-[11px] font-medium text-danger mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  审核驳回通知（示例）
                </p>
                <p className="text-[10px] text-gray-700">驳回原因：营业执照照片模糊，关键信息（统一社会信用代码）无法识别；门头照未显示完整招牌。</p>
                <p className="text-[10px] text-gray-500 mt-1">驳回时间：2026-03-08 15:22 · 审核人：李审核</p>
              </div>

              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-[11px] font-medium text-yellow-700 mb-1">修改动作（示例）</p>
                <ul className="text-[10px] text-gray-700 space-y-0.5 list-disc pl-4">
                  <li>重新上传清晰的营业执照照片</li>
                  <li>重新拍摄包含完整招牌的门头照</li>
                  <li>补充说明：已重新拍摄，确保证照信息清晰可辨</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-secondary-50 border border-secondary-200">
                <p className="text-[11px] font-medium text-secondary mb-1">第2次提交·审核通过（示例）</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-700">
                  <div>审核时间：2026-03-12 10:30</div>
                  <div>审核人：张审核</div>
                  <div>核验专用章：SJ{String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}</div>
                  <div>档案号：SJ-{String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}-{form.street || 'songjiang'}</div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 pt-1 border-t border-secondary-200/50">
                  审核结论：资质齐全，证照清晰，通过核验。商户正式上线。
                </p>
              </div>

              <div className="space-y-1.5 pl-1">
                {[
                  { t: '首次提交', s: 'pending', d: '2026-03-05 09:10' },
                  { t: '审核驳回', s: 'rejected', d: '2026-03-08 15:22 · 原因：证照模糊' },
                  { t: '修改重提', s: 'pending', d: '2026-03-10 14:30' },
                  { t: '核验通过', s: 'approved', d: '2026-03-12 10:30 · 上线营业' },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2 relative">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${
                      r.s === 'approved' ? 'bg-secondary-50' : r.s === 'rejected' ? 'bg-danger-50' : 'bg-yellow-50'
                    }`}>
                      {r.s === 'approved' ? <CheckCircle className="w-2.5 h-2.5 text-secondary" /> :
                       r.s === 'rejected' ? <XCircle className="w-2.5 h-2.5 text-danger" /> :
                       <Clock className="w-2.5 h-2.5 text-yellow-500" />}
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-[11px] font-medium text-gray-800">{r.t}</p>
                      <p className="text-[10px] text-gray-500">{r.d}</p>
                    </div>
                    {i < 3 && <div className="absolute left-[7px] top-4 w-px h-full bg-gray-200" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showRejectDemo && (
            <p className="text-[10px] text-gray-500">
              若资质材料不符合要求，运营将在1-3个工作日内发送驳回通知，您可修改后重新提交，直至审核通过。
            </p>
          )}
        </div>

        <a href="/" className="btn-primary inline-block">返回首页</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 animate-fade-in">
      <h1 className="section-title mb-6">商户入驻</h1>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center flex-1">
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
        <div className="ml-4 flex flex-col items-end gap-1 flex-shrink-0">
          <button
            onClick={handleDemoAll}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold shadow-md hover:bg-accent/90 transition-colors"
          >
            一键演示全流程
          </button>
          <span className="text-[10px] text-gray-400">点击可跳过表单，直接查看审核回写状态</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] text-gray-400">快速预览：</span>
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => { setErrors([]); setStep(i) }}
            className={`px-2 py-0.5 rounded text-[11px] border border-dashed transition-colors ${
              i === step
                ? 'text-primary border-primary/40 bg-primary-50'
                : 'text-gray-400 border-gray-300 hover:text-gray-600 hover:border-gray-400'
            }`}
          >
            {i + 1}{s}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 mb-4">点击步骤名可快速预览 · 填写完整后提交进入审核链路</p>

      <div className="card p-4 text-left mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <History className="w-4 h-4 text-primary" />
          入驻全链路 · 资质上传→驳回/通过→变更复查
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-3 h-3 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-700">① 资质上传阶段</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-50 text-yellow-600 border border-yellow-200">pending</span>
              </div>
              <p className="text-[11px] text-gray-500">上传门头照、营业执照、经营许可证 → 系统自动校验完整性</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-3 h-3 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-700">② 审核阶段</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 border border-gray-200">approved / rejected</span>
              </div>
              <p className="text-[11px] text-gray-500">运营审核资质，可能通过或驳回，驳回时附带原因</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-700">③ 变更复查阶段</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 border border-gray-200">change_approved</span>
              </div>
              <p className="text-[11px] text-gray-500">营业时间/标签变更申请，审批通过后生效，全部留痕可复查</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
          填写完成后点击"提交入驻申请"，审核结果将在此页面回写展示
        </p>
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

      <div className={`mb-4 p-3 rounded-lg border ${
        step === 0 ? 'bg-blue-50 border-blue-100' :
        step === 1 ? 'bg-amber-50 border-amber-100' :
        step === 2 ? 'bg-green-50 border-green-100' :
        'bg-purple-50 border-purple-100'
      }`}>
        <p className={`text-xs font-medium ${
          step === 0 ? 'text-blue-700' :
          step === 1 ? 'text-amber-700' :
          step === 2 ? 'text-green-700' :
          'text-purple-700'
        }`}>
          第{step + 1}步 · 共4步 · {STEPS[step]}
        </p>
        <p className="text-[11px] text-gray-600 mt-0.5">
          {step === 0 && '填写商户基本信息，带*为必填项。填写完成后点击"下一步"进入资质上传。'}
          {step === 1 && '上传3项必备资质（营业执照+经营许可证+门头照），上传完成后可点击图片预览。'}
          {step === 2 && '设置每周营业时间，休息日可勾选"休息"跳过，至少需设置1天营业。'}
          {step === 3 && '选择最多5个优惠标签提升曝光，可从预设选择或自定义。确认后提交审核。'}
        </p>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {STEPS.map((s, i) => (
            <span key={s} className={`px-1.5 py-0.5 rounded text-[9px] ${
              i < step ? 'bg-secondary text-white' :
              i === step ? 'bg-primary text-white' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? '✓' : i + 1} {s}
            </span>
          ))}
        </div>
      </div>

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

          <div className="pt-3 border-t border-gray-100 space-y-4">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <FileText className="w-4 h-4 text-primary" />
              证照信息校验
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">营业执照编号 <span className="text-danger">*</span></label>
                <input
                  className="input-field text-sm"
                  value={form.licenseNo}
                  onChange={(e) => updateField('licenseNo', e.target.value)}
                  placeholder="统一社会信用代码"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">有效期至 <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={form.licenseExpire}
                  onChange={(e) => updateField('licenseExpire', e.target.value)}
                />
              </div>
            </div>
            {form.licenseExpire && (
              <div className={`p-2.5 rounded-lg text-[11px] ${
                new Date(form.licenseExpire) < new Date()
                  ? 'bg-danger-50 border border-danger-200 text-danger'
                  : 'bg-secondary-50 border border-secondary-200 text-secondary-700'
              }`}>
                <div className="flex items-center gap-1.5">
                  {new Date(form.licenseExpire) < new Date()
                    ? <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    : <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  }
                  <span className="font-medium">
                    {new Date(form.licenseExpire) < new Date()
                      ? '营业执照已过期，无法通过审核'
                      : `证照有效期校验通过 · 剩余 ${Math.ceil((new Date(form.licenseExpire).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} 天`
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
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
