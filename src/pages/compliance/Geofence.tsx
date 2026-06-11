import { MapPin, AlertTriangle, Navigation, Shield } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { geofenceAlerts } from '@/data/mockData'

const typeBadge = (type: 'cross_region' | 'restricted_area') => {
  const map = {
    cross_region: { label: '跨区域', className: 'badge-warning' },
    restricted_area: { label: '禁区', className: 'badge-danger' },
  }
  const { label, className } = map[type]
  return <span className={className}>{label}</span>
}

export default function Geofence() {
  const crossRegionCount = geofenceAlerts.filter(a => a.type === 'cross_region').length
  const restrictedCount = geofenceAlerts.filter(a => a.type === 'restricted_area').length

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="地理围栏" subtitle="经销商活动范围监控与越界告警" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stagger-1 animate-fade-in-up">
          <StatCard
            title="告警总数"
            value={geofenceAlerts.length}
            icon={<MapPin size={20} />}
            iconBg="bg-blue-50 text-blue-600"
          />
        </div>
        <div className="stagger-2 animate-fade-in-up">
          <StatCard
            title="跨区域告警"
            value={crossRegionCount}
            icon={<Navigation size={20} />}
            iconBg="bg-amber-50 text-amber-600"
          />
        </div>
        <div className="stagger-3 animate-fade-in-up">
          <StatCard
            title="禁区告警"
            value={restrictedCount}
            icon={<AlertTriangle size={20} />}
            iconBg="bg-red-50 text-red-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in-up stagger-3">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-700">区域监控</h2>
          </div>
          <div className="relative h-96 bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-50 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#059669" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-dashed border-emerald-400/50 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 border border-dashed border-emerald-300/40 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Shield size={20} className="text-emerald-600" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-8 text-xs text-emerald-700 font-medium">授权区域</div>

            <div className="absolute top-[20%] right-[15%] flex flex-col items-center">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                <Navigation size={12} className="text-white" />
              </div>
              <span className="text-xs text-amber-700 mt-1 font-medium">张三</span>
              <span className="text-[10px] text-amber-500">580km</span>
            </div>
            <div className="absolute top-[35%] right-[25%] flex flex-col items-center">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                <Navigation size={12} className="text-white" />
              </div>
              <span className="text-xs text-amber-700 mt-1 font-medium">王五</span>
              <span className="text-[10px] text-amber-500">720km</span>
            </div>
            <div className="absolute bottom-[25%] left-[18%] flex flex-col items-center">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle size={12} className="text-white" />
              </div>
              <span className="text-xs text-red-700 mt-1 font-medium">赵明华</span>
              <span className="text-[10px] text-red-500">禁区</span>
            </div>
            <div className="absolute bottom-[20%] right-[20%] flex flex-col items-center">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                <Navigation size={12} className="text-white" />
              </div>
              <span className="text-xs text-amber-700 mt-1 font-medium">陈小红</span>
              <span className="text-[10px] text-amber-500">350km</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in-up stagger-4">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">告警列表</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {geofenceAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 ${
                  alert.type === 'restricted_area'
                    ? 'border-l-4 border-l-red-500 bg-red-50/30'
                    : 'border-l-4 border-l-amber-500 bg-amber-50/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{alert.dealerName}</span>
                  {typeBadge(alert.type)}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield size={12} className="text-emerald-500" />
                    <span>授权区域: {alert.authorizedRegion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={12} className="text-red-400" />
                    <span>当前位置: {alert.currentLocation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Navigation size={12} className="text-amber-400" />
                    <span>偏移距离: {alert.distance}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{alert.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
