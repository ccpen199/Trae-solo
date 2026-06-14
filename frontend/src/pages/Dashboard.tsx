import { useEffect, useMemo, useState } from 'react';
import { Clock, FileText, BookOpen, AlertTriangle, Play, Pause, Square, Mic, MousePointer2, Hand, Activity, User, Calendar } from 'lucide-react';
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

const MODE_ICONS: Record<TimerMode, any> = {
  manual: Hand,
  dwell: MousePointer2,
  voice: Mic,
};

export default function Dashboard() {
  const books = useBookStore(s => s.books);
  const loadBooks = useBookStore(s => s.loadBooks);
  const tags = useBookStore(s => s.tags);

  const isRunning = useTimerStore(s => s.isRunning);
  const isPaused = useTimerStore(s => s.isPaused);
  const mode = useTimerStore(s => s.mode);
  const elapsedSeconds = useTimerStore(s => s.elapsedSeconds);
  const bookId = useTimerStore(s => s.bookId);
  const sessionLog = useTimerStore(s => s.sessionLog);
  const dwellTimeout = useTimerStore(s => s.dwellTimeout);
  const startTimer = useTimerStore(s => s.startTimer);
  const pauseTimer = useTimerStore(s => s.pauseTimer);
  const resumeTimer = useTimerStore(s => s.resumeTimer);
  const stopTimer = useTimerStore(s => s.stopTimer);
  const switchMode = useTimerStore(s => s.switchMode);
  const loadRecentSessions = useTimerStore(s => s.loadRecentSessions);

  const notes = useNoteStore(s => s.notes);
  const loadNotes = useNoteStore(s => s.loadNotes);

  const [dwellActive, setDwellActive] = useState(true);
  const [voiceLevel, setVoiceLevel] = useState(0);

  useEffect(() => {
    loadBooks();
    loadRecentSessions();
    loadNotes();
  }, [loadBooks, loadRecentSessions, loadNotes]);

  useEffect(() => {
    if (mode !== 'dwell' || !isRunning) {
      setDwellActive(true);
      return;
    }
    const checkActivity = setInterval(() => {
      setDwellActive(!!dwellTimeout);
    }, 500);
    return () => clearInterval(checkActivity);
  }, [mode, isRunning, dwellTimeout]);

  useEffect(() => {
    if (mode !== 'voice' || !isRunning || isPaused) {
      setVoiceLevel(0);
      return;
    }
    const id = setInterval(() => {
      setVoiceLevel(20 + Math.random() * 80);
    }, 200);
    return () => clearInterval(id);
  }, [mode, isRunning, isPaused]);

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
              {(['manual', 'dwell', 'voice'] as TimerMode[]).map(m => {
                const Icon = MODE_ICONS[m];
                return (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={cn(
                      'tab-item gap-1.5',
                      mode === m && 'tab-item-active',
                      isRunning && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={isRunning}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {MODE_LABELS[m]}
                  </button>
                );
              })}
            </div>

            {isRunning && mode === 'dwell' && (
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                dwellActive ? 'bg-classic-turquoise/10 text-classic-turquoise' : 'bg-classic-cinnabar/10 text-classic-cinnabar'
              )}>
                <Activity className="w-3.5 h-3.5" />
                {dwellActive ? '检测到页面活动，计时正常进行' : '检测到停留超过5分钟，自动暂停中'}
              </div>
            )}

            {isRunning && mode === 'voice' && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-classic-gold/5 border border-classic-gold/15">
                <Mic className={cn('w-4 h-4 text-classic-gold', !isPaused && 'animate-breathe')} />
                <div className="flex items-end gap-0.5 h-5 flex-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-classic-gold/60 rounded-full transition-all duration-200"
                      style={{
                        height: isPaused ? 4 : `${4 + (Math.sin(i * 0.6 + voiceLevel / 20) * 0.5 + 0.5) * (voiceLevel * 0.16)}px`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-classic-gold font-medium">
                  {isPaused ? '已暂停' : '朗读同步中'}
                </span>
              </div>
            )}

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
                    <button onClick={() => pauseTimer('user')} className="btn-ink">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-semibold text-lg">最近阅读</h2>
          <span className="text-xs text-ink-400">共 {recentBooks.length} 本在读</span>
        </div>
        {recentBooks.length === 0 ? (
          <div className="card-parchment-solid p-6 text-center text-ink-400">
            暂无阅读中的书籍
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recentBooks.map(book => {
              const bookTags = tags.filter(t => book.tagIds.includes(t.id));
              const todaySeconds = sessionLog
                .filter(s => s.bookId === book.id && dayjs(s.startTime).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'))
                .reduce((sum, s) => sum + s.durationSeconds, 0);
              return (
                <div key={book.id} className="card-parchment-solid p-4 min-w-[220px] flex-shrink-0">
                  <div className="w-full h-48 rounded-lg bg-parchment-200 mb-3 flex items-center justify-center overflow-hidden">
                    {book.coverImageData || book.coverImage ? (
                      <img
                        src={book.coverImageData || book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-10 h-10 text-ink-300" />
                    )}
                  </div>
                  <div className="text-sm font-semibold text-ink-800 line-clamp-1 mb-0.5">{book.title}</div>
                  <div className="text-xs text-ink-400 line-clamp-1 mb-2 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {book.authors.join('、')}
                  </div>
                  {bookTags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {bookTags.slice(0, 2).map(tag => (
                        <span
                          key={tag.id}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ color: tag.color, backgroundColor: `${tag.color}15` }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
                    <span>今日 {Math.floor(todaySeconds / 60)} 分钟</span>
                    <span className="font-medium text-ink-700">{book.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-parchment-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold-gradient rounded-full transition-all duration-500"
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-ink-400">
                    <Calendar className="w-3 h-3" />
                    {dayjs(book.updatedAt).format('MM/DD HH:mm')} 更新
                  </div>
                </div>
              );
            })}
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
