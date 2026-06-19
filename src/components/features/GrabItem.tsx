import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, MapPin, Clock, Users, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Consultation, UrgencyLevel } from '@/types';
import { getCategoryLabel, getUrgencyLabel } from '@/utils/format';
import { timeAgo } from '@/utils/date';

interface GrabItemProps {
  consultation: Consultation;
  grabbedCount?: number;
  onGrab?: (consultation: Consultation) => void;
  isRecommended?: boolean;
}

const urgencyStyles: Record<UrgencyLevel, string> = {
  low: 'bg-green-50 text-green-600 border-green-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  high: 'bg-red-50 text-red-600 border-red-200',
};

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function GrabItem({
  consultation,
  grabbedCount = 0,
  onGrab,
  isRecommended = false,
}: GrabItemProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleGrab = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onGrab?.(consultation);
  };

  const summary =
    consultation.description.length > 80
      ? consultation.description.slice(0, 80) + '...'
      : consultation.description;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative rounded-xl border border-primary-100/50 bg-white p-5 shadow-card transition-all duration-300',
        'hover:shadow-card-hover hover:border-accent-gold/40',
        isRecommended && 'border-accent-gold/50 bg-gradient-to-br from-white to-accent-gold/5'
      )}
    >
      {isRecommended && (
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-1 text-xs font-medium text-primary-900 shadow-sm">
          <Sparkles className="h-3 w-3" />
          智能推荐
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="badge bg-primary-50 text-primary-600 border-primary-100 border">
          {getCategoryLabel(consultation.category)}
        </span>
        <span
          className={cn(
            'badge border inline-flex items-center gap-1',
            urgencyStyles[consultation.urgency]
          )}
        >
          <AlertCircle className="h-3 w-3" />
          {getUrgencyLabel(consultation.urgency)}紧急
        </span>
      </div>

      <h3 className="mb-2 font-serif text-lg font-semibold text-primary-800">
        {consultation.title}
      </h3>

      <p className="mb-4 text-sm leading-relaxed text-primary-500 line-clamp-2">
        {summary}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-primary-400">
        {consultation.region && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {consultation.region}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {timeAgo(consultation.createdAt)}发布
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {grabbedCount} 人已抢单
        </span>
      </div>

      <button
        ref={buttonRef}
        onClick={handleGrab}
        className={cn(
          'relative overflow-hidden rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200',
          'bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-md',
          'hover:from-primary-600 hover:to-primary-500 hover:shadow-lg hover:-translate-y-0.5',
          'active:translate-y-0'
        )}
      >
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute h-4 w-4 rounded-full bg-white/50"
            style={{
              left: ripple.x - 8,
              top: ripple.y - 8,
              pointerEvents: 'none',
            }}
          />
        ))}
        <span className="relative inline-flex items-center gap-1.5">
          <Zap className="h-4 w-4" />
          立即抢单
        </span>
      </button>
    </motion.div>
  );
}
