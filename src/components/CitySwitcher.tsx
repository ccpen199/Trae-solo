import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ChevronDown, Users, Store } from 'lucide-react'
import { api } from '@/api/client'
import { useStore } from '@/store'
import type { City } from '@/types'

function formatCount(n: number): string {
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + '万'
  }
  return n.toLocaleString()
}

export default function CitySwitcher() {
  const [open, setOpen] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const currentCity = useStore((s) => s.currentCity)
  const setCurrentCity = useStore((s) => s.setCurrentCity)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchCities() {
      try {
        const data = await api.cities.list()
        setCities(data)
      } finally {
        setLoading(false)
      }
    }
    fetchCities()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-wudu-800 text-white">
        <div className="w-4 h-4 border-2 border-jinguan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">加载中...</span>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-wudu-800 hover:bg-wudu-700 text-white transition-colors"
      >
        <MapPin size={16} className="text-shujin-600" />
        <span className="text-sm font-medium">{currentCity}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-wudu-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-wudu-800 border border-wudu-700 shadow-2xl overflow-hidden z-50"
          >
            <div className="max-h-80 overflow-y-auto py-1">
              {cities.map((city) => {
                const active = city.name === currentCity
                return (
                  <button
                    key={city.code}
                    onClick={() => {
                      setCurrentCity(city.name as typeof currentCity)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                      active
                        ? 'bg-shujin-600 text-white'
                        : 'text-white hover:bg-wudu-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{city.name}</span>
                    <div className="flex items-center gap-3 text-xs text-wudu-300">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {formatCount(city.memberCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Store size={12} />
                        {city.merchantCount}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
