import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight,
  ChevronLeft,
  User,
  Pill,
  Activity,
  FileText,
  Check,
  AlertCircle,
} from 'lucide-react'
import type { Drug, Severity, Report } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/utils/request'

const steps = [
  { icon: User, title: '患者信息' },
  { icon: Pill, title: '用药信息' },
  { icon: Activity, title: '反应表现' },
  { icon: FileText, title: '处理结果' },
]

const severityOptions: { value: Severity; label: string }[] = [
  { value: 'mild', label: '轻度' },
  { value: 'moderate', label: '中度' },
  { value: 'severe', label: '重度' },
  { value: 'life-threatening', label: '危及生命' },
  { value: 'fatal', label: '致死' },
]

const routeOptions = ['口服', '静脉滴注', '静脉注射', '肌肉注射', '皮下注射', '外用', '吸入', '其他']

interface FormData {
  patientName: string
  patientGender: 'male' | 'female' | ''
  patientAge: string
  patientId: string
  drugId: string
  drugName: string
  dosage: string
  route: string
  startDate: string
  reaction: string
  reactionStart: string
  severity: Severity | ''
  treatment: string
  outcome: string
}

const initialFormData: FormData = {
  patientName: '',
  patientGender: '',
  patientAge: '',
  patientId: '',
  drugId: '',
  drugName: '',
  dosage: '',
  route: '',
  startDate: '',
  reaction: '',
  reactionStart: '',
  severity: '',
  treatment: '',
  outcome: '',
}

const fieldLabels: Record<keyof FormData, string> = {
  patientName: '患者姓名',
  patientGender: '性别',
  patientAge: '年龄',
  patientId: '患者ID',
  drugId: '选择药品',
  drugName: '药品名称',
  dosage: '用法用量',
  route: '给药途径',
  startDate: '开始用药日期',
  reaction: '不良反应描述',
  reactionStart: '反应开始时间',
  severity: '严重程度',
  treatment: '处理措施',
  outcome: '转归情况',
}

export default function ReportForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const { userInfo } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    loadDrugs()
    if (isEdit) {
      loadReport()
    }
  }, [id])

  const loadDrugs = async () => {
    try {
      const res = await api.get<{ data: Drug[] }>('/drugs', { params: { pageSize: 100 } })
      setDrugs((res as any).data || [])
    } catch (err) {
      console.error('加载药品列表失败:', err)
    }
  }

  const loadReport = async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await api.get<{ data: Report }>(`/reports/${id}`)
      const report = (res as any).data
      if (report) {
        setFormData({
          patientName: report.patientName,
          patientGender: report.patientGender,
          patientAge: String(report.patientAge),
          patientId: report.patientId,
          drugId: String(report.drugId),
          drugName: report.drugName,
          dosage: report.dosage,
          route: report.route,
          startDate: report.startDate,
          reaction: report.reaction,
          reactionStart: report.reactionStart,
          severity: report.severity,
          treatment: report.treatment,
          outcome: report.outcome,
        })
      }
    } catch (err) {
      console.error('加载报告失败:', err)
      alert('加载报告失败')
      navigate('/reports')
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    const allFields: (keyof FormData)[][] = [
      ['patientName', 'patientGender', 'patientAge', 'patientId'],
      ['drugId', 'dosage', 'route', 'startDate'],
      ['reaction', 'reactionStart', 'severity'],
      ['treatment', 'outcome'],
    ]

    const stepFields = allFields[step] || []
    stepFields.forEach((field) => {
      const value = formData[field]
      if (!value || (typeof value === 'string' && !value.trim())) {
        newErrors[field] = `请填写${fieldLabels[field]}`
      }
    })

    if (step === 1 && formData.drugId && !drugs.find((d) => d.id === Number(formData.drugId))) {
      newErrors.drugId = '请选择有效的药品'
    }

    if (step === 0 && formData.patientAge) {
      const age = Number(formData.patientAge)
      if (isNaN(age) || age < 0 || age > 150) {
        newErrors.patientAge = '请输入有效的年龄（0-150）'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAllSteps = (): boolean => {
    let valid = true
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        valid = false
        setCurrentStep(i)
        break
      }
    }
    return valid
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDrugChange = (drugId: string) => {
    const drug = drugs.find((d) => d.id === Number(drugId))
    setFormData({
      ...formData,
      drugId,
      drugName: drug?.name || '',
    })
    if (errors.drugId) {
      setErrors({ ...errors, drugId: '' })
    }
  }

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!saveAsDraft && !validateAllSteps()) {
      return
    }

    if (saveAsDraft && !formData.patientName.trim()) {
      alert('请至少填写患者姓名后保存草稿')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        patientName: formData.patientName.trim(),
        patientGender: formData.patientGender || 'male',
        patientAge: Number(formData.patientAge) || 0,
        patientId: formData.patientId.trim(),
        drugId: Number(formData.drugId) || drugs[0]?.id || 1,
        drugName: formData.drugName || drugs.find((d) => d.id === Number(formData.drugId))?.name || '',
        dosage: formData.dosage.trim(),
        route: formData.route.trim(),
        startDate: formData.startDate,
        reaction: formData.reaction.trim(),
        reactionStart: formData.reactionStart,
        severity: formData.severity || 'mild',
        treatment: formData.treatment.trim(),
        outcome: formData.outcome.trim(),
        createdBy: userInfo.name,
        status: saveAsDraft ? 'draft' : 'submitted',
      }

      if (isEdit) {
        await api.put(`/reports/${id}`, payload)
      } else {
        await api.post<{ data: Report }>('/reports', payload)
      }

      alert(saveAsDraft ? '草稿保存成功' : '上报提交成功')
      navigate('/reports')
    } catch (err: any) {
      alert(err.message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getFieldError = (field: keyof FormData) => {
    return errors[field] || ''
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                患者姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => {
                  setFormData({ ...formData, patientName: e.target.value })
                  if (errors.patientName) setErrors({ ...errors, patientName: '' })
                }}
                className={`input ${getFieldError('patientName') ? 'border-red-500' : ''}`}
                placeholder="请输入患者姓名"
              />
              {getFieldError('patientName') && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('patientName')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  性别 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.patientGender}
                  onChange={(e) => {
                    setFormData({ ...formData, patientGender: e.target.value as 'male' | 'female' })
                    if (errors.patientGender) setErrors({ ...errors, patientGender: '' })
                  }}
                  className={`input ${getFieldError('patientGender') ? 'border-red-500' : ''}`}
                >
                  <option value="">请选择</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
                {getFieldError('patientGender') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('patientGender')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年龄 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={formData.patientAge}
                  onChange={(e) => {
                    setFormData({ ...formData, patientAge: e.target.value })
                    if (errors.patientAge) setErrors({ ...errors, patientAge: '' })
                  }}
                  className={`input ${getFieldError('patientAge') ? 'border-red-500' : ''}`}
                  placeholder="请输入年龄"
                />
                {getFieldError('patientAge') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('patientAge')}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                患者ID（门诊号/住院号） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) => {
                  setFormData({ ...formData, patientId: e.target.value })
                  if (errors.patientId) setErrors({ ...errors, patientId: '' })
                }}
                className={`input ${getFieldError('patientId') ? 'border-red-500' : ''}`}
                placeholder="请输入患者ID"
              />
              {getFieldError('patientId') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('patientId')}</p>
              )}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择药品 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.drugId}
                onChange={(e) => handleDrugChange(e.target.value)}
                className={`input ${getFieldError('drugId') ? 'border-red-500' : ''}`}
              >
                <option value="">请选择药品</option>
                {drugs.map((drug) => (
                  <option key={drug.id} value={drug.id}>
                    {drug.name}（{drug.genericName}）- {drug.batchNumber}
                  </option>
                ))}
              </select>
              {getFieldError('drugId') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('drugId')}</p>
              )}
              {formData.drugId && drugs.find((d) => d.id === Number(formData.drugId)) && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-500">
                    厂家：{drugs.find((d) => d.id === Number(formData.drugId))?.manufacturer}
                  </p>
                  <p className="text-gray-500 mt-1">
                    风险：{drugs.find((d) => d.id === Number(formData.drugId))?.risks}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用法用量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => {
                    setFormData({ ...formData, dosage: e.target.value })
                    if (errors.dosage) setErrors({ ...errors, dosage: '' })
                  }}
                  className={`input ${getFieldError('dosage') ? 'border-red-500' : ''}`}
                  placeholder="如：0.5g tid"
                />
                {getFieldError('dosage') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('dosage')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  给药途径 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.route}
                  onChange={(e) => {
                    setFormData({ ...formData, route: e.target.value })
                    if (errors.route) setErrors({ ...errors, route: '' })
                  }}
                  className={`input ${getFieldError('route') ? 'border-red-500' : ''}`}
                >
                  <option value="">请选择</option>
                  {routeOptions.map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
                {getFieldError('route') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('route')}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始用药日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value })
                  if (errors.startDate) setErrors({ ...errors, startDate: '' })
                }}
                className={`input ${getFieldError('startDate') ? 'border-red-500' : ''}`}
              />
              {getFieldError('startDate') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('startDate')}</p>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                不良反应描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reaction}
                onChange={(e) => {
                  setFormData({ ...formData, reaction: e.target.value })
                  if (errors.reaction) setErrors({ ...errors, reaction: '' })
                }}
                className={`input min-h-[120px] ${getFieldError('reaction') ? 'border-red-500' : ''}`}
                placeholder="请详细描述不良反应的症状、发生时间、持续时间、严重程度等..."
              />
              {getFieldError('reaction') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('reaction')}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  反应开始时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.reactionStart}
                  onChange={(e) => {
                    setFormData({ ...formData, reactionStart: e.target.value })
                    if (errors.reactionStart) setErrors({ ...errors, reactionStart: '' })
                  }}
                  className={`input ${getFieldError('reactionStart') ? 'border-red-500' : ''}`}
                />
                {getFieldError('reactionStart') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('reactionStart')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  严重程度 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => {
                    setFormData({ ...formData, severity: e.target.value as Severity })
                    if (errors.severity) setErrors({ ...errors, severity: '' })
                  }}
                  className={`input ${getFieldError('severity') ? 'border-red-500' : ''}`}
                >
                  <option value="">请选择</option>
                  {severityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {getFieldError('severity') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('severity')}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                处理措施 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.treatment}
                onChange={(e) => {
                  setFormData({ ...formData, treatment: e.target.value })
                  if (errors.treatment) setErrors({ ...errors, treatment: '' })
                }}
                className={`input min-h-[120px] ${getFieldError('treatment') ? 'border-red-500' : ''}`}
                placeholder="请描述采取的处理措施，如停药、使用的治疗药物、对症处理等..."
              />
              {getFieldError('treatment') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('treatment')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                转归情况 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.outcome}
                onChange={(e) => {
                  setFormData({ ...formData, outcome: e.target.value })
                  if (errors.outcome) setErrors({ ...errors, outcome: '' })
                }}
                className={`input min-h-[100px] ${getFieldError('outcome') ? 'border-red-500' : ''}`}
                placeholder="请描述患者的最终转归，如痊愈、好转、留有后遗症、死亡等..."
              />
              {getFieldError('outcome') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('outcome')}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-5 space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <Check className="w-4 h-4 text-primary-500" />
                信息摘要
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">患者：</span>
                  {formData.patientName || '-'} ({formData.patientGender ? (formData.patientGender === 'male' ? '男' : '女') : '-'}/
                  {formData.patientAge || '-'}岁)
                </div>
                <div>
                  <span className="text-gray-500">药品：</span>
                  {formData.drugName || '-'}
                </div>
                <div>
                  <span className="text-gray-500">用法：</span>
                  {formData.dosage || '-'}
                </div>
                <div>
                  <span className="text-gray-500">严重程度：</span>
                  {formData.severity ? severityOptions.find((s) => s.value === formData.severity)?.label : '-'}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? '编辑不良反应上报' : '新建不良反应上报'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            请按步骤完整填写信息，带 <span className="text-red-500">*</span> 为必填项
          </p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-center mb-8 pb-8 border-b border-gray-100">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    index < currentStep
                      ? 'bg-success-500 text-white'
                      : index === currentStep
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    index <= currentStep ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-success-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-6 text-gray-800">
            步骤 {currentStep + 1}: {steps[currentStep].title}
          </h2>
          {renderStepContent()}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 max-w-2xl mx-auto">
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/reports')}
              className="btn-secondary"
            >
              取消
            </button>
            {!isEdit && (
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="btn-secondary"
              >
                保存草稿
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="btn-secondary flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              上一步
            </button>
            {currentStep === steps.length - 1 ? (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? '提交中...' : isEdit ? '保存修改' : '提交初报'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary flex items-center gap-2"
              >
                下一步
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
