import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Image, User, Shield, Hash, Plus } from 'lucide-react';
import { useAuthStore, type UserRole } from '@/store/authStore';

const categories = ['活动通知', '物业通知', '互助求助', '闲置转让', '生活分享'];

const presetTags = ['#邻里互助', '#社区活动', '#生活贴士', '#二手闲置', '#寻物启事', '#宠物交流'];

const roleLabels: Record<UserRole, string> = {
  admin: '系统管理员',
  property: '物业人员',
  resident: '已认证居民',
  merchant: '入驻商家',
};

const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  property: 'bg-blue-100 text-blue-700',
  resident: 'bg-green-100 text-green-700',
  merchant: 'bg-purple-100 text-purple-700',
};

const PostCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '生活分享',
  });
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [covenantChecked, setCovenantChecked] = useState(false);

  const addTag = (tag: string) => {
    if (selectedTags.length >= 5 || selectedTags.includes(tag)) return;
    setSelectedTags([...selectedTags, tag]);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleCustomTagSubmit = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    const tag = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    addTag(tag);
    setCustomTagInput('');
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomTagSubmit();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!covenantChecked) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert('帖子发布成功！');
    navigate('/community');
  };

  const handleImageUpload = () => {
    const newImages = [...images, `https://picsum.photos/seed/${Date.now()}/400/300`];
    setImages(newImages.slice(0, 9));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/community')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">发布新帖</h1>
          <p className="text-gray-500 mt-1">分享你的想法和动态</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{user?.name || '匿名用户'}</span>
                <Shield className="w-3.5 h-3.5 text-primary-500" />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColors[user?.role || 'resident']}`}>
                  {roleLabels[user?.role || 'resident']}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">此身份将展示在您发布的帖子中</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">帖子分类 <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.category === cat
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">话题标签</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {presetTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)
                    }
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm"
                    >
                      <Hash className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-primary-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleCustomTagKeyDown}
                  className="input flex-1"
                  placeholder="输入自定义标签，回车添加"
                  disabled={selectedTags.length >= 5}
                />
                <button
                  type="button"
                  onClick={handleCustomTagSubmit}
                  disabled={selectedTags.length >= 5 || !customTagInput.trim()}
                  className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                已选 {selectedTags.length}/5 个标签
              </p>
            </div>
            <div>
              <label className="label">帖子标题 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input text-lg"
                placeholder="请输入一个吸引人的标题"
                required
                maxLength={100}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.title.length}/100
              </p>
            </div>
            <div>
              <label className="label">帖子内容 <span className="text-red-500">*</span></label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input min-h-[200px] resize-none"
                placeholder="分享你的想法..."
                required
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.content.length}/5000
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              上传图片
            </div>
          </h3>
          <p className="text-sm text-gray-500 mb-4">最多可上传9张图片</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square">
                <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                type="button"
                onClick={handleImageUpload}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
              >
                <Upload className="w-8 h-8 mb-1" />
                <span className="text-xs">添加图片</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-accent-yellow-50 border border-accent-yellow-200 rounded-lg p-4">
          <p className="text-sm text-accent-yellow-800">
            <strong>温馨提示：</strong>请遵守社区公约，发布积极健康的内容。禁止发布广告、谣言、色情等违规内容，违规帖子将被删除。
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>治理提示：</strong>本社区实行实名制发帖，违规内容将被标记并处理。举报可在帖子详情页操作。
          </p>
        </div>

        <div className="card">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={covenantChecked}
              onChange={(e) => setCovenantChecked(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              我承诺发布内容真实准确，遵守社区公约
            </span>
          </label>
        </div>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/community')}
            className="btn-outline"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.title || !formData.content || !covenantChecked}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '发布中...' : '发布帖子'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostCreate;
