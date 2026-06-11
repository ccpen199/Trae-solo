import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, XCircle, Shield, ArrowLeft, Download, Phone, ScanFace, Eye,
  ShieldCheck, FileBadge, Link, Clock, User, CreditCard, Landmark, Volume2,
  HardDrive, RefreshCw, ClipboardList, Headphones, Server, Upload, Camera,
  AlertTriangle, PhoneCall, PhoneOff, PhoneIncoming, Database, FileCheck,
  Activity, WifiOff, Wifi, Loader2, RotateCcw,
} from 'lucide-react'
import { useCertStore } from '@/stores/certStore'
import { useEffect, useState, useCallback, useRef } from 'react'

const pipelineSteps = [
  { icon: ScanFace, label: '人脸识别', desc: '已完成' },
  { icon: Eye, label: '活体检测', desc: '已完成' },
  { icon: ShieldCheck, label: '身份比对', desc: '社保库匹配通过' },
  { icon: FileBadge, label: '凭证生成', desc: '已签发' },
]

const syncItemsDef = [
  { label: '认证结果已同步至省级核心业务系统', done: true, pending: false },
  { label: '电子凭证已生成并存储至本地', done: true, pending: false },
  { label: '设备指纹已记录并关联', done: true, pending: false },
  { label: '公安人口库异步比对已提交', done: false, pending: true },
  { label: '卫健委死亡信息库比对已提交', done: false, pending: true },
]

type CallState = 'idle' | 'dialing' | 'connected' | 'transferring' | 'transferred' | 'processing' | 'completed' | 'no_answer' | 'busy'
type CallScenario = 'normal' | 'no_answer' | 'busy'
type OfflineRetryStep = 'idle' | 'checking' | 'found' | 'submitting' | 'success' | 'fail'

const normalCallFlow: { state: CallState; duration: number }[] = [
  { state: 'dialing', duration: 2000 },
  { state: 'connected', duration: 1500 },
  { state: 'transferring', duration: 1500 },
  { state: 'transferred', duration: 1500 },
  { state: 'processing', duration: 2000 },
  { state: 'completed', duration: 0 },
]

function formatTime(date: Date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof User }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-helper text-gray-500 shrink-0 flex items-center gap-1.5">
        {Icon && <Icon size={14} className="text-gray-400" />}
        {label}
      </span>
      <span className="text-helper font-medium text-gray-900 text-right ml-4">{value}</span>
    </div>
  )
}

function CompletedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-helper text-gray-500 shrink-0">{label}:</span>
      <span className="text-helper font-medium text-gray-900">{value}</span>
    </div>
  )
}

function getFailedStep(error: string | null): string {
  if (!error) return '身份比对'
  if (error.includes('人脸') || error.includes('检测')) return '人脸检测'
  if (error.includes('活体')) return '活体检测'
  if (error.includes('身份') || error.includes('比对') || error.includes('匹配')) return '身份比对'
  return '身份比对'
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; cls: string }> = {
    queued: { text: '排队中', cls: 'bg-gray-100 text-gray-600' },
    processing: { text: '比对中', cls: 'bg-primary/10 text-primary' },
    completed: { text: '已完成', cls: 'bg-success/10 text-success' },
    failed: { text: '失败', cls: 'bg-error/10 text-error' },
    retrying: { text: '重试中', cls: 'bg-warning/10 text-warning' },
  }
  const c = config[status] || config.queued
  return <span className={`text-helper font-medium px-2.5 py-0.5 rounded-badge ${c.cls}`}>{c.text}</span>
}

function ComparisonQueueSection() {
  const { comparisonQueue } = useCertStore()
  if (comparisonQueue.length === 0) return null
  return (
    <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={20} className="text-primary" />
        <h3 className="text-body-xl font-bold text-gray-900">外部库异步比对结果</h3>
      </div>
      <div className="space-y-4">
        {comparisonQueue.map((item) => (
          <div key={item.id} className="border border-gray-100 rounded-card px-4 py-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-primary" />
                <span className="text-body-lg font-bold text-gray-900">{item.source}</span>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="space-y-2">
              {item.status === 'completed' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-helper text-gray-500">比对结果</span>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={16} className="text-success" />
                      <span className="text-helper font-medium text-success">{item.matchResult}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-helper text-gray-500">引用编号</span>
                    <span className="text-helper font-medium text-gray-700">{item.refCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-helper text-gray-500">完成时间</span>
                    <span className="text-helper text-gray-700">{item.completedTime}</span>
                  </div>
                  {item.retryCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-helper text-gray-500">重试次数</span>
                      <span className="text-helper text-gray-700">{item.retryCount}/{item.maxRetries}</span>
                    </div>
                  )}
                </>
              )}
              {item.status === 'processing' && (
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="text-primary animate-spin" />
                  <span className="text-body-lg text-primary font-medium">比对中...</span>
                </div>
              )}
              {item.status === 'queued' && (
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-gray-400" />
                  <span className="text-helper text-gray-500">等待比对，已提交于 {item.submitTime}</span>
                </div>
              )}
              {item.status === 'failed' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-helper text-gray-500">失败原因</span>
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-error" />
                      <span className="text-helper font-medium text-error">{item.lastError}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-helper text-gray-500">重试次数</span>
                    <span className="text-helper text-error font-medium">{item.retryCount}/{item.maxRetries}</span>
                  </div>
                  {item.manualReviewResult && (
                    <div className="mt-2 bg-success/5 rounded-badge px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ShieldCheck size={14} className="text-success" />
                        <span className="text-helper text-success font-medium">人工复核结果</span>
                      </div>
                      <p className="text-helper text-gray-700">{item.manualReviewResult}（{item.manualReviewer}）</p>
                    </div>
                  )}
                </>
              )}
              {item.status === 'retrying' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-helper text-gray-500">错误信息</span>
                    <div className="flex items-center gap-1.5">
                      <RotateCcw size={16} className="text-warning" />
                      <span className="text-helper font-medium text-warning">{item.lastError}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-helper text-gray-500">重试进度</span>
                    <span className="text-helper text-warning font-medium">{item.retryCount}/{item.maxRetries}</span>
                  </div>
                </>
              )}
              {item.status !== 'completed' && (
                <div className="flex items-center justify-between">
                  <span className="text-helper text-gray-500">提交时间</span>
                  <span className="text-helper text-gray-700">{item.submitTime}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OfflineResumeSection() {
  const { offlineResumeRecords } = useCertStore()
  if (offlineResumeRecords.length === 0) return null
  return (
    <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <WifiOff size={20} className="text-primary" />
        <h3 className="text-body-xl font-bold text-gray-900">断网续传确认</h3>
      </div>
      <div className="space-y-3">
        {offlineResumeRecords.map((rec) => (
          <div key={rec.id} className="border border-gray-100 rounded-card px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-helper text-gray-500">{rec.timestamp}</span>
              <span className="text-helper font-medium text-success flex items-center gap-1">
                <CheckCircle size={14} /> ✓ 续传成功
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-helper text-gray-500">缓存帧数</span>
                <span className="text-helper text-gray-700">{rec.cachedFrames}帧</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-helper text-gray-500">网络状态</span>
                <span className="text-helper text-gray-700">{rec.networkStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-helper text-gray-500">续传状态</span>
                <span className="text-helper text-success font-medium">{rec.resumeStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-helper text-gray-500">续传时间</span>
                <span className="text-helper text-gray-700">{rec.resumeTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-helper text-gray-500">续传结果</span>
                <span className="text-helper text-gray-700">{rec.result}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VoiceGuideLogSection() {
  const { voiceGuideLogs } = useCertStore()
  if (voiceGuideLogs.length === 0) return null
  return (
    <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 size={20} className="text-primary" />
        <h3 className="text-body-xl font-bold text-gray-900">本次语音引导记录</h3>
      </div>
      <div className="space-y-0">
        {voiceGuideLogs.map((log, i) => (
          <div key={log.id} className="flex items-start gap-3 relative">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${log.played ? 'bg-success' : 'bg-gray-300'}`} />
              {i < voiceGuideLogs.length - 1 && <div className="w-0.5 h-6 bg-success/30" />}
            </div>
            <div className="pb-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-helper text-gray-700 font-medium">{log.step}</span>
                <span className="text-helper text-gray-400">{log.timestamp.split(' ')[1]}</span>
              </div>
              <p className="text-helper text-gray-600 mt-0.5">{log.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CallFlowContent({
  callState, serviceTicket, onClose, callAttempts, onRetry,
}: {
  callState: CallState
  serviceTicket: string
  onClose: () => void
  callAttempts: number
  onRetry: () => void
}) {
  const isNoAnswer = callState === 'no_answer'
  const isBusy = callState === 'busy'

  return (
    <div>
      {callState === 'dialing' && (
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4 animate-pulse-cta">
            <PhoneCall size={32} className="text-success" />
          </div>
          <h3 className="text-body-xl font-bold text-gray-900 mb-2">正在拨打</h3>
          <p className="text-body-lg text-primary font-medium">400-123-4567...</p>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-success animate-pulse [animation-delay:0.3s]" />
            <div className="w-2 h-2 rounded-full bg-success animate-pulse [animation-delay:0.6s]" />
          </div>
          <span className="text-helper text-gray-400 mt-2">等待接听中</span>
        </div>
      )}

      {(isNoAnswer || isBusy) && (
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
            {isNoAnswer ? <PhoneOff size={32} className="text-error" /> : <Phone size={32} className="text-warning" />}
          </div>
          <h3 className="text-body-xl font-bold text-error mb-2">{isNoAnswer ? '无人接听' : '线路繁忙'}</h3>
          <p className="text-body-lg text-gray-600 text-center">
            {isNoAnswer
              ? callAttempts >= 2
                ? '仍无人接听，已为您记录，客服将在30分钟内回拨'
                : '客服电话无人接听，是否再次拨打？'
              : callAttempts >= 2
                ? '正在为您重新连接...'
                : '客服线路繁忙，是否再次拨打？'}
          </p>
          {callAttempts < 2 && (
            <button
              onClick={onRetry}
              className="mt-4 h-12 px-8 bg-success text-white text-body-lg font-medium rounded-btn flex items-center gap-2 transition-colors hover:bg-success/90"
            >
              <PhoneCall size={18} />
              再次拨打
            </button>
          )}
        </div>
      )}

      {callState === 'connected' && (
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Phone size={32} className="text-success" />
          </div>
          <h3 className="text-body-xl font-bold text-success mb-2">客服已接通</h3>
          <p className="text-body-lg text-gray-600">正在为您转接养老认证专员...</p>
          <div className="flex items-center gap-2 mt-3">
            <PhoneIncoming size={16} className="text-success" />
            <span className="text-helper text-success">通话中</span>
          </div>
        </div>
      )}

      {callState === 'transferring' && (
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User size={32} className="text-primary animate-pulse" />
          </div>
          <h3 className="text-body-xl font-bold text-gray-900 mb-2">正在转接...</h3>
          <p className="text-body-lg text-gray-600">请稍候，正在转接养老认证专员</p>
          <div className="mt-3">
            <Loader2 size={24} className="text-primary animate-spin" />
          </div>
        </div>
      )}

      {callState === 'transferred' && (
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Headphones size={32} className="text-success" />
          </div>
          <h3 className="text-body-xl font-bold text-success mb-2">专员已接听</h3>
          <p className="text-body-lg text-gray-600">正在核实您的身份信息...</p>
          <div className="flex items-center gap-2 mt-3">
            <ShieldCheck size={16} className="text-success" />
            <span className="text-helper text-success">身份核验中</span>
          </div>
        </div>
      )}

      {callState === 'processing' && (
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ClipboardList size={32} className="text-primary animate-pulse" />
          </div>
          <h3 className="text-body-xl font-bold text-gray-900 mb-2">专员正在处理</h3>
          <p className="text-body-lg text-gray-600">正在处理您的认证问题...</p>
          <div className="mt-3 bg-gray-50 rounded-badge px-3 py-1.5">
            <span className="text-helper text-primary font-medium">工单号: {serviceTicket}</span>
          </div>
        </div>
      )}

      {callState === 'completed' && (
        <div className="py-2">
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h3 className="text-body-xl font-bold text-success mb-1">问题已记录</h3>
          </div>
          <div className="space-y-2.5 bg-gray-50 rounded-card px-4 py-3 mb-4">
            <CompletedRow label="工单编号" value={serviceTicket} />
            <CompletedRow label="处理人" value="客服专员 李明" />
            <CompletedRow label="处理结果" value="已为您登记认证异常，将在1个工作日内电话回访协助" />
            <CompletedRow label="回访电话" value="您的注册手机号 138****6789" />
            <CompletedRow label="预计回访时间" value="1个工作日内" />
          </div>
          <button
            onClick={onClose}
            className="w-full h-12 bg-primary text-white text-body-lg font-medium rounded-btn transition-colors hover:bg-primary/90"
          >
            关闭
          </button>
        </div>
      )}

      {!['completed', 'no_answer', 'busy'].includes(callState) && (
        <button
          onClick={onClose}
          className="w-full h-12 bg-white border-2 border-gray-200 text-gray-700 text-body-lg font-medium rounded-btn flex items-center justify-center gap-2 transition-colors hover:bg-gray-50 mt-4"
        >
          <PhoneOff size={18} />
          挂断
        </button>
      )}

      {['no_answer', 'busy'].includes(callState) && callAttempts >= 2 && (
        <button
          onClick={onClose}
          className="w-full h-12 bg-white border-2 border-gray-200 text-gray-700 text-body-lg font-medium rounded-btn flex items-center justify-center gap-2 transition-colors hover:bg-gray-50 mt-4"
        >
          关闭
        </button>
      )}
    </div>
  )
}

function OfflineRetryFlow({ onResult }: { onResult: (success: boolean) => void }) {
  const [step, setStep] = useState<OfflineRetryStep>('idle')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const start = () => {
    setStep('checking')
    const t1 = setTimeout(() => setStep('found'), 1000)
    const t2 = setTimeout(() => setStep('submitting'), 1500)
    const t3 = setTimeout(() => {
      const success = Math.random() > 0.4
      setStep(success ? 'success' : 'fail')
      onResult(success)
    }, 3000)
    timersRef.current = [t1, t2, t3]
  }

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout)
  }, [])

  if (step === 'idle') {
    return (
      <button
        onClick={start}
        className="w-full h-12 bg-warning text-white text-body-lg font-bold rounded-btn transition-colors flex items-center justify-center gap-2 hover:bg-warning/90"
      >
        <WifiOff size={20} />
        离线重试
      </button>
    )
  }

  return (
    <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <WifiOff size={18} className="text-warning" />
        <h3 className="text-body-xl font-bold text-gray-900">离线重试</h3>
      </div>
      <div className="space-y-2">
        <div className={`flex items-center gap-2 ${step === 'checking' ? 'opacity-100' : 'opacity-60'}`}>
          {step === 'checking' ? <Loader2 size={16} className="text-primary animate-spin" /> : <CheckCircle size={16} className="text-success" />}
          <span className="text-helper text-gray-700">正在检查本地缓存...</span>
        </div>
        {['found', 'submitting', 'success', 'fail'].includes(step) && (
          <div className={`flex items-center gap-2 ${step === 'found' ? 'opacity-100' : 'opacity-60'}`}>
            <CheckCircle size={16} className="text-success" />
            <span className="text-helper text-gray-700">发现3帧缓存数据</span>
          </div>
        )}
        {['submitting', 'success', 'fail'].includes(step) && (
          <div className={`flex items-center gap-2 ${step === 'submitting' ? 'opacity-100' : 'opacity-60'}`}>
            {step === 'submitting' ? <Loader2 size={16} className="text-primary animate-spin" /> : <CheckCircle size={16} className="text-success" />}
            <span className="text-helper text-gray-700">正在重新提交...</span>
          </div>
        )}
        {step === 'success' && (
          <div className="flex items-center gap-2 mt-2 bg-success/5 rounded-badge px-3 py-2">
            <CheckCircle size={18} className="text-success" />
            <span className="text-body-lg text-success font-medium">续传成功！</span>
          </div>
        )}
        {step === 'fail' && (
          <div className="flex items-center gap-2 mt-2 bg-error/5 rounded-badge px-3 py-2">
            <XCircle size={18} className="text-error" />
            <span className="text-body-lg text-error font-medium">请稍后重试或联系客服</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Result() {
  const navigate = useNavigate()
  const {
    status, certData, error, userInfo, voiceEnabled,
    submitReceipt, provinceSyncReceipt, serviceRecord,
    comparisonQueue, offlineResumeRecords, credentialReviews,
    setServiceRecord, setCredentialReviews,
    reset, setStatus, setStep,
  } = useCertStore()
  const isSuccess = status === 'success'
  const [pipelineVisible, setPipelineVisible] = useState(0)
  const [syncVisibleCount, setSyncVisibleCount] = useState(0)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [callState, setCallState] = useState<CallState>('idle')
  const [showProcessingRecord, setShowProcessingRecord] = useState(false)
  const [serviceTicket, setServiceTicket] = useState('')
  const [callScenario, setCallScenario] = useState<CallScenario>('normal')
  const [callAttempts, setCallAttempts] = useState(0)
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [offlineRetryResult, setOfflineRetryResult] = useState<boolean | null>(null)
  const callTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!voiceEnabled) return
    const synth = window.speechSynthesis
    let text: string
    if (isSuccess) {
      const completedSources = comparisonQueue
        .filter((q) => q.status === 'completed')
        .map((q) => q.source)
        .join('、')
      text = `恭喜您，认证成功！您的养老待遇资格已通过认证，电子凭证已生成，认证结果已同步至省级核心业务系统${
        completedSources ? `，${completedSources}比对均已完成` : ''
      }。`
    } else {
      text = `很抱歉，认证未通过。原因是${error || '未知错误'}。建议您在光线充足环境下重新尝试，或拨打客服热线400-123-4567获取帮助。`
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    utterance.lang = 'zh-CN'
    synth.speak(utterance)
    return () => synth.cancel()
  }, [voiceEnabled, isSuccess, error, comparisonQueue])

  useEffect(() => {
    if (!isSuccess) return
    const timers = pipelineSteps.map((_, i) =>
      setTimeout(() => setPipelineVisible(i + 1), (i + 1) * 300)
    )
    return () => timers.forEach(clearTimeout)
  }, [isSuccess])

  useEffect(() => {
    if (!isSuccess) return
    const timers = syncItemsDef.map((_, i) =>
      setTimeout(() => setSyncVisibleCount(i + 1), i * 800)
    )
    return () => timers.forEach(clearTimeout)
  }, [isSuccess])

  useEffect(() => {
    return () => callTimersRef.current.forEach(clearTimeout)
  }, [])

  const handleBack = () => {
    reset()
    navigate('/')
  }

  const handleRetry = () => {
    setStatus('idle')
    setStep('verify')
    navigate('/verify')
  }

  const handleCredentialReview = () => {
    if (!certData) return
    const now = new Date()
    const review = {
      id: 'CR-' + Date.now(),
      certNo: certData.certNo,
      reviewTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
      reviewer: '用户自助复查',
      result: '凭证有效',
      notes: '用户主动复查凭证，信息校验通过',
      deviceFingerprint: certData.deviceFingerprint,
      ip: '119.188.72.xxx',
    }
    setCredentialReviews([...credentialReviews, review])
    setReviewConfirmed(true)
  }

  const handleOfflineRetryResult = useCallback((success: boolean) => {
    setOfflineRetryResult(success)
    if (success) {
      setTimeout(() => {
        setStatus('success')
      }, 1500)
    }
  }, [setStatus])

  const runNormalCallFlow = useCallback((ticket: string, startTime: string, attempts: { attempt: number; result: string; time: string; duration: string }[]) => {
    let currentIdx = 0
    const advance = () => {
      if (currentIdx >= normalCallFlow.length) return
      const { state, duration } = normalCallFlow[currentIdx]
      setCallState(state)
      if (state === 'completed') {
        attempts.push({ attempt: attempts.length + 1, result: 'success', time: formatTime(new Date()), duration: '2分15秒' })
        const ts = Date.now()
        setServiceRecord({
          id: 'SR-' + ts,
          callTime: startTime,
          hotline: '400-123-4567',
          status: 'completed' as const,
          agent: '客服专员 李明',
          workOrderId: ticket,
          result: '已为您登记认证异常，将在1个工作日内电话回访协助',
          callbackPhone: '138****6789',
          callbackTime: '1个工作日内',
          failureReason: '',
          callDuration: '2分15秒',
          callAttempts: attempts.map((a, i) => ({ attempt: i + 1, time: a.time, result: a.result as 'success' | 'no_answer' | 'busy' | 'failed', duration: a.duration })),
        })
        return
      }
      currentIdx++
      const t = setTimeout(advance, duration)
      callTimersRef.current.push(t)
    }
    const t = setTimeout(advance, 300)
    callTimersRef.current.push(t)
  }, [setServiceRecord])

  const startCallFlow = useCallback(() => {
    setShowServiceModal(true)
    setCallState('idle')
    setCallAttempts(0)
    setOfflineRetryResult(null)
    const rand = Math.random()
    const scenario: CallScenario = rand < 0.5 ? 'normal' : rand < 0.75 ? 'no_answer' : 'busy'
    setCallScenario(scenario)
    const now = new Date()
    const startTime = formatTime(now)
    const ticket = `SVO${Date.now()}`
    setServiceTicket(ticket)
    const attempts: { attempt: number; result: string; time: string; duration: string }[] = []
    const timers: ReturnType<typeof setTimeout>[] = []

    if (scenario === 'normal') {
      runNormalCallFlow(ticket, startTime, attempts)
      return
    }

    if (scenario === 'no_answer') {
      setCallState('dialing')
      const t = setTimeout(() => {
        setCallState('no_answer')
        setCallAttempts(1)
        attempts.push({ attempt: 1, result: 'no_answer', time: formatTime(new Date()), duration: '3秒' })
      }, 3000)
      timers.push(t)
    }

    if (scenario === 'busy') {
      setCallState('dialing')
      const t = setTimeout(() => {
        setCallState('busy')
        setCallAttempts(1)
        attempts.push({ attempt: 1, result: 'busy', time: formatTime(new Date()), duration: '2秒' })
      }, 2000)
      timers.push(t)
    }

    callTimersRef.current = timers
  }, [runNormalCallFlow])

  const handleCallRetry = useCallback(() => {
    const newAttempts = callAttempts + 1
    setCallAttempts(newAttempts)
    setCallState('dialing')

    if (callScenario === 'no_answer') {
      if (newAttempts >= 2) {
        const t = setTimeout(() => {
          setCallState('no_answer')
          const ts = Date.now()
          setServiceRecord({
            id: 'SR-' + ts,
            callTime: formatTime(new Date()),
            hotline: '400-123-4567',
            status: 'no_answer' as const,
            agent: '',
            workOrderId: serviceTicket,
            result: '无人接听，已记录，客服将在30分钟内回拨',
            callbackPhone: '138****6789',
            callbackTime: '30分钟内',
            failureReason: '无人接听',
            callDuration: '',
            callAttempts: [
              { attempt: 1, time: formatTime(new Date()), result: 'no_answer' as const, duration: '3秒' },
              { attempt: 2, time: formatTime(new Date()), result: 'no_answer' as const, duration: '3秒' },
            ],
          })
        }, 3000)
        callTimersRef.current.push(t)
        return
      }
      const t = setTimeout(() => {
        setCallState('no_answer')
      }, 3000)
      callTimersRef.current.push(t)
    }

    if (callScenario === 'busy') {
      if (newAttempts >= 2) {
        const t = setTimeout(() => {
          setCallState('connected')
          const startTime = formatTime(new Date())
          const attempts: { attempt: number; time: string; result: 'success' | 'no_answer' | 'busy' | 'failed'; duration: string }[] = [
            { attempt: 1, time: startTime, result: 'busy', duration: '2秒' },
          ]
          let currentIdx = 1
          const advance = () => {
            if (currentIdx >= normalCallFlow.length) return
            const { state, duration } = normalCallFlow[currentIdx]
            setCallState(state)
            if (state === 'completed') {
              attempts.push({ attempt: 2, result: 'success' as const, time: formatTime(new Date()), duration: '2分15秒' })
              const ts = Date.now()
              setServiceRecord({
                id: 'SR-' + ts,
                callTime: startTime,
                hotline: '400-123-4567',
                status: 'completed' as const,
                agent: '客服专员 李明',
                workOrderId: serviceTicket,
                result: '已为您登记认证异常，将在1个工作日内电话回访协助',
                callbackPhone: '138****6789',
                callbackTime: '1个工作日内',
                failureReason: '',
                callDuration: '2分15秒',
                callAttempts: attempts,
              })
              return
            }
            currentIdx++
            const t2 = setTimeout(advance, duration)
            callTimersRef.current.push(t2)
          }
          const t2 = setTimeout(advance, normalCallFlow[1].duration)
          callTimersRef.current.push(t2)
        }, 2000)
        callTimersRef.current.push(t)
        return
      }
      const t = setTimeout(() => {
        setCallState('busy')
      }, 2000)
      callTimersRef.current.push(t)
    }
  }, [callAttempts, callScenario, serviceTicket, setServiceRecord])

  const handleCloseModal = () => {
    setShowServiceModal(false)
    if (callState === 'completed') {
      setShowProcessingRecord(true)
    }
    setCallState('idle')
    callTimersRef.current.forEach(clearTimeout)
    callTimersRef.current = []
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center px-5 py-8">
      <div className="max-w-lg w-full space-y-6">

        <div className="flex items-center justify-center flex-col animate-slide-up">
          {isSuccess ? (
            <>
              <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-4 animate-pulse-cta">
                <CheckCircle size={56} className="text-success" />
              </div>
              <h1 className="text-title-lg font-bold text-success">认证成功</h1>
              <p className="text-body-lg text-gray-500 mt-2">您的养老待遇资格已通过认证</p>
              {voiceEnabled && (
                <div className="flex items-center gap-1.5 mt-3 text-success/70 text-helper">
                  <Volume2 size={16} />
                  <span>语音播报已开启</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center mb-4 animate-pulse-cta">
                <XCircle size={56} className="text-error" />
              </div>
              <h1 className="text-title-lg font-bold text-error">认证失败</h1>
              <p className="text-body-lg text-gray-500 mt-2">养老待遇资格认证未通过</p>
            </>
          )}
        </div>

        {isSuccess && (
          <>
            <div className="animate-fade-in">
              <div className="flex items-center justify-between gap-1">
                {pipelineSteps.map((step, i) => {
                  const Icon = step.icon
                  const visible = i < pipelineVisible
                  return (
                    <div key={step.label} className="flex items-center gap-1 flex-1">
                      <div
                        className={`flex-1 rounded-card px-2 py-3 flex flex-col items-center gap-1.5 transition-all duration-500 ${
                          visible ? 'bg-success/10 opacity-100 translate-y-0' : 'bg-gray-100 opacity-0 translate-y-4'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                          {visible ? <CheckCircle size={16} className="text-white" /> : <Icon size={16} className="text-white" />}
                        </div>
                        <span className="text-helper font-medium text-gray-800 text-center whitespace-nowrap">{step.label}</span>
                        <span className="text-helper text-success text-center whitespace-nowrap">{visible ? step.desc : ''}</span>
                      </div>
                      {i < pipelineSteps.length - 1 && (
                        <div className={`w-4 h-0.5 rounded-full transition-colors duration-300 ${visible ? 'bg-success' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {certData && (
              <div className="bg-white rounded-card shadow-card overflow-hidden animate-fade-in">
                <div className="bg-primary px-5 py-3.5 flex items-center gap-2">
                  <Shield size={20} className="text-white" />
                  <span className="text-white font-medium text-body-lg">养老待遇资格认证电子凭证</span>
                </div>
                <div className="px-4 py-4">
                  <div className="border-2 border-primary/10 rounded-card px-4 py-4 space-y-3.5 relative">
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
                      <div className="w-14 h-14 rounded-full border-2 border-primary/20 flex items-center justify-center opacity-20">
                        <Shield size={28} className="text-primary" />
                      </div>
                    </div>
                    <InfoRow label="认证编号" value={certData.certNo} icon={FileCheck} />
                    <InfoRow label="认证时间" value={certData.certTime} icon={Clock} />
                    <InfoRow label="认证人" value={certData.name} icon={User} />
                    <InfoRow label="证件号" value={certData.idCard} icon={HardDrive} />
                    <div className="bg-primary/5 rounded-badge px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <HardDrive size={16} className="text-primary" />
                        <span className="text-helper text-primary font-medium">设备指纹</span>
                      </div>
                      <p className="text-body-lg font-bold text-primary mt-1 tracking-wider">{certData.deviceFingerprint}</p>
                    </div>
                    <InfoRow label="有效期至" value={certData.validUntil} icon={Clock} />
                    <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                      <span className="text-helper text-primary font-medium">凭证验证码: {certData.certNo.slice(0, 8)}</span>
                      <div className="w-16 h-16 border-2 border-primary/20 rounded-lg relative overflow-hidden bg-primary/5">
                        <div className="absolute inset-1 grid grid-cols-5 grid-rows-5 gap-px">
                          {Array.from({ length: 25 }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`rounded-sm ${(idx + Math.floor(idx / 3)) % 2 === 0 ? 'bg-primary/40' : 'bg-primary/10'}`}
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] text-primary/60 font-bold">QR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={handleCredentialReview}
                      disabled={reviewConfirmed}
                      className={`w-full h-12 rounded-btn text-body-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                        reviewConfirmed
                          ? 'bg-success/10 text-success border-2 border-success/20'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {reviewConfirmed ? (
                        <><CheckCircle size={20} /> 复查凭证已确认</>
                      ) : (
                        <><Eye size={20} /> 复查凭证</>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-gray-400 text-helper">
                    <Download size={14} />
                    <span>长按保存凭证</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Link size={18} className="text-primary" />
                <h3 className="text-body-xl font-bold text-gray-900">认证关联信息</h3>
              </div>
              <div className="space-y-3">
                <InfoRow label="待遇类型" value={userInfo.pensionType} icon={CreditCard} />
                <InfoRow label="社保卡号" value={userInfo.socialSecurityNo} icon={CreditCard} />
                <InfoRow label="发放银行" value={userInfo.bankName} icon={Landmark} />
                <InfoRow label="银行账号" value={userInfo.bankAccount} icon={CreditCard} />
                <InfoRow label="发放地区" value={userInfo.region} icon={Landmark} />
              </div>
            </div>

            <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw size={18} className="text-primary" />
                <h3 className="text-body-xl font-bold text-gray-900">同步状态</h3>
              </div>
              <div className="space-y-2.5">
                {syncItemsDef.map((item, i) => {
                  const visible = i < syncVisibleCount
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 transition-all duration-500 ${
                        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                      }`}
                    >
                      {item.done ? (
                        <CheckCircle size={18} className="text-success shrink-0" />
                      ) : item.pending ? (
                        <Activity size={18} className="text-warning shrink-0 animate-pulse" />
                      ) : (
                        <Clock size={18} className="text-warning shrink-0" />
                      )}
                      <span className="text-helper text-gray-700 flex-1">✓ {item.label}</span>
                      {item.done ? (
                        <span className="text-helper text-success font-medium">已完成</span>
                      ) : item.pending ? (
                        <span className="text-helper bg-warning/10 text-warning px-2 py-0.5 rounded-badge font-medium">比对中</span>
                      ) : (
                        <span className="text-helper bg-warning/10 text-warning px-2 py-0.5 rounded-badge font-medium">已提交待比对</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <ComparisonQueueSection />

            {submitReceipt && (
              <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <Upload size={18} className="text-primary" />
                  <h3 className="text-body-xl font-bold text-gray-900">提交回执</h3>
                </div>
                <div className="space-y-3">
                  <InfoRow label="提交编号" value={submitReceipt.submitId} icon={FileCheck} />
                  <InfoRow label="提交时间" value={submitReceipt.submitTime} icon={Clock} />
                  <InfoRow label="服务端确认" value={submitReceipt.serverAck} icon={Server} />
                  <InfoRow label="认证编号" value={submitReceipt.certificationId} icon={FileBadge} />
                </div>
              </div>
            )}

            {provinceSyncReceipt && (
              <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <Server size={18} className="text-primary" />
                  <h3 className="text-body-xl font-bold text-gray-900">省级核心系统同步</h3>
                </div>
                <div className="space-y-3">
                  <InfoRow label="同步编号" value={provinceSyncReceipt.syncId} icon={Link} />
                  <InfoRow label="同步时间" value={provinceSyncReceipt.syncTime} icon={Clock} />
                  <InfoRow label="核心系统引用" value={provinceSyncReceipt.coreSystemRef} icon={Database} />
                  <InfoRow label="数据哈希" value={provinceSyncReceipt.dataHash} icon={HardDrive} />
                  <InfoRow label="确认码" value={provinceSyncReceipt.confirmCode} icon={ShieldCheck} />
                </div>
                <div className="mt-3 flex items-center gap-2 bg-success/5 rounded-badge px-3 py-2">
                  <CheckCircle size={16} className="text-success" />
                  <span className="text-helper text-success font-medium">{provinceSyncReceipt.status}</span>
                </div>
              </div>
            )}

            <OfflineResumeSection />
            <VoiceGuideLogSection />
          </>
        )}

        {!isSuccess && (
          <>
            <div className="bg-white rounded-card shadow-card px-5 py-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-error" />
                <h3 className="text-body-xl font-bold text-gray-900">认证失败详情</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-error/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Camera size={14} className="text-error" />
                  </div>
                  <div>
                    <span className="text-helper text-gray-500">失败环节</span>
                    <p className="text-body-lg font-medium text-gray-900">{getFailedStep(error)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-error/10 flex items-center justify-center shrink-0 mt-0.5">
                    <XCircle size={14} className="text-error" />
                  </div>
                  <div>
                    <span className="text-helper text-gray-500">失败原因</span>
                    <p className="text-body-lg font-medium text-gray-900">{error || '未知错误'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ScanFace size={14} className="text-primary" />
                  </div>
                  <div>
                    <span className="text-helper text-gray-500">检测帧数</span>
                    <p className="text-body-lg font-medium text-gray-900">已采集3帧</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck size={14} className="text-success" />
                    </div>
                    <div>
                      <span className="text-helper text-gray-500">建议操作</span>
                      <ol className="mt-1.5 space-y-1.5 text-body-lg text-gray-700 list-decimal list-inside">
                        <li>请确保光线充足，避免逆光</li>
                        <li>请摘除帽子、眼镜等遮挡物</li>
                        <li>请保持面部正对摄像头，距离30-50厘米</li>
                        <li>如多次失败，请拨打客服热线获取人工协助</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {offlineResumeRecords.length > 0 && (
              <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <WifiOff size={20} className="text-warning" />
                  <h3 className="text-body-xl font-bold text-gray-900">断网续传恢复</h3>
                </div>
                <div className="space-y-3">
                  {offlineResumeRecords.map((rec) => (
                    <div key={rec.id} className="border border-gray-100 rounded-card px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-helper text-gray-500">{rec.timestamp}</span>
                        <span className={`text-helper font-medium flex items-center gap-1 ${rec.resumeStatus === '已续传' ? 'text-success' : 'text-warning'}`}>
                          {rec.resumeStatus === '已续传' ? <Wifi size={14} /> : <WifiOff size={14} />}
                          {rec.resumeStatus}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-helper text-gray-500">缓存帧数</span>
                          <span className="text-helper text-gray-700">{rec.cachedFrames}帧</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-helper text-gray-500">网络状态</span>
                          <span className="text-helper text-gray-700">{rec.networkStatus}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-helper text-gray-500">续传结果</span>
                          <span className="text-helper text-gray-700">{rec.result}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {offlineRetryResult === null && (
              <OfflineRetryFlow onResult={handleOfflineRetryResult} />
            )}

            {showProcessingRecord && serviceRecord && (
              <div className="bg-white rounded-card shadow-card px-5 py-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList size={18} className="text-primary" />
                  <h3 className="text-body-xl font-bold text-gray-900">客服处理记录</h3>
                </div>
                <div className="space-y-2.5 bg-gray-50 rounded-card px-4 py-3">
                  <CompletedRow label="工单编号" value={serviceRecord.workOrderId} />
                  <CompletedRow label="处理人" value={serviceRecord.agent || '系统'} />
                  <CompletedRow label="处理结果" value={serviceRecord.result} />
                  {serviceRecord.failureReason && <CompletedRow label="失败原因" value={serviceRecord.failureReason} />}
                  <CompletedRow label="通话时长" value={serviceRecord.callDuration || '-'} />
                  {serviceRecord.callAttempts.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-helper text-gray-500">拨打记录:</span>
                      {serviceRecord.callAttempts.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 mt-1">
                          <span className="text-helper text-gray-500">第{a.attempt}次</span>
                          <span className={`text-helper font-medium ${a.result === 'success' ? 'text-success' : 'text-error'}`}>
                            {a.result === 'success' ? '接通' : a.result === 'no_answer' ? '无人接听' : a.result === 'busy' ? '线路繁忙' : '失败'}
                          </span>
                          <span className="text-helper text-gray-400">{a.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="space-y-3 w-full">
          {!isSuccess && (
            <button
              onClick={handleRetry}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-white text-body-lg font-bold rounded-btn transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              重新认证
            </button>
          )}
          {!isSuccess && (
            <button
              onClick={startCallFlow}
              className="w-full h-12 bg-success hover:bg-success/90 text-white text-body-lg font-bold rounded-btn transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              联系客服
            </button>
          )}
          <button
            onClick={handleBack}
            className="w-full h-12 bg-white border-2 border-gray-200 text-gray-700 text-body-lg font-medium rounded-btn flex items-center justify-center gap-2 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
            返回首页
          </button>
        </div>

        {showServiceModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6 animate-fade-in" onClick={handleCloseModal}>
            <div className="bg-white rounded-card shadow-card-hover w-full max-w-sm p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <CallFlowContent
                callState={callState}
                serviceTicket={serviceTicket}
                onClose={handleCloseModal}
                callAttempts={callAttempts}
                onRetry={handleCallRetry}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
