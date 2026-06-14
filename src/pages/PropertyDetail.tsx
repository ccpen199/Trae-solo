import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  MapPin,
  Maximize2,
  Calendar,
  Shield,
  GraduationCap,
  Train,
  Building2,
  FileCheck,
  Phone,
  MessageCircle,
  Clock,
  Star,
  Check,
  User,
  Award,
  Eye,
  ArrowRight,
  X,
  Play,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { propertyApi } from '../utils/api';
import { formatPrice, formatUnitPrice, formatArea, formatRooms, formatDate, formatDistance, formatWalkTime, formatPhone, formatListingDays, formatDateTime } from '../utils/format';
import { usePropertyStore } from '../store/usePropertyStore';
import { useUserStore } from '../store/useUserStore';
import type { Property } from '@shared/types';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);

  const { toggleFavorite, favorites, addToCompare, compareList } = usePropertyStore();
  const { isLoggedIn } = useUserStore();

  const isFavorite = id ? favorites.includes(id) : false;
  const isInCompare = id ? compareList.includes(id) : false;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [propertyRes, similarRes] = await Promise.all([
          propertyApi.getPropertyById(id),
          propertyApi.getSimilarProperties(id),
        ]);
        if (propertyRes.success && propertyRes.data) {
          setProperty(propertyRes.data);
          usePropertyStore.getState().setSelectedProperty(id);
        }
        if (similarRes.success && similarRes.data) {
          setSimilarProperties(similarRes.data.slice(0, 4));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddToCompare = () => {
    if (!id) return;
    if (isInCompare) {
      alert('该房源已在对比列表中');
      return;
    }
    if (compareList.length >= 4) {
      alert('最多只能对比4个房源');
      return;
    }
    addToCompare(id);
    alert('已添加到对比列表');
  };

  const handleBookViewing = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    alert('预约看房功能开发中');
  };

  const handleContact = () => {
    if (!property) return;
    alert('请联系经纪人：' + formatPhone(property.agent.phone));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-5 gap-4 h-96">
            <div className="col-span-3 bg-gray-200 rounded-xl" />
            <div className="col-span-2 grid grid-rows-2 gap-4">
              <div className="bg-gray-200 rounded-xl" />
              <div className="bg-gray-200 rounded-xl" />
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded-xl" />
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded-xl" />
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">房源不存在</h1>
        <button onClick={() => navigate('/properties')} className="btn-primary">
          返回列表
        </button>
      </div>
    );
  }

  const favoriteBtnClass = isFavorite
    ? 'w-10 h-10 rounded-lg border flex items-center justify-center transition-colors bg-red-50 border-red-200 text-red-500'
    : 'w-10 h-10 rounded-lg border flex items-center justify-center transition-colors border-gray-200 text-gray-500 hover:bg-gray-50';

  const compareBtnClass = isInCompare
    ? 'w-10 h-10 rounded-lg border flex items-center justify-center transition-colors bg-primary-50 border-primary-200 text-primary-600'
    : 'w-10 h-10 rounded-lg border flex items-center justify-center transition-colors border-gray-200 text-gray-500 hover:bg-gray-50';

  const heartIconClass = isFavorite ? 'w-5 h-5 fill-current' : 'w-5 h-5';

  const ownerVerifiedClass = property.verification.ownerVerified
    ? 'p-4 rounded-xl bg-success-50'
    : 'p-4 rounded-xl bg-gray-50';

  const agentVerifiedClass = property.verification.agentVerified
    ? 'p-4 rounded-xl bg-success-50'
    : 'p-4 rounded-xl bg-gray-50';

  const antiFraudClass = property.verification.antiFraudPassed
    ? 'p-4 rounded-xl bg-success-50'
    : 'p-4 rounded-xl bg-red-50';

  const ownerTextClass = property.verification.ownerVerified
    ? 'w-5 h-5 text-success-600'
    : 'w-5 h-5 text-gray-400';

  const agentTextClass = property.verification.agentVerified
    ? 'w-5 h-5 text-success-600'
    : 'w-5 h-5 text-gray-400';

  const antiFraudTextClass = property.verification.antiFraudPassed
    ? 'w-5 h-5 text-success-600'
    : 'w-5 h-5 text-red-600';

  const ownerTextClass2 = property.verification.ownerVerified
    ? 'text-sm text-success-600'
    : 'text-sm text-gray-400';

  const agentTextClass2 = property.verification.agentVerified
    ? 'text-sm text-success-600'
    : 'text-sm text-gray-400';

  const antiFraudTextClass2 = property.verification.antiFraudPassed
    ? 'text-sm text-success-600'
    : 'text-sm text-red-600';

  const buildYearText = property.buildYear + '年';
  const ownershipYearsText = property.propertyRight.ownershipYears + '年';

  const mortgageUrl = '/tools/mortgage?price=' + property.price;
  const taxUrl = '/tools/tax?price=' + property.price + '&area=' + property.area;

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="w-5 h-5 text-gray-400" />
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );

  const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Image Gallery */}
      <div className="bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-5 gap-2 h-96">
            <div className="col-span-3 relative rounded-xl overflow-hidden">
              <img
                src={property.images[currentImageIndex] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200&h=800'}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              {/* VR Button */}
              <button className="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black/80 transition-colors">
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">VR 看房</span>
              </button>
              {/* Navigation */}
              <button
                onClick={() => setCurrentImageIndex((i) => Math.max(0, i - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={() => setCurrentImageIndex((i) => Math.min(property.images.length - 1, i + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {property.images.length}
              </div>
              {/* View All */}
              <button
                onClick={() => setShowAllImages(true)}
                className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1 hover:bg-black/80 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                查看全部
              </button>
            </div>
            {/* Thumbnails */}
            <div className="col-span-2 grid grid-rows-2 gap-2">
              {property.images.slice(1, 5).map((img, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden">
                  <img
                    src={img}
                    alt={'缩略图' + (idx + 1)}
                    className="w-full h-full object-cover"
                  />
                  {idx === 3 && property.images.length > 5 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold">
                      +{property.images.length - 5}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All Images Modal */}
      {showAllImages && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowAllImages(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-6xl w-full">
            <img
              src={property.images[currentImageIndex]}
              alt={property.title}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={
                    currentImageIndex === idx
                      ? 'flex-shrink-0 w-20 h-16 rounded-lg border-2 border-primary-500 overflow-hidden'
                      : 'flex-shrink-0 w-20 h-16 rounded-lg border-2 border-transparent overflow-hidden'
                  }
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Header */}
            <div className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {property.tags.map((tag, idx) => (
                      <span key={idx} className={
                        tag === 'VR看装修'
                          ? 'badge bg-green-100 text-green-700'
                          : tag === '近地铁'
                          ? 'badge bg-blue-100 text-blue-700'
                          : tag === '学区房'
                          ? 'badge bg-purple-100 text-purple-700'
                          : tag === '满五唯一'
                          ? 'badge bg-orange-100 text-orange-700'
                          : 'badge bg-gray-100 text-gray-700'
                      }>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{property.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{Math.floor(Math.random() * 1000) + 500} 次浏览</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatListingDays(property.verification.listingDays)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => id && toggleFavorite(id)} className={favoriteBtnClass}>
                    <Heart className={heartIconClass} />
                  </button>
                  <button className="w-10 h-10 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button onClick={handleAddToCompare} className={compareBtnClass}>
                    <span className="text-sm font-medium">对比</span>
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-primary-600">{formatPrice(property.price)}</span>
                  {property.type !== 'rent' ? (
                    <span className="text-lg text-gray-400">{formatUnitPrice(property.unitPrice)}</span>
                  ) : (
                    <span className="text-lg text-gray-400">/月</span>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-500">{formatRooms(property.rooms, property.halls, property.bathrooms)}</span>
                  <span className="text-gray-500">{formatArea(property.area)}</span>
                  <span className="text-gray-500">{property.floor}</span>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">基本信息</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoRow icon={Building2} label="户型" value={formatRooms(property.rooms, property.halls, property.bathrooms)} />
                <InfoRow icon={Maximize2} label="建筑面积" value={formatArea(property.area)} />
                <InfoRow icon={Calendar} label="建筑年代" value={buildYearText} />
                <InfoRow icon={Eye} label="产权年限" value={ownershipYearsText} />
                <InfoRow icon={Building2} label="朝向" value={property.orientation} />
                <InfoRow icon={Building2} label="装修" value={property.decoration} />
                <InfoRow icon={Building2} label="楼层" value={property.floor} />
                <InfoRow icon={Building2} label="电梯" value="无" />
              </div>
            </div>

            {/* Property Features */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">房源特色</h3>
              <div className="flex flex-wrap gap-2">
                {property.tags.map((feature, idx) => (
                  <span key={idx} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Property Right Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">产权信息</h3>
              <div className="space-y-1">
                <InfoItem label="产权性质" value={property.propertyRight.type} />
                <InfoItem label="产权年限" value={ownershipYearsText} />
                <InfoItem label="产权状态" value={property.propertyRight.status} />
                <InfoItem label="抵押信息" value={property.propertyRight.status === 'mortgaged' ? '有抵押' : '无抵押'} />
                <InfoItem label="是否满五" value={property.propertyRight.isFiveYears ? '是' : '否'} />
                <InfoItem label="是否唯一" value={property.propertyRight.isOnlyOne ? '是' : '否'} />
              </div>
            </div>

            {/* School & Metro */}
            {(property.schoolDistrict || property.metroInfo) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {property.schoolDistrict && (
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-primary-600" />
                      学区信息
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{property.schoolDistrict.name}</div>
                          <div className="text-xs text-gray-500">{property.schoolDistrict.level === 'primary' ? '小学' : property.schoolDistrict.level === 'middle' ? '中学' : '高中'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{property.schoolDistrict.quality === 'key' ? '重点学校' : '普通学校'}</div>
                          <div className="text-xs text-gray-500">{formatDistance(property.schoolDistrict.distance)}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">{property.schoolDistrict.enrollmentPolicy}</p>
                    </div>
                  </div>
                )}

                {property.metroInfo && (
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Train className="w-5 h-5 text-primary-600" />
                      地铁信息
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{property.metroInfo.line}</div>
                          <div className="text-sm text-gray-600">{property.metroInfo.nearestStation}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 font-medium">{formatDistance(property.metroInfo.distance)}</div>
                          <div className="text-xs text-gray-500">{formatWalkTime(property.metroInfo.walkTime)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verification */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-success-600" />
                核验信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={ownerVerifiedClass}>
                  <div className="flex items-center gap-3 mb-2">
                    <Check className={ownerTextClass} />
                    <span className="font-medium">业主核验</span>
                  </div>
                  <div className={ownerTextClass2}>
                    {property.verification.ownerVerified ? '已核验' : '待核验'}
                  </div>
                </div>
                <div className={agentVerifiedClass}>
                  <div className="flex items-center gap-3 mb-2">
                    <Check className={agentTextClass} />
                    <span className="font-medium">经纪人核验</span>
                  </div>
                  <div className={agentTextClass2}>
                    {property.verification.agentVerified ? '已核验' : '待核验'}
                  </div>
                </div>
                <div className={antiFraudClass}>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className={antiFraudTextClass} />
                    <span className="font-medium">反诈核验</span>
                  </div>
                  <div className={antiFraudTextClass2}>
                    {property.verification.antiFraudPassed ? '已通过' : '待核验'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                核验时间：{formatDateTime(property.verification.verifyTime)}
              </p>
            </div>

            {/* Description */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">房源描述</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {property.description}
              </p>
            </div>

            {/* Map */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                位置地图
              </h3>
              <div className="h-80 rounded-xl overflow-hidden">
                <MapContainer
                  center={[property.lat, property.lng]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[property.lat, property.lng]}>
                    <Popup>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{property.title}</div>
                        <div className="text-sm text-primary-600 font-bold">{formatPrice(property.price)}</div>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            {/* Similar Properties */}
            {similarProperties.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">相似房源</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similarProperties.map((prop) => (
                    <div
                      key={prop.id}
                      onClick={() => navigate('/property/' + prop.id)}
                      className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <img
                        src={prop.images[0]}
                        alt={prop.title}
                        className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{prop.title}</h4>
                        <p className="text-sm text-gray-500">{formatRooms(prop.rooms, prop.halls, prop.bathrooms)} · {formatArea(prop.area)}</p>
                        <p className="text-primary-600 font-bold">{formatPrice(prop.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sticky */}
          <div className="space-y-6">
            {/* Agent Card */}
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">经纪人</h3>
              {property.agent && (
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                    <img
                      src={property.agent.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100'}
                      alt={property.agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{property.agent.name}</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={
                              i < Math.floor(property.agent.rating)
                                ? 'w-3 h-3 fill-yellow-400 text-yellow-400'
                                : 'w-3 h-3 text-gray-300'
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span>
                        <Award className="w-3 h-3 inline mr-1" />
                        {property.agent.dealCount}套成交
                      </span>
                      <span>{property.agent.company}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleContact}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  电话联系
                </button>
                <button
                  onClick={handleBookViewing}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  预约看房
                </button>
                <button className="w-full btn-outline flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  在线咨询
                </button>
              </div>

              {/* Service Guarantee */}
              <div className="mt-6 p-4 bg-green-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  服务保障
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>房源真实</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>底价透明</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>专业服务</span>
                  </div>
                </div>
              </div>

              {/* Tools */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-3">购房工具</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(mortgageUrl)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-gray-700">房贷计算</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => navigate(taxUrl)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-gray-700">税费计算</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={handleAddToCompare}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-gray-700">加入对比</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
