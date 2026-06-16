import { useState } from 'react';
import { Heart, MessageCircle, Share2, User, Syringe, Bug } from 'lucide-react';
import type { CommunityPost } from '@shared/types';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: CommunityPost;
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-forest-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900">宠友用户</p>
            {post.vaccineTag && (
              <span className="tag tag-green flex items-center gap-1">
                <Syringe className="w-3 h-3" />
                {post.vaccineTag}
              </span>
            )}
            {post.dewormingTag && (
              <span className="tag tag-orange flex items-center gap-1">
                <Bug className="w-3 h-3" />
                {post.dewormingTag}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleDateString('zh-CN', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.images.length > 0 && (
        <div
          className={cn(
            'grid gap-2 mb-4',
            post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
          )}
        >
          {post.images.slice(0, 9).map((img, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-xl bg-gradient-to-br from-cream-50 to-cream-100 overflow-hidden"
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, idx) => (
            <span key={idx} className="text-sm text-forest-600 hover:text-forest-700 cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-forest-50">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          )}
        >
          <Heart className={cn('w-5 h-5', liked && 'fill-red-500')} />
          <span>{likes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-forest-600 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-forest-600 transition-colors ml-auto">
          <Share2 className="w-5 h-5" />
          <span className="hidden sm:inline">分享</span>
        </button>
      </div>
    </div>
  );
}
