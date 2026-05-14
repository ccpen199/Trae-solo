import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createArticle, updateArticle } from '../api/articles';
import { getCategories } from '../api/categories';
import { saveDraft, getDraft, deleteDraft } from '../api/drafts';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { PageLoading } from '../components/Loading';
import { ErrorState } from '../components/EmptyState';
import { FileText, Save, Send, Trash2, Clock } from 'lucide-react';
import dayjs from 'dayjs';

const DRAFT_AUTO_SAVE_INTERVAL = 30000;

export default function CreateArticle() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToastStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  const autoSaveTimerRef = useRef(null);
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const tagsRef = useRef(tags);
  const categoryRef = useRef(categoryId);

  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
    tagsRef.current = tags;
    categoryRef.current = categoryId;
  }, [title, content, tags, categoryId]);

  const loadDraft = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesRes, draftRes] = await Promise.all([
        getCategories(),
        getDraft('article'),
      ]);

      if (categoriesRes?.success) {
        setCategories(categoriesRes.data || []);
        if (categoriesRes.data?.length > 0) {
          setCategoryId(String(categoriesRes.data[0].id));
        }
      }

      if (draftRes?.success && draftRes.data) {
        const draft = draftRes.data;
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setTags(draft.tags || '');
        if (draft.categoryId) {
          setCategoryId(String(draft.categoryId));
        }
        setHasDraft(true);
        setLastSaved(draft.updatedAt);
      }
    } catch (err) {
      toast.error(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const saveCurrentDraft = useCallback(async () => {
    if (!user) return;
    const currentTitle = titleRef.current;
    const currentContent = contentRef.current;
    const currentTags = tagsRef.current;
    const currentCategory = categoryRef.current;

    if (!currentTitle.trim() && !currentContent.trim()) return;

    setSavingDraft(true);
    try {
      const res = await saveDraft('article', {
        title: currentTitle,
        content: currentContent,
        tags: currentTags,
        categoryId: currentCategory ? parseInt(currentCategory) : null,
      });
      if (res?.success) {
        setHasDraft(true);
        setLastSaved(new Date().toISOString());
      }
    } catch (err) {
    } finally {
      setSavingDraft(false);
    }
  }, [user]);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(saveCurrentDraft, DRAFT_AUTO_SAVE_INTERVAL);
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveCurrentDraft]);

  useEffect(() => {
    return () => {
      saveCurrentDraft();
    };
  }, [saveCurrentDraft]);

  const handleManualSave = async () => {
    await saveCurrentDraft();
    toast.success('草稿已保存');
  };

  const handleDiscardDraft = async () => {
    if (!confirm('确定要丢弃当前草稿吗？此操作不可撤销。')) return;
    try {
      await deleteDraft('article');
      setTitle('');
      setContent('');
      setTags('');
      if (categories.length > 0) {
        setCategoryId(String(categories[0].id));
      }
      setHasDraft(false);
      setLastSaved(null);
      toast.success('草稿已丢弃');
    } catch (err) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }
    if (!content.trim()) {
      toast.error('请输入内容');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createArticle({
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId ? parseInt(categoryId) : null,
        tags: tags.trim(),
      });
      if (res?.success) {
        await deleteDraft('article');
        toast.success('文章发布成功');
        navigate(`/article/${res.data.id}`);
      }
    } catch (err) {
      toast.error(err.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">发布文章</h1>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} />
              {savingDraft ? '保存中...' : `已保存于 ${dayjs(lastSaved).format('HH:mm')}`}
            </span>
          )}
          <button
            onClick={handleManualSave}
            disabled={savingDraft}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <Save size={14} />
            保存草稿
          </button>
          {hasDraft && (
            <button
              onClick={handleDiscardDraft}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 bg-red-50 rounded-lg"
            >
              <Trash2 size={14} />
              丢弃
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入文章标题"
            className="w-full text-2xl font-bold px-0 py-2 border-0 border-b border-gray-200 focus:outline-none focus:border-blue-500 rounded-none"
          />
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">标签（逗号分隔）</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="产品设计, 用户体验"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">正文</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请输入文章内容..."
            rows={16}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {submitting ? '发布中...' : '发布文章'}
          </button>
        </div>
      </form>
    </div>
  );
}
