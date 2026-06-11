import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Lock,
  Send,
  Paperclip,
  Flame,
  Image as ImageIcon,
  FileText,
  MapPin,
  Clock,
  Scale,
  Shield,
  X,
  CheckCircle,
  FileCheck,
  Bot,
  Handshake,
  UserCheck,
  Award,
  ArrowRight,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConsultationStore } from '@/store/useConsultationStore'
import { useMessageStore } from '@/store/useMessageStore'
import { useAuthStore } from '@/store/useAuthStore'
import { applyWatermark } from '@/utils/watermark'
import type { Consultation, Message, LegalCaseType, Lawyer } from '@/types'
import { formatDate, formatTime } from '@/utils/format'
import { lawyers } from '@/mock/data'

const caseTypeMap: Record<LegalCaseType, { label: string; icon: string }> = {
  marriage: { label: '婚姻家庭', icon: '💍' },
  labor: { label: '劳动纠纷', icon: '💼' },
  debt: { label: '债务纠纷', icon: '💰' },
  property: { label: '房产纠纷', icon: '🏠' },
  contract: { label: '合同纠纷', icon: '📄' },
  traffic: { label: '交通事故', icon: '🚗' },
  criminal: { label: '刑事辩护', icon: '⚖️' },
  other: { label: '其他', icon: '❓' },
}

function WatermarkedImage({
  src,
  alt,
  watermark,
}: {
  src: string
  alt: string
  watermark: string
}) {
  const [displaySrc, setDisplaySrc] = useState(src)

  useEffect(() => {
    let cancelled = false
    applyWatermark(src, watermark)
      .then((result) => {
        if (!cancelled) setDisplaySrc(result)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [src, watermark])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src={displaySrc}
        alt={alt}
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute -rotate-30 whitespace-nowrap text-2xl font-bold text-white/20">
          {watermark}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1 top-1 rounded bg-black/30 px-1 py-0.5 text-[8px] font-medium text-white/70">
          {watermark}
        </div>
        <div className="absolute bottom-1 right-1 rounded bg-black/30 px-1 py-0.5 text-[8px] font-medium text-white/70">
          {watermark}
        </div>
      </div>
    </div>
  )
}

export default function Detail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { currentConsultation, getConsultation, closeConsultation } = useConsultationStore()
  const { currentMessages, fetchMessages, sendMessage } = useMessageStore()

  const [inputText, setInputText] = useState('')
  const [isSelfDestruct, setIsSelfDestruct] = useState(false)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([getConsultation(id), fetchMessages(id)])
      setLoading(false)
    }
    load()
  }, [id, getConsultation, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  const isLawyer = currentUser?.role === 'lawyer'
  const canClose = isLawyer && currentConsultation?.status === 'in_progress'

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser || !currentConsultation) return
    await sendMessage({
      consultationId: currentConsultation.id,
      senderId: currentUser.id,
      type: 'text',
      content: inputText.trim(),
      isSelfDestruct,
      selfDestructAfter: isSelfDestruct ? 300 : undefined,
    })
    setInputText('')
    setIsSelfDestruct(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClose = async () => {
    if (!currentConsultation) return
    setClosing(true)
    await closeConsultation(currentConsultation.id)
    setClosing(false)
  }

  const handleAttachment = () => {
    fileInputRef.current?.click()
  }

  const consultation = currentConsultation
  const caseInfo = consultation ? caseTypeMap[consultation.caseType] : null
  const assignedLawyer: Lawyer | undefined = consultation?.lawyerId
    ? lawyers.find((l) => l.id === consultation.lawyerId)
    : undefined

  const dispatchModeLabel: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    auto: { label: '自动分派', icon: Bot, color: 'bg-blue-100 text-blue-700' },
    grab: { label: '律师抢单', icon: Handshake, color: 'bg-amber-100 text-amber-700' },
    manual: { label: '人工指派', icon: UserCheck, color: 'bg-purple-100 text-purple-700' },
  }

  const dispatchStatusLabel: Record<string, { label: string; color: string }> = {
    pending: { label: '分派中', color: 'bg-amber-100 text-amber-700' },
    dispatched: { label: '已分派', color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
    completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-600' },
  }

  const SelfDestructTimer = ({ message }: { message: Message }) => {
    const [remaining, setRemaining] = useState(message.selfDestructAfter || 0)
    useEffect(() => {
      if (!message.burnAfterRead || !message.selfDestructAfter) return
      const total = message.selfDestructAfter
      const start = message.createdAt
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000)
        const left = Math.max(0, total - elapsed)
        setRemaining(left)
        if (left <= 0) clearInterval(timer)
      }, 1000)
      return () => clearInterval(timer)
    }, [message])
    const progress = message.selfDestructAfter
      ? Math.max(0, (remaining / message.selfDestructAfter) * 100)
      : 0
    if (!message.burnAfterRead) return null
    return (
      <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-500">
        <Flame className="h-3 w-3" />
        <span>{remaining}s后销毁</span>
        <div className="h-0.5 w-12 overflow-hidden rounded-full bg-orange-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  const renderMessage = (msg: Message) => {
    const isSelf = currentUser && msg.senderId === currentUser.id
    const isSystem = msg.senderType === 'system'

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center py-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
            {msg.content}
          </span>
        </div>
      )
    }

    return (
      <div
        key={msg.id}
        className={cn('flex items-start gap-2 px-4 py-2', isSelf && 'flex-row-reverse')}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white',
            isSelf ? 'bg-blue-500' : 'bg-emerald-500'
          )}
        >
          {isSelf ? '我' : '律'}
        </div>
        <div className={cn('max-w-[70%]', isSelf ? 'items-end' : 'items-start')}>
          <div
            className={cn(
              'rounded-2xl px-4 py-2 text-sm',
              isSelf
                ? 'rounded-tr-sm bg-blue-500 text-white'
                : 'rounded-tl-sm bg-white text-slate-700 shadow-sm',
              msg.burnAfterRead && 'border border-orange-200 bg-orange-50 text-slate-700'
            )}
          >
            {msg.type === 'text' ? (
              <div className="flex items-start gap-1">
                <p className="whitespace-pre-wrap break-words leading-relaxed flex-1">{msg.content}</p>
                {msg.isEncrypted && (
                  <Lock className="ml-1 mt-0.5 h-3 w-3 shrink-0 text-white/70" />
                )}
              </div>
            ) : msg.type === 'image' ? (
              <div className="relative">
                <img
                  src={msg.fileUrl}
                  alt={msg.fileName || '图片'}
                  className="max-w-xs cursor-pointer rounded-lg"
                  onClick={() => setSelectedImage(msg.fileUrl || null)}
                />
                <div className="pointer-events-none absolute left-1 top-1 rounded bg-black/40 px-1 py-0.5 text-[8px] font-medium text-white/80">
                  {currentUser?.nickname || '用户'}
                </div>
                {msg.isEncrypted && (
                  <div className="pointer-events-none absolute bottom-1 right-1 flex items-center gap-0.5 rounded bg-black/40 px-1 py-0.5 text-[8px] font-medium text-white/80">
                    <Lock className="h-2 w-2" />
                    已加密
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{msg.fileName}</span>
                  <span className="text-xs opacity-70">
                    {msg.fileSize ? (msg.fileSize / 1024).toFixed(1) + ' KB' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className={cn('mt-1 flex items-center gap-2', isSelf && 'justify-end')}>
            <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
            {msg.isEncrypted && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                <Lock className="h-2.5 w-2.5" />
                已加密
              </span>
            )}
          </div>
          <SelfDestructTimer message={msg} />
        </div>
      </div>
    )
  }

  const sortedMessages = useMemo(
    () => [...currentMessages].sort((a, b) => a.createdAt - b.createdAt),
    [currentMessages]
  )

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-slate-800">
              {consultation?.title || '咨询详情'}
            </h1>
            <div className="mt-0.5 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-0.5 text-emerald-600">
                <Lock className="h-3 w-3" />
                端到端加密
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">
                {consultation?.status === 'pending' && '待分派'}
                {consultation?.status === 'dispatched' && '已分派'}
                {consultation?.status === 'in_progress' && '进行中'}
                {consultation?.status === 'completed' && '已结案'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {consultation?.status === 'completed' && (
            <button
              onClick={() => navigate(`/consultation/${id}/summary`)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-justice-500 to-scale-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-justice-500/30 transition-all hover:shadow-lg hover:shadow-justice-500/40"
            >
              <FileCheck className="h-4 w-4" />
              查看法律意见摘要
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {canClose && (
            <button
              onClick={handleClose}
              disabled={closing}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                closing
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              )}
            >
              {closing ? '处理中...' : '结案'}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-80 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex-1 overflow-y-auto p-4">
            {consultation && (
              <div className="space-y-5">
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Scale className="h-4 w-4 text-blue-500" />
                    案件信息
                  </h3>
                  <div className="space-y-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-slate-400">标题</span>
                      <span className="text-slate-700">{consultation.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="shrink-0 text-slate-400">标签</span>
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {caseInfo?.icon} {caseInfo?.label}
                      </span>
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <MapPin className="h-3 w-3" />
                        {consultation.region}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="shrink-0 text-slate-400">分派</span>
                      {consultation.dispatchMode && (() => {
                        const mode = dispatchModeLabel[consultation.dispatchMode]
                        const ModeIcon = mode.icon
                        return (
                          <span className={cn('inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-medium', mode.color)}>
                            <ModeIcon className="h-3 w-3" />
                            {mode.label}
                          </span>
                        )
                      })()}
                      {(() => {
                        const status = dispatchStatusLabel[consultation.status]
                        return (
                          <span className={cn('inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-medium', status.color)}>
                            {status.label}
                          </span>
                        )
                      })()}
                    </div>
                    {assignedLawyer && assignedLawyer.expertise.length > 0 && (
                      <div className="flex flex-wrap items-start gap-1.5">
                        <span className="shrink-0 pt-0.5 text-slate-400">专长</span>
                        <div className="flex flex-wrap gap-1">
                          {assignedLawyer.expertise.map((exp) => {
                            const expInfo = caseTypeMap[exp]
                            return (
                              <span
                                key={exp}
                                className="inline-flex items-center gap-0.5 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
                              >
                                <Award className="h-3 w-3" />
                                {expInfo?.label || exp}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-slate-400">时间</span>
                      <span className="inline-flex items-center gap-0.5 text-slate-700">
                        <Clock className="h-3 w-3" />
                        {formatDate(consultation.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <FileText className="h-4 w-4 text-blue-500" />
                    问题描述
                  </h3>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                    {consultation.description}
                  </div>
                </div>

                {consultation.evidences.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                      证据材料
                      <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600">
                        {consultation.evidences.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {consultation.evidences.map((ev) => (
                        <div
                          key={ev.id}
                          className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-slate-200"
                          onClick={() => {
                            if (ev.fileType === 'image') {
                              setSelectedImage(ev.fileUrl)
                            }
                          }}
                        >
                          {ev.fileType === 'image' ? (
                            <WatermarkedImage
                              src={ev.fileUrl}
                              alt={ev.fileName}
                              watermark={ev.watermarkText || ''}
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-50 p-1">
                              <FileText className="h-6 w-6 text-red-500" />
                              <span className="truncate text-[10px] text-slate-500">
                                {ev.fileName}
                              </span>
                            </div>
                          )}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/20 via-transparent to-slate-900/20 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                              {ev.watermarkText || '已加密'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-blue-700">
                    <Shield className="h-4 w-4" />
                    隐私保护说明
                  </div>
                  <p className="text-xs leading-relaxed text-blue-600">
                    您的咨询内容和证据材料已进行端到端加密处理，证据图片已添加专属水印，仅您和指派律师可见。
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 bg-white/50 px-4 py-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-emerald-500" />
              <span>会话已端到端加密保护</span>
            </div>
            <span>共 {sortedMessages.length} 条消息</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedMessages.length > 0 ? (
              sortedMessages.map(renderMessage)
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Lock className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500">暂无消息记录</p>
                <p className="mt-1 text-xs text-slate-400">
                  您的消息将进行端到端加密传输
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
                <Lock className="h-3 w-3 text-emerald-600" />
                <span className="text-[10px] font-medium text-emerald-700">端到端加密</span>
              </div>
              <span className="text-[10px] text-slate-400">消息仅您和律师可见</span>
            </div>
            {isSelfDestruct && (
              <div className="mb-2 flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                <div className="flex items-center gap-1.5 text-xs text-orange-600">
                  <Flame className="h-3.5 w-3.5" />
                  <span>阅后即焚模式已开启，消息将在对方阅读后 5 分钟内自动销毁</span>
                </div>
                <button
                  onClick={() => setIsSelfDestruct(false)}
                  className="text-orange-500 hover:text-orange-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex gap-1">
                <button
                  onClick={handleAttachment}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
                  title="上传证据（自动添加水印）"
                >
                  <ImageIcon className="h-5 w-5" />
                  <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-[10px] text-white group-hover:block">
                    上传证据将自动添加水印
                  </div>
                </button>
                <button
                  onClick={() => setIsSelfDestruct(!isSelfDestruct)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                    isSelfDestruct
                      ? 'bg-orange-100 text-orange-500'
                      : 'text-slate-500 hover:bg-slate-100'
                  )}
                  title={isSelfDestruct ? '关闭阅后即焚' : '开启阅后即焚'}
                >
                  <Flame className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                  rows={1}
                  className="max-h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                  inputText.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
                )}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                for (const file of files) {
                  const url = URL.createObjectURL(file)
                  const isImg = file.type.startsWith('image/')
                  await sendMessage({
                    consultationId: id,
                    senderId: currentUser?.id || '',
                    type: isImg ? 'image' : 'file',
                    content: '',
                    fileUrl: url,
                    fileName: file.name,
                    fileSize: file.size,
                    isSelfDestruct,
                    selfDestructAfter: isSelfDestruct ? 300 : undefined,
                  })
                }
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            />
          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative">
            <img
              src={selectedImage}
              alt="预览"
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg">
              <div className="absolute -rotate-30 whitespace-nowrap text-5xl font-bold text-white/15">
                {currentUser?.nickname || '用户'} {'phone' in (currentUser || {}) ? (currentUser as { phone?: string })?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '' : ''}
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg">
              <div className="absolute left-3 top-3 rounded bg-black/50 px-2 py-1 text-xs font-medium text-white/80">
                {currentUser?.nickname || '用户'}
              </div>
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs font-medium text-white/80">
                <Lock className="h-3 w-3" />
                已加密 · 仅供查看
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
