import { useEffect, useState, useMemo } from 'react';
import { Clock, Play, Pause, Square, RotateCcw, Hand, MousePointer2, Mic, Target, Save, Trash2, CheckCircle2, AlertCircle, XCircle, Activity, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useTimerStore } from '@/stores/timerStore';
import { useBookStore } from '@/stores/bookStore';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import type { TimerMode, ReadingSession, Book } from '@/types';

const MODE_LABELS: Record<TimerMode, string> = {
  manual: '手动启停',
  dwell: '页面停留',
  voice: '语音同步',
};

const MODE_DESC: Record<TimerMode, string> = {
  manual: '点击按钮开始和暂停，完全由您控制计时节奏。',
  dwell: '检测页面活动（鼠标/键盘/滚动）自动计时，停留超过5分钟自动暂停。',
  voice: '通过语音识别或模拟朗读进度同步，适合听书或朗读场景。',
};

const MODE_ICONS: Record<TimerMode, any> = {
  manual: Hand,
  dwell: MousePointer2,
  voice: Mic,
};

const PAUSE_REASON_LABELS: Record<string, { label: string; color: string }> = {
  user: { label: '用户主动暂停', color: 'text-ink-600' },
  dwell_timeout: { label: '停留超时自动暂停', color: 'text-classic-cinnabar' },
  voice_pause: { label: '语音中断暂停', color: 'text-classic-gold' },
  app_background: { label: '切到后台暂停', color: 'text-classic-blue' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: '已完成', color: 'text-classic-turquoise' },
  active: { label: '进行中', color: 'text-classic-gold' },
  paused: { label: '已暂停', color: 'text-ink-500' },
  discarded: { label: '已丢弃', color: 'text-classic-cinnabar' },
};

export default function ReadingTimer() {
  const { books, loadBooks } = useBookStore();
  const {
    isRunning,
    isPaused,
    mode,
    elapsedSeconds,
    bookId,
    sessionLog,
    pauseReason,
    voiceProgress,
    targetProgress,
    sessionStartProgress,
    lastSaveStatus,
    lastSavedAt,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    switchMode,
    setBookId,
    setTargetProgress,
    discardSession,
    saveSessionSnapshot,
    loadRecentSessions,
  } = useTimerStore();

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [dwellActive, setDwellActive] = useState(true);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadBooks();
    loadRecentSessions();
  }, [loadBooks, loadRecentSessions]);

  useEffect(() => {
    if (!isRunning || mode !== 'voice') {
      setVoiceLevel(0);
      return;
    }
    if (isPaused) return;
    const id = setInterval(() => {
      setVoiceLevel(20 + Math.random() * 80);
    }, 200);
    return () => clearInterval(id);
  }, [isRunning, mode, isPaused]);

  useEffect(() => {
    if (!isRunning || mode !== 'dwell') {
      setDwellActive(true);
      return;
    }
    const check = setInterval(() => {
      setDwellActive(!!useTimerStore.getState().dwellTimeout);
    }, 500);
    return () => clearInterval(check);
  }, [isRunning, mode]);

  useEffect(() => {
    if (!isRunning) return;
    const autoSave = setInterval(() => {
      saveSessionSnapshot();
    }, 30000);
    return () => clearInterval(autoSave);
  }, [isRunning, saveSessionSnapshot]);

  const currentBook = useMemo(() =>
    books.find(b => b.id === (isRunning ? bookId : selectedBookId)) || null
  , [books, isRunning, bookId, selectedBookId]);

  const bookSessions = useMemo(() =>
    currentBook ? sessionLog.filter(s => s.bookId === currentBook.id) : sessionLog
  , [currentBook, sessionLog]);

  const timeDisplay = useMemo(() => {
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

  const progressPercent = useMemo(() => {
    if (!isRunning || !currentBook || sessionStartProgress === null) return 0;
    const target = targetProgress ?? currentBook.progress + 10;
    if (target <= sessionStartProgress) return 100;
    return Math.min(100, ((currentBook.progress - sessionStartProgress) / (target - sessionStartProgress)) * 100);
  }, [isRunning, currentBook, targetProgress, sessionStartProgress]);

  const handleStart = () => {
    const bid = isRunning ? bookId : selectedBookId;
    if (bid) {
      startTimer(bid);
    } else {
      startTimer();
    }
  };

  const renderSaveStatus = () => {
    switch (lastSaveStatus) {
      case 'saving':
        return <span className="flex items-center gap-1.5 text-xs text-classic-blue"><Activity className="w-3 h-3 animate-spin" />正在保存快照...</span>;
      case 'saved':
        return <span className="flex items-center gap-1.5 text-xs text-classic-turquoise"><CheckCircle2 className="w-3 h-3" />已保存 {lastSavedAt ? dayjs(lastSavedAt).format('HH:mm:ss') : ''}</span>;
      case 'failed':
        return <span className="flex items-center gap-1.5 text-xs text-classic-cinnabar"><XCircle className="w-3 h-3" />保存失败</span>;
      default:
        return <span className="flex items-center gap-1.5 text-xs text-ink-400"><Clock className="w-3 h-3" />未保存</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="font-serif text-3xl font-bold text-ink-800 mb-2">阅读计时</h1>
        <p className="text-ink-500">三模式智能计时，专注于深度阅读体验</p>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-8">
        <div className="animate-fade-in-up stagger-1">
          <div className="card-parchment-solid p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-parchment-300">
              {isRunning && !isPaused && (
                <div className="h-full bg-gold-gradient animate-shimmer-slide" style={{ animationDuration: '2s' }} />
              )}
            </div>

            <div className="text-xs text-ink-400 mb-3 font-medium tracking-wider">
              {currentBook ? currentBook.title : '未选择书籍'}
            </div>

            <div className="relative w-56 h-56 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" className="text-parchment-300" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="url(#timerGradient)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(elapsedSeconds % 3600) / 36} 339.292`}
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4a853" />
                    <stop offset="100%" stopColor="#b8860b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-serif font-bold text-ink-800 tabular-nums animate-breathe">
                  {timeDisplay}
                </div>
                {isRunning && (
                  <div className="text-xs text-ink-400 mt-2 flex items-center gap-1">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      isPaused ? 'bg-classic-cinnabar' : 'bg-classic-turquoise animate-pulse'
                    )} />
                    {isPaused ? '已暂停' : '专注中'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4 h-6">
              {renderSaveStatus()}
            </div>

            {isRunning && (
              <div className="space-y-3 mb-6">
                {targetProgress !== null && currentBook && (
                  <div>
                    <div className="flex justify-between text-xs text-ink-500 mb-1">
                      <span className="flex items-center gap-1"><Target className="w-3 h-3" />目标进度 {targetProgress}%</span>
                      <span>{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-parchment-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-classic-turquoise rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {mode === 'dwell' && (
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-xs justify-center',
                    dwellActive ? 'bg-classic-turquoise/10 text-classic-turquoise' : 'bg-classic-cinnabar/10 text-classic-cinnabar'
                  )}>
                    <MousePointer2 className="w-3.5 h-3.5" />
                    {dwellActive ? '检测到活动，计时正常' : '停留超时，自动暂停'}
                  </div>
                )}

                {mode === 'voice' && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-classic-gold/5 border border-classic-gold/15">
                    <Mic className={cn('w-4 h-4 text-classic-gold', !isPaused && 'animate-breathe')} />
                    <div className="flex items-end gap-0.5 h-5 flex-1">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-classic-gold/60 rounded-full transition-all duration-200"
                          style={{
                            height: isPaused ? 4 : `${4 + (Math.sin(i * 0.7 + voiceLevel / 22) * 0.5 + 0.5) * (voiceLevel * 0.14)}px`,
                          }}
                        />
                      ))}
                    </div>
                    {voiceProgress !== null && (
                      <span className="text-xs text-classic-gold font-medium tabular-nums">
                        {voiceProgress.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}

                {pauseReason && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs justify-center bg-ink-50 border border-ink-200">
                    <AlertCircle className="w-3.5 h-3.5 text-ink-500" />
                    <span className={PAUSE_REASON_LABELS[pauseReason]?.color || 'text-ink-600'}>
                      {PAUSE_REASON_LABELS[pauseReason]?.label || pauseReason}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center gap-3">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="btn-gold px-8 gap-2"
                >
                  <Play className="w-4 h-4" />
                  开始阅读
                </button>
              ) : (
                <>
                  {!isPaused ? (
                    <button onClick={() => pauseTimer('user')} className="btn-ink gap-2">
                      <Pause className="w-4 h-4" /> 暂停
                    </button>
                  ) : (
                    <button onClick={resumeTimer} className="btn-gold gap-2">
                      <Play className="w-4 h-4" /> 继续
                    </button>
                  )}
                  <button onClick={stopTimer} className="btn-ghost gap-2">
                    <Square className="w-4 h-4" /> 结束
                  </button>
                  <button onClick={saveSessionSnapshot} className="btn-ghost gap-2 p-2" title="保存快照">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={discardSession} className="btn-ghost gap-2 p-2 text-classic-cinnabar" title="丢弃">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {(['manual', 'dwell', 'voice'] as TimerMode[]).map(m => {
              const Icon = MODE_ICONS[m];
              return (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all duration-200 border',
                    mode === m
                      ? 'bg-parchment-100 border-gold-gradient shadow-lg'
                      : 'bg-parchment-50 border-transparent hover:bg-parchment-100',
                    isRunning && 'opacity-60 cursor-not-allowed'
                  )}
                  disabled={isRunning}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      mode === m ? 'bg-gold-gradient text-parchment-50' : 'bg-parchment-200 text-ink-500'
                    )}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className={cn('font-semibold', mode === m ? 'text-ink-800' : 'text-ink-600')}>
                      {MODE_LABELS[m]}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 ml-12">
                    {MODE_DESC[m]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-semibold text-lg">选择书籍</h2>
            </div>
            <div className="card-parchment-solid p-4">
              {!isRunning ? (
                <div className="relative">
                  <button
                    onClick={() => setShowBookDropdown(!showBookDropdown)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-parchment-50 border border-ink-200 hover:border-ink-300 transition-colors"
                  >
                    {currentBook ? (
                      <div className="flex items-center gap-3">
                        {currentBook.coverImageData || currentBook.coverImage ? (
                          <img src={currentBook.coverImageData || currentBook.coverImage} alt="" className="w-10 h-14 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-14 rounded bg-parchment-200 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-ink-400" />
                          </div>
                        )}
                        <div className="text-left">
                          <div className="font-medium text-ink-800">{currentBook.title}</div>
                          <div className="text-xs text-ink-500">{currentBook.authors.join('、')} · {currentBook.progress}%</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-ink-400">请选择要计时的书籍</span>
                    )}
                    {showBookDropdown ? <ChevronUp className="w-4 h-4 text-ink-400" /> : <ChevronDown className="w-4 h-4 text-ink-400" />}
                  </button>
                  {showBookDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-parchment-50 rounded-lg border border-ink-200 shadow-xl z-10 max-h-64 overflow-y-auto">
                      {books.filter(b => b.status !== 'completed' && b.status !== 'abandoned').map(book => (
                        <button
                          key={book.id}
                          onClick={() => {
                            setSelectedBookId(book.id);
                            setBookId(book.id);
                            setShowBookDropdown(false);
                          }}
                          className="w-full p-3 flex items-center gap-3 hover:bg-parchment-100 text-left first:rounded-t-lg last:rounded-b-lg"
                        >
                          {book.coverImageData || book.coverImage ? (
                            <img src={book.coverImageData || book.coverImage} alt="" className="w-8 h-11 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-11 rounded bg-parchment-200 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-ink-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-ink-800 truncate">{book.title}</div>
                            <div className="text-xs text-ink-500 truncate">{book.authors.join('、')}</div>
                          </div>
                          <span className="text-xs text-ink-500">{book.progress}%</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {currentBook && (
                    <>
                      {currentBook.coverImageData || currentBook.coverImage ? (
                        <img src={currentBook.coverImageData || currentBook.coverImage} alt="" className="w-12 h-16 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-16 rounded bg-parchment-200 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-ink-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-ink-800">{currentBook.title}</div>
                        <div className="text-xs text-ink-500">{currentBook.authors.join('、')}</div>
                        {sessionStartProgress !== null && (
                          <div className="text-xs text-classic-gold mt-0.5">
                            本次起始进度 {sessionStartProgress}% → 当前 {currentBook.progress}%
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {!isRunning && currentBook && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-ink-500 mb-1.5 block">目标进度（本次阅读期望达到的百分比）</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={currentBook.progress}
                        max={100}
                        value={targetProgress ?? currentBook.progress + 10}
                        onChange={(e) => setTargetProgress(parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-parchment-300 rounded-full appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium text-classic-gold tabular-nums w-12 text-right">
                        {targetProgress ?? currentBook.progress + 10}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-semibold text-lg">
                最近阅读记录
                <span className="text-xs text-ink-400 font-normal ml-2">共 {bookSessions.length} 条</span>
              </h2>
            </div>
            {bookSessions.length === 0 ? (
              <div className="card-parchment-solid p-8 text-center">
                <Clock className="w-10 h-10 text-ink-300 mx-auto mb-3" />
                <p className="text-ink-400 text-sm">暂无阅读记录，选择一本书开始阅读吧</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookSessions.slice(0, 15).map(session => {
                  const book = books.find(b => b.id === session.bookId);
                  const isExpanded = expandedSessionId === session.id;
                  return (
                    <div
                      key={session.id}
                      className="card-parchment-solid overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        className="w-full p-4 flex items-center gap-4 text-left hover:bg-parchment-100/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-parchment-200 flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const Icon = MODE_ICONS[session.mode];
                            return <Icon className="w-4 h-4 text-ink-500" />;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-ink-800 text-sm">
                              {book ? book.title : '未关联书籍'}
                            </span>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full',
                              STATUS_LABELS[session.status || 'completed']?.color || 'text-ink-600'
                            )} style={{
                              backgroundColor: session.status === 'discarded' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(13, 148, 136, 0.1)'
                            }}>
                              {STATUS_LABELS[session.status || 'completed']?.label || '已完成'}
                            </span>
                          </div>
                          <div className="text-xs text-ink-500 flex items-center gap-2 flex-wrap">
                            <span>{MODE_LABELS[session.mode]}</span>
                            <span className="text-ink-300">·</span>
                            <span>{dayjs(session.startTime).format('MM/DD HH:mm')} - {dayjs(session.endTime).format('HH:mm')}</span>
                            <span className="text-ink-300">·</span>
                            <span className="font-medium text-ink-700 tabular-nums">
                              {Math.floor(session.durationSeconds / 60)}分{session.durationSeconds % 60}秒
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-ink-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-ink-400 flex-shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-parchment-200">
                          <div className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            {session.pauseReason && (
                              <div>
                                <div className="text-ink-400 mb-1">暂停原因</div>
                                <div className={cn('font-medium', PAUSE_REASON_LABELS[session.pauseReason]?.color)}>
                                  {PAUSE_REASON_LABELS[session.pauseReason]?.label || session.pauseReason}
                                </div>
                              </div>
                            )}
                            {session.voiceProgress !== null && session.voiceProgress !== undefined && (
                              <div>
                                <div className="text-ink-400 mb-1">朗读进度</div>
                                <div className="font-medium text-classic-gold tabular-nums">{session.voiceProgress.toFixed(0)}%</div>
                              </div>
                            )}
                            {session.targetProgress !== null && session.targetProgress !== undefined && (
                              <div>
                                <div className="text-ink-400 mb-1">目标进度</div>
                                <div className="font-medium text-classic-turquoise tabular-nums">{session.targetProgress}%</div>
                              </div>
                            )}
                            {session.progressDelta !== null && session.progressDelta !== undefined && (
                              <div>
                                <div className="text-ink-400 mb-1">进度变更</div>
                                <div className={cn(
                                  'font-medium tabular-nums',
                                  session.progressDelta > 0 ? 'text-classic-turquoise' : 'text-ink-500'
                                )}>
                                  {session.progressDelta > 0 ? '+' : ''}{session.progressDelta}%
                                </div>
                              </div>
                            )}
                            {session.savedAt && (
                              <div>
                                <div className="text-ink-400 mb-1">保存时间</div>
                                <div className="font-medium text-ink-700">
                                  {dayjs(session.savedAt).format('MM/DD HH:mm:ss')}
                                </div>
                              </div>
                            )}
                            {session.startPage !== undefined && session.startPage !== null && (
                              <div>
                                <div className="text-ink-400 mb-1">页码范围</div>
                                <div className="font-medium text-ink-700">
                                  第 {session.startPage} 页 → {session.endPage || '?'} 页
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
