import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkillSlider } from '@/components/ui/SkillSlider';
import { cn } from '@/lib/utils';
import type { HardSkill, SkillLevel, CompetencyModel } from '@shared/types';

interface Step2HardSkillsProps {
  competencyModel: CompetencyModel | null;
  hardSkillRatings: Record<string, SkillLevel>;
  onChangeRating: (skillId: string, value: SkillLevel) => void;
  jobName: string;
}

const priorityColors = {
  must: 'text-red-600 bg-red-50 border-red-200',
  important: 'text-amber-gold-700 bg-amber-gold-50 border-amber-gold-200',
  nice: 'text-slate-600 bg-slate-50 border-slate-200',
};

const priorityLabels = { must: '必备', important: '重要', nice: '加分' };

const radarDimensions = [
  { key: 'techDepth', label: '技术深度' },
  { key: 'techBreadth', label: '技术广度' },
  { key: 'engineering', label: '工程化' },
  { key: 'performance', label: '性能' },
  { key: 'business', label: '业务理解' },
  { key: 'collaboration', label: '协作' },
];

function calculateRadarData(
  skills: HardSkill[],
  ratings: Record<string, SkillLevel>
) {
  const categoryScores: Record<string, { current: number; target: number; count: number }> = {};

  skills.forEach((skill) => {
    const cat = skill.category;
    if (!categoryScores[cat]) {
      categoryScores[cat] = { current: 0, target: 0, count: 0 };
    }
    const rating = ratings[skill.id] ?? 0;
    categoryScores[cat].current += rating;
    categoryScores[cat].target += skill.targetLevel;
    categoryScores[cat].count += 1;
  });

  const categories = Object.keys(categoryScores);
  const dimMapping = [
    { dim: 'techDepth', cats: ['前端基础', '前端框架', '核心能力', '核心技能'] },
    { dim: 'techBreadth', cats: ['全栈能力', '商业能力', '专业深度'] },
    { dim: 'engineering', cats: ['工程能力', '执行能力'] },
    { dim: 'performance', cats: ['性能优化', '工程能力'] },
    { dim: 'business', cats: ['战略思维', '决策能力', '行业认知'] },
    { dim: 'collaboration', cats: ['表达能力', '沟通协作'] },
  ];

  return radarDimensions.map((dim) => {
    const mapping = dimMapping.find((m) => m.dim === dim.key);
    let currentSum = 0;
    let targetSum = 0;
    let count = 0;

    if (mapping) {
      mapping.cats.forEach((cat) => {
        if (categoryScores[cat]) {
          currentSum += categoryScores[cat].current;
          targetSum += categoryScores[cat].target;
          count += categoryScores[cat].count;
        }
      });
    }

    if (count === 0) {
      const avgCurrent = Object.values(categoryScores).reduce((s, c) => s + c.current, 0) / Math.max(Object.keys(categoryScores).length, 1);
      const avgTarget = Object.values(categoryScores).reduce((s, c) => s + c.target, 0) / Math.max(Object.keys(categoryScores).length, 1);
      const totalCount = Object.values(categoryScores).reduce((s, c) => s + c.count, 0);
      return {
        dimension: dim.label,
        current: totalCount > 0 ? Math.round((avgCurrent / (5 * Math.max(totalCount / categories.length, 1))) * 100) : 0,
        target: totalCount > 0 ? Math.round((avgTarget / (5 * Math.max(totalCount / categories.length, 1))) * 100) : 80,
      };
    }

    return {
      dimension: dim.label,
      current: Math.round((currentSum / (count * 5)) * 100),
      target: Math.round((targetSum / (count * 5)) * 100),
    };
  });
}

export function Step2HardSkills({
  competencyModel,
  hardSkillRatings,
  onChangeRating,
  jobName,
}: Step2HardSkillsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const hardSkills = competencyModel?.hardSkills || [];

  const skillCategories = useMemo(() => {
    const categories: Record<string, HardSkill[]> = {};
    hardSkills.forEach((skill) => {
      if (!categories[skill.category]) {
        categories[skill.category] = [];
      }
      categories[skill.category].push(skill);
    });
    return categories;
  }, [hardSkills]);

  const categoryNames = Object.keys(skillCategories);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const completedCount = Object.keys(hardSkillRatings).filter(
    (id) => hardSkillRatings[id] > 0
  ).length;
  const totalCount = hardSkills.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const radarData = useMemo(
    () => calculateRadarData(hardSkills, hardSkillRatings),
    [hardSkills, hardSkillRatings]
  );

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-lavender-600 font-semibold mb-0.5">Step 2 / 4</div>
            <h2 className="text-2xl font-bold font-heading">硬技能自评</h2>
          </div>
        </div>
        <p className="text-slate-600 mb-6">
          根据<span className="font-semibold text-slate-900">{jobName || '目标岗位'}</span>的胜任力模型，
          请对以下{totalCount}项硬技能进行自我评估
        </p>

        <div className="mb-6 p-4 rounded-2xl bg-white/60 border border-slate-200/80">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">评估进度</span>
            <span className="text-sm font-semibold text-emerald-600">
              {completedCount} / {totalCount} 项
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-lavender-500 to-space-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {categoryNames.map((catName, catIndex) => {
            const skills = skillCategories[catName];
            const isExpanded = expandedCategories[catName] !== false;
            const catCompleted = skills.filter((s) => hardSkillRatings[s.id] > 0).length;

            return (
              <motion.div
                key={catName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.08 }}
                className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white/60"
              >
                <button
                  onClick={() => toggleCategory(catName)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-600">{catIndex + 1}</span>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-900">{catName}</h4>
                      <p className="text-xs text-slate-500">{skills.length} 项技能</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="emerald" size="sm">
                      {catCompleted}/{skills.length} 已评
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {skills.map((skill) => (
                          <div
                            key={skill.id}
                            className="p-4 rounded-xl bg-slate-50/60 border border-slate-100"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-semibold text-slate-900">{skill.name}</h5>
                                  <span
                                    className={cn(
                                      'text-xs px-2 py-0.5 rounded-full border font-medium',
                                      priorityColors[skill.priority]
                                    )}
                                  >
                                    {priorityLabels[skill.priority]}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {skill.description}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-2xl font-bold gradient-text">
                                  {hardSkillRatings[skill.id] || '-'}
                                </div>
                                <div className="text-xs text-slate-500">
                                  目标 L{skill.targetLevel}
                                </div>
                              </div>
                            </div>
                            <SkillSlider
                              label=""
                              value={(hardSkillRatings[skill.id] ?? 1) as SkillLevel}
                              onChange={(v) => onChangeRating(skill.id, v)}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky top-48">
          <Card variant="glass" className="p-6">
            <h3 className="font-heading font-bold text-lg mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-lavender-500" />
              能力雷达预览
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              随着你的自评实时更新，最终会与目标岗位对比
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="当前水平"
                    dataKey="current"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="#10B981"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="目标水平"
                    dataKey="target"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="#8B5CF6"
                    fillOpacity={0.15}
                    strokeDasharray="4 4"
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">已完成评估</span>
                <span className="font-semibold text-emerald-600">
                  {completedCount} / {totalCount}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-lavender-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {completedCount === totalCount && totalCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-medium text-emerald-700">
                  所有技能已完成评估！
                </span>
              </motion.div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
