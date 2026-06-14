import { useState } from 'react';
import { SlidersHorizontal, X, Train, Building2, Eye, BadgeCheck, ChevronDown } from 'lucide-react';
import type { SearchFilters } from '@shared/types';

interface PropertyFilterProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
  districts?: string[];
}

const ROOM_OPTIONS = [
  { value: 1, label: '1室' },
  { value: 2, label: '2室' },
  { value: 3, label: '3室' },
  { value: 4, label: '4室' },
  { value: 5, label: '5室及以上' },
];

const ORIENTATION_OPTIONS = ['东', '南', '西', '北', '东南', '西南', '东北', '西北'];

const DECORATION_OPTIONS = ['毛坯', '简装', '精装', '豪装'];

const DEFAULT_DISTRICTS = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '通州区', '昌平区', '大兴区'];

export const PropertyFilter = ({
  filters,
  onChange,
  onReset,
  districts = DEFAULT_DISTRICTS,
}: PropertyFilterProps) => {
  const [expanded, setExpanded] = useState(false);

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    onChange({
      ...filters,
      [type === 'min' ? 'priceMin' : 'priceMax']: value,
    });
  };

  const handleAreaChange = (type: 'min' | 'max', value: number) => {
    onChange({
      ...filters,
      [type === 'min' ? 'areaMin' : 'areaMax']: value,
    });
  };

  const toggleRooms = (room: number) => {
    const currentRooms = filters.rooms || [];
    const newRooms = currentRooms.includes(room)
      ? currentRooms.filter((r) => r !== room)
      : [...currentRooms, room];
    onChange({ ...filters, rooms: newRooms.length > 0 ? newRooms : undefined });
  };

  const toggleOrientation = (orientation: string) => {
    const current = filters.orientation || [];
    const newOrientation = current.includes(orientation)
      ? current.filter((o) => o !== orientation)
      : [...current, orientation];
    onChange({ ...filters, orientation: newOrientation.length > 0 ? newOrientation : undefined });
  };

  const toggleDecoration = (decoration: string) => {
    const current = filters.decoration || [];
    const newDecoration = current.includes(decoration)
      ? current.filter((d) => d !== decoration)
      : [...current, decoration];
    onChange({ ...filters, decoration: newDecoration.length > 0 ? newDecoration : undefined });
  };

  const toggleDistrict = (district: string) => {
    const current = filters.district || [];
    const newDistrict = current.includes(district)
      ? current.filter((d) => d !== district)
      : [...current, district];
    onChange({ ...filters, district: newDistrict.length > 0 ? newDistrict : undefined });
  };

  const toggleQuickFilter = (key: keyof SearchFilters) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const quickFilters = [
    { key: 'nearMetro' as const, label: '近地铁', icon: Train },
    { key: 'schoolDistrict' as const, label: '学区房', icon: Building2 },
    { key: 'hasVR' as const, label: '有VR', icon: Eye },
    { key: 'verifiedOnly' as const, label: '仅看核验', icon: BadgeCheck },
  ];

  const activeFilterCount = [
    filters.priceMin,
    filters.priceMax,
    filters.areaMin,
    filters.areaMax,
    filters.rooms?.length,
    filters.orientation?.length,
    filters.decoration?.length,
    filters.district?.length,
    filters.nearMetro,
    filters.schoolDistrict,
    filters.hasVR,
    filters.verifiedOnly,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">筛选条件</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            重置
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {quickFilters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => toggleQuickFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${filters[key]
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            价格区间
            <span className="ml-2 text-blue-600">
              {filters.priceMin || 0} - {filters.priceMax || '不限'} 万
            </span>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="2000"
              step="10"
              value={filters.priceMin || 0}
              onChange={(e) => handlePriceChange('min', Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <input
              type="range"
              min="0"
              max="2000"
              step="10"
              value={filters.priceMax || 2000}
              onChange={(e) => handlePriceChange('max', Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            面积区间
            <span className="ml-2 text-blue-600">
              {filters.areaMin || 0} - {filters.areaMax || '不限'} ㎡
            </span>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={filters.areaMin || 0}
              onChange={(e) => handleAreaChange('min', Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={filters.areaMax || 300}
              onChange={(e) => handleAreaChange('max', Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">户型</label>
          <div className="flex flex-wrap gap-2">
            {ROOM_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleRooms(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${(filters.rooms || []).includes(option.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors py-2"
        >
          {expanded ? '收起' : '更多筛选'}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="space-y-6 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">朝向</label>
              <div className="flex flex-wrap gap-2">
                {ORIENTATION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleOrientation(option)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${(filters.orientation || []).includes(option)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">装修</label>
              <div className="flex flex-wrap gap-2">
                {DECORATION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleDecoration(option)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${(filters.decoration || []).includes(option)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">区域</label>
              <div className="flex flex-wrap gap-2">
                {districts.map((district) => (
                  <button
                    key={district}
                    onClick={() => toggleDistrict(district)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${(filters.district || []).includes(district)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {district}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
