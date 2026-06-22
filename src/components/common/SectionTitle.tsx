import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export default function SectionTitle({
  title,
  subtitle,
  align = 'left',
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'space-y-2',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      <div className={cn(
        'flex items-center gap-3',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end'
      )}>
        <span className="h-8 w-1 bg-gradient-brand rounded-full" />
        <h2 className="font-display font-semibold text-2xl md:text-3xl text-paper-900">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className={cn(
          'text-paper-500 text-sm md:text-base',
          align === 'center' && 'max-w-2xl mx-auto',
          'pl-4',
          align === 'center' && 'pl-0',
          align === 'right' && 'pl-0 pr-4'
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
