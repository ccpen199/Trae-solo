import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals)
}

export function generateId(prefix: string = ''): string {
  return prefix + Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function getSocColor(soc: number): string {
  if (soc >= 80) return 'text-cyber-success'
  if (soc >= 50) return 'text-cyber-accent'
  if (soc >= 20) return 'text-cyber-warning'
  return 'text-cyber-danger'
}

export function getSocBgColor(soc: number): string {
  if (soc >= 80) return 'bg-cyber-success'
  if (soc >= 50) return 'bg-cyber-accent'
  if (soc >= 20) return 'bg-cyber-warning'
  return 'bg-cyber-danger'
}

export function getAlertLevelColor(level: string): string {
  switch (level) {
    case 'critical': return 'text-cyber-danger'
    case 'warning': return 'text-cyber-warning'
    default: return 'text-cyber-accent'
  }
}

export function getAlertLevelBg(level: string): string {
  switch (level) {
    case 'critical': return 'bg-cyber-danger/20 border-cyber-danger/50'
    case 'warning': return 'bg-cyber-warning/20 border-cyber-warning/50'
    default: return 'bg-cyber-accent/20 border-cyber-accent/50'
  }
}
