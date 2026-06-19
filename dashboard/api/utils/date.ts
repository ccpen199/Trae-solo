import dayjs from 'dayjs'

export const formatDate = (date: Date | string, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format)
}

export const getStartOfDay = (date: Date = new Date()): Date => {
  return dayjs(date).startOf('day').toDate()
}

export const getEndOfDay = (date: Date = new Date()): Date => {
  return dayjs(date).endOf('day').toDate()
}

export const getStartOfMonth = (date: Date = new Date()): Date => {
  return dayjs(date).startOf('month').toDate()
}

export const getEndOfMonth = (date: Date = new Date()): Date => {
  return dayjs(date).endOf('month').toDate()
}

export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = []
  let current = dayjs(startDate).startOf('day')
  const end = dayjs(endDate).startOf('day')
  
  while (current.isBefore(end) || current.isSame(end)) {
    dates.push(current.toDate())
    current = current.add(1, 'day')
  }
  
  return dates
}

export const getDaysBetween = (date1: Date, date2: Date): number => {
  return Math.abs(dayjs(date1).diff(dayjs(date2), 'day'))
}

export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return dayjs(date).isAfter(start) && dayjs(date).isBefore(end)
}

export const addDays = (date: Date, days: number): Date => {
  return dayjs(date).add(days, 'day').toDate()
}

export const addMonths = (date: Date, months: number): Date => {
  return dayjs(date).add(months, 'month').toDate()
}

export const generateRandomDate = (start: Date, end: Date): Date => {
  const startTime = start.getTime()
  const endTime = end.getTime()
  const randomTime = startTime + Math.random() * (endTime - startTime)
  return new Date(randomTime)
}

export const daysFromNow = (days: number): Date => {
  return addDays(new Date(), days)
}

export const generateRandomDateRange = (minDays: number, maxDays: number): { startDate: Date; endDate: Date } => {
  const now = new Date()
  const futureDays = Math.floor(Math.random() * (maxDays - minDays)) + minDays
  const startDate = generateRandomDate(addDays(now, -30), addDays(now, 30))
  const endDate = addDays(startDate, futureDays)
  return { startDate, endDate }
}
