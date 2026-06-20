import React from 'react';
import { Phone, Mail, Users, Calendar, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContactType } from '@/store/useAgencyStore';

export interface ContactRecordItemProps {
  id: string;
  date: string;
  contactType: ContactType;
  artistName: string;
  teamMemberName: string;
  notes: string;
  followUpDate?: string;
  onClick?: () => void;
  className?: string;
}

const contactTypeConfig: Record<ContactType, {
  label: string;
  icon: React.ReactNode;
  gradient: string;
  badgeClass: string;
}> = {
  call: {
    label: '电话',
    icon: <Phone className="w-4 h-4 text-white" />,
    gradient: 'from-emerald-500 to-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  email: {
    label: '邮件',
    icon: <Mail className="w-4 h-4 text-white" />,
    gradient: 'from-sapphire-500 to-sapphire-400',
    badgeClass: 'bg-sapphire-500/15 text-sapphire-300 border-sapphire-500/30',
  },
  meeting: {
    label: '会议',
    icon: <Users className="w-4 h-4 text-white" />,
    gradient: 'from-purple-500 to-purple-400',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  audition: {
    label: '试镜',
    icon: <Calendar className="w-4 h-4 text-white" />,
    gradient: 'from-rose-500 to-rose-400',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
};

export function ContactRecordItem({
  date,
  contactType,
  artistName,
  teamMemberName,
  notes,
  followUpDate,
  onClick,
  className,
}: ContactRecordItemProps) {
  const config = contactTypeConfig[contactType];

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative pl-14 pb-6 last:pb-0 cursor-pointer group',
        className
      )}
    >
      <div className="absolute left-[15px] top-8 w-0.5 h-full bg-gradient-to-b from-midnight-600 to-transparent group-last:hidden" />
      <div
        className={cn(
          'absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10 bg-gradient-to-r shadow-lg',
          config.gradient
        )}
      >
        {config.icon}
      </div>

      <div className="bg-midnight-800/50 rounded-xl p-4 border border-midnight-700/50 hover:border-rose-500/30 transition-all duration-300 group-hover:bg-midnight-700/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', config.badgeClass)}>
              {config.label}
            </span>
            <span className="text-xs text-midnight-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {date}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-midnight-500 group-hover:text-rose-400 transition-colors" />
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-midnight-400">艺人:</span>
            <span className="text-sm font-medium text-white">{artistName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-midnight-400">联系人:</span>
            <span className="text-sm font-medium text-midnight-200">{teamMemberName}</span>
          </div>
        </div>

        <p className="text-sm text-midnight-300 leading-relaxed mb-3">{notes}</p>

        {followUpDate && (
          <div className="flex items-center gap-2 pt-3 border-t border-midnight-700/50">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              跟进日期: {followUpDate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactRecordItem;
