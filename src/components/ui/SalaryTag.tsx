import { cn } from '@/lib/utils';

interface Props {
  min: number;
  max: number;
  className?: string;
}

export default function SalaryTag({ min, max, className }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center font-bold text-accent-500',
      className || 'text-lg'
    )}>
      ¥{min.toLocaleString()}-{max.toLocaleString()}
      <span className="text-xs font-normal text-gray-400 ml-1">/月</span>
    </span>
  );
}
