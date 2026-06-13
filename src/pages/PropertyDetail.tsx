import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Heart,
  Share2,
  ArrowLeft,
  Building2,
  FileCheck,
  TreePine,
  Car,
  Calendar,
  Home,
  Award,
  TrendingUp,
  ChevronRight,
  Map as MapIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Building,
} from 'lucide-react';
import { propertyApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PropertyDetail {
  id: string;
  name: string;
  developer: {
    id: string;
    name: string;
    qualification: string;
    level: string;
    registeredCapital: number;
    establishedYear: number;
  };
  licenses: Array<{
    id: string;
    name: string;
    number: string;
    issueDate: string;
    issuingAuthority: string;
  }>;
  buildings: Array<{
    id: string;
    name: string;
    totalFloors: number;
    unitsPerFloor: number;
    totalUnits: number;
    availableUnits: number;
    unitTypes: Array<{
      id: string;
      name: string;
      area: number;
      bedrooms: number;
      livingRooms: number;
      bathrooms: number;
      price: number;
      totalPrice: number;
      orientation: string;
    }>;
    deliveryDate: string;
    decoration: string;
  }>;
  address: string;
  district: string;
  area: string;
  lat: number;
  lng: number;
  price: number;
  priceRange: string;
  totalPriceRange: string;
  propertyType: string;
  buildingType: string;
  plotRatio: number;
  greenRate: number;
  parkingRatio: string;
  propertyFee: number;
  propertyCompany: string;
  totalHouseholds: number;
  openingDate: string;
  deliveryDate: string;
  decoration: string;
  status: string;
  tags: string[];
  schoolDistrict: string;
  subwayDistance: number;
  subwayStations: string[];
  supportingFacilities: string[];
  highlights: string[];
  governmentPrice: number;
  secondhandPrice: number;
  salesRate: number;
  monthlySales: number;
}

type TabType = 'overview' | 'buildings' | 'licenses' | 'price' | 'location';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      setLoading(true);
      const res = await propertyApi.getDetail(id);
      if (res.success) {
        setProperty(res.data);
      }
      setLoading(false);
    };
    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
        <p className="text-gray-500">楼盘不存在</p>
        <Link to="/properties" className="text-blue-600 hover:underline mt-2 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: '楼盘概览' },
    { key: 'buildings', label: '楼栋信息' },
    { key: 'licenses', label: '五证信息' },
    { key: 'price', label: '价格分析' },
    { key: 'location', label: '位置配套' },
  ];

  const statusColors: Record<string, string> = {
    '在售': 'bg-green-100 text-green-700',
    '待售': 'bg-yellow-100 text-yellow-700',
    '售罄': 'bg-gray-100 text-gray-500',
    '尾盘': 'bg-orange-100 text-orange-700',
  };

  const allUnitTypes = property.buildings.flatMap((b) => b.unitTypes);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/properties"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        返回楼盘列表
      </Link>

      {/* Property Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative">
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  statusColors[property.status] || 'bg-gray-100 text-gray-600',
                )}
              >
                {property.status}
              </span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm text-white">
                {property.propertyType} · {property.buildingType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(
                  'p-2 rounded-full backdrop-blur transition-colors',
                  isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30',
                )}
              >
                <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
              </button>
              <button className="p-2 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
            <h1 className="text-3xl font-bold text-white mb-2">{property.name}</h1>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-4 h-4" />
              <span>{property.district} · {property.area} · {property.address}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-orange-500">
                {property.price.toLocaleString()}
                <span className="text-base font-normal text-gray-400 ml-1">元/㎡</span>
              </p>
              <p className="text-gray-500 mt-1">总价 {property.totalPriceRange}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 border border-blue-500 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors">
                <Phone className="w-4 h-4 inline mr-2" />
                电话咨询
              </button>
              <Link
                to="/butler"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                预约看房
              </Link>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {property.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 sticky top-16 lg:top-0 z-10">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                基本信息
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">物业类型</p>
                  <p className="font-medium text-gray-900">{property.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">建筑类型</p>
                  <p className="font-medium text-gray-900">{property.buildingType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">装修状况</p>
                  <p className="font-medium text-gray-900">{property.decoration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">总户数</p>
                  <p className="font-medium text-gray-900">{property.totalHouseholds}户</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">容积率</p>
                  <p className="font-medium text-gray-900">{property.plotRatio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">绿化率</p>
                  <p className="font-medium text-gray-900">{property.greenRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">车位比</p>
                  <p className="font-medium text-gray-900">{property.parkingRatio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">物业费</p>
                  <p className="font-medium text-gray-900">{property.propertyFee}元/㎡·月</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">物业公司</p>
                  <p className="font-medium text-gray-900">{property.propertyCompany}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">开盘时间</p>
                  <p className="font-medium text-gray-900">{property.openingDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">交房时间</p>
                  <p className="font-medium text-gray-900">{property.deliveryDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">楼盘状态</p>
                  <p className="font-medium text-gray-900">{property.status}</p>
                </div>
              </div>
            </div>

            {/* Developer Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" />
                开发商信息
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">开发商名称</p>
                  <p className="font-medium text-gray-900">{property.developer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">资质等级</p>
                  <p className="font-medium text-gray-900">{property.developer.level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">资质证书</p>
                  <p className="font-medium text-gray-900">{property.developer.qualification}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">成立年份</p>
                  <p className="font-medium text-gray-900">{property.developer.establishedYear}年</p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-500" />
                楼盘亮点
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'buildings' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" />
              在售楼栋
            </h2>
            <div className="space-y-6">
              {property.buildings.map((building) => (
                <div
                  key={building.id}
                  className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{building.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {building.totalFloors}层 · {building.unitsPerFloor}户/层 · 共{building.totalUnits}户
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        在售 {building.availableUnits} 套
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>交房：{building.deliveryDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Home className="w-4 h-4" />
                      <span>装修：{building.decoration}</span>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-3">户型列表</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {building.unitTypes.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{unit.name}</p>
                          <p className="text-sm text-gray-500">
                            {unit.area}㎡ · {unit.orientation}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-500">
                            {(unit.totalPrice / 10000).toFixed(1)}万
                          </p>
                          <p className="text-xs text-gray-500">{unit.price}元/㎡</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'licenses' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-500" />
              五证信息
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">五证齐全</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-500">
                所有证件均已齐全，可放心购买
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.licenses.map((license) => (
                <div
                  key={license.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{license.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">证号：{license.number}</p>
                      <p className="text-xs text-gray-500">发证日期：{license.issueDate}</p>
                      <p className="text-xs text-gray-500">发证机关：{license.issuingAuthority}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'price' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                价格分析
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">在售均价</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {property.price.toLocaleString()}
                    <span className="text-base font-normal">元/㎡</span>
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">政府指导价</p>
                  <p className="text-3xl font-bold text-green-600">
                    {property.governmentPrice.toLocaleString()}
                    <span className="text-base font-normal">元/㎡</span>
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">二手房均价</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {property.secondhandPrice.toLocaleString()}
                    <span className="text-base font-normal">元/㎡</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">价格对比</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">与政府指导价相比</span>
                      <span className={property.price < property.governmentPrice ? 'text-green-600' : 'text-red-500'}>
                        {property.price < property.governmentPrice ? '低' : '高'}
                        {Math.abs(((property.price - property.governmentPrice) / property.governmentPrice) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">与二手房均价相比</span>
                      <span className={property.price > property.secondhandPrice ? 'text-red-500' : 'text-green-600'}>
                        {property.price > property.secondhandPrice ? '高' : '低'}
                        {Math.abs(((property.price - property.secondhandPrice) / property.secondhandPrice) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">去化情况</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">去化率</span>
                        <span className="font-medium text-gray-900">{property.salesRate}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                          style={{ width: `${property.salesRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">月均销售</span>
                      <span className="font-medium text-gray-900">{property.monthlySales} 套/月</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">户型价格一览</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">户型</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">面积</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">朝向</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">单价</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">总价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUnitTypes.map((unit) => (
                      <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{unit.name}</td>
                        <td className="py-3 px-4 text-gray-600">{unit.area}㎡</td>
                        <td className="py-3 px-4 text-gray-600">{unit.orientation}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{unit.price.toLocaleString()}元/㎡</td>
                        <td className="py-3 px-4 text-right text-orange-500 font-medium">
                          {(unit.totalPrice / 10000).toFixed(0)}万
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'location' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center">
                <div className="text-center">
                  <MapIcon className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">地图展示区域</p>
                  <p className="text-sm text-gray-400">
                    {property.address}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    坐标：{property.lat}, {property.lng}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  交通配套
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600">地铁</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">周边地铁</p>
                      {property.subwayStations.length > 0 ? (
                        property.subwayStations.map((station, idx) => (
                          <p key={idx} className="text-sm text-gray-500">{station}</p>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">暂无地铁站点</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        最近距离：{property.subwayDistance}米
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-green-500" />
                  教育配套
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-green-600">学区</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">对口学校</p>
                      <p className="text-sm text-gray-500">{property.schoolDistrict || '暂未确定'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">周边配套</h3>
              <div className="flex flex-wrap gap-2">
                {property.supportingFacilities.map((facility, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
