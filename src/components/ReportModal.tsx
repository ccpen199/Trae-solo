import { useState } from 'react'
import { X, Flag } from 'lucide-react'
import { useCommunityStore } from '@/stores/communityStore'
import { cn } from '@/lib/utils'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  post: any | null
}

const reportReasons = [
  { key: 'porn', label: '色情暴力' },
  { key: 'fake', label: '虚假信息' },
  { key: 'trade', label: '违规交易' },
  { key: 'harass', label: '骚扰辱骂' },
  { key: 'other', label: '其他' },
]

export default function ReportModal({ isOpen, onClose, post }: ReportModalProps) {
  const { reportPost, loading } = useCommunityStore()
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('请选择举报原因')
      return
    }

    try {
      setError('')
      await reportPost(post.id, selectedReason + (description ? `: ${description}` : ''))
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedReason('')
        setDescription('')
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || '举报失败')
    }
  }

  const handleClose = () => {
    setSelectedReason('')
    setDescription('')
    setError('')
    setShowSuccess(false)
    onClose()
  }

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            举报内容
          </h3>
          <button onClick={handleClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-text-primary">举报已提交</p>
              <p className="text-sm text-text-secondary mt-2">我们将尽快处理您的举报</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-text-primary mb-3">请选择举报原因</p>
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <button
                    key={reason.key}
                    onClick={() => setSelectedReason(reason.key)}
                    className={cn(
                      'w-full px-4 py-3 text-left rounded-xl border transition-all',
                      selectedReason === reason.key
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-stone-200 text-text-primary hover:border-primary/50'
                    )}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-text-primary mb-2">补充说明（可选）</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请详细描述违规情况..."
                  className="w-full h-24 p-3 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                  maxLength={200}
                />
              </div>
              {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedReason}
                className="mt-5 w-full px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? '提交中...' : '提交举报'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
