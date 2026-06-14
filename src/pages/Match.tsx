import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, RefreshCw } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { useSessionStore } from '@/store/useSessionStore';
import { LIFE_EVENT_LABELS, type LifeEventTag, type MatchResult } from '@/types';

const LIFE_EVENT_KEYS = Object.keys(LIFE_EVENT_LABELS) as LifeEventTag[];

function ScoreCircle({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

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
      <span className="absolute text-sm font-semibold text-lavender-600">{score}%</span>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-dark-400 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-lavender-50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-slate-dark-500 w-8 text-right">{value}%</span>
    </div>
  );
}

function CounselorCard({ result, onBook }: { result: MatchResult; onBook: (counselorId: string) => void }) {
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
        <button className="text-sm text-lavender-500 hover:text-lavender-600 transition">
          查看详情
        </button>
      </div>
    </motion.div>
  );
}

export default function Match() {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const { matchedCounselors, setMatchedCounselors } = useSessionStore();

  const [selectedEvents, setSelectedEvents] = useState<Set<LifeEventTag>>(new Set());
  const [minRating, setMinRating] = useState(4.0);
  const [loading, setLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/counselors/match?profileId=${profile.id}`);
      const json = await res.json();
      if (json.success) {
        setMatchedCounselors(json.data);
      }
    } catch {
      console.error('匹配失败');
    } finally {
      setLoading(false);
    }
  }, [profile, setMatchedCounselors]);

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
    if (!profile) return;
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
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

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-3xl p-8 shadow-soft text-center max-w-md">
          <ShieldCheck className="w-12 h-12 text-lavender-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-lavender-600 mb-2">请先完成匿名建档</h2>
          <p className="text-slate-dark-400 mb-6">创建你的心理健康档案后，即可匹配咨询师</p>
          <Link
            to="/profile"
            className="inline-block bg-lavender-500 text-white rounded-full px-8 py-3 hover:bg-lavender-600 transition"
          >
            前往建档
          </Link>
        </div>
      </div>
    );
  }

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
                  <CounselorCard result={result} onBook={handleBook} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
