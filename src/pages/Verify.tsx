import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, X, Camera, ScanFace, Eye, ShieldCheck, FileBadge,
  WifiOff, Wifi, Database, Loader2, User, CreditCard, RefreshCw,
  CheckCircle, XCircle, Upload, Server, HardDrive, Activity,
} from 'lucide-react'
import { useCertStore } from '@/stores/certStore'
import { useEffect, useState, useCallback, useRef } from 'react'

const STEPS = ['人脸检测', '活体检测', '身份比对', '凭证生成']
const STEP_STATUS_TEXT: Record<string, string> = {
  completed: '已完成',
  active: '进行中...',
  pending: '待执行',
  failed: '失败',
}

const VOICE_MAP: Record<number, string[]> = {
  0: ['请将面部对准屏幕中央的框内，保持正面朝向'],
  1: ['请缓慢眨眼两次', '请缓慢向左转头，再向右转头'],
  2: ['正在比对您的身份信息，请稍候'],
  3: ['认证通过，正在生成电子凭证'],
}

const PROMPT_CONFIG: Record<number, { texts: string[]; icon: typeof ScanFace; spin?: boolean }> = {
  0: { texts: ['请将面部对准框内'], icon: ScanFace },
  1: { texts: ['请缓慢眨眼', '请缓慢转头'], icon: Eye },
  2: { texts: ['正在比对身份信息...'], icon: Loader2, spin: true },
  3: { texts: ['正在生成电子凭证...'], icon: FileBadge },
}

type FrameState = 'empty' | 'captured'
type LivenessState = 'pending' | 'checking' | 'pass' | 'fail'
type SubmissionState = 'pending' | 'submitting' | 'done'
type SyncState = 'pending' | 'syncing' | 'done'

interface FrameData {
  id: number
  label: string
  state: FrameState
}

interface LivenessItem {
  label: string
  state: LivenessState
}

function maskIdCard(id: string) {
  if (id.length < 7) return id
  return id.slice(0, 3) + '***' + id.slice(-4)
}

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function timeStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function genId(prefix: string) {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${prefix}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export default function Verify() {
  const navigate = useNavigate()
  const {
    setStatus, setCertData, setError, setStep, voiceEnabled, userInfo,
    setCacheEntries, setRetryLogs, setSubmitReceipt, setProvinceSyncReceipt,
    setComparisonQueue, setLastCertPipeline, cacheEntries,
  } = useCertStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [promptIndex, setPromptIndex] = useState(0)
  const [started, setStarted] = useState(false)

  const [frames, setFrames] = useState<FrameData[]>([
    { id: 1, label: '人脸帧', state: 'empty' },
    { id: 2, label: '眨眼帧', state: 'empty' },
    { id: 3, label: '转头帧', state: 'empty' },
  ])
  const [cachedFrameCount, setCachedFrameCount] = useState(0)

  const [livenessItems, setLivenessItems] = useState<LivenessItem[]>([
    { label: '眨眼检测', state: 'pending' },
    { label: '转头检测', state: 'pending' },
  ])

  const [comparisonResult, setComparisonResult] = useState<'none' | 'success' | 'fail'>('none')
  const [credentialResult, setCredentialResult] = useState(false)

  const [weakNetwork, setWeakNetwork] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [retryProgress, setRetryProgress] = useState(0)
  const [networkRecovered, setNetworkRecovered] = useState(false)

  const [cacheState, setCacheState] = useState<'caching' | 'cached' | 'saved'>('caching')

  const [localSaved, setLocalSaved] = useState(false)
  const [localSavedCount, setLocalSavedCount] = useState(0)
  const [dataSubmission, setDataSubmission] = useState<SubmissionState>('pending')
  const [serverAck, setServerAck] = useState('')
  const [provinceSync, setProvinceSync] = useState<SyncState>('pending')
  const [syncConfirmCode, setSyncConfirmCode] = useState('')
  const [actualRetryCount, setActualRetryCount] = useState(0)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const pipelineRef = useRef<{ step: string; status: string; detail: string; time: string }[]>([])

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms)
    timersRef.current.push(t)
    return t
  }, [])

  const addPipeline = useCallback((entry: { step: string; status: string; detail: string; time: string }) => {
    pipelineRef.current = [...pipelineRef.current, entry]
    setLastCertPipeline([...pipelineRef.current])
  }, [setLastCertPipeline])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!voiceEnabled) return
    const synth = window.speechSynthesis
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'zh-CN'
    utter.rate = 0.85
    synth.speak(utter)
  }, [voiceEnabled])

  useEffect(() => {
    if (!started) return
    const lines = VOICE_MAP[currentStep]
    if (!lines || lines.length === 0) return
    speak(lines[0])
    if (lines.length > 1) {
      const t = setTimeout(() => speak(lines[1]), 1500)
      return () => clearTimeout(t)
    }
  }, [currentStep, started, speak])

  useEffect(() => {
    if (!started) return
    const config = PROMPT_CONFIG[currentStep]
    if (!config || config.texts.length <= 1) return
    const t = setInterval(() => {
      setPromptIndex((i) => (i + 1) % config.texts.length)
    }, 2000)
    return () => clearInterval(t)
  }, [currentStep, started])

  const simulateVerification = useCallback(async () => {
    setStarted(true)
    setStatus('verifying')
    pipelineRef.current = []

    addTimer(() => {
      setCacheState('cached')
    }, 500)

    addTimer(() => {
      setCacheState('saved')
      setCachedFrameCount(1)
      setLocalSaved(true)
      setLocalSavedCount(1)
    }, 800)

    addTimer(() => {
      setWeakNetwork(true)
      setRetryCount(1)
      setActualRetryCount(1)
      setRetryProgress(0)
      const progressInterval = setInterval(() => {
        setRetryProgress((p) => {
          if (p >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return p + 2
        })
      }, 40)
      addTimer(() => {
        clearInterval(progressInterval)
        setWeakNetwork(false)
        setNetworkRecovered(true)
        setRetryCount(0)
        setRetryProgress(0)
        addTimer(() => setNetworkRecovered(false), 2000)
      }, 2000)
    }, 1500)

    await new Promise<void>((resolve) => {
      addTimer(resolve, 1500)
    })

    setFrames((prev) => prev.map((f, i) => i === 0 ? { ...f, state: 'captured' } : f))
    setCachedFrameCount(1)

    addPipeline({
      step: '人脸识别',
      status: '已完成',
      detail: '检测到1张人脸，置信度98.7%',
      time: timeStr(),
    })

    setCacheEntries([{
      id: 'CE001',
      type: '人脸检测帧',
      timestamp: nowStr(),
      status: '已缓存',
      size: '128KB',
    }])

    setLocalSavedCount(1)

    setCurrentStep(1)

    addTimer(() => {
      setLivenessItems((prev) => prev.map((item, i) => i === 0 ? { ...item, state: 'checking' } : item))
    }, 500)

    addTimer(() => {
      setLivenessItems((prev) => prev.map((item, i) => i === 0 ? { ...item, state: 'pass' } : item))
    }, 1200)

    addTimer(() => {
      setFrames((prev) => prev.map((f, i) => i === 1 ? { ...f, state: 'captured' } : f))
      setCachedFrameCount(2)
    }, 1500)

    addTimer(() => {
      setLivenessItems((prev) => prev.map((item, i) => i === 1 ? { ...item, state: 'checking' } : item))
    }, 1800)

    addTimer(() => {
      setLivenessItems((prev) => prev.map((item, i) => i === 1 ? { ...item, state: 'pass' } : item))
    }, 2500)

    addTimer(() => {
      setFrames((prev) => prev.map((f, i) => i === 2 ? { ...f, state: 'captured' } : f))
      setCachedFrameCount(3)
      setCacheState('saved')
    }, 2800)

    const livenessBase = nowStr()
    const livenessCacheEntries = [
      { id: 'CE001', type: '人脸检测帧', timestamp: livenessBase, status: '已缓存', size: '128KB' },
      { id: 'CE002', type: '活体检测-眨眼帧', timestamp: nowStr(), status: '已缓存', size: '132KB' },
      { id: 'CE003', type: '活体检测-转头帧', timestamp: nowStr(), status: '已缓存', size: '126KB' },
    ]
    addTimer(() => {
      setCacheEntries(livenessCacheEntries)
      setLocalSavedCount(3)

      addPipeline({
        step: '活体检测',
        status: '已完成',
        detail: '眨眼检测通过，转头检测通过',
        time: timeStr(),
      })
    }, 2800)

    addTimer(() => {
      const retryBase = nowStr()
      setRetryLogs([
        { id: 'RL001', attempt: 1, maxAttempts: 3, triggerTime: retryBase, reason: '网络超时(3000ms)', result: '失败', duration: '3.2s' },
        { id: 'RL002', attempt: 2, maxAttempts: 3, triggerTime: nowStr(), reason: '连接重置', result: '失败', duration: '2.8s' },
        { id: 'RL003', attempt: 3, maxAttempts: 3, triggerTime: nowStr(), reason: '自动重试', result: '成功', duration: '1.5s' },
      ])
      setActualRetryCount(2)
    }, 1500)

    await new Promise<void>((resolve) => {
      addTimer(resolve, 2000)
    })

    setCurrentStep(2)
    setDataSubmission('submitting')

    await new Promise<void>((resolve) => {
      addTimer(resolve, 1500)
    })

    setComparisonResult('success')
    setDataSubmission('done')
    setServerAck('ACK-7A3F8B2E')

    addPipeline({
      step: '身份比对',
      status: '已完成',
      detail: '社保库匹配通过，姓名+证件号一致',
      time: timeStr(),
    })

    setProvinceSync('syncing')

    addTimer(() => {
      setProvinceSync('done')
      setSyncConfirmCode('CONF-202606090915')
    }, 600)

    setCurrentStep(3)

    await new Promise<void>((resolve) => {
      addTimer(resolve, 500)
    })

    setCredentialResult(true)

    addPipeline({
      step: '凭证生成',
      status: '已签发',
      detail: '电子凭证已生成，含时间戳与设备指纹',
      time: timeStr(),
    })

    setCacheEntries([...livenessCacheEntries, {
      id: 'CE004',
      type: '认证提交数据包',
      timestamp: nowStr(),
      status: '已提交',
      size: '386KB',
    }])
    setLocalSavedCount(4)

    setSubmitReceipt({
      submitId: genId('SUB'),
      submitTime: nowStr(),
      status: '已确认接收',
      serverAck: 'ACK-7A3F8B2E',
      certificationId: 'CERT-20260609-370102',
    })

    const syncTime = nowStr()
    setProvinceSyncReceipt({
      syncId: genId('SYNC-SD'),
      syncTime,
      status: '同步成功',
      coreSystemRef: 'CORE-REF-37010220260609',
      dataHash: 'SHA256:4F8A2C...E91B',
      confirmCode: 'CONF-202606090915',
    })

    const compBase = nowStr()
    setComparisonQueue([
      {
        id: 'CQ001', source: '公安人口库', submitTime: compBase,
        status: 'completed' as const, matchResult: '身份信息一致', refCode: 'GA-REF-20260609-003721',
        completedTime: nowStr(), retryCount: 0, maxRetries: 3,
        lastError: '', manualReviewId: '', manualReviewResult: '', manualReviewTime: '', manualReviewer: '',
      },
      {
        id: 'CQ002', source: '卫健委死亡信息库', submitTime: compBase,
        status: 'completed' as const, matchResult: '未发现死亡记录', refCode: 'WJW-REF-20260609-005183',
        completedTime: nowStr(), retryCount: 0, maxRetries: 3,
        lastError: '', manualReviewId: '', manualReviewResult: '', manualReviewTime: '', manualReviewer: '',
      },
      {
        id: 'CQ003', source: '卫健委死亡信息库(增量)', submitTime: nowStr(),
        status: 'processing' as const, matchResult: '比对中', refCode: 'WJW-REF-20260609-006789',
        completedTime: '', retryCount: 0, maxRetries: 3,
        lastError: '', manualReviewId: '', manualReviewResult: '', manualReviewTime: '', manualReviewer: '',
      },
    ])

    try {
      const res = await fetch('/api/verify/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_card: userInfo.idCard,
          name: userInfo.name,
          social_security_no: userInfo.socialSecurityNo,
          device_fingerprint: 'DF-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        }),
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
            idCard: cert.id_card
              ? cert.id_card.substring(0, 3) + '***********' + cert.id_card.substring(cert.id_card.length - 4)
              : '',
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
        name: userInfo.name,
        idCard: maskIdCard(userInfo.idCard),
      })
    }
    setStep('result')
    navigate('/result')
  }, [navigate, setStatus, setCertData, setError, setStep, userInfo, addTimer, addPipeline, setCacheEntries, setRetryLogs, setSubmitReceipt, setProvinceSyncReceipt, setComparisonQueue, setLastCertPipeline])

  useEffect(() => {
    const t = setTimeout(simulateVerification, 500)
    return () => clearTimeout(t)
  }, [simulateVerification])

  const promptConfig = PROMPT_CONFIG[currentStep] ?? PROMPT_CONFIG[0]
  const PromptIcon = promptConfig.icon

  const getStepStatus = (i: number): 'completed' | 'active' | 'pending' | 'failed' => {
    if (i < currentStep) return 'completed'
    if (i === currentStep) return 'active'
    return 'pending'
  }

  const getStepBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-white'
      case 'active': return 'bg-accent text-white'
      case 'failed': return 'bg-error text-white'
      default: return 'bg-gray-200 text-gray-400'
    }
  }

  const renderLivenessIcon = (state: LivenessState) => {
    switch (state) {
      case 'pending': return <div className="w-5 h-5 rounded-full border-2 border-white/30" />
      case 'checking': return <Loader2 size={20} className="text-accent animate-spin" />
      case 'pass': return <CheckCircle size={20} className="text-success" />
      case 'fail': return <XCircle size={20} className="text-error" />
    }
  }

  const getLivenessStatusText = (state: LivenessState) => {
    switch (state) {
      case 'pending': return '待检测'
      case 'checking': return '检测中...'
      case 'pass': return '通过'
      case 'fail': return '未通过'
    }
  }

  const getLivenessStatusColor = (state: LivenessState) => {
    switch (state) {
      case 'pending': return 'text-white/40'
      case 'checking': return 'text-accent'
      case 'pass': return 'text-success'
      case 'fail': return 'text-error'
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {weakNetwork && (
        <div className="bg-warning/90 text-white px-4 py-3 flex flex-col gap-2 animate-fade-in z-30">
          <div className="flex items-center justify-center gap-2 text-body-lg">
            <WifiOff size={20} />
            <span>网络信号较弱，正在自动重试...</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-badge text-helper">
              重试 {retryCount}/3
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${retryProgress}%` }}
            />
          </div>
        </div>
      )}

      {networkRecovered && (
        <div className="bg-success/90 text-white px-4 py-2 flex items-center justify-center gap-2 animate-fade-in z-30">
          <Wifi size={20} />
          <span className="text-body-lg">网络已恢复，数据已重新提交</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-gray-900" />

      <div className="relative z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white active:bg-black/50"
          >
            <ArrowLeft size={24} />
          </button>
          <div
            className={`flex items-center gap-1.5 bg-black/30 rounded-badge px-3 py-1.5 ${
              cacheState === 'caching' ? 'text-warning' : 'text-success'
            }`}
          >
            <Database size={16} />
            <span className="text-helper">
              {cacheState === 'caching'
                ? '缓存中...'
                : cacheState === 'cached'
                  ? '已缓存'
                  : `已保存${cachedFrameCount}帧`}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                cacheState === 'caching' ? 'bg-warning animate-pulse-cta' : 'bg-success'
              }`}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setStatus('idle')
            navigate('/')
          }}
          className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white active:bg-black/50"
        >
          <X size={24} />
        </button>
      </div>

      <div className="text-white text-body-lg font-medium text-center -mt-1 mb-1 relative z-10">
        认证人：{userInfo.name}
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="flex flex-col items-center">
          <div className="relative w-56 h-72">
            <svg className="absolute inset-0 w-full h-full animate-border-dash" viewBox="0 0 224 288">
              <ellipse
                cx="112"
                cy="144"
                rx="96"
                ry="128"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="3"
                strokeDasharray="12 8"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera size={48} className="text-white/20" />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 animate-fade-in">
            <PromptIcon
              size={28}
              className={`text-accent ${promptConfig.spin ? 'animate-spin' : ''}`}
            />
            <p className="text-white text-body-xl font-medium">
              {promptConfig.texts[promptIndex % promptConfig.texts.length]}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-5">
            {frames.map((frame) => (
              <div key={frame.id} className="flex flex-col items-center gap-1">
                <div
                  className={`relative w-16 h-20 rounded-btn flex items-center justify-center transition-all duration-300 ${
                    frame.state === 'captured'
                      ? 'bg-success/20 border-2 border-success'
                      : 'bg-white/10 border-2 border-white/20'
                  }`}
                >
                  <Camera
                    size={20}
                    className={frame.state === 'captured' ? 'text-success/60' : 'text-white/20'}
                  />
                  {frame.state === 'captured' && (
                    <div className="absolute -top-1.5 -right-1.5">
                      <CheckCircle size={16} className="text-success" />
                    </div>
                  )}
                </div>
                <span
                  className={`text-helper ${
                    frame.state === 'captured' ? 'text-success' : 'text-white/40'
                  }`}
                >
                  {frame.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 w-64 bg-black/30 rounded-card px-4 py-3 space-y-2.5 animate-fade-in">
            {livenessItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderLivenessIcon(item.state)}
                  <span className="text-white/90 text-body-lg">{item.label}</span>
                </div>
                <span className={`text-helper font-medium ${getLivenessStatusColor(item.state)}`}>
                  {getLivenessStatusText(item.state)}
                </span>
              </div>
            ))}
          </div>

          {comparisonResult === 'success' && (
            <div className="mt-3 w-64 bg-success/20 border border-success/40 rounded-card px-4 py-3 animate-slide-up">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={20} className="text-success" />
                <span className="text-success text-body-lg font-medium">身份比对通过</span>
              </div>
              <div className="text-success/80 text-helper">
                社保库信息匹配 - {userInfo.name} ({maskIdCard(userInfo.idCard)})
              </div>
            </div>
          )}

          {comparisonResult === 'fail' && (
            <div className="mt-3 w-64 bg-error/20 border border-error/40 rounded-card px-4 py-3 animate-slide-up">
              <div className="flex items-center gap-2">
                <XCircle size={20} className="text-error" />
                <span className="text-error text-body-lg font-medium">身份比对失败</span>
              </div>
            </div>
          )}

          {credentialResult && (
            <div className="mt-3 w-64 space-y-1.5 animate-slide-up">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                <span className="text-success text-helper">电子凭证已生成</span>
                <span className="text-success/60 text-helper">CERT-20260609-370102</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                <span className="text-success text-helper">凭证已存储至本地</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                <span className="text-success text-helper">认证结果已同步至省级核心业务系统</span>
              </div>
            </div>
          )}

          <div className="mt-3 w-64 bg-black/20 rounded-card px-4 py-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className={localSaved ? 'text-success' : 'text-white/40'} />
              <span className="text-white/70 text-helper">本地保存:</span>
              <span className={localSaved ? 'text-success text-helper' : 'text-white/40 text-helper'}>
                {localSaved ? `✓ 已保存 ${localSavedCount}条记录` : '待保存'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Upload size={16} className={dataSubmission === 'done' ? 'text-success' : dataSubmission === 'submitting' ? 'text-accent' : 'text-white/40'} />
              <span className="text-white/70 text-helper">数据提交:</span>
              <span className={
                dataSubmission === 'done' ? 'text-success text-helper' :
                dataSubmission === 'submitting' ? 'text-accent text-helper' :
                'text-white/40 text-helper'
              }>
                {dataSubmission === 'done' ? `✓ 已提交 (${serverAck})` : dataSubmission === 'submitting' ? '提交中...' : '待提交'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Server size={16} className={provinceSync === 'done' ? 'text-success' : provinceSync === 'syncing' ? 'text-accent' : 'text-white/40'} />
              <span className="text-white/70 text-helper">省级同步:</span>
              <span className={
                provinceSync === 'done' ? 'text-success text-helper' :
                provinceSync === 'syncing' ? 'text-accent text-helper' :
                'text-white/40 text-helper'
              }>
                {provinceSync === 'done' ? `✓ 已同步 (${syncConfirmCode})` : provinceSync === 'syncing' ? '同步中...' : '待同步'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className={actualRetryCount > 0 ? 'text-warning' : 'text-white/40'} />
              <span className="text-white/70 text-helper">重试次数:</span>
              <span className={actualRetryCount > 0 ? 'text-warning text-helper' : 'text-white/40 text-helper'}>
                {actualRetryCount}次
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-4 mb-3 bg-white/10 backdrop-blur rounded-card px-4 py-3 animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <User size={18} className="text-white/70" />
          <span className="text-white/90 text-body-lg">认证人：{userInfo.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <CreditCard size={18} className="text-white/70" />
          <span className="text-white/90 text-body-lg">证件：{maskIdCard(userInfo.idCard)}</span>
        </div>
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur px-4 py-5 safe-area-bottom">
        <div className="flex items-center justify-center">
          {STEPS.map((step, i) => {
            const status = getStepStatus(i)
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-body-lg font-bold transition-colors duration-300 ${getStepBadgeClass(status)}`}
                  >
                    {status === 'completed' ? <CheckCircle size={20} /> : status === 'failed' ? <XCircle size={20} /> : i + 1}
                  </div>
                  <span
                    className={`text-helper whitespace-nowrap ${
                      status === 'pending' ? 'text-gray-400' : 'text-gray-900 font-medium'
                    }`}
                  >
                    {step}
                  </span>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      status === 'completed' ? 'text-success' :
                      status === 'active' ? 'text-accent' :
                      status === 'failed' ? 'text-error' :
                      'text-gray-300'
                    }`}
                  >
                    {STEP_STATUS_TEXT[status]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-6 sm:w-10 h-0.5 mx-1 mb-5 transition-colors duration-300 ${
                      i < currentStep ? 'bg-success' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-500 text-helper mt-3">
          {weakNetwork ? (
            <>
              <RefreshCw size={16} className="text-warning animate-spin" />
              <span className="text-warning">网络重试中...</span>
            </>
          ) : (
            <>
              <Activity size={16} className="text-success" />
              <span>正在验证中...</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
