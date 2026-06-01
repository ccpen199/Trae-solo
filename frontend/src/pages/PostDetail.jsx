import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, MessageSquare, Eye, Clock, User, Loader2, ArrowLeft, UserCheck } from 'lucide-react';
import { postAPI, commentAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CommentItem from '../components/CommentItem';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [authorOnly, setAuthorOnly] = useState(false);
  const [brightOnly, setBrightOnly] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotal, setCommentTotal] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id, authorOnly, brightOnly, commentPage]);

  const loadPost = async () => {
    try {
      const response = await postAPI.getDetail(id);
      setPost(response.data.post);
      setLiked(response.data.post.is_liked);
      setLikeCount(response.data.post.like_count);
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    setCommentLoading(true);
    try {
      const response = await commentAPI.getByPost(id, {
        page: commentPage,
        limit: 20,
        author_only: authorOnly,
        bright_only: brightOnly,
      });
      
      if (commentPage === 1) {
        setComments(response.data.comments);
      } else {
        setComments((prev) => [...prev, ...response.data.comments]);
      }
      setCommentTotal(response.data.total);
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await postAPI.like(id);
      setLiked(response.data.liked);
      setLikeCount(response.data.like_count);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentContent.trim()) return;

    try {
      const response = await commentAPI.create({
        post_id: id,
        parent_id: 0,
        content: commentContent,
      });
      setComments((prev) => [response.data.comment, ...prev]);
      setCommentContent('');
    } catch (error) {
      console.error('评论失败:', error);
    }
  };

  const handleReply = async (parentId, content) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await commentAPI.create({
        post_id: id,
        parent_id: parentId,
        content: content,
      });
      
      setComments((prev) => {
        const updateComments = (list) => {
          return list.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), response.data.comment],
              };
            }
            if (c.replies) {
              return { ...c, replies: updateComments(c.replies) };
            }
            return c;
          });
        };
        return updateComments(prev);
      });
    } catch (error) {
      console.error('回复失败:', error);
    }
  };

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20 text-gray-400">
        帖子不存在或已被删除
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        返回
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-4 flex-wrap">
            <Link to={`/user/${post.author_id}`} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <span className="font-medium text-gray-900">{post.author_name}</span>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="level-badge !w-5 !h-5 !text-[10px]">{post.author_level}</span>
                  <span>{post.author_reputation}声望</span>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(post.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.view_count}阅读
              </span>
              <span className="text-gray-400">{post.channel_name}</span>
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={handleLike}
            className={`like-btn flex items-center gap-2 ${liked ? 'liked' : 'text-gray-500'} cursor-pointer`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>
          <span className="flex items-center gap-2 text-gray-500">
            <MessageSquare className="w-5 h-5" />
            <span>{post.comment_count}</span>
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          评论 ({commentTotal})
        </h2>

        <div className="flex items-center gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={authorOnly}
              onChange={(e) => {
                setAuthorOnly(e.target.checked);
                setCommentPage(1);
              }}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <UserCheck className="w-4 h-4" />
              只看楼主
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={brightOnly}
              onChange={(e) => {
                setBrightOnly(e.target.checked);
                setCommentPage(1);
              }}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-sm text-gray-600">只看亮评</span>
          </label>
        </div>

        {user && (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="写下你的评论..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none comment-input"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentContent.trim()}
                    className="px-6 py-2 bg-primary text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    发表评论
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
            />
          ))}
        </div>

        {commentLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!commentLoading && comments.length < commentTotal && (
          <div className="flex justify-center py-6">
            <button
              onClick={() => setCommentPage((prev) => prev + 1)}
              className="px-6 py-2 text-primary border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              加载更多评论
            </button>
          </div>
        )}

        {!commentLoading && comments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            暂无评论，快来抢沙发吧~
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
