import { useState } from 'react';
import { Search, Filter, Clock, Star, ChevronRight, Calendar } from 'lucide-react';
import { mockInterviews } from '@/mock/data';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function InterviewTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(mockInterviews[2]?.id || null);

  const roundLabels: Record<string, string> = {
    first: '初试',
    second: '复试',
    final: '终面',
  };

  const statusLabels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    rejected: '已拒绝',
    expired: '已过期',
    completed: '已完成',
  };

  const statusBadges: Record<string, string> = {
    pending: 'bg-sand-100 text-sand-700',
    confirmed: 'bg-spruce-100 text-spruce-700',
    rejected: 'bg-terracotta-100 text-terracotta-700',
    expired: 'bg-ash-100 text-ash-600',
    completed: 'bg-spruce-100 text-spruce-700',
  };

  const filtered = mockInterviews.filter((i) => {
    const matchesSearch = i.resumeName.includes(search) || i.jobTitle.includes(search);
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selected = mockInterviews.find((i) => i.id === selectedId);

  const renderStars = (score: number) => {
    const normalizedScore = Math.round(score / 20);
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < normalizedScore ? 'text-sand-500 fill-sand-500' : 'text-ash-300'}
      />
    ));
  };

  const attributionColors: Record<string, string> = {
    '逻辑思维': 'bg-spruce-100 text-spruce-700',
    '产品规划': 'bg-terracotta-100 text-terracotta-700',
    '沟通表达': 'bg-sand-100 text-sand-700',
    '设计能力': 'bg-terracotta-100 text-terracotta-700',
    '作品集质量': 'bg-spruce-100 text-spruce-700',
    '创意思维': 'bg-sand-100 text-sand-700',
    '设计效率': 'bg-spruce-100 text-spruce-700',
    '需求理解': 'bg-terracotta-100 text-terracotta-700',
    '方案产出': 'bg-sand-100 text-sand-700',
    '综合能力': 'bg-spruce-100 text-spruce-700',
    '团队匹配': 'bg-terracotta-100 text-terracotta-700',
    '发展潜力': 'bg-sand-100 text-sand-700',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索候选人、职位..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-36"
        >
          <option value="all">全部状态</option>
          <option value="pending">待确认</option>
          <option value="confirmed">已确认</option>
          <option value="completed">已完成</option>
          <option value="rejected">已拒绝</option>
        </select>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          高级筛选
        </button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        <div className="w-1/2 card overflow-y-auto">
          <div className="divide-y divide-ash-100">
            {filtered.map((interview) => (
              <div
                key={interview.id}
                onClick={() => setSelectedId(interview.id)}
                className={`p-5 cursor-pointer transition-all hover:bg-ash-50/50 ${
                  selectedId === interview.id ? 'bg-terracotta-50/50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-spruce-400 to-spruce-600 flex items-center justify-center text-white font-medium">
                      {interview.resumeName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-ash-700">{interview.resumeName}</p>
                      <p className="text-sm text-ash-500">{interview.jobTitle}</p>
                    </div>
                  </div>
                  <span className={`badge ${statusBadges[interview.status]}`}>
                    {statusLabels[interview.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-ash-500 flex items-center gap-1">
                    <Calendar size={14} />
                    {format(new Date(interview.scheduledTime), 'M月d日 HH:mm', { locale: zhCN })}
                  </span>
                  <span className="text-sm text-ash-500">
                    {interview.rounds.length}/3 轮
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/2 card overflow-y-auto p-6">
          {selected ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-ash-100">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-spruce-400 to-spruce-600 flex items-center justify-center text-white text-2xl font-serif font-bold">
                  {selected.resumeName[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl font-bold text-ash-700">{selected.resumeName}</h3>
                  <p className="text-ash-500">{selected.jobTitle}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold font-serif text-spruce-600">
                    {selected.rounds.length > 0
                      ? Math.round(selected.rounds.reduce((s, r) => s + r.score, 0) / selected.rounds.length)
                      : '-'}
                  </p>
                  <p className="text-xs text-ash-400 mt-1">平均评分</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-ash-700 mb-4">面试流程跟踪</h4>
                <div className="relative">
                  {(['first', 'second', 'final'] as const).map((round, i) => {
                    const roundData = selected.rounds.find((r) => r.round === round);
                    const isCompleted = !!roundData;
                    const isCurrent = selected.currentRound === round && !isCompleted;
                    return (
                      <div key={round} className="flex gap-4 pb-6 last:pb-0">
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCompleted
                                ? 'bg-spruce-500 border-spruce-500 text-white'
                                : isCurrent
                                  ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-500'
                                  : 'bg-white border-ash-200 text-ash-300'
                            }`}
                          >
                            {isCompleted ? (
                              <span className="text-sm font-bold">{roundData?.score}</span>
                            ) : (
                              <span className="text-sm">{i + 1}</span>
                            )}
                          </div>
                          {i < 2 && (
                            <div
                              className={`absolute top-10 w-0.5 h-full ${
                                isCompleted ? 'bg-spruce-500' : 'bg-ash-100'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-ash-700">
                              {roundLabels[round]}
                            </h5>
                            {isCurrent && (
                              <span className="badge bg-terracotta-100 text-terracotta-700 text-xs">
                                当前环节
                              </span>
                            )}
                          </div>
                          {isCompleted && roundData ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                {renderStars(roundData.score)}
                                <span className="text-sm text-ash-500">{roundData.score}分</span>
                              </div>
                              <p className="text-sm text-ash-600">{roundData.feedback}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {roundData.attribution.map((attr) => (
                                  <span
                                    key={attr}
                                    className={`text-xs px-2 py-1 rounded-md ${attributionColors[attr] || 'bg-ash-100 text-ash-600'}`}
                                  >
                                    {attr}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-ash-400 flex items-center gap-1">
                                <Clock size={12} />
                                {roundData.completedAt}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-ash-400">
                              {isCurrent ? '待面试' : '未开始'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selected.status === 'completed' && (
                <div className="p-4 bg-spruce-50 rounded-xl">
                  <h5 className="font-medium text-spruce-700 mb-2">面试闭环结论</h5>
                  <p className="text-sm text-spruce-600">
                    综合三轮面试表现，该候选人综合素质优秀，与岗位匹配度高，建议录用。
                  </p>
                </div>
              )}

              {selected.rounds.length > 0 && selected.status !== 'completed' && (
                <button className="btn-primary w-full flex items-center justify-center gap-2">
                  <ChevronRight size={16} />
                  继续下一轮面试
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-ash-400">
              请选择一位候选人查看面试跟踪
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
