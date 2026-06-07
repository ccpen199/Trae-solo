import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CalendarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  scheduleDates?: string[]
  className?: string
}

export default function Calendar({ selectedDate, onDateSelect, scheduleDates = [], className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const hasSchedule = (date: Date) => {
    return scheduleDates.includes(formatDateKey(date))
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return formatDateKey(date) === formatDateKey(selectedDate)
  }

  const isToday = (date: Date) => {
    return formatDateKey(date) === formatDateKey(new Date())
  }

  const days = getDaysInMonth(currentMonth)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  return (
    <div className={cn('rounded-lg bg-white p-4 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded p-1 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold">
          {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
        </span>
        <button
          onClick={nextMonth}
          className="rounded p-1 hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        {days.map((date, index) => (
          <div key={index} className="p-1">
            {date && (
              <button
                onClick={() => onDateSelect?.(date)}
                className={cn(
                  'relative flex h-10 w-full items-center justify-center rounded-lg text-sm transition-colors',
                  isSelected(date) && 'bg-blue-500 text-white',
                  !isSelected(date) && isToday(date) && 'bg-blue-50 text-blue-600 font-semibold',
                  !isSelected(date) && !isToday(date) && 'hover:bg-gray-100',
                )}
              >
                {date.getDate()}
                {hasSchedule(date) && (
                  <span
                    className={cn(
                      'absolute bottom-1 h-1.5 w-1.5 rounded-full',
                      isSelected(date) ? 'bg-white' : 'bg-blue-500',
                    )}
                  />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
