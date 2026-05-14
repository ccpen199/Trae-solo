import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Image, MapPin } from 'lucide-react';
import api, { handleApiError } from '../services/api';
import Loading from '../components/Loading';
import { showToast } from '../components/Toast';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      showToast('请输入内容', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/posts', {
        content: content.trim(),
        location: location || undefined,
        images: [],
      });
      if (res.data.success) {
        showToast('发布成功', 'success');
        setTimeout(() => navigate('/'), 500);
      }
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {loading && <Loading fullScreen />}
      
      <div className="flex items-center justify-between px-4 pt-8 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <X size={24} />
        </button>
        <h1 className="font-semibold text-gray-800">发布瞬间</h1>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            content.trim()
              ? 'bg-pink-500 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          发布
        </button>
      </div>

      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的心情..."
          className="w-full h-48 resize-none outline-none text-gray-700 placeholder-gray-400"
          maxLength={500}
        />
        <p className="text-right text-xs text-gray-400">{content.length}/500</p>
      </div>

      <div className="border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full">
          <Image size={20} className="text-gray-500" />
          <span className="text-gray-700">添加图片</span>
        </button>
        <div className="flex items-center gap-3 px-4 py-3">
          <MapPin size={20} className="text-gray-500" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="添加位置"
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
