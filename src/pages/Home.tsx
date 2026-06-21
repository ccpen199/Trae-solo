import { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Upload,
  Sparkles,
  UserCheck,
  Award,
  Star,
  Clock,
  TrendingUp,
  Eye,
  MessageCircle,
  ChevronRight,
  Shield,
  Users,
  FileCheck,
  ThumbsUp,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Bot,
  HandCoins,
  Package,
  Gem,
  ScrollText,
  Coins,
  Puzzle,
  TreePine,
  Brush,
  Shirt,
  PenTool,
  Coffee,
  Flame,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  mockExperts,
  mockKnowledgeArticles,
  mockCommunityQuestions,
  mockOrders,
  mockCertificates,
  mockArtworks,
  mockUsers,
} from '@/lib/mockData';
import { ExpertLevel, Category, AuthenticityLevel } from '../../shared/types';

const heroArtworks = [
  { url: 'https://picsum.photos/seed/ceramic1/600/800', name: '青釉玉壶春瓶' },
  { url: 'https://picsum.photos/seed/jade1/600/800', name: '和田白玉观音' },
  { url: 'https://picsum.photos/seed/painting1/600/800', name: '山水立轴' },
  { url: 'https://picsum.photos/seed/bronze1/600/800', name: '青铜饕餮纹鼎' },
  { url: 'https://picsum.photos/seed/zisha1/600/800', name: '石瓢紫砂壶' },
];

const levelLabels: Record<ExpertLevel, string> = {
  [ExpertLevel.NATIONAL]: '国家级',
  [ExpertLevel.PROVINCIAL]: '省级',
  [ExpertLevel.SENIOR]: '资深',
};

const levelColors: Record<ExpertLevel, string> = {
  [ExpertLevel.NATIONAL]: 'bg-cinnabar-400',
  [ExpertLevel.PROVINCIAL]: 'bg-gold-500',
  [ExpertLevel.SENIOR]: 'bg-jade-500',
};

const categoryLabels: Record<string, string> = {
  [Category.CERAMIC]: '陶瓷',
  [Category.JADE]: '玉器',
  [Category.CALLIGRAPHY_PAINTING]: '书画',
  [Category.BRONZE]: '青铜器',
  [Category.COIN]: '钱币',
  [Category.MISCELLANEOUS]: '杂项',
  [Category.WOOD]: '木器',
  [Category.LACQUER]: '漆器',
  [Category.TEXTILE]: '织绣',
  [Category.STATIONERY]: '文房',
  [Category.SEAL]: '印章',
  [Category.ZISHA]: '紫砂',
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  [Category.CERAMIC]: Package,
  [Category.JADE]: Gem,
  [Category.CALLIGRAPHY_PAINTING]: ScrollText,
  [Category.BRONZE]: Flame,
  [Category.COIN]: Coins,
  [Category.MISCELLANEOUS]: Puzzle,
  [Category.WOOD]: TreePine,
  [Category.LACQUER]: Brush,
  [Category.TEXTILE]: Shirt,
  [Category.STATIONERY]: PenTool,
  [Category.SEAL]: Award,
  [Category.ZISHA]: Coffee,
};

const categoryHotTags: Record<string, string[]> = {
  [Category.CERAMIC]: ['宋代五大名窑', '青花瓷'],
  [Category.JADE]: ['和田籽料', '乾隆工'],
  [Category.CALLIGRAPHY_PAINTING]: ['齐白石', '文人画'],
  [Category.BRONZE]: ['商周彝器', '铜镜'],
  [Category.COIN]: ['五帝钱', '咸丰大钱'],
  [Category.MISCELLANEOUS]: ['鼻烟壶', '竹木牙角'],
  [Category.WOOD]: ['黄花梨', '紫檀'],
  [Category.LACQUER]: ['剔红', '螺钿'],
  [Category.TEXTILE]: ['云锦', '缂丝'],
  [Category.STATIONERY]: ['端砚', '徽墨'],
  [Category.SEAL]: ['田黄', '鸡血石'],
  [Category.ZISHA]: ['顾景舟', '曼生壶'],
};

const allCategories = [
  Category.CERAMIC,
  Category.JADE,
  Category.CALLIGRAPHY_PAINTING,
  Category.BRONZE,
  Category.COIN,
  Category.MISCELLANEOUS,
  Category.WOOD,
  Category.LACQUER,
  Category.TEXTILE,
  Category.STATIONERY,
  Category.SEAL,
  Category.ZISHA,
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const anonymousNicknames = [
  '藏家**',
  '古韵**',
  '青瓷**',
  '雅集**',
  '金石**',
  '玉缘**',
  '墨香**',
  '紫砂**',
];

function getTimeAgo(index: number): string {
  const timeMap = ['刚刚', '3分钟前', '8分钟前', '15分钟前', '28分钟前', '45分钟前'];
  return timeMap[index] || `${index * 10}分钟前`;
}

function getConclusionBadge(conclusion: string) {
  switch (conclusion) {
    case AuthenticityLevel.GENUINE:
      return {
        label: '真品',
        className: 'bg-jade-500',
        Icon: CheckCircle2,
      };
    case AuthenticityLevel.SUSPICIOUS:
      return {
        label: '存疑',
        className: 'bg-gold-500',
        Icon: AlertTriangle,
      };
    case AuthenticityLevel.FAKE:
      return {
        label: '仿品',
        className: 'bg-cinnabar-400',
        Icon: XCircle,
      };
    default:
      return {
        label: '真品',
        className: 'bg-jade-500',
        Icon: CheckCircle2,
      };
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [certInput, setCertInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroArtworks.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { icon: Shield, value: '128,560+', label: '累计鉴定数' },
    { icon: Users, value: '320+', label: '入驻专家' },
    { icon: FileCheck, value: '96,200+', label: '证书存证数' },
    { icon: ThumbsUp, value: '99.2%', label: '用户满意度' },
  ];

  const processSteps = [
    { icon: Upload, title: '上传图像', desc: '多图上传，高清细节' },
    { icon: Sparkles, title: 'AI初筛', desc: '智能识别，快速分类' },
    { icon: UserCheck, title: '专家鉴定', desc: '名家掌眼，权威结论' },
    { icon: Award, title: '出证存证', desc: '区块链存证，永久溯源' },
  ];

  const guaranteeBadges = [
    {
      icon: Zap,
      title: '30分钟极速响应',
      desc: '平均接单时间',
      color: 'from-jade-500 to-jade-600',
    },
    {
      icon: Bot,
      title: 'AI免费初筛',
      desc: '智能分类识真辨伪',
      color: 'from-gold-500 to-gold-600',
    },
    {
      icon: HandCoins,
      title: '专家一对一',
      desc: '国家级专家坐镇',
      color: 'from-cinnabar-400 to-cinnabar-500',
    },
  ];

  const sampleCertNos = ['JD-2024-0325-000128', 'JD-2024-0330-000957', 'JD-2024-0410-001523'];

  const expertCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    allCategories.forEach((cat) => {
      counts[cat] = mockExperts.filter((e) => e.categories.includes(cat)).length || Math.floor(Math.random() * 8) + 3;
    });
    return counts;
  }, []);

  const appraisalRecords = useMemo(() => {
    const conclusions = [AuthenticityLevel.GENUINE, AuthenticityLevel.GENUINE, AuthenticityLevel.SUSPICIOUS, AuthenticityLevel.GENUINE, AuthenticityLevel.FAKE, AuthenticityLevel.GENUINE];
    const timeSpent = ['12分', '25分', '18分', '35分', '8分', '22分'];

    return Array.from({ length: 6 }).map((_, i) => {
      const order = mockOrders[i % mockOrders.length];
      const artwork = mockArtworks[i % mockArtworks.length];
      const expert = mockExperts[i % mockExperts.length];
      const cert = mockCertificates[i % mockCertificates.length];

      return {
        id: order?.id || `rec_${i}`,
        userNickname: anonymousNicknames[i % anonymousNicknames.length],
        userAvatar: `https://picsum.photos/seed/user${i}/64/64`,
        category: artwork?.category || allCategories[i % allCategories.length],
        artworkName: artwork?.name || '未知藏品',
        conclusion: conclusions[i],
        timeSpent: timeSpent[i],
        expertName: expert?.name || '张明德',
        certificateNo: cert?.certificateNo || `JD-2024-0${i + 1}-000${100 + i}`,
        timeAgo: getTimeAgo(i),
      };
    });
  }, []);

  const handleCategoryClick = (category: string) => {
    navigate(`/appraise?category=${encodeURIComponent(category)}`);
  };

  const handleCertSearch = () => {
    if (certInput.trim()) {
      navigate(`/certificate/${encodeURIComponent(certInput.trim())}`);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    navigate('/appraise');
  };

  return (
    <div className="min-h-screen bg-rice-100">
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative overflow-hidden bg-ink-gradient min-h-[680px] flex items-center"
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(201, 169, 97, 0.08) 50px, rgba(201, 169, 97, 0.08) 100px)`,
            }}
          />
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-[90%] overflow-hidden">
          <div className="relative w-full h-full">
            {heroArtworks.map((artwork, index) => (
              <motion.div
                key={index}
                className="absolute inset-0 flex items-center justify-center gap-4"
                initial={{ opacity: 0, x: 100 }}
                animate={{
                  opacity: index === currentSlide ? 1 : 0,
                  x: index === currentSlide ? 0 : 100,
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-gold-gradient/20 rounded-lg blur-xl" />
                  <img
                    src={artwork.url}
                    alt={artwork.name}
                    className="relative w-48 h-64 object-cover rounded-lg shadow-2xl border-2 border-gold-400/50"
                  />
                </div>
                <div className="relative">
                  <div className="absolute -inset-2 bg-gold-gradient/30 rounded-lg blur-2xl" />
                  <img
                    src={heroArtworks[(index + 1) % heroArtworks.length].url}
                    alt={heroArtworks[(index + 1) % heroArtworks.length].name}
                    className="relative w-56 h-72 object-cover rounded-lg shadow-2xl border-2 border-gold-400/70 translate-y-8"
                  />
                </div>
                <div className="relative">
                  <div className="absolute -inset-2 bg-gold-gradient/20 rounded-lg blur-xl" />
                  <img
                    src={heroArtworks[(index + 2) % heroArtworks.length].url}
                    alt={heroArtworks[(index + 2) % heroArtworks.length].name}
                    className="relative w-48 h-64 object-cover rounded-lg shadow-2xl border-2 border-gold-400/50"
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="absolute bottom-8 right-12 flex gap-2">
            {heroArtworks.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-gold-400'
                    : 'w-1.5 bg-rice-300/50'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-400/40 bg-gold-500/10 mb-6">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-200">专业文玩艺术品鉴定平台</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 bg-clip-text text-transparent text-shadow-gold">
                鉴真
              </span>
              <span className="text-rice-100 mx-2">·</span>
              <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 bg-clip-text text-transparent text-shadow-gold">
                传承
              </span>
              <span className="text-rice-100 mx-2">·</span>
              <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 bg-clip-text text-transparent text-shadow-gold">
                立信
              </span>
            </h1>
            <p className="text-lg text-rice-200/80 mb-10 leading-relaxed">
              汇聚国家级鉴定专家，AI智能初筛辅助，区块链存证溯源。
              <br />
              为每一件藏品，出具权威可信的身份证明。
            </p>
            <div className="flex gap-4">
              <Link
                to="/appraise"
                className="group inline-flex items-center gap-2 px-8 py-3.5 bg-gold-gradient text-jade-900 rounded-md font-semibold hover:shadow-gold-glow transition-all duration-300 hover:scale-[1.02]"
              >
                立即鉴定
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="inline-flex items-center gap-2 px-8 py-3.5 border border-gold-400/50 text-gold-200 rounded-md font-medium hover:bg-gold-500/10 transition-all duration-300">
                了解更多
              </button>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-rice-100 to-transparent" />
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="container -mt-16 relative z-20 mb-20"
      >
        <motion.div
          variants={fadeInUp}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #F8F4E9 0%, #F0E6D2 50%, #F8F4E9 100%)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              border: '2px dashed transparent',
              backgroundImage: `linear-gradient(#F8F4E9, #F8F4E9), repeating-linear-gradient(45deg, #C9A961 0px, #C9A961 8px, transparent 8px, transparent 16px, #C9A961 16px, #C9A961 24px, transparent 24px, transparent 32px)`,
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              opacity: 0.6,
            }}
          />
          <div className="relative p-8 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <div className="mb-6">
                  <h3 className="font-serif text-xl font-bold text-jade-700 mb-1">快速鉴定</h3>
                  <p className="text-sm text-jade-500">选择品类或直接上传图片，开启您的藏品鉴定之旅</p>
                </div>

                <motion.div variants={staggerContainer} className="grid grid-cols-6 md:grid-cols-12 gap-3 mb-8">
                  {allCategories.map((category) => {
                    const Icon = categoryIcons[category];
                    return (
                      <motion.button
                        key={category}
                        variants={fadeInUp}
                        whileHover={{ y: -4, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCategoryClick(category)}
                        className="group flex flex-col items-center gap-2"
                      >
                        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-rice-50 border-2 border-gold-300 group-hover:border-gold-500 shadow-lg shadow-gold-200/30 flex items-center justify-center transition-all duration-300 group-hover:bg-gold-50">
                          <Icon className="w-5 h-5 md:w-6 md:h-6 text-jade-600 group-hover:text-gold-600 transition-colors" />
                          <div className="absolute -inset-0.5 rounded-full bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
                        </div>
                        <span className="text-xs font-medium text-jade-600 group-hover:text-gold-600 transition-colors">
                          {categoryLabels[category]}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>

                <motion.div
                  variants={fadeInUp}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => navigate('/appraise')}
                  className="relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden"
                  style={{
                    borderColor: isDragging ? '#C9A961' : 'rgba(201, 169, 97, 0.4)',
                    backgroundColor: isDragging ? 'rgba(201, 169, 97, 0.08)' : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                      backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 35px, rgba(201, 169, 97, 0.06) 35px, rgba(201, 169, 97, 0.06) 70px)`,
                    }}
                  />
                  <div className="relative py-10 px-6 flex flex-col md:flex-row items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gold-gradient/20 flex items-center justify-center mb-3 md:mb-0">
                      <Upload className="w-7 h-7 text-gold-500" />
                    </div>
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-jade-700 text-lg">拖拽或点击上传藏品图片</p>
                      <p className="text-sm text-jade-500 mt-1">支持 JPG、PNG 格式，建议上传多角度高清照片</p>
                    </div>
                    <div className="hidden md:block h-12 w-px bg-gold-300/50" />
                    <div className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-ink-gradient text-gold-200 rounded-md text-sm font-medium">
                      开始上传
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-center">
                <motion.div variants={staggerContainer} className="space-y-4">
                  {guaranteeBadges.map((badge, idx) => (
                    <motion.div
                      key={idx}
                      variants={fadeInLeft}
                      whileHover={{ x: 4 }}
                      className="group relative p-4 rounded-xl bg-white/60 border border-gold-200/60 backdrop-blur-sm overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${badge.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className="flex items-center gap-4">
                        <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-md`}>
                          <badge.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-jade-700">{badge.title}</h4>
                          <p className="text-sm text-jade-500">{badge.desc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-jade-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="container py-8"
      >
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="section-title">鉴定流程</h2>
          <p className="section-subtitle">四步专业流程，保障鉴定权威可信</p>
        </motion.div>

        <div className="relative">
          <div className="hidden md:block absolute top-[42px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative text-center"
              >
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-ink-gradient border-2 border-gold-400 shadow-gold-glow mb-6">
                  <div className="absolute inset-0 rounded-full bg-gold-gradient opacity-0 hover:opacity-20 transition-opacity" />
                  <step.icon className="w-9 h-9 text-gold-400 relative z-10" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold-gradient text-jade-900 text-sm font-bold flex items-center justify-center shadow-lg">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-jade-700 mb-2">
                  {step.title}
                </h3>
                <p className="text-jade-500 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="bg-jade-50/50 py-24 border-y border-gold-200/50"
      >
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <motion.div variants={fadeInUp}>
              <h2 className="section-title">实时鉴定动态</h2>
              <p className="section-subtitle mb-0">藏友们在鉴真阁的真实见证</p>
            </motion.div>
            <motion.div variants={fadeInUp} className="mt-4 md:mt-0">
              <div className="inline-flex items-center gap-2 text-sm text-jade-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jade-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-jade-500" />
                </span>
                实时更新中
              </div>
            </motion.div>
          </div>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gold-300 to-transparent" />

            <div className="space-y-8">
              {appraisalRecords.map((record, index) => {
                const badges = getConclusionBadge(record.conclusion);
                const BadgeIcon = badges.Icon;
                const CatIcon = categoryIcons[record.category] || Puzzle;
                const isLeft = index % 2 === 0;
                return (
                  <motion.div
                    key={record.id}
                    variants={fadeInUp}
                    className="relative"
                  >
                    <div className={`flex items-start gap-4 md:gap-8 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                      <div className="hidden md:block md:w-1/2" />

                      <div className="absolute left-4 md:left-1/2 top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-gold-gradient border-4 border-rice-100 z-10 shadow-md" />

                      <div className="ml-12 md:ml-0 md:w-1/2">
                        <div className="card card-hover p-5 relative">
                          <div className="absolute -top-2 left-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rice-100 border border-gold-200 rounded-full text-xs text-jade-500">
                              <Clock className="w-3 h-3" />
                              {record.timeAgo}
                            </span>
                          </div>
                          <div className="flex items-start gap-4 mt-2">
                            <div className="shrink-0 w-12 h-12 rounded-full bg-ink-gradient border-2 border-gold-300 overflow-hidden">
                              <img
                                src={record.userAvatar}
                                alt="user"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-jade-700">{record.userNickname}</span>
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-jade-50 rounded text-xs">
                                  <CatIcon className="w-3 h-3 text-jade-500" />
                                  <span className="text-jade-500">{categoryLabels[record.category]}</span>
                                </div>
                              </div>
                              <p className="text-sm text-jade-500 mt-1 line-clamp-1">{record.artworkName}</p>
                              <div className="flex items-center gap-3 mt-3 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-white text-xs font-medium ${badges.className}`}>
                                  <BadgeIcon className="w-3 h-3" />
                                  {badges.label}
                                </span>
                                <span className="text-xs text-jade-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  历时 {record.timeSpent}
                                </span>
                                <span className="text-xs text-jade-600 font-medium">
                                  {record.expertName} 专家
                                </span>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gold-200/60">
                                <button
                                  onClick={() => navigate(`/certificate/${encodeURIComponent(record.certificateNo)}`)}
                                  className="inline-flex items-center gap-1.5 text-xs text-gold-600 hover:text-gold-700 hover:underline underline-offset-2 font-medium transition-colors"
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                  查看证书：{record.certificateNo}
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="container py-24"
      >
        <motion.div variants={fadeInUp}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3">
              <div className="card p-8 relative overflow-hidden">
                <h3 className="font-serif text-2xl font-bold text-jade-700 mb-2">证书快速查询</h3>
                <p className="text-jade-500 mb-8">输入证书编号，立即验证您的鉴定证书真伪</p>

                <div className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jade-400" />
                    <input
                      type="text"
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCertSearch()}
                      placeholder="请输入证书编号，如：JD-2024-XXXXXX"
                      className="input-field pl-12 pr-4"
                    />
                  </div>
                  <button
                    onClick={handleCertSearch}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink-gradient text-gold-200 rounded-md font-medium hover:shadow-gold-glow transition-all duration-300 whitespace-nowrap"
                  >
                    立即查询
                    <Search className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <p className="text-sm text-jade-500 mb-3">示例证书编号（点击可填充）：</p>
                  <div className="flex flex-wrap gap-2">
                    {sampleCertNos.map((no) => (
                      <button
                        key={no}
                        onClick={() => setCertInput(no)}
                        className="px-3 py-1.5 bg-rice-100 border border-gold-200 rounded-md text-sm text-jade-600 hover:border-gold-400 hover:bg-gold-50 transition-all duration-300 font-mono"
                      >
                        {no}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <motion.div variants={fadeInUp} className="lg:col-span-2">
              <div
                className="relative h-64 md:h-80 rounded-2xl overflow-hidden border border-gold-300 shadow-gold-glow/30"
                style={{
                  background: 'linear-gradient(135deg, #F8F4E9 0%, #E8DFCA 100%)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                  <div className="absolute" style={{ transform: 'rotate(-25deg)' }}>
                    <div className="flex flex-col gap-16 -space-y-8 opacity-15">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex gap-16 whitespace-nowrap">
                          <span className="font-serif text-4xl md:text-5xl font-black text-gold-600 tracking-widest">
                            鉴真阁
                          </span>
                          <span className="font-serif text-4xl md:text-5xl font-black text-gold-600 tracking-widest">
                            鉴真阁
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-ink-gradient flex items-center justify-center shadow-lg">
                      <Shield className="w-10 h-10 text-gold-400" />
                    </div>
                    <h4 className="font-serif text-xl font-bold text-jade-700 mb-1">防伪验证</h4>
                    <p className="text-sm text-jade-500">区块链存证 · 永久溯源</p>
                    <div className="mt-4 inline-flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-rice-50 bg-jade-500 flex items-center justify-center text-xs text-white font-bold">
                            权
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-jade-500 ml-2">权威认证</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="bg-jade-50/50 py-24 border-y border-gold-200/50"
      >
        <div className="container">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="section-title">12类藏品分类</h2>
            <p className="section-subtitle">覆盖全品类，专家坐阵</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {allCategories.map((category) => {
              const Icon = categoryIcons[category];
              const tags = categoryHotTags[category] || [];
              return (
                <motion.div
                  key={category}
                  variants={fadeInUp}
                  whileHover={{ y: -6 }}
                  onClick={() => handleCategoryClick(category)}
                  className="group relative card card-hover cursor-pointer p-5 overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      boxShadow: 'inset 0 0 0 2px rgba(201, 169, 97, 0.4)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-50 to-gold-100 flex items-center justify-center border border-gold-200 group-hover:bg-gold-gradient group-hover:border-transparent transition-all duration-300">
                        <Icon className="w-7 h-7 text-gold-600 group-hover:text-jade-900 transition-colors duration-300" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-jade-500 group-hover:text-gold-600 transition-colors">
                          <Users className="w-3.5 h-3.5 inline mr-1" />
                          {expertCountByCategory[category] || 5}位专家
                        </span>
                      </div>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-jade-700 group-hover:text-gold-600 transition-colors mb-2">
                      {categoryLabels[category]}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-0.5 bg-rice-200 text-jade-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gold-200/50 flex items-center justify-between text-xs">
                      <span className="text-jade-400">立即鉴定</span>
                      <ArrowRight className="w-4 h-4 text-jade-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="container py-24"
      >
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="section-title">专家团队</h2>
          <p className="section-subtitle">国家级鉴定名家，为您掌眼把关</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockExperts.slice(0, 6).map((expert, index) => (
            <motion.div
              key={expert.id}
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              className="card card-hover p-6"
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full bg-ink-gradient border-2 border-gold-400 flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://picsum.photos/seed/expert${index + 1}/100/100`}
                      alt={expert.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 text-xs text-white rounded ${levelColors[expert.level]}`}
                  >
                    {levelLabels[expert.level]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg font-semibold text-jade-700 mb-1">
                    {expert.name}
                  </h3>
                  <p className="text-sm text-jade-500 mb-3 truncate">
                    {expert.categories.map((c) => categoryLabels[c] || c).join(' · ')}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                      <span className="text-jade-700 font-medium">{expert.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-jade-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{expert.responseTime}分钟响应</span>
                    </div>
                    <div className="flex items-center gap-1 text-jade-500">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{expert.orderCount}单</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="container py-24"
      >
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2 className="section-title">知识库精选</h2>
          <p className="section-subtitle">名家经验分享，收藏知识宝库</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockKnowledgeArticles.slice(0, 4).map((article, index) => (
            <motion.article
              key={article.id}
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              className="card card-hover group cursor-pointer"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/knowledge${index + 1}/400/300`}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="seal-tag">{categoryLabels[article.category]}</span>
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-jade-700/80 text-gold-200 text-xs rounded">
                  {article.era}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-base font-semibold text-jade-700 mb-2 line-clamp-2 group-hover:text-gold-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-jade-500 line-clamp-2 mb-3">
                  {article.content.split('\n')[0]}
                </p>
                <div className="flex items-center justify-between text-xs text-jade-400">
                  <span>{article.author}</span>
                  <span className="flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    阅读全文
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="bg-jade-50/50 py-24 border-y border-gold-200/50"
      >
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <motion.div variants={fadeInUp} className="mb-8">
                <h2 className="section-title">社区热榜</h2>
                <p className="section-subtitle">藏友热议，专家解答</p>
              </motion.div>

              <div className="space-y-4">
                {mockCommunityQuestions.slice(0, 5).map((question, index) => (
                  <motion.div
                    key={question.id}
                    variants={fadeInUp}
                    whileHover={{ x: 4 }}
                    className="card card-hover p-4 cursor-pointer flex items-start gap-4"
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded font-bold text-sm flex items-center justify-center ${
                        index < 3
                          ? 'bg-gold-gradient text-jade-900'
                          : 'bg-rice-200 text-jade-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-jade-700 mb-1 line-clamp-1">
                        {question.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-jade-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {question.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {question.answers.length}回答
                        </span>
                        <span className="seal-tag">{categoryLabels[question.category]}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div variants={fadeInUp} className="flex items-center">
              <div className="relative w-full">
                <div className="absolute -inset-4 bg-gold-gradient/10 rounded-2xl blur-2xl" />
                <div className="relative card p-8">
                  <h3 className="font-serif text-xl font-semibold text-jade-700 mb-6 text-center">
                    平台数据
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {stats.map((stat, index) => (
                      <div
                        key={index}
                        className="text-center p-4 rounded-lg bg-jade-50/50 border border-gold-200/50"
                      >
                        <stat.icon className="w-8 h-8 text-gold-500 mx-auto mb-3" />
                        <div className="font-serif text-2xl md:text-3xl font-bold bg-gradient-to-r from-jade-700 to-gold-600 bg-clip-text text-transparent mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-jade-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-gold-200/50 text-center">
                    <p className="text-sm text-jade-500 mb-4">
                      已有 <span className="text-gold-600 font-semibold">50,000+</span> 藏家选择鉴真阁
                    </p>
                    <Link
                      to="/appraise"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink-gradient text-gold-200 rounded-md font-medium hover:shadow-gold-glow transition-all duration-300"
                    >
                      开始您的鉴定之旅
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
