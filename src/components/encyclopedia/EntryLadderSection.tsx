import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Milestone as StairsIcon, Rocket, Flag, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { EntryThresholdStep, DiagnosisReport } from '@shared/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const DEFAULT_LADDER: EntryThresholdStep[] = [
  { step: 1, title: '入门准备', description: '掌握基础概念和开发工具，完成第一个项目', estimatedMonths: 3, typicalObstacles: ['基础不扎实', '环境搭建困难', '缺乏系统性学习'] },
  { step: 2, title: '基础技能', description: '熟练掌握核心技术栈，独立完成常规任务', estimatedMonths: 6, typicalObstacles: ['知识碎片化', '调试能力弱', '最佳实践缺乏'] },
  { step: 3, title: '项目实战', description: '参与真实项目，掌握工程化和协作流程', estimatedMonths: 9, typicalObstacles: ['项目经验不足', 'Git协作不熟悉', '代码质量差'] },
  { step: 4, title: '求职面试', description: '刷题、优化简历、面试实战', estimatedMonths: 3, typicalObstacles: ['简历关难过', '算法面试卡壳', '薪资谈判劣势'] },
  { step: 5, title: '入职适应', description: '快速融入团队，建立职场口碑', estimatedMonths: 3, typicalObstacles: ['新人期焦虑', '业务理解慢', '沟通障碍'] },
];

const SUGGESTED_ACTIONS = [
  '选择一门编程语言，系统学习基础语法和数据结构',
  '完成2-3个实战项目，熟悉常用框架和开发工具',
  '参与开源项目或团队协作，积累项目经验',
  '刷100+算法题，准备STAR法则简历，多做模拟面试',
  '主动沟通请教，快速熟悉业务，建立个人品牌',
];

const STEP_COLORS = [
  { fill: '#D1FAE5', stroke: '#6EE7B7', text: '#065F46', gradient: 'from-emerald-100 to-emerald-200' },
  { fill: '#A7F3D0', stroke: '#34D399', text: '#065F46', gradient: 'from-emerald-200 to-emerald-300' },
  { fill: '#6EE7B7', stroke: '#10B981', text: '#064E3B', gradient: 'from-emerald-300 to-emerald-400' },
  { fill: '#34D399', stroke: '#059669', text: '#064E3B', gradient: 'from-emerald-400 to-emerald-500' },
  { fill: '#10B981', stroke: '#047857', text: '#FFFFFF', gradient: 'from-emerald-500 to-emerald-600' },
];

interface Props {
  ladder: EntryThresholdStep[];
  jobName: string;
  diagnosisReport: DiagnosisReport | null;
  onStartJourney: () => void;
}

export default function EntryLadderSection({ ladder, jobName, diagnosisReport, onStartJourney }: Props) {
  const steps = ladder.length > 0 ? ladder : DEFAULT_LADDER;
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const currentStepIdx = useMemo(() => {
    if (!diagnosisReport) return 0;
    const readinessMonths = diagnosisReport.estimatedReadinessMonths;
    let acc = 0;
    for (let i = 0; i < steps.length; i++) {
      acc += steps[i].estimatedMonths;
      if (readinessMonths <= acc) return i;
    }
    return steps.length - 1;
  }, [diagnosisReport, steps]);

  const totalMonths = steps.reduce((s, st) => s + st.estimatedMonths, 0);

  const svgW = 820;
  const svgH = 380;
  const stepW = 140;
  const stepH = 60;
  const gap = 16;
  const baseY = svgH - 50;

  const stepPositions = steps.map((_, i) => ({
    x: 40 + i * (stepW + gap),
    y: baseY - (i + 1) * (stepH + 8),
  }));

  const climberPos = stepPositions[currentStepIdx];

  return (
    <motion.section id="ladder" variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50">
          <StairsIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">入行阶梯</h2>
          <p className="text-sm text-slate-500">从零到入职{jobName}的成长路径</p>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-300/50 to-transparent ml-4" />
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full min-w-[700px]" style={{ maxHeight: 380 }}>
            <defs>
              {STEP_COLORS.map((c, i) => (
                <linearGradient key={i} id={`stepGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.fill} />
                  <stop offset="100%" stopColor={c.stroke} />
                </linearGradient>
              ))}
            </defs>

            <line x1="20" y1={baseY} x2={svgW - 20} y2={baseY} stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6,4" />

            {stepPositions.map((pos, i) => {
              const isCurrent = i === currentStepIdx;
              const isHovered = hoveredStep === i;
              const color = STEP_COLORS[i];
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={stepW}
                    height={stepH}
                    rx={10}
                    fill={`url(#stepGrad${i})`}
                    stroke={color.stroke}
                    strokeWidth={isCurrent || isHovered ? 2.5 : 1.5}
                    opacity={isCurrent || isHovered ? 1 : 0.85}
                  />
                  <text
                    x={pos.x + stepW / 2}
                    y={pos.y + stepH / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color.text}
                    fontSize="13"
                    fontWeight="700"
                  >
                    {steps[i].title}
                  </text>
                  <text
                    x={pos.x + stepW / 2}
                    y={pos.y + stepH + 18}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="10"
                  >
                    {steps[i].estimatedMonths}个月
                  </text>

                  {i < steps.length - 1 && (
                    <line
                      x1={pos.x + stepW}
                      y1={pos.y + stepH / 2}
                      x2={stepPositions[i + 1].x}
                      y2={stepPositions[i + 1].y + stepH / 2}
                      stroke={STEP_COLORS[i].stroke}
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                      opacity="0.5"
                    />
                  )}
                </g>
              );
            })}

            <g transform={`translate(${climberPos.x + stepW / 2}, ${climberPos.y - 18})`}>
              <circle r="8" fill="#10B981" stroke="white" strokeWidth="2" />
              <circle r="4" fill="white" cx="0" cy="-2" />
              <line x1="0" y1="2" x2="0" y2="10" stroke="white" strokeWidth="1.5" />
              <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                <text textAnchor="middle" y="-14" fill="#10B981" fontSize="9" fontWeight="700">
                  我在这里
                </text>
              </motion.g>
            </g>
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-3">
          {steps.map((step, i) => {
            const isCurrent = i === currentStepIdx;
            const isHovered = hoveredStep === i;
            return (
              <motion.div
                key={i}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                whileHover={{ y: -2 }}
                className={`rounded-xl p-3 transition-all cursor-pointer ${
                  isCurrent ? 'bg-emerald-50 border-2 border-emerald-300 shadow-md' : 'bg-slate-50 border border-slate-200'
                } ${isHovered ? 'shadow-lg ring-2 ring-emerald-200' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${STEP_COLORS[i].gradient} flex items-center justify-center text-xs font-bold ${i >= 3 ? 'text-white' : 'text-emerald-800'}`}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{step.title}</span>
                </div>

                <AnimatePresence>
                  {(isHovered || isCurrent) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-xs text-slate-500 mb-2">{step.description}</p>
                      <div className="space-y-1 mb-2">
                        {step.typicalObstacles.map((obs, oi) => (
                          <div key={oi} className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>{obs}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <Lightbulb className="w-3 h-3 flex-shrink-0" />
                        <span>{SUGGESTED_ACTIONS[i]}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-1 flex items-center gap-1">
                  <Flag className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">{step.estimatedMonths}个月</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between pt-5 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{totalMonths}个月</p>
              <p className="text-xs text-slate-500">预估总入行周期</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-700">{currentStepIdx + 1}/5</p>
              <p className="text-xs text-slate-500">我目前所在阶段</p>
            </div>
          </div>
          <Button rightIcon={<Rocket className="w-4 h-4" />} onClick={onStartJourney}>
            开始我的入行之旅 →
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
