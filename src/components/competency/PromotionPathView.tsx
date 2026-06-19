import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PromotionPath } from '@shared/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const nodeColors = [
  { bg: 'from-emerald-500 to-emerald-400', ring: 'ring-emerald-200', text: 'text-emerald-600' },
  { bg: 'from-lavender-500 to-lavender-400', ring: 'ring-lavender-200', text: 'text-lavender-600' },
  { bg: 'from-space-indigo-500 to-space-indigo-400', ring: 'ring-space-indigo-200', text: 'text-space-indigo-600' },
  { bg: 'from-amber-gold-500 to-amber-gold-400', ring: 'ring-amber-gold-200', text: 'text-amber-gold-600' },
  { bg: 'from-rose-500 to-rose-400', ring: 'ring-rose-200', text: 'text-rose-600' },
];

interface PromotionPathViewProps {
  promotionPath: PromotionPath;
  currentJobId?: string;
}

export default function PromotionPathView({ promotionPath, currentJobId }: PromotionPathViewProps) {
  const stats = useMemo(() => {
    const { nodes } = promotionPath;
    if (nodes.length < 2) return { totalMonths: 0, avgGrowth: 0 };
    const totalMonths = promotionPath.totalEstimatedMonths || nodes[nodes.length - 1].estimatedMonths;
    const first = nodes[0].avgSalaryRange[0];
    const last = nodes[nodes.length - 1].avgSalaryRange[1];
    const avgGrowth = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
    return { totalMonths, avgGrowth };
  }, [promotionPath]);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex items-start gap-0 min-w-[800px] relative">
          {promotionPath.nodes.map((node, i) => {
            const nc = nodeColors[i % nodeColors.length];
            const isCurrent = node.id === currentJobId || (i === 0 && currentJobId);
            return (
              <div key={node.id} className="flex-1 relative">
                <motion.div variants={fadeInUp} className="flex flex-col items-center text-center px-3">
                  <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${nc.bg} flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ${nc.ring}`}>
                    {node.jobName.charAt(0)}
                    {isCurrent && (
                      <MapPin className="absolute -top-2 -right-2 w-5 h-5 text-emerald-500 fill-emerald-500 drop-shadow" />
                    )}
                  </div>
                  <h5 className="font-bold text-sm text-slate-900 mt-3 mb-0.5">{node.jobName}</h5>
                  <Badge variant={i === 0 ? 'emerald' : 'indigo'} size="sm" className="mb-2">{node.level}</Badge>
                  <div className="text-xs text-emerald-600 font-semibold mb-1">
                    {node.estimatedMonths > 0 ? `约${node.estimatedMonths}个月` : '当前岗位'}
                  </div>
                  <div className="text-sm font-bold gradient-text mb-2">
                    ¥{(node.avgSalaryRange[0] / 1000).toFixed(0)}K–{(node.avgSalaryRange[1] / 1000).toFixed(0)}K
                  </div>
                  <div className="w-full text-left">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">关键门槛</div>
                    <ul className="space-y-1">
                      {node.keyThresholds.slice(0, 3).map((t, ti) => (
                        <li key={ti} className="flex items-start gap-1 text-xs text-slate-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {i < promotionPath.nodes.length - 1 && (
                  <div className="absolute top-8 -right-3 w-6">
                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                      <defs>
                        <linearGradient id={`pg${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="12" x2="18" y2="12" stroke={`url(#pg${i})`} strokeWidth="3" strokeLinecap="round" />
                      <polygon points="18,7 24,12 18,17" fill="#8B5CF6" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold gradient-text">{stats.totalMonths}</div>
              <div className="text-xs text-slate-500">晋升总预估月数</div>
            </div>
          </div>
        </Card>
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-500 to-lavender-400 flex items-center justify-center text-white shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold gradient-text">+{stats.avgGrowth}%</div>
              <div className="text-xs text-slate-500">平均薪资增长</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
