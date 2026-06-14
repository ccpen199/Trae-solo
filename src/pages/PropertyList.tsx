import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Grid3X3,
  Map,
  Heart,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Building2,
  Home,
  Key,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { propertyApi } from '../utils/api';
import { formatPrice, formatUnitPrice, formatArea, formatRooms, formatRelativeTime } from '../utils/format';
import { usePropertyStore } from '../store/usePropertyStore';
import type { Property, SearchFilters } from '@shared/types';

const ITEMS_PER_PAGE = 12;

const priceRanges = [
  { label: '不限', min: undefined, max: undefined },
  { label: '100万以下', min: 0, max: 1000000 },
  { label: '100-200万', min: 1000000, max: 2000000 },
  { label: '200-300万', min: 2000000, max: 3000000 },
  { label: '300-500万', min: 3000000, max: 5000000 },
  { label: '500-800万', min: 5000000, max: 8000000 },
  { label: '800万以上', min: 8000000, max: undefined },
];

const areaRanges = [
  { label: '不限', min: undefined, max: undefined },
  { label: '50㎡以下', min: 0, max: 50 },
  { label: '50-70㎡', min: 50, max: 70 },
  { label: '70-90㎡', min: 70, max: 90 },
  { label: '90-120㎡', min: 90, max: 120 },
  { label: '120-144㎡', min: 120, max: 144 },
  { label: '144㎡以上', min: 144, max: undefined },
];

const roomOptions = [
  { label: '不限', value: undefined },
  { label: '一室', value: 1 },
  { label: '两室', value: 2 },
  { label: '三室', value: 3 },
  { label: '四室', value: 4 },
  { label: '五室及以上', value: 5 },
];

const orientationOptions = ['不限', '南', '北', '东', '西', '南北通透'];
const decorationOptions = ['不限', '毛坯', '简装', '精装', '豪装'];
const districtOptions = ['不限', '浦东新区', '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '宝山区', '闵行区'];

const sortOptions = [
  { label: '综合排序', value: 'weight' },
  { label: '价格从低到高', value: 'price' },
  { label: '价格从高到低', value: 'price-desc' },
  { label: '面积从大到小', value: 'area' },
  { label: '最新发布', value: 'time' },
];

export default function PropertyList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('keyword') || '');

  const { filters, setFilters, resetFilters, toggleFavorite, favorites, mapState, setMapState } = usePropertyStore();
  const [prevTotal, setPrevTotal] = useState<number | null>(null);
  const [showSmartSearch, setShowSmartSearch] = useState(false);
  const [smartSearchType, setSmartSearchType] = useState<'metro' | 'school' | 'map' | null>(null);

  useEffect(() => {
    const typeParam = searchParams.get('type') as SearchFilters['type'];
    const keywordParam = searchParams.get('keyword');
    const sortParam = searchParams.get('sortBy') as SearchFilters['sortBy'];
    const priceMinParam = searchParams.get('priceMin');
    const priceMaxParam = searchParams.get('priceMax');
    const areaMinParam = searchParams.get('areaMin');
    const areaMaxParam = searchParams.get('areaMax');
    const roomsParam = searchParams.get('rooms');
    const decorationParam = searchParams.get('decoration');
    const nearMetroParam = searchParams.get('nearMetro');
    const schoolDistrictParam = searchParams.get('schoolDistrict');
    const hasVRParam = searchParams.get('hasVR');
    const verifiedOnlyParam = searchParams.get('verifiedOnly');
    const districtParam = searchParams.get('district');

    const newFilters: Partial<SearchFilters> = {};
    if (typeParam) newFilters.type = typeParam;
    if (sortParam) newFilters.sortBy = sortParam;
    if (priceMinParam) newFilters.priceMin = Number(priceMinParam);
    if (priceMaxParam) newFilters.priceMax = Number(priceMaxParam);
    if (areaMinParam) newFilters.areaMin = Number(areaMinParam);
    if (areaMaxParam) newFilters.areaMax = Number(areaMaxParam);
    if (roomsParam) newFilters.rooms = roomsParam.split(',').map(Number);
    if (decorationParam) newFilters.decoration = decorationParam.split(',');
    if (nearMetroParam === 'true') newFilters.nearMetro = true;
    if (schoolDistrictParam === 'true') newFilters.schoolDistrict = true;
    if (hasVRParam === 'true') newFilters.hasVR = true;
    if (verifiedOnlyParam === 'true') newFilters.verifiedOnly = true;
    if (districtParam) newFilters.district = districtParam.split(',');

    if (Object.keys(newFilters).length > 0) {
      setFilters(newFilters);
    }
    if (keywordParam) {
      setSearchKeyword(keywordParam);
    }
  }, [searchParams, setFilters]);

  const [resultChange, setResultChange] = useState<{ type: 'increase' | 'decrease' | 'none'; diff: number } | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        let response;
        if (searchKeyword.trim()) {
          response = await propertyApi.searchByKeyword(searchKeyword, filters);
        } else {
          response = await propertyApi.getPropertyList(filters);
        }
        if (response.success && response.data) {
          const list = (response.data as any).list || response.data;
          const propertyList = Array.isArray(list) ? list : [];
          
          if (prevTotal !== null && propertyList.length !== prevTotal) {
            const diff = propertyList.length - prevTotal;
            setResultChange({
              type: diff > 0 ? 'increase' : 'decrease',
              diff: Math.abs(diff),
            });
            setTimeout(() => setResultChange(null), 3000);
          }
          
          setPrevTotal(propertyList.length);
          setProperties(propertyList);
          usePropertyStore.getState().setProperties(propertyList);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [filters, searchKeyword]);

  const activeFilterSummary = useMemo(() => {
    const items: { label: string; onRemove: () => void }[] = [];
    if (filters.type) {
      items.push({
        label: filters.type === 'secondhand' ? '二手房' : filters.type === 'new' ? '新房' : '租房',
        onRemove: () => setFilters({ type: undefined }),
      });
    }
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const label = `${filters.priceMin ? `${(filters.priceMin / 10000).toFixed(0)}万` : ''}-${filters.priceMax ? `${(filters.priceMax / 10000).toFixed(0)}万` : '不限'}`;
      items.push({ label: `价格 ${label.replace(/^-/, '').replace(/-$/, '')}`, onRemove: () => setFilters({ priceMin: undefined, priceMax: undefined }) });
    }
    if (filters.areaMin !== undefined || filters.areaMax !== undefined) {
      const label = `${filters.areaMin || ''}-${filters.areaMax || ''}㎡`.replace(/^-/, '').replace(/-$/, '');
      items.push({ label: `面积 ${label}`, onRemove: () => setFilters({ areaMin: undefined, areaMax: undefined }) });
    }
    if (filters.rooms && filters.rooms.length > 0) {
      filters.rooms.forEach((room) => {
        items.push({ label: `${room}室`, onRemove: () => {
          const newRooms = filters.rooms?.filter((r) => r !== room);
          setFilters({ rooms: newRooms?.length ? newRooms : undefined });
        }});
      });
    }
    if (filters.district && filters.district.length > 0) {
      filters.district.forEach((d) => {
        items.push({ label: d, onRemove: () => {
          const newDistricts = filters.district?.filter((x) => x !== d);
          setFilters({ district: newDistricts?.length ? newDistricts : undefined });
        }});
      });
    }
    if (filters.decoration && filters.decoration.length > 0) {
      filters.decoration.forEach((d) => {
        items.push({ label: d, onRemove: () => {
          const newDec = filters.decoration?.filter((x) => x !== d);
          setFilters({ decoration: newDec?.length ? newDec : undefined });
        }});
      });
    }
    if (filters.nearMetro) items.push({ label: '🚇 近地铁≤1km', onRemove: () => setFilters({ nearMetro: false }) });
    if (filters.schoolDistrict) items.push({ label: '🎓 学区房', onRemove: () => setFilters({ schoolDistrict: false }) });
    if (filters.hasVR) items.push({ label: '🎥 有VR', onRemove: () => setFilters({ hasVR: false }) });
    if (filters.verifiedOnly) items.push({ label: '✓ 已核验', onRemove: () => setFilters({ verifiedOnly: false }) });
    return items;
  }, [filters, setFilters]);

  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);

  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return properties.slice(start, start + ITEMS_PER_PAGE);
  }, [properties, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchKeyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      setSearchParams({ keyword: searchKeyword });
    } else {
      setSearchParams({});
    }
  };

  const handleTypeChange = (type: SearchFilters['type']) => {
    setFilters({ type });
    setSearchParams({ type: type || '' });
  };

  const handlePriceRangeChange = (range: typeof priceRanges[0]) => {
    setFilters({ priceMin: range.min, priceMax: range.max });
  };

  const handleAreaRangeChange = (range: typeof areaRanges[0]) => {
    setFilters({ areaMin: range.min, areaMax: range.max });
  };

  const handleRoomsChange = (rooms: number | undefined) => {
    setFilters({ rooms: rooms ? [rooms] : undefined });
  };

  const handleOrientationChange = (orientation: string) => {
    setFilters({ orientation: orientation === '不限' ? undefined : [orientation] });
  };

  const handleDecorationChange = (decoration: string) => {
    setFilters({ decoration: decoration === '不限' ? undefined : [decoration] });
  };

  const handleDistrictChange = (district: string) => {
    setFilters({ district: district === '不限' ? undefined : [district] });
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    setFilters({ sortBy });
  };

  const handleToggleFilter = (key: keyof SearchFilters, value: boolean) => {
    setFilters({ [key]: value });
  };

  const toggleView = () => {
    setMapState({ isMapView: !mapState.isMapView });
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const isFavorite = favorites.includes(property.id);
    const { ownerVerified, agentVerified, antiFraudPassed, listingDays, decayWeight } = property.verification;
    const isFiveOnly = property.propertyRight.isFiveYears && property.propertyRight.isOnlyOne;

    return (
      <div className="card group cursor-pointer flex flex-col md:flex-row" onClick={() => navigate(`/property/${property.id}`)}>
        <div className="relative md:w-64 flex-shrink-0">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(property.id);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[80%]">
            {property.type === 'new' && <span className="badge badge-secondary">新房</span>}
            {property.type === 'rent' && <span className="badge badge-primary">租房</span>}
            {property.vrUrl && (
              <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs font-medium rounded">🎥 VR</span>
            )}
            {property.metroInfo && (
              <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs font-medium rounded">
                🚇 {property.metroInfo.nearestStation.slice(0, 4)}{Math.round(property.metroInfo.distance)}m
              </span>
            )}
            {property.schoolDistrict && (
              <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-medium rounded">
                🎓 {property.schoolDistrict.quality === 'key' ? '重点' : ''}{property.schoolDistrict.name.slice(0, 4)}
              </span>
            )}
            {isFiveOnly && (
              <span className="px-1.5 py-0.5 bg-teal-600 text-white text-xs font-medium rounded">满五唯一</span>
            )}
            {antiFraudPassed && ownerVerified && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">✓真房源</span>
            )}
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{property.district} · {property.address}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{formatRooms(property.rooms, property.halls, property.bathrooms)}</span>
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{formatArea(property.area)}</span>
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{property.orientation}</span>
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{property.decoration}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              property.propertyRight.status === 'normal' ? 'bg-green-100 text-green-700' :
              property.propertyRight.status === 'mortgaged' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {property.propertyRight.status === 'normal' ? '产权清晰' :
               property.propertyRight.status === 'mortgaged' ? '抵押中' : '已查封'}
            </span>
          </div>
          <div className={`flex flex-wrap gap-1.5 p-2 rounded-md text-xs mb-3 ${
            (antiFraudPassed && ownerVerified) ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'
          }`}>
            <span className={ownerVerified ? 'text-green-600' : 'text-gray-400'}>📱业主验</span>
            <span className="text-gray-300">|</span>
            <span className={agentVerified ? 'text-blue-600' : 'text-gray-400'}>🏢中介备</span>
            <span className="text-gray-300">|</span>
            <span className={antiFraudPassed ? 'text-purple-600' : 'text-gray-400'}>🛡️反诈验</span>
            <span className="text-gray-300">|</span>
            <span className="text-orange-600">⏱{listingDays}天</span>
            <span className={`font-medium ${decayWeight >= 0.8 ? 'text-green-600' : decayWeight >= 0.6 ? 'text-orange-600' : 'text-red-600'}`}>
              权重{decayWeight.toFixed(2)}
            </span>
          </div>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary-600">{formatPrice(property.price)}</span>
              {property.type !== 'rent' && (
                <span className="text-xs text-gray-400">{formatUnitPrice(property.unitPrice)}</span>
              )}
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(property.publishTime)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const metroStations = ['宣武门', '西直门', '国贸', '望京', '中关村', '五道口', '朝阳门', '复兴门', '公主坟', '人民广场', '陆家嘴', '静安寺'];
  const schoolNames = ['北京第一实验小学', '中关村第一小学', '史家胡同小学', '人大附中实验小学', '上海实验小学', '明珠小学'];

  const SmartSearchModal = ({ type, onClose, onApply }: {
    type: 'metro' | 'school' | 'map';
    onClose: () => void;
    onApply: (params: any) => void;
  }) => {
    const [station, setStation] = useState(metroStations[0]);
    const [radius, setRadius] = useState(1500);
    const [school, setSchool] = useState(schoolNames[0]);
    const [quality, setQuality] = useState<'all' | 'key' | 'normal'>('all');

    const titles: Record<string, { icon: string; title: string; desc: string }> = {
      metro: { icon: '🚇', title: '地铁站半径检索', desc: '以选定地铁站为中心，搜索指定半径内的房源' },
      school: { icon: '🎓', title: '学区划片匹配', desc: '根据学校名称筛选划片范围内的对口房源' },
      map: { icon: '📍', title: '地图圈选搜索', desc: '切换到地图视图，在地图上框选区域进行范围搜索' },
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">{titles[type].icon}</span>
                  {titles[type].title}
                </h3>
                <p className="text-sm text-primary-100 mt-1">{titles[type].desc}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {type === 'metro' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择地铁站</label>
                  <select
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    {metroStations.map((s) => <option key={s} value={s}>{s}站</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    搜索半径：<span className="text-primary-600 font-semibold">{radius}m</span>
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="100"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>500m</span><span>1.5km</span><span>3km</span>
                  </div>
                </div>
              </>
            )}

            {type === 'school' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择学校</label>
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    {schoolNames.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学校级别</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: '全部' },
                      { value: 'key', label: '🏆 重点校' },
                      { value: 'normal', label: '普通校' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setQuality(opt.value as any)}
                        className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                          quality === opt.value
                            ? 'bg-primary-600 text-white font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {type === 'map' && (
              <div className="py-4 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl">
                  🗺️
                </div>
                <p className="text-gray-700 mb-2">即将切换到地图视图</p>
                <p className="text-sm text-gray-500 mb-4">
                  在地图上按住鼠标拖动绘制选框，即可筛选该范围内的所有房源
                </p>
                <div className="flex gap-2 justify-center flex-wrap text-xs">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">支持多边形圈选</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">实时数量预览</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">距离热力计算</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (type === 'metro') {
                  onApply({ stationName: station, radius, filters: {} });
                } else if (type === 'school') {
                  propertyApi.searchByKeyword(school, filters).then((res) => {
                    if (res.success && res.data) {
                      const list = (res.data as any).list || res.data;
                      setProperties(list as Property[]);
                    }
                  });
                  onClose();
                } else {
                  onClose();
                }
              }}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              {type === 'map' ? '进入地图视图' : '开始搜索'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-100 pb-4">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      {children}
    </div>
  );

  const FilterButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-primary-50 text-primary-600 font-medium'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索小区、地址、户型..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn-outline flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              筛选
            </button>
            <button type="submit" className="btn-primary">搜索</button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-5 sticky top-32">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-600" />
                  筛选条件
                </h3>
                <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-primary-600">
                  重置
                </button>
              </div>

              <div className="space-y-4">
                <FilterSection title="房源类型">
                  <div className="flex flex-wrap gap-2">
                    <FilterButton active={!filters.type} onClick={() => handleTypeChange(undefined)}>
                      全部
                    </FilterButton>
                    <FilterButton active={filters.type === 'secondhand'} onClick={() => handleTypeChange('secondhand')}>
                      <Home className="w-3 h-3 inline mr-1" />二手房
                    </FilterButton>
                    <FilterButton active={filters.type === 'new'} onClick={() => handleTypeChange('new')}>
                      <Building2 className="w-3 h-3 inline mr-1" />新房
                    </FilterButton>
                    <FilterButton active={filters.type === 'rent'} onClick={() => handleTypeChange('rent')}>
                      <Key className="w-3 h-3 inline mr-1" />租房
                    </FilterButton>
                  </div>
                </FilterSection>

                <FilterSection title="价格区间">
                  <div className="grid grid-cols-2 gap-2">
                    {priceRanges.map((range) => (
                      <FilterButton
                        key={range.label}
                        active={filters.priceMin === range.min && filters.priceMax === range.max}
                        onClick={() => handlePriceRangeChange(range)}
                      >
                        {range.label}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="面积区间">
                  <div className="grid grid-cols-2 gap-2">
                    {areaRanges.map((range) => (
                      <FilterButton
                        key={range.label}
                        active={filters.areaMin === range.min && filters.areaMax === range.max}
                        onClick={() => handleAreaRangeChange(range)}
                      >
                        {range.label}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="户型">
                  <div className="flex flex-wrap gap-2">
                    {roomOptions.map((option) => (
                      <FilterButton
                        key={option.label}
                        active={filters.rooms?.includes(option.value as number) || (option.value === undefined && !filters.rooms)}
                        onClick={() => handleRoomsChange(option.value)}
                      >
                        {option.label}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="朝向">
                  <div className="flex flex-wrap gap-2">
                    {orientationOptions.map((option) => (
                      <FilterButton
                        key={option}
                        active={filters.orientation?.includes(option) || (option === '不限' && !filters.orientation)}
                        onClick={() => handleOrientationChange(option)}
                      >
                        {option}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="装修">
                  <div className="flex flex-wrap gap-2">
                    {decorationOptions.map((option) => (
                      <FilterButton
                        key={option}
                        active={filters.decoration?.includes(option) || (option === '不限' && !filters.decoration)}
                        onClick={() => handleDecorationChange(option)}
                      >
                        {option}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="区域">
                  <div className="flex flex-wrap gap-2">
                    {districtOptions.map((option) => (
                      <FilterButton
                        key={option}
                        active={filters.district?.includes(option) || (option === '不限' && !filters.district)}
                        onClick={() => handleDistrictChange(option)}
                      >
                        {option}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="特色筛选">
                  <div className="space-y-2">
                    {[
                      { key: 'nearMetro', label: '近地铁', icon: '🚇' },
                      { key: 'schoolDistrict', label: '学区房', icon: '🎓' },
                      { key: 'hasVR', label: '有VR', icon: '🎥' },
                      { key: 'verifiedOnly', label: '已核验', icon: '✓' },
                    ].map(({ key, label, icon }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            filters[key as keyof SearchFilters]
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-gray-300'
                          }`}
                          onClick={() => handleToggleFilter(key as keyof SearchFilters, !filters[key as keyof SearchFilters])}
                        >
                          {filters[key as keyof SearchFilters] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">
                          {icon} {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-card p-4 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">
                      共找到 <span className="font-semibold text-primary-600 text-lg">{properties.length}</span> 套房源
                    </span>
                    {resultChange && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium animate-pulse ${
                        resultChange.type === 'increase' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {resultChange.type === 'increase' ? '↑ +' : '↓ -'}{resultChange.diff}套
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <select
                      value={filters.sortBy || 'weight'}
                      onChange={(e) => handleSortChange(e.target.value as SearchFilters['sortBy'])}
                      className="border-none bg-transparent text-sm text-gray-700 focus:ring-0 cursor-pointer"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-1">
                    <button
                      onClick={() => { setShowSmartSearch(true); setSmartSearchType('metro'); }}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-white hover:shadow-sm text-green-700 transition-all"
                    >
                      🚇 地铁搜
                    </button>
                    <button
                      onClick={() => { setShowSmartSearch(true); setSmartSearchType('school'); }}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-white hover:shadow-sm text-orange-700 transition-all"
                    >
                      🎓 学区搜
                    </button>
                    <button
                      onClick={() => { setShowSmartSearch(true); setSmartSearchType('map'); toggleView(); }}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-white hover:shadow-sm text-blue-700 transition-all"
                    >
                      📍 圈选搜
                    </button>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={toggleView}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        !mapState.isMapView ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4 inline mr-1" />
                      列表
                    </button>
                    <button
                      onClick={toggleView}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        mapState.isMapView ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      <Map className="w-4 h-4 inline mr-1" />
                      地图
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters Summary */}
              {activeFilterSummary.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 pr-2 border-r border-gray-200">
                    <Filter className="w-3.5 h-3.5" />
                    {activeFilterSummary.length}个筛选条件
                  </div>
                  {activeFilterSummary.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-100 transition-colors"
                    >
                      {item.label}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={item.onRemove}
                      />
                    </span>
                  ))}
                  {activeFilterSummary.length > 3 && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-gray-500 hover:text-red-600 underline underline-offset-2"
                    >
                      清空全部
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Smart Search Modal */}
            {showSmartSearch && smartSearchType && (
              <SmartSearchModal
                type={smartSearchType}
                onClose={() => { setShowSmartSearch(false); setSmartSearchType(null); }}
                onApply={(params) => {
                  if (smartSearchType === 'metro') {
                    propertyApi.searchByMetro(params as any).then((res) => {
                      if (res.success && res.data) {
                        setProperties(res.data);
                        usePropertyStore.getState().setProperties(res.data);
                      }
                    });
                  }
                  setShowSmartSearch(false);
                  setSmartSearchType(null);
                }}
              />
            )}

            {/* Property List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card flex flex-col md:flex-row">
                    <div className="skeleton w-full md:w-64 h-48 md:h-auto" />
                    <div className="p-4 flex-1 space-y-3">
                      <div className="skeleton h-5 w-3/4" />
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton h-4 w-2/3" />
                      <div className="skeleton h-6 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProperties.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">暂未找到匹配房源</h3>
                <p className="text-gray-500 mb-2">
                  当前筛选条件过于严格，建议：
                </p>
                <div className="flex flex-col items-start gap-1 text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  <div>• 放宽 <span className="text-primary-600 font-medium">价格区间</span>：试试上下浮动20%</div>
                  <div>• 增加 <span className="text-primary-600 font-medium">户型/区域</span>：可选2~3个作为备选</div>
                  <div>• 减少 <span className="text-primary-600 font-medium">特色标签</span>：如取消"满五唯一""近地铁"等硬性限制</div>
                  <div>• 启用 <span className="text-primary-600 font-medium">智能搜索</span>：试试地铁半径或学区匹配</div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={resetFilters} className="btn-outline">清除全部筛选</button>
                  <button
                    onClick={() => { setFilters({ priceMax: undefined, priceMin: undefined, areaMax: undefined, areaMin: undefined }); }}
                    className="btn-primary"
                  >
                    放宽价格面积
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
