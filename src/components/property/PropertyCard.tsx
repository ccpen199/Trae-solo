import { useState } from 'react';
import { Heart, GitCompare, Eye, MapPin, BadgeCheck, Building2, Train } from 'lucide-react';
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
  const isVerified = property.verification.antiFraudPassed && property.verification.ownerVerified;

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
              VR
            </span>
          )}
          {hasMetro && (
            <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
              <Train className="w-3 h-3" />
              近地铁
            </span>
          )}
          {hasSchool && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-md flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              学区房
            </span>
          )}
          {isVerified && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" />
              核验通过
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

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span>{formatRooms(property.rooms, property.halls, property.bathrooms)}</span>
          <span className="w-px h-4 bg-gray-200" />
          <span>{formatArea(property.area)}</span>
          <span className="w-px h-4 bg-gray-200" />
          <span>{property.orientation}</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="line-clamp-1">{property.district} · {property.address}</span>
        </div>

        {property.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {property.tags.slice(0, 3).map((tag, index) => (
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
