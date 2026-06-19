import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartHandshake,
  Users,
  Briefcase,
  Brain,
  Target,
  Sparkles,
  CheckCircle2,
  SkipForward,
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
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { softSkillDimensions } from '@/data/mockCompetency';

interface Step3SoftSkillsProps {
  softSkillSelections: Record<string, number>;
  onChangeSelection: (dimensionId: string, score: number) => void;
  onSkip: () => void;
}

const iconMap: Record<string, any> = {
  communication: Users,
  leadership: Briefcase,
  thinking: Brain,
  execution: Target,
  emotional: HeartHandshake,
};

const colorMap: Record<string, string> = {
  emerald: 'from-emerald-400 to-teal-500',
  indigo: 'from-space-indigo-400 to-blue-500',
  purple: 'from-lavender-400 to-purple-500',
  gold: 'from-amber-gold-400 to-orange-500',
  pink: 'from-pink-400 to-rose-500',
};

const variantMap: Record<string, 'emerald' | 'indigo' | 'purple' | 'gold'> = {
  emerald: 'emerald',
  indigo: 'indigo',
  purple: 'purple',
  gold: 'gold',
  pink: 'purple',
};

export function Step3SoftSkills({
  softSkillSelections,
  onChangeSelection,
  onSkip,
}: Step3SoftSkillsProps) {
  const completedCount = Object.keys(softSkillSelections).length;
  const totalCount = softSkillDimensions.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const radarData = useMemo(() => {
    return softSkillDimensions.map((dim) => {
      const score = softSkillSelections[dim.id] ?? 0;
      return {
        dimension: dim.name,
        current: score > 0 ? Math.round((score / 4) * 100) : 0,
        target: 90,
      };
    });
  }, [softSkillSelections]);

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-lavender-600 font-semibold mb-0.5">Step 3 / 4</div>
              <h2 className="text-2xl font-bold font-heading">软技能场景自评</h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            leftIcon={<SkipForward className="w-4 h-4" />}
          >
            跳过，使用默认值
          </Button>
        </div>
        <p className="text-slate-600">
          通过真实工作场景选择最符合你的行为方式，评估你的5大软技能维度
        </p>

        <div className="p-4 rounded-2xl bg-white/60 border border-slate-200/80">
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

        <div className="space-y-6">
          {softSkillDimensions.map((dim, di) => {
            const Icon = iconMap[dim.id] || Users;
            const selected = softSkillSelections[dim.id];
            const selectedOption = dim.options.find((o) => o.score === selected);
            const colorClass = colorMap[dim.color] || colorMap.emerald;
            const variant = variantMap[dim.color] || 'emerald';

            return (
              <motion.div
                key={dim.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: di * 0.08 }}
              >
                <Card variant="glass" className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md flex-shrink-0',
                        colorClass
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-slate-900">
                          维度 {di + 1}：{dim.name}
                        </h3>
                        {selected && (
                          <Badge variant={variant} size="sm" withDot>
                            {selected}分
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm">{dim.question}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    {dim.options.map((opt, oi) => {
                      const isSel = selected === opt.score;
                      return (
                        <motion.button
                          key={oi}
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => onChangeSelection(dim.id, opt.score)}
                          className={cn(
                            'p-4 rounded-xl text-left transition-all duration-300 border-2 relative overflow-hidden',
                            isSel
                              ? 'border-emerald-400 bg-emerald-50/80 shadow-md'
                              : 'border-slate-200 bg-white hover:border-lavender-200 hover:bg-lavender-50/40'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all',
                                isSel
                                  ? 'bg-gradient-to-br from-emerald-500 to-lavender-500 text-white border-transparent shadow-md'
                                  : 'bg-white border-slate-300 text-slate-500'
                              )}
                            >
                              {isSel ? <CheckCircle2 className="w-4 h-4" /> : opt.score}
                            </div>
                            <span
                              className={cn(
                                'text-sm leading-relaxed font-medium',
                                isSel ? 'text-emerald-800' : 'text-slate-700'
                              )}
                            >
                              {opt.text}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedOption && (
                      <motion.div
                        key={selected}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-4 border-t border-slate-200/60 flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-lavender-100 flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-lavender-600" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-lavender-700 mb-0.5">
                              典型行为画像
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {selectedOption.behavior}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
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
              软技能雷达图
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              实时展示你的软技能综合画像
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
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="目标水平"
                    dataKey="target"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fill="#F59E0B"
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
                  所有维度已完成评估！
                </span>
              </motion.div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
