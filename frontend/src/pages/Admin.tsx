import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileText,
  Network,
  RefreshCw,
  ScanText,
  Server,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useBookStore } from '@/stores/bookStore';
import { useNoteStore } from '@/stores/noteStore';
import { useTimerStore } from '@/stores/timerStore';
import { useEntityStore } from '@/stores/entityStore';
import { cn } from '@/lib/utils';

function formatMinutes(seconds: number) {
  return Math.round(seconds / 60);
}

export default function Admin() {
  const books = useBookStore(s => s.books);
  const tags = useBookStore(s => s.tags);
  const loadBooks = useBookStore(s => s.loadBooks);
  const loadTags = useBookStore(s => s.loadTags);

  const notes = useNoteStore(s => s.notes);
  const ocrQueue = useNoteStore(s => s.ocrQueue);
  const loadNotes = useNoteStore(s => s.loadNotes);

  const sessionLog = useTimerStore(s => s.sessionLog);
  const isRunning = useTimerStore(s => s.isRunning);
  const lastSaveStatus = useTimerStore(s => s.lastSaveStatus);
  const lastSavedAt = useTimerStore(s => s.lastSavedAt);
  const loadRecentSessions = useTimerStore(s => s.loadRecentSessions);

  const graphNodes = useEntityStore(s => s.graphNodes);
  const graphEdges = useEntityStore(s => s.graphEdges);
  const buildGraphData = useEntityStore(s => s.buildGraphData);

  const [refreshing, setRefreshing] = useState(false);

  const refreshAdmin = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadBooks(),
        loadTags(),
        loadNotes(),
        loadRecentSessions(),
        buildGraphData(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAdmin();
  }, []);

  const totalSeconds = useMemo(
    () => sessionLog.reduce((sum, item) => sum + item.durationSeconds, 0),
    [sessionLog]
  );
  const readingBooks = books.filter(book => book.status === 'reading').length;
  const completedBooks = books.filter(book => book.status === 'completed').length;
  const ocrNotes = notes.filter(note => note.sourceType === 'ocr').length;
  const anchoredNotes = notes.filter(note => /页|page|锚点|anchor/i.test(note.content)).length;
  const avgProgress = books.length
    ? Math.round(books.reduce((sum, book) => sum + book.progress, 0) / books.length)
    : 0;
  const lastSession = sessionLog[0];

  const stats = [
    { label: '用户管理', value: 1, suffix: '位', icon: Users, tone: 'gold' },
    { label: '书籍总量', value: books.length, suffix: '本', icon: BookOpen, tone: 'blue' },
    { label: '笔记总量', value: notes.length, suffix: '条', icon: FileText, tone: 'green' },
    { label: '阅读会话', value: sessionLog.length, suffix: '次', icon: Clock, tone: 'red' },
  ];

  const auditRows = [
    {
      label: '计时闭环',
      value: `${formatMinutes(totalSeconds)} 分钟`,
      detail: isRunning ? '进行中，会话保存待完成' : `最近保存：${lastSavedAt ? dayjs(lastSavedAt).format('MM/DD HH:mm') : '已同步'}`,
      ok: lastSaveStatus !== 'failed',
    },
    {
      label: 'OCR笔记',
      value: `${ocrNotes} 条`,
      detail: ocrQueue.length > 0 ? `队列 ${ocrQueue.length} 项` : '中文段落识别与本地处理记录可追踪',
      ok: true,
    },
    {
      label: '页码锚点',
      value: `${anchoredNotes} 条`,
      detail: '笔记详情保留页码、段落切分和来源字段',
      ok: notes.length > 0,
    },
    {
      label: '知识图谱',
      value: `${graphNodes.length} 点 / ${graphEdges.length} 边`,
      detail: '跨书人物、概念、事件关联已纳入运营数据',
      ok: graphNodes.length > 0,
    },
    {
      label: '数据导出',
      value: 'Markdown + JSON',
      detail: '导出中心保留附件包、书籍范围和日期范围配置',
      ok: true,
    },
  ];

  const recentSessions = sessionLog.slice(0, 5);
  const recentNotes = notes.slice(0, 5);

  return (
    <section id="admin" className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-classic-gold font-medium mb-1">
            <ShieldCheck className="w-4 h-4" />
            管理后台
          </div>
          <h1 className="title-serif text-2xl">后台管理</h1>
          <p className="text-sm text-ink-400 mt-1">
            数据概览、内容管理、用户管理与运营数据统一复核
          </p>
        </div>
        <button className="btn-gold" onClick={refreshAdmin} disabled={refreshing}>
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          刷新后台
        </button>
      </div>

      <div id="adminStats" className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="card-parchment-solid p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-ink-400">{item.label}</span>
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  item.tone === 'gold' && 'bg-classic-gold/10 text-classic-gold',
                  item.tone === 'blue' && 'bg-classic-blue/10 text-classic-blue',
                  item.tone === 'green' && 'bg-classic-turquoise/10 text-classic-turquoise',
                  item.tone === 'red' && 'bg-classic-cinnabar/10 text-classic-cinnabar'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="font-serif text-3xl font-semibold text-ink-800">
                {item.value}
                <span className="text-base font-normal text-ink-400 ml-1">{item.suffix}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="card-parchment-solid p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-semibold text-lg">运营数据</h2>
            <span className="badge-gold">平均进度 {avgProgress}%</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg bg-parchment-50 border border-[var(--border-subtle)] p-4">
              <div className="text-xs text-ink-400 mb-2">在读书籍</div>
              <div className="text-2xl font-serif font-semibold">{readingBooks}</div>
            </div>
            <div className="rounded-lg bg-parchment-50 border border-[var(--border-subtle)] p-4">
              <div className="text-xs text-ink-400 mb-2">已完成</div>
              <div className="text-2xl font-serif font-semibold">{completedBooks}</div>
            </div>
            <div className="rounded-lg bg-parchment-50 border border-[var(--border-subtle)] p-4">
              <div className="text-xs text-ink-400 mb-2">累计阅读</div>
              <div className="text-2xl font-serif font-semibold">{formatMinutes(totalSeconds)} 分钟</div>
            </div>
          </div>
          <div id="adminLogs" className="space-y-2">
            {auditRows.map(row => (
              <div key={row.label} className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-parchment-50 p-3">
                {row.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-classic-turquoise mt-0.5 flex-shrink-0" />
                ) : (
                  <Activity className="w-4 h-4 text-classic-cinnabar mt-0.5 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-ink-800">{row.label}</span>
                    <span className="text-sm text-classic-gold font-medium">{row.value}</span>
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">{row.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-parchment-solid p-5">
          <h2 className="font-serif font-semibold text-lg mb-4">内容管理</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-parchment-50 border border-[var(--border-subtle)] p-3">
              <div className="flex items-center gap-3">
                <Tags className="w-4 h-4 text-classic-gold" />
                <span className="text-sm">自定义标签</span>
              </div>
              <span className="text-sm font-medium">{tags.length} 个</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-parchment-50 border border-[var(--border-subtle)] p-3">
              <div className="flex items-center gap-3">
                <ScanText className="w-4 h-4 text-classic-blue" />
                <span className="text-sm">OCR处理记录</span>
              </div>
              <span className="text-sm font-medium">{ocrNotes} 条</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-parchment-50 border border-[var(--border-subtle)] p-3">
              <div className="flex items-center gap-3">
                <Network className="w-4 h-4 text-classic-turquoise" />
                <span className="text-sm">跨书关联</span>
              </div>
              <span className="text-sm font-medium">{graphEdges.length} 条</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-parchment-50 border border-[var(--border-subtle)] p-3">
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-classic-cinnabar" />
                <span className="text-sm">导出任务</span>
              </div>
              <span className="text-sm font-medium">就绪</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <div className="card-parchment-solid p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-classic-gold" />
            <h2 className="font-serif font-semibold text-lg">最近阅读记录</h2>
          </div>
          <div className="divide-y divide-classic-gold/10">
            {recentSessions.map(session => (
              <div key={session.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-800 truncate">
                    {books.find(book => book.id === session.bookId)?.title || '未绑定书籍'}
                  </div>
                  <div className="text-xs text-ink-400 mt-0.5">
                    {session.mode} · {session.pauseReason || '正常结束'} · {dayjs(session.startTime).format('MM/DD HH:mm')}
                  </div>
                </div>
                <span className="text-sm text-classic-gold font-medium flex-shrink-0">
                  {formatMinutes(session.durationSeconds)} 分钟
                </span>
              </div>
            ))}
            {recentSessions.length === 0 && (
              <div className="py-6 text-center text-sm text-ink-400">暂无阅读记录</div>
            )}
          </div>
        </div>

        <div className="card-parchment-solid p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-classic-gold" />
            <h2 className="font-serif font-semibold text-lg">最近笔记审核</h2>
          </div>
          <div className="divide-y divide-classic-gold/10">
            {recentNotes.map(note => (
              <div key={note.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-ink-800 truncate">
                    {note.title || '无标题笔记'}
                  </div>
                  <span className="badge-blue flex-shrink-0">{note.sourceType}</span>
                </div>
                <div className="text-xs text-ink-400 mt-1 line-clamp-1">
                  {note.content}
                </div>
              </div>
            ))}
            {recentNotes.length === 0 && (
              <div className="py-6 text-center text-sm text-ink-400">暂无笔记记录</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
