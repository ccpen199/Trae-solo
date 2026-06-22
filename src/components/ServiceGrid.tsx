import {
  FileCheck2,
  CarTaxiFront,
  Stethoscope,
  GraduationCap,
  Home as HomeIcon,
  Users,
  BadgeYen,
  Wallet,
  Trees,
  ClipboardList,
  Building2,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface ServiceItem {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  category: string;
}

export const defaultServices: ServiceItem[] = [
  { id: 'cert', title: '证件办理', icon: FileCheck2, color: 'text-gov-600', bgColor: 'bg-gov-100', category: '政务' },
  { id: 'traffic', title: '交通出行', icon: CarTaxiFront, color: 'text-blue-600', bgColor: 'bg-blue-100', category: '生活' },
  { id: 'health', title: '医疗健康', icon: Stethoscope, color: 'text-rose-600', bgColor: 'bg-rose-100', category: '生活' },
  { id: 'edu', title: '教育服务', icon: GraduationCap, color: 'text-purple-600', bgColor: 'bg-purple-100', category: '生活' },
  { id: 'house', title: '住房服务', icon: HomeIcon, color: 'text-amber-600', bgColor: 'bg-amber-100', category: '政务' },
  { id: 'social', title: '社会保障', icon: Users, color: 'text-teal-600', bgColor: 'bg-teal-100', category: '政务' },
  { id: 'tax', title: '税务服务', icon: BadgeYen, color: 'text-emerald-600', bgColor: 'bg-emerald-100', category: '政务' },
  { id: 'finance', title: '便民缴费', icon: Wallet, color: 'text-warm-600', bgColor: 'bg-warm-100', category: '生活' },
  { id: 'env', title: '环境保护', icon: Trees, color: 'text-green-600', bgColor: 'bg-green-100', category: '生活' },
  { id: 'work', title: '劳动就业', icon: Building2, color: 'text-indigo-600', bgColor: 'bg-indigo-100', category: '政务' },
  { id: 'report', title: '投诉建议', icon: ClipboardList, color: 'text-orange-600', bgColor: 'bg-orange-100', category: '互动' },
  { id: 'more', title: '全部服务', icon: MoreHorizontal, color: 'text-gray-600', bgColor: 'bg-gray-100', category: '其他' },
];

interface ServiceGridProps {
  services?: ServiceItem[];
  columns?: number;
  onServiceClick?: (service: ServiceItem) => void;
  className?: string;
}

export default function ServiceGrid({
  services = defaultServices,
  columns = 4,
  onServiceClick,
  className,
}: ServiceGridProps) {
  const navigate = useNavigate();

  const handleClick = (service: ServiceItem) => {
    if (onServiceClick) {
      onServiceClick(service);
    } else if (service.id === 'more') {
      navigate('/services');
    } else if (service.id === 'report') {
      navigate('/workorders/submit');
    } else {
      navigate('/services');
    }
  };

  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-3 md:gap-4', gridCols[columns as keyof typeof gridCols] || 'grid-cols-4', className)}>
      {services.map((service, idx) => {
        const Icon = service.icon;
        return (
          <button
            key={service.id}
            onClick={() => handleClick(service)}
            className="group flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl hover:bg-gov-50/70 transition-all duration-200 hover:-translate-y-0.5"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div
              className={cn(
                'w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center',
                service.bgColor,
                'group-hover:scale-110 transition-transform duration-300',
                'shadow-sm',
              )}
            >
              <Icon className={cn('w-6 h-6 md:w-7 md:h-7', service.color)} />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-700 text-center leading-tight">
              {service.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
