import { cn } from '@/lib/utils';

type GlassCardPadding = 'sm' | 'md' | 'lg';
type GlowColor = 'amber' | 'mint' | 'coral' | 'purple' | 'sky';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: GlassCardPadding;
  glow?: GlowColor;
  hoverable?: boolean;
  children: React.ReactNode;
}

const paddingMap: Record<GlassCardPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const glowMap: Record<GlowColor, string> = {
  amber: 'shadow-glow hover:shadow-glow-md',
  mint: 'shadow-glow-mint',
  coral: 'shadow-glow-coral',
  purple: 'shadow-glow-purple',
  sky: 'shadow-glow-sky',
};

interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface GlassCardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface GlassCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Header({ children, className, ...props }: GlassCardHeaderProps) {
  return (
    <div
      className={cn('border-b border-deep-sea-light/30 pb-4 mb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function Body({ children, className, ...props }: GlassCardBodyProps) {
  return (
    <div className={cn('flex-1', className)} {...props}>
      {children}
    </div>
  );
}

function Footer({ children, className, ...props }: GlassCardFooterProps) {
  return (
    <div
      className={cn('border-t border-deep-sea-light/30 pt-4 mt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default function GlassCard({
  children,
  padding = 'md',
  glow,
  hoverable = false,
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-card flex flex-col transition-all duration-300',
        paddingMap[padding],
        glow && glowMap[glow],
        hoverable &&
          'hover:-translate-y-1 hover:border-deep-sea-light/50 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

GlassCard.Header = Header;
GlassCard.Body = Body;
GlassCard.Footer = Footer;
