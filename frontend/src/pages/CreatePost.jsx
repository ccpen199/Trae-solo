import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI, channelAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channelId, setChannelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadChannels();
  }, [user]);

  const loadChannels = async () => {
    try {
      const response = await channelAPI.getAll();
      setChannels(response.data.channels);
      if (response.data.channels.length > 0) {
        setChannelId(response.data.channels[0].id);
      }
    } catch (error) {
      console.error('加载频道失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('请输入帖子标题');
      return;
    }

    if (title.length < 5) {
      setError('标题至少需要5个字符');
      return;
    }

    if (!content.trim()) {
      setError('请输入帖子内容');
      return;
    }

    if (content.length < 10) {
      setError('内容至少需要10个字符');
      return;
    }

    setLoading(true);
    try {
      const response = await postAPI.create({
        title,
        content,
        channel_id: channelId,
        type: 'post',
      });
      navigate(`/post/${response.data.post.id}`);
    } catch (error) {
      setError(error.response?.data?.error || '发布失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">发布新帖子</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择频道
            </label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
            >
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              帖子标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入帖子标题（至少5个字符）"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
              maxLength={100}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {title.length}/100
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              帖子内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入帖子内容（至少10个字符）"
              rows={12}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {content.length} 字符
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-primary text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? '发布中...' : '发布帖子'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
