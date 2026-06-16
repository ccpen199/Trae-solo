import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Button, Card, Avatar, Badge, Icon, EmptyState } from '../components/ui';
import type { Post, Comment } from '../types';
import {
  formatTime,
  formatDateTime,
  getPostTypeLabel,
  getPostTypeColor,
  getSourceLevelLabel,
  getSourceLevelColor,
} from '../utils/format';

const PostDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      const res = await postApi.getById(id!);
      setPost(res.post);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;
    try {
      const res = await postApi.like(post.id);
      setPost({
        ...post,
        isLiked: res.liked,
        likeCount: post.likeCount + (res.liked ? 1 : -1),
      });
    } catch {}
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !comment.trim()) return;
    setSubmitting(true);
    try {
      await postApi.comment(post.id, comment, replyTo?.id);
      setComment('');
      setReplyTo(null);
      await loadPost();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 animate-pulse">
          <div className="flex gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-100 rounded" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (!post) {
    return <EmptyState icon="❌" title="内容不存在" description="可能已被删除或审核中" />;
  }

  const hasImages = post.images && post.images.length > 0;
  const gridCols = post.images!.length >= 3 ? 'grid-cols-3' : post.images!.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        <Icon name="back" /> 返回上一页
      </button>

      {/* Post */}
      <Card className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <Avatar src={post.user.avatar} name={post.user.nickname} size="lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-gray-900">{post.user.nickname}</span>
                {post.user.isVerified && <Badge className="bg-blue-100 text-blue-700">✓ 已认证</Badge>}
                {post.sourceLevel !== 'ORDINARY' && (
                  <Badge className={`${getSourceLevelColor(post.sourceLevel)} text-white`}>
                    {getSourceLevelLabel(post.sourceLevel)}
                  </Badge>
                )}
                <Badge className={getPostTypeColor(post.type)}>{getPostTypeLabel(post.type)}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                <span>{formatDateTime(post.createdAt)}</span>
                {post.locationName && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Icon name="location" />
                      {post.locationName}
                    </span>
                  </>
                )}
                <span>·</span>
                <span>阅读 {post.viewCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-6 mb-4 leading-tight">
          {post.isPitfall && <span className="text-red-500 mr-2">⚠️ 避坑预警</span>}
          {post.title}
        </h1>

        {/* Content */}
        <div className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
          {post.content}
        </div>

        {/* Images */}
        {hasImages && (
          <div className={`grid ${gridCols} gap-3 mt-6`}>
            {post.images!.map((img, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center text-5xl shadow-sm"
              >
                {['🍜', '☕', '🏞️', '🎂', '🏙️', '🌆', '🍱', '🥘', '🍲'][i % 9]}
              </div>
            ))}
          </div>
        )}

        {/* Meta Tags */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
          {post.topics?.map((t) => (
            <Link
              key={t.topic.id}
              to={`/feed?topic=${encodeURIComponent(t.topic.name)}`}
              className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-100"
            >
              {t.topic.name}
            </Link>
          ))}
          {post.priceAnchor && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-orange-50 rounded-full">
              <span className="text-sm text-orange-600">人均消费</span>
              <span className="font-bold text-orange-600">¥{post.priceAnchor}</span>
            </div>
          )}
          {post.hasProof && (
            <Badge className="bg-green-50 text-green-700 px-3 py-1 text-sm">
              <Icon name="check" /> 真实消费凭证
            </Badge>
          )}
        </div>

        {/* Merchant Link */}
        {post.merchant && (
          <div
            onClick={() => navigate(`/merchants/${post.merchant!.id}`)}
            className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl">
              🏪
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">{post.merchant.businessName}</div>
              <div className="text-sm text-gray-500">点击查看商户详情 · 发现更多优惠</div>
            </div>
            <Icon name="back" className="rotate-180 text-xl text-gray-400" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-around mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              post.isLiked
                ? 'bg-red-50 text-red-500'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className={`text-2xl ${post.isLiked ? 'animate-bounce' : ''}`}>
              {post.isLiked ? '❤️' : '🤍'}
            </span>
            <span className="font-semibold">{post.likeCount}</span>
          </button>
          <div className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:bg-gray-50 rounded-xl cursor-pointer">
            <span className="text-2xl">💬</span>
            <span className="font-semibold">{post.commentCount}</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:bg-gray-50 rounded-xl cursor-pointer">
            <span className="text-2xl">📤</span>
            <span className="font-semibold">{post.shareCount}</span>
          </div>
        </div>
      </Card>

      {/* Comment Input */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-xl">💬</span> 发表评论
        </h3>
        {replyTo && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm flex items-center justify-between">
            <span>
              回复 <span className="font-medium text-primary-600">@{replyTo.user.nickname}</span>：
              <span className="text-gray-500 ml-1 line-clamp-1">{replyTo.content}</span>
            </span>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
        )}
        <form onSubmit={handleSubmitComment}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={replyTo ? `回复 @${replyTo.user.nickname}...` : '说点什么吧...'}
            className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            rows={3}
          />
          <div className="flex justify-end mt-3">
            <Button type="submit" disabled={submitting || !comment.trim()}>
              {submitting ? '发送中...' : '发表评论'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Comments */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-xl">📋</span> 全部评论 ({post.comments?.length || 0})
        </h3>
        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-6">
            {post.comments.map((c) => (
              <div key={c.id} className="group">
                <div className="flex gap-4">
                  <Avatar src={c.user.avatar} name={c.user.nickname} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{c.user.nickname}</span>
                      {c.isTop && <Badge className="bg-yellow-100 text-yellow-700">置顶</Badge>}
                      <span className="text-xs text-gray-400">{formatTime(c.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 mt-2 leading-relaxed">{c.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <button className="hover:text-red-500 flex items-center gap-1">
                        <span>👍</span> {c.likeCount}
                      </button>
                      <button
                        onClick={() => setReplyTo(c)}
                        className="hover:text-primary-600"
                      >
                        回复
                      </button>
                    </div>

                    {/* Children */}
                    {c.children && c.children.length > 0 && (
                      <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100">
                        {c.children.map((child) => (
                          <div key={child.id} className="flex gap-3">
                            <Avatar src={child.user.avatar} name={child.user.nickname} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {child.user.nickname}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatTime(child.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{child.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="💭" title="还没有评论" description="快来抢沙发吧～" />
        )}
      </Card>
    </div>
  );
};

export default PostDetailPage;
