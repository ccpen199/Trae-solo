import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Phone, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import type { Hospital } from '@shared/types';

interface HospitalCardProps {
  hospital: Hospital;
  compact?: boolean;
}

export default function HospitalCard({ hospital, compact }: HospitalCardProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/hospitals/${hospital.id}`)}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-cream-50 transition-colors text-left border border-forest-50"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-forest-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-gray-900 truncate">{hospital.name}</p>
            {hospital.verified && <CheckCircle2 className="w-4 h-4 text-forest-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-gray-500 truncate">{hospital.address}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>
    );
  }

  return (
    <div
      onClick={() => navigate(`/hospitals/${hospital.id}`)}
      className="card cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-10 h-10 text-forest-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-gray-900 truncate">{hospital.name}</h3>
            {hospital.verified && <CheckCircle2 className="w-4 h-4 text-forest-500 flex-shrink-0" />}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-warm-400 fill-warm-400" />
              <span className="font-semibold text-gray-900">{hospital.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({hospital.reviewCount}条评价)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{hospital.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{hospital.businessHours}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{hospital.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {hospital.services.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-forest-50">
          {hospital.services.slice(0, 4).map((service) => (
            <span key={service.id} className="tag tag-green">
              {service.name}
            </span>
          ))}
          {hospital.services.length > 4 && (
            <span className="tag tag-gray">+{hospital.services.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}
