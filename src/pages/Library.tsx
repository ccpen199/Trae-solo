import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Search, X } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { cn } from '@/lib/utils';
import type { BookStatus } from '@/types';

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
    fetchMetadataByISBN,
  } = useBookStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [isbnSearch, setIsbnSearch] = useState('');
  const [isbnSearching, setIsbnSearching] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    authors: '',
    publisher: '',
    isbn: '',
    totalPages: 0,
    category: '',
    tagIds: [] as string[],
    coverImageData: '',
    status: 'not_started' as BookStatus,
    currentPage: 0,
  });

  useEffect(() => {
    loadBooks();
    loadTags();
  }, []);

  const books = getFilteredBooks();

  const handleISBNFetch = async () => {
    if (!isbnSearch.trim()) return;
    setIsbnSearching(true);
    try {
      const meta = await fetchMetadataByISBN(isbnSearch);
      if (meta) {
        setForm(prev => ({
          ...prev,
          title: meta.title || prev.title,
          authors: meta.authors?.join(', ') || prev.authors,
          publisher: meta.publisher || prev.publisher,
          isbn: isbnSearch,
          totalPages: meta.totalPages || prev.totalPages,
          category: meta.category || prev.category,
          coverImageData: meta.coverImage || prev.coverImageData,
        }));
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
    const colors = ['#3B5998', '#4A8B7A', '#B8860B', '#C41E3A', '#5B6ABF'];
    const color = colors[tags.length % colors.length];
    const id = await addTag(newTagInput.trim(), color);
    setForm(prev => ({ ...prev, tagIds: [...prev.tagIds, id] }));
    setNewTagInput('');
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    const bookId = await addBook({
      title: form.title.trim(),
      authors: form.authors.split(/[,，]/).map(a => a.trim()).filter(Boolean),
      publisher: form.publisher.trim() || undefined,
      isbn13: form.isbn.trim() || undefined,
      totalPages: form.totalPages,
      currentPage: form.currentPage,
      category: form.category.trim() || undefined,
      tagIds: form.tagIds,
      coverImage: form.coverImageData || undefined,
      coverImageData: form.coverImageData || undefined,
      status: form.status,
      startDate: form.status !== 'not_started' ? new Date().toISOString() : undefined,
    });
    setShowAddModal(false);
    resetForm();
    navigate(`/library/${bookId}`);
  };

  const resetForm = () => {
    setForm({
      title: '',
      authors: '',
      publisher: '',
      isbn: '',
      totalPages: 0,
      category: '',
      tagIds: [],
      coverImageData: '',
      status: 'not_started',
      currentPage: 0,
    });
    setIsbnSearch('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="title-serif text-2xl">书籍库</h1>
        <button className="btn-gold" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          添加书籍
        </button>
      </div>

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
                    ? 'border-current'
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
                  'card-parchment-solid p-4 cursor-pointer',
                  'hover:-translate-y-1 hover:shadow-hover transition-all',
                  'animate-fade-in-up',
                  `stagger-${Math.min(idx % 6 + 1, 6)}`
                )}
                onClick={() => navigate(`/library/${book.id}`)}
              >
                <div className="aspect-[3/4] bg-ink-200 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  {book.coverImageData || book.coverImage ? (
                    <img
                      src={book.coverImageData || book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-10 h-10 text-ink-400" />
                  )}
                </div>
                <h3 className="font-serif font-medium text-sm text-ink-800 line-clamp-2 mb-1">
                  {book.title}
                </h3>
                <p className="text-xs text-ink-400 line-clamp-1 mb-2">
                  {book.authors.join(', ')}
                </p>
                <div className="w-full h-1.5 bg-ink-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-classic-gold rounded-full transition-all duration-500"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={statusInfo.cls}>{statusInfo.label}</span>
                  {bookTags.map(tag => (
                    <span
                      key={tag.id}
                      className="badge text-[10px]"
                      style={{ color: tag.color, backgroundColor: `${tag.color}15` }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-parchment-100 rounded-2xl shadow-hover w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
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
                  placeholder="输入ISBN"
                  value={isbnSearch}
                  onChange={e => setIsbnSearch(e.target.value)}
                />
                <button
                  className="btn-gold whitespace-nowrap"
                  onClick={handleISBNFetch}
                  disabled={isbnSearching}
                >
                  {isbnSearching ? '搜索中…' : '搜索补全'}
                </button>
              </div>

              <div className="flex gap-4">
                <div
                  className="w-24 h-32 bg-ink-200 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0 overflow-hidden border-2 border-dashed border-[var(--border-subtle)] hover:border-classic-gold/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {form.coverImageData ? (
                    <img src={form.coverImageData} alt="封面" className="w-full h-full object-cover" />
                  ) : (
                    <Plus className="w-6 h-6 text-ink-400" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
                <div className="flex-1 space-y-3">
                  <input
                    className="input-field"
                    placeholder="书名 *"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                  <input
                    className="input-field"
                    placeholder="作者（逗号分隔）"
                    value={form.authors}
                    onChange={e => setForm(p => ({ ...p, authors: e.target.value }))}
                  />
                </div>
              </div>

              <input
                className="input-field"
                placeholder="出版社"
                value={form.publisher}
                onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))}
              />
              <input
                className="input-field"
                placeholder="ISBN"
                value={form.isbn}
                onChange={e => setForm(p => ({ ...p, isbn: e.target.value }))}
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  className="input-field flex-1"
                  placeholder="总页数"
                  value={form.totalPages || ''}
                  onChange={e => setForm(p => ({ ...p, totalPages: Number(e.target.value) }))}
                />
                <input
                  className="input-field flex-1"
                  placeholder="分类"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-600 mb-2">标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer',
                        form.tagIds.includes(tag.id)
                          ? 'border-current'
                          : 'border-transparent hover:border-classic-gold/20 bg-parchment-200/40'
                      )}
                      style={{
                        color: form.tagIds.includes(tag.id) ? tag.color : undefined,
                        backgroundColor: form.tagIds.includes(tag.id) ? `${tag.color}15` : undefined,
                      }}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="新建标签"
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
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
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
