import { useNavigate } from 'react-router-dom'
import { Shield, Phone, Volume2, CheckCircle, AlertCircle } from 'lucide-react'
import { useCertStore } from '@/stores/certStore'
import { useEffect, useRef } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const { status, setStatus, setStep, reset } = useCertStore()
  const spoken = useRef(false)

  useEffect(() => {
    if (!spoken.current && 'speechSynthesis' in window) {
      spoken.current = true
      const utterance = new SpeechSynthesisUtterance('请点击开始认证')
      utterance.lang = 'zh-CN'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const handleStart = () => {
    reset()
    setStatus('idle')
    setStep('verify')
    navigate('/verify')
  }

  const isCertified = status === 'success'

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-primary text-white px-6 py-5 flex items-center gap-3 shadow-md">
        <Shield size={32} />
        <h1 className="text-title font-bold">养老待遇资格认证</h1>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-8 gap-6 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2 text-primary/60 animate-fade-in">
          <Volume2 size={20} className="text-accent" />
          <span className="text-helper">语音引导已开启</span>
          <span className="flex gap-0.5 items-end h-4">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-1 bg-accent rounded-full animate-voice-wave"
                style={{ height: '100%', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </div>

        <div
          className={`w-full rounded-card p-6 shadow-card animate-slide-up ${
            isCertified ? 'bg-success/5 border-2 border-success/20' : 'bg-white border-2 border-warning/20'
          }`}
        >
          <div className="flex items-center gap-3">
            {isCertified ? (
              <CheckCircle size={40} className="text-success" />
            ) : (
              <AlertCircle size={40} className="text-warning" />
            )}
            <div>
              <p className={`text-xl font-bold ${isCertified ? 'text-success' : 'text-warning'}`}>
                {isCertified ? '已认证' : '待认证'}
              </p>
              <p className="text-helper text-gray-500">
                {isCertified ? '您的养老待遇资格已认证通过' : '请完成养老待遇资格认证'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full max-w-xs h-16 bg-accent hover:bg-accent/90 text-white text-body-xl font-bold rounded-card shadow-lg animate-pulse-cta transition-colors mt-4"
        >
          开始认证
        </button>

        <p className="text-helper text-gray-400 mt-2">
          点击上方按钮开始人脸识别认证
        </p>
      </main>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 safe-area-bottom">
        <button className="w-full h-14 bg-success hover:bg-success/90 text-white text-body-lg font-bold rounded-card flex items-center justify-center gap-2 transition-colors shadow-md">
          <Phone size={22} />
          一键呼叫客服
        </button>
      </div>
    </div>
  )
}
