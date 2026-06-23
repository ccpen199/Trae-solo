import { useState } from 'react'
import { X, Heart, CheckCircle } from 'lucide-react'
import { useAdoptionStore } from '@/stores/adoptionStore'

interface ApplyModalProps {
  isOpen: boolean
  onClose: () => void
  adoptionId: number
  petName: string
}

export default function ApplyModal({ isOpen, onClose, adoptionId, petName }: ApplyModalProps) {
  const { applyAdoption } = useAdoptionStore()
  const [experience, setExperience] = useState('')
  const [livingCondition, setLivingCondition] = useState('')
  const [hasOtherPets, setHasOtherPets] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const canSubmit = experience.length >= 10 && livingCondition.length >= 10 && hasOtherPets && agreeTerms

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await applyAdoption(adoptionId, {
        experience,
        living_condition: livingCondition,
        has_other_pets: hasOtherPets === 'yes',
      })
      setSubmitted(true)
    } catch (error) {
      console.error('申请失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setExperience('')
    setLivingCondition('')
    setHasOtherPets('')
    setAgreeTerms(false)
    setSubmitted(false)
    onClose()
  }

  if (!isOpen) return null

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full animate-slideUp text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h3 className="heading-font text-xl font-bold text-text-primary mb-3">申请已提交</h3>
          <p className="text-text-secondary mb-6">
            您的领养申请已成功提交，请等待送养人审核。我们会通过消息通知您审核结果。
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition"
          >
            我知道了
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="heading-font text-xl font-bold text-text-primary">申请领养 {petName}</h3>
            <p className="text-sm text-text-secondary">请填写以下信息，帮助送养人了解您</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-stone-100 rounded-lg transition">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              养宠经验 <span className="text-danger">*</span>
            </label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="请描述您的养宠经验，包括养过什么宠物、养了多久等..."
              className="w-full h-24 p-4 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <p className={`text-sm mt-1 ${experience.length >= 10 ? 'text-success' : 'text-text-secondary'}`}>
              {experience.length}/10 字符（最少10字符）
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              居住条件 <span className="text-danger">*</span>
            </label>
            <textarea
              value={livingCondition}
              onChange={(e) => setLivingCondition(e.target.value)}
              placeholder="请描述您的居住条件，包括房屋类型、面积、是否有阳台、是否封窗等..."
              className="w-full h-24 p-4 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <p className={`text-sm mt-1 ${livingCondition.length >= 10 ? 'text-success' : 'text-text-secondary'}`}>
              {livingCondition.length}/10 字符（最少10字符）
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              是否有其他宠物 <span className="text-danger">*</span>
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setHasOtherPets('yes')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition ${
                  hasOtherPets === 'yes'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-stone-200 text-text-secondary hover:border-primary/50'
                }`}
              >
                是
              </button>
              <button
                onClick={() => setHasOtherPets('no')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition ${
                  hasOtherPets === 'no'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-stone-200 text-text-secondary hover:border-primary/50'
                }`}
              >
                否
              </button>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
            <input
              type="checkbox"
              id="agree"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary focus:ring-primary rounded"
            />
            <label htmlFor="agree" className="text-sm text-text-secondary">
              我承诺以上信息真实有效，并愿意遵守平台领养规则。我理解提供虚假信息将导致申请被拒绝，并承担相应的法律责任。
            </label>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-stone-200 p-6">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Heart className="w-4 h-4" />
            )}
            提交领养申请
          </button>
        </div>
      </div>
    </div>
  )
}
