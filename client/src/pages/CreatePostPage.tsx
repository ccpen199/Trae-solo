import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { categoryLabels, districtOptions } from '../utils/constants';
import Card from '../components/Card';
import Button from '../components/Button';
import Tag from '../components/Tag';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

export default function CreatePostPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('life');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [media, setMedia] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia: { type: 'image' | 'video'; url: string }[] = [];
    Array.from(files).forEach((file) => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      newMedia.push({
        type,
        url: URL.createObjectURL(file),
      });
    });
    setMedia((prev) => [...prev, ...newMedia].slice(0, 9));
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/posts', {
        title,
        content,
        category,
        location: district ? { district, address, lat: 0, lng: 0 } : undefined,
        media: media.map((m) => ({
          type: m.type,
          url: m.url,
        })),
      });

      alert(res.data.message || '发布成功！');
      navigate('/');
    } catch (error: any) {
      alert(error.response?.data?.error || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">发布爆料</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              事件分类 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    category === key
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="用一句话概括你发现的事情"
              maxLength={50}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/50</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              rows={6}
              placeholder="详细描述事情的经过、时间、地点..."
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{content.length}/2000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片/视频
            </label>
            <div className="grid grid-cols-3 gap-2">
              {media.map((item, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {media.length < 9 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                  <span className="text-2xl text-gray-400">+</span>
                  <span className="text-xs text-gray-400 mt-1">上传图片/视频</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">最多上传9张图片或视频</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              位置信息
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">选择区县</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="详细地址"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">💡 添加位置标签可获得更多曝光</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">📌 温馨提示</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• 请确保爆料内容真实客观，不得造谣传谣</li>
              <li>• 爆料需经过编辑审核后才会在公共流展示</li>
              <li>• 优质爆料通过审核后可获得小红花积分奖励</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="flex-1">
              取消
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              提交爆料
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
