import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, User, Shield } from 'lucide-react';
import type { ServiceOrder } from '../../shared/types';
import { cn } from '../lib/utils';
import StatusBadge from './StatusBadge';
import Badge from './Badge';
import Button from './Button';

interface OrderCardProps {
  order: ServiceOrder;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onAccept?: () => void;
  className?: string;
}

const OrderCard = ({ order, variant = 'default', showActions = true, onAccept, className }: OrderCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/orders/${order.id}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'bg-white rounded-xl p-4 shadow-card cursor-pointer transition-all duration-300 hover:shadow-card-hover',
          className
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-zinc-900 line-clamp-1 flex-1 mr-3">
            {order.title}
          </h4>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-accent-600 font-bold">¥{order.price}</span>
          <span className="text-xs text-zinc-500">{formatDate(order.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {order.category && (
                <Badge variant="primary" size="sm">
                  {order.category}
                </Badge>
              )}
              <StatusBadge status={order.status} />
            </div>
            <h3 className="font-semibold text-zinc-900 text-lg line-clamp-2 mb-2">
              {order.title}
            </h3>
            {order.description && (
              <p className="text-sm text-zinc-600 line-clamp-2">
                {order.description}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-accent-600">
              ¥{order.price}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              定金 ¥{order.deposit}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mb-4">
          {order.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[150px]">{order.location}</span>
            </div>
          )}
          {order.serviceTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{order.serviceTime}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs">预计 {order.duration} 天</span>
          </div>
        </div>

        {order.requester && (
          <div className="flex items-center justify-between py-3 border-t border-zinc-100">
            <div className="flex items-center gap-3">
              {order.requester.avatar ? (
                <img
                  src={order.requester.avatar}
                  alt={order.requester.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {order.requester.username}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Shield className="w-3.5 h-3.5" />
              <span>平台保障</span>
            </div>
          </div>
        )}

        {showActions && (
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              查看详情
            </Button>
            {order.status === 'published' && (
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept?.();
                }}
              >
                立即接单
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
