import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Pencil, ChevronDown, ChevronUp, Trash2, ArrowLeft } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { useNoteStore } from '@/stores/noteStore';
import { db } from '@/db';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import type { Book, BookStatus, PageAnchor } from '@/types';

const STATUS_MAP: Record<BookStatus, { label: string; cls: string }> = {
  not_started: { label: '未开始', cls: 'badge-blue' },
  reading: { label: '在读', cls: 'badge-gold' },
  paused: { label: '暂停', cls: 'badge-blue' },
  completed: { label: '已完', cls: 'badge-green' },
  abandoned: { label: '弃读', cls: 'badge-red' },
};

interface NoteWithPage {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  pageNumber?: number;
}

export default function BookDetail() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { tags, updateBook, deleteBook } = useBookStore();
  const { loadNotes, notes } = useNoteStore();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const [editForm, setEditForm] = useState({
    title: '',
    authors: '',
    publisher: '',
    isbn13: '',
    category: '',
    totalPages: 0,
    status: 'not_started' as BookStatus,
  });

  const [pageAnchors, setPageAnchors] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      setLoading(true);
      const b = await db.books.get(bookId);
      if (!b) { setLoading(false); return; }
      setBook(b);
      setEditForm({
        title: b.title,
        authors: b.authors.join(', '),
        publisher: b.publisher || '',
        isbn13: b.isbn13 || '',
        category: b.category || '',
        totalPages: b.totalPages,
        status: b.status,
      });
      await loadNotes(bookId);

      const anchors = await db.pageAnchors.toArray();
      const anchorMap = new Map<string, number>();
      for (const a of anchors) {
        const note = notes.find(n => n.id === a.noteId);
        if (note && note.bookId === bookId) {
          anchorMap.set(a.noteId, a.pageNumber);
        }
      }

      const allAnchors = await db.pageAnchors.toArray();
      const bookNoteIds = new Set((await db.notes.where('bookId').equals(bookId).toArray()).map(n => n.id));
      const map = new Map<string, number>();
      for (const a of allAnchors) {
        if (bookNoteIds.has(a.noteId)) {
          map.set(a.noteId, a.pageNumber);
        }
      }
      setPageAnchors(map);

      setLoading(false);
    })();
  }, [bookId]);

  const bookNotes: NoteWithPage[] = notes
    .filter(n => n.bookId === bookId)
    .map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      createdAt: typeof n.createdAt === 'string' ? n.createdAt : String(n.createdAt),
      pageNumber: pageAnchors.get(n.id),
    }))
    .sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0));

  const handlePageChange = async (page: number) => {
    if (!book || !bookId) return;
    const clamped = Math.max(0, Math.min(page, book.totalPages));
    await updateBook(bookId, { currentPage: clamped });
    setBook(prev => prev ? { ...prev, currentPage: clamped } : null);
  };

  const handleDateChange = async (field: 'startDate' | 'endDate', value: string) => {
    if (!bookId) return;
    const iso = value ? dayjs(value).toISOString() : undefined;
    await updateBook(bookId, { [field]: iso });
    setBook(prev => prev ? { ...prev, [field]: iso } : null);
  };

  const handleSaveEdit = async () => {
    if (!bookId) return;
    await updateBook(bookId, {
      title: editForm.title,
      authors: editForm.authors.split(/[,，]/).map(a => a.trim()).filter(Boolean),
      publisher: editForm.publisher || undefined,
      isbn13: editForm.isbn13 || undefined,
      category: editForm.category || undefined,
      totalPages: editForm.totalPages,
      status: editForm.status,
    });
    const updated = await db.books.get(bookId);
    if (updated) setBook(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!bookId) return;
    await deleteBook(bookId);
    navigate('/library');
  };

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-ink-400">加载中…</div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-400">
        <BookOpen className="w-12 h-12 mb-3 opacity-40" />
        <p>书籍未找到</p>
        <button className="btn-ghost mt-4" onClick={() => navigate('/library')}>返回书籍库</button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[book.status];
  const bookTags = tags.filter(t => book.tagIds.includes(t.id));
  const progress = book.totalPages > 0
    ? Math.round((book.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <button
        className="btn-ghost -ml-2 mb-2"
        onClick={() => navigate('/library')}
      >
        <ArrowLeft className="w-4 h-4" />
        返回书籍库
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-shrink-0">
          <div className="w-64 aspect-[3/4] bg-ink-200 rounded-xl shadow-book overflow-hidden">
            {book.coverImageData || book.coverImage ? (
              <img
                src={book.coverImageData || book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-ink-400" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <input
                className="input-field text-xl font-serif font-semibold"
                value={editForm.title}
                onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
              />
              <input
                className="input-field"
                placeholder="作者（逗号分隔）"
                value={editForm.authors}
                onChange={e => setEditForm(p => ({ ...p, authors: e.target.value }))}
              />
              <input
                className="input-field"
                placeholder="出版社"
                value={editForm.publisher}
                onChange={e => setEditForm(p => ({ ...p, publisher: e.target.value }))}
              />
              <input
                className="input-field"
                placeholder="ISBN"
                value={editForm.isbn13}
                onChange={e => setEditForm(p => ({ ...p, isbn13: e.target.value }))}
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  className="input-field flex-1"
                  placeholder="总页数"
                  value={editForm.totalPages || ''}
                  onChange={e => setEditForm(p => ({ ...p, totalPages: Number(e.target.value) }))}
                />
                <input
                  className="input-field flex-1"
                  placeholder="分类"
                  value={editForm.category}
                  onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                />
              </div>
              <select
                className="input-field"
                value={editForm.status}
                onChange={e => setEditForm(p => ({ ...p, status: e.target.value as BookStatus }))}
              >
                <option value="not_started">未开始</option>
                <option value="reading">在读</option>
                <option value="paused">暂停</option>
                <option value="completed">已完</option>
                <option value="abandoned">弃读</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button className="btn-gold" onClick={handleSaveEdit}>保存</button>
                <button className="btn-ghost" onClick={() => setEditing(false)}>取消</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="title-serif text-3xl">{book.title}</h1>
                <button className="btn-ghost" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4" />
                  编辑
                </button>
              </div>
              {book.subtitle && (
                <p className="text-ink-400 text-sm mb-3">{book.subtitle}</p>
              )}
              <div className="space-y-2 text-sm">
                <p><span className="text-ink-400">作者：</span>{book.authors.join(', ')}</p>
                {book.publisher && <p><span className="text-ink-400">出版社：</span>{book.publisher}</p>}
                {book.isbn13 && <p><span className="text-ink-400">ISBN：</span>{book.isbn13}</p>}
                {book.category && <p><span className="text-ink-400">分类：</span>{book.category}</p>}
              </div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className={statusInfo.cls}>{statusInfo.label}</span>
                {bookTags.map(tag => (
                  <span
                    key={tag.id}
                    className="badge"
                    style={{ color: tag.color, backgroundColor: `${tag.color}15` }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ink-divider" />

      <section>
        <h2 className="title-serif text-lg mb-4">阅读进度</h2>
        <div className="space-y-4">
          <div className="w-full h-3 bg-ink-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-gradient rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-ink-500">
            <span>第 {book.currentPage} / {book.totalPages} 页</span>
            <span>{progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={book.totalPages}
            value={book.currentPage}
            onChange={e => handlePageChange(Number(e.target.value))}
            className="w-full accent-classic-gold"
          />
          <div className="flex gap-6 flex-wrap">
            <div>
              <label className="block text-xs text-ink-400 mb-1">开始日期</label>
              <input
                type="date"
                className="input-field w-auto"
                value={book.startDate ? dayjs(book.startDate).format('YYYY-MM-DD') : ''}
                onChange={e => handleDateChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1">结束日期</label>
              <input
                type="date"
                className="input-field w-auto"
                value={book.endDate ? dayjs(book.endDate).format('YYYY-MM-DD') : ''}
                onChange={e => handleDateChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="ink-divider" />

      <section>
        <h2 className="title-serif text-lg mb-4">笔记时间线</h2>
        {bookNotes.length === 0 ? (
          <p className="text-ink-400 text-sm py-6 text-center">暂无笔记</p>
        ) : (
          <div className="space-y-3">
            {bookNotes.map(note => {
              const expanded = expandedNotes.has(note.id);
              return (
                <div key={note.id} className="card-parchment-solid p-4">
                  <button
                    className="w-full flex items-center gap-3 text-left"
                    onClick={() => toggleNote(note.id)}
                  >
                    {note.pageNumber != null && (
                      <span className="badge-gold flex-shrink-0">P.{note.pageNumber}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-ink-800 truncate">
                        {note.title || '无标题笔记'}
                      </h4>
                      {!expanded && (
                        <p className="text-xs text-ink-400 truncate mt-0.5">
                          {note.content}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-ink-300 flex-shrink-0">
                      {dayjs(note.createdAt).format('MM/DD')}
                    </span>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-ink-300 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ink-300 flex-shrink-0" />
                    )}
                  </button>
                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                      <p className="text-sm text-ink-600 whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="ink-divider" />

      <div className="flex justify-end">
        <button className="badge-red cursor-pointer" onClick={handleDelete}>
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          删除书籍
        </button>
      </div>
    </div>
  );
}
