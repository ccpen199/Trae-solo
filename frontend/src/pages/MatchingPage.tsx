import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/utils/api'
import {
  Package,
  Truck,
  MapPin,
  Thermometer,
  Weight,
  Route,
  MessageSquare,
  Loader2,
} from 'lucide-react'

interface CargoItem {
  id: number
  name: string
  origin: string
  destination: string
  weight: number
  temperature_range: string
  status: string
}

interface VehicleItem {
  id: number
  plate_number: string
  vehicle_type: string
  capacity: number
  current_location: string
  temperature_control: boolean
  status: string
}

interface MatchBreakdown {
  distance_score: number
  capacity_score: number
  temp_score: number
  route_score: number
}

interface MatchResult {
  id: number
  match_total: number
  distance_score: number
  capacity_score: number
  temp_score: number
  route_score: number
  geographic_distance?: number
  historical_deals?: number
  plate_number?: string
  vehicle_type?: string
  capacity?: number
  current_location?: string
  name?: string
  origin?: string
  destination?: string
  weight?: number
  temperature_range?: string
  breakdown: MatchBreakdown
}

const CircularScore = ({ score }: { score: number }) => {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#E8722A' : score >= 50 ? '#EAB308' : '#9CA3AF'

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg className="-rotate-90 h-16 w-16" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>
        {score}%
      </span>
    </div>
  )
}

export default function MatchingPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<'cargo' | 'vehicle'>('cargo')
  const [cargos, setCargos] = useState<CargoItem[]>([])
  const [vehicles, setVehicles] = useState<VehicleItem[]>([])
  const [selectedCargo, setSelectedCargo] = useState<number | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null)
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingList, setFetchingList] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargoId = searchParams.get('cargoId')
    const vehicleId = searchParams.get('vehicleId')
    if (cargoId) {
      setTab('cargo')
      setSelectedCargo(Number(cargoId))
      setSelectedVehicle(null)
    } else if (vehicleId) {
      setTab('vehicle')
      setSelectedVehicle(Number(vehicleId))
      setSelectedCargo(null)
    }
  }, [searchParams])

  useEffect(() => {
    fetchLists()
  }, [])

  useEffect(() => {
    if (tab === 'cargo' && selectedCargo) {
      fetchMatches('cargo', selectedCargo)
    } else if (tab === 'vehicle' && selectedVehicle) {
      fetchMatches('vehicle', selectedVehicle)
    } else {
      setMatchResults([])
    }
  }, [tab, selectedCargo, selectedVehicle])

  const fetchLists = async () => {
    setFetchingList(true)
    try {
      const [cargoRes, vehicleRes] = await Promise.all([
        api.get<{ items?: CargoItem[] } | CargoItem[]>('/api/cargo?status=pending'),
        api.get<{ items?: VehicleItem[] } | VehicleItem[]>('/api/vehicle?status=available'),
      ])
      const extractItems = <T,>(data: T[] | { items?: T[] }): T[] =>
        Array.isArray(data) ? data : data?.items ?? []
      setCargos(extractItems(cargoRes))
      setVehicles(extractItems(vehicleRes))
    } catch {
    } finally {
      setFetchingList(false)
    }
  }

  const fetchMatches = async (type: 'cargo' | 'vehicle', id: number) => {
    setLoading(true)
    setError('')
    setMatchResults([])
    try {
      const res = await api.get<MatchResult[] | { items?: MatchResult[] }>(`/api/matching/${type}/${id}`)
      setMatchResults(Array.isArray(res) ? res : res?.items || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取匹配结果失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const selectedCargoInfo = cargos.find((c) => c.id === selectedCargo)
  const selectedVehicleInfo = vehicles.find((v) => v.id === selectedVehicle)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1B2A4A]">智能匹配</h2>

      <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm w-fit">
        <button
          onClick={() => { setTab('cargo'); setSelectedVehicle(null); setMatchResults([]) }}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
            tab === 'cargo' ? 'bg-[#E8722A] text-white' : 'text-gray-500 hover:text-[#1B2A4A]'
          }`}
        >
          <Package className="h-4 w-4" />
          为货源找车
        </button>
        <button
          onClick={() => { setTab('vehicle'); setSelectedCargo(null); setMatchResults([]) }}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
            tab === 'vehicle' ? 'bg-[#E8722A] text-white' : 'text-gray-500 hover:text-[#1B2A4A]'
          }`}
        >
          <Truck className="h-4 w-4" />
          为车源找货
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-[#1B2A4A]">
              {tab === 'cargo' ? '选择货源' : '选择车源'}
            </h3>
            {fetchingList ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#E8722A]" />
              </div>
            ) : (
              <select
                value={tab === 'cargo' ? selectedCargo ?? '' : selectedVehicle ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null
                  if (tab === 'cargo') setSelectedCargo(val)
                  else setSelectedVehicle(val)
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
              >
                <option value="">{tab === 'cargo' ? '请选择货源' : '请选择车源'}</option>
                {tab === 'cargo'
                  ? cargos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.origin} → {c.destination}
                      </option>
                    ))
                  : vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} - {v.vehicle_type}
                      </option>
                    ))}
              </select>
            )}
          </div>

          {tab === 'cargo' && selectedCargoInfo && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[#1B2A4A]">货源信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="h-4 w-4 text-[#E8722A]" />
                  <span className="font-medium text-[#1B2A4A]">{selectedCargoInfo.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {selectedCargoInfo.origin} → {selectedCargoInfo.destination}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Weight className="h-4 w-4" />
                  {selectedCargoInfo.weight}吨
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Thermometer className="h-4 w-4" />
                  {selectedCargoInfo.temperature_range}
                </div>
              </div>
            </div>
          )}

          {tab === 'vehicle' && selectedVehicleInfo && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[#1B2A4A]">车源信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="h-4 w-4 text-[#E8722A]" />
                  <span className="font-medium text-[#1B2A4A]">{selectedVehicleInfo.plate_number}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Route className="h-4 w-4" />
                  {selectedVehicleInfo.vehicle_type}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Weight className="h-4 w-4" />
                  载重 {selectedVehicleInfo.capacity}吨
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  当前位置: {selectedVehicleInfo.current_location}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#E8722A]" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && matchResults.length === 0 && (selectedCargo || selectedVehicle) && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Route className="mb-3 h-12 w-12" />
              <p>暂无匹配结果</p>
            </div>
          )}

          {!loading && !error && matchResults.length === 0 && !selectedCargo && !selectedVehicle && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              {tab === 'cargo' ? (
                <Package className="mb-3 h-12 w-12" />
              ) : (
                <Truck className="mb-3 h-12 w-12" />
              )}
              <p>点击为{tab === 'cargo' ? '货源找车' : '车源找货'}</p>
            </div>
          )}

          {!loading && !error && matchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500">
                匹配结果 ({matchResults.length})
              </h3>
              {matchResults.map((match) => (
                <div
                  key={match.id}
                  className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm"
                >
                  <CircularScore score={match.match_total} />

                  <div className="flex-1 space-y-3">
                    {tab === 'cargo' ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-[#E8722A]" />
                          <span className="font-semibold text-[#1B2A4A]">{match.plate_number}</span>
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                            {match.vehicle_type}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>载重: {match.capacity}吨</span>
                          <span>位置: {match.current_location}</span>
                          {match.geographic_distance !== undefined && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              距离: {match.geographic_distance}km
                            </span>
                          )}
                          {match.historical_deals !== undefined && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              历史成交: {match.historical_deals}单
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-[#E8722A]" />
                          <span className="font-semibold text-[#1B2A4A]">{match.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>{match.origin} → {match.destination}</span>
                          <span>{match.weight}吨</span>
                          <span>{match.temperature_range}</span>
                          {match.geographic_distance !== undefined && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              距离: {match.geographic_distance}km
                            </span>
                          )}
                          {match.historical_deals !== undefined && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              历史成交: {match.historical_deals}单
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 rounded-lg bg-[#F5F6FA] p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-xs text-gray-400">距离匹配</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${match.distance_score}%` }} />
                        </div>
                        <span className="w-10 text-right text-sm font-semibold text-[#1B2A4A]">{match.distance_score}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-xs text-gray-400">载重匹配</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-green-500" style={{ width: `${match.capacity_score}%` }} />
                        </div>
                        <span className="w-10 text-right text-sm font-semibold text-[#1B2A4A]">{match.capacity_score}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-xs text-gray-400">温控匹配</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-red-500" style={{ width: `${match.temp_score}%` }} />
                        </div>
                        <span className="w-10 text-right text-sm font-semibold text-[#1B2A4A]">{match.temp_score}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-xs text-gray-400">线路匹配</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-[#E8722A]" style={{ width: `${match.route_score}%` }} />
                        </div>
                        <span className="w-10 text-right text-sm font-semibold text-[#1B2A4A]">{match.route_score}%</span>
                      </div>
                    </div>

                    <button className="flex items-center gap-1.5 rounded-lg bg-[#E8722A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d0651f]">
                      <MessageSquare className="h-4 w-4" />
                      发起洽谈
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
