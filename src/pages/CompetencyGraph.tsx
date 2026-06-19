import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Flame, BookOpen, Rocket, ArrowRight,
  Wrench, Brain, Award, TrendingUp, Target, Sparkles,
} from 'lucide-react';
import { competencyApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { mockIndustries } from '@/data/mockIndustries';
import { getMockCompetencyModel } from '@/data/mockCompetency';
import HardSkillTree from '@/components/competency/HardSkillTree';
import SoftSkillRadar from '@/components/competency/SoftSkillRadar';
import CertificationGrid from '@/components/competency/CertificationGrid';
import PromotionPathView from '@/components/competency/PromotionPathView';
import type { CompetencyModel, PromotionPath as PromotionPathType } from '@shared/types';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

interface FlatJob {
  id: string;
  name: string;
  industry: string;
  industryId: string;
  category: string;
  level: string;
  avgSalary: number;
  hotness: number;
}

const levelOptions = [
  { value: 'entry', label: '入门' },
  { value: 'junior', label: '初级' },
  { value: 'middle', label: '中级' },
  { value: 'senior', label: '高级' },
  { value: 'expert', label: '专家' },
];

const MOCK_PROMO: PromotionPathType = {
  fromJobId: 'default',
  totalEstimatedMonths: 84,
  nodes: [
    { id: 'n1', jobName: '初级工程师', level: '初级', estimatedMonths: 0, keyThresholds: ['掌握核心技术栈', '独立完成开发'], avgSalaryRange: [10000, 18000] },
    { id: 'n2', jobName: '中级工程师', level: '中级', estimatedMonths: 24, keyThresholds: ['架构设计能力', '性能优化经验'], avgSalaryRange: [18000, 30000] },
    { id: 'n3', jobName: '高级工程师', level: '高级', estimatedMonths: 36, keyThresholds: ['技术选型决策', '团队影响力'], avgSalaryRange: [30000, 50000] },
    { id: 'n4', jobName: '技术专家', level: '专家', estimatedMonths: 48, keyThresholds: ['跨部门规划', '商业价值转化'], avgSalaryRange: [50000, 90000] },
  ],
};

type TabKey = 'hardSkills' | 'softSkills' | 'certifications' | 'promotion';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'hardSkills', label: '硬技能树', icon: <Wrench className="w-4 h-4" /> },
  { key: 'softSkills', label: '软技能维度', icon: <Brain className="w-4 h-4" /> },
  { key: 'certifications', label: '认证要求', icon: <Award className="w-4 h-4" /> },
  { key: 'promotion', label: '晋升路径', icon: <TrendingUp className="w-4 h-4" /> },
];

export default function CompetencyGraph() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [selIndustry, setSelIndustry] = useState<string | null>(null);
  const [selLevel, setSelLevel] = useState<string | null>(null);
  const [selJobId, setSelJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('hardSkills');
  const [model, setModel] = useState<CompetencyModel | null>(null);
  const [promoPath, setPromoPath] = useState<PromotionPathType | null>(null);
  const [loading, setLoading] = useState(false);

  const allJobs = useMemo<FlatJob[]>(() => {
    return mockIndustries.flatMap((ind) =>
      ind.categories.flatMap((cat) =>
        cat.jobs.map((j) => ({
          id: j.id,
          name: j.name,
          industry: ind.name,
          industryId: ind.id,
          category: cat.name,
          level: j.level,
          avgSalary: j.avgSalary,
          hotness: j.hotness,
        }))
      )
    );
  }, []);

  const filtered = useMemo(() => {
    let list = allJobs;
    const kw = keyword.trim().toLowerCase();
    if (kw) list = list.filter((j) => j.name.toLowerCase().includes(kw) || j.industry.toLowerCase().includes(kw));
    if (selIndustry) list = list.filter((j) => j.industryId === selIndustry);
    if (selLevel) list = list.filter((j) => j.level === selLevel);
    return list;
  }, [allJobs, keyword, selIndustry, selLevel]);

  useEffect(() => {
    if (!selJobId) { setModel(null); setPromoPath(null); return; }
    setLoading(true);
    Promise.all([
      competencyApi.getCompetencyJobDetail(selJobId).catch(() => getMockCompetencyModel(selJobId)),
      competencyApi.getPromotionPath(selJobId).catch(() => MOCK_PROMO),
    ]).then(([m, p]) => {
      setModel(m || getMockCompetencyModel(selJobId));
      setPromoPath(p || MOCK_PROMO);
    }).finally(() => setLoading(false));
  }, [selJobId]);

  const selectJob = (id: string) => {
    setSelJobId(id);
    setActiveTab('hardSkills');
  };

  return (
    <div className="min-h-screen pt-20 pb-16 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none top-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute top-60 right-10 w-[420px] h-[420px] rounded-full bg-lavender-200/25 blur-3xl" />
        <div className="absolute bottom-40 left-10 w-80 h-80 rounded-full bg-space-indigo-200/20 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mb-8">
          <motion.div variants={fadeInUp}>
            <Badge variant="emerald" size="md" withDot className="mb-3">
              <Target className="w-3.5 h-3.5 mr-1" />
              科学的岗位能力评估体系
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeInUp} className="font-heading text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            职业<span className="gradient-text">能力图谱中心</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-slate-600 mb-6">
            完整岗位胜任力模型 · 硬技能软技能双维拆解 · 认证晋升全景规划
          </motion.p>

          <motion.div variants={fadeInUp} className="relative max-w-2xl mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索岗位查看完整胜任力模型"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/80 backdrop-blur-xl border-2 border-slate-200/80 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none text-slate-900 placeholder:text-slate-400 font-medium transition-all shadow-lg shadow-slate-200/40"
            />
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-3">
            <span className="text-sm text-slate-500 mr-1 self-center">行业：</span>
            {mockIndustries.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setSelIndustry(selIndustry === ind.id ? null : ind.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selIndustry === ind.id
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-md shadow-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                }`}
              >
                {ind.name}
              </button>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-2">
            <span className="text-sm text-slate-500 mr-1 self-center">职级：</span>
            {levelOptions.map((lv) => (
              <button
                key={lv.value}
                onClick={() => setSelLevel(selLevel === lv.value ? null : lv.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selLevel === lv.value
                    ? 'bg-gradient-to-r from-lavender-500 to-lavender-400 text-white shadow-md shadow-lavender-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-lavender-50 hover:text-lavender-700 border border-slate-200'
                }`}
              >
                {lv.label}
              </button>
            ))}
          </motion.div>
        </motion.div>

        <div className="flex gap-6 items-start">
          <motion.aside variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="w-72 flex-shrink-0 sticky top-20">
            <Card variant="glass" className="p-3 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  岗位列表
                </h3>
                <Badge variant="indigo" size="sm">{filtered.length}</Badge>
              </div>
              <div className="space-y-1">
                {filtered.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => selectJob(job.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      selJobId === job.id
                        ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/60 border-2 border-emerald-400 shadow-sm shadow-emerald-100'
                        : 'hover:bg-slate-50/80 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-sm ${selJobId === job.id ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {job.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-[10px] text-orange-600 font-semibold">{job.hotness}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{job.industry} · {job.category}</span>
                      <span className="text-xs font-bold gradient-text">¥{(job.avgSalary / 1000).toFixed(0)}K</span>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-400">暂无匹配岗位</div>
                )}
              </div>
            </Card>
          </motion.aside>

          <main className="flex-1 min-w-0">
            {!selJobId ? (
              <Card variant="glass" className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="font-heading text-2xl font-bold gradient-text mb-3">选择岗位查看完整胜任力模型</h3>
                <p className="text-slate-500">从左侧列表中选择一个岗位，即可查看硬技能树、软技能维度、认证要求和晋升路径</p>
              </Card>
            ) : loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
                  <p className="text-slate-500">正在加载能力图谱...</p>
                </div>
              </div>
            ) : model ? (
              <motion.div variants={staggerContainer} initial="hidden" animate="show">
                <motion.div variants={fadeInUp} className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="emerald" size="md" withDot><Sparkles className="w-3.5 h-3.5 mr-1" />胜任力模型</Badge>
                    <Badge variant="indigo" size="md">{model.jobLevel}</Badge>
                  </div>
                  <h2 className="font-heading text-3xl font-bold gradient-text mb-1">{model.jobName}</h2>
                  <p className="text-sm text-slate-500">{model.educationRequirement} · {model.yearsOfExperience.min}-{model.yearsOfExperience.ideal}年经验</p>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex gap-1 mb-6 p-1 bg-white/60 backdrop-blur rounded-xl border border-slate-200/60">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.key
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100/80'
                      }`}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {activeTab === 'hardSkills' && <HardSkillTree hardSkills={model.hardSkills} />}
                    {activeTab === 'softSkills' && <SoftSkillRadar softSkills={model.softSkills} />}
                    {activeTab === 'certifications' && <CertificationGrid certifications={model.certifications} />}
                    {activeTab === 'promotion' && promoPath && <PromotionPathView promotionPath={promoPath} currentJobId={selJobId} />}
                  </motion.div>
                </AnimatePresence>

                <motion.div variants={fadeInUp} className="mt-8 flex gap-4">
                  <Button size="lg" rightIcon={<Rocket className="w-5 h-5" />} onClick={() => navigate(`/onboarding?jobId=${selJobId}`)}>
                    我要达成这个岗位
                  </Button>
                  <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />} onClick={() => navigate(`/encyclopedia/${selJobId}`)}>
                    浏览该岗位百科
                  </Button>
                </motion.div>
              </motion.div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
