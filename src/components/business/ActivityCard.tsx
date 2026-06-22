import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, Flower2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types';
import Button from '@/components/common/Button';
import Tag from '@/components/common/Tag';
import Badge from '@/components/common/Badge';

interface ActivityCardProps {
  activity: Activity;
  className?: string;
  onRegister?: (id: string) => void;
}

const statusConfig: Record<string, { label: string; variant: 'westlake' | 'honghua' | 'chaojing' | 'neutral' }> = {
  upcoming: { label: '即将开始', variant: 'westlake' },
  ongoing: { label: '进行中', variant: 'honghua' },
  ended: { label: '已结束', variant: 'neutral' },
  cancelled: { label: '已取消', variant: 'neutral' },
};

export default function ActivityCard({ activity, className, onRegister }: ActivityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/activities/${activity.id}`);
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRegister?.(activity.id);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  };

  const progress = (activity.currentParticipants / activity.maxParticipants) * 100;
  const status = statusConfig[activity.status] || statusConfig.upcoming;

  return (
    <motion.div
      className={cn(
        'bg-white rounded-card shadow-card overflow-hidden cursor-pointer',
        className
      )}
      onClick={handleClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative h-44">
        <img
          src={activity.coverImage}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <Tag color="chaojing" size="sm">
            {activity.circle.name}
          </Tag>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-lg line-clamp-1">{activity.title}</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-neutral-500">
            <Calendar className="w-4 h-4 mr-2 text-westlake-500" />
            <span>{formatDate(activity.startTime)}</span>
            <Clock className="w-4 h-4 mx-2 text-neutral-300" />
            <span>至 {formatDate(activity.endTime).split(' ')[1]}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-500">
            <MapPin className="w-4 h-4 mr-2 text-honghua-500" />
            <span className="line-clamp-1">{activity.location}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{activity.currentParticipants}/{activity.maxParticipants}人报名</span>
            </div>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cn(
                'h-full rounded-full',
                progress >= 100 ? 'bg-neutral-400' : 'bg-gradient-to-r from-westlake-500 to-westlake-600'
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <p className="text-sm text-neutral-500 line-clamp-1 mb-1">
              {activity.description}
            </p>
            <div className="flex items-center gap-1 text-xs text-chaojing-600">
              <Flower2 className="w-3 h-3" />
              <span>参与得 <span className="font-semibold">+30</span> 小红花</span>
            </div>
          </div>
          <Button
            variant={activity.isRegistered ? 'outline' : activity.status === 'ended' || activity.status === 'cancelled' ? 'ghost' : 'primary'}
            size="sm"
            disabled={activity.status === 'ended' || activity.status === 'cancelled' || (activity.status === 'upcoming' && activity.currentParticipants >= activity.maxParticipants)}
            onClick={handleRegister}
          >
            {activity.isRegistered
              ? '已报名'
              : activity.status === 'ended'
              ? '已结束'
              : activity.status === 'cancelled'
              ? '已取消'
              : activity.currentParticipants >= activity.maxParticipants
              ? '已满员'
              : '立即报名'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
