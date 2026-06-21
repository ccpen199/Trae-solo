import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Weight, Droplets, Eye, MessageCircle, CheckCircle } from 'lucide-react';
import type { Supply } from '../../../shared/types';
import { useNavigate } from 'react-router-dom';

interface SupplyCardProps {
  supply: Supply;
}

export const SupplyCard: React.FC<SupplyCardProps> = ({ supply }) => {
  const navigate = useNavigate();
  const pricePerTon = Math.round(supply.price / supply.tonnage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">在售中</Badge>;
      case 'sold':
        return <Badge variant="info">已成交</Badge>;
      case 'expired':
        return <Badge variant="default">已过期</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <Card
      hoverable
      onClick={() => navigate(`/supplies/${supply.id}`)}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={supply.images[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=recycling%20scrap%20metal%20pile%20industrial%20warehouse&image_size=square_hd'}
          alt={supply.categoryName}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {supply.certified && (
            <Badge variant="gold" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              认证
            </Badge>
          )}
          {getStatusBadge(supply.status)}
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="info">{supply.categoryName}</Badge>
        </div>
      </div>

      <CardContent className="flex-1 flex flex-col p-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-1">
          {supply.supplierName} - {supply.categoryName}
        </h3>
        
        <div className="text-2xl font-bold text-green-600 mb-3">
          ¥{pricePerTon.toLocaleString()}
          <span className="text-sm font-normal text-slate-500 ml-1">/吨</span>
        </div>

        <div className="space-y-2 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <Weight className="w-4 h-4 text-slate-400" />
            <span>重量: <strong>{supply.tonnage}</strong> 吨</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-slate-400" />
            <span>纯度: <strong>{supply.purity}%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="line-clamp-1">{supply.province} {supply.city} {supply.address}</span>
          </div>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
          {supply.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {supply.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {supply.inquiryCount}
            </span>
          </div>
          <span>{new Date(supply.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};
