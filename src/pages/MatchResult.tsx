import { useState, useEffect } from 'react';
import { Sparkles, Briefcase, Clock, Star, ChevronRight, TrendingUp } from 'lucide-react';
import api from '@/utils/api';
import { useAuthStore } from '@/store/auth';
import type { MatchResult as MatchResultType } from '../../../shared/types';
import { useNavigate } from 'react-router-dom';

export default function MatchResult() {
  const [matches, setMatches] = useState<MatchResultType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs/match/results');
      setMatches(res.matches || []);
    } catch (err) {
      console.error('加载匹配结果失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-500';
    if (score >= 60) return 'text-accent-500';
    return 'text-gray-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success-50 border-success-200';
    if (score >= 60) return 'bg-accent-50 border-accent-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">智能匹配</h1>
            <p className="text-gray-500 text-sm">基于你的专业、课程表和历史评价，为你精准推荐岗位</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-card p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无匹配结果</h3>
          <p className="text-gray-500">完善你的专业信息和课程表，获取更精准的匹配</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <div
              key={match.job.id}
              className="bg-white rounded-2xl shadow-card p-6 hover:shadow-cardHover transition-all duration-300 cursor-pointer group opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
              onClick={() => navigate(`/jobs/${match.job.id}`)}
            >
              <div className="flex gap-6">
                <div className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center border-2 ${getScoreBgColor(match.score)}`}>
                  <span className={`text-2xl font-bold ${getScoreColor(match.score)}`}>
                    {match.score}
                  </span>
                  <span className="text-xs text-gray-500">匹配度</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {match.job.title}
                        </h3>
                        {index < 3 && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-accent-500 to-accent-400 text-white text-xs font-medium rounded-full">
                            TOP {index + 1}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        {match.job.company?.name} · {match.job.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-accent-500">
                        ¥{match.job.salaryPerHour}
                        <span className="text-sm font-normal text-gray-500">/时</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{match.job.workDays?.join('、') || '工作日'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span>{match.breakdown.ratingScore}分评价</span>
                    </div>
                    {match.job.applicationCount !== undefined && (
                      <div className="text-sm text-gray-500">
                        {match.job.applicationCount}人投递
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {match.reasons.map((reason, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-full flex items-center gap-1"
                      >
                        <TrendingUp className="w-3 h-3" />
                        {reason}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">专业匹配</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${match.breakdown.majorMatch}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {match.breakdown.majorMatch}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">时段匹配</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success-500 rounded-full"
                            style={{ width: `${match.breakdown.scheduleMatch}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {match.breakdown.scheduleMatch}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">历史评价</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${match.breakdown.ratingScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {match.breakdown.ratingScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-400 group-hover:text-primary-500 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
