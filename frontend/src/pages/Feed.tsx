import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Heart, MessageCircle, Share2, Send, Link2, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { postsApi } from '../lib/api';
import { Avatar } from '../components/Avatar';
import type { Post } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export const Feed: React.FC = () => {
  const { user, posts, setPosts, addPost, updatePostLikes, showToast } = useStore();
  
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await postsApi.getList(20, 0);
      if (response.success && response.data) {
        const data = response.data as { posts: Post[]; hasMore: boolean };
        setPosts(data.posts || []);
      } else {
        setError(response.message || '加载失败');
      }
    } catch (err) {
      setError('加载失败，请稍后重试');
      console.error('Load posts error:', err);
    } finally {
      setLoading(false);
    }
  }, [setPosts]);
  
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  
  const handleSubmit = useCallback(async () => {
    if (!content.trim() || !user || submitting) return;
    
    setSubmitting(true);
    try {
      const response = await postsApi.create(content.trim());
      if (response.success && response.data) {
        const data = response.data as { post: Post };
        addPost(data.post);
        setContent('');
        showToast('发布成功！', 'success');
      } else {
        showToast(response.message || '发布失败', 'error');
      }
    } catch (err) {
      showToast('发布失败，请稍后重试', 'error');
      console.error('Create post error:', err);
    } finally {
      setSubmitting(false);
    }
  }, [content, user, submitting, addPost, showToast]);
  
  const handleLike = useCallback(async (post: Post) => {
    try {
      const response = await postsApi.like(post.id);
      if (response.success && response.data) {
        const data = response.data as { isLiked: boolean; likesCount: number };
        updatePostLikes(post.id, data.isLiked, data.likesCount);
      }
    } catch (err) {
      console.error('Like post error:', err);
    }
  }, [updatePostLikes]);
  
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          发布动态
        </h2>
        
        <div className="flex gap-3">
          {user && <Avatar config={user.avatarConfig} size={40} />}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的想法..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              rows={3}
              disabled={submitting}
            />
            <div className="flex justify-between items-center mt-3">
              <div className="flex gap-2">
                <button className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                  <Link2 className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    发布
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-white/70 mb-4">{error}</p>
          <button onClick={loadPosts} className="btn-secondary">
            重试
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 mb-2">还没有动态</p>
          <p className="text-white/30 text-sm">成为第一个发布动态的人吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card p-4">
              <div className="flex gap-3">
                <Avatar config={post.avatarConfig} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{post.nickname}</h3>
                      <p className="text-white/50 text-sm">
                        {dayjs(post.createdAt.replace(' ', 'T')).fromNow()}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-white mt-3 leading-relaxed">{post.content}</p>
                  
                  {post.pageUrl && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Link2 className="w-4 h-4 flex-shrink-0" />
                        <a href={post.pageUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:text-white underline">
                          {post.pageTitle || post.pageUrl}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-6 mt-4">
                    <button
                      onClick={() => handleLike(post)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.isLiked ? 'text-red-400' : 'text-white/50 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{post.likesCount}</span>
                    </button>
                    <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.commentsCount}</span>
                    </button>
                    <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm">分享</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
