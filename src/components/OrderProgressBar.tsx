import { ClipboardCheck, UserCheck, Car, MapPin, CircleCheckBig } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface OrderProgressBarProps {
  status: OrderStatus;
}

const steps = [
  {
    key: 'accepted' as const,
    label: '已接单',
    icon: ClipboardCheck,
    activeStatuses: ['accepted', 'departing', 'arrived', 'servicing', 'completed'],
  },
  {
    key: 'departing' as const,
    label: '已出发',
    icon: Car,
    activeStatuses: ['departing', 'arrived', 'servicing', 'completed'],
  },
  {
    key: 'arrived' as const,
    label: '已到达',
    icon: MapPin,
    activeStatuses: ['arrived', 'servicing', 'completed'],
  },
  {
    key: 'servicing' as const,
    label: '服务中',
    icon: UserCheck,
    activeStatuses: ['servicing', 'completed'],
  },
  {
    key: 'completed' as const,
    label: '已完成',
    icon: CircleCheckBig,
    activeStatuses: ['completed'],
  },
];

export default function OrderProgressBar({ status }: OrderProgressBarProps) {
  const currentIndex = steps.findIndex((step) => step.activeStatuses.includes(status));

  return (
    <div className="w-full py-6">
      <div className="relative flex justify-between items-start">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full mx-8">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
            style={{
              width: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : '0%',
            }}
          />
        </div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="relative flex flex-col items-center z-10 flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  isActive
                    ? 'bg-primary-500 border-primary-500 shadow-soft'
                    : 'bg-white border-gray-300',
                  isCurrent && 'animate-breathe ring-4 ring-primary-100'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    isActive ? 'text-white' : 'text-gray-400'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-xs mt-2 font-medium text-center whitespace-nowrap',
                  isActive ? 'text-secondary-700' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
