import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Image, AlertCircle, CheckCircle, Stethoscope } from 'lucide-react'
import { useQAStore } from '@/stores/qaStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const categories = ['狗狗健康', '猫咪护理', '饮食营养', '训练行为', '其他']

export default function QAAsk() {
  const navigate = useNavigate()
  const { createQuestion, loading } = useQAStore()
  const { user, isLoggedIn } = useAuthStore()

  const [formData, setFormData] = useState({
    title: '',
    category: '狗狗健康',
    content: '',
    inviteVet: false,
  })
  const [images, setImages] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) {
      newErrors.title = '请输入问题标题'
    } else if (formData.title.trim().length < 10) {
      newErrors.title = '标题至少需要10个字符'
    }
    if (!formData.content.trim()) {
      newErrors.content = '请输入问题详情'
    } else if (formData.content.trim().length < 20) {
      newErrors.content = '内容至少需要20个字符'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && images.length < 3) {
      const remaining = 3 - images.length
      const newImages = Array.from(files).slice(0, remaining).map((_, i) => 
        `https://picsum.photos/400/300?random=${Date.now() + i}`
      )
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const questionId = await createQuestion({
        ...formData,
        images,
      })
      setShowSuccess(true)
      setTimeout(() => {
        navigate(`/qa/${questionId || 1}`)
      }, 1500)
    } catch (err: any) {
      setErrors({ submit: err.message || '提交失败，请重试' })
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="heading-font text-xl font-bold text-text-primary mb-2">问题发布成功</h2>
          <p className="text-text-secondary">正在跳转到问题详情页...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-6 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h1 className="heading-font text-xl font-bold text-text-primary">我要提问</h1>
        </div>

        {!isLoggedIn && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-800 font-medium">需要登录</p>
              <p className="text-sm text-orange-600">请先登录后再发布问题</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-text-primary mb-2">
              问题标题 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请简明扼要地描述您的问题，例如：我家狗狗最近一直呕吐是怎么回事？"
              className={cn(
                'w-full px-4 py-3 rounded-xl border transition',
                errors.title
                  ? 'border-danger bg-danger/5 focus:border-danger'
                  : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10'
              )}
              maxLength={100}
            />
            {errors.title && (
              <p className="mt-1.5 text-sm text-danger flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
            <p className="mt-1.5 text-xs text-text-secondary">
              {formData.title.length}/100 字符
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-text-primary mb-2">
              问题分类 <span className="text-danger">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-text-primary mb-2">
              问题详情 <span className="text-danger">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="请详细描述问题，包括宠物的品种、年龄、症状持续时间、已采取的措施等信息，这有助于兽医更准确地为您解答..."
              rows={6}
              className={cn(
                'w-full px-4 py-3 rounded-xl border transition resize-none',
                errors.content
                  ? 'border-danger bg-danger/5 focus:border-danger'
                  : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10'
              )}
              maxLength={2000}
            />
            {errors.content && (
              <p className="mt-1.5 text-sm text-danger flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.content}
              </p>
            )}
            <p className="mt-1.5 text-xs text-text-secondary">
              {formData.content.length}/2000 字符
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-medium text-text-primary mb-3">
              上传图片 <span className="text-text-secondary font-normal">(可选，最多3张)</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden">
                  <img src={img} alt={`上传图片${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-24 h-24 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                  <Image className="w-6 h-6 text-stone-400" />
                  <span className="text-xs text-text-secondary mt-1">添加图片</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.inviteVet}
                onChange={(e) => setFormData({ ...formData, inviteVet: e.target.checked })}
                className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary mt-0.5"
              />
              <div>
                <p className="font-medium text-text-primary flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  邀请兽医回答
                </p>
                <p className="text-sm text-text-secondary mt-0.5">
                  平台将优先推送给认证兽医，通常在15分钟内获得专业回复
                </p>
              </div>
            </label>
          </div>

          {errors.submit && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Link
              to="/qa"
              className="flex-1 px-6 py-3 bg-white border border-stone-200 text-text-primary font-medium rounded-xl hover:bg-stone-50 transition text-center"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || !isLoggedIn}
              className={cn(
                'flex-1 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all flex items-center justify-center gap-2',
                (loading || !isLoggedIn) && 'opacity-50 cursor-not-allowed active:scale-100'
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  发布问题
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
