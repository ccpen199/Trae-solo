import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, Star, BookOpen } from 'lucide-react';

const API = '/api';

interface MatchedStudent {
  id: number;
  name: string;
  major: string;
  grade: string;
  match_score?: number;
  matchScore?: number;
  skills: string[];
  matched_skills?: string[];
  matchedSkills?: string[];
  credit_score: number;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? 'text-emerald-500' : score >= 70 ? 'text-blue-500' : 'text-amber-500';

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius} fill="none" strokeWidth="6"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000`}
        />
      </svg>
      <span className={`absolute font-mono font-bold text-lg ${color}`}>{score}</span>
    </div>
  );
}

export default function JobMatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  const [students, setStudents] = useState<MatchedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState<number | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/jobs/${id}/matches`);
        if (!res.ok) throw new Error(`请求失败: ${res.status}`);
        const json = await res.json();
        const d = json.data ?? json;
        setStudents(d.items ?? d ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载匹配数据失败');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMatches();
  }, [id]);

  const handleInvite = async (studentId: number) => {
    setInviting(studentId);
    try {
      const res = await fetch(`${API}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: Number(id), type: 'group_chat' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `邀请失败: ${res.status}`);
      }
      alert('邀请面试已发送');
    } catch (err) {
      alert(err instanceof Error ? err.message : '邀请面试失败');
    } finally {
      setInviting(null);
    }
  };

  const getScore = (student: MatchedStudent) => student.match_score ?? student.matchScore ?? 0;
  const getMatchedSkills = (student: MatchedStudent) => student.matched_skills ?? student.matchedSkills ?? [];

  const sorted = [...students].sort((a, b) =>
    sortBy === 'score' ? getScore(b) - getScore(a) : a.name.localeCompare(b.name)
  );

  const matchedSkillsSet = new Set(students.flatMap((s) => getMatchedSkills(s)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/jobs')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-heading font-bold text-gray-800">岗位匹配</h2>
            <p className="text-sm text-gray-500">岗位ID: {id} · 找到 {students.length} 位匹配学生</p>
          </div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
          className="input-base w-36"
        >
          <option value="score">按匹配度排序</option>
          <option value="name">按姓名排序</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card-base p-12 text-center text-gray-400 text-sm">加载中...</div>
      ) : sorted.length === 0 ? (
        <div className="card-base p-12 text-center text-gray-400 text-sm">暂无匹配学生</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((student, i) => (
            <div key={student.id} className={`card-base p-5 animate-fade-in stagger-${Math.min(i + 1, 4)}`}>
              <div className="flex items-start gap-4">
                <ScoreRing score={getScore(student)} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-semibold text-gray-800">{student.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{student.major} · {student.grade}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Star size={12} className="text-amber-400" />
                    <span className="text-xs text-gray-500">信用分 {student.credit_score}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {(student.skills ?? []).map((skill) => (
                  <span
                    key={skill}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      matchedSkillsSet.has(skill) || getMatchedSkills(student).includes(skill)
                        ? 'bg-accent/10 text-accent'
                        : 'bg-primary/5 text-primary'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
              {getMatchedSkills(student).length > 0 && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">匹配技能</p>
                  <div className="flex flex-wrap gap-1">
                    {getMatchedSkills(student).map((skill) => (
                      <span key={skill} className="bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => handleInvite(student.id)}
                disabled={inviting === student.id}
                className="mt-4 w-full btn-accent flex items-center justify-center gap-2 text-sm py-2 disabled:opacity-50"
              >
                <UserPlus size={14} />
                {inviting === student.id ? '邀请中...' : '邀请面试'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
