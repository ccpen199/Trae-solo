import { Sparkles, Baby, ChefHat, Check, ShoppingCart, Clock, Tag } from 'lucide-react';
import type { ServicePackage, ServiceType } from '@/types';
import { cn } from '@/lib/utils';

interface PackageCardProps {
  pkg: ServicePackage;
  onPurchase?: (pkg: ServicePackage) => void;
  featured?: boolean;
}

const iconMap: Record<ServiceType, typeof Sparkles> = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

const gradientMap: Record<ServiceType, string> = {
  cleaning: 'from-orange-400 to-primary-500',
  babysitting: 'from-pink-400 to-rose-500',
  cooking: 'from-amber-400 to-orange-500',
};

export default function PackageCard({ pkg, onPurchase, featured }: PackageCardProps) {
  const primaryType = pkg.service_types[0];
  const Icon = iconMap[primaryType];
  const discount = Math.round((1 - pkg.price / pkg.original_price) * 100);

  return (
    <div
      className={cn(
        'card-hover p-6 relative overflow-hidden group',
        featured && 'ring-2 ring-primary-500 ring-offset-2'
      )}
    >
      {featured && (
        <div className="absolute top-4 right-4">
          <span className="badge bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            热门推荐
          </span>
        </div>
      )}

      {discount > 0 && (
        <div className="absolute -left-1 top-6">
          <div className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-r-lg shadow-soft">
            省 {discount}%
          </div>
        </div>
      )}

      <div className={cn('absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-10 blur-2xl bg-gradient-to-br', gradientMap[primaryType])} />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br', gradientMap[primaryType], 'shadow-soft')}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-1 text-secondary-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>有效期 {pkg.valid_days} 天</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-secondary-800 mb-1">{pkg.name}</h3>
          <p className="text-sm text-secondary-500 leading-relaxed">{pkg.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {pkg.service_type_labels.map((label) => (
            <span
              key={label}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-50 text-secondary-600 border border-secondary-100"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          {pkg.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-secondary-600">
              <div className="w-5 h-5 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-primary-500" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between pt-4 border-t border-gray-100">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary-600">¥{pkg.price.toLocaleString()}</span>
              <span className="text-sm text-secondary-400 line-through">¥{pkg.original_price.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-secondary-500 mt-0.5">
              <Tag className="w-3 h-3" />
              <span>企业专享价</span>
            </div>
          </div>
          <button
            onClick={() => onPurchase?.(pkg)}
            className="btn-primary flex items-center gap-2 !py-2.5 !px-5 text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            立即采购
          </button>
        </div>
      </div>
    </div>
  );
}
