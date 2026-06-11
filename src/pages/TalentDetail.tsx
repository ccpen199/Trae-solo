import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, BookOpen, Award, Briefcase, MapPin, FileText, User } from 'lucide-react';

const API = '/api';

interface Application {
  job_title: string;
  job_type: string;
  salary_min: number;
  salary_max: number;
  status: string;
  cover_letter?: string;
}

interface Evaluation {
  from_user_name: string;
  score: number;
  comment: string;
  tags: string[];
}

interface TalentDetail {
  id: string;
  name: string;
  avatar: string;
  major: string;
  grade: string;
  university: string;
  gpa: string;
  email: string;
  phone: string;
  skills: string[];
  certificates: string[];
  summary: string;
  resume_text?: string;
  experience: { company: string; role: string; period: string; desc: string }[];
  education: { school: string; degree: string; period: string; major: string };
  applications: Application[];
  evaluations: Evaluation[];
}

interface MatchedJob {
  title: string;
  matchScore: number;
  salary_min: number;
  salary_max: number;
}

function highlightKeywords(text: string, keywords: string[]) {
  let result = text;
  keywords.forEach((kw) => {
    result = result.replace(
      new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      `<mark class="bg-accent/20 text-accent px-0.5 rounded">${kw}</mark>`
    );
  });
  return result;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= score ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );
}

const statusLabelMap: Record<string, string> = {
  pending: '待审核',
  accepted: '已通过',
  rejected: '已拒绝',
  interviewing: '面试中',
};

export default function TalentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [talent, setTalent] = useState<TalentDetail | null>(null);
  const [matches, setMatches] = useState<MatchedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [talentRes, matchesRes] = await Promise.all([
          fetch(`${API}/talents/${id}`),
          fetch(`${API}/talents/${id}/matches`),
        ]);
        if (!talentRes.ok) throw new Error('获取人才详情失败');
        const talentJson = await talentRes.json();
        const matchesJson = matchesRes.ok ? await matchesRes.json() : null;
        const talentData = talentJson.data ?? talentJson;
        const matchesData = matchesJson ? (matchesJson.data ?? matchesJson) : null;
        const matchItems = matchesData ? (matchesData.items ?? matchesData ?? []) : [];
        if (!cancelled) {
          setTalent(talentData);
          setMatches(matchItems);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || '请求失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const keywords = useMemo(() => {
    if (!talent) return [];
    return [...(talent.skills || []), ...(talent.certificates || [])];
  }, [talent]);

  const tagAnalysis = useMemo(() => {
    if (!talent) return [];
    const skillScores = (talent.skills || []).map((s) => ({ tag: s, score: 70 + Math.floor(Math.random() * 25) }));
    const evalTags = (talent.evaluations || []).flatMap((e) => e.tags || []);
    const uniqueEvalTags = [...new Set(evalTags)];
    const evalScores = uniqueEvalTags.map((t) => ({ tag: t, score: 75 + Math.floor(Math.random() * 20) }));
    return [...skillScores, ...evalScores];
  }, [talent]);

  if (loading) return <div className="text-center py-20 text-gray-400 animate-fade-in">加载中...</div>;
  if (error) return <div className="text-center py-20 text-red-500 animate-fade-in">{error}</div>;
  if (!talent) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/talents')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-heading font-bold text-gray-800">简历详情</h2>
        <span className="text-sm text-gray-400">ID: {id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-base p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-heading font-bold text-2xl">
                {talent.avatar || talent.name[0]}
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg text-gray-800">{talent.name}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><BookOpen size={14} />{talent.major}</span>
                  <span className="flex items-center gap-1"><Award size={14} />{talent.grade}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} />{talent.university}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  {talent.gpa && <><span>GPA: {talent.gpa}</span><span>·</span></>}
                  {talent.email && <><span>{talent.email}</span><span>·</span></>}
                  {talent.phone && <span>{talent.phone}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <h4 className="font-heading font-semibold text-gray-800 mb-3">个人简介</h4>
            <p className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightKeywords(talent.resume_text || talent.summary || '', keywords) }} />
          </div>

          <div className="card-base p-6">
            <h4 className="font-heading font-semibold text-gray-800 mb-3">技能标签</h4>
            <div className="flex flex-wrap gap-2">
              {(talent.skills || []).map((skill) => (
                <span key={skill} className="bg-accent/10 text-accent px-3 py-1.5 rounded-lg text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
            {(talent.certificates && talent.certificates.length > 0) && (
              <>
                <h4 className="font-heading font-semibold text-gray-800 mt-5 mb-3">证书资质</h4>
                <div className="flex flex-wrap gap-2">
                  {talent.certificates.map((cert) => (
                    <span key={cert} className="badge-info px-3 py-1.5 rounded-lg text-sm font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {(talent.applications && talent.applications.length > 0) && (
            <div className="card-base p-6">
              <h4 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase size={16} />实习与申请经历
              </h4>
              <div className="space-y-4">
                {talent.applications.map((app, i) => (
                  <div key={i} className="border-l-2 border-primary/30 pl-4">
                    <h5 className="font-medium text-gray-800">{app.job_title}</h5>
                    <p className="text-sm text-gray-500">{app.job_type === 'summer_winter' ? '寒暑假' : app.job_type === 'internship' ? '实习' : '线上任务'} · ¥{app.salary_min}-{app.salary_max}/月</p>
                    {app.cover_letter && <p className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: highlightKeywords(app.cover_letter || '', keywords) }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(talent.applications && talent.applications.length > 0) && (
            <div className="card-base p-6">
              <h4 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={16} />申请记录
              </h4>
              <div className="space-y-3">
                {talent.applications.map((app, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{app.job_title}</span>
                      <span className="text-xs text-gray-400 ml-2">{app.job_type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-500">¥{app.salary_min}-{app.salary_max}/月</span>
                      <span className={app.status === 'accepted' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-warning'}>
                        {statusLabelMap[app.status] || app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(talent.evaluations && talent.evaluations.length > 0) && (
            <div className="card-base p-6">
              <h4 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User size={16} />评价记录
              </h4>
              <div className="space-y-4">
                {talent.evaluations.map((evalItem, i) => (
                  <div key={i} className="border-l-2 border-accent/30 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{evalItem.from_user_name}</span>
                      <StarRating score={evalItem.score} />
                    </div>
                    <p className="text-sm text-gray-600">{evalItem.comment}</p>
                    {(evalItem.tags && evalItem.tags.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {evalItem.tags.map((tag) => (
                          <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-base p-5">
            <h4 className="font-heading font-semibold text-gray-800 mb-4">标签分析</h4>
            <div className="space-y-3">
              {tagAnalysis.map((item) => (
                <div key={item.tag}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.tag}</span>
                    <span className="font-mono text-primary">{item.score}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-base p-5">
            <h4 className="font-heading font-semibold text-gray-800 mb-4">推荐岗位</h4>
            <div className="space-y-3">
              {matches.map((job) => (
                <div key={job.title} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{job.title}</span>
                    <span className="font-mono font-bold text-accent text-sm">{job.matchScore}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">¥{job.salary_min}-{job.salary_max}/月</p>
                </div>
              ))}
              {matches.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">暂无推荐岗位</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
