import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'
import type { GeoRegion } from '@/types'

export default function GeoLocationSelector() {
  const { location, setLocation } = useAppStore()
  const [provinces, setProvinces] = useState<GeoRegion[]>([])
  const [cities, setCities] = useState<GeoRegion[]>([])
  const [districts, setDistricts] = useState<GeoRegion[]>([])
  const [ripple, setRipple] = useState(false)

  useEffect(() => {
    api.geo.regions().then(setProvinces).catch(() => {})
  }, [])

  useEffect(() => {
    const province = provinces.find((p) => p.name === location.province)
    if (province) {
      api.geo.regions(province.code).then(setCities).catch(() => {})
    } else {
      setCities([])
    }
  }, [location.province, provinces])

  useEffect(() => {
    const city = cities.find((c) => c.name === location.city)
    if (city) {
      api.geo.regions(city.code).then(setDistricts).catch(() => {})
    } else {
      setDistricts([])
    }
  }, [location.city, cities])

  const handleChange = (field: 'province' | 'city' | 'district', value: string) => {
    const update = { ...location, [field]: value }
    if (field === 'province') {
      update.city = ''
      update.district = ''
    } else if (field === 'city') {
      update.district = ''
    }
    setLocation(update)
    setRipple(true)
    setTimeout(() => setRipple(false), 600)
  }

  const selectClass = cn(
    'bg-navy-700 text-white text-xs rounded px-2 py-1 border border-navy-600',
    'focus:outline-none focus:ring-1 focus:ring-accent-400 appearance-none cursor-pointer',
    ripple && 'animate-ripple'
  )

  return (
    <div className="flex items-center gap-1.5 relative">
      <MapPin className="w-3.5 h-3.5 text-accent-400 shrink-0" />
      <select
        value={location.province}
        onChange={(e) => handleChange('province', e.target.value)}
        className={selectClass}
      >
        <option value="">{location.province || '省份'}</option>
        {provinces.map((p) => (
          <option key={p.code} value={p.name}>{p.name}</option>
        ))}
      </select>
      <select
        value={location.city}
        onChange={(e) => handleChange('city', e.target.value)}
        className={selectClass}
      >
        <option value="">{location.city || '城市'}</option>
        {cities.map((c) => (
          <option key={c.code} value={c.name}>{c.name}</option>
        ))}
      </select>
      <select
        value={location.district}
        onChange={(e) => handleChange('district', e.target.value)}
        className={selectClass}
      >
        <option value="">{location.district || '区县'}</option>
        {districts.map((d) => (
          <option key={d.code} value={d.name}>{d.name}</option>
        ))}
      </select>
    </div>
  )
}
