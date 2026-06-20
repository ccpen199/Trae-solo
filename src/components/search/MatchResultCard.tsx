import React, { useState } from 'react';
import {
  Ruler,
  Calendar,
  MapPin,
  UserCheck,
  Eye,
  MessageCircle,
  Heart,
  ChevronRight,
  Plus,
  Check,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import MatchScoreBar from '@/components/castings/MatchScoreBar';
import ScheduleConflictIndicator from './ScheduleConflictIndicator';
import type { MatchResult } from '@shared/types';

interface MatchResultCardProps {
  matchResult: MatchResult;
  rank?: number;
  isSelected?: boolean;
  isComparing?: boolean;
  onClick?: () => void;
  onSelectForCompare?: () => void;
  onFavorite?: () => void;
  onContact?: () => void;
  className?: string;
}

const contractStatusConfig: Record<
  string,
  { label: string; variant: 'success' | 'primary' | 'warning' | 'secondary' }
> = {
  available: { label: '可接通告', variant: 'success' },
  signed: { label: '已签约', variant: 'primary' },
  exclusive: { label: '专属合约', variant: 'warning' },
  unavailable: { label: '暂不可用', variant: 'secondary' },
};

const MatchResultCard: React.FC<MatchResultCardProps> = ({
  matchResult,
  rank,
  isSelected = false,
  isComparing = false,
  onClick,
  onSelectForCompare,
  onFavorite,
  onContact,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const { artist, score, matchReasons, conflicts } = matchResult;
  const primaryPhoto = artist.mediaAssets.find((m) => m.isPrimary) || artist.mediaAssets[0];
  const status = contractStatusConfig[artist.contractStatus] || contractStatusConfig.available;

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavorite?.();
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContact?.();
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectForCompare?.();
  };

  const getRankBadge = () => {
    if (!rank || rank > 3) return null;
    const colors = {
      1: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
      2: 'bg-gradient-to-r from-slate-300 to-slate-400 text-white',
      3: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white',
    };
    return (
      <div
        className={cn(
          'absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-10',
          colors[rank as keyof typeof colors]
        )}
      >
        {rank === 1 ? <Star className="w-4 h-4 fill-current" /> : rank}
      </div>
    );
  };

  return (
    <Card
      variant="glass"
      hoverable
      className={cn(
        'group relative overflow-hidden',
        isSelected && 'ring-2 ring-rose-500 ring-offset-2 ring-offset-background',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isComparing && (
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={handleCompare}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2',
              isSelected
                ? 'bg-gradient-primary border-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-midnight-900/60 border-white/20 text-white hover:bg-rose-500/20 hover:border-rose-500/50'
            )}
          >
            {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      )}

      {getRankBadge()}

      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-48 aspect-[3/4] sm:aspect-auto overflow-hidden shrink-0">
          <img
            src={primaryPhoto?.url}
            alt={artist.realName}
            className={cn(
              'w-full h-full object-cover transition-all duration-500 ease-out-expo',
              isHovered && 'scale-110'
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-transparent to-transparent opacity-60 sm:bg-gradient-to-r" />

          <div
            className={cn(
              'absolute bottom-3 left-3 right-3 flex gap-2 transition-all duration-300 ease-out-expo sm:hidden',
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Button
              variant="primary"
              size="sm"
              className="flex-1 !py-1.5 !text-xs"
              onClick={handleContact}
              leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
            >
              联系
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                '!bg-midnight-900/60 border border-white/20 backdrop-blur-md text-white hover:!bg-midnight-800/80 !py-1.5 !px-2.5',
                isFavorited && '!bg-rose-500/30 border-rose-500/50 !text-rose-400'
              )}
              onClick={handleFavorite}
            >
              <Heart
                className={cn(
                  'w-4 h-4',
                  isFavorited ? 'fill-rose-500 text-rose-500' : 'text-white'
                )}
              />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white leading-tight truncate">
                  {artist.stageName}
                </h3>
                <Badge variant={status.variant} size="sm" dot>
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-midnight-300 truncate">{artist.realName}</p>
            </div>
            <div className="flex items-center gap-1 text-midnight-300 text-sm shrink-0">
              <Eye className="w-3.5 h-3.5" />
              <span>{Math.floor(Math.random() * 5000 + 500)}</span>
            </div>
          </div>

          <div className="mb-4">
            <MatchScoreBar score={score} size="sm" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-sm text-midnight-200">
              <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{artist.age}岁</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-midnight-200">
              <Ruler className="w-3.5 h-3.5 text-sapphire-400 shrink-0" />
              <span>{artist.height}cm</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-midnight-200">
              <span className="text-amber-400 font-medium shrink-0">BWH</span>
              <span>
                {artist.bust}/{artist.waist}/{artist.hips}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-midnight-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{artist.location.replace('市', '')}</span>
            </div>
          </div>

          {matchReasons.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-midnight-400 mb-2 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                匹配原因
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matchReasons.slice(0, 3).map((reason, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  >
                    {reason}
                  </span>
                ))}
                {matchReasons.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-midnight-700/50 text-midnight-300 border border-midnight-600">
                    +{matchReasons.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <ScheduleConflictIndicator conflicts={conflicts} compact />

            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  isFavorited && '!text-rose-400 !bg-rose-500/10'
                )}
                onClick={handleFavorite}
                leftIcon={
                  <Heart
                    className={cn(
                      'w-4 h-4',
                      isFavorited && 'fill-rose-500 text-rose-500'
                    )}
                  />
                }
              >
                收藏
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleContact}
                leftIcon={<MessageCircle className="w-4 h-4" />}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                查看详情
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MatchResultCard;
