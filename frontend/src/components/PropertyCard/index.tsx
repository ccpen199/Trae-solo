import { Home, Phone, MapPin, Ruler, Calendar, AlertTriangle, Eye, Edit, Trash2 } from 'lucide-react';
import type { Property } from '@/types';
import { formatPrice, formatArea, formatDate, getPropertyStatusLabel, getPropertyStatusColor, getAuthenticityScoreColor } from '@/utils/format';
import AITagBadge from '../AITagBadge';

interface PropertyCardProps {
  property: Property;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const PropertyCard = ({ property, onView, onEdit, onDelete }: PropertyCardProps) => {
  const hasWarning = property.similarity_warning && property.similarity_warning.length > 0;

  return (
    <div className="card group">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-primary-100 via-primary-50 to-gold-100 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxZTNhOGEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTh2MkgyNHYtMmgxem0wLTZ2MkgyNHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
          <Home className="w-16 h-16 text-primary-400 relative z-10" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`tag ${property.type === 'sale' ? 'tag-primary' : 'tag-gold'}`}>
              {property.type === 'sale' ? '出售' : '出租'}
            </span>
            <span className={`tag ${getPropertyStatusColor(property.status)}`}>
              {getPropertyStatusLabel(property.status)}
            </span>
          </div>
          {hasWarning && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-danger-500 text-white rounded-full text-xs font-medium animate-pulse-soft">
                <AlertTriangle className="w-3 h-3" />
                <span>{property.similarity_warning!.length}条相似</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
              <span className={`text-sm font-bold ${getAuthenticityScoreColor(property.authenticity_score)}`}>
                {property.authenticity_score}
              </span>
              <span className="text-xs text-zinc-500">真实度</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-zinc-800 line-clamp-1 mb-2 group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-primary-700">
            {formatPrice(property.price, property.type)}
          </span>
          <span className="text-sm text-zinc-400">{formatArea(property.area)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-zinc-600">
          <div className="flex items-center gap-1.5">
            <Ruler className="w-4 h-4 text-zinc-400" />
            <span>{property.rooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-zinc-400" />
            <span className="truncate">{property.district}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Home className="w-4 h-4 text-zinc-400" />
            <span>{property.floor}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>{property.year_built}年建</span>
          </div>
        </div>

        <div className="mb-3">
          <AITagBadge tags={property.ai_tags || []} />
        </div>

        {hasWarning && (
          <div className="mb-3 p-3 bg-danger-50 border border-danger-100 rounded-lg">
            <p className="text-xs text-danger-700 font-medium mb-1.5">⚠️ 相似度预警</p>
            {property.similarity_warning!.slice(0, 2).map((item) => (
              <p key={item.id} className="text-xs text-danger-600 line-clamp-1">
                · 相似度{item.similarity}% - {item.title}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Phone className="w-3.5 h-3.5" />
            <span>{property.phone_verified ? '已验证' : '未验证'}</span>
            <span className="mx-1">·</span>
            <span>{formatDate(property.created_at)}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onView?.(property.id)}
              className="p-1.5 text-zinc-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="查看详情"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit?.(property.id)}
              className="p-1.5 text-zinc-500 hover:text-info-600 hover:bg-info-50 rounded-lg transition-colors"
              title="编辑"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(property.id)}
              className="p-1.5 text-zinc-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
