import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { categoryLabels, statusLabels, districtOptions } from '../../utils/constants';
import { formatTime } from '../../utils/format';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Tag from '../../components/Tag';
import Avatar from '../../components/Avatar';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import type { Post } from '@/types/shared';

export default function AdminReviews() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewType, setReviewType] = useState<'approved' | 'rejected'>('approved');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const fetchPendingPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/posts/pending');
      setPosts(res.data.data.data || []);
    } catch (error) {
      console.error('Failed to fetch pending posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (post: Post, type: 'approved' | 'rejected') => {
    setSelectedPost(post);
    setReviewType(type);
    setReviewNote('');
    setReviewModalOpen(true);
  };

  const handleReview = async () => {
    if (!selectedPost) return;
    
    setSubmitting(true);
    try {
      await api.put(`/admin/posts/${selectedPost.id}/review`, {
        status: reviewType,
        reviewNote,
      });
      setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
      setReviewModalOpen(false);
      setSelectedPost(null);
    } catch (error: any) {
      alert(error.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loading text="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">爆料审核</h1>
        <Tag color="warning" size="md">待审核: {posts.length}</Tag>
      </div>

      {posts.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <span className="text-5xl block mb-4">🎉</span>
          <p className="text-lg">太棒了！没有待审核的爆料</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-start gap-4">
                {post.user && <Avatar src={post.user.avatar} alt={post.user.nickname} />}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-800">{post.user?.nickname}</span>
                    <span className="text-xs text-gray-400">{formatTime(post.createdAt)}</span>
                    <Tag color="primary">{categoryLabels[post.category]}</Tag>
                    {post.sentiment && (
                      <Tag color={post.sentiment === 'positive' ? 'success' : post.sentiment === 'negative' ? 'danger' : 'secondary'}>
                        {post.sentiment === 'positive' ? '正面' : post.sentiment === 'negative' ? '负面' : '中性'}
                      </Tag>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-800 mb-2">{post.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{post.content}</p>

                  {post.media && post.media.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {post.media.slice(0, 4).map((media, idx) => (
                        <img
                          key={idx}
                          src={media.url || media.thumbnail}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {post.location && (
                    <p className="text-xs text-gray-400 mb-3">
                      📍 {post.location.district} · {post.location.address}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openReviewModal(post, 'approved')}>
                      通过审核
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openReviewModal(post, 'rejected')}>
                      拒绝
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewType === 'approved' ? '通过审核' : '拒绝审核'}
      >
        <p className="text-gray-600 mb-4">
          确定要{reviewType === 'approved' ? '通过' : '拒绝'}这篇爆料吗？
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">审核备注</label>
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            rows={3}
            placeholder="请输入审核备注（可选）"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setReviewModalOpen(false)}>
            取消
          </Button>
          <Button
            className="flex-1"
            onClick={handleReview}
            loading={submitting}
          >
            {reviewType === 'approved' ? '确认通过' : '确认拒绝'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
