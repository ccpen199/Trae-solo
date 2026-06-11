import { Link } from 'react-router-dom';
import { Star, MapPin, CheckCircle } from 'lucide-react';
import { ProviderProfile, LEVEL_MAP, CATEGORY_MAP } from '../types';

export default function ProviderCard({ provider }: { provider: ProviderProfile }) {
  return (
    <Link to={`/providers/${provider.id}`} className="card block hover:border-primary/30">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center text-primary font-bold text-lg shrink-0">
          {(provider.name || provider.real_name || '?').charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 truncate">
              {provider.name || provider.real_name}
            </h3>
            {provider.verified && <CheckCircle size={16} className="text-success shrink-0" />}
            <span className="text-xs px-2 py-0.5 rounded-lg bg-accent/10 text-accent font-medium">
              {LEVEL_MAP[provider.level] || provider.level}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Star size={14} className="text-warning fill-warning" />
            <span>{provider.rating.toFixed(1)}</span>
            <span>·</span>
            <span>{provider.total_orders}单</span>
            <span>·</span>
            <span>完成率{provider.completion_rate}%</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(provider.service_categories || []).slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md"
              >
                {CATEGORY_MAP[cat] || cat}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-accent">
              ¥{provider.price_min}-{provider.price_max}
            </span>
            {provider.location && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={12} />
                {provider.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
