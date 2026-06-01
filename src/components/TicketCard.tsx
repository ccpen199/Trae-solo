import { Ticket, Calendar, MapPin, Clock, QrCode, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Ticket as TicketType } from '../types';
import { useAppStore } from '../stores/appStore';

interface TicketCardProps {
  ticket: TicketType;
  onClick?: () => void;
  compact?: boolean;
}

export default function TicketCard({ ticket, onClick, compact = false }: TicketCardProps) {
  const { setCurrentTicketId, setCurrentPage } = useAppStore();

  const handleClick = () => {
    setCurrentTicketId(ticket.id);
    setCurrentPage('ticket-detail');
    onClick?.();
  };

  const getStatusConfig = (status: TicketType['status']) => {
    switch (status) {
      case 'valid':
        return {
          icon: CheckCircle,
          label: '有效',
          color: 'text-green-400',
          bg: 'bg-green-400/10',
          border: 'border-green-400/30',
        };
      case 'used':
        return {
          icon: CheckCircle,
          label: '已使用',
          color: 'text-cinema-text-muted',
          bg: 'bg-cinema-bg',
          border: 'border-cinema-border',
        };
      case 'expired':
        return {
          icon: XCircle,
          label: '已过期',
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/30',
        };
    }
  };

  const statusConfig = getStatusConfig(ticket.status);
  const StatusIcon = statusConfig.icon;

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="bg-cinema-bg-light rounded-xl overflow-hidden card-hover cursor-pointer border border-cinema-border"
      >
        <div className="flex">
          <div className="w-24 h-32 flex-shrink-0">
            <img
              src={ticket.poster}
              alt={ticket.movieTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-3">
            <h4 className="font-bold text-cinema-text line-clamp-1">{ticket.movieTitle}</h4>
            <div className="mt-2 space-y-1 text-xs text-cinema-text-secondary">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{ticket.startTime.slice(0, 16)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{ticket.cinemaName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Ticket className="w-3 h-3" />
                <span>{ticket.seat}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-xs ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className="text-cinema-gold font-bold">¥{ticket.price}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-gradient-to-br from-cinema-bg-light to-cinema-bg rounded-2xl overflow-hidden card-hover cursor-pointer border ${statusConfig.border} watermark`}
      data-watermark={ticket.watermark || ticket.movieTitle}
    >
      <div className="absolute top-4 right-4 z-10">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
          <span className={`text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-6">
          <div className="relative w-32 h-48 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl">
            <img
              src={ticket.poster}
              alt={ticket.movieTitle}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-cinema-text mb-1 group-hover:text-cinema-red transition-colors">
              {ticket.movieTitle}
            </h3>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-cinema-text-secondary">
                <Calendar className="w-5 h-5 text-cinema-red flex-shrink-0" />
                <div>
                  <p className="font-medium text-cinema-text">{ticket.startTime.slice(5, 16)}</p>
                  <p className="text-xs text-cinema-text-muted">
                    {ticket.startTime.slice(11, 16)} - {ticket.endTime.slice(11, 16)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-cinema-text-secondary">
                <MapPin className="w-5 h-5 text-cinema-gold flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-cinema-text line-clamp-1">{ticket.cinemaName}</p>
                  <p className="text-xs text-cinema-text-muted">{ticket.hallName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-cinema-text-secondary">
                <Ticket className="w-5 h-5 text-cinema-gold flex-shrink-0" />
                <span className="font-medium text-cinema-text">{ticket.seat}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-cinema-text-muted">票价</p>
                  <p className="text-2xl font-bold text-cinema-gold">¥{ticket.price}</p>
                </div>
                <div className="w-20 h-20 bg-white rounded-lg p-2 flex items-center justify-center">
                  <QrCode className="w-full h-full text-cinema-bg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 flex justify-between px-2">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-cinema-bg rounded-full -mt-1.5" />
          ))}
        </div>
        <div className="border-t border-dashed border-cinema-border" />
      </div>

      <div className="p-4 flex items-center justify-between text-xs text-cinema-text-muted">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>订单号：{ticket.orderId}</span>
        </div>
        <span>票号：{ticket.id.toUpperCase()}</span>
      </div>

      {ticket.status === 'valid' && (
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-cinema-gold/50 rounded-2xl transition-colors pointer-events-none animate-glow" />
      )}
    </div>
  );
}
