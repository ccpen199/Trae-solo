import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentApi } from '../../lib/api';
import RichTextEditor from '../../components/ui/Editor';
import type { ContentType } from '../../../shared/types';

type FeedbackType = 'success' | 'error' | 'info' | null;
const defaultCoverImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=520&fit=crop';

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
    videoUrl: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [securityResult, setSecurityResult] = useState<any>(null);
  const [checkingSecurity, setCheckingSecurity] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const categories = ['政策解读', '景区推荐', '文旅资讯', '非遗文化', '节庆活动', '导游指南', '美食推荐'];
  const regions = ['全国', '北京', '上海', '广东', '江苏', '浙江', '四川', '陕西', '云南', '其他'];

  const showFeedback = (type: FeedbackType, message: string) => {
    setFeedback({ type, message });
    if (type !== 'error') {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const doCreate = async (action: 'save' | 'submit') => {
    if (!formData.title.trim()) {
      showFeedback('error', '请填写内容标题');
      return false;
    }
    if (!formData.summary.trim()) {
      showFeedback('error', '请填写内容摘要');
      return false;
    }
    if (!formData.content.trim()) {
      showFeedback('error', '请填写正文内容');
      return false;
    }
    if (formData.type === 'video' && !formData.videoUrl.trim() && !formData.coverImage.trim()) {
      showFeedback('info', '建议填写视频URL或上传封面以提升展示效果');
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        coverImage: formData.coverImage.trim() || defaultCoverImage,
      };
      const status = action === 'save' ? 'draft' : 'pending_audit';
      const res = await contentApi.create({ ...payload, status });
      if (action === 'submit' && res?.data?.id) {
        await contentApi.submitAudit(res.data.id);
      }
      const actionText = action === 'save' ? '草稿已保存' : '已提交审核';
      showFeedback('success', `${actionText}，即将返回内容列表...`);
      setTimeout(() => navigate('/admin/content'), 1200);
      return true;
    } catch (err: any) {
      const msg = err?.message || '保存失败，请稍后重试';
      showFeedback('error', msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doCreate('save');
  };

  const handleSubmitAudit = async () => {
    await doCreate('submit');
  };

  const handleCancel = () => {
    const hasContent = formData.title || formData.summary || formData.content || formData.tags.length > 0;
    if (hasContent) {
      setShowCancelConfirm(true);
    } else {
      navigate('/admin/content');
    }
  };

  const handleSecurityCheck = async () => {
    setCheckingSecurity(true);
    try {
      const payload = {
        ...formData,
        coverImage: formData.coverImage.trim() || defaultCoverImage,
      };
      const tempContent = await contentApi.create({ ...payload, status: 'draft' });
      const res = await contentApi.securityCheck(tempContent.data.id, {
        content: payload.content,
        type: payload.type,
      } as any);
      setSecurityResult(res.data);
      await contentApi.delete(tempContent.data.id);
      showFeedback('success', '安全检测完成');
    } catch (err: any) {
      showFeedback('error', err?.message || '检测失败');
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
    <div className="space-y-6 relative">
      {feedback && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-lg shadow-lg border ${
          feedback.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
          feedback.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' && <span>✅</span>}
            {feedback.type === 'error' && <span>❌</span>}
            {feedback.type === 'info' && <span>ℹ️</span>}
            <span className="text-sm font-medium">{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="ml-3 text-ink-400 hover:text-ink-600">×</button>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-ink-900 mb-2">确认离开？</h3>
            <p className="text-sm text-ink-600 mb-5">当前编辑的内容尚未保存，离开后将丢失全部修改。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCancelConfirm(false)} className="btn-secondary">
                继续编辑
              </button>
              <button onClick={() => { setShowCancelConfirm(false); navigate('/admin/content'); }} className="btn-primary">
                确认离开
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">创建内容</h1>
          <p className="text-ink-500 text-sm mt-1">发布新的文旅内容（PGC专业生产 / UGC用户生产）</p>
        </div>
        <button onClick={handleCancel} className="btn-secondary">
          取消
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="请输入标题（建议30字以内）"
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
                  <p className="text-xs text-ink-400 mt-1 text-right">{formData.summary.length}/100</p>
                </div>
                {formData.type === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">🎬 视频链接</label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="input"
                      placeholder="请输入视频URL（mp4/m3u8等）"
                    />
                  </div>
                )}
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
                {formData.tags.length === 0 && <span className="text-sm text-ink-400">暂无标签，输入后回车添加</span>}
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
                      { value: 'article', label: '📄 图文', desc: 'PGC文章' },
                      { value: 'video', label: '🎬 视频', desc: '短视频/直播' },
                      { value: 'vr', label: '🎮 VR导览', desc: '全景/VR' },
                      { value: 'infographic', label: '📊 信息图', desc: '政策长图' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: opt.value as ContentType })}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          formData.type === opt.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-ink-200 hover:border-ink-300'
                        }`}
                      >
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs text-ink-400 mt-0.5">{opt.desc}</div>
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
                className="w-full btn-secondary mb-4 disabled:opacity-50"
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

            <div className="flex gap-3 sticky bottom-4">
              <button type="submit" disabled={saving} className="btn-secondary flex-1 disabled:opacity-60">
                {saving ? '保存中...' : '💾 保存草稿'}
              </button>
              <button
                type="button"
                onClick={handleSubmitAudit}
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-60"
              >
                {saving ? '提交中...' : '📝 提交审核'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContentCreatePage;
