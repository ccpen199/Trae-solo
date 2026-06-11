import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Lightbulb, AlertTriangle, Copy, Bookmark, Star, MapPin, Check } from 'lucide-react';
import { mockCases } from '@/data/mockCases';
import type { HRReview } from '@/types/case';

const iconMap = {
  positive: CheckCircle2,
  suggestion: Lightbulb,
  warning: AlertTriangle,
};

const typeLabelMap = {
  positive: '正面',
  suggestion: '建议',
  warning: '警告',
};

const typeColorMap = {
  positive: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-500',
    borderLight: 'border-emerald-200',
    ring: 'ring-emerald-500/20',
  },
  suggestion: {
    text: 'text-gold-600',
    bg: 'bg-gold-500',
    bgLight: 'bg-gold-500/10',
    border: 'border-gold-500',
    borderLight: 'border-gold-200',
    ring: 'ring-gold-500/20',
  },
  warning: {
    text: 'text-red-600',
    bg: 'bg-red-500',
    bgLight: 'bg-red-500/10',
    border: 'border-red-500',
    borderLight: 'border-red-200',
    ring: 'ring-red-500/20',
  },
};

const detailedReviews: Record<string, HRReview & { detail: string; location: string }> = {
  r1: { id: 'r1', anchor: '工作经历', comment: '动词使用有力，量化数据充分', type: 'positive', detail: '使用了"主导"、"推动"、"搭建"等强动作动词，并且每个成就都有具体数字支撑，如首屏加载时间从3.2s降至1.1s，效率提升40%等，非常有说服力。', location: '工作经历 - XX科技有限公司' },
  r2: { id: 'r2', anchor: '技能', comment: '建议补充软技能描述', type: 'suggestion', detail: '技术技能很扎实，但建议补充沟通协作、项目管理等软技能描述。HR很看重候选人的团队协作能力和跨部门沟通经验，可以在项目经历中体现。', location: '技能专长' },
  r3: { id: 'r3', anchor: '项目经历', comment: 'STAR法则运用出色', type: 'positive', detail: '项目经历描述遵循了STAR法则（情境-任务-行动-结果），逻辑清晰，成果量化充分，让HR一眼就能看到你的价值。', location: '项目经历 - 风控模型优化' },
  r4: { id: 'r4', anchor: '教育背景', comment: '专业认证可前置', type: 'suggestion', detail: 'CFA、FRM等金融领域专业认证含金量很高，建议放在简历更靠前的位置，或者在个人总结中提及，增加通过率。', location: '教育背景 - 专业认证' },
  r5: { id: 'r5', anchor: '个人总结', comment: '定位清晰，目标明确', type: 'positive', detail: '个人总结开门见山，清晰地展示了你的核心竞争力和职业目标，让HR在3秒内就能判断你是否匹配度，非常棒。', location: '个人总结' },
  r6: { id: 'r6', anchor: '项目经历', comment: '缺少失败案例分析', type: 'suggestion', detail: '可以适当加入1-2个遇到挑战或失败的项目，重点描述你如何解决问题并从中学习，展现你的成长思维和问题解决能力。', location: '项目经历 - SaaS产品重构' },
  r7: { id: 'r7', anchor: '作品集', comment: '视觉呈现力强', type: 'positive', detail: '作品集链接放的设计风格统一，视觉层次分明，能够很好地展现你的设计审美和创意能力，是很大的加分项。', location: '作品集链接' },
  r8: { id: 'r8', anchor: '工作经历', comment: '量化成果不足', type: 'warning', detail: '工作经历描述偏过程描述，缺少具体的量化成果。建议补充数据指标，如用户增长百分比、效率提升多少等，让成果更有说服力。', location: '工作经历 - XX设计工作室' },
  r9: { id: 'r9', anchor: '领导力', comment: '团队管理经验描述到位', type: 'positive', detail: '清晰地描述了团队规模、管理范围和具体成果，展现了出色的领导力和项目管理能力，非常符合高级岗位的要求。', location: '工作经历 - 项目管理部' },
  r10: { id: 'r10', anchor: '技能', comment: '技术深度可再加强', type: 'suggestion', detail: '作为项目经理，技术背景很全面。建议可以深入了解一些技术栈有更深入的理解，可以更好地与技术团队沟通。', location: '技能专长 - 技术能力' },
  r11: { id: 'r11', anchor: '项目经历', comment: '论文引用数提升了说服力', type: 'positive', detail: '学术论文和专利的引用数据很有说服力，展现了你的学术研究能力和技术深度，对于算法岗位来说是很大的加分项。', location: '项目经历 - 工业视觉检测系统' },
  r12: { id: 'r12', anchor: '排版', comment: '公式排版可优化', type: 'suggestion', detail: '技术公式和算法描述的排版可以更美观一些，建议使用专业的排版工具进行排版，提升简历的专业感。', location: '项目经历 - 算法模型' },
  r13: { id: 'r13', anchor: '跨行业', comment: '行业术语运用专业', type: 'positive', detail: '能够熟练运用医疗行业的专业术语，展现了你对行业的深入了解，这对于跨行转型的候选人来说非常难得。', location: '工作经历 - 医疗数据分析' },
  r14: { id: 'r14', anchor: '技能', comment: '建议突出数据处理工具链', type: 'suggestion', detail: '建议将数据分析工具链单独列出来，如SQL、R、Python、等，以及数据清洗、数据可视化等具体技能，让HR一目了然。', location: '技能专长 - 数据分析工具' },
  r15: { id: 'r15', anchor: '经历', comment: '成长轨迹清晰', type: 'positive', detail: '从实习到正式工作的成长轨迹非常清晰，能够看到你的进步和成长，展现了你的学习能力和上进心。', location: '工作经历 - 成长轨迹' },
  r16: { id: 'r16', anchor: '数据', comment: '业绩指标需更具体', type: 'warning', detail: '运营数据指标不够具体，建议补充具体数字，如社群人数增长、转化率提升多少等，让你的运营成果更有说服力。', location: '工作经历 - 社群运营' },
  r17: { id: 'r17', anchor: '战略', comment: '高层视角展现充分', type: 'positive', detail: '从战略高度描述了你的产品规划和团队管理经验，展现了出色的战略思维和商业洞察力，非常匹配高管岗位要求。', location: '工作经历 - 产品战略规划' },
  r18: { id: 'r18', anchor: '成就', comment: '行业影响力描述到位', type: 'positive', detail: '行业奖项、媒体报道、演讲经历都很好地展现了你的行业影响力，是你区别于其他候选人的重要亮点。', location: '荣誉奖项 - 行业影响力' },
};

const resumeSections = [
  { id: 'section-1', title: '个人信息', lines: ['张  三 | zhangsan@email.com | 138-0000-0000', '北京 · 3年经验 · 期望薪资 25-35K'] },
  { id: 'section-2', title: '个人总结', lines: ['具备3年前端开发经验，熟练掌握 React 生态，有全栈转型意愿和能力。主导过多个大型 To-C 产品的前端架构设计，擅长性能优化与工程化建设。'] },
  { id: 'section-3', title: '工作经历', lines: ['XX科技有限公司 | 前端工程师 | 2022.06 - 至今', '• 主导公司核心产品前端重构，首屏加载时间从 3.2s 降至 1.1s', '• 搭建组件库与脚手架工具，团队开发效率提升 40%', '• 推动团队从 JavaScript 迁移至 TypeScript，代码缺陷率降低 35%', '', 'YY互联网公司 | 前端开发实习生 | 2021.07 - 2022.05', '• 参与电商平台前端开发，负责商品详情页与购物车模块', '• 优化页面性能，首屏加载时间优化 30%'] },
  { id: 'section-4', title: '项目经历', lines: ['企业级组件库建设 | 项目负责人 | 2023.03 - 至今', '• 从零搭建公司内部组件库，包含 50+ 通用组件', '• 编写完善的文档与示例，团队接入成本降低 60%', '• 推动组件库在公司 10+ 业务线落地使用'] },
  { id: 'section-5', title: '教育背景', lines: ['XX大学 | 计算机科学与技术 | 本科 | 2018 - 2022', '• 主修课程：数据结构、算法设计、操作系统、计算机网络', '• GPA：3.8/4.0，获得国家奖学金'] },
  { id: 'section-6', title: '技能专长', lines: ['前端框架：React / Vue / TypeScript', '工程化：Webpack / Vite / ESLint / Jest', '后端：Node.js / Express / MongoDB', '其他：Git / Docker / Linux'] },
];

export default function CaseDetail() {
  const { id } = useParams();
  const caseItem = mockCases.find(c => c.id === id);
  const [activeReview, setActiveReview] = useState<string | null>(null);
  const [hoveredReview, setHoveredReview] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [adopted, setAdopted] = useState<string[]>([]);

  if (!caseItem) {
    return (
      <div className="flex items-center justify-center h-full text-surface-300">
        <p>案例未找到</p>
      </div>
    );
  }

  const enrichedReviews = caseItem.hrReviews.map(r => ({
    ...r,
    ...(detailedReviews[r.id] || { detail: r.comment, location: r.anchor }),
  }));

  const handleDotClick = (reviewId: string) => {
    setActiveReview(activeReview === reviewId ? null : reviewId);
    const el = document.getElementById(`review-${reviewId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleReviewClick = (reviewId: string, sectionTitle: string) => {
    setActiveReview(activeReview === reviewId ? null : reviewId);
    const sectionIndex = resumeSections.findIndex(s => s.title === sectionTitle || sectionTitle.includes(s.title));
    if (sectionIndex >= 0) {
      const el = document.getElementById(`section-${sectionIndex + 1}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const toggleAdopt = (reviewId: string) => {
    setAdopted(prev => prev.includes(reviewId) ? prev.filter(rid => rid !== reviewId) : [...prev, reviewId]);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-gold-500 fill-gold-500' : 'text-surface-200'}`} />
        ))}
      </div>
    );
  };

  const getBookmarkBtnClass = () => {
    if (bookmarked) {
      return 'p-2.5 rounded-xl border transition-all bg-brand-500/10 border-brand-500/30 text-brand-500';
    }
    return 'p-2.5 rounded-xl border transition-all bg-white border-surface-200 text-surface-400 hover:text-brand-500 hover:border-brand-300';
  };

  const getReviewCardClass = (isActive: boolean, colors: typeof typeColorMap.positive) => {
    if (isActive) {
      const bgColor = colors.bgLight + ' ' + colors.borderLight + ' shadow-lg';
      return 'p-5 rounded-2xl border cursor-pointer transition-all ' + bgColor;
    }
    return 'p-5 rounded-2xl border cursor-pointer transition-all border-surface-100 bg-white hover:border-surface-200 hover:shadow-md';
  };

  const getAdoptBtnClass = (isAdopted: boolean, colors: typeof typeColorMap.positive) => {
    if (isAdopted) {
      return 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all bg-brand-500 text-white border-brand-500';
    }
    return 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ' + colors.text + ' ' + colors.bgLight + ' border-transparent hover:border-current';
  };

  const getDotRingClass = (colors: typeof typeColorMap.positive) => {
    return colors.ring;
  };

  return (
    <div className="h-full flex flex-col bg-surface-50/30">
      <div className="bg-white border-b border-surface-100 px-8 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/cases" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-brand-500 transition-colors">
              <ArrowLeft className="w-4 h-4" /> 返回案例库
            </Link>
            <div className="h-4 w-px bg-surface-200" />
            <div>
              <h1 className="font-display text-xl font-bold text-brand-900">{caseItem.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 text-xs bg-brand-500/10 text-brand-600 rounded-full font-medium">{caseItem.industry}</span>
                <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-600 rounded-full font-medium">{caseItem.position}</span>
                <div className="flex items-center gap-1 ml-2">
                  {renderStars(caseItem.rating)}
                  <span className="text-sm font-mono text-gold-600 font-bold">{caseItem.rating}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setBookmarked(!bookmarked)} className={getBookmarkBtnClass()}>
            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-brand-500' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[60%] shrink-0 overflow-y-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-2xl rounded-xl mx-auto max-w-2xl aspect-[210/297] p-12 text-sm relative"
          >
            {resumeSections.map((sec, si) => (
              <div
                key={sec.id}
                id={sec.id}
                className={`mb-7 relative ${si === 0 ? '' : 'border-t border-surface-100 pt-5'}`}
              >
                <h3 className="font-display font-bold text-brand-900 text-base mb-3">{sec.title}</h3>
                {sec.lines.map((line, li) => (
                  <p key={li} className="text-surface-600 leading-relaxed text-xs mb-1.5">{line}</p>
                ))}
                {enrichedReviews.filter(r => r.anchor === sec.title || sec.title.includes(r.anchor)).map((r, ri) => {
                  const colors = typeColorMap[r.type];
                  const IconComponent = iconMap[r.type];
                  return (
                    <div
                      key={r.id}
                      className="absolute -right-14 z-10"
                      style={{ top: `${20 + ri * 24}px` }}
                    >
                      <button
                        onClick={() => handleDotClick(r.id)}
                        onMouseEnter={() => setHoveredReview(r.id)}
                        onMouseLeave={() => setHoveredReview(null)}
                        className={`relative w-5 h-5 rounded-full border-2 border-white shadow-lg ${colors.bg} transition-all ${activeReview === r.id ? 'scale-125 ring-4 ring-offset-2 ' + getDotRingClass(colors) : 'hover:scale-125'}`}
                      >
                        {hoveredReview === r.id && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute right-8 top-1/2 -translate-y-1/2 w-56 p-3 bg-white shadow-xl rounded-lg border border-surface-100 z-20 text-left"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <IconComponent className={`w-4 h-4 ${colors.text}`} />
                              <span className={`text-xs font-bold ${colors.text}`}>{typeLabelMap[r.type]}</span>
                            </div>
                            <p className="text-xs text-surface-600 leading-relaxed">{r.comment}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-surface-400">
                              <MapPin className="w-3 h-3" />
                              {r.location || r.anchor}
                            </div>
                          </motion.div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col border-l border-surface-100 bg-white">
          <div className="p-6 border-b border-surface-50 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-brand-900">HR专业点评</h2>
                <p className="text-xs text-surface-400 mt-1">共 {enrichedReviews.length} 条专业点评</p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white">张</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <span className="font-medium text-brand-600">张女士</span>
              <span className="text-surface-300">/</span>
              <span>资深HRD</span>
              <span className="text-surface-300">/</span>
              <span>10年互联网招聘经验</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {enrichedReviews.map((r, i) => {
              const IconComponent = iconMap[r.type];
              const colors = typeColorMap[r.type];
              const isActive = activeReview === r.id;
              const isAdopted = adopted.includes(r.id);
              return (
                <motion.div
                  key={r.id}
                  id={`review-${r.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleReviewClick(r.id, r.anchor)}
                  className={getReviewCardClass(isActive, colors)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg ${colors.bgLight} flex items-center justify-center`}>
                      <IconComponent className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <span className={`text-xs font-bold ${colors.text}`}>{typeLabelMap[r.type]}评价</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-surface-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{r.location || r.anchor}</span>
                  </div>
                  <p className="text-sm text-brand-900 leading-relaxed mb-4">{r.detail || r.comment}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAdopt(r.id); }}
                    className={getAdoptBtnClass(isAdopted, colors)}
                  >
                    <Check className={`w-3.5 h-3.5 ${isAdopted ? '' : 'opacity-0'}`} />
                    {isAdopted ? '已采纳' : '采纳此建议'}
                  </button>
                </motion.div>
              );
            })}
          </div>

          <div className="p-6 border-t border-surface-50 shrink-0">
            <Link
              to={`/editor/${caseItem.id}`}
              className="btn-primary flex items-center justify-center gap-2 py-3.5 text-sm w-full rounded-xl font-medium shadow-lg shadow-brand-500/25"
            >
              <Copy className="w-4 h-4" /> 套用此模板
            </Link>
            <p className="text-xs text-center text-surface-400 mt-3">一键生成属于你的专业简历</p>
          </div>
        </div>
      </div>
    </div>
  );
}
