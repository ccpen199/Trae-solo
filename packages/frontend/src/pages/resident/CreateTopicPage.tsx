import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, MapPin, Eye, EyeOff } from 'lucide-react';
import { TOPIC_CATEGORIES } from '@neighborhood/shared';
import type { TopicCategory } from '@neighborhood/shared';
import * as topicsApi from '@/api/topics';

export default function CreateTopicPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<TopicCategory>('life');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [addLocation, setAddLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await topicsApi.createTopic({
        title,
        content,
        category,
        isAnonymous,
        location: addLocation ? { lat: 0, lng: 0, address: '当前位置' } : undefined,
      });
      navigate('/topics');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">发布话题</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入话题标题"
            className="input-field"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <div className="flex flex-wrap gap-2">
            {TOPIC_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的想法..."
            className="input-field min-h-[200px] resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
          <div className="flex flex-wrap gap-3">
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs mt-1">上传图片</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setAddLocation(!addLocation)}
            className={`flex items-center gap-1.5 text-sm ${
              addLocation ? 'text-primary-600' : 'text-gray-500'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {addLocation ? '已添加位置' : '添加位置'}
          </button>
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-1.5 text-sm ${
              isAnonymous ? 'text-primary-600' : 'text-gray-500'
            }`}
          >
            {isAnonymous ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {isAnonymous ? '匿名发布' : '实名发布'}
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/topics')}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim()}
            className="btn-primary"
          >
            {loading ? '发布中...' : '发布话题'}
          </button>
        </div>
      </form>
    </div>
  );
}
