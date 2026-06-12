import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Calculator,
  Palette,
  Building2,
  Wrench,
  MessageCircleQuestion,
  Heart,
  Star,
  ArrowRight,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Award,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

const featureCards = [
  {
    title: '3D效果图生成器',
    desc: '上传户型图，AI一键生成全屋3D漫游效果',
    icon: Box,
    path: '/owner/3d-generator',
    bg: 'from-terracotta-50 to-wood-50',
    accent: 'bg-terracotta-400',
    ring: 'ring-terracotta-200',
    text: 'text-terracotta-700',
  },
  {
    title: '装修计算器',
    desc: '三档报价对比，明细透明不踩坑',
    icon: Calculator,
    path: '/owner/calculator',
    bg: 'from-haze-50 to-ivory-50',
    accent: 'bg-haze-500',
    ring: 'ring-haze-200',
    text: 'text-haze-700',
  },
  {
    title: '风格灵感库',
    desc: '海量高清案例，以图搜图找同款',
    icon: Palette,
    path: '/owner/inspiration',
    bg: 'from-wood-50 to-ivory-100',
    accent: 'bg-wood-500',
    ring: 'ring-wood-200',
    text: 'text-wood-700',
  },
  {
    title: '装修公司',
    desc: '资质核验入驻，三级筛选更靠谱',
    icon: Building2,
    path: '/owner/companies',
    bg: 'from-terracotta-50 to-ivory-50',
    accent: 'bg-terracotta-500',
    ring: 'ring-terracotta-200',
    text: 'text-terracotta-700',
  },
  {
    title: '施工工艺',
    desc: '国标条文对照，5大阶段全流程解析',
    icon: Wrench,
    path: '/owner/knowledge/process',
    bg: 'from-haze-50 to-wood-50',
    accent: 'bg-haze-600',
    ring: 'ring-haze-200',
    text: 'text-haze-700',
  },
  {
    title: '问答社区',
    desc: '认证专家解答，千万业主经验共享',
    icon: MessageCircleQuestion,
    path: '/owner/community',
    bg: 'from-ivory-50 to-wood-50',
    accent: 'bg-wood-600',
    ring: 'ring-wood-200',
    text: 'text-wood-700',
  },
];

const inspirationItems = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  title: [
    '现代简约客厅',
    '北欧风卧室',
    '新中式书房',
    '轻奢开放式厨房',
    '日式原木餐厅',
    '工业风loft',
    '地中海阳台',
    '美式复古玄关',
    '极简卫浴',
    '侘寂风茶室',
    '法式奶油主卧',
    '港式轻奢客厅',
  ][i],
  style: ['现代', '北欧', '中式', '轻奢', '日式', '工业', '地中海', '美式', '极简', '侘寂', '法式', '港式'][i],
  heights: [240, 300, 260, 280, 320, 250, 290, 270, 310, 260, 300, 280][i],
  colors: [
    ['#D4B896', '#8B7355', '#F5EFE6'],
    ['#E8DED0', '#A8C5B8', '#FDFBF8'],
    ['#8B4513', '#D4AF37', '#2F1810'],
    ['#B8860B', '#2F4F4F', '#F5F5DC'],
    ['#DEB887', '#F5DEB3', '#8B7355'],
    ['#363636', '#A0522D', '#D3D3D3'],
    ['#4682B4', '#F4A460', '#FFF8DC'],
    ['#8B0000', '#DAA520', '#F5F5DC'],
    ['#F8F8FF', '#708090', '#E0E0E0'],
    ['#C4A484', '#FDF5E6', '#696969'],
    ['#FFE4E1', '#F5C6AA', '#CD853F'],
    ['#1C1C1C', '#C9A961', '#F5F5F5'],
  ][i],
  gradient: [
    'from-amber-100 via-wood-100 to-terracotta-100',
    'from-green-100 via-haze-50 to-ivory-100',
    'from-terracotta-200 via-wood-300 to-carbon-700',
    'from-amber-200 via-haze-300 to-ivory-100',
    'from-wood-100 via-ivory-100 to-wood-200',
    'from-carbon-600 via-terracotta-700 to-ivory-200',
    'from-haze-200 via-terracotta-100 to-ivory-100',
    'from-red-200 via-amber-200 to-ivory-100',
    'from-ivory-50 via-haze-100 to-carbon-200',
    'from-wood-200 via-ivory-50 to-carbon-400',
    'from-pink-100 via-terracotta-100 to-wood-200',
    'from-carbon-700 via-amber-200 to-ivory-50',
  ][i],
  likes: Math.floor(Math.random() * 900) + 100,
}));

const companies = [
  {
    name: '华筑精工装饰',
    rating: 4.9,
    reviews: 1286,
    level: '一级',
    levelColor: 'bg-terracotta-500',
    cases: 368,
    tags: ['老房改造', '别墅大宅', '全案设计'],
    city: '上海',
    accent: 'from-terracotta-500 to-amber-500',
  },
  {
    name: '艺境空间设计',
    rating: 4.8,
    reviews: 892,
    level: '一级',
    levelColor: 'bg-terracotta-500',
    cases: 234,
    tags: ['轻奢定制', '软装搭配', '环保材料'],
    city: '北京',
    accent: 'from-haze-500 to-blue-500',
  },
  {
    name: '佳和家装饰',
    rating: 4.7,
    reviews: 654,
    level: '二级',
    levelColor: 'bg-wood-500',
    cases: 178,
    tags: ['性价比首选', '北欧风格', '快速施工'],
    city: '广州',
    accent: 'from-wood-500 to-amber-600',
  },
  {
    name: '优品筑家',
    rating: 4.6,
    reviews: 431,
    level: '三级',
    levelColor: 'bg-haze-500',
    cases: 112,
    tags: ['局部改造', '厨卫翻新', '出租房'],
    city: '深圳',
    accent: 'from-haze-600 to-wood-500',
  },
];

const statCards = [
  {
    label: '累计成交',
    value: '12,847+',
    unit: '套',
    gradient: 'from-terracotta-400 via-terracotta-500 to-terracotta-600',
    icon: CheckCircle2,
  },
  {
    label: '业主满意度',
    value: '98.6',
    unit: '%',
    gradient: 'from-haze-400 via-haze-500 to-haze-600',
    icon: Sparkles,
  },
  {
    label: '覆盖城市',
    value: '320+',
    unit: '座',
    gradient: 'from-wood-400 via-wood-500 to-wood-600',
    icon: MapPin,
  },
  {
    label: '入驻服务商',
    value: '3,500+',
    unit: '家',
    gradient: 'from-carbon-500 via-carbon-600 to-carbon-700',
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <div className="bg-ivory-50">
      {/* Hero 区域 */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-ivory-50 via-wood-50/60 to-haze-50/80">
        <div className="absolute inset-0 bg-wood-texture opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-terracotta-200/40 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-haze-200/50 to-transparent blur-3xl pointer-events-none" />

        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center py-20 lg:py-0">
          <div className="max-w-xl">
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur border border-wood-200/60 text-sm text-wood-700 mb-6 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-terracotta-500" />
              智能装修一站式平台 · 让家的美好触手可及
            </motion.div>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-carbon-800 mb-6 text-balance"
            >
              让每一次装修
              <br />
              <span className="bg-gradient-to-r from-terracotta-500 via-wood-500 to-haze-600 bg-clip-text text-transparent">
                都从容不迫
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-lg text-carbon-600 leading-relaxed mb-8 max-w-lg"
            >
              从户型图AI识别、3D效果生成、透明报价计算，到资质严选的装修公司、国标级施工工艺库、避坑指南——
              装修全流程的每个环节，居智通都为你把好关。
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/owner/3d-generator"
                className="group btn-cta"
              >
                <Box className="w-5 h-5" />
                立即生成3D方案
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/owner/calculator"
                className="group btn-secondary text-base px-6 py-3"
              >
                <Calculator className="w-5 h-5" />
                免费获取报价
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            </motion.div>

            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mt-10 flex items-center gap-6 text-sm text-carbon-500"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-terracotta-500" />
                资金托管保障
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-haze-500" />
                资质严选入驻
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-wood-500" />
                第三方监理
              </div>
            </motion.div>
          </div>

          <div className="relative h-[520px] lg:h-[600px] hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="absolute top-8 right-8 w-[72%] h-[60%] rounded-3xl overflow-hidden shadow-card-hover border border-white/60 animate-float"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-terracotta-100 via-wood-100 to-haze-100" />
              <div className="absolute inset-0 bg-grain" />
              <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-ivory-50 via-white to-wood-50 shadow-inner overflow-hidden">
                <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-terracotta-300" />
                  <div className="w-3 h-3 rounded-full bg-amber-300" />
                  <div className="w-3 h-3 rounded-full bg-haze-300" />
                  <span className="ml-3 text-xs text-ivory-500 font-mono">livingroom-modern.glb</span>
                </div>
                <div className="absolute inset-x-6 top-16 bottom-6 rounded-xl bg-gradient-to-br from-amber-100 via-terracotta-50 to-wood-100 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-56 h-56">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/80 to-wood-100/80 backdrop-blur border border-white shadow-xl" />
                      <div className="absolute inset-6 rounded-lg border-2 border-dashed border-terracotta-300/60 flex items-center justify-center">
                        <Box className="w-12 h-12 text-terracotta-500/70" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] text-carbon-600 font-medium">实时渲染中</span>
                      </div>
                      <div className="h-1.5 w-36 rounded-full bg-white/60 overflow-hidden">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-terracotta-400 to-wood-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-ivory-600 font-mono">76%</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60, y: 30 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              className="absolute bottom-4 left-0 w-[58%] h-[44%] rounded-2xl overflow-hidden shadow-card-hover border border-white/60 animate-float"
              style={{ animationDelay: '1.2s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-haze-50 via-white to-ivory-100" />
              <div className="absolute inset-3 rounded-xl border border-ivory-200/60 bg-white/70 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-carbon-700">装修报价明细</span>
                  <span className="badge-terracotta">¥18.6万</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: '主材', val: 8.4, color: 'bg-terracotta-400' },
                    { label: '辅材', val: 3.2, color: 'bg-wood-400' },
                    { label: '人工', val: 4.6, color: 'bg-haze-500' },
                    { label: '设计管理', val: 2.4, color: 'bg-carbon-500' },
                  ].map((row, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-carbon-600">{row.label}</span>
                        <span className="text-carbon-500 font-mono">¥{row.val}万</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-ivory-200/80 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(row.val / 8.4) * 100}%` }}
                          transition={{ duration: 1, delay: 0.9 + idx * 0.1, ease: 'easeOut' }}
                          className={clsx('h-full rounded-full', row.color)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="absolute top-4 left-0 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur border border-wood-200/60 shadow-card"
            >
              <div className="flex items-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-carbon-700 font-semibold">已核验资质</div>
                  <div className="text-ivory-500">1286家装修公司</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-ivory-500"
        >
          <span className="text-xs">向下探索</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* 核心功能导航 */}
      <section className="py-20 lg:py-28 relative bg-gradient-to-b from-transparent to-ivory-100/60">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wood-100 text-wood-700 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              核心能力
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-carbon-800 mb-3">
              装修全流程 · 6大工具一站搞定
            </h2>
            <p className="text-carbon-500 max-w-xl mx-auto">
              从设计灵感、报价测算，到施工落地、经验避坑，每个环节都有专业工具帮你
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featureCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-80px' }}
                  variants={fadeInUp}
                  className={clsx(
                    'group relative rounded-2xl overflow-hidden card-hoverable p-5 md:p-6',
                    idx === 4 && 'lg:col-start-2',
                  )}
                >
                  <div
                    className={clsx(
                      'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                      `bg-gradient-to-r from-transparent via-${card.accent.replace('bg-', '')} to-transparent`,
                    )}
                  />
                  <div
                    className={clsx(
                      'absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-60 blur-2xl transition-all duration-500 bg-gradient-to-br',
                      card.bg,
                    )}
                  />

                  <div className="relative">
                    <div
                      className={clsx(
                        'w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 ring-4 transition-all duration-300',
                        `bg-gradient-to-br ${card.bg} ${card.text} ring-inset`,
                        card.ring,
                      )}
                    >
                      <Icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <h3 className="font-serif text-lg md:text-xl text-carbon-800 mb-1.5 group-hover:text-carbon-900 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-carbon-500 leading-relaxed mb-4">
                      {card.desc}
                    </p>
                    <Link
                      to={card.path}
                      className={clsx(
                        'inline-flex items-center gap-1.5 text-sm font-medium transition-all',
                        card.text,
                        'opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0',
                      )}
                    >
                      立即使用
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 精选灵感瀑布流 */}
      <section className="py-20 lg:py-28 relative bg-gradient-to-b from-ivory-100/60 to-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-12 flex-wrap gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-haze-100 text-haze-700 text-xs font-medium mb-3">
                <Palette className="w-3.5 h-3.5" />
                灵感集
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-carbon-800 mb-2">
                精选装修灵感
              </h2>
              <p className="text-carbon-500">12 种热门风格 · AI自动提取主色调方案</p>
            </div>
            <Link
              to="/owner/inspiration"
              className="btn-ghost text-sm group"
            >
              查看全部灵感
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6">
            {inspirationItems.map((item, idx) => (
              <motion.div
                key={item.id}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeInUp}
                className="break-inside-avoid group relative rounded-2xl overflow-hidden card-hoverable"
              >
                <div
                  className={clsx(
                    'relative w-full overflow-hidden bg-gradient-to-br',
                    item.gradient,
                  )}
                  style={{ height: item.heights }}
                >
                  <div className="absolute inset-0 bg-wood-texture opacity-30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10" />

                  <div className="absolute top-3 right-3">
                    <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur border border-white/50 flex items-center justify-center text-carbon-500 hover:text-terracotta-500 hover:scale-110 transition-all shadow-sm">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white text-xs font-medium">
                    {item.style}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-white font-medium text-sm mb-2 drop-shadow-sm">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {item.colors.map((color, ci) => (
                          <div
                            key={ci}
                            className="w-5 h-5 rounded-md border border-white/40 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-white/90 text-xs">
                        <Heart className="w-3 h-3 fill-current" />
                        {item.likes}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 热门装修公司 */}
      <section className="py-20 lg:py-28 relative bg-gradient-to-b from-white to-ivory-100/40">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-12 flex-wrap gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-medium mb-3">
                <Building2 className="w-3.5 h-3.5" />
                严选好公司
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-carbon-800 mb-2">
                热门装修公司推荐
              </h2>
              <p className="text-carbon-500">资质核验 · 案例真实 · 业主评价透明</p>
            </div>
            <Link
              to="/owner/companies"
              className="btn-ghost text-sm group"
            >
              查看全部公司
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {companies.map((c, idx) => (
              <motion.div
                key={c.name}
                custom={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeInUp}
                className="group card-hoverable p-5 flex flex-col sm:flex-row gap-5"
              >
                <div
                  className={clsx(
                    'w-full sm:w-28 h-28 shrink-0 rounded-xl bg-gradient-to-br',
                    c.accent,
                    'flex items-center justify-center text-white relative overflow-hidden',
                  )}
                >
                  <div className="absolute inset-0 bg-grain opacity-60" />
                  <Building2 className="w-12 h-12 relative z-10 drop-shadow" />
                  <div
                    className={clsx(
                      'absolute bottom-2 left-2 right-2 py-1 rounded-md text-[11px] font-semibold text-center',
                      c.levelColor,
                      'shadow-sm',
                    )}
                  >
                    {c.level}资质
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-serif text-lg text-carbon-800 group-hover:text-terracotta-700 transition-colors truncate">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-semibold text-carbon-700">{c.rating}</span>
                        </div>
                        <span className="text-ivory-500">({c.reviews}条评价)</span>
                        <span className="text-ivory-400">·</span>
                        <span className="text-carbon-500 flex items-center gap-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {c.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.tags.map((t) => (
                      <span key={t} className="badge-wood text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-ivory-200">
                    <span className="text-sm text-carbon-500">
                      <span className="font-semibold text-carbon-700">{c.cases}</span> 个落地案例
                    </span>
                    <button className="btn-primary px-4 py-2 text-sm !shadow-none">
                      立即预约
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 平台数据看板 */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-carbon-900 via-carbon-800 to-carbon-900" />
        <div className="absolute inset-0 bg-grain opacity-40" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-3 border border-white/10">
              <Award className="w-3.5 h-3.5" />
              值得信赖
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-3">
              用数据说话 · 每一份信任都值得
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              成立至今，我们已帮助上万家庭顺利完成装修
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {statCards.map((s, idx) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={fadeInUp}
                  className={clsx(
                    'relative rounded-2xl p-6 md:p-7 overflow-hidden',
                    'bg-gradient-to-br',
                    s.gradient,
                    'shadow-lg hover:shadow-xl transition-shadow',
                  )}
                >
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur border border-white/20 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-baseline gap-1 text-white mb-1">
                      <span className="font-serif text-4xl md:text-5xl font-bold tracking-tight">
                        {s.value}
                      </span>
                      <span className="text-lg font-medium text-white/80">{s.unit}</span>
                    </div>
                    <div className="text-white/75 text-sm">{s.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-carbon-900 text-white/70 pt-16 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-30" />
        <div className="container relative z-10">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wood-400 to-terracotta-500 flex items-center justify-center">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <span className="font-serif text-xl font-bold text-white">居智通</span>
              </div>
              <p className="text-sm leading-relaxed max-w-md mb-5 text-white/60">
                居智通致力于通过AI技术和专业服务，重塑家装行业的信任体系。
                让每一次装修，都从容不迫、放心省心。
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-terracotta-400" />
                  服务热线：400-888-8888
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-terracotta-400" />
                  商务合作：bd@juzhitong.com
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-terracotta-400" />
                  上海市徐汇区漕河泾开发区科技绿洲
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">业主服务</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/owner/3d-generator" className="hover:text-white transition-colors">3D效果图生成</Link></li>
                <li><Link to="/owner/calculator" className="hover:text-white transition-colors">装修报价计算</Link></li>
                <li><Link to="/owner/inspiration" className="hover:text-white transition-colors">风格灵感库</Link></li>
                <li><Link to="/owner/companies" className="hover:text-white transition-colors">找装修公司</Link></li>
                <li><Link to="/owner/knowledge/process" className="hover:text-white transition-colors">施工工艺</Link></li>
                <li><Link to="/owner/community" className="hover:text-white transition-colors">问答社区</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">平台与支持</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/provider" className="hover:text-white transition-colors">服务商入驻</Link></li>
                <li><Link to="/admin" className="hover:text-white transition-colors">运营管理</Link></li>
                <li><Link to="/owner/knowledge/pitfalls" className="hover:text-white transition-colors">装修避坑</Link></li>
                <li><Link to="/owner/compare" className="hover:text-white transition-colors">方案比价</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">用户协议</a></li>
                <li><a href="#" className="hover:text-white transition-colors">隐私政策</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <div>© 2025 居智通 JuZhiTong. All rights reserved. 沪ICP备2025xxxxxx号</div>
            <div className="flex items-center gap-4">
              <span>Powered by AI · 构建美好生活</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
