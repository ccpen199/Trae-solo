import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Gift, Search, CheckCircle, Eye } from 'lucide-react';
import type { LostPetTask } from '@shared/types';
import { cn } from '@/lib/utils';

interface LostPetCardProps {
  task: LostPetTask;
}

const statusConfig = {
  searching: { label: '寻找中', className: 'tag-orange', Icon: Search },
  found: { label: '已找到', className: 'tag-green', Icon: CheckCircle },
  closed: { label: '已关闭', className: 'tag-gray', Icon: Eye },
};

export default function LostPetCard({ task }: LostPetCardProps) {
  const navigate = useNavigate();
  const config = statusConfig[task.status];
  const StatusIcon = config.Icon;

  return (
    <div
      onClick={() => navigate(`/lost-pet/${task.id}`)}
      className="card cursor-pointer group overflow-hidden p-0"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-warm-50 to-warm-100 flex items-center justify-center relative">
        <Search className="w-16 h-16 text-warm-300" />
        <div className="absolute top-3 left-3">
          <span className={cn('tag', config.className, 'flex items-center gap-1')}>
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
        {task.reward > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-warm-400 text-white text-sm font-bold shadow-soft">
            <Gift className="w-3.5 h-3.5" />
            ¥{task.reward}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-display font-bold text-lg text-gray-900">{task.petName}</h3>
          <span className="tag tag-gray">{task.species}</span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-forest-500" />
            <span className="truncate">{task.lastSeenLocation.address}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 text-forest-500" />
            <span>
              最后出现: {new Date(task.lastSeenTime).toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-forest-50">
          <span className="text-xs text-gray-500">
            {task.clues.length} 条线索
          </span>
          <span className="text-xs text-gray-500">
            {task.adoptionIntents.length} 位好心人关注
          </span>
          <span className="ml-auto text-xs font-medium text-forest-600 group-hover:text-forest-500 transition-colors">
            查看详情 →
          </span>
        </div>
      </div>
    </div>
  );
}
