import { CircleDashed, UserRoundCheck, ClipboardCheck, Car, MapPin, Sparkles, CircleCheckBig, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface OrderProgressBarProps {
  status: OrderStatus;
  orderCreatedAt?: string;
}

const steps = [
  {
    key: 'pending' as const,
    label: '待派单',
    icon: CircleDashed,
    desc: '匹配1km内阿姨',
    activeStatuses: ['pending'],
    doneStatuses: ['assigned', 'accepted', 'departing', 'arrived', 'servicing', 'completed', 'compensated'],
  },
  {
    key: 'assigned' as const,
    label: '已派单',
    icon: UserRoundCheck,
    desc: '等待阿姨接单',
    activeStatuses: ['assigned'],
    doneStatuses: ['accepted', 'departing', 'arrived', 'servicing', 'completed', 'compensated'],
  },
  {
    key: 'accepted' as const,
    label: '已接单',
    icon: ClipboardCheck,
    desc: '阿姨确认接单',
    activeStatuses: ['accepted'],
    doneStatuses: ['departing', 'arrived', 'servicing', 'completed', 'compensated'],
  },
  {
    key: 'departing' as const,
    label: '已出发',
    icon: Car,
    desc: '阿姨正在赶来',
    activeStatuses: ['departing'],
    doneStatuses: ['arrived', 'servicing', 'completed', 'compensated'],
  },
  {
    key: 'arrived' as const,
    label: '已到达',
    icon: MapPin,
    desc: '阿姨已到门口',
    activeStatuses: ['arrived'],
    doneStatuses: ['servicing', 'completed', 'compensated'],
  },
  {
    key: 'servicing' as const,
    label: '服务中',
    icon: Sparkles,
    desc: '服务正在进行',
    activeStatuses: ['servicing'],
    doneStatuses: ['completed', 'compensated'],
  },
  {
    key: 'completed' as const,
    label: '已完成',
    icon: CircleCheckBig,
    desc: '服务顺利完成',
    activeStatuses: ['completed', 'compensated'],
    doneStatuses: [] as OrderStatus[],
  },
];

const statusLabels: Partial<Record<OrderStatus, string>> = {
  pending: '正在基于位置热力图为您匹配1km内评分最高的阿姨...',
  assigned: '已为您找到合适的阿姨，等待阿姨接单确认',
  accepted: '阿姨已确认接单，请保持手机畅通',
  departing: '阿姨已从服务点出发，正在赶来',
  arrived: '阿姨已到达服务地址，准备开始服务',
  servicing: '服务正在进行中，预计按时完成',
  completed: '服务已完成，感谢您的信任与支持',
  cancelled: '订单已取消',
  compensated: '服务已完成，赔付已到账',
};

export default function OrderProgressBar({ status, orderCreatedAt }: OrderProgressBarProps) {
  const isActive = (stepKey: OrderStatus) =>
    steps.find((s) => s.key === stepKey)?.activeStatuses.includes(status);
  const isDone = (stepKey: OrderStatus) =>
    steps.find((s) => s.key === stepKey)?.doneStatuses.includes(status);

  const activeStepIndex = steps.findIndex((s) => s.activeStatuses.includes(status));
  const doneCount = steps.findIndex((s) => s.activeStatuses.includes(status));

  const progressPct = status === 'cancelled' ? 0 :
    status === 'completed' || status === 'compensated' ? 100 :
    Math.max(0, (doneCount / (steps.length - 1)) * 100);

  return (
    <div className="w-full">
      <div className="mb-4 p-3 rounded-xl bg-primary-50 border border-primary-100">
        <p className="text-sm font-medium text-primary-700">
          {statusLabels[status] || '订单处理中'}
        </p>
        {orderCreatedAt && (
          <p className="text-xs text-primary-600 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            下单时间：{orderCreatedAt}
          </p>
        )}
      </div>

      <div className="relative py-4">
        <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full mx-8">
          <div
            className="h-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="relative flex justify-between items-start">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const done = isDone(step.key);
            const active = isActive(step.key);

            return (
              <div
                key={step.key}
                className="relative flex flex-col items-center z-10 flex-1"
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    done && 'bg-primary-500 border-primary-500 shadow-soft',
                    active && 'bg-white border-primary-500 shadow-soft animate-breathe ring-4 ring-primary-100',
                    !done && !active && 'bg-white border-gray-300',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      done ? 'text-white' : active ? 'text-primary-500' : 'text-gray-400',
                    )}
                  />
                </div>
                <div className="mt-2 text-center px-1">
                  <p
                    className={cn(
                      'text-xs font-medium whitespace-nowrap',
                      (done || active) ? 'text-secondary-700' : 'text-gray-400',
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] mt-0.5 leading-tight',
                      active ? 'text-primary-600' : 'text-gray-400',
                    )}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeStepIndex >= 0 && activeStepIndex < steps.length - 1 && (
        <div className="mt-2 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs text-secondary-500">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            当前进度：第 {activeStepIndex + 1} / {steps.length} 步
          </span>
        </div>
      )}
    </div>
  );
}
