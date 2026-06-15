import { useState, useEffect } from 'react';
import { User, MapPin, Tag, Save, Camera, X, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAppStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const availableSkills = [
  '视频剪辑', '摄影', '平面设计', 'UI设计', '编程开发', 
  '音乐制作', '文案写作', '配音', '动画制作', '3D建模',
  '数据分析', '营销策划', '直播运营', '电商运营', '心理咨询'
];

const availableLocations = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', 
  '西安', '重庆', '南京', '苏州', '长沙', '郑州', '青岛', '厦门'
];

export default function Settings() {
  const { user } = useAuthStore();
  const { categories } = useAppStore();
  const { updateProfile } = useWorkspaceStore();
  
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    location: '',
    skills: [] as string[],
    categories: [] as string[],
    avatar: '',
  });
  
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        location: user.location || '',
        skills: [],
        categories: [],
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      alert('请输入用户名');
      return;
    }
    
    setSaving(true);
    try {
      await updateProfile(formData);
      alert('保存成功');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleAvatarUpload = () => {
    const imageUrl = prompt('请输入头像图片URL:');
    if (imageUrl) {
      handleInputChange('avatar', imageUrl);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card p-6 space-y-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <User className="h-5 w-5 text-primary-500" />
          基本资料
        </h3>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-gradient-to-r from-primary-100 to-accent-100">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="头像"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary-400">
                  {formData.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <button
              onClick={handleAvatarUpload}
              className="absolute bottom-0 right-0 rounded-full bg-primary-500 p-2 text-white shadow-lg hover:bg-primary-600"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <p className="text-xl font-semibold text-zinc-900">{formData.username}</p>
            <p className="text-sm text-zinc-500">
              {user?.verified && (
                <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">
                  已认证创作者
                </span>
              )}
              加入于 {new Date(user?.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">用户名 *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="请输入用户名"
              className="input-field mt-1.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">个人简介</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="介绍一下自己，让学员更好地了解你..."
              rows={4}
              className="input-field mt-1.5 resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              <MapPin className="mr-1.5 inline h-4 w-4 text-primary-500" />
              服务地域
            </label>
            <button
              onClick={() => setShowLocationModal(true)}
              className="input-field mt-1.5 flex items-center justify-between text-left"
            >
              <span className={cn(!formData.location && 'text-zinc-400')}>
                {formData.location || '选择服务地域'}
              </span>
              <MapPin className="h-4 w-4 text-zinc-400" />
            </button>
            {formData.location && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700">
                  {formData.location}
                  <button
                    onClick={() => handleInputChange('location', '')}
                    className="ml-1 hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
          <Tag className="h-5 w-5 text-primary-500" />
          擅长领域
        </h3>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            擅长分类（可多选，最多5个）
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                disabled={!formData.categories.includes(category) && formData.categories.length >= 5}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  formData.categories.includes(category)
                    ? 'bg-primary-500 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            技能标签（可多选，最多10个）
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-3 py-1.5 text-sm text-accent-700"
              >
                {skill}
                <button
                  onClick={() => toggleSkill(skill)}
                  className="ml-1 hover:text-accent-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setShowSkillModal(true)}
              disabled={formData.skills.length >= 10}
              className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 transition-all hover:border-primary-400 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              添加技能
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-20 sm:pb-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      {showSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-zinc-900">选择技能标签</h3>
              <button
                onClick={() => setShowSkillModal(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-6">
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    disabled={!formData.skills.includes(skill) && formData.skills.length >= 10}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                      formData.skills.includes(skill)
                        ? 'bg-primary-500 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-zinc-200 px-6 py-4">
              <button
                onClick={() => setShowSkillModal(false)}
                className="btn-primary w-full"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-zinc-900">选择服务地域</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableLocations.map((location) => (
                  <button
                    key={location}
                    onClick={() => {
                      handleInputChange('location', location);
                      setShowLocationModal(false);
                    }}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      formData.location === location
                        ? 'bg-primary-500 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    )}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
