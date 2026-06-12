import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Box,
  User as UserIcon,
  ExternalLink,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

const colorNames = ['主色', '辅色', '点缀色', '中性色', '背景色'];
const sampleColors = ['#8B6914', '#CBA356', '#C4623A', '#F5ECDA', '#FAF8F5'];

const designers = [
  { id: 1, name: '林启明', title: '高级室内设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer1', projects: 128 },
  { id: 2, name: '苏雨萱', title: '资深软装设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer2', projects: 96 },
];

const materials = [
  { id: 'm1', name: '北欧白橡木地板', brand: '圣象', spec: '1210×195×15mm', price: 288, unit: '㎡',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('close up shot of white oak wood floor texture natural grain pattern, product photography') + '&image_size=square' },
  { id: 'm2', name: '莫兰迪灰墙面漆', brand: '多乐士', spec: '5L装', price: 468, unit: '桶',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('luxury interior paint can with morandi gray color swatch, product photography white background') + '&image_size=square' },
  { id: 'm3', name: '云朵亚麻沙发', brand: '宜家', spec: '三人座 240cm', price: 5999, unit: '件',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('modern minimalist linen sofa cloud design cream white color, product photography studio lighting') + '&image_size=square' },
  { id: 'm4', name: '黄铜极简吊灯', brand: '造作', spec: '直径60cm', price: 1280, unit: '盏',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('minimalist brass pendant lamp chandelier modern design, product photography') + '&image_size=square' },
  { id: 'm5', name: '岩板餐桌台面', brand: '德利丰', spec: '1600×900×12mm', price: 1880, unit: '块',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('sintered stone dining table top texture marble pattern, product photography') + '&image_size=square' },
  { id: 'm6', name: '实木橱柜门板', brand: '欧派', spec: '定制尺寸', price: 680, unit: '㎡',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('solid wood kitchen cabinet door panel natural oak finish, product photography') + '&image_size=square' },
];

const galleryPrompts = [
  'Scandinavian nordic interior design bright cozy living room white walls wooden floor plants, photorealistic, professional photography',
  'Scandinavian interior dining area with wooden table pendant lamp, photorealistic interior design',
  'Nordic style bedroom with linen bedding natural light, photorealistic interior photography',
];

export default function InspirationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(3847);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);

  const galleryImages = galleryPrompts.map((p, i) =>
    `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(p)}&image_size=landscape_16_9&seed=${i + 300}`
  );

  const designer = designers[parseInt(id || '0') % 2];

  const prevImage = () => setCurrentIndex(i => (i - 1 + galleryImages.length) % galleryImages.length);
  const nextImage = () => setCurrentIndex(i => (i + 1) % galleryImages.length);

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const handleShare = () => {
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-8">
        <button
          onClick={() => navigate('/owner/inspiration')}
          className="btn-ghost mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回灵感库
        </button>

        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-3">
            <div className="relative rounded-card overflow-hidden shadow-card-hover group">
              <div
                className="relative bg-ivory-900"
                style={{ height: '80vh', maxHeight: '700px' }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentIndex}
                    src={galleryImages[currentIndex]}
                    alt="inspiration"
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                  />
                </AnimatePresence>

                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-white transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6 text-carbon-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:bg-white transition-all hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6 text-carbon-700" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {galleryImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        i === currentIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 p-3 bg-white border-t border-ivory-200">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      'flex-1 h-20 rounded-lg overflow-hidden transition-all duration-300',
                      i === currentIndex
                        ? 'ring-2 ring-terracotta-500 ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-6">
            <div className="card-base p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="badge-terracotta">北欧风格</span>
                <span className="badge-wood">客厅</span>
                <span className="badge-haze">120㎡</span>
              </div>

              <h1 className="font-serif text-3xl font-bold text-carbon-900 mb-4">
                北欧暖阳 · 自然系三居空间
              </h1>

              <div className="flex items-center gap-4 p-4 bg-wood-50 rounded-xl mb-6">
                <img
                  src={designer.avatar}
                  alt={designer.name}
                  className="w-14 h-14 rounded-full border-2 border-white shadow-md"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-carbon-800">{designer.name}</span>
                    <span className="badge-wood text-[10px]">认证设计师</span>
                  </div>
                  <p className="text-sm text-ivory-600">{designer.title} · {designer.projects}套作品</p>
                </div>
                <button className="btn-secondary text-sm px-3 py-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  关注
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={toggleLike}
                  className={cn(
                    'flex-1 btn-secondary',
                    liked && 'bg-terracotta-50 text-terracotta-700 border-terracotta-300'
                  )}
                >
                  <Heart className={cn('w-4 h-4', liked && 'fill-current text-terracotta-500')} />
                  {liked ? '已收藏' : '收藏'}
                  <span className="text-xs text-ivory-500 ml-1">({likeCount.toLocaleString()})</span>
                </button>
                <button onClick={handleShare} className="btn-secondary flex-1">
                  <Share2 className="w-4 h-4" />
                  分享
                </button>
              </div>
            </div>

            <div className="card-base p-6">
              <h3 className="font-serif text-lg font-semibold text-carbon-800 mb-4">色彩方案</h3>
              <div className="flex gap-3 mb-4">
                {sampleColors.map((color, i) => (
                  <motion.div
                    key={color}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex-1 text-center"
                  >
                    <button
                      onClick={() => copyColor(color)}
                      className="group relative w-full aspect-square rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden"
                      style={{ backgroundColor: color }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-carbon-900/20">
                        {copiedColor === color ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <Copy className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </button>
                    <p className="mt-2 text-xs text-ivory-500">{colorNames[i]}</p>
                    <p className="text-sm font-mono text-carbon-700">{color}</p>
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-ivory-500 text-center">点击色卡复制 HEX 色值</p>
            </div>

            <div className="card-base p-6">
              <h3 className="font-serif text-lg font-semibold text-carbon-800 mb-4">关联材质</h3>
              <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin pr-2">
                {materials.map((mat) => (
                  <motion.div
                    key={mat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 4 }}
                    className="flex gap-3 p-3 rounded-xl border border-ivory-200 hover:border-wood-300 hover:bg-wood-50/50 transition-all cursor-pointer"
                    onClick={() => navigate('/owner/materials')}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-ivory-100">
                      <img src={mat.image} alt={mat.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-carbon-800 text-sm truncate">{mat.name}</h4>
                        <ExternalLink className="w-3.5 h-3.5 text-ivory-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-ivory-500 mt-0.5">
                        <span className="text-wood-600 font-medium">{mat.brand}</span> · {mat.spec}
                      </p>
                      <p className="text-terracotta-600 font-semibold text-sm mt-1">
                        ¥{mat.price}<span className="text-xs text-ivory-400 font-normal">/{mat.unit}</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/owner/3d-generator', { state: { style: 'nordic', colors: sampleColors } })}
              className="btn-cta w-full"
            >
              <Box className="w-5 h-5" />
              应用到我的3D方案
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-carbon-800 text-white rounded-full shadow-xl z-50 flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            分享链接已复制到剪贴板
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
