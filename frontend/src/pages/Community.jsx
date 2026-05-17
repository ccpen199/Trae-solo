import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ThumbsUp, Eye, Plus, Filter } from 'lucide-react';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';

const Community = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', categoryId: '' });

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/community/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
        if (data.data.length > 0) {
          setNewPost(prev => ({ ...prev, categoryId: data.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      
      const response = await fetch(`/api/community/posts?${params}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.data.list || []);
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!newPost.title.trim()) {
      showToast('请输入标题', 'warning');
      return;
    }

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPost)
      });
      const data = await response.json();
      if (data.success) {
        showToast('发布成功', 'success');
        setShowNewPost(false);
        setNewPost({ title: '', content: '', categoryId: categories[0]?.id || '' });
        fetchPosts();
      } else {
        showToast(data.message || '发布失败', 'error');
      }
    } catch (error) {
      showToast('发布失败，请稍后重试', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">社区讨论</h1>
        <button
          onClick={() => {
            const token = localStorage.getItem('hiu_token');
            if (!token) {
              navigate('/login');
              return;
            }
            setShowNewPost(!showNewPost);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          发布帖子
        </button>
      </div>

      {showNewPost && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">发布新帖子</h2>
          <div className="space-y-4">
            <select
              value={newPost.categoryId}
              onChange={(e) => setNewPost(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入标题..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              placeholder="分享你的想法..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewPost(false)}
                className="px-6 py-2 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreatePost}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedCategory
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id.toString()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无帖子</h3>
          <p className="text-gray-500">快来发布第一条帖子吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/community/posts/${post.id}`}
              className="block bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{post.nickname || '用户'}</p>
                    <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {post.is_elite && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    精品
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1 text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{post.view_count || 0}</span>
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">{post.like_count || 0}</span>
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{post.reply_count || 0}</span>
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {post.category_name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;
