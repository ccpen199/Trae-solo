import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, User, Shield, AlertTriangle, CheckCircle, PlayCircle, DollarSign, Handshake, MessageCircle, Target, Users, ChevronRight } from 'lucide-react';
import type { ServiceOrder } from '../../shared/types';
import { cn } from '../lib/utils';
import StatusBadge from './StatusBadge';
import Badge from './Badge';
import Button from './Button';

type LoadingAction = 'accept' | 'payDeposit' | 'start' | 'complete' | 'dispute' | null;

interface OrderCardProps {
  order: ServiceOrder;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  userRole?: string | null;
  loadingAction?: LoadingAction;
  onAccept?: () => void;
  onPayDeposit?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onDispute?: () => void;
  onViewMatches?: () => void;
  className?: string;
}

const OrderCard = ({ order, variant = 'default', showActions = true, userRole, loadingAction, onAccept, onPayDeposit, onStart, onComplete, onDispute, onViewMatches, className }: OrderCardProps) => {
  const navigate = useNavigate();

  const matchScore = order.matchScore ?? Math.floor(70 + Math.random() * 25);

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getDepositStep = () => {
    if (['completed'].includes(order.status)) return 3;
    if (order.status === 'in_progress') return 2;
    if (order.status === 'deposit_paid') return 1;
    return 0;
  };

  const depositStep = getDepositStep();
  const depositSteps = [
    { label: '已支付定金' },
    { label: '服务中' },
    { label: '待结算' },
  ];

  const isTerminalStatus = ['completed', 'cancelled', 'disputed'].includes(order.status);
  const canAccept = userRole === 'creator' && order.status === 'published';
  const canPayDeposit = userRole === 'user' && order.status === 'matched';
  const canViewMatches = userRole === 'user' && order.status === 'matched';
  const canStart = userRole === 'creator' && order.status === 'deposit_paid';
  const canComplete = order.status === 'in_progress';
  const canDispute = !isTerminalStatus;

  const hasAnyAction = canAccept || canPayDeposit || canStart || canComplete || canDispute || canViewMatches;

  const handleClick = () => {
    navigate(`/order/${order.id}`);
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
              <div className="relative">
                <StatusBadge status={order.status} />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
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
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <span className="text-xs text-zinc-500">定金 ¥{order.deposit}</span>
              {order.depositPaid && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-medium">
                  <CheckCircle className="w-3 h-3" />
                  已托管
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                {depositSteps.map((step, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      'text-[10px]',
                      idx < depositStep ? 'text-green-600' :
                      idx === depositStep ? 'text-primary-600 font-medium' :
                      'text-zinc-400'
                    )}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-0">
                {depositSteps.map((_, idx) => (
                  <div key={idx} className="flex items-center flex-1">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border-2 transition-colors',
                        idx < depositStep
                          ? 'bg-green-500 border-green-500 text-white'
                          : idx === depositStep
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'bg-white border-zinc-300 text-zinc-400'
                      )}
                    >
                      {idx < depositStep ? '✓' : idx + 1}
                    </div>
                    {idx < depositSteps.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-1',
                          idx < depositStep ? 'bg-green-500' : 'bg-zinc-200'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
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

        {order.address && (
          <div className="flex items-center gap-1.5 text-sm text-zinc-500 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{order.address}</span>
          </div>
        )}

        {order.latestMessage && (
          <div className="flex items-center gap-1.5 text-sm text-zinc-500 mb-4 bg-zinc-50 rounded-lg px-3 py-2">
            <MessageCircle className="w-4 h-4 flex-shrink-0 text-primary-500" />
            <span className="truncate">
              最新沟通: {order.latestMessage.sender} {order.latestMessage.time} {order.latestMessage.content}
            </span>
          </div>
        )}

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

        {order.creator && (
          <div className="flex items-center justify-between py-3 border-t border-zinc-100">
            <div className="flex items-center gap-3">
              {order.creator.avatar ? (
                <img
                  src={order.creator.avatar}
                  alt={order.creator.username}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-accent-600" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900">
                  {order.creator.username}
                </span>
                <span className="text-xs text-amber-500">
                  ★ {order.creator.rating?.toFixed(1) ?? '5.0'}
                </span>
              </div>
            </div>
            <div className={cn('flex items-center gap-1 text-xs font-medium', getMatchScoreColor(matchScore))}>
              <Target className="w-3.5 h-3.5" />
              <span>匹配度 {matchScore}%</span>
            </div>
          </div>
        )}

        {!order.creator && (
          <div className="flex items-center justify-end py-3 border-t border-zinc-100">
            <div className={cn('flex items-center gap-1 text-xs font-medium', getMatchScoreColor(matchScore))}>
              <Target className="w-3.5 h-3.5" />
              <span>匹配度 {matchScore}%</span>
            </div>
          </div>
        )}

        {showActions && hasAnyAction && (
          <div className="pt-4 border-t border-zinc-100">
            {canViewMatches && (
              <div className="mb-3 p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800">已匹配 3 位创作者</p>
                      <p className="text-xs text-zinc-500">选择心仪的创作者确认接单</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMatches?.();
                    }}
                    className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    查看
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {canAccept && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Handshake className="w-4 h-4" />}
                  isLoading={loadingAction === 'accept'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept?.();
                  }}
                >
                  立即接单
                </Button>
              )}
              {canPayDeposit && (
                <Button
                  variant="accent"
                  size="sm"
                  leftIcon={<DollarSign className="w-4 h-4" />}
                  isLoading={loadingAction === 'payDeposit'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPayDeposit?.();
                  }}
                >
                  支付定金
                </Button>
              )}
              {canStart && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<PlayCircle className="w-4 h-4" />}
                  isLoading={loadingAction === 'start'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart?.();
                  }}
                >
                  开始服务
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="accent"
                  size="sm"
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                  isLoading={loadingAction === 'complete'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete?.();
                  }}
                >
                  完成服务
                </Button>
              )}
            </div>
            {canDispute && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<AlertTriangle className="w-4 h-4" />}
                isLoading={loadingAction === 'dispute'}
                onClick={(e) => {
                  e.stopPropagation();
                  onDispute?.();
                }}
              >
                申请仲裁
              </Button>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-zinc-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full py-2.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors flex items-center justify-center gap-2 group"
          >
            查看订单详情
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
