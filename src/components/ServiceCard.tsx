import { Sparkles, Baby, ChefHat, ArrowRight } from 'lucide-react';
import type { ServiceType } from '@/types';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  type: ServiceType;
  label: string;
  description: string;
  price: number;
  selected?: boolean;
  onClick?: () => void;
}

const iconMap = {
  cleaning: Sparkles,
  babysitting: Baby,
  cooking: ChefHat,
};

const gradientMap = {
  cleaning: 'from-orange-400 to-primary-500',
  babysitting: 'from-pink-400 to-rose-500',
  cooking: 'from-amber-400 to-orange-500',
};

const bgMap = {
  cleaning: 'bg-orange-50',
  babysitting: 'bg-pink-50',
  cooking: 'bg-amber-50',
};

export default function ServiceCard({
  type,
  label,
  description,
  price,
  selected,
  onClick,
}: ServiceCardProps) {
  const Icon = iconMap[type];

  return (
    <button
      onClick={onClick}
      className={cn(
        'card-hover p-5 text-left w-full group relative overflow-hidden',
        selected && 'ring-2 ring-primary-500 ring-offset-2'
      )}
    >
      <div className={cn('absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 blur-xl bg-gradient-to-br', gradientMap[type])} />

      <div className="relative space-y-4">
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br', gradientMap[type], 'shadow-soft')}>
          <Icon className="w-7 h-7 text-white" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-secondary-800 mb-1">{label}</h3>
          <p className="text-sm text-secondary-500 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-2xl font-bold text-primary-600">¥{price}</span>
            <span className="text-sm text-secondary-500 ml-1">/小时</span>
          </div>
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
            selected ? 'bg-primary-500 text-white' : bgMap[type],
            'group-hover:bg-primary-500 group-hover:text-white'
          )}>
            <ArrowRight className={cn('w-5 h-5 transition-transform duration-300', 'group-hover:translate-x-0.5')} />
          </div>
        </div>
      </div>
    </button>
  );
}
