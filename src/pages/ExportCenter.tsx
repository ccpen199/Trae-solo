import { useState, useMemo, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '@/db';
import { useBookStore } from '@/stores/bookStore';
import type { Book, Note, OCRImage } from '@/types';
import dayjs from 'dayjs';
import { Download, Eye, Settings } from 'lucide-react';

type ExportScope = 'all' | 'books' | 'daterange';

interface ExportState {
  scope: ExportScope;
  selectedBookIds: string[];
  startDate: string;
  endDate: string;
  includeImages: boolean;
  step: 1 | 2 | 3;
  generating: boolean;
  progress: number;
}

export default function ExportCenter() {
  const { books, loadBooks } = useBookStore();
  const [state, setState] = useState<ExportState>({
    scope: 'all',
    selectedBookIds: [],
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    includeImages: false,
    step: 1,
    generating: false,
    progress: 0,
  });

  useState(() => {
    loadBooks();
  });

  const update = useCallback(
    (partial: Partial<ExportState>) =>
      setState((prev) => ({ ...prev, ...partial })),
    []
  );

  const toggleBook = useCallback(
    (bookId: string) => {
      setState((prev) => ({
        ...prev,
        selectedBookIds: prev.selectedBookIds.includes(bookId)
          ? prev.selectedBookIds.filter((id) => id !== bookId)
          : [...prev.selectedBookIds, bookId],
      }));
    },
    []
  );

  const filteredNotes = useMemo(async (): Promise<Note[]> => {
    let notes = await db.notes.toArray();
    if (state.scope === 'books') {
      notes = notes.filter(
        (n) => n.bookId && state.selectedBookIds.includes(n.bookId)
      );
    } else if (state.scope === 'daterange') {
      const start = dayjs(state.startDate).startOf('day').toISOString();
      const end = dayjs(state.endDate).endOf('day').toISOString();
      notes = notes.filter(
        (n) => n.createdAt >= start && n.createdAt <= end
      );
    }
    return notes;
  }, [state.scope, state.selectedBookIds, state.startDate, state.endDate]);

  const filteredBooks = useMemo(async (): Promise<Book[]> => {
    if (state.scope === 'all') return books;
    if (state.scope === 'books') {
      return books.filter((b) => state.selectedBookIds.includes(b.id));
    }
    const start = dayjs(state.startDate).startOf('day').toISOString();
    const end = dayjs(state.endDate).endOf('day').toISOString();
    return books.filter((b) => {
      const inRange =
        (b.startDate && b.startDate >= start && b.startDate <= end) ||
        (b.endDate && b.endDate >= start && b.endDate <= end);
      return inRange;
    });
  }, [books, state.scope, state.selectedBookIds, state.startDate, state.endDate]);

  const previewMd = useMemo(async (): Promise<string> => {
    const [notesList, booksList] = await Promise.all([filteredNotes, filteredBooks]);
    const lines: string[] = [];

    lines.push('# 阅读笔记导出');
    lines.push('');
    lines.push(`> 导出时间: ${dayjs().format('YYYY-MM-DD HH:mm')}`);
    lines.push('');

    lines.push('---');
    lines.push('');
    lines.push('## 书目列表');
    lines.push('');
    for (const b of booksList) {
      lines.push(`### ${b.title}`);
      if (b.subtitle) lines.push(`*${b.subtitle}*`);
      lines.push(`- 作者: ${b.authors.join(', ')}`);
      if (b.publisher) lines.push(`- 出版社: ${b.publisher}`);
      lines.push(`- 进度: ${b.progress}% (${b.currentPage}/${b.totalPages})`);
      lines.push(`- 状态: ${b.status}`);
      if (b.category) lines.push(`- 分类: ${b.category}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## 笔记');
    lines.push('');

    const bookNotesMap = new Map<string, Note[]>();
    for (const n of notesList) {
      const key = n.bookId || 'unlinked';
      if (!bookNotesMap.has(key)) bookNotesMap.set(key, []);
      bookNotesMap.get(key)!.push(n);
    }

    for (const [bookId, bNotes] of bookNotesMap) {
      const book = booksList.find((b) => b.id === bookId);
      lines.push(`### 📖 ${book?.title || '未关联书目'}`);
      lines.push('');
      for (const n of bNotes) {
        if (n.title) lines.push(`#### ${n.title}`);
        if (n.content) lines.push(n.content);
        lines.push(`*${dayjs(n.createdAt).format('YYYY-MM-DD HH:mm')}*`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }, [filteredNotes, filteredBooks]);

  const attachmentInfo = useMemo(async () => {
    const notesList = await filteredNotes;
    const noteIds = notesList.map((n) => n.id);
    const allOcrImages = await db.ocrImages.toArray();
    const relatedImages = allOcrImages.filter(
      (img) => img.noteId && noteIds.includes(img.noteId)
    );
    const imageCount = relatedImages.length;
    const ocrSourceCount = notesList.filter((n) => n.sourceType === 'ocr').length;
    return { imageCount, ocrSourceCount };
  }, [filteredNotes]);

  const handleGenerate = useCallback(async () => {
    update({ generating: true, progress: 0 });

    try {
      const [notesList, booksList, mdText, attachInfo] = await Promise.all([
        filteredNotes,
        filteredBooks,
        previewMd,
        attachmentInfo,
      ]);

      const zip = new JSZip();
      update({ progress: 20 });

      zip.file('notes.md', mdText);

      update({ progress: 40 });

      const booksLines: string[] = [];
      booksLines.push('# 书籍列表');
      booksLines.push('');
      for (const b of booksList) {
        booksLines.push(`## ${b.title}`);
        if (b.subtitle) booksLines.push(`*${b.subtitle}*`);
        booksLines.push(`- 作者: ${b.authors.join(', ')}`);
        if (b.publisher) booksLines.push(`- 出版社: ${b.publisher}`);
        if (b.publishDate) booksLines.push(`- 出版日期: ${b.publishDate}`);
        if (b.isbn13) booksLines.push(`- ISBN: ${b.isbn13}`);
        if (b.category) booksLines.push(`- 分类: ${b.category}`);
        booksLines.push(`- 页数: ${b.totalPages}`);
        booksLines.push(`- 当前进度: ${b.currentPage}/${b.totalPages} (${b.progress}%)`);
        booksLines.push(`- 状态: ${b.status}`);
        if (b.startDate)
          booksLines.push(`- 开始日期: ${dayjs(b.startDate).format('YYYY-MM-DD')}`);
        if (b.endDate)
          booksLines.push(`- 完成日期: ${dayjs(b.endDate).format('YYYY-MM-DD')}`);
        if (b.summary) booksLines.push(`- 摘要: ${b.summary}`);
        booksLines.push('');
      }
      zip.file('books.md', booksLines.join('\n'));

      update({ progress: 60 });

      if (state.includeImages && attachInfo.imageCount > 0) {
        const imgFolder = zip.folder('images')!;
        const noteIds = notesList.map((n) => n.id);
        const allOcrImages = await db.ocrImages.toArray();
        const relatedImages = allOcrImages.filter(
          (img) => img.noteId && noteIds.includes(img.noteId)
        );

        for (let i = 0; i < relatedImages.length; i++) {
          const img = relatedImages[i];
          const base64 = img.dataUrl.split(',')[1];
          if (base64) {
            imgFolder.file(`${img.id}.png`, base64, { base64: true });
          }
          if (i % 5 === 0) {
            update({
              progress: 60 + Math.round((i / relatedImages.length) * 30),
            });
          }
        }
      }

      update({ progress: 90 });

      const blob = await zip.generateAsync({ type: 'blob' });
      update({ progress: 100 });

      const dateStr = dayjs().format('YYYY-MM-DD');
      saveAs(blob, `reading-export-${dateStr}.zip`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      update({ generating: false });
    }
  }, [filteredNotes, filteredBooks, previewMd, attachmentInfo, state.includeImages, update]);

  const [previewText, setPreviewText] = useState('');
  const [attachData, setAttachData] = useState({ imageCount: 0, ocrSourceCount: 0 });

  const loadPreview = useCallback(async () => {
    const md = await previewMd;
    const previewLines = md.split('\n').slice(0, 100);
    setPreviewText(previewLines.join('\n'));
    const info = await attachmentInfo;
    setAttachData(info);
  }, [previewMd, attachmentInfo]);

  return (
    <div className="space-y-6">
      <h1 className="title-serif text-2xl">数据导出</h1>

      <div className="card-parchment-solid p-6 space-y-5">
        <div className="flex items-center gap-2 text-ink-700 font-medium">
          <Settings size={16} />
          <span>步骤1 - 导出范围</span>
        </div>

        <div className="flex gap-3">
          {([
            { value: 'all', label: '全部数据' },
            { value: 'books', label: '指定书籍' },
            { value: 'daterange', label: '日期范围' },
          ] as { value: ExportScope; label: string }[]).map((opt) => (
            <label
              key={opt.value}
              className={`tab-item cursor-pointer ${
                state.scope === opt.value ? 'tab-item-active' : ''
              }`}
            >
              <input
                type="radio"
                name="scope"
                value={opt.value}
                checked={state.scope === opt.value}
                onChange={() =>
                  update({
                    scope: opt.value,
                    step: 1,
                  })
                }
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>

        {state.scope === 'books' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-auto p-1">
            {books.map((b) => (
              <label
                key={b.id}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  state.selectedBookIds.includes(b.id)
                    ? 'bg-classic-gold/10 border border-classic-gold/20'
                    : 'hover:bg-parchment-200/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={state.selectedBookIds.includes(b.id)}
                  onChange={() => toggleBook(b.id)}
                  className="accent-classic-gold"
                />
                <span className="text-ink-700 truncate">{b.title}</span>
              </label>
            ))}
          </div>
        )}

        {state.scope === 'daterange' && (
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={state.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
              className="input-field w-auto"
            />
            <span className="text-ink-400 text-sm">至</span>
            <input
              type="date"
              value={state.endDate}
              onChange={(e) => update({ endDate: e.target.value })}
              className="input-field w-auto"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-600">包含图片</span>
          <button
            onClick={() => update({ includeImages: !state.includeImages })}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              state.includeImages ? 'bg-classic-gold' : 'bg-parchment-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                state.includeImages ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <button
          className="btn-gold"
          onClick={() => {
            update({ step: 2 });
            loadPreview();
          }}
          disabled={
            state.scope === 'books' && state.selectedBookIds.length === 0
          }
        >
          下一步：预览
        </button>
      </div>

      {state.step >= 2 && (
        <div className="card-parchment-solid p-6 space-y-5">
          <div className="flex items-center gap-2 text-ink-700 font-medium">
            <Eye size={16} />
            <span>步骤2 - 预览</span>
          </div>

          <div>
            <h4 className="text-sm text-ink-500 mb-2">Markdown 结构预览</h4>
            <pre className="bg-ink-800 text-parchment-100 rounded-lg p-4 text-xs leading-relaxed overflow-auto max-h-[320px] font-mono">
              {previewText || '加载中...'}
            </pre>
          </div>

          <div>
            <h4 className="text-sm text-ink-500 mb-2">附件清单</h4>
            <div className="flex gap-6 text-sm text-ink-600">
              <span>
                图片数量: <strong>{attachData.imageCount}</strong>
              </span>
              <span>
                OCR 原始文件: <strong>{attachData.ocrSourceCount}</strong>
              </span>
            </div>
          </div>

          <button className="btn-gold" onClick={() => update({ step: 3 })}>
            下一步：下载
          </button>
        </div>
      )}

      {state.step >= 3 && (
        <div className="card-parchment-solid p-6 space-y-5">
          <div className="flex items-center gap-2 text-ink-700 font-medium">
            <Download size={16} />
            <span>步骤3 - 下载</span>
          </div>

          {state.generating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-ink-500">
                <span>正在生成...</span>
                <span>{state.progress}%</span>
              </div>
              <div className="w-full bg-parchment-300 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gold-gradient h-full rounded-full transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            className="btn-gold"
            onClick={handleGenerate}
            disabled={state.generating}
          >
            {state.generating ? '生成中...' : '生成并下载'}
          </button>
        </div>
      )}
    </div>
  );
}
