import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Lightbulb, AlertTriangle, Copy } from 'lucide-react';
import { mockCases } from '@/data/mockCases';
import type { HRReview } from '@/types/case';

const iconMap = {
  positive: CheckCircle2,
  suggestion: Lightbulb,
  warning: AlertTriangle,
};
const colorMap = {
  positive: 'text-brand-500',
  suggestion: 'text-gold-500',
  warning: 'text-red-500',
};
const dotColorMap = {
  positive: 'bg-brand-500',
  suggestion: 'bg-gold-500',
  warning: 'bg-red-500',
};

const resumeSections = [
  { title: '个人信息', lines: ['张  三 | zhangsan@email.com | 138-0000-0000', '北京 · 3年经验 · 期望薪资 25-35K'] },
  { title: '个人总结', lines: ['具备3年前端开发经验，熟练掌握 React 生态，有全栈转型意愿和能力。主导过多个大型 To-C 项目的前端架构设计，擅长性能优化与工程化建设。'] },
  { title: '工作经历', lines: ['XX科技有限公司 | 前端工程师 | 2022.06 - 至今', '• 主导公司核心产品前端重构，首屏加载时间从 3.2s 降至 1.1s', '• 搭建组件库与脚手架工具，团队开发效率提升 40%', '• 推动团队从 JavaScript 迁移至 TypeScript，代码缺陷率降低 35%'] },
  { title: '教育背景', lines: ['XX大学 | 计算机科学与技术 | 本科 | 2018 - 2022'] },
  { title: '技能', lines: ['React / Vue / TypeScript / Node.js / Webpack / Git / Docker'] },
];

export default function CaseDetail() {
  const { id } = useParams();
  const caseItem = mockCases.find(c => c.id === id);
  const [activeReview, setActiveReview] = useState<string | null>(null);

  if (!caseItem) {
    return (
      <div className="flex items-center justify-center h-full text-surface-300">
        <p>案例未找到</p>
      </div>
    );
  }

  const handleDotClick = (review: HRReview) => {
    setActiveReview(activeReview === review.id ? null : review.id);
    const el = document.getElementById(`review-${review.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <Link to="/cases" className="inline-flex items-center gap-1.5 text-sm text-surface-300 hover:text-brand-500 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回案例库
      </Link>

      <div className="flex gap-8">
        <div className="w-[60%] shrink-0">
          <div className="bg-white shadow-xl rounded-lg aspect-[210/297] p-10 text-sm relative">
            {resumeSections.map((sec, si) => (
              <div key={sec.title} className={`mb-6 relative ${si === 0 ? '' : 'border-t border-surface-100 pt-4'}`}>
                <h3 className="font-display font-bold text-brand-900 text-base mb-2">{sec.title}</h3>
                {sec.lines.map((line, li) => (
                  <p key={li} className="text-surface-300 leading-relaxed text-xs mb-1">{line}</p>
                ))}
                {caseItem.hrReviews.filter(r => r.anchor === sec.title || sec.title.includes(r.anchor)).map(r => (
                  <button key={r.id} onClick={() => handleDotClick(r)}
                    className={`absolute -right-8 top-1 w-4 h-4 rounded-full border-2 border-white shadow ${dotColorMap[r.type]} transition-transform hover:scale-125`}
                    title={r.comment} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <h2 className="font-display text-xl font-bold text-brand-900 mb-1">{caseItem.title}</h2>
          <div className="flex gap-1.5 mb-5">
            <span className="px-2 py-0.5 text-xs bg-brand-500 text-white rounded-full">{caseItem.industry}</span>
            <span className="px-2 py-0.5 text-xs bg-brand-500 text-white rounded-full">{caseItem.position}</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto mb-6">
            {caseItem.hrReviews.map((r, i) => {
              const Icon = iconMap[r.type];
              return (
                <motion.div key={r.id} id={`review-${r.id}`}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveReview(activeReview === r.id ? null : r.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${activeReview === r.id ? 'border-brand-500 bg-brand-500/5 shadow-md' : 'border-surface-100 bg-white hover:border-surface-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${colorMap[r.type]}`} />
                    <span className="text-xs font-bold text-surface-300">{r.anchor}</span>
                  </div>
                  <p className="text-sm text-brand-900 leading-relaxed">{r.comment}</p>
                </motion.div>
              );
            })}
          </div>

          <Link to="/editor/new"
            className="btn-primary flex items-center justify-center gap-2 py-3 text-sm w-full">
            <Copy className="w-4 h-4" /> 套用此模板
          </Link>
        </div>
      </div>
    </div>
  );
}
