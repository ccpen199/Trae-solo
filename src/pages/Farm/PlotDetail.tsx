import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, ChevronLeft, ChevronRight, MapPin,
  Sprout, Droplets, FlaskConical, Bug, Wheat, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { farmPlots } from '@/mocks'
import type { FarmRecord } from '@/types'

const typeConfig: Record<FarmRecord['type'], { icon: typeof Sprout; color: string; dotColor: string; label: string }> = {
  sowing: { icon: Sprout, color: 'text-green-600 bg-green-50', dotColor: 'bg-green-500', label: '播种' },
  fertilizing: { icon: FlaskConical, color: 'text-yellow-600 bg-yellow-50', dotColor: 'bg-yellow-500', label: '施肥' },
  irrigating: { icon: Droplets, color: 'text-blue-600 bg-blue-50', dotColor: 'bg-blue-500', label: '灌溉' },
  spraying: { icon: Bug, color: 'text-red-600 bg-red-50', dotColor: 'bg-red-500', label: '施药' },
  harvesting: { icon: Wheat, color: 'text-amber-600 bg-amber-50', dotColor: 'bg-amber-500', label: '采收' },
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function PlotDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const plot = farmPlots.find(p => p.id === id)

  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(5)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const recordsByDate = useMemo(() => {
    if (!plot) return new Map<string, FarmRecord[]>()
    const map = new Map<string, FarmRecord[]>()
    for (const r of plot.records) {
      const arr = map.get(r.date) ?? []
      arr.push(r)
      map.set(r.date, arr)
    }
    return map
  }, [plot])

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [currentYear, currentMonth])

  const selectedRecords = useMemo(() => {
    if (!selectedDate || !plot) return []
    return plot.records.filter(r => r.date === selectedDate)
  }, [selectedDate, plot])

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
    setSelectedDate(null)
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
    setSelectedDate(null)
  }

  if (!plot) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">未找到该地块信息</p>
        <button onClick={() => navigate('/farm')} className="mt-4 text-primary-500 hover:underline">
          返回种植档案
        </button>
      </div>
    )
  }

  const monthLabel = `${currentYear}年${currentMonth + 1}月`
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <button
        onClick={() => navigate('/farm')}
        className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        返回地块列表
      </button>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-earth-500">{plot.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">{plot.crop}</span>
              <span>{plot.area} 亩</span>
              <span className="text-gray-300">|</span>
              <span>{plot.soilType}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin size={14} />
            {plot.location.lat.toFixed(4)}°N, {plot.location.lng.toFixed(4)}°E
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-earth-500">农事日历</h2>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <span className="text-sm font-medium text-earth-500 min-w-[100px] text-center">{monthLabel}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs text-gray-400 py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="h-16" />
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayRecords = recordsByDate.get(dateStr)
            const isSelected = selectedDate === dateStr
            const isToday = dateStr === '2026-06-10'
            return (
              <button
                key={dateStr}
                onClick={() => dayRecords && setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`h-16 rounded-lg text-sm relative transition-all ${
                  isSelected
                    ? 'bg-primary-50 ring-2 ring-primary-300'
                    : dayRecords
                    ? 'bg-gray-50 hover:bg-primary-50/50 cursor-pointer'
                    : 'hover:bg-gray-50'
                } ${isToday ? 'font-bold text-primary-600' : 'text-gray-700'}`}
              >
                <span className="block mt-1.5">{day}</span>
                {dayRecords && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    {[...new Set(dayRecords.map(r => r.type))].map(type => (
                      <span key={type} className={`w-1.5 h-1.5 rounded-full ${typeConfig[type].dotColor}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          {(Object.entries(typeConfig) as [FarmRecord['type'], typeof typeConfig.sowing][]).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1 text-xs text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedDate && selectedRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-16 right-0 bottom-0 w-80 bg-white shadow-xl border-l border-gray-100 z-30 overflow-y-auto scrollbar-thin"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-semibold text-earth-500">{selectedDate}</h3>
                <button onClick={() => setSelectedDate(null)} className="p-1 rounded hover:bg-gray-100">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                {selectedRecords.map((record, i) => {
                  const cfg = typeConfig[record.type]
                  const Icon = cfg.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-3 rounded-lg ${cfg.color}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} />
                        <span className="font-medium text-sm">{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{record.description}</p>
                      {record.inputs && record.inputs.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {record.inputs.map((inp, j) => (
                            <span key={j} className="text-xs bg-white/60 px-2 py-0.5 rounded">
                              {inp.name} {inp.amount}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-serif text-xl font-semibold text-earth-500 mb-6">农事记录</h2>
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-100" />
          {plot.records.map((record, i) => {
            const cfg = typeConfig[record.type]
            const Icon = cfg.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative pb-8 last:pb-0"
              >
                <div className={`absolute left-[-15px] top-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center ${cfg.color}`}>
                  <Icon size={10} />
                </div>
                <div className="ml-4 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{record.date}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.color} font-medium`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-gray-700">{record.description}</p>
                  {record.inputs && record.inputs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {record.inputs.map((inp, j) => (
                        <span key={j} className="text-xs bg-white px-2.5 py-1 rounded border border-gray-100 text-gray-600">
                          {inp.name}：{inp.amount}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors flex items-center justify-center z-20">
        <Plus size={24} />
      </button>
    </div>
  )
}
