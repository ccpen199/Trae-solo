import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Bus, Film, Briefcase, Building2, Heart, HandCoins, Car, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  color: 'westlake' | 'honghua' | 'chaojing';
}

interface ServiceCardProps {
  service: ServiceItem;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  bus: Bus,
  film: Film,
  briefcase: Briefcase,
  building: Building2,
  heart: Heart,
  coins: HandCoins,
  car: Car,
  ticket: Ticket,
};

const colorClasses: Record<string, string> = {
  westlake: 'bg-westlake-50 hover:bg-westlake-100',
  honghua: 'bg-honghua-50 hover:bg-honghua-100',
  chaojing: 'bg-chaojing-50 hover:bg-chaojing-100',
};

const iconColorClasses: Record<string, string> = {
  westlake: 'text-westlake-500',
  honghua: 'text-honghua-500',
  chaojing: 'text-chaojing-500',
};

const iconBgClasses: Record<string, string> = {
  westlake: 'bg-westlake-100',
  honghua: 'bg-honghua-100',
  chaojing: 'bg-chaojing-100',
};

export default function ServiceCard({ service, className }: ServiceCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(service.path);
  };

  const IconComponent = iconMap[service.icon] || Briefcase;

  return (
    <motion.div
      className={cn(
        'rounded-card p-4 cursor-pointer transition-all duration-300',
        colorClasses[service.color],
        className
      )}
      onClick={handleClick}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            iconBgClasses[service.color]
          )}
          whileHover={{ rotate: 5 }}
        >
          <IconComponent className={cn('w-6 h-6', iconColorClasses[service.color])} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-neutral-800 mb-1">{service.name}</h4>
          <p className="text-xs text-neutral-500 line-clamp-2">{service.description}</p>
        </div>

        <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
      </div>
    </motion.div>
  );
}
