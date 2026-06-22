import React from 'react'
import { MapPin, Building2, Users, FileCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function CitySelector() {
  const { currentCity, setCurrentCity, cities } = useApp()
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
      >
        <MapPin className="w-4 h-4" />
        <span className="font-medium">{currentCity.name}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm text-gray-500">切换城市站点</p>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    setCurrentCity(city)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                    currentCity.id === city.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className={`w-5 h-5 ${currentCity.id === city.id ? 'text-primary-600' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <p className={`font-medium ${currentCity.id === city.id ? 'text-primary-700' : 'text-gray-900'}`}>
                        {city.name}
                      </p>
                      <p className="text-xs text-gray-500">{city.province}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{city.population}万</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-primary-600 mt-0.5">
                      <FileCheck className="w-3 h-3" />
                      <span>{city.serviceCount}项服务</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
