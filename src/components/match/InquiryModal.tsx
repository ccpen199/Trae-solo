import { useState, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { useStore } from '@/store'

interface InquiryModalProps {
  open: boolean
  onClose: () => void
  supplierId: string
  supplierName: string
}

export default function InquiryModal({ open, onClose, supplierId, supplierName }: InquiryModalProps) {
  const addInquiry = useStore((s) => s.addInquiry)
  const currentUser = useStore((s) => s.currentUser)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<'procurement' | 'processing' | 'accessory'>('procurement')
  const [quantity, setQuantity] = useState(0)
  const [budgetMin, setBudgetMin] = useState(0)
  const [budgetMax, setBudgetMax] = useState(0)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [content, setContent] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(`关于${supplierName}的询价`)
      setType('procurement')
      setQuantity(0)
      setBudgetMin(0)
      setBudgetMax(0)
      setDeliveryDate('')
      setContent('')
      setSuccess(false)
    }
  }, [open, supplierName])

  if (!open) return null

  const handleSubmit = () => {
    addInquiry({
      fromUserId: currentUser?.id || 'u1',
      toSupplierId: supplierId,
      type,
      title,
      content,
      quantity,
      budget: { min: budgetMin, max: budgetMax },
      deliveryDate,
    })
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      onClose()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-navy-700">发起询价单</h2>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-600">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-teal-500 text-lg font-medium">询价单已发送，可在订单中心查看</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1">询价标题</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1">询价类型</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'procurement' | 'processing' | 'accessory')}
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="procurement">采购</option>
                <option value="processing">加工</option>
                <option value="accessory">辅料</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1">需求数量</label>
              <input
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1">预算范围</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最低"
                  value={budgetMin || ''}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
                <span className="text-navy-400">-</span>
                <input
                  type="number"
                  placeholder="最高"
                  value={budgetMax || ''}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1">期望交期</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-500 mb-1">详细描述</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          </div>
        )}

        {!success && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-500 hover:bg-navy-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors flex items-center justify-center gap-1"
            >
              <Send size={14} />提交询价
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
