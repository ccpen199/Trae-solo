import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  ArrowLeft,
  Video,
  TrendingUp,
  Clock,
  Award,
  DollarSign,
  Flame,
  Users,
  BarChart3,
  Rocket,
  Sparkles,
  Loader2,
  Mic,
  Star,
  Milestone as StairsIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { encyclopediaApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { WorkflowVideoSection, InterviewAudioSection, EntryLadderSection } from '@/components/encyclopedia';
import type {
  EncyclopediaEntry,
  CertificationCard,
} from '@shared/types';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

const SALARY_BAR_COLORS = ['#10B981','#34D399','#6EE7B7','#8B5CF6','#A78BFA','#C4B5FD','#3A5FA8','#6086C6','#94AED9','#F59E0B'];

const TAB_CONFIG = [
  { id: 'workflow', name: '真实工作流', icon: Video, hash: '#workflow' },
  { id: 'interviews', name: '从业者访谈', icon: Mic, hash: '#interviews' },
  { id: 'ladder', name: '入行阶梯', icon: StairsIcon, hash: '#ladder' },
  { id: 'salary', name: '薪资前景', icon: BarChart3, hash: '#salary' },
  { id: 'certification', name: '认证推荐', icon: Award, hash: '#certification' },
];

const DEFAULT_CERTIFICATIONS: CertificationCard[] = [
  { id: 'c1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', difficulty: 'advanced', estimatedHours: 150, relevance: 85, passRate: 65, relatedJobs: ['后端工程师', '运维工程师'] },
  { id: 'c2', name: 'Google Professional Cloud Architect', issuer: 'Google Cloud', difficulty: 'advanced', estimatedHours: 140, relevance: 82, passRate: 60, relatedJobs: ['后端工程师', '算法工程师'] },
  { id: 'c3', name: 'CKA Kubernetes Administrator', issuer: 'CNCF', difficulty: 'intermediate', estimatedHours: 100, relevance: 78, passRate: 72, relatedJobs: ['运维工程师', '后端工程师'] },
  { id: 'c4', name: 'Meta Front-End Developer', issuer: 'Meta', difficulty: 'basic', estimatedHours: 60, relevance: 75, passRate: 85, relatedJobs: ['前端工程师'] },
  { id: 'c5', name: 'PMP Project Management', issuer: 'PMI', difficulty: 'intermediate', estimatedHours: 120, relevance: 72, passRate: 68, relatedJobs: ['产品经理', '项目经理'] },
  { id: 'c6', name: 'Google UX Design Professional', issuer: 'Google', difficulty: 'intermediate', estimatedHours: 180, relevance: 80, passRate: 75, relatedJobs: ['UI设计师', '产品经理'] },
];

function StatBlock({ label, value, unit, icon, gradient }: {
  label: string; value: string; unit?: string; icon: React.ReactNode; gradient: string;
}) {
  return (
    <div className="relative rounded-2xl p-5 bg-white/60 backdrop-blur border border-white/80 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}<span className="text-sm font-normal text-slate-500 ml-1">{unit}</span></p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

const DIFFICULTY_STYLES: Record<string, string> = {
  basic: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  advanced: 'bg-rose-50 text-rose-700 border-rose-200',
};

const DIFFICULTY_LABEL: Record<string, string> = { basic: '入门级', intermediate: '进阶级', advanced: '专家级' };

export default function EncyclopediaDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const diagnosisReport = useAppStore((s) => s.currentDiagnosisReport);

  const [entry, setEntry] = useState<EncyclopediaEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [certifications, setCertifications] = useState<CertificationCard[]>([]);
  const [activeTab, setActiveTab] = useState('workflow');

  useEffect(() => {
    if (!jobId) { setNotFound(true); setIsLoading(false); return; }
    setIsLoading(true);
    encyclopediaApi
      .getJobById(jobId)
      .then((data) => { if (data) setEntry(data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    encyclopediaApi
      .getCertifications({ jobId, page: 1, pageSize: 6 })
      .then((res) => { if (res.data?.length) setCertifications(res.data as unknown as CertificationCard[]); })
      .catch(() => setCertifications(DEFAULT_CERTIFICATIONS));
  }, [jobId]);

  useEffect(() => {
    const tab = TAB_CONFIG.find((t) => t.hash === location.hash);
    if (tab) {
      setActiveTab(tab.id);
      setTimeout(() => {
        const el = document.getElementById(tab.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash]);

  const salaryBarData = useMemo(() => {
    if (!entry) return [
      { city: '北京', 平均月薪: 28 }, { city: '上海', 平均月薪: 27 }, { city: '深圳', 平均月薪: 26 },
      { city: '杭州', 平均月薪: 24 }, { city: '广州', 平均月薪: 22 }, { city: '成都', 平均月薪: 18 },
      { city: '武汉', 平均月薪: 17 }, { city: '西安', 平均月薪: 16 }, { city: '南京', 平均月薪: 20 }, { city: '苏州', 平均月薪: 19 },
    ];
    return entry.avgSalaryDistribution.map((s) => ({ city: s.city, 平均月薪: Math.round(s.avg / 1000 * 10) / 10 }));
  }, [entry]);

  const salaryLineData = useMemo(() => [
    { level: '初级', 薪资: 12 }, { level: '中级', 薪资: 22 }, { level: '高级', 薪资: 35 }, { level: '专家', 薪资: 55 }, { level: '资深专家', 薪资: 80 },
  ], []);

  const handleStartJourney = () => navigate('/onboarding');
  const handleViewCompetency = () => { if (entry) navigate(`/competency/${entry.jobId}`); };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-64 rounded-3xl bg-slate-200" />
            <div className="grid grid-cols-5 gap-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-200" />)}</div>
            <div className="h-96 rounded-3xl bg-slate-200" />
          </div>
        </div>
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-slate-600 font-medium">正在加载职业百科...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-6">
        <Card variant="glass" className="max-w-md w-full p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-slate-900 mb-3">岗位未找到</h2>
          <p className="text-slate-500 mb-8">你访问的职业百科条目不存在，可能已被移除或ID有误。</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>返回上一页</Button>
            <Button onClick={() => navigate('/encyclopedia')}>浏览职业百科</Button>
          </div>
        </Card>
      </div>
    );
  }

  const avgSalary = entry.avgSalaryDistribution.reduce((s, c) => s + c.avg, 0) / Math.max(entry.avgSalaryDistribution.length, 1);

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none top-0">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute top-80 right-20 w-[480px] h-[480px] rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute bottom-60 left-1/3 w-80 h-80 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.nav variants={fadeIn} initial="hidden" animate="show" className="mb-6 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/encyclopedia" className="text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />职业百科
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">{entry.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-700">{entry.jobName}</span>
          </div>
        </motion.nav>

        <motion.section variants={staggerContainer} initial="hidden" animate="show" className="mb-10">
          <motion.div variants={fadeInUp}>
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 rounded-3xl p-[2px]" style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.6) 0%, rgba(167,139,250,0.6) 50%, rgba(58,95,168,0.6) 100%)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor', maskComposite: 'exclude',
              }} />
              <div className="glass-card rounded-3xl p-8 lg:p-10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-200/50 to-violet-200/40 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-violet-200/50 to-blue-200/40 blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="emerald" size="md" withDot><Sparkles className="w-3.5 h-3.5 mr-1" />热门岗位</Badge>
                    <Badge variant="indigo" size="md">{entry.category}</Badge>
                  </div>
                  <h1 className="font-heading text-4xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
                    <span className="gradient-text">{entry.jobName}</span>
                  </h1>
                  <p className="text-slate-600 leading-relaxed text-base max-w-2xl mb-8">{entry.overview}</p>
                  <div className="grid lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                      <StatBlock label="平均薪资" value={`¥${Math.round(avgSalary / 1000)}K`} unit="/月" icon={<DollarSign className="w-5 h-5" />} gradient="from-emerald-500 to-teal-500" />
                      <StatBlock label="需求增长" value="+18%" unit="3年" icon={<TrendingUp className="w-5 h-5" />} gradient="from-violet-500 to-purple-500" />
                      <StatBlock label="入行门槛" value="3/5" unit="星" icon={<Star className="w-5 h-5" />} gradient="from-amber-500 to-orange-500" />
                      <StatBlock label="竞争强度" value="中高" unit="⭐⭐⭐⭐" icon={<Flame className="w-5 h-5" />} gradient="from-blue-500 to-indigo-500" />
                    </div>
                    <div className="lg:col-span-7 flex flex-col sm:flex-row gap-3">
                      <Button size="lg" fullWidth rightIcon={<Rocket className="w-5 h-5" />} onClick={handleStartJourney} className="sm:flex-1">以此岗位为目标开始诊断 →</Button>
                      <Button variant="outline" size="lg" fullWidth leftIcon={<BarChart3 className="w-5 h-5" />} onClick={handleViewCompetency} className="sm:flex-1">查看能力图谱 →</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-4 mt-4 border-t border-slate-100">
                    <Users className="w-3.5 h-3.5" />
                    已有 <span className="font-semibold text-slate-700">12,458</span> 人通过此页开始规划
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mb-8">
          <motion.div variants={fadeInUp}>
            <div className="glass-card rounded-2xl p-2 inline-flex flex-wrap gap-1">
              {TAB_CONFIG.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      navigate(`/encyclopedia/${jobId}${tab.hash}`, { replace: true });
                      const el = document.getElementById(tab.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`relative px-4 lg:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      isActive ? 'text-white' : 'text-slate-600 hover:text-emerald-600 hover:bg-white/60'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-violet-500 shadow-lg shadow-emerald-500/25"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        <div className="space-y-16">
          <WorkflowVideoSection steps={entry.workflow || []} jobName={entry.jobName} />
          <InterviewAudioSection interviews={entry.interviews || []} jobName={entry.jobName} />
          <EntryLadderSection ladder={entry.entryThresholdLadder || []} jobName={entry.jobName} diagnosisReport={diagnosisReport} onStartJourney={handleStartJourney} />

          <motion.section id="salary" variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-900">薪资前景</h2>
                <p className="text-sm text-slate-500">不同城市与级别的薪资分布</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-300/50 to-transparent ml-4" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div whileHover={{ y: -2 }} className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-slate-800 mb-4">各城市平均月薪 (K)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={salaryBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="city" tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                    <Tooltip />
                    <Bar dataKey="平均月薪" radius={[6, 6, 0, 0]}>
                      {salaryBarData.map((_, i) => <Cell key={i} fill={SALARY_BAR_COLORS[i % SALARY_BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-slate-800 mb-4">级别-薪资趋势 (K/月)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={salaryLineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="薪资" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: '#10B981' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </motion.section>

          <motion.section id="certification" variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-900">认证推荐</h2>
                <p className="text-sm text-slate-500">提升竞争力的专业认证</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-300/50 to-transparent ml-4" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(certifications.length > 0 ? certifications : DEFAULT_CERTIFICATIONS).map((cert) => (
                <motion.div key={cert.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <Card hoverable className="p-5 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-800 text-sm leading-tight flex-1 mr-2">{cert.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLES[cert.difficulty]}`}>
                        {DIFFICULTY_LABEL[cert.difficulty]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{cert.issuer}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cert.estimatedHours}h</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />相关度 {cert.relevance}%</span>
                    </div>
                    {cert.passRate > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">通过率</span>
                          <span className="text-emerald-600 font-semibold">{cert.passRate}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${cert.passRate}%` }} />
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
