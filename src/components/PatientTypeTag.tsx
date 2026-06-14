import { HeartHandshake, Baby, Activity, Feather } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PATIENT_TYPE_MAP } from '@/utils/constants';
import type { PatientType } from '@/types';

interface PatientTypeTagProps {
  type: PatientType;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const iconMap: Record<PatientType, React.ReactNode> = {
  elderly: <HeartHandshake className="h-3.5 w-3.5" />,
  maternal: <Baby className="h-3.5 w-3.5" />,
  'post-hospital': <Activity className="h-3.5 w-3.5" />,
  hospice: <Feather className="h-3.5 w-3.5" />,
};

export default function PatientTypeTag({
  type,
  showIcon = true,
  size = 'md',
  className,
}: PatientTypeTagProps) {
  const config = PATIENT_TYPE_MAP[type];
  if (!config) return null;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium',
        config.bgColor,
        sizeClasses,
        className
      )}
    >
      {showIcon && iconMap[type]}
      {config.label}
    </span>
  );
}
