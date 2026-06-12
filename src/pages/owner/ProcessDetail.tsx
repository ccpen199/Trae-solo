import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Droplets,
  Hammer,
  Palette,
  Plug,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

const stagesMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  hydropower: { label: '水电改造', icon: Zap, color: 'text-haze-600', bgColor: 'bg-haze-100' },
  tile: { label: '泥瓦工程', icon: Droplets, color: 'text-terracotta-600', bgColor: 'bg-terracotta-100' },
  carpentry: { label: '木工工程', icon: Hammer, color: 'text-wood-700', bgColor: 'bg-wood-100' },
  paint: { label: '油漆工程', icon: Palette, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  installation: { label: '安装工程', icon: Plug, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
};

const processDetails: Record<string, any> = {
  p1: {
    name: '强电回路布设',
    stage: 'hydropower',
    duration: '2-3天',
    difficulty: '高',
    steps: [
      { title: '现场交底', desc: '确认各空间点位位置，标记大功率电器回路，配电箱扩容评估' },
      { title: '材料验收', desc: '检查电线品牌规格（BV/BVR线）、穿线管壁厚（≥1.5mm）、底盒质量' },
      { title: '弹线开槽', desc: '横平竖直弹线，墙面开槽深度≥3cm，严禁横向开槽超过50cm' },
      { title: '布管穿线', desc: '强电走天弱电走地，回路分离，管内电线占比≤40%' },
      { title: '回路测试', desc: '摇表绝缘测试≥0.5MΩ，相位检测，漏电保护测试' },
      { title: '封槽保护', desc: '水泥砂浆分层填缝，挂网防裂，做好管线走向标记' },
    ],
    gbQuotes: [
      { code: 'GB 50327-2001', clause: '第4.3.2条', text: '电气配线应分色，相线(L)颜色应统一，零线(N)宜用黑色，保护线(PE)必须用黄绿双色线。' },
      { code: 'GB 50303-2015', clause: '第12.2.2条', text: '塑料护套线严禁直接敷设在建筑物顶棚内、墙体内、抹灰层内、保温层内或装饰面内。' },
      { code: 'JGJ 242-2011', clause: '第9.3.2条', text: '每套住宅的空调电源插座、电源插座与照明应分路设计；厨房电源插座和卫生间电源插座宜设置独立回路。' },
    ],
    faqs: [
      { q: '为什么大功率电器要走独立回路？', a: '避免同时使用时过载跳闸，常用大功率如空调(4平方)、电热水器(6平方)、烤箱(4平方)均需独立回路。' },
      { q: '电线管内为什么不能超过40%填充率？', a: '保证电线散热空间，防止过热加速老化，同时方便后期换线维修。' },
      { q: '强电弱电间距多少才安全？', a: '平行间距≥30cm，交叉处需做锡纸屏蔽，避免电磁干扰网络、电视信号。' },
    ],
    pitfallGuides: [
      { id: 'pit1', title: '电路改造10大坑', risk: 'high', viewCount: 12580, desc: '偷工减料、回路混乱，后期隐患无穷' },
      { id: 'pit2', title: '插座点位如何规划', risk: 'medium', viewCount: 8932, desc: '这10个位置必留，少一个都后悔' },
      { id: 'pit3', title: '火线零线接反怎么办', risk: 'low', viewCount: 5241, desc: '教你用电笔快速检测相位' },
    ],
  },
};

export default function ProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const detail = processDetails[id || 'p1'] || processDetails['p1'];
  const stageInfo = stagesMap[detail.stage] || stagesMap.hydropower;
  const StageIcon = stageInfo.icon;

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-8">
        <button
          onClick={() => navigate('/owner/process')}
          className="btn-ghost mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工艺库
        </button>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-3">
            <div className="sticky top-8">
              <div className="card-base overflow-hidden">
                <div className="px-5 py-4 border-b border-ivory-200 bg-gradient-to-r from-ivory-50 to-white">
                  <h3 className="font-semibold text-carbon-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-wood-600" />
                    施工步骤
                  </h3>
                  <p className="text-xs text-ivory-500 mt-0.5">共{detail.steps.length}步 · 工期{detail.duration}</p>
                </div>
                <div className="p-4">
                  <div className="relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-ivory-200" />
                    {detail.steps.map((step: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveStep(idx)}
                        className={cn(
                          'w-full relative flex items-start gap-3 py-3 text-left group',
                        )}
                      >
                        <div className={cn(
                          'relative z-10 w-5.5 h-5.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                          activeStep >= idx
                            ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/30'
                            : 'bg-white border-2 border-ivory-300 text-ivory-400'
                        )}>
                          {activeStep > idx ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className={cn(
                            'text-sm font-medium transition-colors',
                            activeStep === idx ? 'text-terracotta-700' : 'text-carbon-700 group-hover:text-carbon-900'
                          )}>
                            {step.title}
                          </p>
                          {activeStep === idx && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-ivory-600 mt-1 leading-relaxed"
                            >
                              {step.desc}
                            </motion.p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-6 space-y-6">
            <div className="card-base p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={cn('badge inline-flex items-center gap-1.5', stageInfo.bgColor, stageInfo.color)}>
                  <StageIcon className="w-3.5 h-3.5" />
                  {stageInfo.label}
                </span>
                <span className="badge-wood">工期 {detail.duration}</span>
                <span className="badge-danger">难度 {detail.difficulty}</span>
                <span className="badge-haze">
                  <BookOpenIcon className="w-3 h-3" />
                  {detail.gbQuotes.length}条国标
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-carbon-900 mb-3">{detail.name}</h1>
              <p className="text-carbon-600 leading-relaxed">
                本工艺严格遵循国家现行规范要求，通过标准化施工流程确保工程质量，
                每项工序均包含详细的操作要点、验收标准和常见问题解决方案。
              </p>
            </div>

            <div className="space-y-4">
              {detail.gbQuotes.map((gb: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-xl bg-carbon-800/95 overflow-hidden"
                >
                  <div className="border-l-[3px] border-amber-400 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <BookOpenIcon className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-mono text-amber-300 text-sm font-semibold">{gb.code}</p>
                        <p className="text-xs text-amber-200/60">{gb.clause}</p>
                      </div>
                    </div>
                    <blockquote className="text-ivory-100 leading-relaxed pl-2 border-l-2 border-amber-400/30 italic">
                      "{gb.text}"
                    </blockquote>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="card-base p-6">
              <h3 className="font-serif text-xl font-semibold text-carbon-800 mb-6">步骤详解</h3>
              <div className="space-y-6">
                {detail.steps.map((step: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className={cn(
                      'p-5 rounded-xl border transition-all',
                      activeStep === idx
                        ? 'border-terracotta-300 bg-terracotta-50/50 shadow-sm'
                        : 'border-ivory-200 bg-white'
                    )}
                    onMouseEnter={() => setActiveStep(idx)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-wood-100 flex items-center justify-center font-serif font-bold text-wood-700">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-carbon-800 mb-2">{step.title}</h4>
                        <p className="text-sm text-carbon-600 leading-relaxed mb-4">{step.desc}</p>
                        <div className="aspect-video rounded-lg overflow-hidden bg-ivory-100">
                          <img
                            src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
                              `construction site step ${idx + 1} ${step.title} home renovation professional documentary photography`
                            )}&image_size=landscape_16_9&seed=6${idx}0`}
                            alt={step.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="card-base p-6">
              <h3 className="font-serif text-xl font-semibold text-carbon-800 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-haze-600" />
                常见问题 FAQ
              </h3>
              <div className="space-y-2">
                {detail.faqs.map((faq: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-ivory-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-ivory-50 transition-colors"
                    >
                      <span className="font-medium text-carbon-800 flex items-center gap-2">
                        <span className="text-terracotta-500 font-bold">Q{idx + 1}.</span>
                        {faq.q}
                      </span>
                      {expandedFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-ivory-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-ivory-400 flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expandedFaq === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 ml-6 border-l-2 border-terracotta-200">
                            <p className="text-sm text-carbon-600 leading-relaxed">{faq.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="sticky top-8 space-y-4">
              <div className="card-base p-5">
                <h3 className="font-semibold text-carbon-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-terracotta-500" />
                  相关避坑指南
                </h3>
                <div className="space-y-3">
                  {detail.pitfallGuides.map((guide: any, idx: number) => (
                    <motion.div
                      key={guide.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      onClick={() => navigate('/owner/pitfalls')}
                      className="p-4 rounded-xl border border-ivory-200 hover:border-terracotta-300 hover:bg-terracotta-50/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={cn(
                          'badge text-[10px] flex-shrink-0',
                          guide.risk === 'high' && 'bg-rose-50 text-rose-700 border-rose-200',
                          guide.risk === 'medium' && 'bg-amber-50 text-amber-700 border-amber-200',
                          guide.risk === 'low' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        )}>
                          {guide.risk === 'high' ? '🔴 高风险' : guide.risk === 'medium' ? '🟡 中风险' : '🟢 低风险'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-ivory-300 group-hover:text-terracotta-500 flex-shrink-0 transition-colors" />
                      </div>
                      <h4 className="font-medium text-sm text-carbon-800 mb-1 group-hover:text-terracotta-700 transition-colors">
                        {guide.title}
                      </h4>
                      <p className="text-xs text-ivory-500 line-clamp-2 mb-2">{guide.desc}</p>
                      <p className="text-[11px] text-ivory-400 flex items-center gap-1">
                        👁 {guide.viewCount.toLocaleString()} 浏览
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="card-base p-5 bg-gradient-to-br from-terracotta-50 to-wood-50 border-terracotta-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-terracotta-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-carbon-800">标准验收节点</h4>
                </div>
                <ul className="space-y-2 text-sm text-carbon-600">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-terracotta-500" />
                    材料进场验收（品牌/规格）
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-terracotta-500" />
                    隐蔽工程验收（封槽前）
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-terracotta-500" />
                    中期验收（通电/通水测试）
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-terracotta-500" />
                    竣工验收（全面检测）
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
