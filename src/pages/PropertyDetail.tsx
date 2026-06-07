import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Eye,
  Phone,
  MessageSquare,
  Heart,
  Share2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Tag,
  User,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import api, { ApiResponse, Property, PriceSchedule } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

const mockProperty: Property = {
  id: 1,
  projectName: '金域华府',
  city: '上海',
  district: '浦东新区',
  address: '张江高科技园区博云路2号',
  status: 'available',
  price: 6800000,
  area: 120,
  bedrooms: 3,
  bathrooms: 2,
  floor: '中',
  orientation: '南',
  decoration: '精装修',
  discount: 95,
  promotion: '限时优惠，认购立减10万',
  vrShowroomUrl: 'vr1',
  vrSalesOfficeUrl: 'vr2',
  vrPanoramaUrl: 'vr3',
  vrStreetViewUrl: 'vr4',
  erpSource: '万科ERP',
  erpSyncStatus: 'synced',
  erpLastSyncAt: '2026-06-07 10:30:00',
  erpSyncCount: 156,
  createdAt: '2024-01-15',
  updatedAt: '2024-01-20',
};

const mockPriceSchedule: PriceSchedule[] = [
  { id: 1, propertyId: 1, unitNo: '1-101', originalPrice: 6800000, currentPrice: 6460000, status: 'available' },
  { id: 2, propertyId: 1, unitNo: '1-201', originalPrice: 6900000, currentPrice: 6555000, status: 'available' },
  { id: 3, propertyId: 1, unitNo: '1-301', originalPrice: 7000000, currentPrice: 6650000, status: 'locked' },
  { id: 4, propertyId: 1, unitNo: '1-401', originalPrice: 7100000, currentPrice: 6745000, status: 'available' },
  { id: 5, propertyId: 1, unitNo: '1-501', originalPrice: 7200000, currentPrice: 6840000, status: 'sold' },
  { id: 6, propertyId: 1, unitNo: '1-601', originalPrice: 7300000, currentPrice: 6935000, status: 'available' },
];

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [priceSchedule, setPriceSchedule] = useState<PriceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const [propResponse, priceResponse] = await Promise.all([
          api.get<ApiResponse<Property>>(`/properties/${id}`),
          api.get<ApiResponse<PriceSchedule[]>>(`/properties/${id}/price`),
        ]);

        const propResult = propResponse?.code !== undefined ? propResponse : propResponse?.data;
        if (propResult?.code === 200 && propResult.data) {
          setProperty(propResult.data);
        } else {
          setProperty(mockProperty);
        }

        const priceResult = priceResponse?.code !== undefined ? priceResponse : priceResponse?.data;
        if (priceResult?.code === 200 && priceResult.data?.length > 0) {
          setPriceSchedule(priceResult.data);
        } else {
          setPriceSchedule(mockPriceSchedule);
        }
      } catch (err) {
        setProperty(mockProperty);
        setPriceSchedule(mockPriceSchedule);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return price.toLocaleString();
  };

  const handlePurchase = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/purchase/flow/${id}` } });
      return;
    }
    navigate(`/purchase/flow/${id}`);
  };

  const handleConsult = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/im' } });
      return;
    }
    navigate('/im');
  };

  const handleVRView = () => {
    navigate(`/vr/${id}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-96 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
          <div className="h-80 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="card p-12 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-900 mb-2">房源不存在</h3>
        <p className="text-gray-500 mb-4">该房源可能已下架或不存在</p>
        <Link to="/properties" className="btn-outline">返回房源列表</Link>
      </div>
    );
  }

  const images = [1, 2, 3, 4, 5, 6];

  const features = [
    { icon: CheckCircle2, label: '房源核验', value: '已核验' },
    { icon: Clock, label: '建筑年代', value: '2022年' },
    { icon: Building2, label: '产权性质', value: '商品房' },
    { icon: Calendar, label: '产权年限', value: '70年' },
  ];

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Home className="w-24 h-24 text-primary-700/20" />
              </div>
              <div className="absolute top-4 left-4 flex gap-2">
                <StatusBadge status={property.status} />
                {property.discount < 100 && (
                  <span className="px-3 py-1 bg-danger text-white text-sm font-bold rounded">
                    {property.discount}折
                  </span>
                )}
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorite ? 'bg-danger text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 bg-white/80 text-gray-600 rounded-full hover:bg-white transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImageIndex === index
                        ? 'border-primary-700'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
                  {property.projectName}
                </h1>
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{property.city} {property.district} {property.address}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gold-600">¥{formatPrice(property.price)}</div>
                <div className="text-sm text-gray-400">总价</div>
                {property.discount < 100 && (
                  <div className="text-sm text-gray-400 line-through">
                    原价 ¥{formatPrice(property.price / (property.discount / 100))}
                  </div>
                )}
              </div>
            </div>

            {property.promotion && (
              <div className="mb-6 p-4 bg-gold-50 border border-gold-100 rounded-xl flex items-center gap-3">
                <Tag className="w-5 h-5 text-gold-600 flex-shrink-0" />
                <span className="text-gold-700">{property.promotion}</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <BedDouble className="w-6 h-6 text-primary-700 mx-auto mb-1" />
                <div className="font-semibold text-gray-900">{property.bedrooms}室</div>
                <div className="text-xs text-gray-500">卧室</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Bath className="w-6 h-6 text-primary-700 mx-auto mb-1" />
                <div className="font-semibold text-gray-900">{property.bathrooms}卫</div>
                <div className="text-xs text-gray-500">卫生间</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Maximize2 className="w-6 h-6 text-primary-700 mx-auto mb-1" />
                <div className="font-semibold text-gray-900">{property.area}㎡</div>
                <div className="text-xs text-gray-500">建筑面积</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Eye className="w-6 h-6 text-primary-700 mx-auto mb-1" />
                <div className="font-semibold text-gray-900">{property.orientation}</div>
                <div className="text-xs text-gray-500">朝向</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-700" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{feature.label}</div>
                      <div className="font-medium text-gray-900">{feature.value}</div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">装修</div>
                  <div className="font-medium text-gray-900">{property.decoration}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">楼层</div>
                  <div className="font-medium text-gray-900">{property.floor}层</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">一房一价表</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">房号</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">原价</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">现价</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">优惠</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {priceSchedule.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.unitNo}</td>
                      <td className="py-3 px-4 text-right text-gray-400 line-through">¥{formatPrice(item.originalPrice)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gold-600">¥{formatPrice(item.currentPrice)}</td>
                      <td className="py-3 px-4 text-right text-danger">
                        -{formatPrice(item.originalPrice - item.currentPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={item.status as 'available' | 'locked' | 'sold' | 'offline'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 sticky top-24">
            <button
              onClick={handleVRView}
              className="w-full mb-4 py-4 gradient-gold text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Eye className="w-5 h-5" />
              VR 沉浸式看房
            </button>

            <div className="space-y-3 mb-6">
              <button
                onClick={handlePurchase}
                disabled={property.status !== 'available'}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                  property.status === 'available'
                    ? 'btn-primary'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                {property.status === 'available' ? '立即认购' : '暂时无法认购'}
              </button>

              <button
                onClick={handleConsult}
                className="w-full py-3 border-2 border-primary-700 text-primary-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                在线咨询
              </button>

              <button className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                <Phone className="w-5 h-5" />
                电话咨询
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 gradient-gold rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">张顾问</div>
                  <div className="text-sm text-gray-500">金牌置业顾问</div>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded">5年经验</span>
                <span className="px-2 py-1 bg-gold-50 text-gold-700 rounded">1000+服务</span>
                <span className="px-2 py-1 bg-success/10 text-success rounded">本地专家</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
