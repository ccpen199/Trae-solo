import { useState, useEffect, FormEvent } from 'react'
import { X, Syringe, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddVaccineModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  initialData?: any
  ocrData?: any
}

const typeOptions = [
  { value: 'vaccine', label: '疫苗' },
  { value: 'deworming', label: '体内驱虫' },
  { value: 'flea_tick', label: '体外驱虫' },
]

export default function AddVaccineModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  ocrData,
}: AddVaccineModalProps) {
  const [formData, setFormData] = useState({
    vaccine_name: '',
    vaccine_type: 'vaccine',
    vaccine_date: '',
    next_date: '',
    hospital: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData || ocrData) {
      const data = ocrData || initialData
      setFormData({
        vaccine_name: data.vaccine_name || '',
        vaccine_type: data.vaccine_type || 'vaccine',
        vaccine_date: data.vaccine_date || '',
        next_date: data.next_date || '',
        hospital: data.hospital || '',
      })
    } else {
      setFormData({
        vaccine_name: '',
        vaccine_type: 'vaccine',
        vaccine_date: '',
        next_date: '',
        hospital: '',
      })
    }
    setErrors({})
  }, [initialData, ocrData, isOpen])

  if (!isOpen) return null

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.vaccine_name.trim()) {
      newErrors.vaccine_name = '请输入疫苗/药品名称'
    }
    if (!formData.vaccine_type) {
      newErrors.vaccine_type = '请选择类型'
    }
    if (!formData.vaccine_date) {
      newErrors.vaccine_date = '请选择接种日期'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      console.error('提交失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Syringe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {ocrData ? '确认OCR识别结果' : '添加疫苗记录'}
              </h2>
              <p className="text-sm text-text-secondary">
                {ocrData ? '请确认识别信息是否正确' : '填写疫苗接种信息'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {ocrData && (
          <div className="mx-6 mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <p className="text-sm text-purple-700">
              📷 OCR识别置信度: {(ocrData.confidence * 100).toFixed(0)}%
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              类型 <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, vaccine_type: opt.value }))}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-sm font-medium transition-all',
                    formData.vaccine_type === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-stone-200 text-text-secondary hover:border-stone-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              疫苗/药品名称 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.vaccine_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vaccine_name: e.target.value }))
              }
              placeholder="例如: 犬瘟热疫苗"
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border transition-colors',
                errors.vaccine_name
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.vaccine_name && (
              <p className="text-danger text-xs mt-1">{errors.vaccine_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              接种日期 <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={formData.vaccine_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vaccine_date: e.target.value }))
              }
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border transition-colors',
                errors.vaccine_date
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.vaccine_date && (
              <p className="text-danger text-xs mt-1">{errors.vaccine_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              下次接种日期
            </label>
            <input
              type="date"
              value={formData.next_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, next_date: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              接种医院
            </label>
            <input
              type="text"
              value={formData.hospital}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, hospital: e.target.value }))
              }
              placeholder="例如: 宠安动物医院"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-stone-200 rounded-xl font-medium text-text-secondary hover:bg-stone-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '保存'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
