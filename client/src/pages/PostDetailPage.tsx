import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { categoryLabels, statusLabels } from '../utils/constants';
import { formatTime } from '../utils/format';
import Card from '../components/Card';
import Tag from '../components/Tag';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { useAuthStore } from '../stores/authStore';
import type { Post } from '@/types/shared';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/${id}`);
      setPost(res.data.data);
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/posts/${id}/like`);
      setLiked(true);
      if (post) {
        setPost({ ...post, likes: post.likes + 1 });
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loading text="加载中..." />
      </div>
    );
  }

  if (!post) {
    return <div className="text-center py-12 text-gray-500">帖子不存在</div>;
  }

  const statusColorMap: Record<string, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          {post.user && <Avatar src={post.user.avatar} alt={post.user.nickname} size="lg" />}
          <div>
            <p className="font-medium text-gray-800">{post.user?.nickname}</p>
            <p className="text-sm text-gray-400">{formatTime(post.createdAt)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Tag color="primary">{categoryLabels[post.category]}</Tag>
            {post.status !== 'approved' && (
              <Tag color={statusColorMap[post.status]}>{statusLabels[post.status]}</Tag>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

        {post.location && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <span>📍</span>
            <span>{post.location.district} · {post.location.address}</span>
          </div>
        )}

        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {post.media && post.media.length > 0 && (
          <div className="grid gap-3 mb-6">
            {post.media.map((media, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden">
                {media.type === 'video' ? (
                  <video src={media.url} controls className="w-full" />
                ) : (
                  <img src={media.url} alt="" className="w-full rounded-xl" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-6 text-gray-500">
            <span>👁️ {post.views} 浏览</span>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 ${liked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{post.likes}</span>
            </button>
            <span>💬 {post.comments} 评论</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">分享</Button>
            <Button variant="outline" size="sm">收藏</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-4 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">评论区</h3>
        <div className="text-center py-8 text-gray-500">
          <p>暂无评论，快来发表第一条评论吧</p>
          {user && (
            <Button className="mt-4">发表评论</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
