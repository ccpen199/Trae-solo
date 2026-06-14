import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Shield, ArrowLeft, Download } from 'lucide-react'
import { useCertStore } from '@/stores/certStore'

export default function Result() {
  const navigate = useNavigate()
  const { status, certData, error, reset } = useCertStore()
  const isSuccess = status === 'success'

  const handleBack = () => {
    reset()
    navigate('/')
  }

  const handleRetry = () => {
    reset()
    navigate('/verify')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center px-6 py-8">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-center flex-col animate-slide-up">
          {isSuccess ? (
            <>
              <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle size={56} className="text-success" />
              </div>
              <h1 className="text-title-lg font-bold text-success mb-2">认证成功</h1>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <XCircle size={56} className="text-accent" />
              </div>
              <h1 className="text-title-lg font-bold text-accent mb-2">认证失败</h1>
              {error && (
                <p className="text-body-lg text-gray-600 mb-4">{error}</p>
              )}
            </>
          )}
        </div>

        {isSuccess && certData && (
          <div className="mt-6 bg-white rounded-card shadow-card overflow-hidden animate-fade-in">
            <div className="bg-primary px-6 py-3 flex items-center gap-2">
              <Shield size={20} className="text-white" />
              <span className="text-white font-medium">电子认证凭证</span>
            </div>
            <div className="px-6 py-5 space-y-4 border-2 border-primary/10 m-3 rounded-card relative">
              <div className="absolute top-3 right-3">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <Shield size={20} className="text-primary/40" />
                </div>
              </div>
              <InfoRow label="认证编号" value={certData.certNo} />
              <InfoRow label="认证时间" value={certData.certTime} />
              <InfoRow label="设备指纹" value={certData.deviceFingerprint} />
              <InfoRow label="有效期至" value={certData.validUntil} />
              <InfoRow label="姓名" value={certData.name} />
              <InfoRow label="证件号" value={certData.idCard} />
            </div>
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Download size={14} />
                长按保存凭证
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-3 w-full">
          {!isSuccess && (
            <button
              onClick={handleRetry}
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white text-body-lg font-bold rounded-card transition-colors shadow-md"
            >
              重新认证
            </button>
          )}
          <button
            onClick={handleBack}
            className="w-full h-14 bg-white border-2 border-gray-200 text-gray-700 text-body-lg font-medium rounded-card flex items-center justify-center gap-2 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-helper text-gray-500 shrink-0">{label}</span>
      <span className="text-body-lg font-medium text-gray-900 text-right ml-4">{value}</span>
    </div>
  )
}
