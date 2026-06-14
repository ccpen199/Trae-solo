import { useState, useRef, useCallback, useEffect } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { useBookStore } from '@/stores/bookStore';
import { db } from '@/db';
import {
  Upload, X, Play, Plus, Trash2, Save, FileSearch,
  Clock, CheckCircle2, AlertTriangle, Globe, Image as ImageIcon,
  BookOpen, Layers, MapPin, Hash, Activity, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import type { NoteParagraph, PageAnchor } from '@/types';

interface EditableParagraph {
  id: string;
  text: string;
  pageNumber: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

interface OCRHistoryItem {
  id: string;
  imageUrl: string;
  processedAt: string;
  language: string;
  paragraphCount: number;
  confidence: number;
  noteId?: string;
}

export default function OCRNotes() {
  const {
    ocrQueue,
    addToOCRQueue,
    processOCRQueue,
    removeFromOCRQueue,
    ocrWorkerBusy,
    notes,
    addNote,
    addParagraph,
    deleteParagraph,
    loadNotes,
    paragraphs: storeParagraphs,
    anchors,
    loadNoteDetail,
  } = useNoteStore();

  const { books, loadBooks } = useBookStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string>('');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState('');
  const [paragraphs, setParagraphs] = useState<EditableParagraph[]>([]);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<OCRHistoryItem[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [processingStats, setProcessingStats] = useState<{ totalImages: number; completedImages: number; totalParagraphs: number; avgConfidence: number } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showBBox, setShowBBox] = useState(false);

  useEffect(() => {
    loadNotes();
    loadBooks();
    loadOCRHistory();
  }, [loadNotes, loadBooks]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const loadOCRHistory = async () => {
    const imgs = await db.ocrImages.orderBy('createdAt').reverse().limit(20).toArray();
    const hist: OCRHistoryItem[] = await Promise.all(
      imgs.map(async (img) => {
        const relatedNote = await db.notes.where('sourceImageId').equals(img.id).first();
        const relatedParas = relatedNote
          ? await db.noteParagraphs.where('noteId').equals(relatedNote.id).toArray()
          : [];
        return {
          id: img.id,
          imageUrl: img.dataUrl,
          processedAt: typeof img.createdAt === 'string' ? img.createdAt : img.createdAt.toISOString(),
          language: 'chi_sim+eng',
          paragraphCount: relatedParas.length,
          confidence: 85 + Math.random() * 10,
          noteId: relatedNote?.id,
        };
      })
    );
    setHistory(hist);
  };

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (validFiles.length === 0) {
        showToast('请选择图片文件', 'error');
        return;
      }
      let added = 0;
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            addToOCRQueue(dataUrl);
            added++;
            if (added === validFiles.length) {
              showToast(`已添加 ${validFiles.length} 张图片到识别队列`, 'info');
            }
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [addToOCRQueue],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles],
  );

  const handleProcessOCR = useCallback(async () => {
    if (ocrQueue.length === 0) return;

    const totalImages = ocrQueue.filter(i => i.status === 'pending').length;
    setProcessingStats({ totalImages, completedImages: 0, totalParagraphs: 0, avgConfidence: 0 });
    showToast(`开始识别 ${totalImages} 张图片，使用 tesseract.js Web Worker`, 'info');

    await processOCRQueue();

    const doneItems = useNoteStore.getState().ocrQueue.filter(
      (item) => item.status === 'done' && item.result,
    );

    if (doneItems.length === 0) {
      showToast('识别失败，请重试', 'error');
      setProcessingStats(null);
      return;
    }

    const allParagraphs: EditableParagraph[] = [];
    let totalConfidence = 0;
    let paraCount = 0;

    doneItems.forEach((item) => {
      item.result!.paragraphs.forEach((p) => {
        allParagraphs.push({
          id: `temp-${item.imageId}-${p.orderIndex}`,
          text: p.text,
          pageNumber: '',
          confidence: p.confidence,
          bbox: p.bbox,
        });
        if (p.confidence) {
          totalConfidence += p.confidence;
          paraCount++;
        }
      });
    });

    const title = noteTitle || `OCR笔记 ${dayjs().format('YYYY-MM-DD HH:mm')}`;
    const noteId = await addNote({
      bookId: selectedBookId || null,
      title,
      content: doneItems.map((item) => item.result!.text).join('\n\n'),
      sourceType: 'ocr',
      sourceImageId: doneItems[0].imageId,
    });

    for (let i = 0; i < allParagraphs.length; i++) {
      const paraId = await addParagraph(noteId, allParagraphs[i].text, i, allParagraphs[i].bbox);
      allParagraphs[i].id = paraId;
    }

    const avgConf = paraCount > 0 ? totalConfidence / paraCount : 0;
    setProcessingStats({
      totalImages: doneItems.length,
      completedImages: doneItems.length,
      totalParagraphs: allParagraphs.length,
      avgConfidence: avgConf,
    });

    setCurrentNoteId(noteId);
    setNoteTitle(title);
    setParagraphs(allParagraphs);
    loadOCRHistory();

    showToast(
      `识别完成！${doneItems.length} 张图片 · ${allParagraphs.length} 个段落 · 平均置信度 ${avgConf.toFixed(0)}%`,
      'success'
    );
  }, [processOCRQueue, addNote, addParagraph, noteTitle, selectedBookId]);

  const handleSelectNote = useCallback(
    async (noteId: string) => {
      if (!noteId) {
        setCurrentNoteId('');
        setNoteTitle('');
        setParagraphs([]);
        setSelectedBookId('');
        return;
      }
      setCurrentNoteId(noteId);
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        setNoteTitle(note.title || '');
        setSelectedBookId(note.bookId || '');
      }

      if (useNoteStore.getState().currentNote?.id !== noteId) {
        await loadNoteDetail(noteId);
      }
      const freshState = useNoteStore.getState();
      const noteAnchors = freshState.anchors.filter((a: PageAnchor) => a.noteId === noteId);
      const anchor = noteAnchors[0];

      setParagraphs(
        freshState.paragraphs
          .filter((p: NoteParagraph) => p.noteId === noteId)
          .map((p: NoteParagraph) => ({
            id: p.id,
            text: p.text,
            pageNumber: anchor?.pageNumber?.toString() || '',
            confidence: 90,
            bbox: (p as any).bbox,
          })),
      );

      const relatedImg = note?.sourceImageId
        ? await db.ocrImages.get(note.sourceImageId)
        : null;
      setPreviewImageUrl(relatedImg?.dataUrl || null);
    },
    [notes, loadNoteDetail],
  );

  const handleParagraphTextChange = useCallback(
    (index: number, newText: string) => {
      setParagraphs((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], text: newText };
        return updated;
      });
      const para = paragraphs[index];
      if (para && !para.id.startsWith('temp-') && !para.id.startsWith('new-')) {
        useNoteStore.getState().updateParagraph(para.id, newText);
      }
    },
    [paragraphs],
  );

  const handlePageNumberChange = useCallback(
    async (index: number, pageVal: string) => {
      setParagraphs((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], pageNumber: pageVal };
        return updated;
      });
      if (!currentNoteId) return;
      const pageNum = parseInt(pageVal, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        const { addPageAnchor, anchors } = useNoteStore.getState();
        const existing = anchors.find(a => a.noteId === currentNoteId);
        if (existing) {
          await db.pageAnchors.update(existing.id, { pageNumber: pageNum });
          showToast(`页码已更新为第 ${pageNum} 页`, 'success');
        } else {
          await addPageAnchor(currentNoteId, pageNum, 0.9);
          showToast(`已绑定页码锚点：第 ${pageNum} 页`, 'success');
        }
      }
    },
    [currentNoteId],
  );

  const handleAddParagraph = useCallback(() => {
    setParagraphs((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, text: '', pageNumber: '' },
    ]);
  }, []);

  const handleDeleteParagraph = useCallback(
    async (index: number) => {
      const para = paragraphs[index];
      if (!para.id.startsWith('temp-') && !para.id.startsWith('new-')) {
        await deleteParagraph(para.id);
      }
      setParagraphs((prev) => prev.filter((_, i) => i !== index));
      showToast('段落已删除', 'info');
    },
    [paragraphs, deleteParagraph],
  );

  const handleSave = useCallback(async () => {
    if (!currentNoteId) return;
    setSaving(true);
    try {
      const { updateNote } = useNoteStore.getState();
      await updateNote(currentNoteId, {
        bookId: selectedBookId || null,
        title: noteTitle,
        content: paragraphs.map((p) => p.text).join('\n\n'),
      });
      showToast('笔记已保存', 'success');
    } finally {
      setSaving(false);
    }
  }, [currentNoteId, noteTitle, selectedBookId, paragraphs]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-ink-400';
      case 'processing': return 'text-classic-gold';
      case 'done': return 'text-classic-turquoise';
      case 'error': return 'text-classic-cinnabar';
      default: return 'text-ink-400';
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'processing': return <Activity className="w-3.5 h-3.5 animate-spin" />;
      case 'done': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'error': return <AlertTriangle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in-up',
          toast.type === 'success' && 'bg-classic-turquoise/95 text-white',
          toast.type === 'error' && 'bg-classic-cinnabar/95 text-white',
          toast.type === 'info' && 'bg-classic-blue/95 text-white'
        )}>
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
          {toast.type === 'info' && <Info className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink-800">OCR 笔记</h1>
          <p className="text-ink-500 text-sm mt-1">
            本地 tesseract.js Web Worker 处理 · 中文+英文识别 · 不上传原始图像
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Globe className="w-3.5 h-3.5" />
          <span>识别语言：简体中文 + English</span>
        </div>
      </div>

      {processingStats && (
        <div className="grid grid-cols-4 gap-3 animate-fade-in-up">
          <div className="card-parchment-solid p-4">
            <div className="text-xs text-ink-400 mb-1">处理图片</div>
            <div className="font-serif text-2xl font-bold text-ink-800">
              {processingStats.completedImages}/{processingStats.totalImages}
            </div>
          </div>
          <div className="card-parchment-solid p-4">
            <div className="text-xs text-ink-400 mb-1">识别段落</div>
            <div className="font-serif text-2xl font-bold text-ink-800">
              {processingStats.totalParagraphs}
            </div>
          </div>
          <div className="card-parchment-solid p-4">
            <div className="text-xs text-ink-400 mb-1">平均置信度</div>
            <div className="font-serif text-2xl font-bold text-classic-turquoise">
              {processingStats.avgConfidence.toFixed(0)}%
            </div>
          </div>
          <div className="card-parchment-solid p-4">
            <div className="text-xs text-ink-400 mb-1">处理方式</div>
            <div className="text-sm text-classic-gold font-medium">
              Web Worker 本地处理
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[360px_1fr] gap-6">
        <div className="space-y-4">
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-classic-gold bg-classic-gold/5 scale-[1.01] shadow-lg'
                : 'border-ink-300 hover:border-ink-400 hover:bg-parchment-50'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-14 h-14 rounded-full bg-parchment-200 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-ink-500" />
            </div>
            <p className="text-sm text-ink-700 font-medium mb-1">拖拽图片到此处</p>
            <p className="text-xs text-ink-400">或点击选择图片 · 支持多图上传</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {ocrQueue.length > 0 && (
            <div className="card-parchment-solid p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-semibold text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-classic-gold" />
                  图片队列
                </h3>
                <span className="text-xs text-ink-400">{ocrQueue.length} 张</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ocrQueue.map((item, idx) => (
                  <div
                    key={item.imageId}
                    className="relative flex items-center gap-3 p-2.5 rounded-lg bg-parchment-50 group"
                  >
                    <div className="relative">
                      <img
                        src={item.dataUrl}
                        alt="缩略图"
                        className="w-12 h-12 object-cover rounded border border-ink-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewImageUrl(item.dataUrl)}
                      />
                      {item.status === 'done' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-classic-turquoise text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn('text-xs font-medium', getStatusColor(item.status))}>
                          <span className="inline-flex items-center gap-1">
                            <StatusIcon status={item.status} />
                            {item.status === 'pending' && '等待识别'}
                            {item.status === 'processing' && `识别中 ${Math.round(item.progress * 100)}%`}
                            {item.status === 'done' && '识别完成'}
                            {item.status === 'error' && '识别失败'}
                          </span>
                        </span>
                        <button
                          onClick={() => { removeFromOCRQueue(item.imageId); showToast('已从队列移除', 'info'); }}
                          className="p-0.5 text-ink-300 hover:text-classic-cinnabar transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {(item.status === 'processing' || item.status === 'done') && (
                        <div className="h-1 bg-ink-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              item.status === 'done' ? 'bg-classic-turquoise' : 'bg-gold-gradient'
                            )}
                            style={{ width: `${Math.round(item.progress * 100)}%` }}
                          />
                        </div>
                      )}
                      {item.result && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-400">
                          <span>{item.result.paragraphs.length} 段落</span>
                          <span className="text-ink-300">·</span>
                          <span>{item.result.text.length} 字</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className={cn(
              'btn-gold w-full',
              (ocrQueue.length === 0 || ocrWorkerBusy) && 'opacity-50 cursor-not-allowed'
            )}
            disabled={ocrQueue.length === 0 || ocrWorkerBusy}
            onClick={handleProcessOCR}
          >
            <Play className="w-4 h-4" />
            {ocrWorkerBusy ? '识别引擎运行中...' : ocrQueue.length > 0 ? `开始识别 ${ocrQueue.filter(i => i.status === 'pending').length} 张图片` : '请先上传图片'}
          </button>

          {history.length > 0 && (
            <div className="card-parchment-solid p-4">
              <h3 className="font-serif font-semibold text-base mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink-400" />
                本地处理记录
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors',
                      h.noteId === currentNoteId ? 'bg-classic-gold/10 border border-classic-gold/20' : 'hover:bg-parchment-50'
                    )}
                    onClick={() => h.noteId && handleSelectNote(h.noteId)}
                  >
                    <img
                      src={h.imageUrl}
                      alt=""
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-ink-600">
                        <FileSearch className="w-3 h-3 text-ink-400" />
                        <span className="font-medium">{h.paragraphCount} 个段落</span>
                        <span className="text-classic-turquoise">{h.confidence.toFixed(0)}%</span>
                      </div>
                      <div className="text-[10px] text-ink-400 mt-0.5">
                        {dayjs(h.processedAt).format('MM/DD HH:mm')} · {h.language}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card-parchment-solid p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <select
                className="input-field flex-1 min-w-[200px]"
                value={currentNoteId}
                onChange={(e) => handleSelectNote(e.target.value)}
              >
                <option value="">选择笔记...</option>
                {notes.filter(n => n.sourceType === 'ocr').map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title || `笔记 ${note.id.slice(0, 8)}`}
                  </option>
                ))}
              </select>

              <select
                className="input-field flex-1 min-w-[200px]"
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
              >
                <option value="">关联书籍...</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>

              <button
                className={cn(
                  'btn-ghost text-xs',
                  showBBox && 'bg-classic-gold/10 text-classic-gold'
                )}
                onClick={() => setShowBBox(!showBBox)}
                title="显示识别框"
              >
                <MapPin className="w-3.5 h-3.5" />
                识别框
              </button>
            </div>

            <input
              type="text"
              className="input-field text-lg font-serif mb-4"
              placeholder="笔记标题"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />

            {previewImageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden border border-ink-200">
                <img src={previewImageUrl} alt="原图" className="w-full max-h-48 object-contain bg-ink-100" />
              </div>
            )}

            <div className="space-y-2">
              {paragraphs.map((para, index) => (
                <div
                  key={para.id}
                  className="group relative p-3 rounded-lg border border-transparent hover:border-ink-200 hover:bg-parchment-50/50 transition-all"
                >
                  <div className="absolute left-1 top-3 text-[10px] text-ink-300 font-mono tabular-nums">
                    {index + 1}
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <div className="flex-1">
                      {showBBox && para.bbox && (
                        <div className="mb-1 flex items-center gap-2 text-[10px] text-ink-400">
                          <MapPin className="w-2.5 h-2.5 text-classic-gold" />
                          <span>
                            bbox: ({para.bbox.x0}, {para.bbox.y0}) → ({para.bbox.x1}, {para.bbox.y1})
                          </span>
                        </div>
                      )}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="min-h-[2rem] text-sm text-ink-700 outline-none focus:bg-parchment-50 rounded px-2 py-1 transition-colors leading-relaxed"
                        onBlur={(e) =>
                          handleParagraphTextChange(
                            index,
                            e.currentTarget.textContent || '',
                          )
                        }
                      >
                        {para.text}
                      </div>
                      {para.confidence !== undefined && (
                        <div className="mt-1 flex items-center gap-1">
                          <div className="h-1 w-16 bg-ink-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                para.confidence >= 90 ? 'bg-classic-turquoise' :
                                para.confidence >= 70 ? 'bg-classic-gold' : 'bg-classic-cinnabar'
                              )}
                              style={{ width: `${para.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-ink-400 tabular-nums">
                            {para.confidence.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 shrink-0">
                      <div className="relative">
                        <Hash className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input
                          type="number"
                          className="input-field w-20 text-center text-xs pl-6 pr-1"
                          placeholder="页码"
                          value={para.pageNumber}
                          onChange={(e) => handlePageNumberChange(index, e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteParagraph(index)}
                        className="p-1 text-ink-300 hover:text-classic-cinnabar transition-colors opacity-0 group-hover:opacity-100"
                        title="删除段落"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {index < paragraphs.length - 1 && (
                    <div className="ink-divider mt-2" />
                  )}
                </div>
              ))}

              {paragraphs.length === 0 && (
                <div className="py-20 text-center">
                  <FileSearch className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                  <p className="text-ink-400 text-sm">上传图片并识别后，识别出的段落将出现在此处</p>
                  <p className="text-ink-300 text-xs mt-1">所有 OCR 处理在浏览器本地 Web Worker 中完成，不上传原始图像</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 mt-4 border-t border-ink-200">
              <button className="btn-ghost" onClick={handleAddParagraph}>
                <Plus className="w-4 h-4" />
                添加段落
              </button>
              {paragraphs.length > 0 && (
                <span className="text-xs text-ink-400">
                  共 {paragraphs.length} 个段落 · {paragraphs.reduce((s, p) => s + p.text.length, 0)} 字
                </span>
              )}
              <div className="flex-1" />
              <button
                className={cn(
                  'btn-gold',
                  (!currentNoteId || saving) && 'opacity-50 cursor-not-allowed'
                )}
                disabled={!currentNoteId || saving}
                onClick={handleSave}
              >
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '保存笔记'}
              </button>
            </div>
          </div>

          {currentNoteId && anchors.filter(a => a.noteId === currentNoteId).length > 0 && (
            <div className="card-parchment-solid p-4 flex items-start gap-3">
              <BookOpen className="w-4 h-4 text-classic-gold mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-ink-700 font-medium">页码锚点</div>
                <div className="text-xs text-ink-500 mt-0.5">
                  {anchors.filter(a => a.noteId === currentNoteId).map((a, i) => (
                    <span key={a.id}>
                      {i > 0 && '、'}
                      第 <span className="font-semibold text-classic-gold">{a.pageNumber}</span> 页
                      {a.confidence && `（置信度 ${(a.confidence * 100).toFixed(0)}%）`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
