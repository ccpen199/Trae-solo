import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Upload,
  Calculator,
  History,
  Sparkles,
  Star,
  Award,
  Crown,
  Medal,
  ChevronDown,
  Image as ImageIcon,
  Gauge,
  Clock,
  Scroll,
  Gem,
  User,
  ArrowRight,
  Package,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

type CategoryKey =
  | 'CERAMIC'
  | 'JADE'
  | 'CALLIGRAPHY_PAINTING'
  | 'BRONZE'
  | 'COIN'
  | 'WOOD'
  | 'LACQUER'
  | 'TEXTILE'
  | 'STATIONERY'
  | 'SEAL'
  | 'ZISHA'
  | 'MISCELLANEOUS';

type EraKey =
  | 'PRE_QIN'
  | 'QIN_HAN'
  | 'WEI_JIN'
  | 'SUI_TANG'
  | 'SONG_LIAO_JIN'
  | 'YUAN'
  | 'MING'
  | 'QING'
  | 'MODERN'
  | 'CONTEMPORARY';

type ConditionKey = 'PERFECT' | 'GOOD' | 'FAIR' | 'DAMAGED';
type SourceKey = 'FAMILY' | 'PURCHASED' | 'AUCTION' | 'OTHER';
type ResultState = 'empty' | 'calculating' | 'result';

interface ValuationFactors {
  era: { stars: number; weight: number; description: string };
  material: { stars: number; weight: number; description: string };
  condition: { stars: number; weight: number; description: string };
  market: { stars: number; weight: number; description: string };
}

interface ValuationData {
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  factors: ValuationFactors;
  marketHeat: number;
}

const CATEGORIES: { key: CategoryKey; label: string; icon: typeof Gem; basePrice: number }[] = [
  { key: 'CERAMIC', label: '陶瓷', icon: Gem, basePrice: 50000 },
  { key: 'JADE', label: '玉器', icon: Gem, basePrice: 30000 },
  { key: 'CALLIGRAPHY_PAINTING', label: '书画', icon: Scroll, basePrice: 80000 },
  { key: 'BRONZE', label: '青铜', icon: Award, basePrice: 120000 },
  { key: 'COIN', label: '钱币', icon: Medal, basePrice: 5000 },
  { key: 'WOOD', label: '木器', icon: Package, basePrice: 25000 },
  { key: 'LACQUER', label: '漆器', icon: Sparkles, basePrice: 18000 },
  { key: 'TEXTILE', label: '织绣', icon: Sparkles, basePrice: 15000 },
  { key: 'STATIONERY', label: '文房', icon: Scroll, basePrice: 12000 },
  { key: 'SEAL', label: '印章', icon: Award, basePrice: 8000 },
  { key: 'ZISHA', label: '紫砂', icon: Gem, basePrice: 20000 },
  { key: 'MISCELLANEOUS', label: '杂项', icon: Sparkles, basePrice: 10000 },
];

const ERAS: { key: EraKey; label: string; coefficient: number }[] = [
  { key: 'PRE_QIN', label: '先秦', coefficient: 8.5 },
  { key: 'QIN_HAN', label: '秦汉', coefficient: 6.0 },
  { key: 'WEI_JIN', label: '魏晋', coefficient: 5.5 },
  { key: 'SUI_TANG', label: '隋唐', coefficient: 7.0 },
  { key: 'SONG_LIAO_JIN', label: '宋辽金', coefficient: 6.5 },
  { key: 'YUAN', label: '元', coefficient: 5.0 },
  { key: 'MING', label: '明', coefficient: 4.5 },
  { key: 'QING', label: '清', coefficient: 3.5 },
  { key: 'MODERN', label: '近现代', coefficient: 2.0 },
  { key: 'CONTEMPORARY', label: '当代', coefficient: 1.0 },
];

const CONDITIONS: { key: ConditionKey; label: string; coefficient: number; description: string }[] = [
  { key: 'PERFECT', label: '完美', coefficient: 1.3, description: '无任何瑕疵，品相一流' },
  { key: 'GOOD', label: '良好', coefficient: 1.0, description: '轻微使用痕迹，整体完好' },
  { key: 'FAIR', label: '一般', coefficient: 0.7, description: '有明显磨损，不影响整体' },
  { key: 'DAMAGED', label: '有残', coefficient: 0.4, description: '有破损修复，影响价值' },
];

const SOURCES: { key: SourceKey; label: string }[] = [
  { key: 'FAMILY', label: '家传' },
  { key: 'PURCHASED', label: '购买' },
  { key: 'AUCTION', label: '拍卖所得' },
  { key: 'OTHER', label: '其他' },
];

const MATERIAL_LEVELS = [
  { max: 20, label: '常见', color: 'text-jade-500' },
  { max: 40, label: '较稀有', color: 'text-jade-600' },
  { max: 60, label: '稀有', color: 'text-gold-600' },
  { max: 80, label: '珍贵', color: 'text-gold-500' },
  { max: 100, label: '顶级稀缺', color: 'text-cinnabar-500' },
];

const SAMPLE_IMAGES = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=antique%20chinese%20blue%20white%20porcelain%20vase%20qing%20dynasty%20museum%20quality&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20hetian%20jade%20carving%20pendant%20white%20nephrite&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20traditional%20ink%20wash%20painting%20landscape%20scroll%20antique&image_size=square',
];

const AUCTION_RECORDS = [
  {
    name: '清乾隆粉彩九桃天球瓶',
    category: 'CERAMIC' as CategoryKey,
    era: 'QING' as EraKey,
    price: 12800000,
    estimateMin: 5000000,
    estimateMax: 8000000,
    date: '2024-03-15',
    source: '苏富比香港',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20qing%20dynasty%20famille%20rose%20porcelain%20vase%20peach%20motif&image_size=square',
  },
  {
    name: '明代和田玉观音摆件',
    category: 'JADE' as CategoryKey,
    era: 'MING' as EraKey,
    price: 860000,
    estimateMin: 600000,
    estimateMax: 900000,
    date: '2024-02-28',
    source: '中国嘉德',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20ming%20dynasty%20hetian%20jade%20guanyin%20statue%20antique&image_size=square',
  },
  {
    name: '傅抱石山水立轴',
    category: 'CALLIGRAPHY_PAINTING' as CategoryKey,
    era: 'MODERN' as EraKey,
    price: 5200000,
    estimateMin: 3000000,
    estimateMax: 4500000,
    date: '2024-02-20',
    source: '北京保利',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20modern%20ink%20landscape%20painting%20scroll%20fu%20baoshi%20style&image_size=square',
  },
  {
    name: '南宋官窑青瓷洗',
    category: 'CERAMIC' as CategoryKey,
    era: 'SONG_LIAO_JIN' as EraKey,
    price: 34500000,
    estimateMin: 20000000,
    estimateMax: 28000000,
    date: '2024-01-12',
    source: '佳士得香港',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=southern%20song%20dynasty%20guan%20ware%20celadon%20brush%20washer%20porcelain&image_size=square',
  },
  {
    name: '战国青铜错金银鼎',
    category: 'BRONZE' as CategoryKey,
    era: 'PRE_QIN' as EraKey,
    price: 8600000,
    estimateMin: 5000000,
    estimateMax: 7000000,
    date: '2024-01-08',
    source: '西泠印社',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=warring%20states%20bronze%20ding%20vessel%20gold%20silver%20inlay%20chinese%20antique&image_size=square',
  },
  {
    name: '清代小叶紫檀条案',
    category: 'WOOD' as CategoryKey,
    era: 'QING' as EraKey,
    price: 1850000,
    estimateMin: 1200000,
    estimateMax: 1800000,
    date: '2023-12-18',
    source: '匡时国际',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=qing%20dynasty%20chinese%20zitan%20rosewood%20furniture%20altar%20table%20antique&image_size=square',
  },
  {
    name: '田黄石薄意雕印章',
    category: 'SEAL' as CategoryKey,
    era: 'QING' as EraKey,
    price: 3200000,
    estimateMin: 2000000,
    estimateMax: 2800000,
    date: '2023-12-10',
    source: '朵云轩',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tianhuang%20stone%20seal%20chinese%20antique%20soapstone%20carving&image_size=square',
  },
  {
    name: '顾景舟石瓢紫砂壶',
    category: 'ZISHA' as CategoryKey,
    era: 'MODERN' as EraKey,
    price: 2800000,
    estimateMin: 1500000,
    estimateMax: 2200000,
    date: '2023-11-28',
    source: '中国嘉德',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yixing%20zisha%20teapot%20gu%20jingzhou%20shipiao%20style%20chinese%20antique&image_size=square',
  },
];

const MATERIAL_RARITY = [
  { name: '和田羊脂白玉籽料', index: 98, change: 15.6, unitPrice: '¥ 50,000/g' },
  { name: '宋代官窑青瓷', index: 96, change: 22.3, unitPrice: '¥ 800,000/件' },
  { name: '元代青花苏麻离青', index: 95, change: 18.7, unitPrice: '¥ 1,200,000/件' },
  { name: '田黄石（白田）', index: 94, change: 12.4, unitPrice: '¥ 30,000/g' },
  { name: '昌化鸡血石（大红袍）', index: 92, change: 8.9, unitPrice: '¥ 25,000/g' },
  { name: '小叶紫檀（老料）', index: 88, change: 5.2, unitPrice: '¥ 2,800/斤' },
  { name: '海南黄花梨（油梨）', index: 86, change: -2.1, unitPrice: '¥ 4,500/斤' },
  { name: '清代犀角雕', index: 85, change: 6.8, unitPrice: '¥ 15,000/g' },
  { name: '翡翠老坑玻璃种', index: 83, change: 11.5, unitPrice: '¥ 100,000/ct' },
  { name: '明代宣德炉', index: 80, change: 7.3, unitPrice: '¥ 500,000/件' },
];

const MARKET_TRENDS = [
  {
    category: '明清官窑瓷器',
    trend: 'rising' as const,
    prices: [82, 85, 90, 88, 95, 100],
    priceRange: '¥ 50万 - ¥ 500万',
    comment: '官窑精品稀缺，市场热度持续走高',
  },
  {
    category: '和田白玉籽料',
    trend: 'stable' as const,
    prices: [88, 90, 89, 92, 91, 90],
    priceRange: '¥ 2万 - ¥ 15万',
    comment: '资源枯竭，价格高位企稳',
  },
  {
    category: '近现代名家书画',
    trend: 'rising' as const,
    prices: [75, 78, 82, 85, 88, 92],
    priceRange: '¥ 10万 - ¥ 80万',
    comment: '名家精品备受藏家追捧',
  },
  {
    category: '文房清供杂项',
    trend: 'stable' as const,
    prices: [80, 82, 81, 83, 82, 81],
    priceRange: '¥ 1万 - ¥ 30万',
    comment: '文人审美回归，市场稳中有升',
  },
  {
    category: '清代紫檀家具',
    trend: 'declining' as const,
    prices: [95, 92, 88, 85, 82, 78],
    priceRange: '¥ 20万 - ¥ 200万',
    comment: '大件家具流通性下降，价格回调',
  },
];

const TIME_FILTERS = [
  { key: '1m', label: '近1月' },
  { key: '3m', label: '近3月' },
  { key: '6m', label: '近半年' },
  { key: '1y', label: '近1年' },
];

function formatPrice(num: number): string {
  if (num >= 10000000) {
    return `¥ ${(num / 10000).toFixed(0)}万`;
  }
  return `¥ ${num.toLocaleString('zh-CN')}`;
}

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const motionValue = useMotionValue(0);
  const roundedValue = useTransform(motionValue, (v) =>
    prefix ? `${prefix}${Math.round(v).toLocaleString('zh-CN')}` : Math.round(v).toLocaleString('zh-CN'),
  );

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.5, ease: 'easeOut' });
    return controls.stop;
  }, [value, motionValue]);

  return <motion.span>{roundedValue}</motion.span>;
}

function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4',
            i < Math.floor(count)
              ? 'text-gold-500 fill-gold-500'
              : i < count
                ? 'text-gold-500/50 fill-gold-500/50'
                : 'text-jade-300',
          )}
        />
      ))}
    </div>
  );
}

export default function Valuation() {
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [era, setEra] = useState<EraKey | null>(null);
  const [materialScore, setMaterialScore] = useState(50);
  const [condition, setCondition] = useState<ConditionKey | null>(null);
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '', weight: '' });
  const [source, setSource] = useState<SourceKey | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultState, setResultState] = useState<ResultState>('empty');
  const [valuationData, setValuationData] = useState<ValuationData | null>(null);
  const [timeFilter, setTimeFilter] = useState('6m');
  const [eraDropdownOpen, setEraDropdownOpen] = useState(false);

  const materialLevel = useMemo(() => {
    return MATERIAL_LEVELS.find((l) => materialScore <= l.max) ?? MATERIAL_LEVELS[MATERIAL_LEVELS.length - 1];
  }, [materialScore]);

  const canCalculate = category !== null && era !== null && condition !== null;

  const filteredRecords = useMemo(() => {
    if (category && era) {
      return AUCTION_RECORDS.filter((r) => r.category === category || r.era === era).slice(0, 6);
    }
    return AUCTION_RECORDS.slice(0, 6);
  }, [category, era]);

  const handleCalculate = () => {
    if (!canCalculate) return;
    setResultState('calculating');

    setTimeout(() => {
      const cat = CATEGORIES.find((c) => c.key === category)!;
      const er = ERAS.find((e) => e.key === era)!;
      const cond = CONDITIONS.find((c) => c.key === condition)!;
      const materialCoef = 0.5 + (materialScore / 100) * 1.5;
      const marketHeat = 0.9 + Math.random() * 0.3;

      const basePrice = cat.basePrice;
      const medianPrice = Math.round(
        basePrice * er.coefficient * materialCoef * cond.coefficient * marketHeat,
      );
      const minPrice = Math.round(medianPrice * 0.82);
      const maxPrice = Math.round(medianPrice * 1.18);

      const eraStars = Math.min(5, Math.max(1, Math.round(er.coefficient / 2)));
      const materialStars = Math.round(materialScore / 20);
      const conditionStars =
        condition === 'PERFECT' ? 5 : condition === 'GOOD' ? 4 : condition === 'FAIR' ? 3 : 2;
      const marketStars = Math.round(marketHeat * 4);

      const eraDesc =
        eraStars >= 5
          ? `${er.label}年间精品，存世量极为稀少`
          : eraStars >= 4
            ? `${er.label}时期，具有较高历史价值`
            : `${er.label}时期，有一定年代价值`;
      const materialDesc =
        materialStars >= 5
          ? '顶级材质，存世罕见，已失传工艺'
          : materialStars >= 4
            ? '珍贵材质，稀缺性高'
            : materialStars >= 3
              ? '材质较好，有一定稀缺性'
              : '普通常见材质';
      const conditionDesc = cond.description;
      const marketDesc =
        marketStars >= 4
          ? `近半年同类成交活跃，溢价率 ${Math.round((marketHeat - 1) * 100)}%`
          : '市场成交平稳，流动性一般';

      setValuationData({
        minPrice,
        maxPrice,
        medianPrice,
        factors: {
          era: { stars: eraStars, weight: 40, description: eraDesc },
          material: { stars: materialStars, weight: 25, description: materialDesc },
          condition: { stars: conditionStars, weight: 20, description: conditionDesc },
          market: { stars: Math.min(5, marketStars), weight: 15, description: marketDesc },
        },
        marketHeat,
      });
      setResultState('result');
    }, 1800);
  };

  const trendIcons = {
    rising: TrendingUp,
    stable: Minus,
    declining: TrendingDown,
  };

  const trendLabels = {
    rising: '上涨趋势',
    stable: '价格平稳',
    declining: '下跌趋势',
  };

  const trendColors = {
    rising: 'text-jade-600 bg-jade-50',
    stable: 'text-jade-500 bg-rice-100',
    declining: 'text-cinnabar-500 bg-cinnabar-50',
  };

  return (
    <div className="container py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 md:mb-12"
      >
        <Tag variant="gold" className="mb-4">
          价值评估
        </Tag>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-jade-700 mb-3">
          藏品价值评估
        </h1>
        <p className="text-jade-500 text-lg max-w-xl mx-auto">
          基于海量拍卖数据 + 材质稀缺性模型的智能估价
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid lg:grid-cols-100 gap-6 mb-12"
        style={{ gridTemplateColumns: '45% 55%' }}
      >
        <Card className="bg-paper relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gold-gradient opacity-60" />
          <div className="absolute top-0 left-6 w-16 h-24 border-l-2 border-t-2 border-gold-300 opacity-40" />
          <div className="absolute top-0 right-6 w-16 h-24 border-r-2 border-t-2 border-gold-300 opacity-40" />
          <Card.Content className="pt-6">
            <h2 className="font-serif text-xl font-semibold text-jade-700 mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gold-500" />
              智能估价参数
            </h2>

            <div className="space-y-5">
              <div>
                <label className="label-field">
                  品类选择 <span className="text-cinnabar-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setCategory(cat.key)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-md border transition-all duration-200',
                          isSelected
                            ? 'border-gold-400 bg-gold-50 shadow-gold-glow'
                            : 'border-gold-200 bg-rice-50 hover:border-gold-300 hover:bg-gold-50/50',
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-5 h-5',
                            isSelected ? 'text-gold-600' : 'text-jade-500',
                          )}
                        />
                        <span
                          className={cn(
                            'text-xs font-medium',
                            isSelected ? 'text-gold-700' : 'text-jade-600',
                          )}
                        >
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label-field">
                  年代选择 <span className="text-cinnabar-500">*</span>
                </label>
                <div className="relative">
                  <button
                    onClick={() => setEraDropdownOpen(!eraDropdownOpen)}
                    className="input-field w-full flex items-center justify-between text-left"
                  >
                    <span className={era ? 'text-jade-700' : 'text-jade-400'}>
                      {era ? ERAS.find((e) => e.key === era)?.label : '请选择年代'}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-jade-400 transition-transform',
                        eraDropdownOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {eraDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute z-10 mt-1 w-full bg-rice-50 border border-gold-300 rounded-md shadow-scroll overflow-hidden"
                      >
                        {ERAS.map((e) => (
                          <button
                            key={e.key}
                            onClick={() => {
                              setEra(e.key);
                              setEraDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2.5 text-left text-sm transition-colors',
                              era === e.key
                                ? 'bg-gold-100 text-gold-700'
                                : 'text-jade-600 hover:bg-gold-50',
                            )}
                          >
                            {e.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="label-field flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-gold-500" />
                  材质稀缺性自评
                </label>
                <div className="px-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={materialScore}
                    onChange={(e) => setMaterialScore(Number(e.target.value))}
                    className="w-full h-2 bg-rice-200 rounded-full appearance-none cursor-pointer accent-gold-500"
                  />
                  <div className="flex justify-between mt-2">
                    {MATERIAL_LEVELS.map((l) => (
                      <span
                        key={l.label}
                        className={cn(
                          'text-xs',
                          materialLevel.label === l.label
                            ? 'font-semibold text-gold-600'
                            : 'text-jade-400',
                        )}
                      >
                        {l.label}
                      </span>
                    ))}
                  </div>
                  <p className={cn('text-sm mt-2 text-center font-medium', materialLevel.color)}>
                    当前等级：{materialLevel.label}（{materialScore}分）
                  </p>
                </div>
              </div>

              <div>
                <label className="label-field">
                  品相等级 <span className="text-cinnabar-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CONDITIONS.map((c) => {
                    const isSelected = condition === c.key;
                    return (
                      <button
                        key={c.key}
                        onClick={() => setCondition(c.key)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-md border transition-all duration-200',
                          isSelected
                            ? 'border-gold-400 bg-gold-50 shadow-gold-glow'
                            : 'border-gold-200 bg-rice-50 hover:border-gold-300 hover:bg-gold-50/50',
                        )}
                      >
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            isSelected ? 'text-gold-700' : 'text-jade-600',
                          )}
                        >
                          {c.label}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] text-center leading-tight',
                            isSelected ? 'text-gold-600' : 'text-jade-400',
                          )}
                        >
                          {c.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label-field flex items-center gap-2">
                  <Package className="w-4 h-4 text-gold-500" />
                  尺寸信息（选填）
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-xs text-jade-400">长 cm</span>
                    <Input
                      value={dimensions.length}
                      onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-jade-400">宽 cm</span>
                    <Input
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-jade-400">高 cm</span>
                    <Input
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-jade-400">重 g</span>
                    <Input
                      value={dimensions.weight}
                      onChange={(e) => setDimensions({ ...dimensions, weight: e.target.value })}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label-field flex items-center gap-2">
                  <User className="w-4 h-4 text-gold-500" />
                  传承来源
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SOURCES.map((s) => {
                    const isSelected = source === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setSource(s.key)}
                        className={cn(
                          'py-2 rounded-md border text-sm font-medium transition-all duration-200',
                          isSelected
                            ? 'border-gold-400 bg-gold-50 text-gold-700 shadow-gold-glow'
                            : 'border-gold-200 bg-rice-50 text-jade-600 hover:border-gold-300 hover:bg-gold-50/50',
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label-field flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gold-500" />
                  参考图片
                </label>
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer',
                    selectedImage
                      ? 'border-gold-400 bg-gold-50/30'
                      : 'border-gold-200 bg-rice-50 hover:border-gold-300 hover:bg-gold-50/30',
                  )}
                >
                  {selectedImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={selectedImage}
                        alt="selected"
                        className="w-20 h-20 object-cover rounded-md border border-gold-300"
                      />
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="text-xs text-cinnabar-500 hover:text-cinnabar-600"
                      >
                        清除图片
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gold-400 mx-auto mb-2" />
                      <p className="text-sm text-jade-500">拖拽图片到此处或点击上传</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs text-jade-400 self-center">示例：</span>
                  {SAMPLE_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={cn(
                        'w-12 h-12 rounded-md overflow-hidden border transition-all',
                        selectedImage === img
                          ? 'border-gold-500 ring-2 ring-gold-400/50'
                          : 'border-gold-200 hover:border-gold-400',
                      )}
                    >
                      <img src={img} alt={`sample-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <span className="text-xs text-gold-600 self-center ml-1">点击填充</span>
                </div>
              </div>

              <Button
                size="lg"
                fullWidth
                disabled={!canCalculate}
                loading={resultState === 'calculating'}
                onClick={handleCalculate}
                leftIcon={<Sparkles className="w-5 h-5" />}
                className={cn(
                  'text-lg py-4 font-serif',
                  canCalculate && 'shadow-gold-glow hover:shadow-gold-glow',
                )}
              >
                开始智能估价
              </Button>

              {!canCalculate && (
                <p className="text-xs text-center text-jade-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  请填写带 * 号的必填项
                </p>
              )}
            </div>
          </Card.Content>
        </Card>

        <Card className="bg-paper">
          <Card.Content className="pt-6 min-h-[600px] flex flex-col">
            <h2 className="font-serif text-xl font-semibold text-jade-700 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold-500" />
              估价结果
            </h2>

            <div className="flex-1 flex flex-col">
              {resultState === 'empty' && (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState
                    icon={<Calculator className="w-10 h-10 text-gold-500" />}
                    title="等待估价"
                    description="请在左侧填写藏品信息，点击「开始智能估价」获取评估结果"
                  />
                </div>
              )}

              {resultState === 'calculating' && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mb-6"
                  >
                    <div className="w-full h-full rounded-full border-4 border-gold-200 border-t-gold-500" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-serif text-lg text-jade-700 mb-2"
                  >
                    正在分析拍卖大数据...
                  </motion.p>
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-gold-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-jade-500 mt-4">匹配相似成交记录 · 计算材质稀缺性 · 评估市场热度</p>
                </div>
              )}

              {resultState === 'result' && valuationData && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className="text-center py-4 border-y border-gold-200">
                      <p className="text-sm text-jade-500 mb-2">智能估值区间</p>
                      <div className="font-serif text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 bg-clip-text text-transparent text-shadow-gold">
                        <AnimatedNumber value={valuationData.minPrice} prefix="¥ " />
                        <span className="mx-2 text-jade-400">—</span>
                        <AnimatedNumber value={valuationData.maxPrice} prefix="¥ " />
                      </div>
                      <div className="mt-3 inline-flex items-center gap-2 bg-gold-gradient text-white px-4 py-1.5 rounded-full">
                        <Crown className="w-4 h-4" />
                        <span className="font-medium">
                          建议出手价：<AnimatedNumber value={valuationData.medianPrice} prefix="¥ " />
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif text-base font-semibold text-jade-700 mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold-500" />
                        四大因子分析
                      </h3>
                      <div className="space-y-3">
                        {[
                          { key: 'era', label: '年代价值', data: valuationData.factors.era },
                          { key: 'material', label: '材质稀缺性', data: valuationData.factors.material },
                          { key: 'condition', label: '品相完好度', data: valuationData.factors.condition },
                          { key: 'market', label: '市场热度', data: valuationData.factors.market },
                        ].map((factor, idx) => (
                          <motion.div
                            key={factor.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-rice-50 rounded-md p-3 border border-gold-100"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <Stars count={factor.data.stars} />
                                <span className="font-medium text-jade-700 text-sm">{factor.label}</span>
                              </div>
                              <span className="text-xs text-gold-600 font-medium">权重 {factor.data.weight}%</span>
                            </div>
                            <p className="text-xs text-jade-500 mb-2">{factor.data.description}</p>
                            <ProgressBar value={factor.data.weight} size="sm" />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-jade-50/50 rounded-md p-4 border border-jade-200">
                      <h4 className="font-serif text-sm font-semibold text-jade-700 mb-2">估值算法说明</h4>
                      <p className="text-xs text-jade-600 leading-relaxed">
                        估值公式：基础价(品类) × 年代系数 × 材质系数 × 品相系数 × 市场热度(0.9~1.2)
                        <br />
                        <span className="text-jade-500">
                          * 本结果基于近三年拍卖大数据综合评估，仅供参考，不构成交易依据
                        </span>
                      </p>
                    </div>

                    <Button fullWidth size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      获取专家精准估价
                    </Button>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-jade-700 flex items-center gap-2">
            <History className="w-5 h-5 text-gold-500" />
            {category && era ? '近半年同类拍卖成交参考' : '热门品类成交行情'}
          </h2>
          {category && era && (
            <div className="flex gap-2">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTimeFilter(f.key)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-md border transition-all',
                    timeFilter === f.key
                      ? 'border-gold-400 bg-gold-50 text-gold-700'
                      : 'border-gold-200 bg-rice-50 text-jade-500 hover:border-gold-300',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record, idx) => {
            const premium = ((record.price - record.estimateMax) / record.estimateMax) * 100;
            const isOver = premium > 0;
            return (
              <motion.div
                key={record.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card hoverable className="h-full">
                  <Card.Image src={record.image} alt={record.name} aspectRatio="video" />
                  <Card.Content>
                    <h4 className="font-serif font-semibold text-jade-700 mb-2 line-clamp-1">
                      {record.name}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-jade-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {record.date}
                      </span>
                      <span className="text-gold-600 font-medium">{record.source}</span>
                    </div>
                    <div className="font-serif text-2xl font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent mb-2">
                      {formatPrice(record.price)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-jade-400">
                        估价 {formatPrice(record.estimateMin)} - {formatPrice(record.estimateMax)}
                      </span>
                      <Badge variant={isOver ? 'error' : 'success'}>
                        {isOver ? `超估价 ${Math.round(premium)}%` : `低估价 ${Math.abs(Math.round(premium))}%`}
                      </Badge>
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-6">
          <button className="inline-flex items-center gap-1 text-gold-600 hover:text-gold-700 font-medium text-sm transition-colors">
            查看更多成交记录
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 className="font-serif text-2xl font-bold text-jade-700 mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-gold-500" />
          文玩材质稀缺性指数 TOP 10
        </h2>

        <Card className="bg-paper">
          <Card.Content className="p-0">
            {MATERIAL_RARITY.map((mat, idx) => {
              const isUp = mat.change > 0;
              const TrendIcon = isUp ? TrendingUp : TrendingDown;
              const medalIcons = [Crown, Medal, Award];
              const MedalIcon = idx < 3 ? medalIcons[idx] : null;
              const medalColors = [
                'from-yellow-300 to-yellow-500',
                'from-gray-300 to-gray-400',
                'from-amber-600 to-amber-700',
              ];
              return (
                <motion.div
                  key={mat.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    'flex items-center gap-4 px-6 py-3 border-b border-gold-100 last:border-0',
                    idx < 3 && 'bg-gold-50/40',
                  )}
                >
                  <div className="w-10 flex-shrink-0">
                    {MedalIcon ? (
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shadow-md',
                          medalColors[idx],
                        )}
                      >
                        <MedalIcon className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <span className="font-serif text-lg font-bold text-jade-400 text-center block">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-jade-700 truncate">{mat.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 max-w-[200px]">
                        <ProgressBar value={mat.index} size="sm" showLabel={false} />
                      </div>
                      <span className="text-sm font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
                        {mat.index}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium flex-shrink-0 w-20',
                      isUp ? 'text-jade-600' : 'text-cinnabar-500',
                    )}
                  >
                    <TrendIcon className="w-4 h-4" />
                    {isUp ? '+' : ''}
                    {mat.change}%
                  </div>
                  <div className="text-sm text-jade-600 font-medium flex-shrink-0 w-32 text-right">
                    {mat.unitPrice}
                  </div>
                </motion.div>
              );
            })}
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 className="font-serif text-2xl font-bold text-jade-700 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gold-500" />
          热门品类市场趋势
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {MARKET_TRENDS.map((trend, idx) => {
            const TrendIcon = trendIcons[trend.trend];
            const maxPrice = Math.max(...trend.prices);
            return (
              <motion.div
                key={trend.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <Card hoverable className="h-full bg-paper">
                  <Card.Content>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-serif font-semibold text-jade-700 text-sm">{trend.category}</h4>
                      <Badge variant={trend.trend === 'rising' ? 'success' : trend.trend === 'declining' ? 'error' : 'default'}>
                        <TrendIcon className="w-3 h-3 mr-1" />
                        {trendLabels[trend.trend]}
                      </Badge>
                    </div>

                    <div className="flex items-end justify-between gap-1 h-20 mb-4">
                      {trend.prices.map((p, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${(p / maxPrice) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1, duration: 0.4 }}
                          className={cn(
                            'flex-1 rounded-t-sm bg-gradient-to-t from-gold-500 to-gold-400 min-h-[4px]',
                            i === trend.prices.length - 1 && 'opacity-100',
                          )}
                          style={{ height: `${(p / maxPrice) * 100}%` }}
                        />
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-jade-600">
                        均价区间：<span className="font-medium text-jade-700">{trend.priceRange}</span>
                      </p>
                      <p className="text-xs text-jade-500 leading-relaxed">{trend.comment}</p>
                    </div>
                  </Card.Content>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
