import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Upload, FileText, ChevronLeft, ChevronRight, Check, XCircle, Loader2 } from 'lucide-react'
import { useUserStore } from '@/store/user'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { HouseholdBizType } from '../../shared/types'

const steps = ['信息填写', '材料上传', 'OCR预审', '提交成功']
const stepIcons = [FileText, Upload, CheckCircle, CheckCircle]

const typeTitles: Record<HouseholdBizType, string> = { settle: '落户申请', residence: '居住证申领', newborn: '新生儿入户' }

const materialMap: Record<HouseholdBizType, string[]> = {
  settle: ['身份证正反面', '户口簿', '房产证/租赁合同', '社保证明', '婚姻状况证明'],
  residence: ['身份证正反面', '居住证明', '近期照片', '社保证明'],
  newborn: ['出生医学证明', '父母身份证', '户口簿', '结婚证'],
}

const extraFields: Record<HouseholdBizType, { key: string; label: string; placeholder: string }[]> = {
  settle: [
    { key: 'reason', label: '落户原因', placeholder: '请选择落户原因' },
    { key: 'address', label: '落户地址', placeholder: '请输入落户详细地址' },
  ],
  residence: [
    { key: 'liveMonths', label: '居住时长', placeholder: '请输入居住月数' },
    { key: 'address', label: '居住地址', placeholder: '请输入居住详细地址' },
  ],
  newborn: [
    { key: 'birthDate', label: '出生日期', placeholder: '请选择出生日期' },
    { key: 'relation', label: '与申请人关系', placeholder: '如：父亲/母亲' },
  ],
}

export default function HouseholdApply() {
  const { type } = useParams<{ type: HouseholdBizType }>()
  const navigate = useNavigate()
  const [curStep, setCurStep] = useState(0)
  const [form, setForm] = useState({ name: '', idCard: '', phone: '', reason: '', address: '', liveMonths: '', birthDate: '', relation: '' })
  const [uploads, setUploads] = useState<Record<string, boolean>>({})
  const [ocrResult, setOcrResult] = useState<{ name: string; passed: boolean }[] | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [receipt, setReceipt] = useState('')

  const bizType = type ?? 'settle'
  const materials = materialMap[bizType]
  const extras = extraFields[bizType]

  const updateForm = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }))
  const toggleUpload = (name: string) => setUploads((p) => ({ ...p, [name]: !p[name] }))

  const handleNext = async () => {
    if (curStep === 1) {
      setOcrLoading(true)
      try {
        const res = await api.post('/household/ocr', { type: bizType, form, materials: Object.keys(uploads).filter((k) => uploads[k]) })
        const data = res.data?.data ?? res.data
        setOcrResult(data?.results ?? materials.map((m) => ({ name: m, passed: Math.random() > 0.2 })))
      } catch {
        setOcrResult(materials.map((m) => ({ name: m, passed: true })))
      }
      setOcrLoading(false)
      setCurStep(2)
    } else if (curStep === 2) {
      const allPassed = ocrResult?.every((r) => r.passed) ?? false
      if (!allPassed) return
      setReceipt(`CS${Date.now().toString(36).toUpperCase()}`)
      setCurStep(3)
    } else if (curStep < 3) {
      setCurStep((s) => s + 1)
    }
  }

  const handlePrev = () => { if (curStep > 0) setCurStep((s) => s - 1) }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-xl font-bold text-text-dark mb-6">{typeTitles[bizType]}</h1>

      <div className="flex items-center justify-between mb-8 max-w-lg mx-auto">
        {steps.map((label, i) => {
          const Icon = stepIcons[i]
          const done = i < curStep
          const active = i === curStep
          return (
            <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                done && 'bg-primary text-white',
                active && 'bg-primary text-white animate-pulse-glow',
                !done && !active && 'bg-gray-100 text-text-muted',
              )}>
                {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={cn('text-xs', active ? 'text-primary font-medium' : 'text-text-muted')}>{label}</span>
              {i < steps.length - 1 && (
                <div className={cn('absolute top-5 left-1/2 w-full h-0.5 -z-10', done ? 'bg-primary' : 'bg-gray-200')} style={{ transform: 'translateX(50%)' }} />
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        {curStep === 0 && (
          <div className="space-y-4 animate-slideUp">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">姓名</label>
              <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="请输入姓名" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">身份证号</label>
              <input value={form.idCard} onChange={(e) => updateForm('idCard', e.target.value)} placeholder="请输入身份证号" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">联系电话</label>
              <input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="请输入联系电话" className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            {extras.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-text-dark mb-1">{f.label}</label>
                <input value={(form as Record<string, string>)[f.key] ?? ''} onChange={(e) => updateForm(f.key, e.target.value)} placeholder={f.placeholder} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
            ))}
          </div>
        )}

        {curStep === 1 && (
          <div className="space-y-3 animate-slideUp">
            {materials.map((m) => (
              <div key={m} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-dark">{m}</span>
                </div>
                <button onClick={() => toggleUpload(m)} className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  uploads[m] ? 'bg-green-50 text-green-600' : 'bg-primary/10 text-primary hover:bg-primary/20',
                )}>
                  {uploads[m] ? <Check className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploads[m] ? '已上传' : '上传'}
                </button>
              </div>
            ))}
          </div>
        )}

        {curStep === 2 && ocrLoading && (
          <div className="flex flex-col items-center py-8 animate-fadeIn">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
            <p className="text-sm text-text-muted">正在OCR预审...</p>
          </div>
        )}

        {curStep === 2 && !ocrLoading && ocrResult && (
          <div className="space-y-3 animate-slideUp">
            {ocrResult.map((r) => (
              <div key={r.name} className={cn('flex items-center justify-between p-3 rounded-xl border', r.passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50')}>
                <span className="text-sm text-text-dark">{r.name}</span>
                {r.passed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            ))}
            {!ocrResult.every((r) => r.passed) && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700">部分材料未通过预审，请返回重新上传</div>
            )}
          </div>
        )}

        {curStep === 3 && (
          <div className="text-center py-6 animate-slideUp">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark mb-2">提交成功</h3>
            <p className="text-sm text-text-muted mb-1">回执编号：<span className="font-mono text-primary">{receipt}</span></p>
            <p className="text-sm text-text-muted">预计办理天数：<span className="font-semibold text-text-dark">5-7个工作日</span></p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {curStep > 0 && curStep < 3 && (
          <button onClick={handlePrev} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-text-muted hover:bg-gray-50 flex items-center justify-center gap-1">
            <ChevronLeft className="w-4 h-4" />上一步
          </button>
        )}
        {curStep < 3 && (
          <button onClick={handleNext} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-1">
            下一步<ChevronRight className="w-4 h-4" />
          </button>
        )}
        {curStep === 3 && (
          <button onClick={() => navigate('/household')} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90">返回户籍业务</button>
        )}
      </div>
    </div>
  )
}
