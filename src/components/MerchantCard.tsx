import React from 'react';
import { Star, MapPin, Clock, Phone, ChevronRight } from 'lucide-react';
import type { Merchant } from '@/types';

interface MerchantCardProps {
  merchant: Merchant;
  onClick?: () => void;
}

const MerchantCard: React.FC<MerchantCardProps> = ({ merchant, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer group hover:-translate-y-1 duration-300"
    >
      <div className="flex gap-4">
        <img
          src={merchant.image || `https://picsum.photos/seed/merchant${merchant.id}/200/200`}
          alt={merchant.name}
          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                {merchant.name}
              </h3>
              <span className="inline-block badge bg-secondary-100 text-secondary-700 text-xs">
                {merchant.category}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-accent-yellow-500 fill-current" />
              <span className="font-semibold text-gray-900">{merchant.rating}</span>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{merchant.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{merchant.businessHours}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{merchant.phone}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-xs font-medium ${merchant.isOpen ? 'text-accent-green-600' : 'text-gray-400'}`}>
              {merchant.isOpen ? '营业中' : '已打烊'}
            </span>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantCard;
