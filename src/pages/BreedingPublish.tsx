import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Camera, X, Check, AlertCircle, Award, Shield, FileText, DollarSign, Heart } from 'lucide-react'
import { useBreedingStore } from '@/stores/breedingStore'
import { useAuthStore } from '@/stores/authStore'
import { usePetStore } from '@/stores/petStore'
import StepFlow from '@/components/StepFlow'

const steps = [
  { label: '选择宠物' },
  { label: '血统证书' },
  { label: '健康证明' },
  { label: '配种要求' },
  { label: '费用与条件' },
  { label: '上传照片' },
]

const requirementChecklist = [
  { value: 'health_complete', label: '健康证明齐全' },
  { value: 'pure_bloodline', label: '血统纯正' },
  { value: 'age_appropriate', label: '适龄配种' },
  { value: 'other', label: '其他' },
]

export default function BreedingPublish() {
  const { user } = useAuthStore()
  const { pets, fetchPets } = usePetStore()
  const { createBreeding } = useBreedingStore()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPet, setSelectedPet] = useState<number | null>(null)
  const [pedigreeCert, setPedigreeCert] = useState<string | null>(null)
  const [healthCert, setHealthCert] = useState<string | null>(null)
  const [healthValid, setHealthValid] = useState<boolean | null>(null)
  const [breedingRequirements, setBreedingRequirements] = useState('')
  const [fee, setFee] = useState('')
  const [checklist, setChecklist] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  const isVerified = user?.verify_status === 'verified'
  const userPets = pets.filter((p: any) => p.owner_id === user?.id)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'pedigree' | 'health') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (type === 'pedigree') {
        setPedigreeCert(result)
      } else {
        setHealthCert(result)
        setTimeout(() => setHealthValid(Math.random() > 0.1), 800)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleChecklistToggle = (value: string) => {
    setChecklist((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
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
    if (currentStep === 1) return true
    if (currentStep === 2) return healthCert !== null && healthValid === true
    if (currentStep === 3) return breedingRequirements.length >= 10
    if (currentStep === 4) return Number(fee) > 0 && checklist.length > 0
    if (currentStep === 5) return images.length >= 1
    return false
  }

  const handleSubmit = async () => {
    if (!selectedPet) return
    setLoading(true)
    setError(null)
    try {
      await createBreeding({
        pet_id: selectedPet,
        pedigree_cert_url: pedigreeCert,
        health_cert_url: healthCert,
        requirements: breedingRequirements,
        fee: Number(fee),
        checklist: JSON.stringify(checklist),
        images: JSON.stringify(images),
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Link to="/breedings" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          返回配种广场
        </Link>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h1 className="heading-font text-2xl font-bold text-text-primary mb-3">信息已提交</h1>
            <p className="text-text-secondary mb-8">您的配种信息已提交，等待平台审核</p>
            <StepFlow
              steps={[
                { label: '提交信息' },
                { label: '平台审核' },
                { label: '展示中' },
                { label: '完成配种' },
              ]}
              currentStep={1}
            />
            <div className="mt-8 flex gap-4 justify-center">
              <Link
                to="/breedings"
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

  const selectedPetData = pets.find((p: any) => p.id === selectedPet)
  const selectedPetImg = selectedPetData
    ? selectedPetData.avatar_url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20${selectedPetData.species}%20pet%20portrait&image_size=square`
    : null

  return (
    <div className="container mx-auto py-8 px-4">
      <Link to="/breedings" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8">
        <ArrowLeft className="w-4 h-4" />
        返回配种广场
      </Link>
      <div className="max-w-3xl mx-auto">
        <h1 className="heading-font text-3xl font-bold text-text-primary mb-3">发布配种需求</h1>
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-primary">
              您需要先完成实名认证才能发布配种信息
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
            <p className="text-text-secondary mb-6">为了保障配种双方的权益，发布配种信息前需要完成实名认证</p>
            <Link
              to="/profile/verify"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition"
            >
              前往实名认证
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {currentStep === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6">选择要配种的宠物</h2>
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
                {selectedPetData && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20 animate-fadeIn">
                    <div className="flex items-center gap-4">
                      <img src={selectedPetImg!} alt={selectedPetData.name} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">已选择：{selectedPetData.name}</p>
                        <p className="text-xs text-text-secondary">{selectedPetData.breed} · {selectedPetData.gender === 'male' ? '公' : '母'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-secondary" />
                  血统证书
                </h2>
                <p className="text-text-secondary mb-6">如有血统证书请上传，可提升匹配可信度和配种价值（非必填）</p>
                {pedigreeCert ? (
                  <div className="relative p-6 bg-stone-50 rounded-xl border-2 border-secondary/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">血统证书.pdf</p>
                        <div className="flex items-center gap-1 text-success text-sm">
                          <Check className="w-4 h-4" />
                          证书已上传
                        </div>
                      </div>
                    </div>
                    <div className="aspect-video bg-white rounded-lg border border-stone-200 flex items-center justify-center">
                      <div className="text-center text-text-secondary">
                        <Award className="w-12 h-12 mx-auto mb-2 text-secondary/40" />
                        <p className="text-sm">PDF 预览占位</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPedigreeCert(null)}
                      className="absolute top-4 right-4 w-8 h-8 bg-stone-200 hover:bg-danger/10 hover:text-danger rounded-full flex items-center justify-center transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="aspect-video rounded-xl border-2 border-dashed border-stone-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition">
                    <input type="file" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 'pedigree')} className="hidden" />
                    <Upload className="w-10 h-10 text-text-secondary mb-3" />
                    <p className="text-text-primary font-medium">点击上传血统证书</p>
                    <p className="text-sm text-text-secondary mt-1">支持 PDF / JPG / PNG 格式</p>
                  </label>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-success" />
                  健康证明
                </h2>
                <p className="text-text-secondary mb-6">健康证明是配种的必备材料，平台将核验有效性</p>
                {healthCert ? (
                  <div className="space-y-4">
                    <div className={`relative p-6 rounded-xl border-2 ${healthValid === true ? 'bg-success/5 border-success/30' : healthValid === false ? 'bg-danger/5 border-danger/30' : 'bg-stone-50 border-stone-200'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${healthValid === true ? 'bg-success/10' : healthValid === false ? 'bg-danger/10' : 'bg-stone-100'}`}>
                          <FileText className={`w-6 h-6 ${healthValid === true ? 'text-success' : healthValid === false ? 'text-danger' : 'text-text-secondary'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">健康证明.pdf</p>
                          <div className={`text-sm flex items-center gap-1 ${healthValid === true ? 'text-success' : healthValid === false ? 'text-danger' : 'text-warning'}`}>
                            {healthValid === null ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                校验中...
                              </>
                            ) : healthValid ? (
                              <>
                                <Check className="w-4 h-4" />
                                校验通过
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4" />
                                校验失败，请重新上传
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="aspect-video bg-white rounded-lg border border-stone-200 flex items-center justify-center">
                        <div className="text-center text-text-secondary">
                          <Shield className="w-12 h-12 mx-auto mb-2 text-success/40" />
                          <p className="text-sm">健康证明预览占位</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setHealthCert(null); setHealthValid(null) }}
                        className="absolute top-4 right-4 w-8 h-8 bg-stone-200 hover:bg-danger/10 hover:text-danger rounded-full flex items-center justify-center transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="aspect-video rounded-xl border-2 border-dashed border-stone-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition">
                    <input type="file" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 'health')} className="hidden" />
                    <Upload className="w-10 h-10 text-text-secondary mb-3" />
                    <p className="text-text-primary font-medium">点击上传健康证明</p>
                    <p className="text-sm text-text-secondary mt-1">支持 PDF / JPG / PNG 格式</p>
                  </label>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  配种要求
                </h2>
                <p className="text-text-secondary mb-6">详细说明您对配种对象的要求，帮助系统更好地匹配</p>
                <textarea
                  value={breedingRequirements}
                  onChange={(e) => setBreedingRequirements(e.target.value)}
                  placeholder="例如：要求对方宠物血统纯正、健康状况良好、无遗传病史、性格温顺，最好同城可线下见面..."
                  className="w-full h-40 p-4 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <p className={`text-sm mt-2 ${breedingRequirements.length >= 10 ? 'text-success' : 'text-text-secondary'}`}>
                  {breedingRequirements.length}/10 字符（最少10字符）
                </p>
              </div>
            )}

            {currentStep === 4 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-primary" />
                  费用与条件
                </h2>
                <div className="mb-8">
                  <label className="block text-sm font-medium text-text-primary mb-3">配种费用（元）</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">¥</span>
                    <input
                      type="number"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full pl-12 pr-4 py-4 text-2xl font-bold border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">保证条件（勾选）</label>
                  <div className="space-y-3">
                    {requirementChecklist.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => handleChecklistToggle(opt.value)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                          checklist.includes(opt.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-stone-200 hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                          checklist.includes(opt.value) ? 'bg-primary border-primary' : 'border-stone-300'
                        }`}>
                          {checklist.includes(opt.value) && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="font-medium text-text-primary">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
                <h2 className="heading-font text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-primary" />
                  上传照片
                </h2>
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
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                      <Camera className="w-8 h-8 text-text-secondary mb-2" />
                      <span className="text-sm text-text-secondary">上传照片</span>
                    </label>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-4">{images.length}/6 张</p>
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
