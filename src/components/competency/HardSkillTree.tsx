import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { HardSkill } from '@shared/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function SkillLevelDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            i <= level
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-200'
              : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

const priorityConfig: Record<string, { variant: 'destructive' | 'warning' | 'indigo'; label: string }> = {
  must: { variant: 'destructive', label: '必备' },
  important: { variant: 'warning', label: '重要' },
  nice: { variant: 'indigo', label: '加分' },
};

interface HardSkillTreeProps {
  hardSkills: HardSkill[];
}

export default function HardSkillTree({ hardSkills }: HardSkillTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const categories = [...new Set(hardSkills.map((s) => s.category))];
    return new Set(categories.slice(0, 2));
  });

  const byCategory = hardSkills.reduce<Record<string, HardSkill[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const stats = {
    total: hardSkills.length,
    must: hardSkills.filter((s) => s.priority === 'must').length,
    important: hardSkills.filter((s) => s.priority === 'important').length,
    nice: hardSkills.filter((s) => s.priority === 'nice').length,
  };

  const toggle = (cat: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(cat) ? n.delete(cat) : n.add(cat);
      return n;
    });

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-3">
        {Object.entries(byCategory).map(([category, skills]) => {
          const isOpen = expanded.has(category);
          return (
            <motion.div key={category} variants={fadeInUp}>
              <Card variant="glass" className="p-0 overflow-hidden">
                <button
                  onClick={() => toggle(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {skills.length}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-base text-slate-900">{category}</h4>
                      <p className="text-xs text-slate-500">{skills.length} 项技能</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="relative px-5 pb-4 pt-2 border-t border-slate-100">
                        <svg className="absolute left-8 top-0 bottom-0 w-6 pointer-events-none" aria-hidden>
                          <line x1="3" y1="0" x2="3" y2="100%" stroke="#D1FAE5" strokeWidth="2" />
                          {skills.map((_, si) => (
                            <line key={si} x1="3" y1={32 + si * 56} x2="18" y2={32 + si * 56} stroke="#D1FAE5" strokeWidth="2" />
                          ))}
                        </svg>
                        <div className="space-y-2 ml-6">
                          {skills.map((skill) => {
                            const cfg = priorityConfig[skill.priority];
                            return (
                              <div key={skill.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-semibold text-sm text-slate-900">{skill.name}</span>
                                    <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                                    <div className="flex items-center gap-1 ml-auto">
                                      <span className="text-[10px] text-slate-400 mr-1">目标</span>
                                      <SkillLevelDots level={skill.targetLevel} />
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-500 leading-relaxed">{skill.description}</p>
                                </div>
                              </div>
                            );
                          })}
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

      <div className="lg:col-span-1">
        <Card variant="glass" className="p-5 sticky top-20">
          <h4 className="font-bold text-base text-slate-900 mb-4">技能统计</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80">
              <span className="text-sm text-slate-600">总技能数</span>
              <span className="text-lg font-bold text-slate-900">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/60">
              <span className="text-sm text-red-600">必备</span>
              <span className="text-lg font-bold text-red-700">{stats.must}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-gold-50/60">
              <span className="text-sm text-amber-gold-600">重要</span>
              <span className="text-lg font-bold text-amber-gold-700">{stats.important}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-space-indigo-50/60">
              <span className="text-sm text-space-indigo-600">加分</span>
              <span className="text-lg font-bold text-space-indigo-700">{stats.nice}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
