import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, GripVertical, Send, Save, Upload, X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAppStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { Chapter } from '../../../shared/types';

interface ChapterFormData {
  id?: string;
  title: string;
  videoUrl?: string;
  duration: number;
  isFree: boolean;
  order: number;
}

export default function CourseEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === 'new';
  const { categories } = useAppStore();
  
  const { 
    currentCourse, 
    chapters, 
    fetchCourseDetail, 
    fetchChapters, 
    createCourse, 
    updateCourse, 
    submitCourseForReview,
    addChapter,
    updateChapter,
    deleteChapter
  } = useWorkspaceStore();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    coverImage: '',
    price: '',
    subscriptionPrice: '',
    isSubscription: false,
  });

  const [editingChapter, setEditingChapter] = useState<ChapterFormData | null>(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      fetchCourseDetail(id);
      fetchChapters(id);
    }
  }, [isNew, id, fetchCourseDetail, fetchChapters]);

  useEffect(() => {
    if (currentCourse && !isNew) {
      setFormData({
        title: currentCourse.title || '',
        category: currentCourse.category || '',
        description: currentCourse.description || '',
        coverImage: currentCourse.coverImage || '',
        price: currentCourse.price?.toString() || '',
        subscriptionPrice: currentCourse.subscriptionPrice?.toString() || '',
        isSubscription: currentCourse.isSubscription || false,
      });
    }
  }, [currentCourse, isNew]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('请输入课程标题');
      return;
    }
    
    setSaving(true);
    try {
      const courseData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        subscriptionPrice: formData.subscriptionPrice ? parseFloat(formData.subscriptionPrice) : undefined,
      };

      if (isNew) {
        const newCourse = await createCourse(courseData);
        navigate(`/workspace/courses/${newCourse.id}/edit`);
      } else if (id) {
        await updateCourse(id, courseData);
      }
    } catch (error) {
      console.error('Failed to save course:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id || isNew) {
      alert('请先保存课程');
      return;
    }
    try {
      await submitCourseForReview(id);
      alert('已提交审核');
      navigate('/workspace/courses');
    } catch (error) {
      console.error('Failed to submit for review:', error);
      alert('提交失败，请重试');
    }
  };

  const handleAddChapter = () => {
    setEditingChapter({
      title: '',
      duration: 0,
      isFree: false,
      order: chapters.length,
    });
    setShowChapterModal(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter({
      id: chapter.id,
      title: chapter.title,
      videoUrl: chapter.videoUrl,
      duration: chapter.duration,
      isFree: chapter.isFree,
      order: chapter.order,
    });
    setShowChapterModal(true);
  };

  const handleSaveChapter = async () => {
    if (!editingChapter?.title.trim()) {
      alert('请输入章节标题');
      return;
    }

    try {
      if (editingChapter.id) {
        await updateChapter(editingChapter.id, editingChapter);
      } else if (id) {
        await addChapter(id, editingChapter);
      }
      setShowChapterModal(false);
      setEditingChapter(null);
    } catch (error) {
      console.error('Failed to save chapter:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('确定要删除这个章节吗？')) return;
    try {
      await deleteChapter(chapterId);
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      alert('删除失败，请重试');
    }
  };

  const handleCoverUpload = () => {
    const imageUrl = prompt('请输入封面图片URL:');
    if (imageUrl) {
      handleInputChange('coverImage', imageUrl);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/workspace/courses')}
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-zinc-900">
          {isNew ? '新建课程' : '编辑课程'}
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6 space-y-5">
            <h3 className="text-lg font-semibold text-zinc-900">基本信息</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700">课程标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="请输入课程标题"
                className="input-field mt-1.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">分类</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="input-field mt-1.5"
              >
                <option value="">选择分类</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">课程简介</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="请输入课程简介，让学员了解课程内容..."
                rows={4}
                className="input-field mt-1.5 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">封面图片</label>
              <div className="mt-1.5">
                {formData.coverImage ? (
                  <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-xl border-2 border-dashed border-zinc-200">
                    <img
                      src={formData.coverImage}
                      alt="封面预览"
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => handleInputChange('coverImage', '')}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-zinc-500 shadow-sm hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCoverUpload}
                    className="flex aspect-video w-full max-w-md flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 text-zinc-500 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-500"
                  >
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">点击上传封面图片</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h3 className="text-lg font-semibold text-zinc-900">定价设置</h3>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleInputChange('isSubscription', false)}
                className={cn(
                  'flex-1 rounded-xl border-2 p-4 text-left transition-all',
                  !formData.isSubscription 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-zinc-200 hover:border-zinc-300'
                )}
              >
                <p className={cn('font-medium', !formData.isSubscription ? 'text-primary-700' : 'text-zinc-700')}>
                  单次购买
                </p>
                <p className="text-xs text-zinc-500">学员一次性付费购买全部课程</p>
              </button>
              <button
                onClick={() => handleInputChange('isSubscription', true)}
                className={cn(
                  'flex-1 rounded-xl border-2 p-4 text-left transition-all',
                  formData.isSubscription 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-zinc-200 hover:border-zinc-300'
                )}
              >
                <p className={cn('font-medium', formData.isSubscription ? 'text-primary-700' : 'text-zinc-700')}>
                  订阅模式
                </p>
                <p className="text-xs text-zinc-500">学员按月付费，持续获得更新</p>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  {formData.isSubscription ? '单月价格' : '课程价格'} (元) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="input-field mt-1.5"
                />
              </div>
              {formData.isSubscription && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700">年订阅价格 (元)</label>
                  <input
                    type="number"
                    value={formData.subscriptionPrice}
                    onChange={(e) => handleInputChange('subscriptionPrice', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input-field mt-1.5"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">章节管理</h3>
              <button
                onClick={handleAddChapter}
                disabled={isNew}
                className="btn-accent gap-2 px-4 py-2 text-sm disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                添加章节
              </button>
            </div>

            {isNew && (
              <div className="rounded-xl bg-amber-50 p-4 text-amber-700">
                <p className="text-sm">请先保存课程后再添加章节</p>
              </div>
            )}

            {chapters.length === 0 && !isNew ? (
              <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center">
                <p className="text-zinc-500">暂无章节，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-100 p-4 transition-colors hover:bg-zinc-50"
                  >
                    <button className="cursor-grab text-zinc-400 hover:text-zinc-600">
                      <GripVertical className="h-5 w-5" />
                    </button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900">{chapter.title}</p>
                      <p className="text-xs text-zinc-500">
                        时长: {Math.floor(chapter.duration / 60)}分{chapter.duration % 60}秒
                        {chapter.isFree && <span className="ml-2 text-green-600">· 免费试看</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditChapter(chapter)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-primary-50 hover:text-primary-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900">操作</h3>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-secondary w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : '保存草稿'}
              </button>
              {!isNew && currentCourse?.status === 'draft' && (
                <button
                  onClick={handleSubmitReview}
                  className="btn-primary w-full gap-2"
                >
                  <Send className="h-4 w-4" />
                  提交审核
                </button>
              )}
            </div>
          </div>

          {currentCourse && (
            <div className="card p-6 space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900">课程状态</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">状态</span>
                  <span className="badge status-published">{currentCourse.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">章节数</span>
                  <span className="font-medium text-zinc-900">{chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">学生数</span>
                  <span className="font-medium text-zinc-900">{currentCourse.studentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">创建时间</span>
                  <span className="font-medium text-zinc-900">
                    {new Date(currentCourse.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">
                {editingChapter?.id ? '编辑章节' : '添加章节'}
              </h3>
              <button
                onClick={() => {
                  setShowChapterModal(false);
                  setEditingChapter(null);
                }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">章节标题 *</label>
                <input
                  type="text"
                  value={editingChapter?.title || ''}
                  onChange={(e) => setEditingChapter(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="请输入章节标题"
                  className="input-field mt-1.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700">视频链接</label>
                <input
                  type="text"
                  value={editingChapter?.videoUrl || ''}
                  onChange={(e) => setEditingChapter(prev => prev ? { ...prev, videoUrl: e.target.value } : null)}
                  placeholder="请输入视频URL"
                  className="input-field mt-1.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700">时长 (秒)</label>
                <input
                  type="number"
                  value={editingChapter?.duration || 0}
                  onChange={(e) => setEditingChapter(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
                  min="0"
                  className="input-field mt-1.5"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingChapter?.isFree || false}
                  onChange={(e) => setEditingChapter(prev => prev ? { ...prev, isFree: e.target.checked } : null)}
                  className="h-4 w-4 rounded border-zinc-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-zinc-700">设为免费试看章节</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowChapterModal(false);
                  setEditingChapter(null);
                }}
                className="btn-secondary px-4 py-2 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSaveChapter}
                className="btn-primary px-4 py-2 text-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
