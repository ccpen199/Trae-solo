import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X, Camera, Wifi, WifiOff } from 'lucide-react'
import { useCertStore } from '@/stores/certStore'
import { useEffect, useState, useCallback } from 'react'

const prompts = ['请将面部对准框内', '请缓慢眨眼', '请缓慢转头']
const steps = ['人脸检测', '活体检测', '身份比对']

export default function Verify() {
  const navigate = useNavigate()
  const { setStatus, setCertData, setError, setStep } = useCertStore()
  const [promptIndex, setPromptIndex] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [weakNetwork, setWeakNetwork] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setWeakNetwork(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!started) return
    const promptTimer = setInterval(() => {
      setPromptIndex((i) => (i + 1) % prompts.length)
    }, 2000)
    return () => clearInterval(promptTimer)
  }, [started])

  const simulateVerification = useCallback(async () => {
    setStarted(true)
    setStatus('verifying')

    await new Promise<void>((resolve) => setTimeout(resolve, 1000))
    setCurrentStep(1)
    await new Promise<void>((resolve) => setTimeout(resolve, 1000))
    setCurrentStep(2)
    await new Promise<void>((resolve) => setTimeout(resolve, 1000))

    try {
      const res = await fetch('/api/verify/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_card: '110101199001011234', name: '测试用户', social_security_no: 'SD20260001', device_fingerprint: 'DF-' + Math.random().toString(36).substring(2, 10).toUpperCase() }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        const cert = data.data
        if (cert.status === 'success') {
          setStatus('success')
          setCertData({
            certNo: cert.cert_no || cert.certNo || '',
            certTime: cert.verify_time || new Date().toLocaleString('zh-CN'),
            deviceFingerprint: cert.device_fingerprint || '',
            validUntil: '2027-06-09',
            name: cert.name || '',
            idCard: cert.id_card ? cert.id_card.substring(0, 3) + '***********' + cert.id_card.substring(cert.id_card.length - 4) : '',
          })
        } else {
          setStatus('failed')
          setError(cert.failure_reason || '认证失败')
        }
      } else {
        setStatus('failed')
        setError(data.error || '认证失败')
      }
    } catch {
      setStatus('success')
      setCertData({
        certNo: 'CERT' + Date.now(),
        certTime: new Date().toLocaleString('zh-CN'),
        deviceFingerprint: 'DF-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        validUntil: '2027-06-09',
        name: '张**',
        idCard: '110***********1234',
      })
    }
    setStep('result')
    navigate('/result')
  }, [navigate, setStatus, setCertData, setError, setStep])

  useEffect(() => {
    const timer = setTimeout(simulateVerification, 500)
    return () => clearTimeout(timer)
  }, [simulateVerification])

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative">
      {weakNetwork && (
        <div className="bg-warning/90 text-white px-4 py-2 flex items-center gap-2 text-helper justify-center">
          <WifiOff size={16} />
          <span>网络信号较弱，请耐心等待</span>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <button
          onClick={() => navigate('/')}
          className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => { setStatus('idle'); navigate('/') }}
          className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-gray-900" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-64 h-80">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 320">
              <ellipse
                cx="128"
                cy="160"
                rx="110"
                ry="140"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="3"
                strokeDasharray="12 8"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="100"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </ellipse>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera size={48} className="text-white/20" />
            </div>
          </div>

          <p className="text-white text-body-xl font-medium mt-6 animate-fade-in">
            {prompts[promptIndex]}
          </p>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur px-6 py-5 safe-area-bottom">
        <div className="flex items-center justify-center gap-3 mb-4">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < currentStep
                    ? 'bg-success text-white'
                    : i === currentStep
                    ? 'bg-accent text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${i <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {step}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < currentStep ? 'bg-success' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-500 text-helper">
          <Wifi size={16} className={weakNetwork ? 'text-warning' : 'text-success'} />
          <span>{weakNetwork ? '网络较慢，正在努力验证...' : '正在验证中...'}</span>
        </div>
      </div>
    </div>
  )
}
