import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Star, Users, Award, CheckCircle } from 'lucide-react';
import type { User as UserType } from '../../shared/types';
import { cn } from '../lib/utils';
import RatingStars from './RatingStars';
import Button from './Button';
import Badge from './Badge';

interface CreatorCardProps {
  creator: UserType;
  showFollowButton?: boolean;
  variant?: 'default' | 'compact' | 'horizontal';
  className?: string;
}

const CreatorCard = ({
  creator,
  showFollowButton = true,
  variant = 'default',
  className,
}: CreatorCardProps) => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);

  const handleClick = () => {
    navigate(`/users/${creator.id}`);
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
  };

  const formatCount = (count: number) => {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + 'w';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg',
          className
        )}
      >
        {creator.avatar ? (
          <img
            src={creator.avatar}
            alt={creator.username}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-900 truncate">
              {creator.username}
            </span>
            {creator.verified && (
              <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <RatingStars rating={creator.rating} size="sm" showValue />
            <span>·</span>
            <span>{formatCount(creator.followerCount)} 粉丝</span>
          </div>
        </div>
        {showFollowButton && (
          <Button
            variant={isFollowing ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleFollow}
          >
            {isFollowing ? '已关注' : '关注'}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-4 p-5 bg-white rounded-2xl shadow-card cursor-pointer transition-all duration-300 hover:shadow-card-hover',
          className
        )}
      >
        {creator.avatar ? (
          <img
            src={creator.avatar}
            alt={creator.username}
            className="w-16 h-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-zinc-900 text-lg">
              {creator.username}
            </h4>
            {creator.verified && (
              <CheckCircle className="w-5 h-5 text-primary-500" />
            )}
            {creator.role === 'creator' && (
              <Badge variant="accent" size="sm" icon={<Award className="w-3 h-3" />}>
                创作者
              </Badge>
            )}
          </div>
          {creator.bio && (
            <p className="text-sm text-zinc-600 line-clamp-1 mb-2">
              {creator.bio}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
              <span className="font-medium">{creator.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Users className="w-4 h-4 text-primary-500" />
              <span className="font-medium">{formatCount(creator.followerCount)}</span>
              <span className="text-zinc-500">粉丝</span>
            </div>
          </div>
        </div>
        {showFollowButton && (
          <Button
            variant={isFollowing ? 'secondary' : 'primary'}
            onClick={handleFollow}
          >
            {isFollowing ? '已关注' : '+ 关注'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
        className
      )}
    >
      <div className="relative h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0tOCAwaC0ydi00aDJ2NHptLTggMGgtMnYtNGgydjR6bTE2LTZoLTJ2LTRoMnY0em0tOCAwaC0ydi00aDJ2NHptLTggMGgtMnYtNGgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
      </div>

      <div className="px-5 pb-5 -mt-10">
        <div className="relative mb-4">
          {creator.avatar ? (
            <img
              src={creator.avatar}
              alt={creator.username}
              className="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-4 border-white bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
          )}
          {creator.verified && (
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow">
              <CheckCircle className="w-5 h-5 text-primary-500" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-zinc-900 text-lg">
            {creator.username}
          </h4>
          {creator.role === 'creator' && (
            <Badge variant="accent" size="sm" icon={<Award className="w-3 h-3" />}>
              创作者
            </Badge>
          )}
        </div>

        {creator.bio ? (
          <p className="text-sm text-zinc-600 line-clamp-2 mb-4 min-h-[40px]">
            {creator.bio}
          </p>
        ) : (
          <div className="mb-4 min-h-[40px]" />
        )}

        <div className="flex items-center justify-around py-3 border-y border-zinc-100 mb-4">
          <div className="text-center">
            <p className="font-bold text-zinc-900">{creator.rating.toFixed(1)}</p>
            <p className="text-xs text-zinc-500">评分</p>
          </div>
          <div className="w-px h-10 bg-zinc-100" />
          <div className="text-center">
            <p className="font-bold text-zinc-900">{formatCount(creator.followerCount)}</p>
            <p className="text-xs text-zinc-500">粉丝</p>
          </div>
          <div className="w-px h-10 bg-zinc-100" />
          <div className="text-center">
            <p className="font-bold text-zinc-900">{formatCount(creator.followingCount)}</p>
            <p className="text-xs text-zinc-500">关注</p>
          </div>
        </div>

        {showFollowButton && (
          <Button
            variant={isFollowing ? 'secondary' : 'primary'}
            fullWidth
            onClick={handleFollow}
          >
            {isFollowing ? '已关注' : '+ 关注'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreatorCard;
