import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Search, X, CheckCircle2, AlertCircle, Trash2, Edit3, BookMarked, Hash, Calendar, User, Building, FileText } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import type { BookStatus, Tag } from '@/types';

const STATUS_TABS: { label: string; value: BookStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '在读', value: 'reading' },
  { label: '暂停', value: 'paused' },
  { label: '已完', value: 'completed' },
  { label: '弃读', value: 'abandoned' },
];

const STATUS_MAP: Record<BookStatus, { label: string; cls: string }> = {
  not_started: { label: '未开始', cls: 'badge-blue' },
  reading: { label: '在读', cls: 'badge-gold' },
  paused: { label: '暂停', cls: 'badge-blue' },
  completed: { label: '已完', cls: 'badge-green' },
  abandoned: { label: '弃读', cls: 'badge-red' },
};

type ToastType = 'success' | 'error' | 'info';

export default function Library() {
  const navigate = useNavigate();
  const {
    tags,
    filters,
    loading,
    loadBooks,
    loadTags,
    setFilters,
    getFilteredBooks,
    addBook,
    addTag,
    deleteTag,
    fetchMetadataByISBN,
    updateBook,
  } = useBookStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [isbnSearch, setIsbnSearch] = useState('');
  const [isbnSearching, setIsbnSearching] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [fetchedMeta, setFetchedMeta] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    authors: '',
    publisher: '',
    publishDate: '',
    isbn: '',
    isbn10: '',
    totalPages: 0,
    category: '',
    summary: '',
    tagIds: [] as string[],
    coverImageData: '',
    status: 'not_started' as BookStatus,
    currentPage: 0,
  });

  useEffect(() => {
    loadBooks();
    loadTags();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const books = getFilteredBooks();
  const activeFilterTag = tags.find(t => t.id === filters.tagId);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const handleISBNFetch = async () => {
    if (!isbnSearch.trim()) return;
    setIsbnSearching(true);
    setFetchedMeta(null);
    try {
      const meta = await fetchMetadataByISBN(isbnSearch);
      if (meta) {
        setFetchedMeta(meta);
        setForm(prev => ({
          ...prev,
          title: meta.title || prev.title,
          subtitle: meta.subtitle || prev.subtitle,
          authors: meta.authors?.join(', ') || prev.authors,
          publisher: meta.publisher || prev.publisher,
          publishDate: meta.publishDate || prev.publishDate,
          isbn: meta.isbn13 || isbnSearch,
          isbn10: meta.isbn10 || prev.isbn10,
          totalPages: meta.totalPages || prev.totalPages,
          category: meta.category || prev.category,
          summary: meta.summary || prev.summary,
          coverImageData: meta.coverImage || prev.coverImageData,
        }));
        showToast(`已补全《${meta.title || '书籍'}》元数据`, 'success');
      } else {
        showToast('未找到对应ISBN的书籍信息', 'error');
      }
    } finally {
      setIsbnSearching(false);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({ ...prev, coverImageData: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleTagToggle = (tagId: string) => {
    setForm(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const handleAddTag = async () => {
    if (!newTagInput.trim()) return;
    if (tags.some(t => t.name === newTagInput.trim())) {
      showToast('标签已存在', 'error');
      return;
    }
    const colors = ['#3B5998', '#4A8B7A', '#B8860B', '#C41E3A', '#5B6ABF', '#7B4F9E', '#2E8B57', '#CD853F'];
    const color = colors[tags.length % colors.length];
    const id = await addTag(newTagInput.trim(), color);
    if (id) {
      setForm(prev => ({ ...prev, tagIds: [...prev.tagIds, id] }));
      showToast(`标签「${newTagInput.trim()}」已添加`, 'success');
    }
    setNewTagInput('');
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!confirm(`确定删除标签「${tag.name}」吗？`)) return;
    await deleteTag(tag.id);
    showToast(`标签「${tag.name}」已删除`, 'info');
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast('请输入书名', 'error');
      return;
    }
    const bookId = await addBook({
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      authors: form.authors.split(/[,，]/).map(a => a.trim()).filter(Boolean),
      publisher: form.publisher.trim() || undefined,
      publishDate: form.publishDate.trim() || undefined,
      isbn13: form.isbn.trim() || undefined,
      isbn10: form.isbn10.trim() || undefined,
      totalPages: form.totalPages,
      currentPage: form.currentPage,
      category: form.category.trim() || undefined,
      summary: form.summary.trim() || undefined,
      tagIds: form.tagIds,
      coverImage: form.coverImageData || undefined,
      coverImageData: form.coverImageData || undefined,
      status: form.status,
      startDate: form.status !== 'not_started' ? new Date().toISOString() : undefined,
    });
    if (bookId) {
      showToast(`《${form.title.trim()}》已添加到书籍库`, 'success');
      setShowAddModal(false);
      resetForm();
      navigate(`/library/${bookId}`);
    } else {
      showToast('保存失败，请重试', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      subtitle: '',
      authors: '',
      publisher: '',
      publishDate: '',
      isbn: '',
      isbn10: '',
      totalPages: 0,
      category: '',
      summary: '',
      tagIds: [],
      coverImageData: '',
      status: 'not_started',
      currentPage: 0,
    });
    setIsbnSearch('');
    setFetchedMeta(null);
  };

  const MetaField = ({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string | number | undefined; highlight?: boolean }) => (
    value ? (
      <div className={cn(
        'flex items-start gap-2 p-2.5 rounded-lg',
        highlight ? 'bg-classic-gold/5 border border-classic-gold/20' : 'bg-parchment-50'
      )}>
        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', highlight ? 'text-classic-gold' : 'text-ink-400')} />
        <div className="min-w-0">
          <div className="text-[10px] text-ink-400 uppercase tracking-wider mb-0.5">{label}</div>
          <div className={cn('text-sm truncate', highlight ? 'text-ink-800 font-medium' : 'text-ink-700')}>
            {value}
          </div>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in-up',
          toast.type === 'success' && 'bg-classic-turquoise/95 text-white',
          toast.type === 'error' && 'bg-classic-cinnabar/95 text-white',
          toast.type === 'info' && 'bg-classic-blue/95 text-white'
        )}>
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="title-serif text-2xl">书籍库</h1>
          <p className="text-sm text-ink-400 mt-1">共 {books.length} 本书 · {tags.length} 个标签</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setShowTagManager(true)}>
            <Edit3 className="w-4 h-4" />
            管理标签
          </button>
          <button className="btn-gold" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            添加书籍
          </button>
        </div>
      </div>

      {activeFilterTag && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-classic-gold/5 border border-classic-gold/20 animate-fade-in-up">
          <BookMarked className="w-4 h-4 text-classic-gold" />
          <span className="text-sm">正在筛选标签：</span>
          <span
            className="text-sm font-medium px-2 py-0.5 rounded-full"
            style={{ color: activeFilterTag.color, backgroundColor: `${activeFilterTag.color}15` }}
          >
            {activeFilterTag.name}
          </span>
          <span className="text-xs text-ink-400 ml-auto">
            找到 {books.length} 本相关书籍
          </span>
          <button
            className="p-1 rounded hover:bg-ink-100 transition-colors"
            onClick={() => setFilters({ tagId: null })}
          >
            <X className="w-3.5 h-3.5 text-ink-400" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input
            className="input-field pl-10"
            placeholder="搜索书名、作者或ISBN…"
            value={filters.search}
            onChange={e => setFilters({ search: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              className={cn(
                'tab-item',
                filters.status === tab.value && 'tab-item-active'
              )}
              onClick={() => setFilters({ status: tab.value })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer',
                !filters.tagId
                  ? 'bg-classic-gold/10 text-classic-gold border-classic-gold/20'
                  : 'bg-parchment-200/40 text-ink-400 border-transparent hover:border-classic-gold/20'
              )}
              onClick={() => setFilters({ tagId: null })}
            >
              全部标签
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer',
                  filters.tagId === tag.id
                    ? 'border-current shadow-md'
                    : 'border-transparent hover:border-classic-gold/20'
                )}
                style={{
                  color: filters.tagId === tag.id ? tag.color : undefined,
                  backgroundColor: filters.tagId === tag.id ? `${tag.color}15` : undefined,
                }}
                onClick={() => setFilters({ tagId: filters.tagId === tag.id ? null : tag.id })}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-ink-400">
          加载中…
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-ink-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-40" />
          <p>暂无书籍，点击右上角添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book, idx) => {
            const statusInfo = STATUS_MAP[book.status];
            const bookTags = tags.filter(t => book.tagIds.includes(t.id));
            return (
              <div
                key={book.id}
                className={cn(
                  'card-parchment-solid p-4 cursor-pointer group',
                  'hover:-translate-y-1 hover:shadow-hover transition-all',
                  'animate-fade-in-up',
                  `stagger-${Math.min(idx % 6 + 1, 6)}`
                )}
                onClick={() => navigate(`/library/${book.id}`)}
              >
                <div className="aspect-[3/4] bg-ink-200 rounded-lg flex items-center justify-center mb-3 overflow-hidden relative group-hover:shadow-lg transition-shadow">
                  {book.coverImageData || book.coverImage ? (
                    <img
                      src={book.coverImageData || book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-10 h-10 text-ink-400" />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={statusInfo.cls}>{statusInfo.label}</span>
                  </div>
                </div>
                <h3 className="font-serif font-medium text-sm text-ink-800 line-clamp-2 mb-1 min-h-[2.5rem]">
                  {book.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-ink-400 mb-2">
                  <User className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{book.authors.join('、')}</span>
                </div>
                <div className="w-full h-1.5 bg-ink-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-classic-gold rounded-full transition-all duration-500"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-ink-400 mb-2">
                  <span>第 {book.currentPage || 0} / {book.totalPages || '?'} 页</span>
                  <span>{book.progress}%</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {bookTags.slice(0, 3).map(tag => (
                    <span
                      key={tag.id}
                      className="badge text-[10px]"
                      style={{ color: tag.color, backgroundColor: `${tag.color}15` }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {bookTags.length > 3 && (
                    <span className="text-[10px] text-ink-400">+{bookTags.length - 3}</span>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-parchment-200 text-[10px] text-ink-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {dayjs(book.updatedAt).format('MM/DD')} 更新
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showTagManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTagManager(false)}>
          <div className="bg-parchment-100 rounded-2xl shadow-hover w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h2 className="title-serif text-lg">标签管理</h2>
              <button
                className="p-1 rounded-lg hover:bg-parchment-200/60 transition-colors"
                onClick={() => setShowTagManager(false)}
              >
                <X className="w-5 h-5 text-ink-400" />
              </button>
            </div>
            <div className="p-5">
              {tags.length === 0 ? (
                <div className="text-center py-8 text-ink-400 text-sm">
                  暂无标签，添加书籍时可创建新标签
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tags.map(tag => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-parchment-50 hover:bg-parchment-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium text-ink-800">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-400">
                          {books.filter(b => b.tagIds.includes(tag.id)).length} 本书
                        </span>
                        <button
                          className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-ink-100 transition-all"
                          onClick={() => handleDeleteTag(tag)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-classic-cinnabar" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-parchment-100 rounded-2xl shadow-hover w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h2 className="title-serif text-lg">添加书籍</h2>
              <button
                className="p-1 rounded-lg hover:bg-parchment-200/60 transition-colors"
                onClick={() => { setShowAddModal(false); resetForm(); }}
              >
                <X className="w-5 h-5 text-ink-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="输入ISBN自动补全书籍信息"
                  value={isbnSearch}
                  onChange={e => setIsbnSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleISBNFetch()}
                />
                <button
                  className="btn-gold whitespace-nowrap"
                  onClick={handleISBNFetch}
                  disabled={isbnSearching}
                >
                  {isbnSearching ? '搜索中…' : '搜索补全'}
                </button>
              </div>

              {fetchedMeta && (
                <div className="p-3 rounded-xl bg-classic-turquoise/5 border border-classic-turquoise/20 flex items-center gap-2 animate-fade-in-up">
                  <CheckCircle2 className="w-4 h-4 text-classic-turquoise flex-shrink-0" />
                  <span className="text-sm text-ink-700">
                    已从 Google Books API 自动补全 <strong>{fetchedMeta.title}</strong> 的元数据
                  </span>
                </div>
              )}

              <div className="grid md:grid-cols-[160px_1fr] gap-5">
                <div className="space-y-3">
                  <div
                    className="aspect-[3/4] bg-ink-200 rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-[var(--border-subtle)] hover:border-classic-gold/40 transition-colors relative group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {form.coverImageData ? (
                      <>
                        <img src={form.coverImageData} alt="封面" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs">点击更换</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Plus className="w-8 h-8 text-ink-400 mb-1" />
                        <span className="text-xs text-ink-400">上传封面</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />

                  <div className="space-y-2">
                    <MetaField icon={FileText} label="总页数" value={form.totalPages || undefined} />
                    <MetaField icon={Hash} label="ISBN-13" value={form.isbn || undefined} highlight={!!form.isbn} />
                    {form.isbn10 && <MetaField icon={Hash} label="ISBN-10" value={form.isbn10} />}
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    className="input-field text-lg font-serif"
                    placeholder="书名 *"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                  <input
                    className="input-field"
                    placeholder="副标题"
                    value={form.subtitle}
                    onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                  />
                  <input
                    className="input-field"
                    placeholder="作者（逗号分隔）"
                    value={form.authors}
                    onChange={e => setForm(p => ({ ...p, authors: e.target.value }))}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="input-field"
                      placeholder="出版社"
                      value={form.publisher}
                      onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))}
                    />
                    <input
                      className="input-field"
                      placeholder="出版日期"
                      value={form.publishDate}
                      onChange={e => setForm(p => ({ ...p, publishDate: e.target.value }))}
                    />
                  </div>

                  <input
                    className="input-field"
                    placeholder="分类 / 主题"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-ink-400 mb-1.5 block">当前页码</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="0"
                        value={form.currentPage || ''}
                        onChange={e => setForm(p => ({ ...p, currentPage: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ink-400 mb-1.5 block">阅读状态</label>
                      <select
                        className="input-field"
                        value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value as BookStatus }))}
                      >
                        <option value="not_started">未开始</option>
                        <option value="reading">在读</option>
                        <option value="paused">暂停</option>
                        <option value="completed">已完成</option>
                        <option value="abandoned">弃读</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    className="input-field min-h-[80px] resize-none"
                    placeholder="书籍简介 / 备注"
                    value={form.summary}
                    onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-parchment-200">
                <label className="block text-sm font-medium text-ink-600 mb-2 flex items-center justify-between">
                  <span>自定义标签</span>
                  <span className="text-xs text-ink-400 font-normal">{form.tagIds.length} 个已选</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.length === 0 ? (
                    <p className="text-xs text-ink-400 py-1">还没有标签，输入下方新建</p>
                  ) : tags.map(tag => (
                    <button
                      key={tag.id}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer',
                        form.tagIds.includes(tag.id)
                          ? 'border-current shadow-sm'
                          : 'border-transparent hover:border-classic-gold/20 bg-parchment-200/40'
                      )}
                      style={{
                        color: form.tagIds.includes(tag.id) ? tag.color : undefined,
                        backgroundColor: form.tagIds.includes(tag.id) ? `${tag.color}15` : undefined,
                      }}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                      {form.tagIds.includes(tag.id) && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="新建标签，回车添加"
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <button className="btn-ghost" onClick={handleAddTag}>添加</button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-[var(--border-subtle)]">
              <button
                className="btn-ghost"
                onClick={() => { setShowAddModal(false); resetForm(); }}
              >
                取消
              </button>
              <button
                className="btn-gold"
                onClick={handleSave}
                disabled={!form.title.trim()}
              >
                保存到书籍库
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
