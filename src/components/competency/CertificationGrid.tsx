import { motion } from 'framer-motion';
import { Award, Clock, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Certification } from '@shared/types';

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const difficultyConfig: Record<string, { variant: 'emerald' | 'gold' | 'purple'; label: string }> = {
  basic: { variant: 'emerald', label: '基础' },
  intermediate: { variant: 'gold', label: '中级' },
  advanced: { variant: 'purple', label: '高级' },
};

interface CertificationGridProps {
  certifications: Certification[];
}

export default function CertificationGrid({ certifications }: CertificationGridProps) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      {certifications.map((cert, ci) => {
        const dcfg = difficultyConfig[cert.difficulty];
        return (
          <motion.div key={cert.id} variants={scaleIn} transition={{ delay: ci * 0.06 }}>
            <Card variant="glass" hoverable glowOnHover className="p-5 h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-gold-100 to-amber-gold-50 border border-amber-gold-200 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-gold-600" />
                </div>
                <Badge variant={dcfg.variant} size="sm">{dcfg.label}</Badge>
              </div>

              <h4 className="font-bold text-base text-slate-900 mb-1">{cert.name}</h4>
              <p className="text-sm text-slate-500 mb-4">{cert.issuer}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50/80">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-1">
                    <Clock className="w-3 h-3" />
                    预估学时
                  </div>
                  <div className="text-lg font-bold text-slate-900">{cert.estimatedHours}h</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60">
                  <div className="text-[10px] text-slate-400 mb-1">相关度</div>
                  <div className="text-lg font-bold text-emerald-700 mb-1">{Math.round(cert.relevance * 100)}%</div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${cert.relevance * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-space-indigo-600 bg-space-indigo-50/60 border border-space-indigo-100 hover:bg-space-indigo-100/60 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  了解详情
                </button>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
