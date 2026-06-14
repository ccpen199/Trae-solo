import { useState } from 'react';
import { Heart, GitCompare, Eye, MapPin, BadgeCheck, Building2, Train, Shield, Phone, Award, Clock, FileCheck } from 'lucide-react';
import type { Property } from '@shared/types';
import { formatPrice, formatArea, formatRooms, formatUnitPrice, formatDistance } from '../../utils/format';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  onCompare?: (id: string) => void;
  onClick?: (property: Property) => void;
  isFavorite?: boolean;
  isCompared?: boolean;
}

export const PropertyCard = ({
  property,
  onFavorite,
  onCompare,
  onClick,
  isFavorite = false,
  isCompared = false,
}: PropertyCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const hasVR = !!property.vrUrl;
  const hasMetro = !!property.metroInfo;
  const hasSchool = !!property.schoolDistrict;
  const { ownerVerified, agentVerified, antiFraudPassed, listingDays, decayWeight } = property.verification;
  const isVerified = antiFraudPassed && ownerVerified;
  const isFiveOnly = property.propertyRight.isFiveYears && property.propertyRight.isOnlyOne;
  const rightStatusMap: Record<string, { label: string; color: string }> = {
    normal: { label: '产权清晰', color: 'bg-green-100 text-green-700' },
    mortgaged: { label: '抵押中', color: 'bg-yellow-100 text-yellow-700' },
    sealed: { label: '已查封', color: 'bg-red-100 text-red-700' },
  };

  const handleClick = () => {
    onClick?.(property);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(property.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare?.(property.id);
  };

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={property.images[0] || 'https://picsum.photos/400/300'}
          alt={property.title}
          className={`w-full h-48 object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {hasVR && (
            <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
              <Eye className="w-3 h-3" />
              VR实勘
            </span>
          )}
          {hasMetro && (
            <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
              <Train className="w-3 h-3" />
              {property.metroInfo?.nearestStation.slice(0, 4)}站 {formatDistance(property.metroInfo?.distance || 0)}
            </span>
          )}
          {hasSchool && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-md flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {property.schoolDistrict?.quality === 'key' ? '重点' : ''}{property.schoolDistrict?.name.slice(0, 4)}
            </span>
          )}
          {isFiveOnly && (
            <span className="px-2 py-1 bg-teal-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
              <Shield className="w-3 h-3" />
              满五唯一
            </span>
          )}
          {isVerified && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" />
              真房源
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full transition-all duration-200 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleCompare}
            className={`p-2 rounded-full transition-all duration-200 ${isCompared ? 'bg-blue-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white hover:text-blue-500'}`}
          >
            <GitCompare className="w-4 h-4" />
          </button>
        </div>

        {hasMetro && property.metroInfo && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded-md flex items-center gap-1">
            <Train className="w-3 h-3" />
            {property.metroInfo.nearestStation} {formatDistance(property.metroInfo.distance)}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {property.title}
        </h3>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-red-600">{formatPrice(property.price)}</span>
          <span className="text-sm text-gray-500">{formatUnitPrice(property.unitPrice)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 flex-wrap">
          <span className="px-1.5 py-0.5 bg-gray-100 rounded">{formatRooms(property.rooms, property.halls, property.bathrooms)}</span>
          <span className="px-1.5 py-0.5 bg-gray-100 rounded">{formatArea(property.area)}</span>
          <span className="px-1.5 py-0.5 bg-gray-100 rounded">{property.orientation}</span>
          <span className="px-1.5 py-0.5 bg-gray-100 rounded">{property.decoration}</span>
          <span className={`px-1.5 py-0.5 rounded text-xs ${rightStatusMap[property.propertyRight.status]?.color || 'bg-gray-100 text-gray-600'}`}>
            {rightStatusMap[property.propertyRight.status]?.label || property.propertyRight.type}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="line-clamp-1">{property.district} · {property.address}</span>
        </div>

        <div className={`flex flex-wrap gap-1.5 p-2.5 rounded-lg border ${isVerified ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <div className="flex items-center gap-1" title={ownerVerified ? '业主手机号已直连验证' : '业主手机号待验证'}>
            <Phone className={`w-3 h-3 ${ownerVerified ? 'text-green-500' : 'text-gray-400'}`} />
            <span className={`text-xs ${ownerVerified ? 'text-green-700' : 'text-gray-400'}`}>业主验</span>
          </div>
          <div className="w-px h-3 bg-gray-300 self-center" />
          <div className="flex items-center gap-1" title={agentVerified ? '中介身份已备案' : '中介身份待备案'}>
            <Award className={`w-3 h-3 ${agentVerified ? 'text-blue-500' : 'text-gray-400'}`} />
            <span className={`text-xs ${agentVerified ? 'text-blue-700' : 'text-gray-400'}`}>中介备</span>
          </div>
          <div className="w-px h-3 bg-gray-300 self-center" />
          <div className="flex items-center gap-1" title={antiFraudPassed ? '防虚假算法核验通过' : '防虚假算法核验不通过'}>
            <FileCheck className={`w-3 h-3 ${antiFraudPassed ? 'text-purple-500' : 'text-gray-400'}`} />
            <span className={`text-xs ${antiFraudPassed ? 'text-purple-700' : 'text-gray-400'}`}>反诈验</span>
          </div>
          <div className="w-px h-3 bg-gray-300 self-center" />
          <div className="flex items-center gap-1" title={`挂牌${listingDays}天，时效权重${decayWeight.toFixed(2)}`}>
            <Clock className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-orange-700">挂牌{listingDays}天</span>
            <span className={`text-xs font-medium ${decayWeight >= 0.8 ? 'text-green-600' : decayWeight >= 0.6 ? 'text-orange-600' : 'text-red-600'}`}>
              ·权重{decayWeight.toFixed(2)}
            </span>
          </div>
        </div>

        {property.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {property.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
