import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import { Task, CATEGORY_MAP, TASK_STATUS_MAP } from '../types';
import StatusBadge from './StatusBadge';

export default function TaskCard({ task }: { task: Task }) {
  return (
    <Link to={`/tasks/${task.id}`} className="card block hover:border-primary/30">
      <div className="flex items-start justify-between mb-3">
        <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-lg">
          {CATEGORY_MAP[task.category] || task.category}
        </span>
        <StatusBadge status={task.status} />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2">{task.title}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{task.description}</p>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <DollarSign size={14} className="text-accent" />
          ¥{task.budget_min}-{task.budget_max}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {task.cycle_days}天
        </span>
        {task.employer_name && (
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {task.employer_name}
          </span>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {task.bid_count} 人投标
        </span>
        <span className="text-xs text-gray-400">
          {TASK_STATUS_MAP[task.status] || task.status}
        </span>
      </div>
    </Link>
  );
}
