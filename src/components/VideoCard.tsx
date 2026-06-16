import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Heart, MessageCircle, Bookmark, MoreHorizontal, User, ShieldCheck, BadgeCheck, ChevronRight, Crown } from 'lucide-react';
import { cn } from '../lib/utils';
import RatingStars from './RatingStars';
import Badge from './Badge';

interface VideoLike {
  id?: string;
  title?: string;
  thumbnail?: string;
  coverImage?: string;
  duration?: number | string;
  creator?: {
    id?: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  creatorVerified?: boolean;
  viewCount?: number;
  views?: number;
  likeCount?: number;
  likes?: number;
  commentCount?: number;
  rating?: number;
  category?: string;
  createdAt?: string;
  collection?: {
    name?: string;
    totalCount?: number;
  };
  series?: {
    name?: string;
    totalCount?: number;
  };
  price?: number;
  audited?: boolean;
  type?: 'video' | 'course';
  isSubscription?: boolean;
  courseId?: string;
}

interface VideoCardProps extends VideoLike {
  video?: VideoLike;
  className?: string;
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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

const VideoCard = ({ video: videoProp, className, ...flatVideo }: VideoCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const rawVideo = videoProp ?? flatVideo;
  const video = {
    id: rawVideo.id || 'video-demo',
    title: rawVideo.title || '未命名内容',
    thumbnail: rawVideo.thumbnail || rawVideo.coverImage,
    duration: rawVideo.duration,
    creator:
      rawVideo.creator ||
      (rawVideo.creatorName
        ? {
            id: rawVideo.creatorId || rawVideo.id,
            username: rawVideo.creatorName,
            avatar: rawVideo.creatorAvatar,
            verified: rawVideo.creatorVerified,
          }
        : undefined),
    viewCount: rawVideo.viewCount ?? rawVideo.views ?? 0,
    likeCount: rawVideo.likeCount ?? rawVideo.likes ?? 0,
    commentCount: rawVideo.commentCount ?? 0,
    rating: rawVideo.rating ?? 4.8,
    category: rawVideo.category,
    createdAt: rawVideo.createdAt || new Date().toISOString(),
    collection: rawVideo.collection || rawVideo.series,
    price: rawVideo.price,
    audited: rawVideo.audited,
    type: rawVideo.type,
    isSubscription: rawVideo.isSubscription,
  };
  const durationLabel =
    typeof video.duration === 'string'
      ? video.duration
      : formatDuration(video.duration);

  const handleClick = () => {
    navigate(`/course/${rawVideo.courseId || video.id}`);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (video.creator?.id) {
      navigate(`/creator/${video.creator.id}`);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div
      className={cn(
        'group bg-white rounded-2xl overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover cursor-pointer',
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-zinc-100">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              isHovered && 'scale-105'
            )}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 flex items-center justify-center">
            <Play className="w-16 h-16 text-white/60" />
          </div>
        )}

        <div
          className={cn(
            'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
            <Play className="w-6 h-6 text-primary-600 ml-1" />
          </div>
        </div>

        {video.collection?.totalCount && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="accent" size="sm">
              {video.collection.totalCount}集全
            </Badge>
          </div>
        )}

        {video.audited && (
          <div className="absolute top-3 right-3 z-10">
            <div className="w-6 h-6 rounded-full bg-green-500/90 flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {typeof video.price === 'number' && (
          <div className="absolute bottom-3 right-3 z-10">
            {video.price === 0 ? (
              <div className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-md">
                免费
              </div>
            ) : (
              <div className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold rounded-md">
                ¥{video.price}
              </div>
            )}
          </div>
        )}

        {durationLabel && !video.price && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 text-white text-xs rounded-md z-10">
            {durationLabel}
          </div>
        )}
        {durationLabel && video.price !== undefined && (
          <div className="absolute bottom-10 right-3 px-2 py-0.5 bg-black/70 text-white text-xs rounded-md z-10">
            {durationLabel}
          </div>
        )}

        {!video.collection?.totalCount && video.category && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="primary" size="sm">
              {video.category}
            </Badge>
          </div>
        )}

        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-3 px-3 transition-all duration-300 z-20',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full py-2.5 bg-white/95 text-primary-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 hover:bg-white transition-colors backdrop-blur-sm"
          >
            查看完整课程
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleCreatorClick}
              className="flex items-center gap-1.5"
            >
              <div className="relative">
                {video.creator?.avatar ? (
                  <img
                    src={video.creator.avatar}
                    alt={video.creator.username}
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-primary-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                {video.creator?.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white">
                    <BadgeCheck className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
            <RatingStars rating={video.rating} size="sm" />
          </div>
          <h4 className="text-white text-sm font-medium line-clamp-2 drop-shadow-lg">
            {video.title}
          </h4>
        </div>
      </div>

      <div className="p-3">
        {video.type === 'course' && (
          <div className="mb-2 flex items-center gap-1 text-xs text-amber-600">
            <Crown className="w-3.5 h-3.5" />
            <span>会员免费看</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-zinc-500">
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1 text-sm transition-colors',
                isLiked ? 'text-red-500' : 'hover:text-red-500'
              )}
            >
              <Heart
                className={cn('w-4 h-4', isLiked && 'fill-red-500')}
              />
              <span>{formatCount(video.likeCount + (isLiked ? 1 : 0))}</span>
            </button>
            <div className="flex items-center gap-1 text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>{formatCount(video.commentCount)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmark}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isBookmarked
                  ? 'text-primary-500 bg-primary-50'
                  : 'text-zinc-400 hover:text-primary-500 hover:bg-primary-50'
              )}
            >
              <Bookmark
                className={cn('w-4 h-4', isBookmarked && 'fill-primary-500')}
              />
            </button>
            <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
