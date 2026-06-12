import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Image as ImageIcon,
  Heart,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const styleOptions = [
  { key: 'all', label: '全部' },
  { key: 'modern', label: '现代' },
  { key: 'nordic', label: '北欧' },
  { key: 'chinese', label: '新中式' },
  { key: 'luxury', label: '轻奢' },
  { key: 'industrial', label: '工业风' },
  { key: 'japanese', label: '日式' },
  { key: 'mediterranean', label: '地中海' },
];

const roomOptions = [
  { key: 'all', label: '全部' },
  { key: 'livingroom', label: '客厅' },
  { key: 'bedroom', label: '卧室' },
  { key: 'kitchen', label: '厨房' },
  { key: 'bathroom', label: '卫生间' },
  { key: 'balcony', label: '阳台' },
];

const sortOptions = [
  { key: 'newest', label: '最新' },
  { key: 'hottest', label: '最热' },
  { key: 'mostCollected', label: '收藏最多' },
];

const stylePrompts: Record<string, string> = {
  modern: 'Minimalist modern interior design with wood furniture and soft natural lighting, warm neutral tones',
  nordic: 'Scandinavian nordic interior design bright cozy living room white walls wooden floor plants',
  chinese: 'New Chinese style interior design elegant oriental furniture ink painting warm wood tones',
  luxury: 'Luxury modern interior design marble accents golden details velvet sofa elegant chandelier',
  industrial: 'Industrial style interior design exposed brick metal pipes concrete floor vintage loft',
  japanese: 'Japanese zen interior design tatami mats shoji screens natural wood minimalist tranquil',
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
  ['#8B6914', '#CBA356', '#C4623A', '#F5ECDA'],
  ['#54707F', '#7A9CA9', '#D47042', '#E8E4DD'],
  ['#A84E2C', '#DE8F69', '#8B6914', '#FAF8F5'],
  ['#6B5010', '#DBBF85', '#54707F', '#F5F2ED'],
  ['#415763', '#9CB8C2', '#C4623A', '#FBF6EC'],
  ['#823B21', '#EAB89E', '#8B6914', '#FAF8F5'],
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<{ id: string; color: string } | null>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(generateBatch(0, 16, selectedStyle, selectedRoom));
    setPage(1);
  }, [selectedStyle, selectedRoom, sortBy]);

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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="section-title">风格灵感库</h1>
          <p className="section-subtitle">探索上万套真实室内设计案例，找到属于你的风格</p>
        </div>

        <div className="sticky top-0 z-30 bg-ivory-50/95 backdrop-blur-md border-b border-ivory-200 -mx-4 px-4 py-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-500" />
                <input
                  type="text"
                  placeholder="搜索风格、房间、设计师..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
              <button
                onClick={() => navigate('/owner/inspiration/search')}
                className="btn-secondary"
              >
                <ImageIcon className="w-4 h-4" />
                以图搜图
              </button>
              <div className="relative">
                <button
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
                      className="absolute right-0 top-full mt-2 w-36 bg-white rounded-card border border-ivory-200 shadow-card-hover py-2 z-50"
                    >
                      {sortOptions.map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setSortBy(opt.key);
                            setShowSortDropdown(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-ivory-100 transition-colors',
                            sortBy === opt.key && 'text-terracotta-600 font-medium bg-terracotta-50'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {styleOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedStyle(opt.key)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                    selectedStyle === opt.key
                      ? 'bg-terracotta-500 text-white shadow-sm shadow-terracotta-500/30'
                      : 'bg-white text-carbon-600 border border-ivory-300 hover:border-wood-400 hover:text-wood-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {roomOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedRoom(opt.key)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
                    selectedRoom === opt.key
                      ? 'bg-wood-500 text-white shadow-sm shadow-wood-500/30'
                      : 'bg-wood-50 text-wood-700 border border-wood-200 hover:border-wood-400'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="columns-4 gap-5 [column-fill:_balance]">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx % 16) * 0.04, duration: 0.5 }}
              className="break-inside-avoid mb-5"
              onClick={() => navigate(`/owner/inspiration/${item.id}`)}
            >
              <div className="card-hoverable overflow-hidden group cursor-pointer">
                <div className="relative overflow-hidden" style={{ paddingBottom: `${(item.height / 320) * 100}%` }}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/70 via-carbon-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0">
                    <h3 className="text-white font-serif text-lg font-semibold mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-white/80 text-sm">by {item.designer}</p>
                  </div>
                  <button
                    onClick={e => toggleLike(item.id, e)}
                    className={cn(
                      'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
                      likedItems.has(item.id)
                        ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/40 scale-110'
                        : 'bg-white/90 text-carbon-600 opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', likedItems.has(item.id) && 'fill-current')} />
                  </button>
                </div>
                <div className="p-3 border-t border-ivory-200">
                  <div className="flex gap-1.5">
                    {item.colors.map((color, ci) => (
                      <div
                        key={ci}
                        className="relative flex-1 h-8 rounded cursor-pointer group/color overflow-hidden"
                        style={{ backgroundColor: color }}
                        onMouseEnter={() => setHoveredColor({ id: `${item.id}-${ci}`, color })}
                        onMouseLeave={() => setHoveredColor(null)}
                      >
                        <AnimatePresence>
                          {hoveredColor?.id === `${item.id}-${ci}` && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 4 }}
                              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-carbon-800 text-white text-xs rounded font-mono whitespace-nowrap z-10"
                            >
                              {color}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-carbon-800" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
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
