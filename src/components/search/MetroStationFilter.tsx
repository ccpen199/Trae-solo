import { useState } from 'react';
import { ChevronDown, Train, X } from 'lucide-react';

interface MetroStation {
  id: string;
  name: string;
  line: string;
  lineColor: string;
}

interface MetroStationFilterProps {
  stations?: MetroStation[];
  selectedStation?: string;
  selectedRadius?: number;
  onStationChange?: (stationId: string | undefined) => void;
  onRadiusChange?: (radius: number) => void;
  onClear?: () => void;
}

const RADIUS_OPTIONS = [
  { value: 500, label: '500米' },
  { value: 1000, label: '1公里' },
  { value: 2000, label: '2公里' },
  { value: 3000, label: '3公里' },
];

const DEFAULT_STATIONS: MetroStation[] = [
  { id: '1', name: '国贸站', line: '1号线', lineColor: '#C23A30' },
  { id: '2', name: '西单站', line: '1号线', lineColor: '#C23A30' },
  { id: '3', name: '天安门西站', line: '1号线', lineColor: '#C23A30' },
  { id: '4', name: '王府井站', line: '1号线', lineColor: '#C23A30' },
  { id: '5', name: '朝阳门站', line: '2号线', lineColor: '#006097' },
  { id: '6', name: '西直门站', line: '2号线', lineColor: '#006097' },
  { id: '7', name: '东直门站', line: '2号线', lineColor: '#006097' },
  { id: '8', name: '中关村站', line: '4号线', lineColor: '#009149' },
  { id: '9', name: '海淀黄庄站', line: '4号线', lineColor: '#009149' },
  { id: '10', name: '人民大学站', line: '4号线', lineColor: '#009149' },
  { id: '11', name: '宋家庄站', line: '5号线', lineColor: '#A6227F' },
  { id: '12', name: '东单站', line: '5号线', lineColor: '#A6227F' },
  { id: '13', name: '望京站', line: '14号线', lineColor: '#B8860B' },
  { id: '14', name: '将台站', line: '14号线', lineColor: '#B8860B' },
  { id: '15', name: '金台路站', line: '6号线', lineColor: '#D9931F' },
];

export const MetroStationFilter = ({
  stations = DEFAULT_STATIONS,
  selectedStation,
  selectedRadius = 1000,
  onStationChange,
  onRadiusChange,
  onClear,
}: MetroStationFilterProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStations = stations.filter(
    (station) =>
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.line.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStationData = stations.find((s) => s.id === selectedStation);

  const handleStationSelect = (stationId: string) => {
    if (selectedStation === stationId) {
      onStationChange?.(undefined);
    } else {
      onStationChange?.(stationId);
    }
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onClear?.();
    setSearchQuery('');
  };

  const hasSelection = selectedStation !== undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Train className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-900">地铁站筛选</span>
        </div>
        {hasSelection && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            清除
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-white hover:border-blue-400 transition-colors"
          >
            {selectedStationData ? (
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedStationData.lineColor }}
                />
                <span className="text-gray-900 font-medium">{selectedStationData.name}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {selectedStationData.line}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">请选择地铁站</span>
            )}
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="搜索地铁站..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredStations.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    未找到匹配的地铁站
                  </div>
                ) : (
                  filteredStations.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => handleStationSelect(station.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedStation === station.id ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: station.lineColor }}
                        />
                        <span className="text-gray-900">{station.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{station.line}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">搜索半径</label>
          <div className="grid grid-cols-4 gap-2">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onRadiusChange?.(option.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedRadius === option.value
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {hasSelection && selectedStationData && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              正在搜索 <span className="font-semibold">{selectedStationData.name}</span>{' '}
              周边
              <span className="font-semibold">
                {RADIUS_OPTIONS.find((r) => r.value === selectedRadius)?.label}
              </span>{' '}
              范围内的房源
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
