import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { merchantApi, couponApi, postApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Card, Button, Avatar, Badge, ProgressBar, Tag, EmptyState, Icon } from '../components/ui';
import type { Merchant, Post } from '../types';
import { formatTime, formatCouponDiscount, formatDate, formatDateTime } from '../utils/format';

const merchantIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(14,165,233,0.4);"><span style="transform: rotate(45deg); font-size: 18px;">📍</span></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const MerchantDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<'info' | 'coupons' | 'reviews'>('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        merchantApi.getById(id!),
        postApi.feed({ limit: 20 }),
      ]);
      setMerchant(mRes.merchant);
      setPosts((pRes.posts || []).filter((p: Post) => p.merchantId === id));
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCoupon = async (couponId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await couponApi.claim(couponId);
      alert('🎉 领取成功！可在「我的优惠券」查看');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '领取失败');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="animate-pulse p-0 overflow-hidden">
          <div className="h-48 bg-gray-200" />
          <div className="p-6 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        </Card>
      </div>
    );
  }

  if (!merchant) {
    return <EmptyState icon="🏪" title="商户不存在" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        <Icon name="back" /> 返回商户列表
      </button>

      {/* Hero Card */}
      <Card className="overflow-hidden p-0">
        <div className="h-48 bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="px-6 pb-6 -mt-16 relative">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center text-5xl border-4 border-white">
              🏪
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{merchant.businessName}</h1>
                {merchant.licenseVerified && (
                  <Badge className="bg-green-100 text-green-700">✓ 营业执照已核验</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <Tag>{merchant.category}</Tag>
                <span className="flex items-center gap-1">
                  ⭐ <span className="font-semibold text-yellow-600">{merchant.rating}</span>
                  <span className="text-gray-400">({merchant.reviewCount}条评价)</span>
                </span>
              </div>
            </div>
            {user?.role === 'ADMIN' && (
              <Link to={`/admin/merchant/${merchant.id}`}>
                <Button variant="outline" size="sm">查看分析</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-t border-gray-100">
          <div className="flex gap-1">
            {[
              { v: 'info', l: '商户信息', icon: 'ℹ️' },
              { v: 'coupons', l: `优惠券 (${merchant.coupons?.length || 0})`, icon: '🎫' },
              { v: 'reviews', l: `探店笔记 (${posts.length})`, icon: '📝' },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setTab(t.v as any)}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition-all ${
                  tab === t.v
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.icon} {t.l}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {tab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">商户介绍</h3>
                  <p className="text-gray-700 leading-relaxed">{merchant.description}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl">📍</span>
                    <div>
                      <div className="text-sm text-gray-500">地址</div>
                      <div className="font-medium text-gray-800">{merchant.address}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        坐标：{merchant.latitude.toFixed(6)}, {merchant.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl">📞</span>
                    <div>
                      <div className="text-sm text-gray-500">联系电话</div>
                      <div className="font-medium text-gray-800">{merchant.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl">📅</span>
                    <div>
                      <div className="text-sm text-gray-500">入驻时间</div>
                      <div className="font-medium text-gray-800">{formatDate(merchant.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <Card className="overflow-hidden p-0 h-64">
                <MapContainer
                  center={[merchant.latitude, merchant.longitude]}
                  zoom={16}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <Marker position={[merchant.latitude, merchant.longitude]} icon={merchantIcon}>
                    <Popup>{merchant.businessName}</Popup>
                  </Marker>
                </MapContainer>
              </Card>
            </div>
          )}

          {tab === 'coupons' && (
            <div>
              {merchant.coupons && merchant.coupons.length > 0 ? (
                <div className="space-y-4">
                  {merchant.coupons.map((c) => {
                    const progress = (c.claimedQuantity / c.totalQuantity) * 100;
                    const isExpired = new Date(c.endDate) < new Date();
                    return (
                      <div
                        key={c.id}
                        className={`flex rounded-2xl overflow-hidden border-2 ${
                          isExpired ? 'border-gray-100 opacity-60' : 'border-orange-100'
                        }`}
                      >
                        <div className={`w-32 flex-shrink-0 flex flex-col items-center justify-center text-white ${
                          isExpired
                            ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                            : 'bg-gradient-to-br from-red-500 via-orange-500 to-amber-500'
                        }`}>
                          <div className="text-2xl font-bold">
                            {formatCouponDiscount(c.discountType, c.discountValue)}
                          </div>
                          {c.minSpend > 0 && (
                            <div className="text-xs mt-1 opacity-80">满{c.minSpend}可用</div>
                          )}
                        </div>
                        <div className="flex-1 p-5 bg-gradient-to-r from-orange-50/50 to-white">
                          <h4 className="font-bold text-gray-800 text-lg">{c.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                          <div className="flex items-center justify-between mt-4">
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                有效期：{formatDate(c.startDate)} ~ {formatDate(c.endDate)}
                              </div>
                              <div className="w-48">
                                <ProgressBar value={progress} />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                已领取 {c.claimedQuantity}/{c.totalQuantity}（剩余 {c.totalQuantity - c.claimedQuantity} 张）
                              </div>
                            </div>
                            <Button
                              variant="danger"
                              disabled={isExpired || c.claimedQuantity >= c.totalQuantity}
                              onClick={() => handleClaimCoupon(c.id)}
                            >
                              {isExpired ? '已过期' : c.claimedQuantity >= c.totalQuantity ? '已领完' : '立即领取'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon="🎫" title="暂无优惠券" description="关注商户，第一时间获取优惠信息" />
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <div>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((p) => (
                    <Card
                      key={p.id}
                      className="p-5 hover:shadow-md cursor-pointer transition-all"
                      onClick={() => navigate(`/posts/${p.id}`)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar src={p.user.avatar} name={p.user.nickname} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.user.nickname}</span>
                            {p.hasProof && <Badge className="bg-green-50 text-green-700 text-xs">真实消费</Badge>}
                            {p.isPitfall && <Badge className="bg-red-50 text-red-700 text-xs">避坑提醒</Badge>}
                          </div>
                          <div className="text-xs text-gray-400">{formatTime(p.createdAt)}</div>
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">{p.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">{p.content}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {p.priceAnchor && (
                            <span className="text-orange-600 font-semibold">💰 人均¥{p.priceAnchor}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>👍 {p.likeCount}</span>
                          <span>💬 {p.commentCount}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📝"
                  title="还没有探店笔记"
                  description="来过这家店？分享你的体验吧～"
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MerchantDetailPage;
