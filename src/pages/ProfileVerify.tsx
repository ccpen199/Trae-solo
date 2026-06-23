import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, X, Check, Loader2, Shield, AlertCircle,
  User, CreditCard, Camera
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import StepFlow from '@/components/StepFlow'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

const steps = [
  { label: '填写信息' },
  { label: '上传证件' },
  { label: '提交审核' },
  { label: '完成' },
]

function validateIdNumber(idNumber: string): boolean {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idNumber)
}

function maskIdNumber(idNumber: string): string {
  if (idNumber.length <= 10) return idNumber
  return idNumber.slice(0, 6) + '********' + idNumber.slice(-4)
}

export default function ProfileVerify() {
  const navigate = useNavigate()
  const { user, loading, fetchMe, verifyRealName, error, clearError } = useAuthStore()
  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    real_name: '',
    id_number: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    if (user?.verify_status === 'verified') {
      setShowSuccessAnimation(true)
    } else if (user?.verify_status === 'pending') {
      setCurrentStep(3)
      setSubmitted(true)
    }
    if (user?.real_name && user?.id_number) {
      setFormData({
        real_name: user.real_name,
        id_number: user.id_number,
      })
    }
  }, [user])

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const handleImageUpload = (
    e: ChangeEvent<HTMLInputElement>,
    setImage: (img: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.real_name.trim()) {
      newErrors.real_name = '请输入真实姓名'
    }
    if (!formData.id_number.trim()) {
      newErrors.id_number = '请输入身份证号'
    } else if (!validateIdNumber(formData.id_number)) {
      newErrors.id_number = '身份证号格式不正确'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Submit = (e: FormEvent) => {
    e.preventDefault()
    if (validateStep1()) {
      setCurrentStep(1)
    }
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!frontImage || !backImage) {
        setErrors({ id_card: '请上传身份证正反面照片' })
        return
      }
      setCurrentStep(2)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      await verifyRealName({
        real_name: formData.real_name,
        id_number: formData.id_number,
        id_card_images: [frontImage!, backImage!],
      })
      setSubmitted(true)
      setCurrentStep(3)
      setShowSuccessAnimation(true)
    } catch (err) {
      console.error('提交审核失败:', err)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center animate-fadeIn">
        <User className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">请先登录</h2>
        <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
          去登录
        </Link>
      </div>
    )
  }

  if (user.verify_status === 'verified') {
    return (
      <div className="container mx-auto py-8 max-w-2xl animate-fadeIn">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/profile" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="heading-font text-2xl font-bold text-text-primary">实名认证</h1>
            <p className="text-text-secondary text-sm">您的实名认证状态</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 text-center shadow-sm animate-slideUp">
          <div className={cn(
            'w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center',
            showSuccessAnimation ? 'bg-success animate-pulse' : 'bg-success/10'
          )}>
            <Check className={cn('w-12 h-12', showSuccessAnimation ? 'text-white' : 'text-success')} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">实名认证已通过</h2>
          <p className="text-text-secondary mb-6">您的身份信息已成功验证</p>

          <div className="bg-stone-50 rounded-xl p-4 text-left max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary">真实姓名</span>
              <span className="font-medium text-text-primary">{user.real_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">身份证号</span>
              <span className="font-medium text-text-primary">{maskIdNumber(user.id_number)}</span>
            </div>
          </div>

          <StatusBadge status="success" label="已认证" size="md" className="mt-6" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl animate-fadeIn">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/profile" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="heading-font text-2xl font-bold text-text-primary">实名认证</h1>
          <p className="text-text-secondary text-sm">完成实名认证，解锁更多功能</p>
        </div>
      </div>

      <div className="mb-8 px-4">
        <StepFlow steps={steps} currentStep={currentStep} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm animate-fadeIn flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {currentStep === 0 && (
        <form onSubmit={handleStep1Submit} className="bg-white rounded-2xl p-6 shadow-sm animate-slideUp stagger-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">填写身份信息</h2>
              <p className="text-sm text-text-secondary">请填写您的真实姓名和身份证号</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                真实姓名 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.real_name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, real_name: e.target.value }))
                  if (errors.real_name) setErrors((prev) => ({ ...prev, real_name: undefined }))
                }}
                placeholder="请输入您的真实姓名"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border transition-colors',
                  errors.real_name
                    ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                    : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                )}
              />
              {errors.real_name && (
                <p className="text-danger text-xs mt-1">{errors.real_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                身份证号 <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={formData.id_number}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, id_number: e.target.value.toUpperCase() }))
                    if (errors.id_number) setErrors((prev) => ({ ...prev, id_number: undefined }))
                  }}
                  placeholder="请输入18位身份证号码"
                  maxLength={18}
                  className={cn(
                    'w-full pl-11 pr-4 py-2.5 rounded-xl border transition-colors',
                    errors.id_number
                      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                      : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  )}
                />
              </div>
              {errors.id_number && (
                <p className="text-danger text-xs mt-1">{errors.id_number}</p>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-700 flex items-start gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              您的身份信息将被严格保密，仅用于实名认证审核
            </p>
          </div>

          <button
            type="submit"
            className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 active:scale-[0.98] transition-all"
          >
            下一步
          </button>
        </form>
      )}

      {currentStep === 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-slideUp stagger-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">上传身份证照片</h2>
              <p className="text-sm text-text-secondary">请上传身份证正反面清晰照片</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                身份证正面 <span className="text-danger">*</span>
              </label>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleImageUpload(e, setFrontImage)
                  if (errors.id_card) setErrors((prev) => ({ ...prev, id_card: undefined }))
                }}
                className="hidden"
              />
              {frontImage ? (
                <div className="relative rounded-xl overflow-hidden aspect-[1.586/1]">
                  <img src={frontImage} alt="身份证正面" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFrontImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => frontInputRef.current?.click()}
                  className="w-full aspect-[1.586/1] border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-sm text-text-secondary">点击上传正面</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                身份证反面 <span className="text-danger">*</span>
              </label>
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleImageUpload(e, setBackImage)
                  if (errors.id_card) setErrors((prev) => ({ ...prev, id_card: undefined }))
                }}
                className="hidden"
              />
              {backImage ? (
                <div className="relative rounded-xl overflow-hidden aspect-[1.586/1]">
                  <img src={backImage} alt="身份证反面" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setBackImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="w-full aspect-[1.586/1] border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-sm text-text-secondary">点击上传反面</span>
                </button>
              )}
            </div>
          </div>

          {errors.id_card && (
            <p className="text-danger text-xs mt-3">{errors.id_card}</p>
          )}

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-700">
              请确保照片清晰，身份证四角完整，文字清晰可辨
            </p>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex-1 py-3 border border-stone-200 rounded-xl font-medium text-text-secondary hover:bg-stone-50 transition-colors"
            >
              上一步
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 active:scale-[0.98] transition-all"
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-slideUp stagger-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">确认信息</h2>
              <p className="text-sm text-text-secondary">请确认您的信息无误后提交</p>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">真实姓名</span>
              <span className="font-medium text-text-primary">{formData.real_name}</span>
            </div>
            <div className="border-t border-stone-200" />
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">身份证号</span>
              <span className="font-medium text-text-primary">{maskIdNumber(formData.id_number)}</span>
            </div>
            <div className="border-t border-stone-200" />
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">证件照片</span>
              <div className="flex gap-2">
                <div className="w-12 h-8 bg-stone-200 rounded overflow-hidden">
                  {frontImage && <img src={frontImage} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="w-12 h-8 bg-stone-200 rounded overflow-hidden">
                  {backImage && <img src={backImage} alt="" className="w-full h-full object-cover" />}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-sm text-primary flex items-start gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              我确认以上信息真实有效，并同意平台对身份信息进行核验
            </p>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex-1 py-3 border border-stone-200 rounded-xl font-medium text-text-secondary hover:bg-stone-50 transition-colors"
            >
              上一步
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交审核'
              )}
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm animate-slideUp">
          {submitted && (
            <>
              <div className={cn(
                'w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-500',
                showSuccessAnimation ? 'bg-warning animate-pulse' : 'bg-warning/10'
              )}>
                <Loader2 className={cn('w-10 h-10', showSuccessAnimation ? 'text-white animate-spin' : 'text-warning')} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">审核中...</h2>
              <p className="text-text-secondary mb-6">您的实名认证申请已提交，我们将在1-3个工作日内完成审核</p>

              <div className="bg-stone-50 rounded-xl p-4 text-left max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-secondary">真实姓名</span>
                  <span className="font-medium text-text-primary">{formData.real_name || user.real_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">身份证号</span>
                  <span className="font-medium text-text-primary">
                    {maskIdNumber(formData.id_number || user.id_number || '')}
                  </span>
                </div>
              </div>

              <StatusBadge status="pending" label="审核中" size="md" className="mt-6" />

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 active:scale-95 transition-all"
              >
                返回个人中心
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
