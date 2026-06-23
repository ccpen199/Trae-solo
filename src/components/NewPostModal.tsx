import { useState } from 'react'
import { X, Image, Send, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'
import { cn } from '@/lib/utils'

interface NewPostModalProps {
  isOpen: boolean
  onClose: () => void
}

const availableTags = ['日常', '晒宠', '求助', '经验分享', '训练', '医疗']

export default function NewPostModal({ isOpen, onClose }: NewPostModalProps) {
  const { user, isLoggedIn } = useAuthStore()
  const { createPost, loading } = useCommunityStore()
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleImageUpload = () => {
    if (images.length >= 9) return
    const newImage = `https://picsum.photos/seed/${Date.now()}/600/600`
    setImages([...images, newImage])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setError('请先登录')
      return
    }
    if (!content.trim() && images.length === 0) {
      setError('请输入内容或上传图片')
      return
    }
    if (content.trim().length < 5) {
      setError('内容至少需要5个字符')
      return
    }

    try {
      setError('')
      await createPost({
        content,
        images,
        tags: selectedTags,
      })
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setContent('')
        setSelectedTags([])
        setImages([])
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || '发布失败')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">发布动态</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-text-primary">内容已提交</p>
              <p className="text-sm text-text-secondary mt-2">正在进行AI安全审核...</p>
            </div>
          ) : (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的养宠生活..."
                className="w-full h-32 p-4 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text-primary placeholder:text-text-secondary/50"
                maxLength={500}
              />
              <div className="text-right text-xs text-text-secondary mt-1">{content.length}/500</div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 9 && (
                <button
                  onClick={handleImageUpload}
                  className="mt-4 w-full aspect-video border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <Image className="w-8 h-8" />
                  <span className="text-sm">添加图片 ({images.length}/9)</span>
                </button>
              )}

              <div className="mt-5">
                <p className="text-sm font-medium text-text-primary mb-3">选择话题标签（最多3个）</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-colors',
                        selectedTags.includes(tag)
                          ? 'bg-primary text-white'
                          : 'bg-stone-100 text-text-secondary hover:bg-stone-200'
                      )}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 p-3 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>您发布的内容将经过AI审核，违规内容将被拦截。平台禁止发布活体交易、虚假信息等违规内容。</span>
                </p>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {loading ? '发布中...' : '发布动态'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
