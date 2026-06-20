import React, { useState } from 'react';
import { MapPin, Ruler, Calendar, Heart, Eye, MessageCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ArtistProfile } from '@shared/types';

interface ArtistCardProps {
  artist: ArtistProfile;
  matchScore?: number;
  onClick?: () => void;
  onFavorite?: () => void;
  onContact?: () => void;
  className?: string;
}

const contractStatusConfig: Record<string, { label: string; variant: 'success' | 'primary' | 'warning' | 'secondary' }> = {
  available: { label: '可接通告', variant: 'success' },
  signed: { label: '已签约', variant: 'primary' },
  exclusive: { label: '专属合约', variant: 'warning' },
  unavailable: { label: '暂不可用', variant: 'secondary' },
};

const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  matchScore,
  onClick,
  onFavorite,
  onContact,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

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

  return (
    <Card
      variant="glass"
      hoverable
      className={cn('group relative overflow-hidden', className)}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={primaryPhoto?.url}
          alt={artist.realName}
          className={cn(
            'w-full h-full object-cover transition-all duration-500 ease-out-expo',
            isHovered && 'scale-110'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-transparent to-transparent opacity-80" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {matchScore !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-primary text-white text-sm font-semibold shadow-lg">
              <UserCheck className="w-3.5 h-3.5" />
              {matchScore}%
            </div>
          )}
          <Badge variant={status.variant} size="sm" dot>
            {status.label}
          </Badge>
        </div>

        <div
          className={cn(
            'absolute bottom-3 left-3 right-3 flex gap-2 transition-all duration-300 ease-out-expo',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={handleContact}
            leftIcon={<MessageCircle className="w-4 h-4" />}
          >
            联系
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              '!bg-midnight-900/60 border border-white/20 backdrop-blur-md text-white hover:!bg-midnight-800/80',
              isFavorited && '!bg-rose-500/30 border-rose-500/50 !text-rose-400'
            )}
            onClick={handleFavorite}
            leftIcon={
              <Heart
                className={cn(
                  'w-4 h-4',
                  isFavorited ? 'fill-rose-500 text-rose-500' : 'text-white'
                )}
              />
            }
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-white leading-tight">
              {artist.stageName}
            </h3>
            <p className="text-sm text-midnight-300">{artist.realName}</p>
          </div>
          <div className="flex items-center gap-1 text-midnight-300 text-sm">
            <Eye className="w-3.5 h-3.5" />
            <span>{Math.floor(Math.random() * 5000 + 500)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
          <div className="flex items-center gap-1.5 text-midnight-200">
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>{artist.age}岁</span>
          </div>
          <div className="flex items-center gap-1.5 text-midnight-200">
            <Ruler className="w-3.5 h-3.5 text-sapphire-400" />
            <span>{artist.height}cm</span>
          </div>
          <div className="flex items-center gap-1.5 text-midnight-200">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">{artist.location.replace('市', '')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {artist.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300',
                tag.category === 'appearance' &&
                  'bg-rose-500/15 text-rose-400 border border-rose-500/30',
                tag.category === 'skill' &&
                  'bg-sapphire-500/15 text-sapphire-300 border border-sapphire-500/30',
                tag.category === 'experience' &&
                  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                tag.category === 'language' &&
                  'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              )}
            >
              {tag.tag}
            </span>
          ))}
          {artist.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-midnight-700/50 text-midnight-300 border border-midnight-600">
              +{artist.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ArtistCard;
