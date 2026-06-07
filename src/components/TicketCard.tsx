import React from 'react';
import { Clock, User, ChevronRight, AlertCircle } from 'lucide-react';
import type { Ticket } from '@/types';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
}

const statusConfig = {
  pending: { label: '待处理', bg: 'bg-accent-yellow-100', text: 'text-accent-yellow-700' },
  assigned: { label: '已分派', bg: 'bg-blue-100', text: 'text-blue-700' },
  processing: { label: '处理中', bg: 'bg-primary-100', text: 'text-primary-700' },
  completed: { label: '已完成', bg: 'bg-accent-green-100', text: 'text-accent-green-700' },
  cancelled: { label: '已取消', bg: 'bg-gray-100', text: 'text-gray-600' },
};

const priorityConfig = {
  low: { label: '低', bg: 'bg-gray-100', text: 'text-gray-600' },
  medium: { label: '中', bg: 'bg-blue-100', text: 'text-blue-700' },
  high: { label: '高', bg: 'bg-orange-100', text: 'text-orange-700' },
  urgent: { label: '紧急', bg: 'bg-red-100', text: 'text-red-700' },
};

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const status = statusConfig[ticket.status] || statusConfig.pending;
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
  const progress = ticket.progress ?? (
    ticket.status === 'completed' ? 100 :
    ticket.status === 'processing' ? 60 :
    ticket.status === 'assigned' ? 30 : 0
  );

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer group hover:-translate-y-1 duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`badge ${status.bg} ${status.text}`}>{status.label}</span>
          <span className={`badge ${priority.bg} ${priority.text} flex items-center gap-1`}>
            <AlertCircle className="w-3 h-3" />
            {priority.label}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        {ticket.title}
      </h3>
      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{ticket.description}</p>
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>处理进度</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          <span>{ticket.reporter_name || ticket.reporter || '未知'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{ticket.createdAt || ticket.created_at || '-'}</span>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
