import { MapPin, Mountain, Trees, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import type { CityCode } from '@/types';

interface CitySwitcherProps {
  compact?: boolean;
  className?: string;
  onCityChange?: (city: CityCode) => void;
}

const cities: { code: CityCode; name: string; icon: typeof MapPin }[] = [
  { code: 'chengdu', name: '成都', icon: MapPin },
  { code: 'deyang', name: '德阳', icon: Mountain },
  { code: 'meishan', name: '眉山', icon: Trees },
  { code: 'ziyang', name: '资阳', icon: Waves },
];

export default function CitySwitcher({ compact = false, className, onCityChange }: CitySwitcherProps) {
  const { user, updateUserCity } = useUserStore();
  const currentCity = user?.city || 'chengdu';

  const handleCityClick = (code: CityCode) => {
    updateUserCity(code);
    onCityChange?.(code);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200',
        compact ? 'gap-0.5' : 'gap-1',
        className
      )}
      role="tablist"
      aria-label="城市切换"
    >
      {cities.map(({ code, name, icon: Icon }) => {
        const isActive = currentCity === code;
        return (
          <button
            key={code}
            role="tab"
            aria-selected={isActive}
            aria-label={`切换到${name}市`}
            onClick={() => handleCityClick(code)}
            className={cn(
              'relative inline-flex items-center transition-all duration-300 ease-out rounded-full font-medium',
              compact
                ? cn('px-2.5 py-1 text-xs', isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900')
                : cn('px-4 py-2 text-sm', isActive ? 'text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60')
            )}
          >
            {isActive && (
              <span
                className={cn(
                  'absolute inset-0 rounded-full bg-gov-gradient transition-all duration-300 ease-out -z-0',
                  compact ? 'shadow-sm' : 'shadow-gov'
                )}
                aria-hidden="true"
              />
            )}
            <Icon
              className={cn(
                'relative z-10 transition-all duration-300',
                compact ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1.5'
              )}
            />
            <span className="relative z-10 whitespace-nowrap">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
