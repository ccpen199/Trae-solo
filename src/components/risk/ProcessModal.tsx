import { useState } from 'react'
import { X } from 'lucide-react'
import { type RiskAlert } from './data'

interface ProcessModalProps {
  alert: RiskAlert
  onClose: () => void
  onConfirm: (id: string, result: string, note: string) => void
}

export default function ProcessModal({ alert, onClose, onConfirm }: ProcessModalProps) {
  const [result, setResult] = useState('')
  const [note, setNote] = useState('')

  const options = [
    { value: 'intercept', label: '确认拦截' },
    { value: 'release', label: '放行' },
    { value: 'review', label: '转人工审核' },
  ]

  const handleConfirm = () => {
    if (!result) return
    onConfirm(alert.id, result, note)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">处理预警</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-5">
            <p className="text-sm font-medium text-gray-900 mb-1">{alert.description}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>涉及用户：{alert.user}</span>
              {alert.amount !== '-' && <span>金额：{alert.amount}</span>}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700 mb-2 block">处理结果</label>
            <div className="space-y-2">
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    result === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      result === opt.value ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    {result === opt.value && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                  <span className={`text-sm ${result === opt.value ? 'text-primary font-medium' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700 mb-2 block">处理说明</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="请输入处理说明..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!result}
              className="flex-1 py-2.5 text-sm text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
