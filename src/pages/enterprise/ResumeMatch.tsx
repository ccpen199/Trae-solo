import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, GraduationCap, Briefcase, ChevronRight, Zap } from 'lucide-react';
import { mockResumes } from '@/mock/data';
import SkillRadarChart from '@/components/SkillRadarChart';

export default function ResumeMatch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [matchFilter, setMatchFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'experience'>('score');
  const [selectedId, setSelectedId] = useState<string | null>(mockResumes[0]?.id || null);

  const filteredResumes = mockResumes
    .filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      const matchesMatch =
        matchFilter === 'all' ||
        (matchFilter === 'high' && r.matchScore >= 85) ||
        (matchFilter === 'medium' && r.matchScore >= 70 && r.matchScore < 85) ||
        (matchFilter === 'low' && r.matchScore < 70);
      return matchesSearch && matchesMatch;
    })
    .sort((a, b) => (sortBy === 'score' ? b.matchScore - a.matchScore : b.experience.length - a.experience.length));

  const selected = mockResumes.find((r) => r.id === selectedId);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-spruce-600';
    if (score >= 70) return 'text-sand-600';
    return 'text-ash-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-spruce-500';
    if (score >= 70) return 'bg-sand-500';
    return 'bg-ash-400';
  };

  const circumference = 2 * Math.PI * 40;
  const scoreProgress = (score: number) => ((100 - score) / 100) * circumference;

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)] animate-fade-in">
      <div className="w-96 flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名、技能..."
              className="input-field pl-10"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={16} />
            筛选
          </button>
        </div>

        <div className="flex gap-3">
          <select
            value={matchFilter}
            onChange={(e) => setMatchFilter(e.target.value)}
            className="input-field text-sm flex-1"
          >
            <option value="all">全部匹配度</option>
            <option value="high">高匹配（≥85分）</option>
            <option value="medium">中匹配（70-84分）</option>
            <option value="low">低匹配（＜70分）</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | 'experience')}
            className="input-field text-sm flex-1"
          >
            <option value="score">按匹配度</option>
            <option value="experience">按经验</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredResumes.map((r) => {
            const active = r.id === selectedId;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`card p-4 cursor-pointer transition-all ${
                  active ? 'border-terracotta-500 shadow-elevated' : 'hover:shadow-soft'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E6E7" strokeWidth="6" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={r.matchScore >= 85 ? '#2D6A4F' : r.matchScore >= 70 ? '#D4A843' : '#8E9296'}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={scoreProgress(r.matchScore)}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span
                      className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${getScoreColor(
                        r.matchScore
                      )}`}
                    >
                      {r.matchScore}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-ash-700">{r.name}</p>
                      {r.matchScore >= 85 && (
                        <span className="badge bg-spruce-100 text-spruce-700 flex items-center gap-1">
                          <Zap size={12} />
                          优
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ash-500 mt-0.5 flex items-center gap-1">
                      <GraduationCap size={12} />
                      {r.education.split(' ')[0]}
                    </p>
                    <p className="text-sm text-ash-500 mt-1 flex items-center gap-1">
                      <Briefcase size={12} />
                      {r.experience.split('年')[0]}年经验
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.matchedKeywords.slice(0, 3).map((kw) => (
                        <span
                          key={kw}
                          className="text-xs px-2 py-0.5 bg-terracotta-50 text-terracotta-600 rounded-md"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 card overflow-y-auto">
        {selected ? (
          <div className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-spruce-400 to-spruce-600 flex items-center justify-center text-white text-3xl font-serif font-bold">
                  {selected.name[0]}
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-ash-700">{selected.name}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-ash-500">
                    <span className="flex items-center gap-1">
                      <GraduationCap size={14} />
                      {selected.education}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase size={14} />
                      {selected.experience.split('，')[0]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBg(
                    selected.matchScore
                  )} bg-opacity-10`}
                >
                  <span className={`text-4xl font-bold font-serif ${getScoreColor(selected.matchScore)}`}>
                    {selected.matchScore}
                  </span>
                </div>
                <p className="text-sm text-ash-500 mt-2">NLP匹配度</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-serif font-bold text-ash-700 mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-terracotta-500" />
                  关键词匹配
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selected.matchedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-3 py-1.5 bg-terracotta-50 text-terracotta-700 rounded-lg text-sm font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-ash-500 mt-4">
                  共命中 <span className="font-semibold text-terracotta-600">{selected.matchedKeywords.length}</span> 个关键词
                </p>
              </div>

              <div className="card p-6">
                <h3 className="font-serif font-bold text-ash-700 mb-4">技能雷达分析</h3>
                <SkillRadarChart data={selected.skillRadar} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-serif font-bold text-ash-700 mb-4">技能标签</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-ash-50 text-ash-600 rounded-lg text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <h3 className="font-serif font-bold text-ash-700">联系方式</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-ash-500 w-16">手机号</span>
                    <span className="text-ash-700 font-medium">{selected.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-ash-500 w-16">邮箱</span>
                    <span className="text-ash-700 font-medium">{selected.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 card p-6">
              <h3 className="font-serif font-bold text-ash-700 mb-4">工作经历</h3>
              <p className="text-ash-600 leading-relaxed">{selected.experience}</p>
            </div>

            <div className="flex gap-3 mt-8">
              <button className="btn-secondary flex-1 py-3">标记简历</button>
              <button className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                <Calendar size={18} />
                一键邀约面试
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-ash-400">
            请从左侧选择一份简历查看详情
          </div>
        )}
      </div>
    </div>
  );
}
