import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Search,
  X,
  CheckCircle2,
  Star,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { competencyApi } from '@/lib/api';
import { mockIndustries, iconMap, defaultSelectedIndustryId, defaultSelectedCategoryId, defaultSelectedJobId } from '@/data/mockIndustries';
import { getMockCompetencyModel } from '@/data/mockCompetency';
import { jobLevels } from '@/data/mockCompetency';
import { cn } from '@/lib/utils';
import type { Industry, JobRole, JobLevel, CompetencyModel } from '@shared/types';

interface Step1CareerGoalProps {
  selectedIndustryId: string | null;
  selectedCategoryId: string | null;
  selectedJobId: string | null;
  selectedLevel: JobLevel | null;
  onSelectIndustry: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onSelectJob: (id: string) => void;
  onSelectLevel: (level: JobLevel) => void;
}

export function Step1CareerGoal({
  selectedIndustryId,
  selectedCategoryId,
  selectedJobId,
  selectedLevel,
  onSelectIndustry,
  onSelectCategory,
  onSelectJob,
  onSelectLevel,
}: Step1CareerGoalProps) {
  const [industries, setIndustries] = useState<Industry[]>(mockIndustries);
  const [isLoading, setIsLoading] = useState(true);
  const [jobSearch, setJobSearch] = useState('');
  const [jobDetail, setJobDetail] = useState<CompetencyModel | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const data = await competencyApi.getIndustries();
        if (Array.isArray(data) && data.length > 0) {
          const transformed = data.map((ind: any) => ({
            ...ind,
            description: ind.desc || ind.description || '',
            categories: ind.children || ind.categories || [],
          }));
          setIndustries(transformed);
        }
      } catch {
        setIndustries(mockIndustries);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIndustries();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      const fetchJobDetail = async () => {
        try {
          const detail = await competencyApi.getCompetencyJobDetail(selectedJobId);
          setJobDetail(detail);
        } catch {
          setJobDetail(getMockCompetencyModel(selectedJobId));
        }
      };
      fetchJobDetail();
    } else {
      setJobDetail(null);
    }
  }, [selectedJobId]);

  const selectedIndustry = useMemo(
    () => industries.find((i) => i.id === selectedIndustryId),
    [industries, selectedIndustryId]
  );

  const selectedCategory = useMemo(
    () => selectedIndustry?.categories.find((c) => c.id === selectedCategoryId),
    [selectedIndustry, selectedCategoryId]
  );

  const selectedJob = useMemo(() => {
    if (!selectedCategory) return null;
    return selectedCategory.jobs.find((j) => j.id === selectedJobId) || null;
  }, [selectedCategory, selectedJobId]);

  const filteredJobs = useMemo(() => {
    if (!selectedCategory) return [];
    if (!jobSearch.trim()) return selectedCategory.jobs;
    return selectedCategory.jobs.filter((j) =>
      j.name.toLowerCase().includes(jobSearch.toLowerCase())
    );
  }, [selectedCategory, jobSearch]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleSelectIndustry = (id: string) => {
    onSelectIndustry(id);
    onSelectCategory('');
    onSelectJob('');
  };

  const handleSelectCategory = (id: string) => {
    onSelectCategory(id);
    onSelectJob('');
    setExpandedCategories((prev) => ({ ...prev, [id]: true }));
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || iconMap.Code;
  };

  const industryColors = [
    'from-emerald-400 to-teal-500',
    'from-lavender-400 to-purple-500',
    'from-space-indigo-400 to-blue-500',
    'from-amber-gold-400 to-orange-500',
    'from-pink-400 to-rose-500',
    'from-cyan-400 to-sky-500',
    'from-green-400 to-emerald-500',
    'from-indigo-400 to-violet-500',
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
          <Target className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <div className="text-xs text-lavender-600 font-semibold mb-0.5">Step 1 / 4</div>
          <h2 className="text-2xl font-bold font-heading">选择你的职业目标</h2>
        </div>
      </div>
      <p className="text-slate-600">
        选择目标行业、领域和具体岗位，系统将基于胜任力模型为你进行精准评估
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-slate-700">选择行业</span>
              <Badge variant="emerald" size="sm">{industries.length}个可选</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {industries.map((ind, idx) => {
                const Icon = getIcon(ind.icon);
                const selected = selectedIndustryId === ind.id;
                const colorClass = industryColors[idx % industryColors.length];
                return (
                  <motion.button
                    key={ind.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectIndustry(ind.id)}
                    className={cn(
                      'group p-5 rounded-2xl text-left border-2 transition-all duration-300',
                      selected
                        ? 'border-emerald-400 bg-emerald-50/60 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                        : 'border-slate-200 bg-white hover:border-lavender-200 hover:bg-lavender-50/40'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110',
                      selected ? `bg-gradient-to-br ${colorClass} text-white shadow-lg` : 'bg-slate-100 text-slate-600'
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className={cn(
                      'font-bold mb-1 transition-colors',
                      selected ? 'text-emerald-700' : 'text-slate-900 group-hover:text-lavender-700'
                    )}>
                      {ind.name}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{ind.description}</p>
                    {selected && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1 mt-3 text-xs font-semibold text-emerald-600"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> 已选择
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedIndustry && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-slate-700">选择领域</span>
                  <Badge variant="indigo" size="sm">{selectedIndustry.categories.length}个方向</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedIndustry.categories.map((cat) => {
                    const selected = selectedCategoryId === cat.id;
                    const isExpanded = expandedCategories[cat.id] || selected;
                    return (
                      <motion.div key={cat.id} layout>
                        <motion.button
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectCategory(cat.id)}
                          className={cn(
                            'w-full p-4 rounded-xl text-left border-2 transition-all',
                            selected
                              ? 'border-emerald-400 bg-emerald-50/60 shadow-md'
                              : 'border-slate-200 bg-white hover:border-lavender-200'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h5 className={cn('font-semibold text-sm', selected ? 'text-emerald-700' : 'text-slate-800')}>
                              {cat.name}
                            </h5>
                            <div className="flex items-center gap-1">
                              {selected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              <ChevronDown
                                className={cn(
                                  'w-4 h-4 text-slate-400 transition-transform',
                                  isExpanded && 'rotate-180'
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategory(cat.id);
                                }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-slate-500">{cat.jobs.length}个岗位</p>
                        </motion.button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 space-y-1.5 pl-2">
                                {cat.jobs.slice(0, 3).map((job) => (
                                  <button
                                    key={job.id}
                                    onClick={() => {
                                      onSelectJob(job.id);
                                    }}
                                    className={cn(
                                      'w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors',
                                      selectedJobId === job.id
                                        ? 'bg-emerald-100 text-emerald-700 font-medium'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    )}
                                  >
                                    {job.name}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {selectedCategory && (
              <motion.div
                key="jobs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">搜索并选择具体岗位</span>
                    <Badge variant="purple" size="sm">{filteredJobs.length}个可选</Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      placeholder="搜索岗位..."
                      className="w-56 h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                    />
                    {jobSearch && (
                      <button
                        onClick={() => setJobSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredJobs.map((job) => {
                    const selected = selectedJobId === job.id;
                    return (
                      <motion.button
                        key={job.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectJob(job.id)}
                        className={cn(
                          'p-4 rounded-xl text-left transition-all border-2',
                          selected
                            ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-lavender-50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-lavender-200'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={cn(
                            'font-semibold text-base leading-snug',
                            selected ? 'text-emerald-700' : 'text-slate-800'
                          )}>
                            {job.name}
                          </span>
                          {selected && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 ml-2" />}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            {job.avgSalary.toLocaleString()}/月
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-lavender-500" />
                            热度 {job.hotness}
                          </span>
                          <Badge variant="gold" size="sm">
                            {jobLevels.find(l => l.value === job.level)?.label || job.level}
                          </Badge>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {selectedJob && (
              <motion.div
                key="levels"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-slate-700">选择目标职级</span>
                  <Badge variant="gold" size="sm">6个级别</Badge>
                </div>

                <div className="relative">
                  <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 rounded-full">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-lavender-400 to-space-indigo-400 rounded-full transition-all duration-500"
                      style={{
                        width: selectedLevel
                          ? `${(jobLevels.findIndex(l => l.value === selectedLevel) / (jobLevels.length - 1)) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <div className="relative grid grid-cols-6 gap-2">
                    {jobLevels.map((lvl) => {
                      const selected = selectedLevel === lvl.value;
                      return (
                        <motion.button
                          key={lvl.value}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectLevel(lvl.value)}
                          className={cn(
                            'relative flex flex-col items-center pt-1 pb-2 transition-all',
                          )}
                        >
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 text-sm font-bold',
                            selected
                              ? 'bg-gradient-to-br from-emerald-400 via-lavender-400 to-space-indigo-400 border-transparent text-white shadow-lg shadow-lavender-500/40 scale-110'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-lavender-300'
                          )}>
                            {selected ? <CheckCircle2 className="w-5 h-5" /> : lvl.num}
                          </div>
                          <div className={cn(
                            'text-xs font-semibold mt-2 transition-colors',
                            selected ? 'text-emerald-600' : 'text-slate-600'
                          )}>
                            {lvl.label}
                          </div>
                          <div className="text-[10px] text-slate-400 text-center mt-0.5 leading-tight">
                            {lvl.desc}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {selectedJob && selectedLevel && jobDetail && (
              <motion.div
                key="job-detail"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-lavender-50 to-space-indigo-50 border-2 border-emerald-200/60"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center flex-shrink-0">
                    <Star className="w-7 h-7 text-amber-gold-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-lg text-slate-900">{jobDetail.jobName}</h4>
                      <Badge variant="emerald" size="sm">
                        {jobLevels.find(l => l.value === selectedLevel)?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      行业：<span className="font-medium">{selectedIndustry?.name}</span>
                      <span className="mx-2 text-slate-400">·</span>
                      领域：<span className="font-medium">{selectedCategory?.name}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-white/70 text-center">
                    <div className="text-lg font-bold gradient-text">{jobDetail.hardSkills.length}</div>
                    <div className="text-xs text-slate-500">硬技能项</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 text-center">
                    <div className="text-lg font-bold gradient-text">{jobDetail.softSkills.length}</div>
                    <div className="text-xs text-slate-500">软技能项</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 text-center">
                    <div className="text-lg font-bold gradient-text">{jobDetail.certifications.length}</div>
                    <div className="text-xs text-slate-500">推荐认证</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 text-center">
                    <div className="text-lg font-bold gradient-text">{jobDetail.yearsOfExperience.ideal}年</div>
                    <div className="text-xs text-slate-500">理想经验</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-white/50">
                  <Sparkles className="w-4 h-4 text-lavender-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-lavender-700 mb-0.5">胜任力概览</div>
                    <p className="text-xs text-slate-600">
                      包含 {[...new Set(jobDetail.hardSkills.map(s => s.category))].length} 个技能类别，
                      涵盖核心技术、工程能力、全栈能力等多个维度
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
