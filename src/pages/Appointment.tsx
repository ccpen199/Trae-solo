import { useState } from 'react'
import { Calendar, Clock, User, Star, Phone, CheckCircle, Circle, ArrowRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { mockAppointments, mockListings } from '@/data/mockData'

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const TIMELINE_STEPS = [
  { label: '已提交', icon: CheckCircle },
  { label: '经纪人确认', icon: User },
  { label: '待看房', icon: Clock },
  { label: '已完成', icon: CheckCircle },
]

function Appointment() {
  const { appointments, selectAppointmentSlot, confirmAppointment } = useStore()
  const [showToast, setShowToast] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const appointment = appointments[0] || mockAppointments[0]
  const listing = mockListings.find((l) => l.id === appointment.listingId)

  const slotsByDate: Record<string, typeof appointment.slots> = {}
  appointment.slots.forEach((slot) => {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = []
    slotsByDate[slot.date].push(slot)
  })

  const dates = Object.keys(slotsByDate).sort()

  const handleSlotClick = (date: string, time: string, available: boolean) => {
    if (!available) return
    selectAppointmentSlot(appointment.id, date, time)
    setActiveStep(1)
  }

  const handleConfirm = () => {
    confirmAppointment(appointment.id)
    setActiveStep(2)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const isSelected = (date: string, time: string) =>
    appointment.selectedSlot?.date === date && appointment.selectedSlot?.time === time

  const formatDateHeader = (dateStr: string, idx: number) => {
    const d = new Date(dateStr)
    const month = d.getMonth() + 1
    const day = d.getDate()
    return { weekday: WEEKDAYS[idx] || '', dateLabel: `${month}/${day}` }
  }

  return (
    <div className="min-h-screen bg-space-50 p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-ccb-500" />
          <h1 className="text-2xl font-bold text-space-800">预约看房</h1>
        </div>
        {listing && (
          <div className="bg-white rounded-xl p-4 border border-space-100 shadow-sm">
            <h3 className="font-semibold text-space-800 mb-1">{listing.title}</h3>
            <p className="text-sm text-space-400">{listing.address}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-gold-500 font-bold">¥{listing.price}/月</span>
              <span className="text-space-300">{listing.area}㎡ · {listing.rooms}室{listing.halls}厅</span>
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
                    return (
                      <button
                        key={`${slot.date}-${slot.time}`}
                        onClick={() => handleSlotClick(slot.date, slot.time, slot.available)}
                        className={`text-xs rounded-md px-1.5 py-1.5 text-center border transition-all cursor-pointer ${
                          selected
                            ? 'bg-ccb-500 text-white border-ccb-500 shadow-md'
                            : 'bg-green-50 text-green-600 border-green-200 hover:border-green-400'
                        }`}
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
            <button className="px-4 py-1.5 bg-ccb-500 text-white text-sm rounded-lg hover:bg-ccb-600 transition-colors cursor-pointer">
              确认时间
            </button>
            <button className="px-4 py-1.5 border border-ccb-500 text-ccb-500 text-sm rounded-lg hover:bg-ccb-50 transition-colors cursor-pointer">
              调整时间
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-space-100 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-space-800 mb-5">预约进度</h2>
        <div className="relative">
          {TIMELINE_STEPS.map((step, idx) => {
            const isActive = idx <= activeStep
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-start gap-4 mb-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-ccb-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-10 ${
                        idx < activeStep ? 'bg-ccb-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <div className="pt-1 pb-6">
                  <div className={`text-sm font-medium ${isActive ? 'text-ccb-500' : 'text-gray-400'}`}>
                    {step.label}
                  </div>
                  {isActive && idx <= activeStep && (
                    <div className="text-xs text-space-300 mt-0.5">
                      {idx === 0 ? new Date(appointment.createdAt).toLocaleString('zh-CN') : ''}
                      {idx === 1 && appointment.selectedSlot
                        ? `${appointment.selectedSlot.date} ${appointment.selectedSlot.time}`
                        : ''}
                      {idx === 2 && appointment.status === 'confirmed' ? '等待看房' : ''}
                      {idx === 3 ? '' : ''}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!appointment.selectedSlot}
        className={`w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all cursor-pointer ${
          appointment.selectedSlot
            ? 'bg-ccb-500 hover:bg-ccb-600 shadow-lg'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        确认预约
      </button>

      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-slide-up z-50">
          <CheckCircle className="w-5 h-5" />
          <span>预约成功！经纪人将尽快与您联系</span>
        </div>
      )}
    </div>
  )
}

export default Appointment
