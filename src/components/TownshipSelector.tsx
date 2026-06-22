import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import { useStore } from '@/store'
import { townships } from '@/data'

export default function TownshipSelector() {
  const { currentTownship, setCurrentTownship } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-jade-700 hover:text-jade-600 transition-colors px-2 py-1 rounded-lg hover:bg-jade-50"
      >
        <MapPin className="w-4 h-4" />
        <span className="max-w-[80px] truncate">{currentTownship}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />
          <div className="hidden md:block absolute top-full right-0 mt-1 w-48 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-rock-100 z-50 py-1">
            {townships.map((t) => (
              <button
                key={t.code}
                onClick={() => {
                  setCurrentTownship(t.name)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentTownship === t.name
                    ? 'bg-jade-50 text-jade-700 font-medium'
                    : 'text-rock-700 hover:bg-rock-50'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </>
      )}

      {open && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-rock-100">
            <span className="font-serif font-semibold text-rock-900">选择乡镇</span>
            <button
              onClick={() => setOpen(false)}
              className="text-rock-400 hover:text-rock-600 text-sm"
            >
              关闭
            </button>
          </div>
          <div className="overflow-y-auto p-2">
            {townships.map((t) => (
              <button
                key={t.code}
                onClick={() => {
                  setCurrentTownship(t.name)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-3 text-sm rounded-lg transition-colors ${
                  currentTownship === t.name
                    ? 'bg-jade-50 text-jade-700 font-medium'
                    : 'text-rock-700 hover:bg-rock-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-jade-500" />
                  {t.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
