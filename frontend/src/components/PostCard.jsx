import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Clock } from 'lucide-react';
import { postAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PostCard = ({ post, onLikeChange }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString();
  };

  const handleLike = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await postAPI.like(post.id);
      setLiked(response.data.liked);
      setLikeCount(response.data.like_count);
      onLikeChange?.(post.id, response.data.liked, response.data.like_count);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  return (
    <Link to={`/post/${post.id}`} className="block">
      <div className="post-card bg-white rounded-lg p-4 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {post.type === 'news' && <span className="news-badge">资讯</span>}
              <span className="text-xs text-gray-400">{post.channel_name}</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <span className="level-badge">{post.author_level || 1}</span>
            <span className="text-sm text-gray-600">{post.author_name}</span>
          </div>

          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(post.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.view_count || 0}
            </span>
            <button
              onClick={handleLike}
              className={`like-btn flex items-center gap-1 ${liked ? 'liked' : ''}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              {likeCount || 0}
            </button>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post.comment_count || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
