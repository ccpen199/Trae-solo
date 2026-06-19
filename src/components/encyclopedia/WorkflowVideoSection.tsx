import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { WorkflowStep } from '@shared/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const WORKFLOW_TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'];

const DEFAULT_STEPS: WorkflowStep[] = [
  { title: '晨会与任务同步', description: '团队站会同步进度，明确今日任务和 blockers', duration: '30min', tools: ['飞书', 'Jira'] },
  { title: '核心编码', description: '进行需求开发，完成核心模块的编码与自测', duration: '2.5h', tools: ['VSCode', 'Git', 'TypeScript'] },
  { title: '午休 & 技术学习', description: '午餐休息 + 阅读技术博客或掘金社区', duration: '1.5h', tools: ['掘金', '知乎', 'Medium'] },
  { title: '代码评审', description: 'Review同事PR，提出修改意见，确保代码质量', duration: '1h', tools: ['GitLab', 'SonarQube'] },
  { title: '联调测试', description: '与后端/测试联调接口，修复bug', duration: '2h', tools: ['Postman', 'Chrome DevTools'] },
  { title: '技术方案讨论', description: '参与下周需求的技术方案评审会', duration: '1h', tools: ['飞书文档', 'XMind'] },
  { title: '总结与计划', description: '完成日报，梳理明日待办，整理技术沉淀', duration: '30min', tools: ['Notion', '飞书'] },
];

interface Props {
  steps: WorkflowStep[];
  jobName: string;
}

export default function WorkflowVideoSection({ steps, jobName }: Props) {
  const workflowSteps = steps.length > 0 ? steps : DEFAULT_STEPS;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const totalDuration = 8 * 60;

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.15 * speed;
        });
      }, 100);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  useEffect(() => {
    const stepIdx = Math.min(
      Math.floor((progress / 100) * workflowSteps.length),
      workflowSteps.length - 1
    );
    setActiveStep(stepIdx);
  }, [progress, workflowSteps.length]);

  const handleStepClick = useCallback((idx: number) => {
    setActiveStep(idx);
    setProgress((idx / Math.max(workflowSteps.length - 1, 1)) * 100);
    setIsPlaying(true);
  }, [workflowSteps.length]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setProgress(pct);
  }, []);

  const formatVideoTime = (pct: number) => {
    const totalSec = Math.floor((pct / 100) * totalDuration);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <motion.section id="workflow" variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
      <SectionTitle icon={<Play className="w-5 h-5" />} title="真实工作流" subtitle={`${jobName}的一天是怎样的？`} />
      <div className="mt-6 space-y-6">
        <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ height: 360 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/80 to-slate-800">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10B981 0%, transparent 50%), radial-gradient(circle at 80% 30%, #8B5CF6 0%, transparent 40%), radial-gradient(circle at 60% 80%, #3B82F6 0%, transparent 45%)' }} />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          </div>

          <AnimatePresence mode="wait">
            {!isPlaying && progress === 0 && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPlaying(true)}
                    className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors shadow-2xl"
                  >
                    <Play className="w-9 h-9 text-white ml-1" fill="white" />
                  </motion.button>
                  <p className="text-white/70 text-sm mt-4">点击播放，了解{jobName}的一天</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(false)}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Pause className="w-7 h-7 text-white" fill="white" />
              </motion.button>
            </div>
          )}

          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
            >
              <div className="bg-black/40 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-emerald-400 text-xs font-semibold mb-1">
                  步骤 {activeStep + 1}/{workflowSteps.length}
                </p>
                <p className="text-white text-sm font-medium">{workflowSteps[activeStep]?.title}</p>
              </div>
            </motion.div>
          )}

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white/90 text-xs font-medium">{formatVideoTime(progress)} / {formatVideoTime(100)}</span>
            </div>
            <button className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
              <Maximize className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>

          <div className="absolute top-4 left-4 flex items-center gap-2">
            {[1, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  speed === s ? 'bg-emerald-500 text-white' : 'bg-black/40 text-white/70 hover:bg-black/60'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group"
            >
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {workflowSteps.map((step, idx) => {
              const isCompleted = idx < activeStep;
              const isCurrent = idx === activeStep;
              return (
                <div key={idx} className="flex-shrink-0 flex items-start">
                  <button
                    onClick={() => handleStepClick(idx)}
                    onMouseEnter={() => setHoveredStep(idx)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className="flex flex-col items-center min-w-[100px] group"
                  >
                    <div className="flex items-center gap-2 mb-2 w-full">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          isCurrent
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-200 shadow-lg shadow-emerald-300/50'
                            : isCompleted
                            ? 'bg-slate-400 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      {idx < workflowSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 rounded-full transition-colors ${
                          isCompleted ? 'bg-slate-400' : 'bg-slate-200'
                        }`} />
                      )}
                    </div>
                    <span className={`text-xs font-semibold mb-1 transition-colors ${
                      isCurrent ? 'text-emerald-600' : isCompleted ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {WORKFLOW_TIMES[idx] || `${9 + idx}:00`}
                    </span>
                    <span className={`text-xs font-medium text-center leading-tight ${
                      isCurrent ? 'text-emerald-700' : 'text-slate-600'
                    }`}>
                      {step.title}
                    </span>

                    <AnimatePresence>
                      {hoveredStep === idx && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-slate-100 p-3 w-56"
                        >
                          <p className="text-xs text-slate-500 mb-2">{step.description}</p>
                          <p className="text-xs text-slate-400 mb-2">⏱ {step.duration}</p>
                          <div className="flex flex-wrap gap-1">
                            {step.tools.map((t) => (
                              <Badge key={t} variant="emerald" size="sm">{t}</Badge>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50">
        {icon}
      </div>
      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-emerald-300/50 to-transparent ml-4" />
    </div>
  );
}
