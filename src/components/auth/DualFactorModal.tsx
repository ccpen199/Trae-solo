import { useState, useRef, useEffect } from 'react'
import { ScanFace, CreditCard, CheckCircle2, X, Shield } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

interface DualFactorModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
}

export default function DualFactorModal({ open, onClose, onSuccess, title }: DualFactorModalProps) {
  const [faceVerified, setFaceVerified] = useState(false)
  const [cardVerified, setCardVerified] = useState(false)
  const [faceScanning, setFaceScanning] = useState(false)
  const [cardReading, setCardReading] = useState(false)
  const verifiedRef = useRef(false)
  const user = useAppStore((s) => s.user)

  useEffect(() => {
    if (!open) {
      setFaceVerified(false)
      setCardVerified(false)
      setFaceScanning(false)
      setCardReading(false)
      verifiedRef.current = false
    }
  }, [open])

  if (!open) return null

  const handleFaceScan = () => {
    if (faceVerified || faceScanning) return
    setFaceScanning(true)
    setTimeout(() => {
      setFaceScanning(false)
      setFaceVerified(true)
    }, 2000)
  }

  const handleCardRead = () => {
    if (cardVerified || cardReading) return
    setCardReading(true)
    setTimeout(() => {
      setCardReading(false)
      setCardVerified(true)
    }, 1500)
  }

  const bothVerified = faceVerified && cardVerified

  const handleSuccess = () => {
    verifiedRef.current = true
    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-card rounded-xl shadow-card-hover w-full max-w-md mx-4 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gov-gold" />
            <h2 className="font-serif text-lg font-semibold text-gov-blue-dark">
              {title ?? '身份验证'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-500 mb-6">
            查看个人敏感数据前，需完成双因子认证
          </p>

          <div className="flex gap-4 mb-6">
            <div
              className={`flex-1 flex flex-col items-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
                faceVerified
                  ? 'border-status-success bg-status-success/5'
                  : faceScanning
                  ? 'border-gov-gold bg-gov-gold/5'
                  : 'border-gray-200 bg-gray-50 hover:border-gov-gold/50'
              }`}
              onClick={handleFaceScan}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                  faceVerified
                    ? 'bg-status-success/10'
                    : faceScanning
                    ? 'bg-gov-gold/10 animate-pulse'
                    : 'bg-gov-blue/5'
                }`}
              >
                {faceVerified ? (
                  <CheckCircle2 className="w-8 h-8 text-status-success" />
                ) : (
                  <ScanFace className={`w-8 h-8 ${faceScanning ? 'text-gov-gold' : 'text-gov-blue'}`} />
                )}
              </div>
              <span className="text-sm font-medium text-gov-blue-dark">生物识别</span>
              <span className="text-xs text-gray-400 mt-1">
                {faceVerified ? '已验证' : faceScanning ? '扫描中...' : '点击扫描'}
              </span>
            </div>

            <div
              className={`flex-1 flex flex-col items-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
                cardVerified
                  ? 'border-status-success bg-status-success/5'
                  : cardReading
                  ? 'border-gov-gold bg-gov-gold/5'
                  : 'border-gray-200 bg-gray-50 hover:border-gov-gold/50'
              }`}
              onClick={handleCardRead}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 relative ${
                  cardVerified
                    ? 'bg-status-success/10'
                    : cardReading
                    ? 'bg-gov-gold/10 animate-pulse'
                    : 'bg-gov-blue/5'
                }`}
              >
                {cardVerified ? (
                  <CheckCircle2 className="w-8 h-8 text-status-success" />
                ) : (
                  <>
                    <CreditCard className={`w-8 h-8 ${cardReading ? 'text-gov-gold' : 'text-gov-blue'}`} />
                    <div className="absolute top-2 right-2 w-2.5 h-2 rounded-sm bg-gov-gold/60" />
                  </>
                )}
              </div>
              <span className="text-sm font-medium text-gov-blue-dark">社保卡芯片</span>
              <span className="text-xs text-gray-400 mt-1">
                {cardVerified ? '已验证' : cardReading ? '读取中...' : '点击读取'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="gov-btn-secondary flex-1 text-center"
            >
              取消
            </button>
            {bothVerified && (
              <button
                onClick={handleSuccess}
                className="gov-btn-primary flex-1 text-center animate-fade-in-up"
              >
                验证通过
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
