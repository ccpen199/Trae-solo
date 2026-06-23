import { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Palette,
  Grid3X3,
  ChevronDown,
  Layers,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import SectionTitle from '@/components/common/SectionTitle';
import TemplateCard from '@/components/product/TemplateCard';
import { templates } from '@/mock/data/templates';
import { products } from '@/mock/data/products';
import { photos } from '@/mock/data/photos';
import { cn } from '@/lib/utils';

const sceneTags = [
  { id: 'all', name: '全部', icon: '📷' },
  { id: 'birthday', name: '生日', icon: '🎂' },
  { id: 'wedding', name: '婚礼', icon: '💒' },
  { id: 'graduation', name: '毕业', icon: '🎓' },
  { id: 'travel', name: '旅行', icon: '✈️' },
  { id: 'baby', name: '宝宝', icon: '👶' },
  { id: 'family', name: '全家福', icon: '👨‍👩‍👧' },
  { id: 'business', name: '商务', icon: '💼' },
  { id: 'festival', name: '节日', icon: '🎉' },
];

const styleCategories = [
  { id: 'all', name: '全部风格' },
  { id: 'minimal', name: '简约' },
  { id: 'vintage', name: '复古' },
  { id: 'cute', name: '可爱' },
  { id: 'business', name: '商务' },
];

const ITEMS_PER_PAGE = 12;

export default function TemplatesPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedScene, setSelectedScene] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const searchParams = new URLSearchParams(location.search);
  const photoId = searchParams.get('photoId');
  const selectedPhoto = photoId ? photos.find((p) => p.id === photoId) : null;

  const product = products.find((p) => p.id === productId);
  const showAllTemplates = !productId || productId === 'all' || !product;

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const productMatch = showAllTemplates || template.productId === productId;

      const styleMatch =
        selectedStyle === 'all' || template.category === selectedStyle;

      const sceneMatch =
        selectedScene === 'all' ||
        template.sceneTags.some((tag) =>
          tag.includes(
            sceneTags.find((s) => s.id === selectedScene)?.name || ''
          )
        );

      return productMatch && styleMatch && sceneMatch;
    });
  }, [selectedScene, selectedStyle, productId, showAllTemplates]);

  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTemplateClick = (templateId: string) => {
    navigate(`/editor/${templateId}${photoId ? `?photoId=${photoId}` : ''}`);
  };

  const handleStartCreate = (templateId: string) => {
    navigate(`/editor/${templateId}${photoId ? `?photoId=${photoId}` : ''}`);
  };

  const handleSceneChange = (sceneId: string) => {
    setSelectedScene(sceneId);
    setCurrentPage(1);
  };

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    setCurrentPage(1);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const pageTitle = showAllTemplates ? '模板中心' : `${product?.name}模板`;
  const pageSubtitle = showAllTemplates
    ? '海量优质模板，一键套用，轻松制作专业作品'
    : product?.description || '';

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Info Card */}
        {!showAllTemplates && product && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="rounded-2xl bg-gradient-brand p-6 md:p-8 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur-sm">
                    {product.icon}
                  </div>
                  <div>
                    <h1 className="font-display text-2xl font-bold md:text-3xl">
                      {product.name}模板
                    </h1>
                    <p className="mt-1 text-white/80">
                      {product.description}
                    </p>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1.5 text-2xl font-bold">
                      <Layers className="h-6 w-6" />
                      <span>{filteredTemplates.length}</span>
                    </div>
                    <p className="text-sm text-white/70">模板数量</p>
                  </div>
                  <div className="hidden h-10 w-px bg-white/20 md:block" />
                  <div className="hidden md:block">
                    <p className="mb-2 text-sm text-white/70">可编辑能力</p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.editableFeatures.slice(0, 4).map((feature) => (
                        <Badge
                          key={feature}
                          variant="secondary"
                          className="bg-white/20 text-white hover:bg-white/30"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <div className="rounded-xl bg-white p-4 shadow-soft">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={selectedPhoto.thumbnailUrl}
                    alt="已上传照片"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-1 top-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    AI
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-500" />
                    <span className="font-medium text-paper-900">已上传照片</span>
                  </div>
                  <p className="text-sm text-paper-500 mt-1">
                    选择模板后，照片将自动添加到编辑器中
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        {showAllTemplates && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <SectionTitle
              title={pageTitle}
              subtitle={pageSubtitle}
            />
          </motion.div>
        )}

        {/* Scene Tags Filter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="rounded-xl bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-brand-500" />
              <span className="font-medium text-paper-700">场景筛选</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sceneTags.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => handleSceneChange(scene.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                    selectedScene === scene.id
                      ? 'bg-gradient-brand text-white shadow-soft'
                      : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
                  )}
                >
                  <span>{scene.icon}</span>
                  <span>{scene.name}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Style Filter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="rounded-xl bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-brand-500" />
              <span className="font-medium text-paper-700">风格筛选</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {styleCategories.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    selectedStyle === style.id
                      ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-500'
                      : 'bg-paper-50 text-paper-600 hover:bg-paper-100'
                  )}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-4 flex items-center justify-between"
        >
          <p className="text-sm text-paper-600">
            共找到 <span className="font-semibold text-brand-600">{filteredTemplates.length}</span> 个模板
          </p>
          <div className="flex items-center gap-2 text-sm text-paper-500">
            <span>排序</span>
            <button className="flex items-center gap-1 text-paper-600 hover:text-brand-600">
              推荐
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Template Grid */}
        {paginatedTemplates.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            key={`${selectedScene}-${selectedStyle}-${currentPage}`}
            variants={containerVariants}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {paginatedTemplates.map((template) => (
              <motion.div key={template.id} variants={itemVariants}>
                <TemplateCard
                  template={template}
                  onClick={() => handleTemplateClick(template.id)}
                  onStartCreate={() => handleStartCreate(template.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="mb-4 text-6xl">🔍</div>
            <p className="text-lg font-medium text-paper-600">
              暂无符合条件的模板
            </p>
            <p className="mt-2 text-sm text-paper-500">
              试试其他筛选条件吧
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSelectedScene('all');
                setSelectedStyle('all');
              }}
            >
              清除筛选
            </Button>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex justify-center"
          >
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showFirstLast
            />
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-8 md:p-12">
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/3 translate-x-1/3 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/4 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-left">
                <h3 className="font-display text-2xl font-bold text-white md:text-3xl">
                  找不到满意的模板？
                </h3>
                <p className="mt-2 text-white/80">
                  试试 AI 智能设计，输入描述一键生成专属模板
                </p>
              </div>
              <Button
                size="lg"
                className="bg-white text-brand-600 hover:bg-paper-100"
                onClick={() => navigate('/ai-enhance')}
              >
                <Sparkles className="h-5 w-5" />
                AI 智能设计
              </Button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
