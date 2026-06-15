import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Heart, MessageCircle, Bookmark, MoreHorizontal, User } from 'lucide-react';
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
  };
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  viewCount?: number;
  views?: number;
  likeCount?: number;
  likes?: number;
  commentCount?: number;
  rating?: number;
  category?: string;
  createdAt?: string;
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
          }
        : undefined),
    viewCount: rawVideo.viewCount ?? rawVideo.views ?? 0,
    likeCount: rawVideo.likeCount ?? rawVideo.likes ?? 0,
    commentCount: rawVideo.commentCount ?? 0,
    rating: rawVideo.rating ?? 4.8,
    category: rawVideo.category,
    createdAt: rawVideo.createdAt || new Date().toISOString(),
  };
  const durationLabel =
    typeof video.duration === 'string'
      ? video.duration
      : formatDuration(video.duration);

  const handleClick = () => {
    navigate(`/course/${video.id}`);
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

        {durationLabel && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 text-white text-xs rounded-md">
            {durationLabel}
          </div>
        )}

        {video.category && (
          <div className="absolute top-3 left-3">
            <Badge variant="primary" size="sm">
              {video.category}
            </Badge>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleCreatorClick}
              className="flex items-center gap-1.5"
            >
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
            </button>
            <RatingStars rating={video.rating} size="sm" />
          </div>
          <h4 className="text-white text-sm font-medium line-clamp-2 drop-shadow-lg">
            {video.title}
          </h4>
        </div>
      </div>

      <div className="p-3">
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
