import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Wrench,
  HeartHandshake,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { diagnosisApi, competencyApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Step1CareerGoal } from '@/components/onboarding/Step1CareerGoal';
import { Step2HardSkills } from '@/components/onboarding/Step2HardSkills';
import { Step3SoftSkills } from '@/components/onboarding/Step3SoftSkills';
import { Step4Expectations } from '@/components/onboarding/Step4Expectations';
import { getMockCompetencyModel, softSkillDimensions, jobLevels } from '@/data/mockCompetency';
import { defaultSelectedIndustryId, defaultSelectedCategoryId, defaultSelectedJobId } from '@/data/mockIndustries';
import type {
  JobLevel,
  SkillLevel,
  CompetencyModel,
  SelfAssessment,
  DiagnosisReport,
  SkillGap,
  GapPriority,
} from '@shared/types';

const steps = [
  { id: 1, title: '职业目标', desc: '选择行业与岗位', icon: Target },
  { id: 2, title: '硬技能自评', desc: '评估专业能力', icon: Wrench },
  { id: 3, title: '软技能自评', desc: '评估综合素养', icon: HeartHandshake },
  { id: 4, title: '期望条件', desc: '设定求职偏好', icon: Settings2 },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setDiagnosisReport } = useAppStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitText, setSubmitText] = useState('生成诊断报告');

  const [selectedIndustryId, setSelectedIndustryId] = useState<string>(defaultSelectedIndustryId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultSelectedCategoryId);
  const [selectedJobId, setSelectedJobId] = useState<string>(defaultSelectedJobId);
  const [selectedLevel, setSelectedLevel] = useState<JobLevel>('middle');

  const [competencyModel, setCompetencyModel] = useState<CompetencyModel | null>(null);
  const [hardSkillRatings, setHardSkillRatings] = useState<Record<string, SkillLevel>>({});

  const [softSkillSelections, setSoftSkillSelections] = useState<Record<string, number>>({});

  const [salaryMin, setSalaryMin] = useState(15000);
  const [salaryMax, setSalaryMax] = useState(40000);
  const [selectedCities, setSelectedCities] = useState<string[]>(['北京', '上海']);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  useEffect(() => {
    if (selectedJobId) {
      const fetchCompetency = async () => {
        try {
          const data = await competencyApi.getCompetencyJobDetail(selectedJobId);
          setCompetencyModel(data);
        } catch {
          setCompetencyModel(getMockCompetencyModel(selectedJobId));
        }
      };
      fetchCompetency();
    }
  }, [selectedJobId]);

  useEffect(() => {
    if (competencyModel) {
      const ratings: Record<string, SkillLevel> = {};
      competencyModel.hardSkills.forEach((skill) => {
        if (!hardSkillRatings[skill.id]) {
          ratings[skill.id] = 3 as SkillLevel;
        }
      });
      if (Object.keys(ratings).length > 0) {
        setHardSkillRatings((prev) => ({ ...prev, ...ratings }));
      }
    }
  }, [competencyModel]);

  const jobName = useMemo(() => {
    return competencyModel?.jobName || '目标岗位';
  }, [competencyModel]);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleIndustry = (ind: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

  const goNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };
  const goPrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedIndustryId && selectedCategoryId && selectedJobId && selectedLevel;
      case 2:
        return competencyModel?.hardSkills.every((s) => hardSkillRatings[s.id]);
      case 3:
        return softSkillDimensions.every((d) => softSkillSelections[d.id]);
      case 4:
        return selectedCities.length > 0;
      default:
        return false;
    }
  };

  const handleSoftSkillSkip = () => {
    const defaults: Record<string, number> = {};
    softSkillDimensions.forEach((d) => {
      defaults[d.id] = 2;
    });
    setSoftSkillSelections(defaults);
    setTimeout(() => goNext(), 300);
  };

  const generateMockReport = (): DiagnosisReport => {
    const hardSkills = competencyModel?.hardSkills || [];

    const hsRatingsTyped: Record<string, SkillLevel> = { ...hardSkillRatings };
    hardSkills.forEach((s) => {
      if (!hsRatingsTyped[s.id]) hsRatingsTyped[s.id] = 3 as SkillLevel;
    });

    const ssRatingsTyped: Record<string, SkillLevel> = {};
    softSkillDimensions.forEach((d) => {
      const score = (softSkillSelections[d.id] ?? 2) as SkillLevel;
      ssRatingsTyped[d.id] = score;
    });

    const mockHardSkillGaps: SkillGap[] = hardSkills.map((s) => {
      const cur = hsRatingsTyped[s.id] ?? 3;
      const tgt = s.targetLevel;
      const gap = Math.max(0, tgt - cur);
      let priority: GapPriority = 'low';
      if (s.priority === 'must') {
        priority = gap >= 2 ? 'critical' : gap >= 1 ? 'high' : 'medium';
      } else if (s.priority === 'important') {
        priority = gap >= 2 ? 'high' : gap >= 1 ? 'medium' : 'low';
      }
      return {
        skillId: s.id,
        skillName: s.name,
        currentLevel: cur,
        targetLevel: tgt,
        gap,
        priority,
        suggestedAction: `加强${s.name}的学习与实践`,
      };
    });

    const mockSoftSkillGaps: SkillGap[] = softSkillDimensions.map((d) => {
      const cur = ssRatingsTyped[d.id] ?? 3;
      const tgt = 4;
      const gap = Math.max(0, tgt - cur);
      return {
        skillId: d.id,
        skillName: d.name,
        currentLevel: cur,
        targetLevel: tgt,
        gap,
        priority: gap >= 2 ? 'high' : 'medium',
        suggestedAction: `在${d.name}方面持续提升`,
      };
    });

    const hsAvg = hardSkills.length
      ? Object.values(hsRatingsTyped).reduce((a, b) => a + b, 0) /
        Math.max(hardSkills.length * 5, 1) *
        100
      : 0;
    const ssAvg = softSkillDimensions.length
      ? Object.values(ssRatingsTyped).reduce((a, b) => a + b, 0) /
        Math.max(softSkillDimensions.length * 4, 1) *
        100
      : 0;
    const expScore = selectedLevel
      ? (jobLevels.findIndex((l) => l.value === selectedLevel) / 5) * 100
      : 0;

    const radarDimensions = [
      { dimension: '硬技能', current: Math.round(hsAvg), target: 85 },
      { dimension: '软技能', current: Math.round(ssAvg), target: 80 },
      { dimension: '经验匹配', current: Math.round(expScore), target: 70 },
      { dimension: '认证资质', current: 35, target: 60 },
      { dimension: '行业认知', current: 55, target: 75 },
      { dimension: '成长潜力', current: 70, target: 85 },
    ];

    const overallMatchScore = Math.round(
      radarDimensions.reduce((s, d) => s + d.current, 0) / (radarDimensions.length * 100) * 100
    );

    return {
      id: `diag_${Date.now()}`,
      createdAt: new Date().toISOString(),
      targetJob: {
        id: selectedJobId,
        name: jobName,
        level: selectedLevel,
      },
      overallMatchScore,
      radarDimensions,
      hardSkillGaps: mockHardSkillGaps,
      softSkillGaps: mockSoftSkillGaps,
      certificationRecommendations: [
        {
          id: 'cert1',
          name: 'PMP项目管理',
          issuer: 'PMI',
          difficulty: 'intermediate',
          estimatedHours: 120,
          relevance: 0.85,
        },
        {
          id: 'cert2',
          name: 'AWS解决方案架构师',
          issuer: 'Amazon',
          difficulty: 'advanced',
          estimatedHours: 200,
          relevance: 0.72,
        },
      ],
      promotionPath: {
        fromJobId: selectedJobId,
        nodes: [
          {
            id: 'p1',
            jobName,
            level: selectedLevel,
            estimatedMonths: 0,
            keyThresholds: ['当前'],
            avgSalaryRange: [salaryMin, salaryMax] as [number, number],
          },
          {
            id: 'p2',
            jobName: `高级${jobName}`,
            level: 'senior',
            estimatedMonths: 18,
            keyThresholds: ['独立lead项目', '业务指标达成'],
            avgSalaryRange: [salaryMax, Math.round(salaryMax * 1.5)] as [number, number],
          },
          {
            id: 'p3',
            jobName: `${jobName}专家/负责人`,
            level: 'expert',
            estimatedMonths: 36,
            keyThresholds: ['行业影响力', '团队管理'],
            avgSalaryRange: [Math.round(salaryMax * 1.5), Math.round(salaryMax * 2.5)] as [
              number,
              number
            ],
          },
        ],
        totalEstimatedMonths: 36,
      },
      estimatedReadinessMonths: Math.round(
        mockHardSkillGaps.reduce((s, g) => s + g.gap * 1.5, 0) +
          mockSoftSkillGaps.reduce((s, g) => s + g.gap * 1, 0)
      ),
      learningPlan: [
        {
          phase: '基础夯实期',
          durationWeeks: 8,
          tasks: ['完成核心技能课程', '每日练习', '加入学习社群'],
        },
        {
          phase: '进阶突破期',
          durationWeeks: 12,
          tasks: ['参与实战项目', '系统性阅读书籍', '建立作品集'],
        },
        {
          phase: '求职冲刺期',
          durationWeeks: 6,
          tasks: ['优化简历', '模拟面试', '投递目标公司'],
        },
      ],
    };
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsSubmitting(true);
    setSubmitText('正在分析你的能力图谱...');

    const hsRatingsTyped: Record<string, SkillLevel> = { ...hardSkillRatings };
    const ssRatingsTyped: Record<string, SkillLevel> = {};
    softSkillDimensions.forEach((d) => {
      const score = (softSkillSelections[d.id] ?? 2) as SkillLevel;
      ssRatingsTyped[d.id] = score;
    });

    const selfAssessment: SelfAssessment = {
      targetJobId: selectedJobId,
      targetJobLevel: selectedLevel,
      hardSkillRatings: hsRatingsTyped,
      softSkillRatings: ssRatingsTyped,
      yearsOfExperience: selectedLevel
        ? jobLevels.findIndex((l) => l.value === selectedLevel) * 1.5
        : 0,
      certificationsHeld: [],
      salaryExpectation: [salaryMin, salaryMax] as [number, number],
      preferredCities: selectedCities,
    };

    try {
      try {
        const report = await diagnosisApi.postDiagnosisAssess(selfAssessment);
        setDiagnosisReport(report);
      } catch {
        const mockReport = generateMockReport();
        setDiagnosisReport(mockReport);
      }
      setSubmitText('分析完成，正在跳转...');
      setTimeout(() => navigate('/diagnosis'), 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProgress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen pb-40">
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-lavender-500 to-space-indigo-500 flex items-center justify-center shadow-lg shadow-lavender-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg leading-tight">职业诊断向导</h1>
                <p className="text-xs text-slate-500">预计5分钟完成 · 生成个性化报告</p>
              </div>
            </div>
            <ProgressRing percent={stepProgress} size={56} strokeWidth={5} />
          </div>

          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-lavender-500 to-space-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stepProgress}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="relative grid grid-cols-4 gap-4">
              {steps.map((s) => {
                const isActive = currentStep === s.id;
                const isDone = currentStep > s.id;
                const Icon = s.icon;
                return (
                  <div key={s.id} className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                      }}
                      className={cn(
                        'relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10',
                        isDone
                          ? 'bg-gradient-to-br from-emerald-500 to-lavender-500 border-transparent text-white shadow-lg shadow-emerald-500/40'
                          : isActive
                          ? 'bg-gradient-to-br from-emerald-400 via-lavender-400 to-space-indigo-400 border-transparent text-white shadow-lg shadow-lavender-500/40'
                          : 'bg-white border-slate-200 text-slate-400'
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="font-bold text-sm">{s.id}</span>
                      )}
                      {isActive && (
                        <motion.div
                          className="absolute -inset-1 rounded-full border-2 border-lavender-300/60"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    <div
                      className={cn(
                        'mt-2.5 text-center transition-colors',
                        isActive
                          ? 'text-slate-900'
                          : isDone
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      )}
                    >
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="text-xs mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <Step1CareerGoal
                selectedIndustryId={selectedIndustryId}
                selectedCategoryId={selectedCategoryId}
                selectedJobId={selectedJobId}
                selectedLevel={selectedLevel}
                onSelectIndustry={setSelectedIndustryId}
                onSelectCategory={setSelectedCategoryId}
                onSelectJob={setSelectedJobId}
                onSelectLevel={setSelectedLevel}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <Step2HardSkills
                competencyModel={competencyModel}
                hardSkillRatings={hardSkillRatings}
                onChangeRating={(id, v) =>
                  setHardSkillRatings((prev) => ({ ...prev, [id]: v }))
                }
                jobName={jobName}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <Step3SoftSkills
                softSkillSelections={softSkillSelections}
                onChangeSelection={(id, score) =>
                  setSoftSkillSelections((prev) => ({ ...prev, [id]: score }))
                }
                onSkip={handleSoftSkillSkip}
              />
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <Step4Expectations
                salaryMin={salaryMin}
                salaryMax={salaryMax}
                selectedCities={selectedCities}
                selectedSize={selectedSize}
                selectedIndustries={selectedIndustries}
                onSalaryMinChange={setSalaryMin}
                onSalaryMaxChange={setSalaryMax}
                onToggleCity={toggleCity}
                onSelectSize={setSelectedSize}
                onToggleIndustry={toggleIndustry}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-white/80 border-t border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            {currentStep > 1 && (
              <span className="text-sm text-slate-500">
                完成进度：
                <span className="font-semibold text-slate-700">
                  {Math.round((currentStep / steps.length) * 100)}%
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={currentStep === 1}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              上一步
            </Button>
            {currentStep < 4 ? (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                下一步
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                isLoading={isSubmitting}
                rightIcon={!isSubmitting && <ArrowRight className="w-4 h-4" />}
              >
                {submitText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
