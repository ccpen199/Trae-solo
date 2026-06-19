import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Nfc,
  RefreshCw,
  Wifi,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  History,
  X,
  ChevronRight,
  Smartphone,
  MapPin,
  Clock,
  Fingerprint,
  EyeOff,
  QrCode,
  Settings,
  UserCheck,
  FileCheck,
} from 'lucide-react'

const QR_SIZE = 21

function generateQRPattern() {
  const grid: boolean[][] = []
  for (let i = 0; i < QR_SIZE; i++) {
    const row: boolean[] = []
    for (let j = 0; j < QR_SIZE; j++) {
      const isFinderPattern =
        (i < 7 && j < 7) ||
        (i < 7 && j >= QR_SIZE - 7) ||
        (i >= QR_SIZE - 7 && j < 7)
      const isFinderBorder =
        isFinderPattern &&
        (i === 0 || i === 6 || j === 0 || j === 6 ||
         i === QR_SIZE - 7 || i === QR_SIZE - 1 ||
         j === QR_SIZE - 7 || j === QR_SIZE - 1)
      const isFinderInner =
        isFinderPattern &&
        ((i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
        (i >= 2 && i <= 4 && j >= QR_SIZE - 5 && j <= QR_SIZE - 3) ||
        (i >= QR_SIZE - 5 && i <= QR_SIZE - 3 && j >= 2 && j <= 4))

      if (isFinderBorder || isFinderInner) {
        row.push(true)
      } else if (isFinderPattern) {
        row.push(false)
      } else {
        row.push(Math.random() > 0.5)
      }
    }
    grid.push(row)
  }
  return grid
}

interface TraceRecord {
  id: string
  type: string
  time: string
  status: string
  detail?: string
}

interface QrRefreshRecord {
  id: string
  time: string
  ip: string
  device: string
}

interface NfcSettings {
  defaultChannel: 'medical' | 'financial'
  smallAmountFree: boolean
  sensitivity: 'standard' | 'enhanced'
}

function formatNow() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const MOCK_DEVICE = 'iPhone 15 Pro'
const MOCK_IP = '192.168.1.105 · 江苏南京'

export default function EsscPage() {
  const [countdown, setCountdown] = useState(60)
  const [refreshing, setRefreshing] = useState(false)
  const [qrKey, setQrKey] = useState(0)

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyStep, setApplyStep] = useState(1)

  const [showNfcModal, setShowNfcModal] = useState(false)
  const [nfcSettings, setNfcSettings] = useState<NfcSettings>({
    defaultChannel: 'medical',
    smallAmountFree: true,
    sensitivity: 'standard',
  })
  const [nfcLastSync, setNfcLastSync] = useState<string | null>(null)

  const [showQrToast, setShowQrToast] = useState(false)
  const [qrToastStage, setQrToastStage] = useState<'detecting' | 'done'>('detecting')

  const [qrRefreshHistory, setQrRefreshHistory] = useState<QrRefreshRecord[]>([
    { id: '1', time: '2026-06-19 14:32:18', ip: MOCK_IP, device: MOCK_DEVICE },
    { id: '2', time: '2026-06-19 14:31:18', ip: MOCK_IP, device: MOCK_DEVICE },
    { id: '3', time: '2026-06-19 14:30:18', ip: MOCK_IP, device: MOCK_DEVICE },
    { id: '4', time: '2026-06-19 14:29:18', ip: MOCK_IP, device: MOCK_DEVICE },
    { id: '5', time: '2026-06-19 14:28:18', ip: MOCK_IP, device: MOCK_DEVICE },
  ])

  const [traceRecords, setTraceRecords] = useState<TraceRecord[]>([
    {
      id: '1',
      type: '申领电子社保卡',
      time: '2026-01-15 09:32:18',
      status: 'passed',
      detail: '操作流水号：ESSC202601150001 · 人脸匹配度 98.7%',
    },
    {
      id: '2',
      type: 'NFC闪付开通',
      time: '2026-01-15 10:05:42',
      status: 'passed',
      detail: `设备：${MOCK_DEVICE} · 已绑定至金保工程核心库`,
    },
    {
      id: '3',
      type: '二维码刷新',
      time: '近30天',
      status: 'passed',
      detail: '累计刷新 128 次 · 均为本人设备操作',
    },
    {
      id: '4',
      type: '医保支付',
      time: '2026-06-10 11:22:07',
      status: 'passed',
      detail: '南京市第一医院 · 金额 ¥186.50',
    },
  ])

  const qrPattern = useMemo(() => {
    void qrKey
    return generateQRPattern()
  }, [qrKey])

  const handleRefresh = () => {
    setShowQrToast(true)
    setQrToastStage('detecting')

    setTimeout(() => {
      setRefreshing(true)
      setQrToastStage('done')
      setCountdown(60)
      setQrKey((k) => k + 1)
      setQrRefreshHistory((prev) => [
        {
          id: Date.now().toString(),
          time: formatNow(),
          ip: MOCK_IP,
          device: MOCK_DEVICE,
        },
        ...prev,
      ].slice(0, 5))

      setTimeout(() => {
        setRefreshing(false)
      }, 400)

      setTimeout(() => {
        setShowQrToast(false)
      }, 1800)
    }, 900)
  }

  useEffect(() => {
    if (countdown <= 0) {
      handleRefresh()
      return
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleApplyNext = () => {
    if (applyStep < 4) {
      setApplyStep(applyStep + 1)
    }
  }

  const handleApplyClose = () => {
    setShowApplyModal(false)
    setApplyStep(1)
    setTraceRecords((prev) => {
      const exists = prev.some((r) => r.type === '申领电子社保卡' && r.id === 'new')
      if (exists) return prev
      return [
        {
          id: 'new',
          type: '申领电子社保卡',
          time: formatNow(),
          status: 'passed',
          detail: `操作流水号：ESSC${Date.now()} · 设备：${MOCK_DEVICE}`,
        },
        ...prev,
      ]
    })
  }

  const handleNfcChange = <K extends keyof NfcSettings>(key: K, value: NfcSettings[K]) => {
    setNfcSettings((prev) => ({ ...prev, [key]: value }))
    setNfcLastSync(formatNow())
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.2 } },
  }

  const applySteps = [
    { id: 1, title: '实名复核', icon: UserCheck },
    { id: 2, title: '风控提示', icon: ShieldAlert },
    { id: 3, title: '办理结果', icon: FileCheck },
    { id: 4, title: '可追溯记录', icon: History },
  ]

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">电子社保卡</h1>

      <div className="max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                风控安全提示
              </p>
              <ul className="space-y-1 text-amber-700">
                <li className="flex items-start gap-1.5">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                  请勿向他人出示或截图您的电子社保卡二维码，谨防诈骗
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                  NFC闪付仅限本人使用，请勿绑定他人设备
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                  所有操作均被加密记录并对接公安人口库风控系统
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="rounded-xl bg-gov-gradient p-6 text-white shadow-gov-lg relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-card-shine pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gov-gold" />
                <span className="text-sm text-white/70">社会保障卡</span>
              </div>
              <span className="text-xs text-white/50">JS·SI</span>
            </div>

            <p className="font-serif text-base tracking-widest text-center mb-6 text-white/90">
              中华人民共和国社会保障卡
            </p>

            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/50">持卡人</p>
                  <p className="text-xl font-bold tracking-wider">张明</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">证件号码</p>
                  <p className="text-sm font-mono tracking-wider">320102****2345</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">卡号</p>
                  <p className="text-sm font-mono tracking-wider">6217 **** **** 8901</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-11 rounded-md bg-gradient-to-br from-gov-gold to-amber-600 shadow-gold flex items-center justify-center">
                  <div className="w-10 h-7 rounded-sm border-2 border-amber-800/30 grid grid-cols-3 grid-rows-2 gap-px p-0.5">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <span key={idx} className="bg-amber-800/40 rounded-[1px]" />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-white/40">芯片</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/15">
              <div>
                <p className="text-xs text-white/50">发卡银行</p>
                <p className="text-sm">中国工商银行</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">有效期</p>
                <p className="text-sm font-mono">2026.01 - 2036.01</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gov-card p-4 flex items-center gap-3"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gov-text">NFC已开通</p>
            <p className="text-xs text-gov-text-secondary">支持社保卡NFC闪付功能</p>
          </div>
          <Nfc className="w-5 h-5 text-emerald-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="gov-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gov-text flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-gov-blue" />
              动态二维码
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-gov-text-secondary">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              刷新倒计时：
              <span className="font-mono font-bold text-gov-blue">{countdown}s</span>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-lg border border-gov-border">
              <div
                key={qrKey}
                className="grid gap-[2px]"
                style={{
                  gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)`,
                  width: '168px',
                  height: '168px',
                }}
              >
                {qrPattern.map((row, i) =>
                  row.map((cell, j) => (
                    <motion.span
                      key={`${i}-${j}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (i * QR_SIZE + j) * 0.0008 }}
                      className="rounded-[0.5px]"
                      style={{
                        backgroundColor: cell ? '#0D3B66' : 'transparent',
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gov-text-muted mt-2 flex items-center justify-center gap-1">
            <EyeOff className="w-3 h-3" />
            二维码每60秒自动刷新，请勿截图使用
          </p>

          <div className="mt-4 pt-4 border-t border-gov-border/50">
            <p className="text-xs font-medium text-gov-text-secondary mb-2 flex items-center gap-1">
              <History className="w-3 h-3" />
              最近二维码刷新记录
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {qrRefreshHistory.map((record, idx) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-gov-bg-light"
                >
                  <div className="flex items-center gap-2 text-gov-text-secondary">
                    <span className="font-mono text-gov-blue w-4 text-center">{idx + 1}</span>
                    <Clock className="w-3 h-3" />
                    <span>{record.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gov-text-muted">
                    <Smartphone className="w-3 h-3" />
                    <span>{record.device}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          <button
            className="gov-btn-primary !py-3 text-sm"
            onClick={() => {
              setApplyStep(1)
              setShowApplyModal(true)
            }}
          >
            <Wifi className="w-4 h-4 inline mr-1.5" />
            申领电子社保卡
          </button>
          <button
            className="gov-btn-secondary !py-3 text-sm"
            onClick={() => setShowNfcModal(true)}
          >
            <Settings className="w-4 h-4 inline mr-1.5" />
            NFC闪付设置
          </button>
          <button
            className="gov-btn-secondary !py-3 text-sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 inline mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            二维码刷新
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="gov-card p-0 overflow-hidden"
        >
          <div className="p-4 border-b border-gov-border flex items-center gap-2">
            <History className="w-4 h-4 text-gov-blue" />
            <h3 className="font-semibold text-gov-text">办卡及操作追溯记录</h3>
            <span className="gov-badge-blue ml-auto">
              {traceRecords.length} 条记录
            </span>
          </div>
          <div className="divide-y divide-gov-border/50">
            {traceRecords.map((record) => (
              <div key={record.id} className="p-4 hover:bg-gov-bg-light transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {record.type.includes('申领') ? (
                      <div className="w-8 h-8 rounded-lg bg-gov-blue/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-gov-blue" />
                      </div>
                    ) : record.type.includes('NFC') ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Nfc className="w-4 h-4 text-emerald-600" />
                      </div>
                    ) : record.type.includes('二维码') ? (
                      <div className="w-8 h-8 rounded-lg bg-gov-gold/10 flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-4 h-4 text-amber-700" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileCheck className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gov-text">{record.type}</p>
                        <span className="gov-badge-green">通过</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gov-text-muted flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {record.time}
                        </span>
                        {record.detail && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {record.detail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gov-text-muted flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleApplyClose}
          >
            <motion.div
              className="bg-gov-card rounded-xl shadow-gov-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gov-border flex items-center justify-between bg-gov-gradient text-white">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gov-gold" />
                  <h3 className="font-semibold">申领电子社保卡</h3>
                </div>
                <button
                  onClick={handleApplyClose}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-gov-border bg-gov-bg-light">
                <div className="flex items-center justify-between">
                  {applySteps.map((step, idx) => {
                    const StepIcon = step.icon
                    const isActive = step.id === applyStep
                    const isCompleted = step.id < applyStep
                    return (
                      <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isActive
                                ? 'bg-gov-blue text-white ring-4 ring-gov-blue/20'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <StepIcon className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className={`text-[10px] mt-1 ${
                              isActive ? 'text-gov-blue font-medium' : 'text-gov-text-muted'
                            }`}
                          >
                            {step.title}
                          </span>
                        </div>
                        {idx < applySteps.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-2 mb-3 transition-colors ${
                              isCompleted ? 'bg-emerald-400' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <AnimatePresence mode="wait">
                  {applyStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-gov-blue">
                        <UserCheck className="w-5 h-5" />
                        <h4 className="font-semibold">Step 1：实名复核</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-gov-bg-light rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gov-text-secondary">姓名</span>
                            <span className="text-sm font-medium text-gov-text">张明</span>
                          </div>
                        </div>
                        <div className="p-3 bg-gov-bg-light rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gov-text-secondary">身份证号码</span>
                            <span className="text-sm font-mono text-gov-text">320102****2345</span>
                          </div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-emerald-700 flex items-center gap-1">
                              <Fingerprint className="w-3 h-3" />
                              人脸匹配度
                            </span>
                            <span className="text-sm font-bold text-emerald-600">98.7%</span>
                          </div>
                          <p className="text-[10px] text-emerald-600 mt-1">
                            已通过公安人口库实名校验
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {applyStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-gov-blue">
                        <ShieldAlert className="w-5 h-5" />
                        <h4 className="font-semibold">Step 2：风控提示</h4>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                        <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          请仔细阅读以下安全须知
                        </p>
                        <ul className="space-y-1.5 text-sm text-amber-700 pl-2">
                          <li className="flex items-start gap-1.5">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                            请勿向任何人出示或发送电子社保卡二维码
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                            警惕冒充社保局、医保局的钓鱼电话和短信
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                            所有业务办理均在官方 App 内完成，无需跳转外部链接
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                            社保卡仅限本人使用，不得转借他人
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {applyStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-gov-blue">
                        <FileCheck className="w-5 h-5" />
                        <h4 className="font-semibold">Step 3：办理结果</h4>
                      </div>
                      <div className="text-center py-6">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4"
                        >
                          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </motion.div>
                        <p className="text-lg font-semibold text-gov-text">申领成功</p>
                        <p className="text-sm text-gov-text-secondary mt-1">
                          您的电子社保卡已成功激活
                        </p>
                      </div>
                      <div className="p-3 bg-gov-bg-light rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gov-text-secondary">申领流水号</span>
                          <span className="text-xs font-mono text-gov-blue">
                            ESSC{Date.now()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gov-text-secondary">签发机构</span>
                          <span className="text-xs text-gov-text">江苏省人力资源和社会保障厅</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gov-text-secondary">激活时间</span>
                          <span className="text-xs text-gov-text">{formatNow()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {applyStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-gov-blue">
                        <History className="w-5 h-5" />
                        <h4 className="font-semibold">Step 4：可追溯记录</h4>
                      </div>
                      <div className="p-3 bg-gov-blue/5 rounded-lg border border-gov-blue/20">
                        <p className="text-xs text-gov-text-secondary mb-2 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-gov-blue" />
                          本次操作已加密存证，对接金保工程核心库
                        </p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gov-text-secondary">操作类型</span>
                            <span className="font-medium text-gov-text">申领电子社保卡</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gov-text-secondary">操作时间</span>
                            <span className="font-mono text-gov-text">{formatNow()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gov-text-secondary">操作设备</span>
                            <span className="text-gov-text flex items-center gap-1">
                              <Smartphone className="w-3 h-3" />
                              {MOCK_DEVICE}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gov-text-secondary">IP地址</span>
                            <span className="font-mono text-gov-text">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {MOCK_IP}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-4 border-t border-gov-border bg-gov-bg-light flex justify-end gap-2">
                {applyStep > 1 && (
                  <button
                    className="gov-btn-secondary !py-2 text-sm"
                    onClick={() => setApplyStep(applyStep - 1)}
                  >
                    上一步
                  </button>
                )}
                {applyStep < 4 ? (
                  <button className="gov-btn-primary !py-2 text-sm" onClick={handleApplyNext}>
                    下一步
                  </button>
                ) : (
                  <button className="gov-btn-primary !py-2 text-sm" onClick={handleApplyClose}>
                    完成
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNfcModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setShowNfcModal(false)}
          >
            <motion.div
              className="bg-gov-card rounded-xl shadow-gov-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gov-border flex items-center justify-between bg-gov-gradient text-white">
                <div className="flex items-center gap-2">
                  <Nfc className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold">NFC闪付设置</h3>
                </div>
                <button
                  onClick={() => setShowNfcModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    风控提示 · 设备绑定
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    NFC闪付功能与当前设备 <span className="font-mono">{MOCK_DEVICE}</span> 绑定，
                    换设备需重新验证身份。请勿将手机借予他人使用NFC支付。
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 border border-gov-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gov-text">默认支付渠道</p>
                        <p className="text-xs text-gov-text-muted">选择NFC感应时优先使用的账户</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`p-3 rounded-lg border text-left transition-all ${
                          nfcSettings.defaultChannel === 'medical'
                            ? 'border-gov-blue bg-gov-blue/5 ring-2 ring-gov-blue/20'
                            : 'border-gov-border hover:border-gov-blue/50'
                        }`}
                        onClick={() => handleNfcChange('defaultChannel', 'medical')}
                      >
                        <p
                          className={`text-sm font-medium ${
                            nfcSettings.defaultChannel === 'medical'
                              ? 'text-gov-blue'
                              : 'text-gov-text'
                          }`}
                        >
                          医保个人账户
                        </p>
                        <p className="text-[10px] text-gov-text-muted mt-0.5">
                          用于定点医药机构消费
                        </p>
                      </button>
                      <button
                        className={`p-3 rounded-lg border text-left transition-all ${
                          nfcSettings.defaultChannel === 'financial'
                            ? 'border-gov-blue bg-gov-blue/5 ring-2 ring-gov-blue/20'
                            : 'border-gov-border hover:border-gov-blue/50'
                        }`}
                        onClick={() => handleNfcChange('defaultChannel', 'financial')}
                      >
                        <p
                          className={`text-sm font-medium ${
                            nfcSettings.defaultChannel === 'financial'
                              ? 'text-gov-blue'
                              : 'text-gov-text'
                          }`}
                        >
                          金融账户
                        </p>
                        <p className="text-[10px] text-gov-text-muted mt-0.5">
                          支持银联闪付消费
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 border border-gov-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gov-text">小额免密支付</p>
                        <p className="text-xs text-gov-text-muted">
                          单笔不超过 ¥500 时无需输入密码
                        </p>
                      </div>
                      <button
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          nfcSettings.smallAmountFree ? 'bg-gov-blue' : 'bg-gray-300'
                        }`}
                        onClick={() =>
                          handleNfcChange('smallAmountFree', !nfcSettings.smallAmountFree)
                        }
                      >
                        <motion.span
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                          animate={{ x: nfcSettings.smallAmountFree ? 20 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    {nfcSettings.smallAmountFree && (
                      <div className="mt-3 p-2 bg-emerald-50 rounded text-[11px] text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        已开启 · 单日累计限额 ¥1,000
                      </div>
                    )}
                  </div>

                  <div className="p-4 border border-gov-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gov-text">NFC感应灵敏度</p>
                        <p className="text-xs text-gov-text-muted">调节感应距离和响应速度</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          nfcSettings.sensitivity === 'standard'
                            ? 'border-gov-blue bg-gov-blue/5 ring-2 ring-gov-blue/20'
                            : 'border-gov-border hover:border-gov-blue/50'
                        }`}
                        onClick={() => handleNfcChange('sensitivity', 'standard')}
                      >
                        <p
                          className={`text-sm font-medium ${
                            nfcSettings.sensitivity === 'standard'
                              ? 'text-gov-blue'
                              : 'text-gov-text'
                          }`}
                        >
                          标准
                        </p>
                        <p className="text-[10px] text-gov-text-muted">
                          感应距离 2-3cm，省电
                        </p>
                      </button>
                      <button
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          nfcSettings.sensitivity === 'enhanced'
                            ? 'border-gov-blue bg-gov-blue/5 ring-2 ring-gov-blue/20'
                            : 'border-gov-border hover:border-gov-blue/50'
                        }`}
                        onClick={() => handleNfcChange('sensitivity', 'enhanced')}
                      >
                        <p
                          className={`text-sm font-medium ${
                            nfcSettings.sensitivity === 'enhanced'
                              ? 'text-gov-blue'
                              : 'text-gov-text'
                          }`}
                        >
                          增强
                        </p>
                        <p className="text-[10px] text-gov-text-muted">
                          感应距离 4-5cm，响应快
                        </p>
                      </button>
                    </div>
                  </div>
                </div>

                {nfcLastSync && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <p className="text-xs text-emerald-700">
                      设置变更已同步至金保工程核心库，实时生效
                      <span className="block text-[10px] text-emerald-600 mt-0.5">
                        同步时间：{nfcLastSync}
                      </span>
                    </p>
                  </motion.div>
                )}

                <div className="pt-3 border-t border-gov-border">
                  <p className="text-xs font-medium text-gov-text-secondary mb-2 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    操作记录
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-gov-bg-light rounded">
                      <span className="text-gov-text">NFC闪付开通</span>
                      <span className="text-gov-text-muted font-mono">2026-01-15 10:05:42</span>
                    </div>
                    {nfcLastSync && (
                      <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-gov-bg-light rounded">
                        <span className="text-gov-text">设置变更</span>
                        <span className="text-gov-text-muted font-mono">{nfcLastSync}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-gov-bg-light rounded">
                      <span className="text-gov-text">设备绑定</span>
                      <span className="text-gov-text-muted">
                        <Smartphone className="w-3 h-3 inline mr-1" />
                        {MOCK_DEVICE}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gov-border bg-gov-bg-light flex justify-end">
                <button
                  className="gov-btn-primary !py-2 text-sm"
                  onClick={() => setShowNfcModal(false)}
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQrToast && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gov-blue-dark/95 backdrop-blur text-white px-6 py-5 rounded-2xl shadow-gov-lg flex flex-col items-center gap-3 min-w-[240px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {qrToastStage === 'detecting' ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Fingerprint className="w-10 h-10 text-gov-gold" />
                  </motion.div>
                  <p className="text-sm font-medium">正在进行活体检测...</p>
                  <p className="text-[10px] text-white/60">请保持面部在镜头内</p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <p className="text-sm font-medium">二维码已刷新</p>
                  <p className="text-[10px] text-white/60">新码有效期 60 秒</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
