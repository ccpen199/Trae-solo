import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Camera, X, Check, Home, Users, Baby, Stethoscope, AlertCircle } from 'lucide-react'
import { useAdoptionStore } from '@/stores/adoptionStore'
import { useAuthStore } from '@/stores/authStore'
import { usePetStore } from '@/stores/petStore'
import StepFlow from '@/components/StepFlow'

const steps = [
  { label: '选择宠物' },
  { label: '送养原因' },
  { label: '领养要求' },
  { label: '上传照片' },
]

const requirementOptions = [
  { value: 'stable_home', label: '稳定住所', icon: Home },
  { value: 'experience', label: '养宠经验', icon: Users },
  { value: 'regular_visit', label: '定期回访', icon: Baby },
  { value: 'home_visit', label: '接受家访', icon: Stethoscope },
]

export default function AdoptionPublish() {
  const { user } = useAuthStore()
  const { pets, fetchPets } = usePetStore()
  const { createAdoption } = useAdoptionStore()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPet, setSelectedPet] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [requirements, setRequirements] = useState<string[]>([])
  const [additionalRequirements, setAdditionalRequirements] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  const isVerified = user?.verify_status === 'verified'
  const userPets = pets.filter((p: any) => p.owner_id === user?.id)

  const handleRequirementToggle = (value: string) => {
    setRequirements((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (images.length >= 6) return
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImages((prev) => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const canProceed = () => {
    if (currentStep === 0) return selectedPet !== null
    if (currentStep === 1) return reason.length >= 20
    if (currentStep === 2) return requirements.length > 0
    if (currentStep === 3) return images.length >= 1
    return false
  }

  const handleSubmit = async () => {
    if (!selectedPet) return
    setLoading(true)
    try {
      await createAdoption({
        pet_id: selectedPet,
        reason,
        requirements: JSON.stringify({
          checklist: requirements,
          additional: additionalRequirements,
        }),
        images: JSON.stringify(images),
      })
      setSubmitted(true)
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Link to="/adoptions" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          返回领养中心
        </Link>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h1 className="heading-font text-2xl font-bold text-text-primary mb-3">信息已提交</h1>
            <p className="text-text-secondary mb-8">您的送养信息已提交，等待平台审核</p>
            <StepFlow
              steps={[
                { label: '提交信息' },
                { label: '平台审核' },
                { label: '展示中' },
                { label: '完成领养' },
              ]}
              currentStep={1}
            />
            <div className="mt-8 flex gap-4 justify-center">
              <Link
                to="/adoptions"
                className="px-8 py-3 bg-stone-100 text-text-primary font-medium rounded-xl hover:bg-stone-200 transition"
              >
                返回列表
              </Link>
              <button
                onClick={() => navigate('/profile')}
                className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition"
              >
                查看我的发布
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Link to="/adoptions" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8">
        <ArrowLeft className="w-4 h-4" />
        返回领养中心
      </Link>
      <div className="max-w-3xl mx-auto">
        <h1 className="heading-font text-3xl font-bold text-text-primary mb-3">发布送养信息</h1>
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-primary">
              您需要先完成实名认证才能发布送养信息
            </p>
            {!isVerified && (
              <Link to="/profile/verify" className="text-sm text-primary hover:underline">
                前往实名认证 →
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <StepFlow steps={steps} currentStep={currentStep} />
        </div>

        {!isVerified ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">请先完成实名认证</h3>
            <p className="text-text-secondary mb-6">为了保障领养双方的权益，发布送养信息前需要完成实名认证</p>
            <Link
              to="/profile/verify"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition"
            >
              前往实名认证
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {currentStep === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6">选择要送养的宠物</h2>
                {userPets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-text-secondary mb-4">您还没有添加宠物</p>
                    <Link
                      to="/pets/new"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition"
                    >
                      添加宠物
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userPets.map((pet: any) => {
                      const imgSrc = pet.avatar_url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20${pet.species}%20pet%20portrait&image_size=square`
                      return (
                        <div
                          key={pet.id}
                          onClick={() => setSelectedPet(pet.id)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                            selectedPet === pet.id
                              ? 'border-primary bg-primary/5'
                              : 'border-stone-200 hover:border-primary/50'
                          }`}
                        >
                          <img src={imgSrc} alt={pet.name} className="w-16 h-16 rounded-full object-cover" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-text-primary">{pet.name}</h3>
                            <p className="text-sm text-text-secondary">{pet.breed} · {pet.species}</p>
                          </div>
                          {selectedPet === pet.id && (
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6">送养原因</h2>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请详细说明送养原因，帮助领养人更好地了解情况..."
                  className="w-full h-40 p-4 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <p className={`text-sm mt-2 ${reason.length >= 20 ? 'text-success' : 'text-text-secondary'}`}>
                  {reason.length}/20 字符（最少20字符）
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6">领养要求</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {requirementOptions.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <div
                        key={opt.value}
                        onClick={() => handleRequirementToggle(opt.value)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                          requirements.includes(opt.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-stone-200 hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          requirements.includes(opt.value) ? 'bg-primary text-white' : 'bg-stone-100 text-text-secondary'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-text-primary">{opt.label}</span>
                        {requirements.includes(opt.value) && (
                          <Check className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">其他要求（选填）</label>
                  <textarea
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="如有其他特殊要求，请在此说明..."
                    className="w-full h-24 p-4 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6">上传照片</h2>
                <p className="text-text-secondary mb-6">最多可上传6张照片，清晰展示宠物的不同角度</p>
                <div className="grid grid-cols-3 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                      <img src={img} alt={`照片 ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Camera className="w-8 h-8 text-text-secondary mb-2" />
                      <span className="text-sm text-text-secondary">上传照片</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 bg-stone-100 text-text-primary font-medium rounded-xl hover:bg-stone-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一步
              </button>
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || loading}
                  className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  提交发布
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
