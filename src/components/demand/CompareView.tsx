import { StarRating } from '@/components/ui/StarRating';
import type { ServiceProvider } from '@/types';
import { formatDistance, type MatchResult } from '@/utils/lbs';
import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  FileText,
  Info,
  MapPin,
  Sparkles,
  Tag,
} from 'lucide-react';

interface CompareViewProps {
  matches: MatchResult[];
  onOrderClick: (provider: ServiceProvider) => void;
}

const compareDimensions = [
  { key: 'star', label: '星级', icon: Sparkles },
  { key: 'goodRate', label: '好评率', icon: CheckCircle2 },
  { key: 'response', label: '响应速度', icon: Calendar },
  { key: 'price', label: '起价', icon: Tag },
  { key: 'orders', label: '接单量', icon: FileText },
  { key: 'distance', label: '距离', icon: MapPin },
  { key: 'tags', label: '特色标签', icon: Info },
];

export const CompareView = ({ matches, onOrderClick }: CompareViewProps) => {
  const getValue = (p: ServiceProvider, distance: number, key: string) => {
    switch (key) {
      case 'star':
        return <span className="font-bold text-brand">{p.starLevel} 星</span>;
      case 'goodRate':
        return (
          <span className="font-bold text-mint">
            {(p.goodRate * 100).toFixed(0)}%
          </span>
        );
      case 'response':
        return <span className="font-bold text-brand">{p.responseSpeed}秒</span>;
      case 'price':
        return (
          <span className="font-bold text-accent">
            {p.priceRange.split('-')[0]}
          </span>
        );
      case 'orders':
        return <span className="font-bold text-brand">{p.orderCount}单</span>;
      case 'distance':
        return (
          <span className="font-bold text-brand">{formatDistance(distance)}</span>
        );
      case 'tags':
        return (
          <div className="flex flex-wrap justify-center gap-1">
            {p.reviews[0]?.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 bg-mint/10 text-mint rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        );
      default:
        return '—';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl2 shadow-card border border-warm-card overflow-hidden mb-8"
    >
      <div className="grid grid-cols-4 border-b border-warm-card">
        <div className="p-4 bg-warm-bg/50 text-sm font-medium text-gray-500 flex items-center gap-1">
          <ArrowUpDown size={14} />
          对比维度
        </div>
        {matches.map((m) => (
          <div
            key={m.provider.id}
            className="p-4 text-center border-l border-warm-card"
          >
            <img
              src={m.provider.avatar}
              alt={m.provider.name}
              className="w-12 h-12 rounded-xl mx-auto mb-2 object-cover border-2 border-warm-card"
            />
            <div className="font-bold text-brand text-sm truncate">
              {m.provider.name}
            </div>
            <StarRating rating={m.provider.starLevel} size={12} />
          </div>
        ))}
      </div>

      {compareDimensions.map((dim, i) => (
        <div
          key={dim.key}
          className={`grid grid-cols-4 border-b border-warm-card last:border-b-0 ${
            i % 2 === 0 ? 'bg-warm-bg/30' : ''
          }`}
        >
          <div className="p-3.5 text-sm text-gray-500 flex items-center gap-2">
            <dim.icon size={14} className="text-accent" />
            {dim.label}
          </div>
          {matches.map((m) => (
            <div
              key={m.provider.id}
              className="p-3.5 text-center border-l border-warm-card flex items-center justify-center"
            >
              {getValue(m.provider, m.distance, dim.key)}
            </div>
          ))}
        </div>
      ))}

      <div className="grid grid-cols-4 p-4 bg-warm-bg/50">
        <div />
        {matches.map((m) => (
          <div key={m.provider.id} className="pl-4">
            <button
              onClick={() => onOrderClick(m.provider)}
              className="w-full py-2 rounded-xl2 bg-accent text-white text-sm font-medium hover:bg-accent-600 transition-colors shadow-soft"
            >
              选择此服务商
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
