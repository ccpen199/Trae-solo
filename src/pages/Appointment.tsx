import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, User, Star, Phone, CheckCircle, Lock, AlertCircle,
  ShieldCheck, X, ChevronRight,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { mockAppointments, mockListings } from '@/data/mockData'

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const LOCK_DURATION = 30 * 60

interface ConfirmHistoryEntry {
  action: string
  timestamp: string
  by: string
}

function Appointment() {
  const navigate = useNavigate()
  const { appointments, selectAppointmentSlot, confirmAppointment } = useStore()
  const [activeStep, setActiveStep] = useState(0)
  const [lockTimer, setLockTimer] = useState(0)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [confirmHistory, setConfirmHistory] = useState<ConfirmHistoryEntry[]>([])
  const [showToast, setShowToast] = useState('')
  const [isWaitingAgent, setIsWaitingAgent] = useState(false)

  const appointment = appointments[0] || mockAppointments[0]
  const listing = mockListings.find((l) => l.id === appointment.listingId)

  const slotsByDate: Record<string, typeof appointment.slots> = {}
  appointment.slots.forEach((slot) => {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = []
    slotsByDate[slot.date].push(slot)
  })

  const dates = Object.keys(slotsByDate).sort()

  useEffect(() => {
    if (!appointment.selectedSlot) {
      setLockTimer(0)
      return
    }
    setLockTimer(LOCK_DURATION)
  }, [appointment.selectedSlot?.date, appointment.selectedSlot?.time])

  useEffect(() => {
    if (lockTimer <= 0) return
    const id = setInterval(() => setLockTimer((t) => (t <= 0 ? 0 : t - 1)), 1000)
    return () => clearInterval(id)
  }, [lockTimer > 0])

  useEffect(() => {
    if (appointment.status === 'pending' && appointment.selectedSlot) {
      setIsWaitingAgent(true)
    } else {
      setIsWaitingAgent(false)
    }
  }, [appointment.status, appointment.selectedSlot])

  const formatCountdown = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [])

  const handleSlotClick = (date: string, time: string, available: boolean) => {
    if (!available) return
    if (appointment.selectedSlot) return
    selectAppointmentSlot(appointment.id, date, time)
    setActiveStep(0)
    const entry: ConfirmHistoryEntry = {
      action: '选择时间段',
      timestamp: new Date().toISOString(),
      by: '租客',
    }
    setConfirmHistory([entry])
  }

  const handleAgentConfirm = () => {
    confirmAppointment(appointment.id)
    setActiveStep(2)
    const entry: ConfirmHistoryEntry = {
      action: '经纪人确认时间',
      timestamp: new Date().toISOString(),
      by: '王经理',
    }
    setConfirmHistory((prev) => [...prev, entry])
    setShowToast('经纪人已确认预约时间')
    setTimeout(() => setShowToast(''), 3000)
  }

  const handleComplete = () => {
    setActiveStep(3)
    const entry: ConfirmHistoryEntry = {
      action: '看房完成',
      timestamp: new Date().toISOString(),
      by: '系统',
    }
    setConfirmHistory((prev) => [...prev, entry])
    setShowToast('看房已完成')
    setTimeout(() => setShowToast(''), 3000)
  }

  const handleCancel = () => {
    setShowCancelDialog(false)
    setActiveStep(-1)
    const entry: ConfirmHistoryEntry = {
      action: '取消预约',
      timestamp: new Date().toISOString(),
      by: '租客',
    }
    setConfirmHistory((prev) => [...prev, entry])
    setShowToast('预约已取消')
    setTimeout(() => setShowToast(''), 3000)
  }

  const isSelected = (date: string, time: string) =>
    appointment.selectedSlot?.date === date && appointment.selectedSlot?.time === time

  const formatDateHeader = (dateStr: string, idx: number) => {
    const d = new Date(dateStr)
    return { weekday: WEEKDAYS[idx] || '', dateLabel: `${d.getMonth() + 1}/${d.getDate()}` }
  }

  const isCancelled = activeStep === -1

  const timelineSteps = [
    { label: '已提交', icon: CheckCircle, actor: '租客', time: appointment.createdAt },
    {
      label: '经纪人确认',
      icon: User,
      actor: appointment.agentName,
      time: appointment.status === 'confirmed' || appointment.status === 'completed'
        ? confirmHistory.find((h) => h.action === '经纪人确认时间')?.timestamp || ''
        : '',
    },
    {
      label: '待看房',
      icon: Clock,
      actor: appointment.agentName,
      time: appointment.selectedSlot ? `${appointment.selectedSlot.date} ${appointment.selectedSlot.time}` : '',
    },
    {
      label: '已完成',
      icon: CheckCircle,
      actor: '系统',
      time: confirmHistory.find((h) => h.action === '看房完成')?.timestamp || '',
    },
  ]

  const isStepActive = (idx: number) => {
    if (isCancelled) return idx === 0
    return idx <= activeStep
  }

  const isStepCurrent = (idx: number) => {
    if (isCancelled) return false
    return idx === activeStep
  }

  return (
    <div className="min-h-screen bg-space-50 p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-ccb-500" />
          <h1 className="text-2xl font-bold text-space-800">预约看房</h1>
        </div>
        {listing && (
          <div className="bg-white rounded-xl p-4 border border-space-100 shadow-sm flex items-center gap-4">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-24 h-18 object-cover rounded-lg shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-space-800 truncate">{listing.title}</h3>
                {listing.verification.directManaged && (
                  <ShieldCheck className="w-4 h-4 text-ccb-500 shrink-0" />
                )}
              </div>
              <p className="text-sm text-space-400 truncate">{listing.address}</p>
              <div className="flex items-center gap-4 mt-1.5 text-sm">
                <span className="text-gold-500 font-bold">¥{listing.price}/月</span>
                <span className="text-space-300">{listing.area}㎡ · {listing.rooms}室{listing.halls}厅</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 border border-space-100 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-space-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-ccb-500" />
          选择时间
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {dates.map((date, idx) => {
            const { weekday, dateLabel } = formatDateHeader(date, idx)
            const daySlots = slotsByDate[date]
            return (
              <div key={date} className="flex flex-col items-center">
                <div className="text-xs font-medium text-space-400 mb-1">{weekday}</div>
                <div className="text-sm font-semibold text-space-700 mb-3">{dateLabel}</div>
                <div className="flex flex-col gap-1.5 w-full">
                  {daySlots.map((slot) => {
                    const selected = isSelected(slot.date, slot.time)
                    const locked = appointment.selectedSlot && selected
                    if (!slot.available) {
                      return (
                        <div
                          key={`${slot.date}-${slot.time}`}
                          className="bg-gray-100 text-gray-400 line-through text-xs rounded-md px-1.5 py-1.5 text-center border border-gray-100 cursor-not-allowed"
                        >
                          {slot.time}
                        </div>
                      )
                    }
                    if (locked) {
                      return (
                        <div
                          key={`${slot.date}-${slot.time}`}
                          className="bg-ccb-500 text-white text-xs rounded-md px-1.5 py-1.5 text-center border border-ccb-500 shadow-md relative"
                          title="已锁定"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>已锁定</span>
                          </div>
                          <div className="text-[10px] opacity-80 mt-0.5">
                            {formatCountdown(lockTimer)}
                          </div>
                        </div>
                      )
                    }
                    const otherSlotSelected = !!appointment.selectedSlot
                    return (
                      <button
                        key={`${slot.date}-${slot.time}`}
                        onClick={() => handleSlotClick(slot.date, slot.time, slot.available)}
                        disabled={otherSlotSelected}
                        className={`text-xs rounded-md px-1.5 py-1.5 text-center border transition-all ${
                          otherSlotSelected
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            : 'bg-green-50 text-green-600 border-green-200 hover:border-green-400 cursor-pointer'
                        }`}
                        title={otherSlotSelected ? '已锁定' : ''}
                      >
                        {slot.time}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {appointment.selectedSlot && lockTimer > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-ccb-600 bg-ccb-50 rounded-lg px-3 py-2">
            <Lock className="w-4 h-4" />
            <span>已锁定 {appointment.selectedSlot.date} {appointment.selectedSlot.time}</span>
            <span className="ml-auto font-mono text-ccb-500">{formatCountdown(lockTimer)}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 border border-space-100 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-space-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-ccb-500" />
          经纪人信息
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-ccb-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {appointment.agentName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-space-800">{appointment.agentName}</span>
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                <span className="text-sm text-gold-600 font-medium">{appointment.agentRating}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-space-400 text-sm">
              <Phone className="w-3.5 h-3.5" />
              <span>138-0000-8888</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {isWaitingAgent && appointment.status === 'pending' && (
              <>
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </span>
                  等待经纪人确认
                </div>
                <button
                  onClick={handleAgentConfirm}
                  className="px-4 py-1.5 bg-ccb-500 text-white text-sm rounded-lg hover:bg-ccb-600 transition-colors cursor-pointer"
                >
                  经纪人确认
                </button>
              </>
            )}
            {appointment.status === 'confirmed' && activeStep === 2 && (
              <button
                onClick={handleComplete}
                className="px-4 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >
                标记看房完成
              </button>
            )}
          </div>
        </div>

        {confirmHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-space-100">
            <h4 className="text-sm font-medium text-space-600 mb-3">确认记录</h4>
            <div className="space-y-2">
              {confirmHistory.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${idx === confirmHistory.length - 1 ? 'bg-ccb-500' : 'bg-space-200'}`} />
                  <span className="text-space-700">{entry.action}</span>
                  <span className="text-space-300 ml-auto">
                    {entry.by} · {new Date(entry.timestamp).toLocaleString('zh-CN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 border border-space-100 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-space-800 mb-5">预约进度</h2>
        <div className="relative">
          {timelineSteps.map((step, idx) => {
            const isActive = isStepActive(idx)
            const isCurrent = isStepCurrent(idx)
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-ccb-500 text-white'
                        : isCancelled && idx > 0
                          ? 'bg-red-100 text-red-400'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCancelled && idx > 0 ? <X className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  {idx < timelineSteps.length - 1 && (
                    <div
                      className={`w-0.5 h-10 ${
                        idx < activeStep
                          ? 'bg-ccb-500'
                          : isCancelled
                            ? 'bg-red-200'
                            : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <div className="pt-1 pb-6">
                  <div
                    className={`text-sm font-medium ${
                      isActive
                        ? isCancelled && idx > 0
                          ? 'text-red-400 line-through'
                          : 'text-ccb-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  {isActive && step.time && (
                    <div className="text-xs text-space-300 mt-0.5">
                      {step.actor} · {new Date(step.time).toLocaleString('zh-CN')}
                    </div>
                  )}
                  {isCurrent && isWaitingAgent && idx === 1 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 mt-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                      等待经纪人确认
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {isCancelled && (
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="pt-1">
                <div className="text-sm font-medium text-red-500">已取消</div>
                <div className="text-xs text-space-300 mt-0.5">
                  租客 · {confirmHistory.find((h) => h.action === '取消预约')
                    ? new Date(confirmHistory.find((h) => h.action === '取消预约')!.timestamp).toLocaleString('zh-CN')
                    : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {(appointment.status === 'confirmed' || activeStep === 2) && !isCancelled && (
        <button
          onClick={() => navigate('/contract')}
          className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all cursor-pointer bg-ccb-500 hover:bg-ccb-600 shadow-lg mb-4 flex items-center justify-center gap-2"
        >
          前往签署合同
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div className="flex gap-3">
        {!isCancelled && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-base hover:bg-red-50 transition-all cursor-pointer"
          >
            取消预约
          </button>
        )}
        {!isCancelled && appointment.status === 'pending' && !appointment.selectedSlot && (
          <div className="flex-1 py-3 rounded-xl bg-gray-300 text-white font-semibold text-base text-center">
            请先选择时间
          </div>
        )}
      </div>

      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-space-800">确认取消预约</h3>
            </div>
            <p className="text-sm text-space-500 mb-6">取消后将释放已锁定的时间段，您需要重新预约。确定要取消吗？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 py-2.5 rounded-lg border border-space-200 text-space-600 font-medium hover:bg-space-50 transition-colors cursor-pointer"
              >
                再想想
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors cursor-pointer"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-slide-up z-50">
          <CheckCircle className="w-5 h-5" />
          <span>{showToast}</span>
        </div>
      )}
    </div>
  )
}

export default Appointment
