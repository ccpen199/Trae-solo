import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, User, Star, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Countdown from '@/components/Countdown'

const timeSlots = ['09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00']

function getDayLabels() {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const result = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    result.push({
      label: i === 0 ? '今天' : i === 1 ? '明天' : `周${days[d.getDay()]}`,
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      full: d.toISOString().slice(0, 10),
    })
  }
  return result
}

const slotStatuses = ['available', 'available', 'full', 'available', 'available', 'full', 'available']

const mockTechnicians = [
  { id: 'T001', name: '张师傅', rating: 4.9, orders: 1260, skills: ['手机', '平板'], distance: '1.2km' },
  { id: 'T002', name: '李师傅', rating: 4.8, orders: 980, skills: ['笔记本', '台式机'], distance: '2.5km' },
]

export default function Booking() {
  const navigate = useNavigate()
  const dayLabels = getDayLabels()
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [countdownSeconds] = useState(3600)

  const slotGrid = timeSlots.map((slot, slotIdx) =>
    dayLabels.map((_, dayIdx) => {
      const hash = (slotIdx * 7 + dayIdx * 3) % 5
      return hash === 2 ? 'full' : 'available'
    }),
  )

  return (
    <div className="min-h-screen bg-surface-light px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl animate-fade-in">
        <h1 className="font-title text-3xl font-bold text-primary">预约调度</h1>
        <p className="mt-2 text-gray-500">选择服务时间和技师，上门快修</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
              <div className="p-4">
                <h3 className="font-title text-lg font-semibold text-primary flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  技师分布
                </h3>
              </div>
              <div className="relative h-64 bg-gradient-to-br from-primary via-surface to-primary">
                <div className="absolute inset-0 opacity-20">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-1.5 w-1.5 rounded-full bg-accent"
                      style={{
                        left: `${(i * 37 + 13) % 100}%`,
                        top: `${(i * 53 + 7) % 100}%`,
                        opacity: 0.3 + (i % 3) * 0.2,
                      }}
                    />
                  ))}
                </div>
                {mockTechnicians.map((tech, i) => (
                  <div
                    key={tech.id}
                    className="absolute"
                    style={{ left: i === 0 ? '30%' : '65%', top: i === 0 ? '40%' : '55%' }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/40" />
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                        {tech.name[0]}
                      </div>
                    </div>
                    <span className="mt-1 block text-xs text-white/80">{tech.name}</span>
                  </div>
                ))}
                <div className="absolute bottom-3 right-3 rounded bg-primary/80 px-2 py-1 text-xs text-white/60">
                  模拟地图
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-title text-lg font-semibold text-primary flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  选择时间段
                </h3>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-accent" />可预约</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-gray-200" />已满</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border-2 border-accent bg-primary" />已选</span>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[500px]">
                  <div className="grid grid-cols-7 gap-1">
                    {dayLabels.map((day, i) => (
                      <button
                        key={day.full}
                        onClick={() => setSelectedDay(i)}
                        className={cn(
                          'rounded-lg py-2 text-center text-sm transition-all',
                          selectedDay === i
                            ? 'bg-accent/10 text-accent font-medium'
                            : 'text-gray-500 hover:bg-gray-50',
                        )}
                      >
                        <div className="text-xs">{day.label}</div>
                        <div className="font-medium">{day.date}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 space-y-1">
                    {timeSlots.map((slot, slotIdx) => (
                      <div key={slot} className="grid grid-cols-7 gap-1">
                        <div className="flex items-center text-xs text-gray-400 pr-2">{slot}</div>
                        {dayLabels.map((_, dayIdx) => {
                          const status = slotGrid[slotIdx][dayIdx]
                          const isSelected = selectedDay === dayIdx && selectedSlot === slotIdx
                          return (
                            <button
                              key={dayIdx}
                              disabled={status === 'full'}
                              onClick={() => { setSelectedDay(dayIdx); setSelectedSlot(slotIdx) }}
                              className={cn(
                                'h-10 rounded-lg text-xs font-medium transition-all',
                                isSelected
                                  ? 'border-2 border-accent bg-primary text-white'
                                  : status === 'full'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-accent/10 text-accent hover:bg-accent/20',
                              )}
                            >
                              {isSelected ? <Check className="mx-auto h-4 w-4" /> : status === 'full' ? '满' : '可约'}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-title text-lg font-semibold text-primary">预约倒计时</h3>
              <p className="mt-1 text-xs text-gray-400">请在倒计时结束前完成预约</p>
              <div className="mt-4 flex justify-center">
                <Countdown seconds={countdownSeconds} />
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-title text-lg font-semibold text-primary flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                选择技师
              </h3>
              <div className="mt-4 space-y-3">
                {mockTechnicians.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTech(tech.id)}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition-all',
                      selectedTech === tech.id
                        ? 'border-accent bg-accent/5'
                        : 'border-gray-100 hover:border-gray-200',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 font-medium text-accent">
                        {tech.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary">{tech.name}</span>
                          <span className="flex items-center gap-0.5 text-xs text-alert">
                            <Star className="h-3 w-3 fill-current" />{tech.rating}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {tech.skills.map((s) => (
                            <span key={s} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{s}</span>
                          ))}
                          <span className="text-xs text-gray-400">{tech.distance}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/order/NEW-001')}
              disabled={selectedSlot === null || !selectedTech}
              className="gradient-accent w-full rounded-lg py-3 font-medium text-primary transition-all disabled:opacity-50"
            >
              确认预约
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
