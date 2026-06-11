import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentApi } from '../../lib/api';
import RichTextEditor from '../../components/ui/Editor';
import type { ContentType } from '../../../shared/types';

const ContentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    type: 'article' as ContentType,
    category: '政策解读',
    region: '全国',
    summary: '',
    content: '',
    coverImage: '',
    tags: [] as string[],
    scheduledPublishAt: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [securityResult, setSecurityResult] = useState<any>(null);
  const [checkingSecurity, setCheckingSecurity] = useState(false);

  const categories = ['政策解读', '景区推荐', '文旅资讯', '非遗文化', '节庆活动', '导游指南', '美食推荐'];
  const regions = ['全国', '北京', '上海', '广东', '江苏', '浙江', '四川', '陕西', '云南', '其他'];

  const handleSubmit = async (e: React.FormEvent, action: 'save' | 'submit') => {
    e.preventDefault();
    try {
      const res = await contentApi.create(formData);
      if (action === 'submit') {
        await contentApi.submitAudit(res.data.id);
      }
      navigate('/admin/content');
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const handleSecurityCheck = async () => {
    setCheckingSecurity(true);
    try {
      const tempContent = await contentApi.create({ ...formData, status: 'draft' });
      const res = await contentApi.securityCheck(tempContent.data.id);
      setSecurityResult(res.data);
      await contentApi.delete(tempContent.data.id);
    } catch (err) {
      console.error('检测失败:', err);
    } finally {
      setCheckingSecurity(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">创建内容</h1>
          <p className="text-ink-500 text-sm mt-1">发布新的文旅内容</p>
        </div>
        <button onClick={() => navigate('/admin/content')} className="btn-secondary">
          取消
        </button>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'save')} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card chinese-border">
              <h3 className="text-lg font-semibold text-ink-800 mb-4">基本信息</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">内容标题 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    placeholder="请输入标题"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">内容摘要 *</label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="input h-24 resize-none"
                    placeholder="请输入内容摘要（100字以内）"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">正文内容 *</label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(val) => setFormData({ ...formData, content: val })}
                  />
                </div>
              </div>
            </div>

            <div className="card chinese-border">
              <h3 className="text-lg font-semibold text-ink-800 mb-4">标签</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-primary-900">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="input flex-1"
                  placeholder="输入标签后按回车添加"
                />
                <button type="button" onClick={handleAddTag} className="btn-secondary">添加</button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card chinese-border">
              <h3 className="text-lg font-semibold text-ink-800 mb-4">类型与分类</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">内容类型 *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'article', label: '📄 图文' },
                      { value: 'video', label: '🎬 视频' },
                      { value: 'vr', label: '🎮 VR导览' },
                      { value: 'infographic', label: '📊 信息图' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: opt.value as ContentType })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.type === opt.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-ink-200 hover:border-ink-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">发布地区</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="input"
                  >
                    {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">定时发布</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledPublishAt}
                    onChange={(e) => setFormData({ ...formData, scheduledPublishAt: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="card chinese-border">
              <h3 className="text-lg font-semibold text-ink-800 mb-4">封面图片</h3>
              <div className="aspect-video bg-ink-50 rounded-lg border-2 border-dashed border-ink-200 flex items-center justify-center overflow-hidden">
                {formData.coverImage ? (
                  <img src={formData.coverImage} alt="封面" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-ink-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">点击上传封面图片</p>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="input mt-3 text-sm"
                placeholder="或输入封面图片URL"
              />
            </div>

            <div className="card chinese-border">
              <h3 className="text-lg font-semibold text-ink-800 mb-4">内容安全检测</h3>
              <button
                type="button"
                onClick={handleSecurityCheck}
                disabled={checkingSecurity || !formData.title || !formData.content}
                className="w-full btn-secondary mb-4"
              >
                {checkingSecurity ? '检测中...' : '🔍 安全检测'}
              </button>
              {securityResult && (
                <div className={`p-4 rounded-lg ${securityResult.safe ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <p className="font-medium mb-2">{securityResult.safe ? '✅ 内容安全' : '⚠️ 存在风险'}</p>
                  <p className="text-sm">{securityResult.risk}</p>
                  {securityResult.suggestions?.length > 0 && (
                    <ul className="mt-2 text-sm list-disc list-inside">
                      {securityResult.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-secondary flex-1">
                保存草稿
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'submit')}
                className="btn-primary flex-1"
              >
                提交审核
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContentCreatePage;
