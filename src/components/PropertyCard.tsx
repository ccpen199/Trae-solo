import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, MapPin, BedDouble, Bath, Maximize2, Eye, Database, Clock, History, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { Property, PriceChangeLog } from '@/utils/api';
import api, { ApiResponse } from '@/utils/api';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [showErpInfo, setShowErpInfo] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [priceLogs, setPriceLogs] = useState<PriceChangeLog[]>([]);
  const hasVR = property.vrShowroomUrl || property.vrSalesOfficeUrl || property.vrPanoramaUrl || property.vrStreetViewUrl;

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return price.toLocaleString();
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return time.slice(5, 16);
  };

  const loadPriceHistory = async () => {
    if (priceLogs.length > 0) {
      setShowPriceHistory(!showPriceHistory);
      return;
    }
    try {
      const res = await api.get<ApiResponse<PriceChangeLog[]>>(`/properties/${property.id}/price-logs`);
      const result = res?.code !== undefined ? res : res?.data;
      if (result?.code === 200) {
        setPriceLogs(result.data || []);
      }
    } catch (err) {
      console.error('加载价格历史失败:', err);
      setPriceLogs([]);
    }
    setShowPriceHistory(true);
  };

  const calculateDiscountAmount = () => {
    if (property.discount >= 100) return null;
    const originalPrice = property.price / (property.discount / 100);
    return Math.round(originalPrice - property.price);
  };

  const discountAmount = calculateDiscountAmount();

  return (
    <div className="card-hover group">
      <Link to={`/properties/${property.id}`}>
        <div className="relative">
          <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
            <Home className="w-16 h-16 text-primary-700/30" />
          </div>
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <StatusBadge status={property.status} />
            {hasVR && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gold-500/90 text-white">
                <Eye className="w-3 h-3" />
                VR
              </span>
            )}
            {property.erpSyncStatus === 'synced' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white">
                <Database className="w-3 h-3" />
                ERP同步
              </span>
            )}
          </div>
          {property.discount < 100 && (
            <div className="absolute top-3 right-3 bg-danger text-white text-xs font-bold px-2 py-1 rounded">
              {property.discount}折
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/properties/${property.id}`}>
          <h3 className="font-serif font-semibold text-lg text-gray-900 mb-2 group-hover:text-primary-700 transition-colors line-clamp-1">
            {property.projectName}
          </h3>

          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{property.city} {property.district} {property.address}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <BedDouble className="w-4 h-4" />
              <span>{property.bedrooms}室</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms}卫</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize2 className="w-4 h-4" />
              <span>{property.area}㎡</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-2xl font-bold text-gold-600">¥{formatPrice(property.price)}</span>
              <span className="text-sm text-gray-400 ml-1">/总价</span>
              {discountAmount && (
                <div className="text-xs text-danger mt-1">
                  立省 ¥{formatPrice(discountAmount)}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500 text-right">
              <div>{property.orientation} · {property.floor}层</div>
            </div>
          </div>
        </Link>

        {property.promotion && (
          <div className="mt-3 px-3 py-2 bg-gold-50 rounded-lg text-sm text-gold-700">
            <div className="flex items-center gap-1">
              <Tag className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{property.promotion}</span>
            </div>
            {discountAmount && (
              <div className="text-xs text-gold-600 mt-1 pt-1 border-t border-gold-200">
                优惠规则：{property.discount}折优惠，有效期至{new Date(Date.now() + 7 * 86400000).toLocaleDateString()}，需在认购后7日内签约
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowErpInfo(!showErpInfo)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Database className="w-3 h-3" />
            {showErpInfo ? '收起' : 'ERP来源'}
            {showErpInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={loadPriceHistory}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <History className="w-3 h-3" />
            {showPriceHistory ? '收起' : '调价记录'}
            {showPriceHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {showErpInfo && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs">
            <div className="grid grid-cols-2 gap-2 text-gray-700">
              <div>
                <span className="text-gray-500">数据来源：</span>
                <span className="font-medium">{property.erpSource || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">同步状态：</span>
                <span className={`font-medium ${property.erpSyncStatus === 'synced' ? 'text-green-600' : 'text-amber-600'}`}>
                  {property.erpSyncStatus === 'synced' ? '已同步' : '同步中'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">同步时刻：</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(property.erpLastSyncAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">累计同步：</span>
                <span className="font-medium">{property.erpSyncCount || 0}次</span>
              </div>
            </div>
          </div>
        )}

        {showPriceHistory && priceLogs.length > 0 && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg text-xs">
            <div className="text-amber-800 font-medium mb-2">一房一价变更记录</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {priceLogs.slice(0, 3).map((log, index) => (
                <div key={log.id} className="flex items-center justify-between text-amber-900 py-1 border-b border-amber-200 last:border-0">
                  <div>
                    <span className={log.newPrice > log.oldPrice ? 'text-red-600' : 'text-green-600'}>
                      ¥{formatPrice(log.oldPrice)} → ¥{formatPrice(log.newPrice)}
                    </span>
                    <span className="text-amber-600 ml-2">{log.changeReason}</span>
                  </div>
                  <span className="text-amber-500">{formatTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {showPriceHistory && priceLogs.length === 0 && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg text-xs text-amber-800">
            暂无价格变更记录，当前挂牌价以ERP实时销控为准。
          </div>
        )}
      </div>
    </div>
  );
}
