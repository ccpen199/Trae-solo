import { useState } from 'react'
import { Search } from 'lucide-react'

interface IdentityStepProps {
  onVerified: (idCard: string) => void
}

function validateIdCard(id: string): boolean {
  return /^\d{17}[\dXx]$/.test(id)
}

export default function IdentityStep({ onVerified }: IdentityStepProps) {
  const [idCard, setIdCard] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!idCard.trim()) {
      setError('请输入身份证号')
      return
    }
    if (!validateIdCard(idCard)) {
      setError('请输入正确的18位身份证号')
      return
    }
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onVerified(idCard)
    }, 2000)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white border border-gray-100 rounded-xl p-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">身份证号</label>
        <input
          type="text"
          value={idCard}
          onChange={(e) => {
            setIdCard(e.target.value)
            if (error) setError('')
          }}
          placeholder="请输入18位身份证号码"
          maxLength={18}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
        />
        {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              核验中...
            </>
          ) : (
            <>
              <Search size={16} />
              开始核验
            </>
          )}
        </button>
      </div>
    </div>
  )
}
