import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Package,
  UserCheck,
  Home as HomeIcon,
  Upload,
  ImagePlus,
  X,
  ChevronRight,
  Check,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import { submitClaim, type SubmitClaimData } from '../../services/insurance.api'

interface ClaimFormData {
  policyId: string
  orderId: string
  type: string
  amount: number
  incidentDate: string
  description: string
  contactName: string
  contactPhone: string
}

const claimTypes = [
  { id: 'cargo_damage', label: '货损', icon: Package, desc: '货物破损、丢失' },
  { id: 'personal_injury', label: '人伤', icon: UserCheck, desc: '人员受伤' },
  { id: 'property_damage', label: '财产损失', icon: HomeIcon, desc: '第三方财产损失' },
]

const mockPolicies = [
  { id: '1', policyNo: 'PICC202401150001', productName: '货物运输险', coverage: 50000 },
  { id: '2', policyNo: 'PICC202401100002', productName: '雇主责任险', coverage: 200000 },
]

export default function InsuranceClaim() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)

  const { control, handleSubmit, watch, formState: { errors } } = useForm<ClaimFormData>({
    defaultValues: {
      policyId: '',
      orderId: '',
      type: '',
      amount: 0,
      incidentDate: '',
      description: '',
      contactName: '',
      contactPhone: '',
    },
  })

  const submitMutation = useMutation({
    mutationFn: (data: SubmitClaimData) => submitClaim(data),
    onSuccess: (res) => {
      navigate(`/insurance/claim/${res.id}`)
    },
  })

  const steps = [
    { id: 1, label: '选择保单' },
    { id: 2, label: '出险信息' },
    { id: 3, label: '上传证据' },
    { id: 4, label: '提交申请' },
  ]

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).slice(0, 9 - uploadedFiles.length)
      setUploadedFiles((prev) => [
        ...prev,
        ...newFiles.map((f) => URL.createObjectURL(f)),
      ])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const canNext = () => {
    if (currentStep === 1) return watch('policyId')
    if (currentStep === 2) return watch('type') && watch('amount') > 0 && watch('description')
    if (currentStep === 3) return uploadedFiles.length >= 1
    return true
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const onSubmit = handleSubmit((data) => {
    submitMutation.mutate({
      ...data,
      evidenceImages: uploadedFiles,
    })
  })

  return (
    <div className="pb-32">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">申请理赔</h1>
        </div>

        <div className="flex items-center justify-between mt-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${step.id < currentStep
                    ? 'bg-green-500 text-white'
                    : step.id === currentStep
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-1 rounded-full transition-all
                    ${step.id < currentStep ? 'bg-green-500' : 'bg-gray-100'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <span
              key={step.id}
              className={`text-xs ${step.id <= currentStep ? 'text-gray-700 font-medium' : 'text-gray-400'}`}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-gray-900">选择理赔保单</h2>
                </div>
                <div className="space-y-3">
                  <Controller
                    name="policyId"
                    control={control}
                    rules={{ required: '请选择保单' }}
                    render={({ field }) => (
                      <>
                        {mockPolicies.map((policy) => (
                          <button
                            key={policy.id}
                            type="button"
                            onClick={() => field.onChange(policy.id)}
                            className={`
                              w-full p-4 rounded-xl border-2 transition-all text-left
                              ${field.value === policy.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-100 hover:border-gray-200'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-bold text-gray-800">{policy.productName}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{policy.policyNo}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">保额</div>
                                <div className="text-sm font-bold text-blue-600">¥{policy.coverage.toLocaleString()}</div>
                              </div>
                              {field.value === policy.id && (
                                <div className="absolute right-4 top-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  />
                </div>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h2 className="text-base font-bold text-gray-900">出险类型</h2>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: '请选择出险类型' }}
                    render={({ field }) => (
                      <>
                        {claimTypes.map((type) => {
                          const Icon = type.icon
                          const selected = field.value === type.id
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => field.onChange(type.id)}
                              className={`
                                p-3 rounded-xl border-2 transition-all text-center
                                ${selected
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-100 hover:border-gray-200'
                                }
                              `}
                            >
                              <div
                                className={`
                                  w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center
                                  ${selected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}
                                `}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="text-sm font-bold text-gray-800">{type.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
                            </button>
                          )
                        })}
                      </>
                    )}
                  />
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h2 className="text-base font-bold text-gray-900">理赔信息</h2>
                </div>
                <div className="space-y-4">
                  <Controller
                    name="amount"
                    control={control}
                    rules={{ required: '请输入理赔金额', min: { value: 1, message: '金额必须大于0' } }}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">理赔金额（元）</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">¥</span>
                          <input
                            type="number"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full py-3.5 pl-10 pr-4 text-2xl font-bold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>}
                      </div>
                    )}
                  />

                  <Controller
                    name="incidentDate"
                    control={control}
                    rules={{ required: '请选择出险日期' }}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">出险日期</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="date"
                            value={field.value}
                            onChange={field.onChange}
                            className="w-full py-3.5 pl-12 pr-4 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        {errors.incidentDate && <p className="mt-1 text-sm text-red-500">{errors.incidentDate.message}</p>}
                      </div>
                    )}
                  />

                  <Controller
                    name="description"
                    control={control}
                    rules={{ required: '请填写出险描述', minLength: { value: 10, message: '描述不少于10个字' } }}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">出险描述</label>
                        <textarea
                          rows={4}
                          placeholder="请详细描述出险经过、损失情况..."
                          value={field.value}
                          onChange={field.onChange}
                          className="w-full p-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex justify-between mt-1">
                          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                          <span className="text-xs text-gray-400 ml-auto">{field.value.length}/500</span>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-gray-900">上传证据材料</h2>
                  <Tag color="orange" size="sm">最多9张</Tag>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  请上传现场照片、损失照片、相关单据等证据材料，支持拖拽上传
                </p>

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    handleFileUpload(e.dataTransfer.files)
                  }}
                  className={`
                    relative rounded-2xl border-2 border-dashed p-6 transition-all
                    ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                  `}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-200">
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <span className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">
                          {idx + 1}
                        </span>
                      </div>
                    ))}
                    {uploadedFiles.length < 9 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer">
                        <ImagePlus className="w-8 h-8 mb-1" />
                        <span className="text-xs">添加图片</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700">
                      <p className="font-medium mb-1">上传须知：</p>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li>照片清晰，能看清损失部位</li>
                        <li>包含全景和细节照片</li>
                        <li>如有相关单据请一并上传</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h2 className="text-base font-bold text-gray-900">确认申请信息</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { label: '理赔保单', value: mockPolicies.find((p) => p.id === watch('policyId'))?.productName || '-' },
                    { label: '出险类型', value: claimTypes.find((t) => t.id === watch('type'))?.label || '-' },
                    { label: '理赔金额', value: `¥${watch('amount')?.toLocaleString() || 0}` },
                    { label: '出险日期', value: watch('incidentDate') || '-' },
                    { label: '证据材料', value: `${uploadedFiles.length} 张照片` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-medium text-gray-800">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <span className="text-sm text-gray-500 block mb-1">出险描述</span>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                      {watch('description') || '-'}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">温馨提示</p>
                    <p className="leading-relaxed">
                      提交后理赔专员将在24小时内联系您，请保持电话畅通。理赔进度可在"理赔进度"中查看。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 p-4 z-40">
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <Button variant="secondary" onClick={prevStep}>
              上一步
            </Button>
          )}
          {currentStep < 4 ? (
            <Button
              variant="primary"
              fullWidth
              disabled={!canNext()}
              icon={<ChevronRight className="w-4 h-4" />}
              onClick={nextStep}
            >
              下一步
            </Button>
          ) : (
            <Button
              variant="cta"
              fullWidth
              loading={submitMutation.isPending}
              onClick={onSubmit}
            >
              提交理赔申请
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
