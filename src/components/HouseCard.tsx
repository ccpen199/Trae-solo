import { MapPin, BadgeCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export interface House {
  id: number
  title: string
  address: string
  price: number
  unitType: 'sell' | 'rent'
  houseType?: string
  area?: number
  agentId: number
  agentName?: string
  status: 'available' | 'reserved' | 'sold' | 'rented' | 'offline'
  certStatus: 'pending' | 'verified' | 'failed'
  certNo?: string
  images: string[]
  description?: string
  community?: string
  builtYear?: number
  lng?: number
  lat?: number
  floorInfo?: string
  orientation?: string
  decoration?: string
  createdAt?: string
  distance?: number
}

interface HouseCardProps {
  house: House
  viewMode?: 'grid' | 'list'
}

const statusConfig: Record<string, { label: string; className: string }> = {
  available: { label: '可售', className: 'bg-green-100 text-green-700' },
  reserved: { label: '预订', className: 'bg-yellow-100 text-yellow-700' },
  sold: { label: '已售', className: 'bg-gray-100 text-gray-700' },
  rented: { label: '已租', className: 'bg-blue-100 text-blue-700' },
  offline: { label: '下架', className: 'bg-red-100 text-red-700' },
}

const certConfig: Record<string, { label: string; className: string }> = {
  verified: { label: '已验真', className: 'text-green-600' },
  pending: { label: '待审核', className: 'text-yellow-600' },
  failed: { label: '验真失败', className: 'text-red-600' },
}

function formatPrice(price: number, unitType: 'sell' | 'rent') {
  if (unitType === 'sell') {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`
    }
    return `${price.toLocaleString()}元`
  }
  return `${price.toLocaleString()}元/月`
}

export default function HouseCard({ house, viewMode = 'grid' }: HouseCardProps) {
  const navigate = useNavigate()
  const status = statusConfig[house.status] || statusConfig.available
  const cert = certConfig[house.certStatus] || certConfig.pending

  const handleClick = () => {
    navigate(`/houses/${house.id}`)
  }

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleClick}
        className="flex gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      >
        <div className="relative w-48 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('modern apartment building exterior real estate photography')}&image_size=square`}
            alt={house.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect fill="%23e5e7eb" width="200" height="150"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E暂无图片%3C/text%3E%3C/svg%3E'
            }}
          />
          <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded bg-white/90">
            {house.unitType === 'sell' ? '出售' : '出租'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {house.title}
            </h3>
            <span className={cn('px-2 py-1 text-xs font-medium rounded flex-shrink-0', status.className)}>
              {status.label}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-red-600">{formatPrice(house.price, house.unitType)}</span>
            {house.unitType === 'sell' && house.area && (
              <span className="text-sm text-gray-500">
                {Math.round(house.price / house.area).toLocaleString()}元/㎡
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {house.houseType && <span>{house.houseType}</span>}
            {house.area && <span>{house.area}㎡</span>}
            {house.floorInfo && <span>{house.floorInfo}</span>}
            {house.orientation && <span>{house.orientation}</span>}
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{house.address}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">经纪人: {house.agentName || '-'}</span>
              {house.certStatus === 'verified' && (
                <span className={cn('flex items-center gap-1', cert.className)}>
                  <BadgeCheck className="w-4 h-4" />
                  {cert.label}
                </span>
              )}
              {house.distance !== undefined && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Clock className="w-4 h-4" />
                  {house.distance.toFixed(2)}km
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('modern apartment interior real estate photography')}&image_size=square_hd`}
          alt={house.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect fill="%23e5e7eb" width="300" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E暂无图片%3C/text%3E%3C/svg%3E'
          }}
        />
        <span className="absolute top-3 left-3 px-3 py-1 text-sm font-medium rounded-full bg-white/95 shadow-sm">
          {house.unitType === 'sell' ? '出售' : '出租'}
        </span>
        <span className={cn('absolute top-3 right-3 px-3 py-1 text-sm font-medium rounded-full shadow-sm', status.className)}>
          {status.label}
        </span>
        {house.distance !== undefined && (
          <span className="absolute bottom-3 right-3 px-3 py-1 text-sm font-medium rounded-full bg-blue-600/90 text-white shadow-sm">
            {house.distance.toFixed(1)}km
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {house.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-xl font-bold text-red-600">{formatPrice(house.price, house.unitType)}</span>
          {house.unitType === 'sell' && house.area && (
            <span className="text-xs text-gray-500">{Math.round(house.price / house.area).toLocaleString()}元/㎡</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {house.houseType && <span className="px-2 py-0.5 bg-gray-100 rounded">{house.houseType}</span>}
          {house.area && <span className="px-2 py-0.5 bg-gray-100 rounded">{house.area}㎡</span>}
          {house.floorInfo && <span className="px-2 py-0.5 bg-gray-100 rounded">{house.floorInfo}</span>}
        </div>
        <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{house.address}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500 truncate">{house.agentName || '-'}</span>
          {house.certStatus === 'verified' && (
            <span className={cn('flex items-center gap-1 flex-shrink-0', cert.className)}>
              <BadgeCheck className="w-4 h-4" />
              已验真
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
