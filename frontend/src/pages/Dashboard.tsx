import { useEffect, useMemo } from 'react';
import { Clock, FileText, BookOpen, AlertTriangle, Play, Pause, Square } from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { useTimerStore } from '@/stores/timerStore';
import { useNoteStore } from '@/stores/noteStore';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import type { TimerMode } from '@/types';

const TARGET_SECONDS = 1800;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const MODE_LABELS: Record<TimerMode, string> = {
  manual: '手动启停',
  dwell: '页面停留',
  voice: '语音同步',
};

export default function Dashboard() {
  const books = useBookStore(s => s.books);
  const loadBooks = useBookStore(s => s.loadBooks);

  const isRunning = useTimerStore(s => s.isRunning);
  const isPaused = useTimerStore(s => s.isPaused);
  const mode = useTimerStore(s => s.mode);
  const elapsedSeconds = useTimerStore(s => s.elapsedSeconds);
  const bookId = useTimerStore(s => s.bookId);
  const sessionLog = useTimerStore(s => s.sessionLog);
  const startTimer = useTimerStore(s => s.startTimer);
  const pauseTimer = useTimerStore(s => s.pauseTimer);
  const resumeTimer = useTimerStore(s => s.resumeTimer);
  const stopTimer = useTimerStore(s => s.stopTimer);
  const switchMode = useTimerStore(s => s.switchMode);
  const loadRecentSessions = useTimerStore(s => s.loadRecentSessions);

  const notes = useNoteStore(s => s.notes);
  const loadNotes = useNoteStore(s => s.loadNotes);

  useEffect(() => {
    loadBooks();
    loadRecentSessions();
    loadNotes();
  }, [loadBooks, loadRecentSessions, loadNotes]);

  const todayTotalSeconds = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const fromSessions = sessionLog
      .filter(s => dayjs(s.startTime).format('YYYY-MM-DD') === today)
      .reduce((sum, s) => sum + s.durationSeconds, 0);
    return fromSessions + (isRunning ? elapsedSeconds : 0);
  }, [sessionLog, isRunning, elapsedSeconds]);

  const todayNoteCount = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return notes.filter(n => dayjs(n.createdAt).format('YYYY-MM-DD') === today).length;
  }, [notes]);

  const readingCount = useMemo(() => {
    return books.filter(b => b.status === 'reading').length;
  }, [books]);

  const recentBooks = useMemo(() => {
    return books
      .filter(b => b.status === 'reading')
      .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
      .slice(0, 5);
  }, [books]);

  const staleBooks = useMemo(() => {
    const sevenDaysAgo = dayjs().subtract(7, 'day');
    return books.filter(
      b =>
        (b.status === 'reading' || b.status === 'paused') &&
        dayjs(b.updatedAt).isBefore(sevenDaysAgo)
    );
  }, [books]);

  const timerRadius = 46;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = Math.min(elapsedSeconds / TARGET_SECONDS, 1);
  const timerDashoffset = timerCircumference * (1 - timerProgress);

  const currentTimerBook = books.find(b => b.id === bookId);

  return (
    <div className="space-y-6">
      <h1 className="font-serif font-semibold text-2xl animate-fade-in-up">阅读仪表盘</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-parchment-solid p-5 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-classic-gold/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-classic-gold" />
            </div>
            <span className="text-sm text-ink-400">今日阅读时长</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-800">
            {Math.floor(todayTotalSeconds / 60)}
            <span className="text-base font-normal text-ink-400 ml-1">分钟</span>
          </div>
        </div>

        <div className="card-parchment-solid p-5 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-classic-blue/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-classic-blue" />
            </div>
            <span className="text-sm text-ink-400">今日笔记数</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-800">
            {todayNoteCount}
            <span className="text-base font-normal text-ink-400 ml-1">条</span>
          </div>
        </div>

        <div className="card-parchment-solid p-5 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-classic-turquoise/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-classic-turquoise" />
            </div>
            <span className="text-sm text-ink-400">正在阅读</span>
          </div>
          <div className="font-serif text-3xl font-semibold text-ink-800">
            {readingCount}
            <span className="text-base font-normal text-ink-400 ml-1">本</span>
          </div>
        </div>
      </div>

      <div className="card-parchment-solid p-6 animate-fade-in-up stagger-4">
        <h2 className="font-serif font-semibold text-lg mb-4">快速计时器</h2>
        <div className="flex items-center gap-8">
          <div className="relative flex-shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={timerRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-parchment-300"
              />
              <circle
                cx="60"
                cy="60"
                r={timerRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-classic-gold"
                strokeDasharray={timerCircumference}
                strokeDashoffset={timerDashoffset}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-sm text-ink-700">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex gap-2">
              {(['manual', 'dwell', 'voice'] as TimerMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    'tab-item',
                    mode === m && 'tab-item-active',
                    isRunning && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={isRunning}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            {isRunning && currentTimerBook && (
              <div className="text-sm text-ink-500">
                正在计时：{currentTimerBook.title}
              </div>
            )}

            <div className="flex gap-2">
              {!isRunning ? (
                <button onClick={() => startTimer()} className="btn-gold">
                  <Play className="w-4 h-4" /> 开始
                </button>
              ) : (
                <>
                  {!isPaused ? (
                    <button onClick={pauseTimer} className="btn-ink">
                      <Pause className="w-4 h-4" /> 暂停
                    </button>
                  ) : (
                    <button onClick={resumeTimer} className="btn-gold">
                      <Play className="w-4 h-4" /> 恢复
                    </button>
                  )}
                  <button onClick={() => stopTimer()} className="btn-ghost">
                    <Square className="w-4 h-4" /> 停止
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up stagger-5">
        <h2 className="font-serif font-semibold text-lg mb-4">最近阅读</h2>
        {recentBooks.length === 0 ? (
          <div className="card-parchment-solid p-6 text-center text-ink-400">
            暂无阅读中的书籍
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recentBooks.map(book => (
              <div key={book.id} className="card-parchment-solid p-4 min-w-[160px] flex-shrink-0">
                <div className="w-full h-40 rounded-lg bg-parchment-200 mb-3 flex items-center justify-center overflow-hidden">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-8 h-8 text-ink-300" />
                  )}
                </div>
                <div className="text-sm font-medium text-ink-700 truncate">{book.title}</div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-ink-400 mb-1">
                    <span>{book.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-parchment-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold-gradient rounded-full transition-all duration-500"
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {staleBooks.length > 0 && (
        <div className="card-parchment-solid p-5 animate-fade-in-up stagger-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-classic-cinnabar" />
            <h2 className="font-serif font-semibold text-lg">阅读预警</h2>
            <span className="badge-red">{staleBooks.length}</span>
          </div>
          <div className="space-y-2">
            {staleBooks.map(book => (
              <div
                key={book.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-ink-400" />
                  <span className="text-sm text-ink-700">{book.title}</span>
                </div>
                <span className="badge-red text-xs">
                  {dayjs().diff(dayjs(book.updatedAt), 'day')}天未读
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
