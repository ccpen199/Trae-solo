import { X, MapPin, Phone, Clock, Navigation, Star } from 'lucide-react'
import { type Institution } from './data'

interface DetailModalProps {
  institution: Institution
  onClose: () => void
}

const typeLabels: Record<Institution['type'], string> = {
  hospital: '医院',
  community: '社区卫生',
  pharmacy: '药房',
}

export default function DetailModal({ institution: inst, onClose }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">{inst.name}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            {inst.level && (
              <span className="inline-block px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-md">
                {inst.level}
              </span>
            )}
            <span className="inline-block px-2.5 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-md">
              {typeLabels[inst.type]}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-gray-700">{inst.rating}</span>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">地址</p>
                <p className="text-sm text-gray-700">{inst.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">电话</p>
                <p className="text-sm text-gray-700">{inst.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">工作时间</p>
                <p className="text-sm text-gray-700">{inst.workHours}</p>
              </div>
            </div>
          </div>

          {inst.departments.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">科室列表</p>
              <div className="flex flex-wrap gap-2">
                {inst.departments.map((dept) => (
                  <span
                    key={dept}
                    className="inline-block px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {inst.medicines.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">药品目录</p>
              <div className="flex flex-wrap gap-2">
                {inst.medicines.map((med) => (
                  <span
                    key={med}
                    className="inline-block px-2.5 py-1 text-xs bg-orange-50 text-orange-600 rounded-md"
                  >
                    {med}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              <Navigation size={16} />
              导航前往
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Phone size={16} />
              拨打电话
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
