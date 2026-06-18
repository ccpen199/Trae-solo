import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassPanelProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export default function GlassPanel({ children, title, subtitle, actions, className }: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'glass-card glass-card-hover relative overflow-hidden p-6',
        className
      )}
    >
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-gold-400/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-tr from-insurance/10 to-transparent blur-3xl" />

      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gold-100 tracking-wide">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
