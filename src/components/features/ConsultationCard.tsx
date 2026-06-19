import { motion } from 'framer-motion';
import { AlertCircle, Clock, User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Consultation, ConsultationStatus, UrgencyLevel } from '@/types';
import { getCategoryLabel, getStatusLabel, getUrgencyLabel } from '@/utils/format';
import { timeAgo } from '@/utils/date';

interface ConsultationCardProps {
  consultation: Consultation;
  hasUnread?: boolean;
  lastMessageTime?: string;
  lawyerName?: string;
  onClick?: (consultation: Consultation) => void;
}

const statusStyles: Record<ConsultationStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  matched: 'bg-blue-100 text-blue-700 border-blue-200',
  chatting: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
  reviewed: 'bg-primary-100 text-primary-700 border-primary-200',
};

const urgencyStyles: Record<UrgencyLevel, string> = {
  low: 'bg-green-50 text-green-600 border-green-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  high: 'bg-red-50 text-red-600 border-red-200',
};

export default function ConsultationCard({
  consultation,
  hasUnread = false,
  lastMessageTime,
  lawyerName,
  onClick,
}: ConsultationCardProps) {
  const summary =
    consultation.description.length > 60
      ? consultation.description.slice(0, 60) + '...'
      : consultation.description;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick?.(consultation)}
      className={cn(
        'group relative cursor-pointer rounded-xl border border-primary-100/50 bg-white p-5 shadow-card transition-all duration-300',
        'hover:shadow-card-hover hover:border-accent-gold/40'
      )}
    >
      {hasUnread && (
        <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={cn('badge border', statusStyles[consultation.status])}>
          {getStatusLabel(consultation.status)}
        </span>
        <span
          className={cn(
            'badge border inline-flex items-center gap-1',
            urgencyStyles[consultation.urgency]
          )}
        >
          <AlertCircle className="h-3 w-3" />
          紧急度 {getUrgencyLabel(consultation.urgency)}
        </span>
      </div>

      <h3 className="mb-2 font-serif text-lg font-semibold text-primary-800 line-clamp-1 group-hover:text-primary-900">
        {consultation.title}
      </h3>

      <p className="mb-4 text-sm text-primary-500 line-clamp-2">{summary}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-primary-400">
        <span className="inline-flex items-center gap-1">
          <span className="badge bg-primary-50 text-primary-600 border-primary-100 border">
            {getCategoryLabel(consultation.category)}
          </span>
        </span>

        {consultation.region && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {consultation.region}
          </span>
        )}

        {lawyerName && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {lawyerName}
          </span>
        )}

        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {lastMessageTime ? timeAgo(lastMessageTime) : timeAgo(consultation.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
