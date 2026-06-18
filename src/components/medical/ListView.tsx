import { Star, MapPin, Phone } from 'lucide-react'
import { type Institution } from './data'

interface ListViewProps {
  institutions: Institution[]
  onSelect: (inst: Institution) => void
}

const typeLabels: Record<Institution['type'], string> = {
  hospital: '医院',
  community: '社区卫生',
  pharmacy: '药房',
}

export default function ListView({ institutions, onSelect }: ListViewProps) {
  return (
    <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
      {institutions.map((inst) => (
        <div
          key={inst.id}
          onClick={() => onSelect(inst)}
          className="bg-white rounded-xl p-4 border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-900">{inst.name}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-gray-700">{inst.rating}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {inst.level && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded">
                {inst.level}
              </span>
            )}
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-green-50 text-green-600 rounded">
              {typeLabels[inst.type]}
            </span>
          </div>

          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={14} className="flex-shrink-0" />
              <span>{inst.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone size={14} className="flex-shrink-0" />
              <span>{inst.phone}</span>
            </div>
          </div>

          {inst.departments.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {inst.departments.slice(0, 3).map((dept) => (
                <span
                  key={dept}
                  className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {dept}
                </span>
              ))}
              {inst.departments.length > 3 && (
                <span className="text-xs text-gray-400">+{inst.departments.length - 3}</span>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{inst.distance}km</span>
          </div>
        </div>
      ))}

      {institutions.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MapPin size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">未找到符合条件的机构</p>
        </div>
      )}
    </div>
  )
}
