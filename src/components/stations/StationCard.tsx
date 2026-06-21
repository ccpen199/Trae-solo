import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  MapPin, Phone, Star, Navigation, CheckCircle, 
  Package, CircleDot
} from 'lucide-react';
import type { Station } from '../../../shared/types';
import { useNavigate } from 'react-router-dom';

interface StationCardProps {
  station: Station;
}

export const StationCard: React.FC<StationCardProps> = ({ station }) => {
  const navigate = useNavigate();

  const validCerts = station.certifications.filter(c => c.status === 'valid');
  const hasValidCerts = validCerts.length > 0;

  return (
    <Card
      hoverable
      onClick={() => navigate(`/stations/${station.id}`)}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={station.coverImage || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=recycling%20station%20warehouse%20industrial%20building&image_size=square_hd'}
          alt={station.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          {hasValidCerts && (
            <Badge variant="gold" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              资质认证
            </Badge>
          )}
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{station.name}</h3>
          <div className="flex items-center gap-1 text-yellow-400 text-sm">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold">{station.rating.toFixed(1)}</span>
            <span className="text-white/70 ml-1">({station.dealCount}笔交易)</span>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 flex flex-col p-4">
        <div className="space-y-2.5 mb-4 flex-1">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{station.province} {station.city} {station.address}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Navigation className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>服务半径: <strong className="text-green-600">{station.serviceRadius}</strong> 公里</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{station.phone}</span>
          </div>

          {hasValidCerts && (
            <div className="flex items-center gap-2 text-sm">
              <CircleDot className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-slate-600">已上传资质: </span>
              <div className="flex gap-1 flex-wrap">
                {validCerts.slice(0, 3).map((cert) => (
                  <Badge key={cert.id} variant="info" size="sm">
                    {cert.typeName}
                  </Badge>
                ))}
                {validCerts.length > 3 && (
                  <Badge variant="default" size="sm">+{validCerts.length - 3}</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
          {station.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Package className="w-3.5 h-3.5" />
            <span>入驻 {new Date(station.createdAt).toLocaleDateString()}</span>
          </div>
          <Badge variant="success">在线</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
