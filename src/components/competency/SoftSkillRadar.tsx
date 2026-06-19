import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { softSkillDimensions } from '@/data/mockCompetency';
import type { SoftSkill } from '@shared/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const dimensionMeta: Record<string, { color: string; gradientFrom: string; gradientTo: string }> = {
  communication: { color: 'emerald', gradientFrom: 'from-emerald-500', gradientTo: 'to-emerald-400' },
  leadership: { color: 'indigo', gradientFrom: 'from-space-indigo-500', gradientTo: 'to-lavender-400' },
  thinking: { color: 'purple', gradientFrom: 'from-lavender-500', gradientTo: 'to-purple-400' },
  execution: { color: 'gold', gradientFrom: 'from-amber-gold-500', gradientTo: 'to-amber-gold-400' },
  emotional: { color: 'emerald', gradientFrom: 'from-rose-500', gradientTo: 'to-pink-400' },
};

const levelExpectations: Record<string, Record<number, string>> = {
  communication: {
    1: '能表达基本想法', 2: '清晰传达信息', 3: '跨团队协调沟通', 4: '冲突化解与共识建立', 5: '组织级沟通策略',
  },
  leadership: {
    1: '配合团队目标', 2: '主导小任务', 3: '主导小型项目', 4: '带团队达成目标', 5: '战略级领导力',
  },
  thinking: {
    1: '理解明确问题', 2: '分析一般问题', 3: '结构化拆解问题', 4: '第一性原理分析', 5: '创新性解决方案',
  },
  execution: {
    1: '完成分配任务', 2: '按计划执行', 3: '目标管理与追踪', 4: '风险预案与超预期交付', 5: '战略级执行力',
  },
  emotional: {
    1: '基本情绪稳定', 2: '接受批评与调整', 3: '理性应对压力', 4: '韧性超越逆境', 5: '赋能团队抗压',
  },
};

interface SoftSkillRadarProps {
  softSkills: SoftSkill[];
}

export default function SoftSkillRadar({ softSkills }: SoftSkillRadarProps) {
  const byDimension = useMemo(() => {
    return softSkills.reduce<Record<string, SoftSkill[]>>((acc, s) => {
      (acc[s.dimension] ??= []).push(s);
      return acc;
    }, {});
  }, [softSkills]);

  const radarData = useMemo(() => {
    return softSkillDimensions.map((dim) => {
      const skills = byDimension[dim.id] || [];
      const avg = skills.length > 0 ? skills.reduce((s, sk) => s + sk.targetLevel, 0) / skills.length : 3;
      return { dimension: dim.name, 目标等级: Math.round(avg * 20), 参考基线: 60 };
    });
  }, [byDimension]);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <motion.div variants={fadeInUp} className="lg:col-span-2">
        <Card variant="glass" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-base text-slate-900">能力雷达图</h4>
            <Badge variant="gold" size="sm">5维度</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="目标等级" dataKey="目标等级" stroke="#10B981" fill="#10B981" fillOpacity={0.3} strokeWidth={2} />
                <Radar name="参考基线" dataKey="参考基线" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="5 5" />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <div className="lg:col-span-3 space-y-3">
        {softSkillDimensions.map((dim) => {
          const skills = byDimension[dim.id] || [];
          const avg = skills.length > 0 ? skills.reduce((s, sk) => s + sk.targetLevel, 0) / skills.length : 3;
          const meta = dimensionMeta[dim.id];
          const indicators = skills.flatMap((s) => s.behavioralIndicators);
          const expectation = levelExpectations[dim.id]?.[Math.round(avg)] || '';
          return (
            <motion.div key={dim.id} variants={fadeInUp}>
              <Card variant="glass" className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.gradientFrom} ${meta.gradientTo} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                    {avg.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h5 className="font-bold text-sm text-slate-900">{dim.name}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">目标等级</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={`w-5 h-2 rounded-sm ${i <= Math.round(avg) ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {indicators.slice(0, 4).map((ind, ii) => (
                        <span key={ii} className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {ind}
                        </span>
                      ))}
                    </div>
                    {expectation && (
                      <p className="text-xs text-lavender-600 bg-lavender-50/60 px-3 py-1.5 rounded-lg">
                        职级期望：{expectation}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
