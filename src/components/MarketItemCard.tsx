import React from 'react';
import { MapPin, Tag, Clock, Star } from 'lucide-react';
import type { MarketItem } from '@/types';

interface MarketItemCardProps {
  item: MarketItem;
  onClick?: () => void;
}

const conditionLabels: Record<MarketItem['condition'], string> = {
  new: '全新',
  'like-new': '几乎全新',
  good: '成色良好',
  fair: '有使用痕迹',
};

const statusConfig = {
  available: { label: '在售', bg: 'bg-accent-green-100', text: 'text-accent-green-700' },
  sold: { label: '已售出', bg: 'bg-gray-100', text: 'text-gray-500' },
  reserved: { label: '已预定', bg: 'bg-accent-yellow-100', text: 'text-accent-yellow-700' },
};

const transactionStatusConfig: Record<NonNullable<MarketItem['transaction_status']>, { label: string; bg: string; text: string }> = {
  pending_pickup: { label: '待自提', bg: 'bg-accent-yellow-100', text: 'text-accent-yellow-700' },
  pending_payment: { label: '待付款', bg: 'bg-orange-100', text: 'text-orange-700' },
  completed: { label: '已完成', bg: 'bg-accent-green-100', text: 'text-accent-green-700' },
  cancelled: { label: '已取消', bg: 'bg-gray-100', text: 'text-gray-500' },
};

const getCreditColor = (credit: number): string => {
  if (credit >= 90) return 'text-accent-green-600';
  if (credit >= 80) return 'text-accent-yellow-600';
  return 'text-orange-600';
};

const MarketItemCard: React.FC<MarketItemCardProps> = ({ item, onClick }) => {
  const status = statusConfig[item.status];
  const transactionStatus = item.transaction_status ? transactionStatusConfig[item.transaction_status] : null;

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer group hover:-translate-y-1 duration-300 overflow-hidden"
    >
      <div className="relative mb-3 -mx-6 -mt-6">
        <img
          src={item.images?.[0] || `https://picsum.photos/seed/item${item.id}/400/300`}
          alt={item.title}
          className="w-full h-48 object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className={`badge ${status.bg} ${status.text}`}>{status.label}</span>
        </div>
        {transactionStatus && (
          <div className="absolute top-3 right-3">
            <span className={`badge ${transactionStatus.bg} ${transactionStatus.text}`}>
              {transactionStatus.label}
            </span>
          </div>
        )}
        {item.originalPrice && (
          <div className="absolute bottom-3 right-3">
            <span className="badge bg-red-500 text-white">
              省 ¥{item.originalPrice - item.price}
            </span>
          </div>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
        {item.title}
      </h3>
      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-primary-600">¥{item.price}</span>
        {item.originalPrice && (
          <span className="text-sm text-gray-400 line-through">¥{item.originalPrice}</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <Tag className="w-3 h-3" />
        <span className="badge bg-gray-100 text-gray-600">{item.category}</span>
        <span className="badge bg-secondary-100 text-secondary-700">{conditionLabels[item.condition]}</span>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <img
            src={item.sellerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seller}`}
            alt={item.seller}
            className="w-6 h-6 rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-sm text-gray-600">{item.seller}</span>
            {(item.seller_credit !== undefined || item.seller_trades !== undefined) && (
              <div className="flex items-center gap-1">
                {item.seller_credit !== undefined && (
                  <>
                    <Star className={`w-3 h-3 ${getCreditColor(item.seller_credit)} fill-current`} />
                    <span className={`text-xs ${getCreditColor(item.seller_credit)} font-medium`}>
                      {item.seller_credit}分
                    </span>
                  </>
                )}
                {item.seller_trades !== undefined && (
                  <span className="text-xs text-gray-400">
                    成交 {item.seller_trades} 笔
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{item.location}</span>
              {item.pickup_available && (
                <span className="badge bg-accent-blue-100 text-accent-blue-700 ml-1">
                  支持自提
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{item.createdAt}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketItemCard;
