import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, RefreshCw, X, CalendarCheck, ShieldCheck } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { useSessionStore } from '@/store/useSessionStore';
import { LIFE_EVENT_LABELS, type LifeEventTag, type MatchResult } from '@/types';
import { DEMO_PROFILE } from '@/lib/demoData';

const LIFE_EVENT_KEYS = Object.keys(LIFE_EVENT_LABELS) as LifeEventTag[];

function asPercent(score: number) {
  return Math.max(0, Math.min(100, Math.round(score <= 1 ? score * 100 : score)));
}

function ScoreCircle({ score }: { score: number }) {
  const value = asPercent(score);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#EDE9FE" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-lavender-600">{value}%</span>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-dark-400 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-lavender-50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${asPercent(value)}%` }} />
      </div>
      <span className="text-slate-dark-500 w-8 text-right">{asPercent(value)}%</span>
    </div>
  );
}

function CounselorCard({
  result,
  onBook,
  onViewDetails,
}: {
  result: MatchResult;
  onBook: (counselorId: string) => void;
  onViewDetails: (result: MatchResult) => void;
}) {
  const { counselor, score, breakdown } = result;
  const firstChar = counselor.anonymous_name.charAt(0);

  const credentialBadge =
    counselor.credential_type === '二级' ? (
      <span className="bg-mint-100 text-mint-500 text-xs px-2 py-0.5 rounded-full">二级</span>
    ) : (
      <span className="bg-sky-100 text-sky-500 text-xs px-2 py-0.5 rounded-full">三级</span>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-md transition"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-lavender-100 text-lavender-600 flex items-center justify-center text-lg font-semibold">
            {firstChar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-dark-800">{counselor.anonymous_name}</span>
              {credentialBadge}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-slate-dark-500">{counselor.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <ScoreCircle score={score} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {counselor.expertise_tags.map((tag) => (
          <span
            key={tag}
            className="bg-lavender-50 text-lavender-600 text-xs px-2.5 py-1 rounded-full"
          >
            {LIFE_EVENT_LABELS[tag]}
          </span>
        ))}
      </div>

      <div className="space-y-1.5 mb-4">
        <ScoreBar label="专长" value={breakdown.expertise_score} color="bg-lavender-400" />
        <ScoreBar label="时段" value={breakdown.schedule_score} color="bg-mint-400" />
        <ScoreBar label="偏好" value={breakdown.preference_score} color="bg-sky-400" />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onBook(counselor.id)}
          className="flex-1 bg-lavender-500 text-white rounded-full py-2.5 text-sm hover:bg-lavender-600 transition"
        >
          预约咨询
        </button>
        <button
          onClick={() => onViewDetails(result)}
          className="text-sm text-lavender-500 hover:text-lavender-600 transition"
        >
          查看详情
        </button>
      </div>
    </motion.div>
  );
}

function CounselorDetailModal({
  result,
  onClose,
  onBook,
}: {
  result: MatchResult;
  onClose: () => void;
  onBook: (counselorId: string) => void;
}) {
  const { counselor, score, breakdown } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-dark-900/60 px-4 py-8" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-lavender-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-lavender-100 text-lavender-600 flex items-center justify-center text-xl font-serif">
              {counselor.anonymous_name[0]}
            </div>
            <div>
              <h2 className="font-serif text-2xl text-lavender-700">{counselor.anonymous_name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-dark-500">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {counselor.rating.toFixed(1)}
                <span>服务 {counselor.session_count} 次</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-dark-400 hover:bg-lavender-50 hover:text-lavender-600">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-lavender-50 p-4">
            <div className="text-xs text-slate-dark-400">综合匹配</div>
            <div className="mt-1 text-2xl font-semibold text-lavender-700">{asPercent(score)}%</div>
          </div>
          <div className="rounded-xl bg-mint-50 p-4">
            <div className="text-xs text-slate-dark-400">可约时段</div>
            <div className="mt-1 text-2xl font-semibold text-mint-500">{asPercent(breakdown.schedule_score)}%</div>
          </div>
          <div className="rounded-xl bg-sky-50 p-4">
            <div className="text-xs text-slate-dark-400">资质状态</div>
            <div className="mt-1 text-sm font-semibold text-sky-500">证书与库验通过</div>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-medium text-slate-dark-500 mb-2">专长方向</h3>
          <div className="flex flex-wrap gap-2">
            {counselor.expertise_tags.map((tag) => (
              <span key={tag} className="rounded-full bg-lavender-50 px-3 py-1 text-xs text-lavender-600">
                {LIFE_EVENT_LABELS[tag]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-lavender-100 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-dark-700">
            <ShieldCheck size={16} className="text-mint-500" />
            匿名档案适配说明
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-dark-500">
            当前匹配综合考虑咨询场景、近期可约时段、评分与资质等级，适合用于情绪管理、压力来源梳理和后续行动计划制定。
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onBook(counselor.id)}
            className="flex-1 rounded-full bg-lavender-500 py-3 text-sm font-medium text-white hover:bg-lavender-600 transition"
          >
            预约咨询
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-full border border-lavender-200 py-3 text-sm font-medium text-lavender-600 hover:bg-lavender-50 transition">
            <CalendarCheck size={16} />
            查看可约时间
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Match() {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const { matchedCounselors, setMatchedCounselors } = useSessionStore();
  const effectiveProfile = profile ?? DEMO_PROFILE;

  const [selectedEvents, setSelectedEvents] = useState<Set<LifeEventTag>>(new Set());
  const [minRating, setMinRating] = useState(4.0);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<MatchResult | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/counselors/match?profileId=${effectiveProfile.id}`);
      const json = await res.json();
      if (json.success) {
        setMatchedCounselors(json.data);
      }
    } catch {
      console.error('匹配失败');
    } finally {
      setLoading(false);
    }
  }, [effectiveProfile.id, setMatchedCounselors]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const toggleEvent = (tag: LifeEventTag) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const filtered = matchedCounselors.filter((r) => {
    if (selectedEvents.size > 0) {
      const hasOverlap = r.counselor.expertise_tags.some((t) => selectedEvents.has(t));
      if (!hasOverlap) return false;
    }
    if (r.counselor.rating < minRating) return false;
    return true;
  });

  const handleBook = async (counselorId: string) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: effectiveProfile.id,
          counselor_id: counselorId,
          scheduled_at: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        navigate(`/session/${json.data.id}`);
      }
    } catch {
      console.error('预约失败');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-lavender-600 mb-2">为你匹配的咨询师</h1>
        <p className="text-slate-dark-400 text-sm">
          专长匹配60% · 时段适配25% · 偏好评分15%
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-[25%]">
          <div className="lg:sticky lg:top-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-soft">
              <h3 className="font-serif text-base text-lavender-600 mb-4">咨询场景</h3>
              <div className="space-y-2">
                {LIFE_EVENT_KEYS.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(tag)}
                      onChange={() => toggleEvent(tag)}
                      className="rounded border-lavender-300 text-lavender-500 focus:ring-lavender-200"
                    />
                    <span className="text-sm text-slate-dark-600">{LIFE_EVENT_LABELS[tag]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-soft">
              <h3 className="font-serif text-base text-lavender-600 mb-4">评分筛选</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min={4.0}
                  max={5.0}
                  step={0.1}
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-full accent-lavender-500"
                />
                <div className="flex justify-between text-xs text-slate-dark-400">
                  <span>4.0</span>
                  <span className="text-lavender-500 font-medium">{minRating.toFixed(1)}</span>
                  <span>5.0</span>
                </div>
              </div>
            </div>

            <button
              onClick={fetchMatches}
              disabled={loading}
              className="w-full bg-lavender-500 text-white rounded-full py-3 hover:bg-lavender-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              重新匹配
            </button>
          </div>
        </div>

        <div className="lg:w-[75%]">
          {loading && matchedCounselors.length === 0 ? (
            <div className="text-center py-16 text-slate-dark-400">正在匹配咨询师...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-dark-400">
              {matchedCounselors.length === 0 ? '暂无匹配结果' : '没有符合筛选条件的咨询师'}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filtered.map((result, i) => (
                <motion.div
                  key={result.counselor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CounselorCard result={result} onBook={handleBook} onViewDetails={setSelectedResult} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedResult && (
        <CounselorDetailModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
          onBook={handleBook}
        />
      )}
    </div>
  );
}
