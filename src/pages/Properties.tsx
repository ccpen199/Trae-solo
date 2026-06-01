import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, MapPin, Star, Grid, List, Train, GraduationCap,
  Shield, Eye, Flag, X, AlertTriangle, BadgeCheck, CheckCircle, Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const METRO_LINES = [
  { value: '', label: '不限' },
  { value: '1号线', label: '1号线' },
  { value: '2号线', label: '2号线' },
  { value: '10号线', label: '10号线' },
  { value: '13号线', label: '13号线' },
  { value: '15号线', label: '15号线' },
];

const SCHOOL_OPTIONS = [
  { value: '', label: '不限' },
  { value: 'has_school', label: '有学区' },
];

const PUBLISH_TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'owner', label: '房东委托' },
  { value: 'agent', label: '中介代管' },
];

const VERIFY_STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'approved', label: '已核验' },
  { value: 'pending', label: '待核验' },
];

const APPEAL_REASONS = [
  '虚假房源',
  '价格异常',
  '信息过期',
  '图片不实',
  '其他',
];

const BUSINESS_TABS = [
  { value: 'all', label: '全部' },
  { value: 'new_house', label: '新房' },
  { value: 'second_hand', label: '二手房' },
  { value: 'rental', label: '租赁' },
  { value: 'commercial', label: '商业地产' },
];

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    new_house: '新房', second_hand: '二手房', rental: '租赁', commercial: '商业地产',
  };
  return labels[type] || type;
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    new_house: 'bg-green-100 text-green-800',
    second_hand: 'bg-blue-100 text-blue-800',
    rental: 'bg-purple-100 text-purple-800',
    commercial: 'bg-orange-100 text-orange-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

const getVerifyStatusTag = (status: string) => {
  switch (status) {
    case 'approved': return { label: '已核验', cls: 'bg-green-100 text-green-700', icon: CheckCircle };
    case 'pending': return { label: '待核验', cls: 'bg-yellow-100 text-yellow-700', icon: Clock };
    case 'rejected': return { label: '虚假预警', cls: 'bg-red-100 text-red-700', icon: AlertTriangle };
    default: return { label: '未知', cls: 'bg-gray-100 text-gray-700', icon: Shield };
  }
};

const getPublishTypeLabel = (type: string) => {
  switch (type) {
    case 'owner': return '房东委托';
    case 'agent': return '中介代管';
    default: return type;
  }
};

const getPublishTypeColor = (type: string) => {
  switch (type) {
    case 'owner': return 'bg-cyan-100 text-cyan-700';
    case 'agent': return 'bg-indigo-100 text-indigo-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

interface AppealModalProps {
  propertyId: number;
  propertyTitle: string;
  onClose: () => void;
  onSubmit: (propertyId: number, data: { reason: string; evidence: string }) => void;
}

const AppealModal: React.FC<AppealModalProps> = ({ propertyId, propertyTitle, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const finalReason = reason === '其他' ? customReason : reason;
    if (!finalReason.trim()) return;
    setSubmitting(true);
    await onSubmit(propertyId, { reason: finalReason, evidence });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">举报房源</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4 line-clamp-1">房源：{propertyTitle}</p>

        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-gray-700">举报原因</label>
          <div className="flex flex-wrap gap-2">
            {APPEAL_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                  reason === r
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {r}
              </button>
            ))}
          </div>
          {reason === '其他' && (
            <input
              type="text"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="请输入具体原因"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">详细说明</label>
          <textarea
            value={evidence}
            onChange={e => setEvidence(e.target.value)}
            placeholder="请提供更多详细信息，帮助我们核实..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || (reason === '其他' && !customReason.trim()) || submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? '提交中...' : '提交举报'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Properties: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [appealModal, setAppealModal] = useState<{ propertyId: number; title: string } | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [communityPriceStats, setCommunityPriceStats] = useState<Record<string, any>>({});

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    keyword: searchParams.get('keyword') || '',
    city: '北京',
    district: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    bedrooms: 'all',
    metro: false,
    school: false,
    metroLine: '',
    schoolFilter: '',
    publishType: '',
    verifyStatus: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
  });

  useEffect(() => {
    loadProperties();
    loadTabCounts();
    loadCommunityStats();
  }, [filters, pagination.page]);

  const loadTabCounts = async () => {
    const types = ['all', 'new_house', 'second_hand', 'rental', 'commercial'];
    const counts: Record<string, number> = {};
    await Promise.all(
      types.filter(t => t !== 'all').map(async (type) => {
        const res = await api.properties.list({ type, pageSize: 1, city: filters.city });
        if (res.success && res.data) {
          counts[type] = (res.data as any).total;
        }
      })
    );
    counts['all'] = Object.values(counts).reduce((sum, c) => sum + c, 0);
    setTabCounts(counts);
  };

  const loadCommunityStats = async () => {
    const res = await api.tools.getHeatmap({ city: filters.city });
    if (res.success && res.data) {
      const statsMap: Record<string, any> = {};
      (res.data as any[]).forEach((s: any) => {
        statsMap[s.region_name] = s;
      });
      setCommunityPriceStats(statsMap);
    }
  };

  const loadProperties = async () => {
    setLoading(true);
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    };

    if (filters.type !== 'all') params.type = filters.type;
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.city) params.city = filters.city;
    if (filters.district) params.district = filters.district;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.minArea) params.minArea = filters.minArea;
    if (filters.maxArea) params.maxArea = filters.maxArea;
    if (filters.bedrooms !== 'all') params.bedrooms = filters.bedrooms;
    if (filters.metro) params.metro = 'true';
    if (filters.school) params.school = 'true';
    if (filters.verifyStatus) {
      // Client-side filtering will handle verify_status since API only returns approved by default
    }

    const response = await api.properties.list(params);
    if (response.success && response.data) {
      let list = (response.data as any).list;
      if (filters.verifyStatus) {
        list = list.filter((p: any) => p.verify_status === filters.verifyStatus);
      }
      if (filters.publishType) {
        list = list.filter((p: any) => p.publish_type === filters.publishType);
      }
      setProperties(list);
      setTotal((response.data as any).total);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    setSearchParams(filters as any);
  };

  const handleTabChange = (tab: string) => {
    setFilters({ ...filters, type: tab });
    setPagination({ ...pagination, page: 1 });
  };

  const handleAppeal = async (propertyId: number, data: { reason: string; evidence: string }) => {
    await api.properties.appeal(String(propertyId), data);
  };

  const getValuationDeviation = (property: any) => {
    const communityStat = communityPriceStats[property.community];
    if (!communityStat || property.type === 'rental') return null;
    const pricePerSqm = (property.price * 10000) / property.area;
    const deviation = ((pricePerSqm - communityStat.avg_price) / communityStat.avg_price * 100);
    return Math.round(deviation * 100) / 100;
  };

  const getPropertyImgUrl = (type: string) => {
    const prompts: Record<string, string> = {
      new_house: 'modern new apartment building under construction, bright facade, real estate',
      second_hand: 'cozy residential apartment building exterior, mature community, real estate',
      rental: 'stylish rental apartment interior, furnished living room, real estate',
      commercial: 'modern office building glass facade, CBD business district, real estate',
    };
    const prompt = prompts[type] || 'modern apartment building exterior, real estate property';
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;
  };

  const renderPropertyCard = (property: any) => {
    const verifyTag = getVerifyStatusTag(property.verify_status);
    const deviation = getValuationDeviation(property);
    const VerifyIcon = verifyTag.icon;

    return (
      <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
        <Link to={`/properties/${property.id}`} className="block">
          <div className="relative h-48 bg-gray-200">
            <img
              src={getPropertyImgUrl(property.type)}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${getTypeColor(property.type)}`}>
              {getTypeLabel(property.type)}
            </span>
            <div className="absolute top-3 right-3 flex flex-col gap-1">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${verifyTag.cls}`}>
                <VerifyIcon size={10} /> {verifyTag.label}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getPublishTypeColor(property.publish_type)}`}>
                {getPublishTypeLabel(property.publish_type)}
              </span>
            </div>
            {property.vr_url && (
              <span className="absolute bottom-3 right-3 px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium flex items-center gap-1">
                <Eye size={12} /> VR
              </span>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{property.address}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {property.metro_station && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                  <Train size={10} /> {property.metro_station}{property.metro_distance ? ` ${property.metro_distance}m` : ''}
                </span>
              )}
              {property.school_district && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs">
                  <GraduationCap size={10} /> {property.school_district}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
              <span>{property.bedrooms}室{property.bathrooms}卫</span>
              <span>{property.area}㎡</span>
              <span>{Math.round(property.price * 10000 / property.area)}元/㎡</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-red-600">
                ¥{property.price}
                <span className="text-sm font-normal text-gray-500">
                  {property.type === 'rental' ? '/月' : '万'}
                </span>
              </span>
              {deviation !== null && (
                <span className={`text-xs font-medium ${Math.abs(deviation) > 20 ? 'text-red-500' : 'text-gray-500'}`}>
                  偏差 {deviation > 0 ? '+' : ''}{deviation}%
                </span>
              )}
            </div>
          </div>
        </Link>
        <div className="px-4 pb-3 flex justify-end">
          <button
            onClick={(e) => {
              e.preventDefault();
              setAppealModal({ propertyId: property.id, title: property.title });
            }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Flag size={12} /> 举报
          </button>
        </div>
      </div>
    );
  };

  const renderListItem = (property: any) => {
    const verifyTag = getVerifyStatusTag(property.verify_status);
    const deviation = getValuationDeviation(property);
    const VerifyIcon = verifyTag.icon;

    return (
      <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex">
        <Link to={`/properties/${property.id}`} className="flex flex-1">
          <div className="relative w-64 h-48 bg-gray-200 flex-shrink-0">
            <img
              src={getPropertyImgUrl(property.type)}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${getTypeColor(property.type)}`}>
              {getTypeLabel(property.type)}
            </span>
            <div className="absolute top-3 right-3 flex flex-col gap-1">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${verifyTag.cls}`}>
                <VerifyIcon size={10} /> {verifyTag.label}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getPublishTypeColor(property.publish_type)}`}>
                {getPublishTypeLabel(property.publish_type)}
              </span>
            </div>
            {property.vr_url && (
              <span className="absolute bottom-3 right-3 px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium flex items-center gap-1">
                <Eye size={12} /> VR
              </span>
            )}
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{property.title}</h3>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin size={14} className="mr-1" />
                <span>{property.address}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {property.metro_station && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                    <Train size={10} /> {property.metro_station}{property.metro_distance ? ` ${property.metro_distance}m` : ''}
                  </span>
                )}
                {property.school_district && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs">
                    <GraduationCap size={10} /> {property.school_district}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{property.bedrooms}室{property.bathrooms}卫</span>
                <span>{property.area}㎡</span>
                <span>{property.orientation}</span>
                <span>{property.decoration}</span>
                <span className="text-gray-500">{Math.round(property.price * 10000 / property.area)}元/㎡</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-red-600">
                  ¥{property.price}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {property.type === 'rental' ? '/月' : '万'}
                  </span>
                </span>
                {deviation !== null && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${Math.abs(deviation) > 20 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    估价偏差 {deviation > 0 ? '+' : ''}{deviation}%
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAppealModal({ propertyId: property.id, title: property.title });
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Flag size={12} /> 举报
              </button>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Business Line Tabs */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {BUSINESS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                filters.type === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.label}
              {tabCounts[tab.value] !== undefined && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-xs',
                  filters.type === tab.value ? 'bg-blue-500 text-blue-100' : 'bg-gray-200 text-gray-500'
                )}>
                  {tabCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">关键词搜索</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索小区、地址、地铁线..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            搜索
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-4 py-2 border rounded-lg transition-colors flex items-center',
              showFilters ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            )}
          >
            <Filter size={18} className="mr-2" />
            筛选
          </button>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="北京">北京</option>
                <option value="上海">上海</option>
                <option value="广州">广州</option>
                <option value="深圳">深圳</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低价格(万)</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="不限"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最高价格(万)</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="不限"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">户型</label>
              <select
                value={filters.bedrooms}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">不限</option>
                <option value="1">1室</option>
                <option value="2">2室</option>
                <option value="3">3室</option>
                <option value="4">4室</option>
                <option value="5">5室以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最小面积(㎡)</label>
              <input
                type="number"
                value={filters.minArea}
                onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="不限"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大面积(㎡)</label>
              <input
                type="number"
                value={filters.maxArea}
                onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="不限"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">地铁线路</label>
              <select
                value={filters.metroLine}
                onChange={(e) => setFilters({ ...filters, metroLine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {METRO_LINES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学区筛选</label>
              <select
                value={filters.schoolFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters({ ...filters, schoolFilter: val, school: val === 'has_school' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {SCHOOL_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">发布类型</label>
              <select
                value={filters.publishType}
                onChange={(e) => setFilters({ ...filters, publishType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PUBLISH_TYPE_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">核验状态</label>
              <select
                value={filters.verifyStatus}
                onChange={(e) => setFilters({ ...filters, verifyStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {VERIFY_STATUS_OPTIONS.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.metro}
                  onChange={(e) => setFilters({ ...filters, metro: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">地铁房</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-gray-600">
          共找到 <span className="font-semibold text-gray-900">{total}</span> 套房源
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Property List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-gray-500">暂无符合条件的房源</div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(property => renderPropertyCard(property))}
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map(property => renderListItem(property))}
        </div>
      )}

      {/* Pagination */}
      {total > pagination.pageSize && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-gray-600">
            第 {pagination.page} 页
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page * pagination.pageSize >= total}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* Appeal Modal */}
      {appealModal && (
        <AppealModal
          propertyId={appealModal.propertyId}
          propertyTitle={appealModal.title}
          onClose={() => setAppealModal(null)}
          onSubmit={handleAppeal}
        />
      )}
    </div>
  );
};

export default Properties;
