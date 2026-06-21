import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  mockExperts,
  mockKnowledgeArticles,
  mockCommunityQuestions,
} from '@/lib/mockData';
import { ExpertLevel, Category } from '../../shared/types';

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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
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
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="container py-24"
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
