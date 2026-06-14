import { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  BookOpen,
  ListChecks,
  Clock,
  Mic,
  MousePointer2,
  Hand,
} from 'lucide-react';
import { useTimerStore } from '@/stores/timerStore';
import { useBookStore } from '@/stores/bookStore';
import type { TimerMode } from '@/types';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const TARGET_SECONDS = 3600;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const MODE_OPTIONS: { mode: TimerMode; label: string; desc: string; icon: any }[] = [
  {
    mode: 'manual',
    label: '手动启停',
    desc: '手动控制开始和结束',
    icon: Hand,
  },
  {
    mode: 'dwell',
    label: '页面停留',
    desc: '检测鼠标/键盘活动自动暂停',
    icon: MousePointer2,
  },
  {
    mode: 'voice',
    label: '语音同步',
    desc: '通过麦克风朗读节奏同步',
    icon: Mic,
  },
];

const STATUS_LABELS: Record<TimerMode, string> = {
  manual: '手动计时',
  dwell: '停留检测',
  voice: '语音同步',
};

export default function ReadingTimer() {
  const navigate = useNavigate();
  const {
    isRunning,
    isPaused,
    mode,
    elapsedSeconds,
    bookId,
    sessionLog,
    timerInterval,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    switchMode,
    setBookId,
    loadRecentSessions,
  } = useTimerStore();

  const { books, loadBooks } = useBookStore();
  const [onStop, setOnStop] = useState(false);

  useEffect(() => {
    loadBooks();
    loadRecentSessions();
  }, [loadBooks, loadRecentSessions]);

  const readingBooks = useMemo(
    () => books.filter(b => b.status === 'reading' || b.status === 'not_started'),
    [books]
  );
  const currentBook = books.find(b => b.id === bookId);

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(elapsedSeconds / TARGET_SECONDS, 1);
  const dashoffset = circumference * (1 - progress);

  const handleStop = async () => {
    setOnStop(true);
    await stopTimer();
    setOnStop(false);
  };

  const recentSessions = useMemo(() => {
    return [...sessionLog]
      .sort((a, b) => dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf())
      .slice(0, 10);
  }, [sessionLog]);

  const sessionsByBook = useMemo(() => {
    const map = new Map<string, number>();
    recentSessions.forEach(s => {
      if (!s.bookId) return;
      map.set(s.bookId, (map.get(s.bookId) || 0) + s.durationSeconds);
    });
    return map;
  }, [recentSessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-serif font-semibold text-2xl text-ink-900">阅读计时</h1>
          <p className="text-sm text-ink-400 mt-1">专注当下的每一次阅读</p>
        </div>
        <div className="badge-gold">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {STATUS_LABELS[mode]}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-parchment-solid p-8 animate-fade-in-up stagger-1">
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              <svg
                width="320"
                height="320"
                viewBox="0 0 320 320"
                className={cn(isRunning && !isPaused && 'animate-breathe')}
                style={isRunning && !isPaused ? { animation: 'breathe 4s ease-in-out infinite' } : {}}
              >
                {isRunning && !isPaused && (
                  <circle
                    cx="160"
                    cy="160"
                    r={radius + 10}
                    fill="none"
                    stroke="rgba(184, 134, 11, 0.15)"
                    strokeWidth="2"
                    style={{
                      animation: 'ring-pulse 2s ease-out infinite',
                    }}
                  />
                )}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  fill="none"
                  stroke="#E9DECA"
                  strokeWidth="8"
                />
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  fill="none"
                  stroke="url(#goldGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                  transform="rotate(-90 160 160)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4A843" />
                    <stop offset="50%" stopColor="#B8860B" />
                    <stop offset="100%" stopColor="#8B6508" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-mono font-serif text-5xl font-semibold text-ink-900 tracking-wider">
                  {formatTime(elapsedSeconds)}
                </div>
                <div className="text-xs text-ink-400 mt-3 tracking-widest uppercase">
                  {isPaused ? '已暂停' : isRunning ? '阅读中' : '未开始'}
                </div>
                {currentBook && (
                  <div className="mt-4 max-w-[200px] text-center">
                    <div className="text-sm font-medium text-classic-gold truncate">
                      {currentBook.title}
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">
                      进度 {currentBook.progress}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {!isRunning ? (
                <button
                  onClick={() => startTimer(bookId || undefined)}
                  className="btn-gold px-8 py-3 text-base"
                  style={{ animation: 'ring-pulse 2.5s ease-out infinite' }}
                >
                  <Play className="w-5 h-5" /> 开始阅读
                </button>
              ) : (
                <>
                  {!isPaused ? (
                    <button onClick={pauseTimer} className="btn-ink px-8 py-3 text-base">
                      <Pause className="w-5 h-5" /> 暂停
                    </button>
                  ) : (
                    <button onClick={resumeTimer} className="btn-gold px-8 py-3 text-base">
                      <Play className="w-5 h-5" /> 继续
                    </button>
                  )}
                  <button
                    onClick={handleStop}
                    disabled={onStop}
                    className="btn-ghost px-6 py-3 text-base border-classic-cinnabar/20 hover:bg-classic-cinnabar/5 hover:text-classic-cinnabar"
                  >
                    <Square className="w-5 h-5" /> 结束
                  </button>
                </>
              )}
            </div>

            <div className="w-full max-w-md">
              <label className="block text-xs text-ink-400 mb-2 tracking-wide uppercase">关联书籍（可选）</label>
              <select
                className="input-field"
                value={bookId || ''}
                onChange={e => setBookId(e.target.value || null)}
                disabled={isRunning}
              >
                <option value="">不关联，自由计时</option>
                {readingBooks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.authors.join('、')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-parchment-solid p-5 animate-fade-in-up stagger-2">
            <h3 className="font-serif font-semibold text-base mb-4">计时模式</h3>
            <div className="space-y-3">
              {MODE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = mode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    onClick={() => !isRunning && switchMode(opt.mode)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-lg transition-all duration-200 border',
                      active
                        ? 'bg-classic-gold/8 border-classic-gold/25 shadow-gold'
                        : 'bg-transparent border-transparent hover:bg-parchment-200/40',
                      isRunning && 'opacity-60 cursor-not-allowed'
                    )}
                    disabled={isRunning}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                          active ? 'bg-classic-gold/15 text-classic-gold' : 'bg-ink-100 text-ink-400'
                        )}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-sm font-medium',
                            active ? 'text-classic-gold' : 'text-ink-700'
                          )}
                        >
                          {opt.label}
                        </div>
                        <div className="text-xs text-ink-400 mt-0.5 truncate">{opt.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {isRunning && (
              <div className="mt-3 text-xs text-ink-400 text-center">
                运行中无法切换模式，请先结束本次计时
              </div>
            )}
          </div>

          <div className="card-parchment-solid p-5 animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-base">本次统计</h3>
              <ListChecks className="w-4 h-4 text-ink-300" />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-400">计时模式</span>
                <span className="text-ink-700">{STATUS_LABELS[mode]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">已用时长</span>
                <span className="text-ink-700 font-mono">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">目标进度</span>
                <span className="text-ink-700">
                  {Math.round(progress * 100)}% / {Math.floor(TARGET_SECONDS / 60)}分钟
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">状态</span>
                <span
                  className={cn(
                    isPaused ? 'text-ink-400' : isRunning ? 'text-classic-gold' : 'text-ink-400'
                  )}
                >
                  {isPaused ? '已暂停' : isRunning ? '进行中' : '未开始'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-parchment-solid p-6 animate-fade-in-up stagger-4">
        <h3 className="font-serif font-semibold text-lg mb-5">最近阅读记录</h3>
        {recentSessions.length === 0 ? (
          <div className="text-center py-10 text-ink-400 text-sm">
            暂无阅读记录，开始你的第一次专注阅读吧
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-medium">书籍</th>
                  <th className="pb-3 pr-4 font-medium">模式</th>
                  <th className="pb-3 pr-4 font-medium">开始时间</th>
                  <th className="pb-3 pr-4 font-medium">结束时间</th>
                  <th className="pb-3 pr-4 font-medium text-right">时长</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map(s => {
                  const b = books.find(book => book.id === s.bookId);
                  const durMin = Math.floor(s.durationSeconds / 60);
                  const durSec = s.durationSeconds % 60;
                  return (
                    <tr
                      key={s.id}
                      className="border-t border-[var(--border-subtle)] hover:bg-parchment-200/30 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        {b ? (
                          <button
                            onClick={() => navigate(`/library/${b.id}`)}
                            className="flex items-center gap-2 text-left hover:text-classic-gold transition-colors"
                          >
                            <BookOpen className="w-4 h-4 text-ink-300" />
                            <span className="text-ink-700 truncate max-w-[240px]">{b.title}</span>
                          </button>
                        ) : (
                          <span className="text-ink-400 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-ink-200" />
                            未关联书籍
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                            s.mode === 'manual' &&
                              'bg-classic-turquoise/10 text-classic-turquoise border-classic-turquoise/20',
                            s.mode === 'dwell' &&
                              'bg-classic-blue/10 text-classic-blue border-classic-blue/20',
                            s.mode === 'voice' &&
                              'bg-classic-gold/10 text-classic-gold border-classic-gold/20'
                          )}
                        >
                          {STATUS_LABELS[s.mode]}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-ink-600 font-mono text-xs">
                        {dayjs(s.startTime).format('MM-DD HH:mm')}
                      </td>
                      <td className="py-3 pr-4 text-ink-600 font-mono text-xs">
                        {s.endTime ? dayjs(s.endTime).format('HH:mm') : '-'}
                      </td>
                      <td className="py-3 pr-4 text-right text-ink-700 font-mono font-medium">
                        {durMin}分{durSec}秒
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
