import { useNavigate } from 'react-router-dom'
import {
  Shield, Phone, Volume2, VolumeX, CheckCircle, AlertCircle, User, CreditCard,
  ScanFace, Eye, ShieldCheck, FileBadge, HardDrive, RefreshCw, Server,
  LayoutDashboard, ChevronRight, Landmark, BarChart3, AlertTriangle, FileSearch,
  ClipboardList, Camera, Loader2, Clock, XCircle, Upload, Activity, Database,
  Headphones, PhoneCall, FileCheck, ThumbsUp, ThumbsDown, ArrowRightLeft,
  WifiOff, Wifi,
} from 'lucide-react'
import { useCertStore } from '@/stores/certStore'
import { useAdminStore } from '@/stores/adminStore'
import { useEffect, useRef, useState } from 'react'
import { DrillDownModal, CredentialReviewModal, ScreenshotGalleryModal } from './home/Modals'
import type { DrillDownState } from './home/Modals'

function maskIdCard(id: string) {
  if (id.length < 7) return id
  return id.slice(0, 3) + '***********' + id.slice(-4)
}

const alertTypeLabels: Record<string, string> = {
  high_frequency: '高频重复',
  remote_cluster: '异地集中',
  face_mismatch: '人脸不匹配',
}

const alertLevelConfig: Record<string, { label: string; bg: string; text: string }> = {
  critical: { label: '严重', bg: 'bg-error/10', text: 'text-error' },
  warning: { label: '警告', bg: 'bg-warning/10', text: 'text-warning' },
}

const compStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  queued: { label: '排队中', bg: 'bg-gray-100', text: 'text-gray-500' },
  processing: { label: '比对中', bg: 'bg-primary/10', text: 'text-primary' },
  completed: { label: '已完成', bg: 'bg-success/10', text: 'text-success' },
  failed: { label: '失败', bg: 'bg-error/10', text: 'text-error' },
  retrying: { label: '重试中', bg: 'bg-warning/10', text: 'text-warning' },
}

const reviewStatusMap: Record<string, { label: string; bg: string; text: string }> = {
  approved: { label: '已通过', bg: 'bg-success/10', text: 'text-success' },
  rejected: { label: '已驳回', bg: 'bg-error/10', text: 'text-error' },
  transferred: { label: '已转办', bg: 'bg-primary/10', text: 'text-primary' },
}

const actionIcons: Record<string, typeof CheckCircle> = {
  '认证通过': CheckCircle,
  '认证失败': XCircle,
  '人工复核通过': FileCheck,
  '预警处理': AlertTriangle,
  '预警触发': AlertTriangle,
}

const barColors = ['#1B3A5C', '#E8763A', '#2EAD6B', '#F5A623', '#D94452']

export default function Home() {
  const navigate = useNavigate()
  const {
    status, certData, error, userInfo, voiceEnabled, toggleVoice,
    cacheEntries, retryLogs, submitReceipt, provinceSyncReceipt,
    comparisonQueue, offlineResumeRecords, credentialReviews, voiceGuideLogs,
    serviceRecord, lastCertPipeline, reset, setStatus, setStep, setComparisonQueue,
  } = useCertStore()
  const {
    dashboardStats, alerts, reviewOrders, auditLogs,
    fetchDashboardStats, fetchAlerts, fetchReviewOrders, fetchAuditLogs,
    processAlert, submitReview,
  } = useAdminStore()

  const spoken = useRef(false)
  const [drillDown, setDrillDown] = useState<DrillDownState>({ type: null, data: '' })
  const [reviewModal, setReviewModal] = useState(false)
  const [screenshotModal, setScreenshotModal] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    if (voiceEnabled && !spoken.current && 'speechSynthesis' in window) {
      spoken.current = true
      const u = new SpeechSynthesisUtterance('欢迎进入养老待遇资格认证系统，请核对您的身份信息后点击开始认证')
      u.lang = 'zh-CN'
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }, [voiceEnabled])

  useEffect(() => {
    fetchDashboardStats()
    fetchAlerts()
    fetchReviewOrders({ status: 'pending' })
    fetchAuditLogs()
  }, [])

  const handleStart = () => {
    reset()
    setStatus('idle')
    setStep('verify')
    navigate('/verify')
  }

  const handleManualReview = (itemId: string) => {
    setComparisonQueue(comparisonQueue.map(item =>
      item.id === itemId
        ? { ...item, manualReviewId: `MR-${Date.now()}`, manualReviewResult: '人工复查中', manualReviewer: '审核员 张明', manualReviewTime: new Date().toLocaleString('zh-CN') }
        : item
    ))
  }

  const pendingAlerts = alerts.filter(a => a.status === 'pending')
  const maxRegionCount = dashboardStats?.regionDistribution ? Math.max(...dashboardStats.regionDistribution.map(r => r.count)) : 1
  const maxHourCount = dashboardStats?.hourlyDistribution ? Math.max(...dashboardStats.hourlyDistribution.map(h => h.count)) : 1
  const totalFailureValue = dashboardStats?.failureReasons ? dashboardStats.failureReasons.reduce((s, f) => s + f.value, 0) : 1
  const lastSuccessAttempt = retryLogs.find(l => l.result === '成功')

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-primary text-white px-5 py-4 flex items-center gap-3 shadow-md sticky top-0 z-30">
        <Shield size={32} />
        <h1 className="text-title font-bold flex-1">养老待遇资格认证</h1>
        <button onClick={toggleVoice} className="w-12 h-12 flex items-center justify-center rounded-badge hover:bg-white/10 transition-colors" aria-label="切换语音引导">
          {voiceEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
        <button onClick={() => navigate('/admin')} className="text-helper text-white/70 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1">
          <LayoutDashboard size={18} />
          管理后台
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-5 gap-5 max-w-lg mx-auto w-full pb-36">
        {voiceEnabled && (
          <div className="flex items-center gap-2 text-primary/60 animate-fade-in w-full">
            <Volume2 size={20} className="text-accent" />
            <span className="text-helper">语音引导已开启</span>
            <span className="flex gap-0.5 items-end h-4">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className="w-1 bg-accent rounded-full animate-voice-wave" style={{ height: '100%', animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </div>
        )}

        <div className={`w-full rounded-card p-5 shadow-card animate-slide-up ${
          status === 'success' ? 'bg-success/5 border-2 border-success/30'
          : status === 'failed' ? 'bg-error/5 border-2 border-error/30'
          : status === 'verifying' ? 'bg-warning/5 border-2 border-warning/30'
          : 'bg-white border-2 border-warning/30'
        }`}>
          <div className="flex items-center gap-3">
            {status === 'success' && <CheckCircle size={40} className="text-success shrink-0" />}
            {status === 'failed' && <XCircle size={40} className="text-error shrink-0" />}
            {status === 'verifying' && <Loader2 size={40} className="text-warning shrink-0 animate-spin" />}
            {status === 'idle' && <AlertCircle size={40} className="text-warning shrink-0" />}
            <div className="flex-1">
              <p className={`text-body-xl font-bold ${status === 'success' ? 'text-success' : status === 'failed' ? 'text-error' : 'text-warning'}`}>
                {status === 'success' && '已认证 · 2026年度'}
                {status === 'failed' && '认证失败'}
                {status === 'verifying' && '认证中...'}
                {status === 'idle' && '待认证 · 2026年度'}
              </p>
              {status === 'success' && certData && (
                <>
                  <p className="text-helper text-success/70 mt-0.5">凭证编号: {certData.certNo}</p>
                  <p className="text-helper text-gray-500">有效期至{certData.validUntil}</p>
                  <button onClick={handleStart} className="mt-2 h-12 px-6 border-2 border-accent text-accent text-helper font-bold rounded-btn hover:bg-accent/5 transition-colors">重新认证</button>
                </>
              )}
              {status === 'failed' && (
                <>
                  {error && <p className="text-helper text-error/70 mt-0.5">{error}</p>}
                  <button onClick={handleStart} className="mt-2 h-12 px-6 bg-accent text-white text-helper font-bold rounded-btn hover:bg-accent/90 transition-colors">重新认证</button>
                </>
              )}
              {status === 'idle' && (
                <button onClick={handleStart} className="mt-2 h-12 px-8 bg-accent text-white text-body-lg font-bold rounded-btn animate-pulse-cta hover:bg-accent/90 transition-colors">开始认证</button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full bg-white rounded-card shadow-card border-l-4 border-primary animate-slide-up">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={22} className="text-primary" />
              <h2 className="text-body-xl font-bold text-primary">待遇领取人信息</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                ['姓名', userInfo.name], ['身份证号', maskIdCard(userInfo.idCard)],
                ['社保卡号', userInfo.socialSecurityNo], ['待遇类型', userInfo.pensionType],
                ['发放地区', userInfo.region],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-baseline">
                  <span className="text-helper text-gray-400">{k}</span>
                  <span className="text-body-lg font-bold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full bg-white rounded-card shadow-card border-l-4 border-success animate-slide-up">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={22} className="text-success" />
              <h2 className="text-body-xl font-bold text-success">银行账户关联</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-baseline">
                <span className="text-helper text-gray-400">开户银行</span>
                <div className="flex items-center gap-1.5">
                  <Landmark size={16} className="text-gray-500" />
                  <span className="text-body-lg font-bold text-gray-800">{userInfo.bankName}</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-helper text-gray-400">银行账号</span>
                <span className="text-body-lg font-bold text-gray-800">{userInfo.bankAccount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-helper text-gray-400">账户状态</span>
                <span className="text-helper font-bold text-white bg-success rounded-badge px-3 py-1">正常</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={22} className="text-primary" />
            <h2 className="text-body-xl font-bold text-primary">最近认证流程</h2>
          </div>
          {status === 'idle' ? (
            <div className="flex flex-col gap-3">
              {['人脸识别', '活体检测', '身份比对', '凭证生成'].map((stepName, i) => {
                const icons = [ScanFace, Eye, ShieldCheck, FileBadge]
                const Icon = icons[i]
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-helper font-bold text-gray-400">{stepName}</span>
                        <span className="text-sm text-gray-300 bg-gray-100 rounded-badge px-2 py-0.5">待开始</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {lastCertPipeline.map((step, i) => {
                const icons = [ScanFace, Eye, ShieldCheck, FileBadge]
                const Icon = icons[i]
                const isError = step.status === '比对失败' || step.status === '失败'
                const isPending = step.status === '未执行' || step.status === '待开始'
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isError ? 'bg-error/10' : isPending ? 'bg-gray-100' : 'bg-success/10'}`}>
                        <Icon size={20} className={isError ? 'text-error' : isPending ? 'text-gray-400' : 'text-success'} />
                      </div>
                      {i < lastCertPipeline.length - 1 && <div className="w-0.5 h-6 bg-gray-200" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-helper font-bold ${isError ? 'text-error' : isPending ? 'text-gray-400' : 'text-success'}`}>{step.step}</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ${isError ? 'bg-error/10 text-error' : isPending ? 'bg-gray-100 text-gray-400' : 'bg-success/10 text-success'}`}>{step.status}</span>
                      </div>
                      <p className={`text-sm ${isError ? 'text-error/70' : isPending ? 'text-gray-400' : 'text-gray-500'}`}>{step.detail}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-400">{step.time}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <WifiOff size={22} className="text-accent" />
            <h2 className="text-body-xl font-bold text-primary">断网续传记录</h2>
          </div>
          {offlineResumeRecords.length === 0 ? (
            <p className="text-helper text-gray-400">暂无断网续传记录</p>
          ) : (
            <div className="flex flex-col gap-3">
              {offlineResumeRecords.map((rec) => (
                <div key={rec.id} className="bg-bg rounded-badge p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {rec.networkStatus === '断网' ? <WifiOff size={16} className="text-error" /> : <Wifi size={16} className="text-warning" />}
                    <span className="text-helper font-bold text-gray-700">{rec.networkStatus}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ml-auto ${
                      rec.resumeStatus === '已续传' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>{rec.resumeStatus === '已续传' ? '续传成功' : '等待续传'}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 ml-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-400">断网时间</span>
                      <span className="text-sm text-gray-700 font-mono">{rec.timestamp}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-400">缓存帧数</span>
                      <span className="text-sm text-gray-700">{rec.cachedFrames}帧</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-400">续传时间</span>
                      <span className="text-sm text-gray-700 font-mono">{rec.resumeTime}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-400">结果</span>
                      <span className="text-sm text-gray-600">{rec.result}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive size={22} className="text-primary" />
            <h2 className="text-body-xl font-bold text-primary">离线缓存记录</h2>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-helper">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-1 text-gray-400 font-normal">类型</th>
                  <th className="text-left py-2 px-1 text-gray-400 font-normal">时间</th>
                  <th className="text-left py-2 px-1 text-gray-400 font-normal">状态</th>
                  <th className="text-right py-2 px-1 text-gray-400 font-normal">大小</th>
                </tr>
              </thead>
              <tbody>
                {cacheEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50">
                    <td className="py-2 px-1 text-gray-700 font-bold">{entry.type}</td>
                    <td className="py-2 px-1 text-gray-500 text-sm">{entry.timestamp}</td>
                    <td className="py-2 px-1">
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ${entry.status === '已缓存' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>{entry.status}</span>
                    </td>
                    <td className="py-2 px-1 text-right text-gray-500 text-sm">{entry.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-400 mt-3">共缓存 {cacheEntries.length} 条记录</p>
        </div>

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={22} className="text-accent" />
            <h2 className="text-body-xl font-bold text-primary">网络重试日志</h2>
          </div>
          {retryLogs.length === 0 ? (
            <p className="text-helper text-success">本次认证无重试记录</p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {retryLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 bg-bg rounded-badge p-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${log.result === '成功' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {log.attempt}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-helper font-bold text-gray-700">第{log.attempt}次重试</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ${log.result === '成功' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{log.result}</span>
                      </div>
                      <p className="text-sm text-gray-500">{log.reason}</p>
                    </div>
                    <span className="text-sm text-gray-400 shrink-0">{log.duration}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-3">
                重试策略: 最多{retryLogs[0]?.maxAttempts || 3}次自动重连{lastSuccessAttempt ? `，第${lastSuccessAttempt.attempt}次成功` : ''}
              </p>
            </>
          )}
        </div>

        {submitReceipt && (
          <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Upload size={22} className="text-primary" />
              <h2 className="text-body-xl font-bold text-primary">认证提交回执</h2>
            </div>
            <div className="flex flex-col gap-3">
              {[
                ['提交编号', submitReceipt.submitId], ['提交时间', submitReceipt.submitTime],
                ['服务端确认', submitReceipt.serverAck], ['认证编号', submitReceipt.certificationId],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-baseline">
                  <span className="text-helper text-gray-400">{k}</span>
                  <span className="text-body-lg font-bold text-gray-800 font-mono">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-success" />
              <span className="text-helper font-bold text-success">✓ 服务端已确认接收</span>
            </div>
          </div>
        )}

        {provinceSyncReceipt && (
          <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Server size={22} className="text-primary" />
              <h2 className="text-body-xl font-bold text-primary">省级核心系统同步回执</h2>
            </div>
            <div className="flex flex-col gap-3">
              {[
                ['同步编号', provinceSyncReceipt.syncId], ['同步时间', provinceSyncReceipt.syncTime],
                ['核心系统引用', provinceSyncReceipt.coreSystemRef], ['数据哈希', provinceSyncReceipt.dataHash],
                ['确认码', provinceSyncReceipt.confirmCode],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-baseline">
                  <span className="text-helper text-gray-400">{k}</span>
                  <span className="text-body-lg font-bold text-gray-800 font-mono">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-success" />
              <span className="text-helper font-bold text-success">✓ 同步成功</span>
            </div>
          </div>
        )}

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={22} className="text-primary" />
            <h2 className="text-body-xl font-bold text-primary">外部库异步比对队列</h2>
          </div>
          {comparisonQueue.length === 0 ? (
            <p className="text-helper text-gray-400">暂无比对队列</p>
          ) : (
            <div className="flex flex-col gap-3">
              {comparisonQueue.map((item) => {
                const cfg = compStatusConfig[item.status] || compStatusConfig.queued
                return (
                  <div key={item.id} className="bg-bg rounded-badge p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Database size={16} className="text-primary" />
                      <span className="text-helper font-bold text-gray-700">{item.source}</span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      {item.retryCount > 0 && (
                        <span className="text-sm text-gray-500">重试 {item.retryCount}/{item.maxRetries}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 ml-6">
                      {item.matchResult && (
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-gray-400">比对结果</span>
                          <span className={`text-sm font-bold ${item.status === 'completed' ? 'text-success' : item.status === 'failed' ? 'text-error' : 'text-gray-600'}`}>{item.matchResult}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-400">参考编号</span>
                        <span className="text-sm text-gray-700 font-mono">{item.refCode}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-400">提交时间</span>
                        <span className="text-sm text-gray-700 font-mono">{item.submitTime}</span>
                      </div>
                      {item.completedTime && (
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-gray-400">完成时间</span>
                          <span className="text-sm text-gray-700 font-mono">{item.completedTime}</span>
                        </div>
                      )}
                      {item.lastError && (item.status === 'failed' || item.status === 'retrying') && (
                        <p className="text-sm text-error mt-1">错误: {item.lastError}</p>
                      )}
                      {(item.status === 'failed' || item.status === 'retrying') && (
                        item.manualReviewId ? (
                          <div className="mt-2 bg-primary/5 rounded-badge p-2">
                            <p className="text-sm text-primary font-bold">人工复查: {item.manualReviewResult} by {item.manualReviewer} at {item.manualReviewTime}</p>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm font-bold text-warning">等待人工复查</span>
                            <button onClick={() => handleManualReview(item.id)} className="h-8 px-3 text-sm font-bold text-white bg-accent rounded-badge hover:bg-accent/90 transition-colors">发起人工复查</button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck size={22} className="text-primary" />
            <h2 className="text-body-xl font-bold text-primary">凭证复查记录</h2>
          </div>
          {credentialReviews.length === 0 ? (
            <p className="text-helper text-gray-400">暂无凭证复查记录</p>
          ) : (
            <div className="flex flex-col gap-3">
              {credentialReviews.map((rec) => (
                <div key={rec.id} className="bg-bg rounded-badge p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileBadge size={16} className="text-primary" />
                    <span className="text-helper font-bold text-gray-700">{rec.certNo}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ml-auto ${rec.result === '凭证有效' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{rec.result}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 ml-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-400">复查时间</span>
                      <span className="text-sm text-gray-700">{rec.reviewTime}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-400">复查人</span>
                      <span className="text-sm text-gray-700">{rec.reviewer}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-400">备注</span>
                      <span className="text-sm text-gray-600">{rec.notes}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-400">设备指纹</span>
                      <span className="text-sm text-gray-700 font-mono">{rec.deviceFingerprint}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-400">IP地址</span>
                      <span className="text-sm text-gray-700 font-mono">{rec.ip}</span>
                    </div>
                  </div>
                  <div className="mt-2 ml-6">
                    <button onClick={() => setReviewModal(true)} className="h-10 px-4 text-sm font-bold text-primary border border-primary/20 rounded-badge hover:bg-primary/5 transition-colors flex items-center gap-1">
                      <Eye size={14} />
                      复查凭证
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 size={22} className="text-primary" />
            <h2 className="text-body-xl font-bold text-primary">语音引导记录</h2>
            <button onClick={toggleVoice} className="ml-auto h-10 px-3 flex items-center gap-1 rounded-badge text-sm font-bold transition-colors">
              {voiceEnabled ? (
                <><Volume2 size={16} className="text-success" /><span className="text-success">已开启</span></>
              ) : (
                <><VolumeX size={16} className="text-gray-400" /><span className="text-gray-400">已关闭</span></>
              )}
            </button>
          </div>
          {voiceGuideLogs.length === 0 ? (
            <p className="text-helper text-gray-400">暂无语音引导记录</p>
          ) : (
            <div className="flex flex-col gap-3">
              {voiceGuideLogs.map((log, i) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${log.played ? 'bg-success/10' : 'bg-gray-100'}`}>
                      {log.played ? <Volume2 size={14} className="text-success" /> : <VolumeX size={14} className="text-gray-400" />}
                    </div>
                    {i < voiceGuideLogs.length - 1 && <div className="w-0.5 h-6 bg-gray-200" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-helper font-bold text-gray-700">{log.step}</span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ${log.played ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'}`}>
                        {log.played ? '✓已播' : '未播'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{log.text}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-400">{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {dashboardStats && (
          <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={22} className="text-primary" />
              <h2 className="text-body-xl font-bold text-primary">全省认证数据概览</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-primary/5 rounded-badge p-3 flex flex-col items-center">
                <span className="text-sm text-gray-500">总认证量</span>
                <span className="text-body-xl font-bold text-primary">{dashboardStats.totalCerts.toLocaleString()}</span>
              </div>
              <div className="bg-accent/5 rounded-badge p-3 flex flex-col items-center">
                <span className="text-sm text-gray-500">今日认证</span>
                <span className="text-body-xl font-bold text-accent">{dashboardStats.todayCerts.toLocaleString()}</span>
              </div>
              <div className="bg-success/5 rounded-badge p-3 flex flex-col items-center">
                <span className="text-sm text-gray-500">通过率</span>
                <span className="text-body-xl font-bold text-success">{dashboardStats.passRate}%</span>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-helper font-bold text-gray-700 mb-3">地区分布</h3>
              <div className="flex flex-col gap-2">
                {dashboardStats.regionDistribution.map((r, i) => (
                  <div key={r.region} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-badge p-1 -m-1 transition-colors" onClick={() => setDrillDown({ type: 'region', data: r.region })}>
                    <span className="text-sm text-gray-600 w-16 shrink-0">{r.region}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(r.count / maxRegionCount) * 100}%`, backgroundColor: barColors[i % barColors.length] }} />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">{r.count.toLocaleString()}</span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-helper font-bold text-gray-700 mb-3">时段分布</h3>
              <div className="flex items-end gap-1 h-24">
                {dashboardStats.hourlyDistribution.map((h, i) => {
                  const nextHour = String(Number(h.hour.split(':')[0]) + 1).padStart(2, '0')
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => setDrillDown({ type: 'time', data: `${h.hour}-${nextHour}:00` })}>
                      <div className="w-full rounded-t-sm bg-primary/60 hover:bg-primary transition-colors" style={{ height: `${(h.count / maxHourCount) * 80}px` }} />
                      <span className="text-xs text-gray-400">{h.hour.slice(0, 2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-helper font-bold text-gray-700 mb-3">失败原因</h3>
              <div className="flex flex-col gap-2">
                {dashboardStats.failureReasons.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-badge p-1 -m-1 transition-colors" onClick={() => setDrillDown({ type: 'failure', data: f.name })}>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: barColors[i % barColors.length] }} />
                    <span className="text-sm text-gray-600 flex-1">{f.name}</span>
                    <span className="text-sm text-gray-500">{f.value}</span>
                    <span className="text-sm text-gray-400 w-12 text-right">{totalFailureValue > 0 ? Math.round((f.value / totalFailureValue) * 100) : 0}%</span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => navigate('/admin')} className="w-full py-3 text-helper text-primary font-bold rounded-badge border border-primary/20 hover:bg-primary/5 transition-colors flex items-center justify-center gap-1">
              查看完整看板 <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={22} className="text-warning" />
            <h2 className="text-body-xl font-bold text-primary">异常预警</h2>
            {pendingAlerts.length > 0 && (
              <span className="ml-auto bg-error text-white text-sm font-bold rounded-badge px-2 py-0.5">{pendingAlerts.length}</span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <CheckCircle size={20} className="text-success" />
              <span className="text-helper text-success">暂无预警</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {alerts.slice(0, 5).map((alert) => {
                const levelCfg = alertLevelConfig[alert.level] || alertLevelConfig.warning
                const isPending = alert.status === 'pending'
                return (
                  <div key={alert.id} className="bg-bg rounded-badge p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-helper font-bold text-gray-700">{alertTypeLabels[alert.type] || alert.type}</span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ${levelCfg.bg} ${levelCfg.text}`}>{levelCfg.label}</span>
                      {!isPending && <span className="text-sm font-bold px-2 py-0.5 rounded-badge bg-success/10 text-success ml-auto">已处理</span>}
                    </div>
                    <p className="text-sm text-gray-600">{alert.detail}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-400">{alert.triggeredAt}</span>
                      </div>
                      {isPending && (
                        <button onClick={() => processAlert(alert.id)} className="h-10 px-4 text-sm font-bold text-white bg-accent rounded-badge hover:bg-accent/90 transition-colors">处理</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <FileSearch size={22} className="text-accent" />
            <h2 className="text-body-xl font-bold text-primary">待复核工单池</h2>
            {reviewOrders.filter(o => o.status === 'pending').length > 0 && (
              <span className="ml-auto bg-accent text-white text-sm font-bold rounded-badge px-2 py-0.5">{reviewOrders.filter(o => o.status === 'pending').length}</span>
            )}
          </div>
          {reviewOrders.length === 0 ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <CheckCircle size={20} className="text-success" />
              <span className="text-helper text-success">暂无待复核工单</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviewOrders.slice(0, 5).map((order) => {
                const isPending = order.status === 'pending'
                const statusCfg = reviewStatusMap[order.status]
                return (
                  <div key={order.id} className="bg-bg rounded-badge p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-helper font-bold text-gray-700">{order.name}</span>
                      <span className="text-sm text-gray-400">{order.idCard}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={14} className="text-error shrink-0" />
                      <span className="text-sm text-error">{order.failureReason}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-400">{order.verifyTime}</span>
                    </div>
                    {isPending ? (
                      <div className="flex gap-2">
                        <button onClick={() => submitReview(order.id, 'approved', '审核通过')} className="flex-1 h-12 bg-success text-white text-sm font-bold rounded-badge flex items-center justify-center gap-1 hover:bg-success/90 transition-colors">
                          <ThumbsUp size={16} /> 通过
                        </button>
                        <button onClick={() => submitReview(order.id, 'rejected', '审核驳回')} className="flex-1 h-12 bg-error text-white text-sm font-bold rounded-badge flex items-center justify-center gap-1 hover:bg-error/90 transition-colors">
                          <ThumbsDown size={16} /> 驳回
                        </button>
                        <button onClick={() => submitReview(order.id, 'transferred', '转办处理')} className="flex-1 h-12 bg-primary text-white text-sm font-bold rounded-badge flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors">
                          <ArrowRightLeft size={16} /> 转办
                        </button>
                      </div>
                    ) : statusCfg ? (
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ${statusCfg.bg} ${statusCfg.text}`}>{statusCfg.label}</span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={22} className="text-primary" />
            <h2 className="text-body-xl font-bold text-primary">认证日志审计</h2>
          </div>
          {auditLogs.length === 0 ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <span className="text-helper text-gray-400">暂无日志</span>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {auditLogs.slice(0, 5).map((log, i) => {
                const ActionIcon = actionIcons[log.action] || AlertCircle
                const isSuccess = log.action.includes('通过')
                const isError = log.action.includes('失败')
                const isExpanded = expandedLog === log.id
                return (
                  <div key={log.id}>
                    <button className="flex items-start gap-3 w-full text-left" onClick={() => setExpandedLog(isExpanded ? null : log.id)}>
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? 'bg-success/10' : isError ? 'bg-error/10' : 'bg-primary/10'}`}>
                          <ActionIcon size={16} className={isSuccess ? 'text-success' : isError ? 'text-error' : 'text-primary'} />
                        </div>
                        {i < Math.min(auditLogs.length, 5) - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-helper font-bold text-gray-700">{log.action}</span>
                          <ChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                        <p className="text-sm text-gray-500">{log.detail}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-sm text-gray-400">{log.timestamp}</span>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="mt-2 bg-bg rounded-badge p-2 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <ScanFace size={12} className="text-gray-400" />
                              <span className="text-sm text-gray-400">设备指纹:</span>
                              <span className="text-sm text-gray-600 font-mono">{log.operator}</span>
                            </div>
                            {certData && (
                              <div className="flex items-center gap-2">
                                <FileBadge size={12} className="text-gray-400" />
                                <span className="text-sm text-gray-400">凭证编号:</span>
                                <span className="text-sm text-gray-600 font-mono">{certData.certNo}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Eye size={12} className="text-gray-400" />
                              <span className="text-sm text-gray-400">目标:</span>
                              <span className="text-sm text-gray-600 font-mono">{log.target}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Camera size={12} className="text-gray-400" />
                              <span className="text-sm text-gray-400">帧截图:</span>
                              <div className="flex gap-1">
                                {[1, 2, 3].map(n => (
                                  <button key={n} onClick={() => setScreenshotModal(true)} className="w-10 h-7 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 transition-colors">
                                    <Camera size={10} className="text-gray-400" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          <button onClick={() => navigate('/admin/audit')} className="w-full mt-2 py-3 text-helper text-primary font-bold rounded-badge border border-primary/20 hover:bg-primary/5 transition-colors flex items-center justify-center gap-1">
            查看完整审计 <ChevronRight size={16} />
          </button>
        </div>

        <div className="w-full bg-white rounded-card shadow-card p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Headphones size={22} className="text-accent" />
            <h2 className="text-body-xl font-bold text-primary">客服服务记录</h2>
          </div>
          {serviceRecord ? (
            <div className="flex flex-col gap-3">
              {[
                ['呼叫时间', serviceRecord.callTime], ['热线号码', serviceRecord.hotline],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-baseline">
                  <span className="text-helper text-gray-400">{k}</span>
                  <div className="flex items-center gap-1.5">
                    {k === '热线号码' && <PhoneCall size={16} className="text-accent" />}
                    <span className="text-body-lg font-bold text-gray-800">{v}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-helper text-gray-400">服务状态</span>
                <span className="text-helper font-bold text-white bg-success rounded-badge px-3 py-1">{serviceRecord.status}</span>
              </div>
              {[
                ['客服专员', serviceRecord.agent], ['工单编号', serviceRecord.workOrderId],
                ['处理结果', serviceRecord.result], ['回访电话', serviceRecord.callbackPhone],
                ['预计回访时间', serviceRecord.callbackTime],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-baseline">
                  <span className="text-helper text-gray-400">{k}</span>
                  <span className={`text-body-lg font-bold ${k === '工单编号' ? 'font-mono' : ''} text-gray-800`}>{v}</span>
                </div>
              ))}
              {serviceRecord.callDuration && (
                <div className="flex justify-between items-baseline">
                  <span className="text-helper text-gray-400">通话时长</span>
                  <span className="text-body-lg font-bold text-gray-800">{serviceRecord.callDuration}</span>
                </div>
              )}
              {serviceRecord.failureReason && (
                <div className="bg-error/5 rounded-badge p-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-error" />
                  <span className="text-helper text-error font-bold">接通失败: {serviceRecord.failureReason}</span>
                </div>
              )}
              {serviceRecord.callAttempts && serviceRecord.callAttempts.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-helper font-bold text-gray-700 mb-2">呼叫尝试记录</h4>
                  <div className="flex flex-col gap-2">
                    {serviceRecord.callAttempts.map((attempt) => (
                      <div key={attempt.attempt} className="bg-bg rounded-badge p-2 flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-500">第{attempt.attempt}次</span>
                        <span className="text-sm text-gray-500">{attempt.time}</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ${attempt.result === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                          {attempt.result === 'success' ? '成功' : attempt.result === 'no_answer' ? '无人接听' : attempt.result === 'busy' ? '占线' : '失败'}
                        </span>
                        <span className="text-sm text-gray-400 ml-auto">{attempt.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Headphones size={22} className="text-gray-400" />
                <span className="text-helper text-gray-400">暂无客服服务记录</span>
              </div>
            </>
          )}
        </div>

        <p className="text-sm text-gray-400 text-center mt-auto pt-4">
          省级人社系统 · 养老待遇资格认证平台 v1.0
        </p>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-3 z-30">
        <div className="max-w-lg mx-auto flex gap-3">
          <a href="tel:4001234567" className="flex-1 h-12 bg-success hover:bg-success/90 text-white text-body-lg font-bold rounded-btn flex items-center justify-center gap-2 transition-colors shadow-md">
            <Phone size={20} />
            一键呼叫客服
          </a>
          <button onClick={() => navigate('/admin')} className="flex-1 h-12 border-2 border-primary text-primary text-body-lg font-bold rounded-btn flex items-center justify-center gap-2 transition-colors hover:bg-primary/5">
            <LayoutDashboard size={20} />
            管理后台
          </button>
        </div>
      </div>

      <DrillDownModal state={drillDown} onClose={() => setDrillDown({ type: null, data: '' })} />
      <CredentialReviewModal certData={certData} onClose={() => setReviewModal(false)} open={reviewModal} />
      <ScreenshotGalleryModal onClose={() => setScreenshotModal(false)} open={screenshotModal} />
    </div>
  )
}
