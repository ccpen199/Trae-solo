import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { photoAPI, filterAPI, communityAPI } from '../utils/api';

const EditPage = () => {
  const { photoId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('原图');
  const [filters, setFilters] = useState([]);
  const [filterCategories, setFilterCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showPostPanel, setShowPostPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enhanceType, setEnhanceType] = useState('auto');
  const [postCaption, setPostCaption] = useState('');
  const [postTags, setPostTags] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadMyPhotos();
    loadFilters();
    loadCategories();
  }, []);

  const loadMyPhotos = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await photoAPI.getMyPhotos();
      setPhotos(data.photos || []);
      if (photoId && data.photos) {
        const photo = data.photos.find(p => p.id == photoId);
        if (photo) setSelectedPhoto(photo);
      }
    } catch (error) {
      console.error('加载照片失败:', error);
    }
  };

  const loadFilters = async () => {
    try {
      const data = await filterAPI.getFilters();
      setFilters(data.filters || []);
    } catch (error) {
      console.error('加载滤镜失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await filterAPI.getCategories();
      setFilterCategories(data.categories || []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const applyFilter = async (filterName) => {
    setCurrentFilter(filterName);
    if (selectedPhoto && isAuthenticated) {
      try {
        const filter = filters.find(f => f.name === filterName);
        if (filter) {
          await filterAPI.applyFilter(filter.id, selectedPhoto.original_url);
          await photoAPI.updateEditedPhoto(selectedPhoto.id, {
            filter_used: filterName,
          });
        }
      } catch (error) {
        console.error('应用滤镜失败:', error);
      }
    }
  };

  const aiEnhance = async () => {
    if (!selectedPhoto || !isAuthenticated) return;
    setLoading(true);
    try {
      await filterAPI.aiEnhance(selectedPhoto.original_url, enhanceType);
      alert('AI 增强完成！');
    } catch (error) {
      console.error('AI 增强失败:', error);
      alert('AI 增强失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const removeBackground = async () => {
    if (!selectedPhoto || !isAuthenticated) return;
    setLoading(true);
    try {
      await filterAPI.removeBackground(selectedPhoto.original_url);
      alert('背景移除完成！');
    } catch (error) {
      console.error('背景移除失败:', error);
      alert('背景移除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const colorize = async () => {
    if (!selectedPhoto || !isAuthenticated) return;
    setLoading(true);
    try {
      await filterAPI.colorize(selectedPhoto.original_url);
      alert('黑白上色完成！');
    } catch (error) {
      console.error('黑白上色失败:', error);
      alert('黑白上色失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const publishPost = async () => {
    if (!selectedPhoto || !isAuthenticated) return;
    setLoading(true);
    try {
      await communityAPI.createPost({
        photo_id: selectedPhoto.id,
        caption: postCaption,
        location: postLocation,
        tags: postTags.split(',').map(t => t.trim()).filter(t => t),
      });
      alert('发布成功！');
      setShowPostPanel(false);
      navigate('/community');
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('is_public', 'true');
      const result = await photoAPI.upload(formData);
      if (result.photoId) {
        await loadMyPhotos();
      }
    } catch (error) {
      console.error('上传照片失败:', error);
      alert('上传失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const filteredFilters = activeCategory === 'all'
    ? filters
    : filters.filter(f => f.category === activeCategory);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2">登录后才能修图</h2>
          <p className="text-gray-500 mb-4">登录后即可使用所有修图功能</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-medium"
          >
            立即登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-center">修图</h1>
      </div>

      {selectedPhoto ? (
        <>
          <div className="relative bg-black aspect-square max-h-96 mx-auto">
            <img
              src={selectedPhoto.edited_url || selectedPhoto.original_url}
              alt="修图"
              className="w-full h-full object-contain"
            />
            {currentFilter !== '原图' && (
              <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm">
                🎨 {currentFilter}
              </div>
            )}
          </div>

          <div className="bg-white px-4 py-4 space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className="flex flex-col items-center py-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <span className="text-2xl">🎨</span>
                <span className="text-xs mt-1">滤镜</span>
              </button>
              <button
                onClick={() => setShowAIPanel(true)}
                className="flex flex-col items-center py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-2xl">🤖</span>
                <span className="text-xs mt-1">AI增强</span>
                <span className="ai-badge">AI</span>
              </button>
              <button
                onClick={removeBackground}
                disabled={loading}
                className="flex flex-col items-center py-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">✂️</span>
                <span className="text-xs mt-1">抠图</span>
              </button>
              <button
                onClick={colorize}
                disabled={loading}
                className="flex flex-col items-center py-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">🌈</span>
                <span className="text-xs mt-1">上色</span>
              </button>
            </div>

            <button
              onClick={() => setShowPostPanel(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              发布到社区
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🖼️</div>
          <p className="text-gray-500 mb-4">选择一张照片开始修图</p>
          <label className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-medium cursor-pointer hover:opacity-90">
            {loading ? '上传中...' : '上传照片'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
        </div>
      )}

      {photos.length > 0 && !selectedPhoto && (
        <div className="px-4 mt-6">
          <h3 className="font-semibold mb-3">我的照片</h3>
          <div className="photo-grid">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  src={photo.original_url}
                  alt="照片"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowFilters(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">选择滤镜</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-500">✕</button>
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {filterCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {filteredFilters.map((filter) => (
                <div
                  key={filter.id}
                  className={`filter-item flex-shrink-0 w-20 h-24 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center ${
                    currentFilter === filter.name ? 'active border-purple-500' : 'border-gray-200'
                  }`}
                  onClick={() => applyFilter(filter.name)}
                >
                  <div className="text-3xl mb-1">🎨</div>
                  <span className="text-xs text-center">{filter.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAIPanel && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAIPanel(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">AI 增强 <span className="ai-badge">AI</span></h3>
              <button onClick={() => setShowAIPanel(false)} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-3 mb-4">
              {[
                { id: 'auto', label: '智能增强', desc: '自动识别场景并优化' },
                { id: 'portrait', label: '人像增强', desc: '磨皮美白、五官立体' },
                { id: 'landscape', label: '风景增强', desc: '色彩鲜艳、增加对比度' },
                { id: 'night', label: '夜景增强', desc: '降噪提亮、清晰细节' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setEnhanceType(item.id)}
                  className={`w-full flex items-center p-4 rounded-lg border-2 transition-all ${
                    enhanceType === item.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={aiEnhance}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? '处理中...' : '开始 AI 增强'}
            </button>
          </div>
        </div>
      )}

      {showPostPanel && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowPostPanel(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">发布到社区</h3>
              <button onClick={() => setShowPostPanel(false)} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配文</label>
                <textarea
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="分享你的拍摄心得..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none h-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
                <input
                  type="text"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="添加地点"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签（用逗号分隔）</label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="例如: 人像, 风景, 美食"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={publishPost}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPage;