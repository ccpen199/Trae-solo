import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, format: 'full' | 'short' | 'year' = 'full'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  switch (format) {
    case 'full':
      return `${y}年${m}月${day}日`
    case 'short':
      return `${y}-${m}-${day}`
    case 'year':
      return `${y}`
  }
}

export type WuXingElement = 'metal' | 'wood' | 'water' | 'fire' | 'earth'

export function getWuXingColor(element: WuXingElement): string {
  const colors: Record<WuXingElement, string> = {
    metal: '#e8e8e8',
    wood: '#6fb36f',
    water: '#5b9bd5',
    fire: '#e06060',
    earth: '#c9a66b',
  }
  return colors[element]
}

export function getWuXingName(element: WuXingElement): string {
  const names: Record<WuXingElement, string> = {
    metal: '金',
    wood: '木',
    water: '水',
    fire: '火',
    earth: '土',
  }
  return names[element]
}
