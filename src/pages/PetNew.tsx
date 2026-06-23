import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Upload, X, Camera, Loader2 } from 'lucide-react'
import { usePetStore } from '@/stores/petStore'
import { cn } from '@/lib/utils'

const speciesOptions = [
  { value: 'dog', label: '狗狗' },
  { value: 'cat', label: '猫咪' },
  { value: 'bird', label: '鸟' },
  { value: 'rabbit', label: '兔子' },
  { value: 'hamster', label: '仓鼠' },
  { value: 'other', label: '其他' },
]

const genderOptions = [
  { value: 'male', label: '公' },
  { value: 'female', label: '母' },
  { value: 'unknown', label: '未知' },
]

const breedSuggestions: Record<string, string[]> = {
  dog: ['金毛寻回犬', '拉布拉多', '柯基犬', '柴犬', '哈士奇', '萨摩耶', '边牧', '德牧', '贵宾犬', '比熊'],
  cat: ['英国短毛猫', '美国短毛猫', '布偶猫', '暹罗猫', '波斯猫', '缅因猫', '苏格兰折耳', '狸花猫', '橘猫'],
  bird: ['虎皮鹦鹉', '玄凤鹦鹉', '牡丹鹦鹉', '金丝雀', '画眉鸟', '百灵鸟'],
  rabbit: ['安哥拉兔', '垂耳兔', '侏儒兔', '荷兰兔', '獭兔'],
  hamster: ['金丝熊', '三线仓鼠', '一线仓鼠', '布丁仓鼠', '奶茶仓鼠'],
  other: [],
}

interface FormData {
  name: string
  species: string
  breed: string
  gender: string
  birth_date: string
  weight: string
  chip_number: string
  is_sterilized: boolean
  avatar_url: string
}

interface FormErrors {
  name?: string
  species?: string
  breed?: string
}

export default function PetNew() {
  const navigate = useNavigate()
  const { createPet, loading, error } = usePetStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    species: '',
    breed: '',
    gender: 'unknown',
    birth_date: '',
    weight: '',
    chip_number: '',
    is_sterilized: false,
    avatar_url: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)

  const currentBreedSuggestions = breedSuggestions[formData.species] || []

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreviewAvatar(result)
        setFormData((prev) => ({ ...prev, avatar_url: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setPreviewAvatar(null)
    setFormData((prev) => ({ ...prev, avatar_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = '请输入宠物名称'
    }
    if (!formData.species) {
      newErrors.species = '请选择宠物类型'
    }
    if (!formData.breed.trim()) {
      newErrors.breed = '请输入品种'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const petData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        birth_date: formData.birth_date || null,
        chip_number: formData.chip_number || null,
      }
      const result = await createPet(petData)
      if (result?.id) {
        navigate(`/pets/${result.id}`)
      } else {
        navigate('/pets')
      }
    } catch (err) {
      console.error('创建宠物失败:', err)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl animate-fadeIn">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/pets"
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="heading-font text-2xl font-bold text-text-primary">
            添加新宠物
          </h1>
          <p className="text-text-secondary text-sm">填写宠物的基本信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-slideUp stagger-1">
          <h2 className="font-semibold text-text-primary mb-4">头像</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              {previewAvatar ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden">
                  <img
                    src={previewAvatar}
                    alt="头像预览"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Camera className="w-6 h-6 text-stone-400" />
                  <span className="text-xs text-stone-400 mt-1">上传头像</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl text-sm font-medium text-text-secondary hover:bg-stone-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              选择图片
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm animate-slideUp stagger-2 space-y-5">
          <h2 className="font-semibold text-text-primary">基本信息</h2>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              宠物名称 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="请输入宠物名称"
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border transition-colors',
                errors.name
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.name && (
              <p className="text-danger text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              宠物类型 <span className="text-danger">*</span>
            </label>
            <select
              value={formData.species}
              onChange={(e) => handleChange('species', e.target.value)}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border transition-colors appearance-none bg-white',
                errors.species
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            >
              <option value="">请选择宠物类型</option>
              {speciesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.species && (
              <p className="text-danger text-xs mt-1">{errors.species}</p>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              品种 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => {
                handleChange('breed', e.target.value)
                setShowBreedSuggestions(true)
              }}
              onFocus={() => setShowBreedSuggestions(true)}
              placeholder="请输入或选择品种"
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border transition-colors',
                errors.breed
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {showBreedSuggestions && currentBreedSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {currentBreedSuggestions
                  .filter((b) => b.toLowerCase().includes(formData.breed.toLowerCase()))
                  .slice(0, 10)
                  .map((breed) => (
                    <button
                      key={breed}
                      type="button"
                      onClick={() => {
                        handleChange('breed', breed)
                        setShowBreedSuggestions(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-stone-50 text-sm text-text-primary transition-colors"
                    >
                      {breed}
                    </button>
                  ))}
              </div>
            )}
            {errors.breed && (
              <p className="text-danger text-xs mt-1">{errors.breed}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              性别
            </label>
            <div className="flex gap-3">
              {genderOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange('gender', opt.value)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl border font-medium text-sm transition-all',
                    formData.gender === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-stone-200 text-text-secondary hover:border-stone-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                出生日期
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                体重 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="例如: 5.5"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              芯片号
            </label>
            <input
              type="text"
              value={formData.chip_number}
              onChange={(e) => handleChange('chip_number', e.target.value)}
              placeholder="可选，15位芯片编号"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-text-primary">是否已绝育</p>
              <p className="text-xs text-text-secondary">绝育有助于宠物健康</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('is_sterilized', !formData.is_sterilized)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                formData.is_sterilized ? 'bg-primary' : 'bg-stone-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  formData.is_sterilized ? 'translate-x-6' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm animate-fadeIn">
            {error}
          </div>
        )}

        <div className="flex gap-4 animate-slideUp stagger-3">
          <Link
            to="/pets"
            className="flex-1 py-3 text-center border border-stone-200 rounded-xl font-medium text-text-secondary hover:bg-stone-50 transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                提交中...
              </>
            ) : (
              '添加宠物'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
