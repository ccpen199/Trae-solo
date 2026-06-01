import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Reply, ThumbsUp, User } from 'lucide-react';
import { commentAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CommentItem = ({ comment, onReply, depth = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(comment.is_liked);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await commentAPI.like(comment.id);
      setLiked(response.data.liked);
      setLikeCount(response.data.like_count);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleReplyClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowReplyInput(!showReplyInput);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!replyContent.trim()) return;
    
    onReply?.(comment.id, replyContent);
    setReplyContent('');
    setShowReplyInput(false);
  };

  return (
    <div className={`${comment.is_bright ? 'bright-comment' : ''} rounded-lg p-4 mb-3`}>
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
          <User className="w-5 h-5 text-gray-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link to={`/user/${comment.user_id}`} className="font-medium text-gray-900 hover:text-primary">
              {comment.user_name}
            </Link>
            <span className="level-badge text-xs">{comment.user_level || 1}</span>
            {comment.is_bright && (
              <span className="flex items-center gap-1 text-yellow-600 text-xs">
                <ThumbsUp className="w-3 h-3" />
                亮了
              </span>
            )}
          </div>

          <p className="text-gray-700 mb-3 leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{formatTime(comment.created_at)}</span>
            <button
              onClick={handleLike}
              className={`like-btn flex items-center gap-1 ${liked ? 'liked' : ''} cursor-pointer`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              {likeCount || 0}
            </button>
            {depth < 2 && (
              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1 hover:text-primary cursor-pointer"
              >
                <Reply className="w-4 h-4" />
                回复
              </button>
            )}
          </div>

          {showReplyInput && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="写下你的回复..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm comment-input"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-red-600"
                >
                  发送
                </button>
              </div>
            </form>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-gray-100">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
