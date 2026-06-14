import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Image as ImageIcon,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  Palette,
  Layers,
  Check,
  Download,
  Box,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { cn } from '@/lib/utils';

const styleOptions = [
  { key: 'all', label: '全部' },
  { key: 'nordic', label: '北欧' },
  { key: 'modern', label: '现代简约' },
  { key: 'chinese', label: '中式' },
  { key: 'american', label: '美式' },
  { key: 'japanese', label: '日式' },
  { key: 'luxury', label: '轻奢' },
  { key: 'industrial', label: '工业风' },
  { key: 'wabisabi', label: '侘寂风' },
];

const roomOptions = [
  { key: 'all', label: '全部空间' },
  { key: 'livingroom', label: '客厅' },
  { key: 'bedroom', label: '卧室' },
  { key: 'kitchen', label: '厨房' },
  { key: 'bathroom', label: '卫生间' },
  { key: 'balcony', label: '阳台' },
  { key: 'study', label: '书房' },
  { key: 'dining', label: '餐厅' },
];

const colorSchemeOptions = [
  { key: 'all', label: '全部色彩' },
  { key: 'warm', label: '暖色系', colors: ['#C4623A', '#8B6914', '#D47042'] },
  { key: 'cool', label: '冷色系', colors: ['#6B8E9F', '#54707F', '#7A9CA9'] },
  { key: 'neutral', label: '中性色', colors: ['#FAF8F5', '#E8E4DD', '#D6D0C5'] },
  { key: 'morandi', label: '莫兰迪色', colors: ['#A84E2C', '#6B5010', '#415763'] },
];

const sortOptions = [
  { key: 'newest', label: '最新发布' },
  { key: 'hottest', label: '最热门' },
  { key: 'mostCollected', label: '收藏最多' },
];

const stylePrompts: Record<string, string> = {
  modern: 'Minimalist modern interior design with wood furniture and soft natural lighting, warm neutral tones',
  nordic: 'Scandinavian nordic interior design bright cozy living room white walls wooden floor plants',
  chinese: 'New Chinese style interior design elegant oriental furniture ink painting warm wood tones',
  american: 'American classic style interior design dark wood furniture traditional cozy warm atmosphere',
  luxury: 'Luxury modern interior design marble accents golden details velvet sofa elegant chandelier',
  industrial: 'Industrial style interior design exposed brick metal pipes concrete floor vintage loft',
  japanese: 'Japanese zen interior design tatami mats shoji screens natural wood minimalist tranquil',
  wabisabi: 'Wabi-sabi interior design natural materials imperfect beauty earthy tones cozy atmosphere',
  mediterranean: 'Mediterranean interior design whitewashed walls blue accents terracotta tiles natural light',
};

const roomPrompts: Record<string, string> = {
  livingroom: 'living room with comfortable sofa coffee table tv unit',
  bedroom: 'bedroom with cozy bed nightstands wardrobe soft bedding',
  kitchen: 'kitchen with cabinets countertop island stainless steel appliances',
  bathroom: 'bathroom with bathtub vanity mirror tiles modern fixtures',
  balcony: 'balcony with potted plants outdoor seating small table greenery',
};

const designers = [
  '林启明', '苏雨萱', '陈嘉豪', '王晓雯', '张子墨',
  '刘思辰', '周雅婷', '吴俊杰', '郑海峰', '黄晓彤',
];

const colorPalettes = [
  ['#8B6914', '#CBA356', '#C4623A', '#F5ECDA', '#FAF8F5'],
  ['#54707F', '#7A9CA9', '#D47042', '#E8E4DD', '#FAF8F5'],
  ['#A84E2C', '#DE8F69', '#8B6914', '#FAF8F5', '#F5ECDA'],
  ['#6B5010', '#DBBF85', '#54707F', '#F5F2ED', '#FAF8F5'],
  ['#415763', '#9CB8C2', '#C4623A', '#FBF6EC', '#FAF8F5'],
  ['#823B21', '#EAB89E', '#8B6914', '#FAF8F5', '#F5ECDA'],
];

const colorNames = ['主色', '辅色', '点缀色', '中性色', '背景色'];

const designTitles = [
  '暖阳下的现代居所', '北欧简约诗意空间', '东方雅致新中式',
  '都市轻奢主义', '工业风LOFT个性空间', '日式禅意小筑',
  '地中海阳光假期', '原木质感自然家', '极简白调美学',
  '复古与现代的碰撞', '自然系森系小屋', '艺术收藏家的客厅',
];

function generateImageUrl(style: string, room: string, seed: number): string {
  const stylePrompt = stylePrompts[style] || stylePrompts.modern;
  const roomPrompt = room === 'all' ? 'living room' : roomPrompts[room];
  const prompt = `${stylePrompt}, ${roomPrompt}, photorealistic interior design photography, professional lighting, high detail`;
  return `/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=portrait_4_3&seed=${seed}`;
}

interface InspirationItem {
  id: string;
  title: string;
  designer: string;
  style: string;
  room: string;
  imageUrl: string;
  colors: string[];
  likes: number;
  views: number;
  height: number;
}

function generateBatch(start: number, count: number, selectedStyle: string, selectedRoom: string): InspirationItem[] {
  const items: InspirationItem[] = [];
  const styles = selectedStyle === 'all' ? styleOptions.slice(1).map(s => s.key) : [selectedStyle];
  const rooms = selectedRoom === 'all' ? roomOptions.slice(1).map(r => r.key) : [selectedRoom];

  for (let i = 0; i < count; i++) {
    const idx = start + i;
    const style = styles[idx % styles.length];
    const room = rooms[idx % rooms.length];
    items.push({
      id: `insp-${idx}`,
      title: designTitles[idx % designTitles.length],
      designer: designers[idx % designers.length],
      style,
      room,
      imageUrl: generateImageUrl(style, room, idx + 100),
      colors: colorPalettes[idx % colorPalettes.length],
      likes: Math.floor(Math.random() * 5000) + 200,
      views: Math.floor(Math.random() * 50000) + 5000,
      height: 240 + (idx % 4) * 60,
    });
  }
  return items;
}

export default function InspirationLibrary() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedColorScheme, setSelectedColorScheme] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredColor, setHoveredColor] = useState<{ id: string; color: string } | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(generateBatch(0, 16, selectedStyle, selectedRoom));
    setPage(1);
  }, [selectedStyle, selectedRoom, selectedColorScheme, sortBy]);

  const loadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const newItems = generateBatch(page * 16, 16, selectedStyle, selectedRoom);
      setItems(prev => [...prev, ...newItems]);
      setPage(p => p + 1);
      setLoading(false);
    }, 600);
  }, [page, loading, selectedStyle, selectedRoom]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        messageApi.info('已取消收藏');
      } else {
        next.add(id);
        messageApi.success('已收藏到我的灵感库');
      }
      return next;
    });
  };

  const copyColor = (color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    messageApi.success(`色值 ${color} 已复制到剪贴板`);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const goToMaterialLibrary = (style: string, colors: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    messageApi.loading({ content: '正在跳转材质库...', key: 'material' });
    setTimeout(() => {
      messageApi.destroy('material');
      navigate('/owner/materials', { state: { style, colors } });
    }, 300);
  };

  const viewColorScheme = (id: string, colors: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    const colorText = colors.map((c, i) => `${colorNames[i]}: ${c}`).join('\n');
    navigator.clipboard.writeText(colorText);
    messageApi.success(`已复制「${designTitles[parseInt(id.split('-')[1]) % designTitles.length]}」的色彩方案到剪贴板`);
    navigate(`/owner/inspiration/${id}`);
  };

  const goTo3DGenerator = (item: InspirationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    messageApi.loading({ content: '正在跳转到3D方案生成器...', key: '3d', duration: 0 });
    setTimeout(() => {
      messageApi.destroy('3d');
      navigate('/owner/3d-generator', { state: { style: item.style, colors: item.colors, title: item.title } });
    }, 300);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchSubmitted(true);
      messageApi.info(`正在搜索 "${searchQuery}" 相关灵感...`);
    }
  };

  const filteredItems = searchSubmitted && searchQuery.trim()
    ? items.filter(item =>
        item.title.includes(searchQuery) ||
        item.designer.includes(searchQuery) ||
        styleOptions.find(s => s.key === item.style && s.label.includes(searchQuery))?.key ||
        roomOptions.find(r => r.key === item.room && r.label.includes(searchQuery))?.key
      )
    : items;

  return (
    <div className="min-h-screen bg-ivory-50">
      {contextHolder}
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="section-title">风格灵感库</h1>
          <p className="section-subtitle">探索上万套真实室内设计案例，找到属于你的风格</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/owner/inspiration/search')}
            className="group p-6 rounded-2xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white hover:from-terracotta-600 hover:to-terracotta-700 transition-all duration-300 hover:shadow-lg hover:shadow-terracotta-500/30 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold mb-0.5">以图搜图</h3>
                <p className="text-sm text-white/80">上传图片，AI智能匹配相似风格</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              messageApi.loading({ content: '正在跳转到AI色彩提取...', key: 'color-extract', duration: 0 });
              setTimeout(() => {
                messageApi.destroy('color-extract');
                navigate('/owner/inspiration/search');
              }, 300);
            }}
            className="group p-6 rounded-2xl bg-gradient-to-br from-haze-500 to-haze-600 text-white hover:from-haze-600 hover:to-haze-700 transition-all duration-300 hover:shadow-lg hover:shadow-haze-500/30 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Palette className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold mb-0.5">AI色彩方案提取</h3>
                <p className="text-sm text-white/80">AI智能提取，一键获取专业配色</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/owner/materials')}
            className="group p-6 rounded-2xl bg-gradient-to-br from-wood-500 to-wood-600 text-white hover:from-wood-600 hover:to-wood-700 transition-all duration-300 hover:shadow-lg hover:shadow-wood-500/30 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold mb-0.5">材质库</h3>
                <p className="text-sm text-white/80">精选主材软装，支持对比选品</p>
              </div>
            </div>
          </button>
        </div>

        <div className="sticky top-0 z-30 bg-ivory-50/95 backdrop-blur-md border-b border-ivory-200 -mx-4 px-4 py-4 mb-6">
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSearch} className="flex items-center gap-4">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-500" />
                <input
                  type="text"
                  placeholder="搜索风格、空间、色彩、设计师关键词..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-base pl-10 pr-24"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-terracotta-500 text-white text-sm rounded-btn hover:bg-terracotta-600 transition-colors"
                >
                  搜索
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate('/owner/inspiration/search')}
                className="px-6 py-2.5 bg-gradient-to-r from-terracotta-500 via-terracotta-600 to-amber-500 text-white rounded-btn hover:from-terracotta-600 hover:via-terracotta-700 hover:to-amber-600 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-terracotta-500/30 hover:shadow-xl hover:shadow-terracotta-500/40 font-bold animate-pulse hover:animate-none"
              >
                <ImageIcon className="w-5 h-5" />
                以图搜图
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="btn-secondary"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {sortOptions.find(o => o.key === sortBy)?.label}
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showSortDropdown && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {showSortDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-white rounded-card border border-ivory-200 shadow-card-hover py-2 z-50"
                    >
                      {sortOptions.map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.key);
                            setShowSortDropdown(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-ivory-100 transition-colors flex items-center gap-2',
                            sortBy === opt.key && 'text-terracotta-600 font-medium bg-terracotta-50'
                          )}
                        >
                          {sortBy === opt.key && <Check className="w-3.5 h-3.5" />}
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ivory-500 mr-1 font-medium">风格：</span>
              {styleOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSelectedStyle(opt.key);
                    messageApi.success(`已筛选：${opt.label}风格`);
                  }}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105',
                    selectedStyle === opt.key
                      ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/30 scale-105'
                      : 'bg-white text-carbon-600 border border-ivory-300 hover:border-terracotta-400 hover:text-terracotta-700 hover:bg-terracotta-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ivory-500 mr-1 font-medium">色彩：</span>
              {colorSchemeOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSelectedColorScheme(opt.key);
                    messageApi.success(`已筛选：${opt.label}`);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 transform hover:scale-105',
                    selectedColorScheme === opt.key
                      ? 'bg-haze-500 text-white shadow-md shadow-haze-500/30 scale-105'
                      : 'bg-haze-50 text-haze-700 border border-haze-200 hover:border-haze-400 hover:bg-haze-100'
                  )}
                >
                  {opt.colors && (
                    <span className="flex -space-x-1">
                      {opt.colors.map((c, i) => (
                        <span key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                  )}
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ivory-500 mr-1 font-medium">空间：</span>
              {roomOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSelectedRoom(opt.key);
                    messageApi.success(`已筛选：${opt.label}`);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 transform hover:scale-105',
                    selectedRoom === opt.key
                      ? 'bg-wood-500 text-white shadow-md shadow-wood-500/30 scale-105'
                      : 'bg-wood-50 text-wood-700 border border-wood-200 hover:border-wood-400 hover:bg-wood-100'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="columns-4 gap-5 [column-fill:_balance]">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx % 16) * 0.04, duration: 0.5 }}
              className="break-inside-avoid mb-5"
            >
              <div
                className="card-hoverable overflow-hidden group cursor-pointer"
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="relative overflow-hidden cursor-pointer"
                  style={{ paddingBottom: `${(item.height / 320) * 100}%` }}
                  onClick={() => navigate(`/owner/inspiration/${item.id}`)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/80 via-carbon-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-carbon-700">
                        {styleOptions.find(s => s.key === item.style)?.label || '现代'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-carbon-700">
                        {roomOptions.find(r => r.key === item.room)?.label || '客厅'}
                      </span>
                    </div>
                    <button
                      onClick={e => toggleLike(item.id, e)}
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
                        likedItems.has(item.id)
                          ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/40 scale-110'
                          : 'bg-white/90 text-carbon-600 hover:bg-white hover:scale-110'
                      )}
                    >
                      <Heart className={cn('w-4 h-4', likedItems.has(item.id) && 'fill-current')} />
                    </button>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <h3 className="text-white font-serif text-lg font-semibold mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-white/80 text-sm mb-3">by {item.designer}</p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={e => viewColorScheme(item.id, item.colors, e)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 bg-haze-500/90 backdrop-blur-sm text-white hover:bg-haze-600 transition-all"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        色彩方案
                      </button>
                      <button
                        onClick={e => goToMaterialLibrary(item.style, item.colors, e)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 bg-wood-500/90 backdrop-blur-sm text-white hover:bg-wood-600 transition-all"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        同款材质
                      </button>
                      <button
                        onClick={e => goTo3DGenerator(item, e)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 bg-terracotta-500/90 backdrop-blur-sm text-white hover:bg-terracotta-600 transition-all"
                      >
                        <Box className="w-3.5 h-3.5" />
                        生成3D
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-ivory-200">
                  <div className="flex gap-1.5 mb-3">
                    {item.colors.map((color, ci) => (
                      <div
                        key={ci}
                        className="relative flex-1 h-8 rounded cursor-pointer group/color overflow-hidden"
                        style={{ backgroundColor: color }}
                        onClick={e => {
                          e.stopPropagation();
                          copyColor(color, e);
                        }}
                        onMouseEnter={() => setHoveredColor({ id: `${item.id}-${ci}`, color })}
                        onMouseLeave={() => setHoveredColor(null)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/color:opacity-100 transition-opacity bg-carbon-900/20">
                          {copiedColor === color ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Palette className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <AnimatePresence>
                          {hoveredColor?.id === `${item.id}-${ci}` && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 4 }}
                              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-carbon-800 text-white text-xs rounded font-mono whitespace-nowrap z-10"
                            >
                              {colorNames[ci]} {color}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-carbon-800" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <button
                      onClick={e => toggleLike(item.id, e)}
                      className={cn(
                        'py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all',
                        likedItems.has(item.id)
                          ? 'bg-terracotta-50 text-terracotta-600 border border-terracotta-200'
                          : 'bg-ivory-50 text-ivory-600 border border-ivory-200 hover:bg-terracotta-50 hover:text-terracotta-600 hover:border-terracotta-200'
                      )}
                    >
                      <Heart className={cn('w-3.5 h-3.5', likedItems.has(item.id) && 'fill-current')} />
                      收藏
                    </button>
                    <button
                      onClick={() => navigate(`/owner/inspiration/${item.id}`)}
                      className="py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 bg-haze-50 text-haze-600 border border-haze-200 hover:bg-haze-100 hover:border-haze-300 transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      详情
                    </button>
                    <button
                      onClick={e => viewColorScheme(item.id, item.colors, e)}
                      className="py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 bg-wood-50 text-wood-600 border border-wood-200 hover:bg-wood-100 hover:border-wood-300 transition-all"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      取色
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={e => goToMaterialLibrary(item.style, item.colors, e)}
                      className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-gradient-to-r from-wood-50 to-ivory-50 text-wood-700 border border-wood-200 hover:from-wood-100 hover:to-wood-50 hover:border-wood-300 transition-all"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      查找同款材质
                    </button>
                    <button
                      onClick={e => goTo3DGenerator(item, e)}
                      className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 bg-gradient-to-r from-terracotta-50 to-amber-50 text-terracotta-700 border border-terracotta-200 hover:from-terracotta-100 hover:to-amber-100 hover:border-terracotta-300 transition-all"
                    >
                      <Box className="w-3.5 h-3.5" />
                      生成3D方案
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div ref={loaderRef} className="py-12 flex justify-center">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-ivory-600"
            >
              <div className="w-5 h-5 border-2 border-terracotta-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">加载更多灵感...</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
