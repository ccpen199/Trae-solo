import { useState, useRef, useCallback, useEffect } from 'react';
import { useNoteStore } from '@/stores/noteStore';
import { useBookStore } from '@/stores/bookStore';
import { db } from '@/db';
import { Upload, X, Play, Plus, Trash2, Save } from 'lucide-react';
import type { NoteParagraph } from '@/types';

interface EditableParagraph {
  id: string;
  text: string;
  pageNumber: string;
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
  } = useNoteStore();

  const { books } = useBookStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string>('');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState('');
  const [paragraphs, setParagraphs] = useState<EditableParagraph[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) addToOCRQueue(dataUrl);
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
    await processOCRQueue();

    const doneItems = useNoteStore.getState().ocrQueue.filter(
      (item) => item.status === 'done' && item.result,
    );

    if (doneItems.length === 0) return;

    const allParagraphs: EditableParagraph[] = [];
    doneItems.forEach((item) => {
      item.result!.paragraphs.forEach((p) => {
        allParagraphs.push({
          id: `temp-${item.imageId}-${p.orderIndex}`,
          text: p.text,
          pageNumber: '',
        });
      });
    });

    const title = noteTitle || `OCR笔记 ${new Date().toLocaleDateString('zh-CN')}`;
    const noteId = await addNote({
      bookId: selectedBookId || null,
      title,
      content: doneItems.map((item) => item.result!.text).join('\n\n'),
      sourceType: 'ocr',
      sourceImageId: doneItems[0].imageId,
    });

    for (let i = 0; i < allParagraphs.length; i++) {
      const paraId = await addParagraph(noteId, allParagraphs[i].text, i);
      allParagraphs[i].id = paraId;
    }

    setCurrentNoteId(noteId);
    setNoteTitle(title);
    setParagraphs(allParagraphs);
  }, [processOCRQueue, addNote, addParagraph, noteTitle, selectedBookId]);

  const handleSelectNote = useCallback(
    async (noteId: string) => {
      setCurrentNoteId(noteId);
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        setNoteTitle(note.title || '');
        setSelectedBookId(note.bookId || '');
      }

      const { paragraphs: storedParas, anchors } = useNoteStore.getState();
      if (useNoteStore.getState().currentNote?.id !== noteId) {
        await useNoteStore.getState().loadNoteDetail(noteId);
      }
      const freshState = useNoteStore.getState();
      setParagraphs(
        freshState.paragraphs.map((p: NoteParagraph) => {
          const anchor = freshState.anchors.find((a) => a.noteId === noteId);
          return {
            id: p.id,
            text: p.text,
            pageNumber: anchor?.pageNumber?.toString() || '',
          };
        }),
      );
    },
    [notes],
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
        } else {
          await addPageAnchor(currentNoteId, pageNum, 0.9);
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
    } finally {
      setSaving(false);
    }
  }, [currentNoteId, noteTitle, selectedBookId, paragraphs]);

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      <div className="w-2/5 flex flex-col gap-4">
        <div
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-classic-gold bg-classic-gold/5'
              : 'border-ink-300 hover:border-ink-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-10 h-10 text-ink-300 mb-3" />
          <p className="text-sm text-ink-400">
            拖拽图片到此处，或点击上传
          </p>
          <p className="text-xs text-ink-300 mt-1">支持多图上传</p>
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
          <div className="card-parchment-solid p-4 flex-1 overflow-y-auto">
            <h3 className="title-serif text-base mb-3">图片队列</h3>
            <div className="flex flex-col gap-3">
              {ocrQueue.map((item) => (
                <div
                  key={item.imageId}
                  className="relative flex items-center gap-3 p-2 rounded-lg bg-parchment-50"
                >
                  <img
                    src={item.dataUrl}
                    alt="缩略图"
                    className="w-14 h-14 object-cover rounded border border-[var(--border-subtle)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-400">
                        {item.status === 'pending' && '等待识别'}
                        {item.status === 'processing' && '识别中...'}
                        {item.status === 'done' && '识别完成'}
                        {item.status === 'error' && '识别失败'}
                      </span>
                      <button
                        onClick={() => removeFromOCRQueue(item.imageId)}
                        className="p-0.5 text-ink-300 hover:text-classic-cinnabar transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {(item.status === 'processing' ||
                      item.status === 'done') && (
                      <div className="mt-1.5 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-gradient rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(item.progress * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn-gold w-full"
          disabled={ocrQueue.length === 0 || ocrWorkerBusy}
          onClick={handleProcessOCR}
        >
          <Play className="w-4 h-4" />
          {ocrWorkerBusy ? '识别中...' : '开始识别'}
        </button>
      </div>

      <div className="w-3/5 flex flex-col gap-4 card-parchment-solid p-5 overflow-y-auto">
        <div className="flex gap-3">
          <select
            className="input-field flex-1"
            value={currentNoteId}
            onChange={(e) => handleSelectNote(e.target.value)}
          >
            <option value="">选择笔记...</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>
                {note.title || `笔记 ${note.id.slice(0, 8)}`}
              </option>
            ))}
          </select>

          <select
            className="input-field flex-1"
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
        </div>

        <input
          type="text"
          className="input-field"
          placeholder="笔记标题"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto flex flex-col gap-0">
          {paragraphs.map((para, index) => (
            <div key={para.id}>
              <div className="flex items-start gap-2 py-2">
                <div className="flex-1">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[2rem] text-sm text-ink-700 outline-none focus:bg-parchment-50 rounded px-2 py-1 transition-colors"
                    onBlur={(e) =>
                      handleParagraphTextChange(
                        index,
                        e.currentTarget.textContent || '',
                      )
                    }
                  >
                    {para.text}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1 shrink-0">
                  <input
                    type="number"
                    className="input-field w-16 text-center text-xs"
                    placeholder="页码"
                    value={para.pageNumber}
                    onChange={(e) => {
                      handlePageNumberChange(index, e.target.value);
                    }}
                  />
                  <button
                    onClick={() => handleDeleteParagraph(index)}
                    className="p-1 text-ink-300 hover:text-classic-cinnabar transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {index < paragraphs.length - 1 && (
                <div className="ink-divider" />
              )}
            </div>
          ))}

          {paragraphs.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-ink-300 text-sm">
              上传图片并识别后，段落将出现在此处
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <button className="btn-ghost" onClick={handleAddParagraph}>
            <Plus className="w-4 h-4" />
            添加段落
          </button>
          <div className="flex-1" />
          <button
            className="btn-gold"
            disabled={!currentNoteId || saving}
            onClick={handleSave}
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存笔记'}
          </button>
        </div>
      </div>
    </div>
  );
}
