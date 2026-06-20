import React from 'react';
import { cn } from '@/lib/utils';
import {
  UserCheck,
  Calendar,
  FileText,
  Eye,
  MessageSquare,
  Star,
} from 'lucide-react';

export type ActivityType =
  | 'profile'
  | 'casting'
  | 'application'
  | 'view'
  | 'message'
  | 'review';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  color: string;
}

export interface ActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
}

const activityColors: Record<ActivityType, string> = {
  profile: 'bg-gradient-to-r from-rose-500 to-rose-400',
  casting: 'bg-gradient-to-r from-sapphire-500 to-sapphire-400',
  application: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  view: 'bg-gradient-to-r from-amber-500 to-amber-400',
  message: 'bg-gradient-to-r from-purple-500 to-purple-400',
  review: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
};

const defaultIcons: Record<ActivityType, React.ReactNode> = {
  profile: <UserCheck className="w-4 h-4 text-white" />,
  casting: <Calendar className="w-4 h-4 text-white" />,
  application: <FileText className="w-4 h-4 text-white" />,
  view: <Eye className="w-4 h-4 text-white" />,
  message: <MessageSquare className="w-4 h-4 text-white" />,
  review: <Star className="w-4 h-4 text-white" />,
};

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative pl-10 pb-6 last:pb-0">
          {index < activities.length - 1 && (
            <div className="absolute left-[15px] top-8 w-0.5 h-full bg-gradient-to-b from-midnight-600 to-transparent" />
          )}
          <div
            className={cn(
              'absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10',
              activityColors[activity.type] || activity.color
            )}
          >
            {activity.icon || defaultIcons[activity.type]}
          </div>
          <div className="bg-midnight-800/50 rounded-xl p-4 border border-midnight-700/50 hover:border-rose-500/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-medium text-white">{activity.title}</h4>
              <span className="text-xs text-midnight-400 whitespace-nowrap ml-2">
                {activity.time}
              </span>
            </div>
            <p className="text-sm text-midnight-300">{activity.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ActivityTimeline;
