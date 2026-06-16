import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { merchantApi, couponApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Card, Button, Avatar, Tag, ProgressBar, Badge, EmptyState } from '../components/ui';
import type { Merchant } from '../types';
import { formatDistance, formatCouponDiscount, getRedemptionRateColor } from '../utils/format';

const customIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: linear-gradient(135deg, #f97316, #ea580c); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(249,115,22,0.4);"><span style="transform: rotate(45deg); font-size: 16px;">🏪</span></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const MerchantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { location, user } = useAuthStore();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);

  const categories = [
    { v: '', l: '全部', icon: '🏪' },
    { v: '餐饮美食', l: '餐饮美食', icon: '🍜' },
    { v: '咖啡饮品', l: '咖啡饮品', icon: '☕' },
    { v: '生鲜超市', l: '生鲜超市', icon: '🛒' },
    { v: '美容美发', l: '美容美发', icon: '💇' },
    { v: '休闲娱乐', l: '休闲娱乐', icon: '🎮' },
    { v: '生活服务', l: '生活服务', icon: '🔧' },
  ];

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      loadMerchants();
    }
  }, [location, category]);

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const res = await merchantApi.nearby({
        latitude: location!.latitude,
        longitude: location!.longitude,
        radius: 5000,
        category: category || undefined,
      });
      setMerchants(res.merchants || []);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCoupon = async (merchantId: string, couponId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await couponApi.claim(couponId);
      alert('领取成功！可在个人中心查看');
      loadMerchants();
    } catch (err: any) {
      alert(err.response?.data?.error || '领取失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🏪</span> 周边商户
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            距离 {location?.locationName || '当前位置'} 5公里范围内 · 共 {merchants.length} 家
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showMap ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            🗺️ {showMap ? '隐藏地图' : '显示地图'}
          </button>
          {user?.role === 'MERCHANT' && (
            <Button onClick={() => navigate('/profile')}>
              📝 我的商户
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/create', { state: { defaultType: 'REVIEW' } })}>
            发布
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((c) => (
          <button
            key={c.v}
            onClick={() => setCategory(c.v)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              category === c.v
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{c.icon}</span>
            {c.l}
          </button>
        ))}
      </div>

      {/* Map */}
      {showMap && merchants.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="h-80 md:h-96">
            <MapContainer
              center={[location?.latitude || 39.9042, location?.longitude || 116.4074]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {merchants.map((m) => (
                <Marker
                  key={m.id}
                  position={[m.latitude, m.longitude]}
                  icon={customIcon}
                >
                  <Popup>
                    <div onClick={() => navigate(`/merchants/${m.id}`)} className="cursor-pointer min-w-40">
                      <div className="font-bold text-gray-800">{m.businessName}</div>
                      <div className="text-xs text-gray-500 mt-1">{m.category}</div>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium">{m.rating}</span>
                        <span className="text-xs text-gray-400 ml-1">({m.reviewCount})</span>
                      </div>
                      <div className="text-xs text-primary-600 mt-2">点击查看详情 →</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>
      )}

      {/* Merchant List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : merchants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {merchants.map((m) => (
            <Card
              key={m.id}
              className="p-5 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/merchants/${m.id}`)}
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-4xl flex-shrink-0 relative">
                  🏪
                  {m.licenseVerified && (
                    <div
                      className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg"
                      title="营业执照已核验"
                    >
                      ✓
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-800 truncate">{m.businessName}</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 rounded-lg flex-shrink-0">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-semibold">{m.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Tag>{m.category}</Tag>
                    {m.licenseVerified && (
                      <Badge className="bg-green-50 text-green-700" title="营业执照已通过官方核验">
                        ✓ 执照核验
                      </Badge>
                    )}
                    {m.distance !== undefined && (
                      <span className="text-xs text-primary-600 font-medium">
                        📍 {formatDistance(m.distance)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                    📍 {m.address}
                  </p>

                  {m.stats && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-2">
                          <div className={`text-lg font-bold ${getRedemptionRateColor(m.stats.redemptionRate)}`}>
                            {m.stats.redemptionRate}%
                          </div>
                          <div className="text-xs text-gray-500">核销率</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-blue-600">
                            {m.stats.postConversionRate}%
                          </div>
                          <div className="text-xs text-gray-500">笔记转化</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-purple-600">
                            {m.stats.reviewCount}
                          </div>
                          <div className="text-xs text-gray-500">真实评价</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <span>📊</span>
                          <span>热度 {m.stats.heatScore}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🎫</span>
                          <span>已发券 {m.stats.totalClaimed} 张</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>✓</span>
                          <span>已核销 {m.stats.totalRedeemed} 张</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-gray-400">
                      {m.reviewCount} 条评价 · {m.coupons?.length || 0} 个优惠
                    </div>
                    <span className="text-primary-600 text-sm font-medium">查看详情 →</span>
                  </div>
                </div>
              </div>

              {/* Coupons Preview */}
              {m.coupons && m.coupons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {m.coupons.slice(0, 2).map((c) => {
                    const progress = (c.claimedQuantity / c.totalQuantity) * 100;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimCoupon(m.id, c.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                            {formatCouponDiscount(c.discountType, c.discountValue)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{c.title}</div>
                            <ProgressBar value={progress} className="w-32 mt-1.5" />
                          </div>
                        </div>
                        <Button size="sm" variant="danger">
                          领取
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🏪"
          title="附近暂无商户"
          description="试试切换分类或扩大搜索范围"
        />
      )}
    </div>
  );
};

export default MerchantsPage;
