import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wand2,
  Palette,
  Camera,
  ArrowRight,
  Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import SectionTitle from '@/components/common/SectionTitle';
import TemplateCard from '@/components/product/TemplateCard';
import WorkCard from '@/components/community/WorkCard';
import { products } from '@/mock/data/products';
import { templates } from '@/mock/data/templates';
import { communityWorks } from '@/mock/data/community';
import { ProductCategory, CommunityWork } from '@/types';
import { cn } from '@/lib/utils';

const heroSlides = [
  {
    id: 1,
    image: 'https://picsum.photos/seed/hero1/1920/1080',
    title: '让每一张照片',
    subtitle: '都成为艺术品',
  },
  {
    id: 2,
    image: 'https://picsum.photos/seed/hero2/1920/1080',
    title: '定格美好瞬间',
    subtitle: '珍藏永恒回忆',
  },
  {
    id: 3,
    image: 'https://picsum.photos/seed/hero3/1920/1080',
    title: 'AI智能处理',
    subtitle: '一键美化你的照片',
  },
];

const aiFeatures = [
  {
    icon: Sparkles,
    title: '画质增强',
    description: 'AI智能降噪、锐化、超分辨率，让模糊照片变清晰',
  },
  {
    icon: Palette,
    title: '肤色校正',
    description: '智能白平衡、磨皮提亮，呈现自然健康的肤色',
  },
  {
    icon: Camera,
    title: '背景虚化',
    description: 'AI主体识别，模拟单反相机的景深效果',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const hotTemplates = templates.slice(0, 8);

  const adaptedWorks: CommunityWork[] = communityWorks;

  const handleTemplateClick = (templateId: string) => {
    navigate(`/editor/${templateId}`);
  };

  const handleStartCreate = (templateId: string) => {
    navigate(`/editor/${templateId}`);
  };

  const handleWorkClick = () => {
    navigate('/community');
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.9,
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-paper-50">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroSlides[currentSlide].image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                {heroSlides[currentSlide].title}
              </span>
              <br />
              {heroSlides[currentSlide].subtitle}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/80 md:text-lg">
              专业照片冲印与定制平台，用AI技术让你的照片焕发新生
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link to="/products">
              <Button size="lg" className="bg-gradient-brand shadow-glow transition-transform hover:scale-105">
                <Wand2 className="h-5 w-5" />
                开始制作
              </Button>
            </Link>
            <Link to="/ai-enhance">
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 transition-transform hover:scale-105">
                了解更多
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Slide Navigation */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30 md:left-8"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30 md:right-8"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1);
                setCurrentSlide(index);
              }}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentSlide
                  ? 'w-8 bg-gradient-brand'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              )}
            />
          ))}
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <SectionTitle
                title="产品分类"
                subtitle="精选12类定制产品，满足你的所有创意需求"
                align="center"
                className="mb-12"
              />
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <Link to={`/products/${product.id}`}>
                    <div className="group flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-medium">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-4xl transition-all duration-300 group-hover:bg-brand-100 group-hover:scale-110">
                        {product.icon}
                      </div>
                      <h3 className="font-display text-base font-semibold text-paper-900">
                        {product.name}
                      </h3>
                      <p className="text-xs text-paper-500">
                        {product.templateCount} 个模板
                      </p>
                      <p className="text-xs font-medium text-brand-600">
                        ¥{product.priceRange.min}-{product.priceRange.max}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hot Templates */}
      <section className="bg-paper-100 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="mb-12 flex items-end justify-between">
              <SectionTitle
                title="热门模板"
                subtitle="精选优质模板，一键套用快速出片"
              />
              <Link
                to="/products"
                className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-all hover:gap-2"
              >
                查看全部
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative"
            >
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {hotTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="w-64 flex-shrink-0 sm:w-72"
                  >
                    <TemplateCard
                      template={template}
                      onClick={() => handleTemplateClick(template.id)}
                      onStartCreate={() => handleStartCreate(template.id)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <SectionTitle
                title="AI 智能处理"
                subtitle="强大的AI算法，让你的照片更出彩"
                align="center"
                className="mb-12"
              />
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="grid gap-8 md:grid-cols-3"
            >
              {aiFeatures.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="group rounded-2xl bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-medium"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow transition-all duration-300 group-hover:scale-110">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 font-display text-xl font-semibold text-paper-900">
                    {feature.title}
                  </h3>
                  <p className="text-paper-500">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-12 text-center"
            >
              <Link to="/ai-enhance">
                <Button size="lg" className="bg-gradient-brand shadow-glow transition-transform hover:scale-105">
                  <Wand2 className="h-5 w-5" />
                  立即体验 AI 处理
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Community Works */}
      <section className="bg-paper-100 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <SectionTitle
                title="用户作品"
                subtitle="来自社区用户的精彩创作"
                align="center"
                className="mb-12"
              />
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="columns-2 gap-6 md:columns-3"
            >
              {adaptedWorks.map((work) => (
                <motion.div
                  key={work.id}
                  variants={itemVariants}
                  className="mb-6 break-inside-avoid"
                >
                  <WorkCard work={work} onClick={handleWorkClick} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Brand Story / CTA */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://picsum.photos/seed/brand-story/1920/800)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/90 to-brand-700/80" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div variants={itemVariants}>
              <h2 className="font-display text-3xl font-bold text-white md:text-5xl">
                用照片记录生活
                <br />
                <span className="bg-gradient-brand bg-clip-text text-transparent">
                  让回忆触手可及
                </span>
              </h2>
            </motion.div>
            <motion.p variants={itemVariants} className="mx-auto mt-6 max-w-xl text-lg text-white/80">
              我们相信每一张照片都有故事，每一个瞬间都值得被珍藏。
              用专业的品质和贴心的服务，帮你把美好回忆变成触手可及的实物。
            </motion.p>
            <motion.div variants={itemVariants} className="mt-10">
              <Link to="/products">
                <Button size="lg" className="bg-white text-brand-600 hover:bg-paper-100 transition-transform hover:scale-105">
                  <Grid3X3 className="h-5 w-5" />
                  开始制作
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
