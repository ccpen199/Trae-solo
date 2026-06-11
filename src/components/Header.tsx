import { useAppStore } from '@/store'
import { Bell, MapPin, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const cities = ['广州', '深圳', '珠海', '佛山', '东莞', '中山', '惠州', '汕头', '江门', '湛江', '茂名', '肇庆']

export default function Header() {
  const { city, setCity, sidebarOpen } = useAppStore()
  const [cityDropdown, setCityDropdown] = useState(false)

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gov-border z-30 flex items-center justify-between px-6 transition-all duration-300"
      style={{ left: sidebarOpen ? '240px' : '64px' }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setCityDropdown(!cityDropdown)}
            className="flex items-center gap-1.5 text-sm text-gov-text hover:text-primary-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-50"
          >
            <MapPin className="w-4 h-4 text-primary-500" />
            <span className="font-medium">{city}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gov-muted" />
          </button>
          {cityDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-elevated border border-gov-border p-2 w-64 animate-fade-in">
              <div className="grid grid-cols-3 gap-1">
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCity(c); setCityDropdown(false) }}
                    className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                      city === c ? 'bg-primary-500 text-white font-medium' : 'text-gov-text hover:bg-primary-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-lg hover:bg-primary-50 flex items-center justify-center transition-colors">
          <Bell className="w-5 h-5 text-gov-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
