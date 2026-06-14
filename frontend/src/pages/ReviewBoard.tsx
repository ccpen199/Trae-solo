import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { useBookStore } from '@/stores/bookStore';
import type { ReadingSession, Note, Book } from '@/types';
import dayjs from 'dayjs';
import { Clock, FileText, TrendingUp, BookOpen } from 'lucide-react';

type Period = 'week' | 'month';

interface Stats {
  totalDurationMinutes: number;
  totalNotes: number;
  avgDailyMinutes: number;
  readingBooks: number;
}

interface UnfinishedBook {
  title: string;
  daysSinceStart: number;
  progress: number;
  stallDays: number;
}

export default function ReviewBoard() {
  const [period, setPeriod] = useState<Period>('week');
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { books, loadBooks } = useBookStore();

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const dateRange = useMemo(() => {
    const end = dayjs().endOf('day');
    const start =
      period === 'week'
        ? dayjs().subtract(7, 'day').startOf('day')
        : dayjs().subtract(30, 'day').startOf('day');
    return { start, end };
  }, [period]);

  useEffect(() => {
    async function loadData() {
      const allSessions = await db.readingSessions.toArray();
      const allNotes = await db.notes.toArray();
      const startStr = dateRange.start.toISOString();
      const endStr = dateRange.end.toISOString();
      setSessions(
        allSessions.filter(
          (s) => s.startTime >= startStr && s.startTime <= endStr
        )
      );
      setNotes(
        allNotes.filter(
          (n) => n.createdAt >= startStr && n.createdAt <= endStr
        )
      );
    }
    loadData();
  }, [dateRange]);

  const stats: Stats = useMemo(() => {
    const totalSeconds = sessions.reduce(
      (sum, s) => sum + s.durationSeconds,
      0
    );
    const totalDurationMinutes = Math.round(totalSeconds / 60);
    const days = dateRange.end.diff(dateRange.start, 'day') || 1;
    return {
      totalDurationMinutes,
      totalNotes: notes.length,
      avgDailyMinutes: Math.round(totalDurationMinutes / days),
      readingBooks: books.filter((b) => b.status === 'reading').length,
    };
  }, [sessions, notes, books, dateRange]);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const categoryPieOption = useMemo(() => {
    const categoryMap = new Map<string, number>();
    for (const s of sessions) {
      if (!s.bookId) continue;
      const book = books.find((b) => b.id === s.bookId);
      const cat = book?.category || '未分类';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + s.durationSeconds / 60);
    }
    const data = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}分钟 ({d}%)',
      },
      color: ['#3B5998', '#B8860B', '#4A8B7A', '#C41E3A', '#5B6ABF', '#8B6508'],
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#F5F0E6',
            borderWidth: 2,
          },
          label: {
            color: '#4A4337',
            fontSize: 12,
          },
          data,
        },
      ],
    };
  }, [sessions, books]);

  const focusLineOption = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (let i = 0; i < (period === 'week' ? 7 : 30); i++) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      dayMap.set(d, 0);
    }
    for (const s of sessions) {
      const d = dayjs(s.startTime).format('YYYY-MM-DD');
      if (dayMap.has(d)) {
        dayMap.set(d, (dayMap.get(d) || 0) + s.durationSeconds / 60);
      }
    }
    const dates = Array.from(dayMap.keys()).reverse();
    const values = Array.from(dayMap.values()).reverse();
    const avg =
      values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>专注时长: ${Math.round(p.value)}分钟`;
        },
      },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: dates.map((d) => dayjs(d).format('MM/DD')),
        axisLine: { lineStyle: { color: '#CFC4AE' } },
        axisLabel: { color: '#9D9078', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#9D9078', fontSize: 11, formatter: '{value}m' },
        splitLine: { lineStyle: { color: 'rgba(184,134,11,0.1)' } },
      },
      series: [
        {
          type: 'line',
          data: values.map((v) => Math.round(v)),
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59,89,152,0.35)' },
                { offset: 1, color: 'rgba(59,89,152,0.02)' },
              ],
            },
          },
          lineStyle: { color: '#3B5998', width: 2 },
          itemStyle: { color: '#3B5998' },
          symbol: 'circle',
          symbolSize: 5,
        },
        {
          type: 'line',
          data: new Array(dates.length).fill(avg),
          lineStyle: { color: '#B8860B', width: 1.5, type: 'dashed' },
          symbol: 'none',
        },
      ],
    };
  }, [sessions, period]);

  const heatmapOption = useMemo(() => {
    const noteMap = new Map<string, number>();
    for (const n of notes) {
      const d = dayjs(n.createdAt).format('YYYY-MM-DD');
      noteMap.set(d, (noteMap.get(d) || 0) + 1);
    }
    const rangeEnd = dayjs().format('YYYY-MM-DD');
    const rangeStart = dayjs().subtract(6, 'month').format('YYYY-MM-DD');
    const data: [string, number][] = Array.from(noteMap.entries()).map(
      ([date, count]) => [date, count]
    );

    return {
      tooltip: {
        formatter: (params: any) => {
          const [date, count] = params.value;
          return `${date}<br/>笔记数: ${count}`;
        },
      },
      visualMap: {
        min: 0,
        max: Math.max(5, ...data.map((d) => d[1])),
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        pieces: [
          { min: 0, max: 0, color: '#FBF8F0', label: '0' },
          { min: 1, max: 1, color: '#E9DECA', label: '1' },
          { min: 2, max: 3, color: '#CFC4AE', label: '2-3' },
          { min: 4, max: 5, color: '#9D9078', label: '4-5' },
          { min: 6, color: '#1E1A16', label: '6+' },
        ],
        textStyle: { color: '#9D9078', fontSize: 11 },
      },
      calendar: {
        top: 40,
        left: 40,
        right: 20,
        cellSize: ['auto', 14],
        range: [rangeStart, rangeEnd],
        itemStyle: {
          borderWidth: 3,
          borderColor: '#FBF8F0',
        },
        yearLabel: { show: false },
        dayLabel: {
          firstDay: 1,
          color: '#9D9078',
          fontSize: 10,
        },
        monthLabel: {
          color: '#9D9078',
          fontSize: 11,
        },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data,
          itemStyle: { borderRadius: 2 },
        },
      ],
    };
  }, [notes]);

  const unfinishedBooks: UnfinishedBook[] = useMemo(() => {
    return books
      .filter((b) => b.status !== 'completed' && b.startDate)
      .map((b) => {
        const start = dayjs(b.startDate);
        const daysSinceStart = dayjs().diff(start, 'day');
        const lastSession = sessions
          .filter((s) => s.bookId === b.id)
          .sort((a, b2) => dayjs(b2.startTime).valueOf() - dayjs(a.startTime).valueOf())[0];
        const stallDays = lastSession
          ? dayjs().diff(dayjs(lastSession.startTime), 'day')
          : daysSinceStart;
        return {
          title: b.title,
          daysSinceStart,
          progress: b.progress,
          stallDays,
        };
      })
      .sort((a, b) => b.stallDays - a.stallDays);
  }, [books, sessions]);

  const statCards = [
    {
      label: '总阅读时长',
      value: formatDuration(stats.totalDurationMinutes),
      icon: Clock,
    },
    {
      label: '总笔记数',
      value: `${stats.totalNotes}`,
      icon: FileText,
    },
    {
      label: '平均日专注',
      value: formatDuration(stats.avgDailyMinutes),
      icon: TrendingUp,
    },
    {
      label: '在读书目',
      value: `${stats.readingBooks}`,
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="title-serif text-2xl">复盘看板</h1>
        <div className="flex gap-1">
          <button
            className={`tab-item ${period === 'week' ? 'tab-item-active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            周报
          </button>
          <button
            className={`tab-item ${period === 'month' ? 'tab-item-active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            月报
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card-parchment-solid p-4">
            <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
              <card.icon size={14} />
              {card.label}
            </div>
            <div className="title-serif text-xl text-ink-800">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-parchment-solid p-4">
          <h3 className="text-sm font-medium text-ink-600 mb-2">类型分布</h3>
          <ReactECharts option={categoryPieOption} style={{ height: 280 }} />
        </div>

        <div className="card-parchment-solid p-4">
          <h3 className="text-sm font-medium text-ink-600 mb-2">专注时长曲线</h3>
          <ReactECharts option={focusLineOption} style={{ height: 280 }} />
        </div>

        <div className="card-parchment-solid p-4">
          <h3 className="text-sm font-medium text-ink-600 mb-2">笔记密度热力图</h3>
          <ReactECharts option={heatmapOption} style={{ height: 240 }} />
        </div>

        <div className="card-parchment-solid p-4">
          <h3 className="text-sm font-medium text-ink-600 mb-3">未完成预警</h3>
          {unfinishedBooks.length === 0 ? (
            <div className="text-ink-300 text-sm py-8 text-center">
              暂无未完成书目
            </div>
          ) : (
            <div className="overflow-auto max-h-[240px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-400 text-xs border-b border-[var(--border-subtle)]">
                    <th className="text-left py-2 font-medium">书名</th>
                    <th className="text-center py-2 font-medium">已读天数</th>
                    <th className="text-center py-2 font-medium">完成率</th>
                    <th className="text-center py-2 font-medium">停滞天数</th>
                  </tr>
                </thead>
                <tbody>
                  {unfinishedBooks.map((b) => (
                    <tr
                      key={b.title}
                      className="border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <td className="py-2 text-ink-700 max-w-[140px] truncate">
                        {b.title}
                      </td>
                      <td className="text-center py-2 text-ink-600">
                        {b.daysSinceStart}
                      </td>
                      <td className="text-center py-2 text-ink-600">
                        {b.progress}%
                      </td>
                      <td
                        className={`text-center py-2 font-medium ${
                          b.stallDays > 7
                            ? 'text-classic-cinnabar'
                            : 'text-ink-600'
                        }`}
                      >
                        {b.stallDays}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
