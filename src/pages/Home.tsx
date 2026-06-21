import { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Upload, Sparkles, UserCheck, Award, Star, Clock, TrendingUp,
  Eye, MessageCircle, ChevronRight, Shield, Users, FileCheck,
  ThumbsUp, ArrowRight, Search, CheckCircle2, AlertTriangle,
  XCircle, Zap, Bot, HandCoins, Package, Gem, ScrollText,
  Coins, Puzzle, TreePine, Brush, Shirt, PenTool, Coffee,
  Flame, Palette, Gavel, FileText, Building2, ChevronDown,
  ChevronUp, Calculator, Wallet, BarChart3,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  mockExperts, mockKnowledgeArticles, mockCommunityQuestions,
  mockCertificates, mockArtworks,
} from '@/lib/mockData';
import { ExpertLevel, Category, AuthenticityLevel, OrderStatus } from '../../shared/types';

const heroArtworks = [
  { url: 'https://picsum.photos/seed/ceramic1/600/800', name: '青釉玉壶春瓶', category: '陶瓷·青花瓷', match: '96%' },
  { url: 'https://picsum.photos/seed/jade1/600/800', name: '和田白玉观音', category: '玉器·和田玉', match: '94%' },
  { url: 'https://picsum.photos/seed/painting1/600/800', name: '山水立轴', category: '书画·水墨', match: '92%' },
  { url: 'https://picsum.photos/seed/bronze1/600/800', name: '青铜饕餮纹鼎', category: '青铜器·商周', match: '95%' },
  { url: 'https://picsum.photos/seed/zisha1/600/800', name: '石瓢紫砂壶', category: '紫砂·曼生', match: '93%' },
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
  [Category.CERAMIC]: '陶瓷', [Category.JADE]: '玉器', [Category.CALLIGRAPHY_PAINTING]: '书画',
  [Category.BRONZE]: '青铜器', [Category.COIN]: '钱币', [Category.MISCELLANEOUS]: '杂项',
  [Category.WOOD]: '木器', [Category.LACQUER]: '漆器', [Category.TEXTILE]: '织绣',
  [Category.STATIONERY]: '文房', [Category.SEAL]: '印章', [Category.ZISHA]: '紫砂',
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  [Category.CERAMIC]: Package, [Category.JADE]: Gem, [Category.CALLIGRAPHY_PAINTING]: ScrollText,
  [Category.BRONZE]: Flame, [Category.COIN]: Coins, [Category.MISCELLANEOUS]: Puzzle,
  [Category.WOOD]: TreePine, [Category.LACQUER]: Brush, [Category.TEXTILE]: Shirt,
  [Category.STATIONERY]: PenTool, [Category.SEAL]: Award, [Category.ZISHA]: Coffee,
};

const allCategories = [
  Category.CERAMIC, Category.JADE, Category.CALLIGRAPHY_PAINTING, Category.BRONZE,
  Category.COIN, Category.MISCELLANEOUS, Category.WOOD, Category.LACQUER,
  Category.TEXTILE, Category.STATIONERY, Category.SEAL, Category.ZISHA,
];

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeInLeft = { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } } };

const sampleArtworks = [
  { id: 'sample1', category: Category.CERAMIC, name: '青花缠枝莲纹梅瓶', image: 'https://picsum.photos/seed/sample1/120/120', era: '清代乾隆年间', confidence: 96.2, authenticity: AuthenticityLevel.GENUINE },
  { id: 'sample2', category: Category.JADE, name: '和田白玉籽料观音', image: 'https://picsum.photos/seed/sample2/120/120', era: '清代中期', confidence: 92.5, authenticity: AuthenticityLevel.GENUINE },
  { id: 'sample3', category: Category.CALLIGRAPHY_PAINTING, name: '山水立轴', image: 'https://picsum.photos/seed/sample3/120/120', era: '近现代', confidence: 88.3, authenticity: AuthenticityLevel.SUSPICIOUS },
  { id: 'sample4', category: Category.BRONZE, name: '青铜饕餮纹鼎', image: 'https://picsum.photos/seed/sample4/120/120', era: '商代晚期', confidence: 94.8, authenticity: AuthenticityLevel.GENUINE },
  { id: 'sample5', category: Category.COIN, name: '咸丰元宝当百', image: 'https://picsum.photos/seed/sample5/120/120', era: '清代咸丰年', confidence: 85.6, authenticity: AuthenticityLevel.FAKE },
  { id: 'sample6', category: Category.ZISHA, name: '石瓢紫砂壶', image: 'https://picsum.photos/seed/sample6/120/120', era: '当代', confidence: 91.2, authenticity: AuthenticityLevel.GENUINE },
];

const aiFeatures = [
  { icon: Package, label: '器型规整度' },
  { icon: Palette, label: '纹饰风格' },
  { icon: Sparkles, label: '胎釉特征' },
  { icon: FileText, label: '款识比对' },
];

const eraFilters = ['先秦', '秦汉', '唐宋', '元明', '清', '近现代'];
const craftFilters = ['青花', '粉彩', '籽料', '水墨', '包浆', '开片'];
const authenticityFilters = ['真品要点', '仿品特征', '真伪对比', '微观痕迹'];

const faqList = [
  { question: 'AI 初筛和专家鉴定有什么区别？', answer: 'AI 初筛是基于图像识别的快速分类和初步判断，仅供参考；专家鉴定由资深专家人工鉴定，出具权威结论和证书。' },
  { question: '鉴定证书有法律效力吗？', answer: '鉴真阁证书由认证专家出具，具备行业公信力，可作为收藏、交易参考。如需法律效力，建议申请司法鉴定。' },
  { question: '鉴定不满意可以申请仲裁吗？', answer: '是的，平台提供三级仲裁机制。对鉴定结果有异议，可在 7 日内申请纠纷仲裁，由专家组重新审议。' },
];

const valuationBase: Record<string, number> = {
  [Category.CERAMIC]: 50000, [Category.JADE]: 80000, [Category.CALLIGRAPHY_PAINTING]: 120000,
  [Category.BRONZE]: 150000, [Category.COIN]: 20000, [Category.ZISHA]: 30000,
  [Category.MISCELLANEOUS]: 25000, [Category.WOOD]: 60000, [Category.LACQUER]: 45000,
  [Category.TEXTILE]: 35000, [Category.STATIONERY]: 40000, [Category.SEAL]: 55000,
};

const eraFactors: Record<string, number> = {
  '先秦': 3.5, '秦汉': 3.0, '唐宋': 2.5, '元明': 2.0, '清': 1.5, '近现代': 1.0, '当代': 0.6,
};

const conditionFactors: Record<string, number> = {
  '完美': 1.3, '良好': 1.0, '一般': 0.7, '有残': 0.4,
};

interface LiveOrder {
  id: string; name: string; category: string; image: string; status: OrderStatus;
  expertCount: number; bidCount: number; minPrice: number; maxPrice: number;
  slaTotal: number; slaRemaining: number;
  experts: { name: string; avatar: string; level: ExpertLevel }[];
}

function getConclusionBadge(conclusion: string) {
  switch (conclusion) {
    case AuthenticityLevel.GENUINE: return { label: '真品倾向', className: 'bg-jade-500', Icon: CheckCircle2 };
    case AuthenticityLevel.SUSPICIOUS: return { label: '存疑', className: 'bg-gold-500', Icon: AlertTriangle };
    case AuthenticityLevel.FAKE: return { label: '仿品倾向', className: 'bg-cinnabar-400', Icon: XCircle };
    default: return { label: '真品倾向', className: 'bg-jade-500', Icon: CheckCircle2 };
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function Home() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [certInput, setCertInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  const [selectedSample, setSelectedSample] = useState<typeof sampleArtworks[0] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<typeof sampleArtworks[0] | null>(null);

  const [activeEraFilter, setActiveEraFilter] = useState<string>('清');
  const [activeCraftFilter, setActiveCraftFilter] = useState<string>('青花');
  const [activeAuthFilter, setActiveAuthFilter] = useState<string>('真品要点');
  const [knowledgeTab, setKnowledgeTab] = useState<'era' | 'craft' | 'authenticity'>('era');

  const [expandedFaq, setExpandedFaq] = useState<number>(0);

  const [valuationCategory, setValuationCategory] = useState(Category.CERAMIC);
  const [valuationEra, setValuationEra] = useState('清');
  const [valuationCondition, setValuationCondition] = useState('良好');
  const [valuationResult, setValuationResult] = useState<{
    min: number; max: number; median: number;
    factors: { label: string; value: number }[];
    auctionCount: number; maxAuction: number;
  } | null>(null);
  const [isValuating, setIsValuating] = useState(false);

  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroArtworks.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const orders: LiveOrder[] = [
      { id: 'live_001', name: '清乾隆粉彩百花不落地纹瓶', category: Category.CERAMIC, image: 'https://picsum.photos/seed/live1/100/100', status: OrderStatus.PENDING, expertCount: 3, bidCount: 5, minPrice: 1200, maxPrice: 2800, slaTotal: 1800, slaRemaining: 755, experts: mockExperts.slice(0, 3).map((e, i) => ({ name: e.name, avatar: `https://picsum.photos/seed/expert${i + 10}/60/60`, level: e.level })) },
      { id: 'live_002', name: '和田白玉籽料把件', category: Category.JADE, image: 'https://picsum.photos/seed/live2/100/100', status: OrderStatus.APPRAISING, expertCount: 1, bidCount: 1, minPrice: 800, maxPrice: 800, slaTotal: 3600, slaRemaining: 2150, experts: mockExperts.slice(0, 1).map((e, i) => ({ name: e.name, avatar: `https://picsum.photos/seed/expert${i + 20}/60/60`, level: e.level })) },
      { id: 'live_003', name: '齐白石虾蟹图立轴', category: Category.CALLIGRAPHY_PAINTING, image: 'https://picsum.photos/seed/live3/100/100', status: OrderStatus.PENDING, expertCount: 2, bidCount: 4, minPrice: 2000, maxPrice: 5000, slaTotal: 1800, slaRemaining: 240, experts: mockExperts.slice(1, 4).map((e, i) => ({ name: e.name, avatar: `https://picsum.photos/seed/expert${i + 30}/60/60`, level: e.level })) },
      { id: 'live_004', name: '商周青铜爵杯', category: Category.BRONZE, image: 'https://picsum.photos/seed/live4/100/100', status: OrderStatus.ACCEPTED, expertCount: 1, bidCount: 1, minPrice: 1500, maxPrice: 1500, slaTotal: 3600, slaRemaining: 3200, experts: mockExperts.slice(2, 3).map((e, i) => ({ name: e.name, avatar: `https://picsum.photos/seed/expert${i + 40}/60/60`, level: e.level })) },
    ];
    setLiveOrders(orders);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveOrders((prev) => prev.map((order) => ({ ...order, slaRemaining: Math.max(0, order.slaRemaining - 1) })));
    }, 1000);
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

  const sampleCertNos = ['JZG-202406-00128', 'JD-2024-0330-000957', 'JD-2024-0410-001523'];

  const expertCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    allCategories.forEach((cat) => { counts[cat] = mockExperts.filter((e) => e.categories.includes(cat)).length || Math.floor(Math.random() * 8) + 3; });
    return counts;
  }, []);

  const filteredArticles = useMemo(() => mockKnowledgeArticles.slice(0, 3), []);

  const handleCategoryClick = (category: string) => { navigate(`/appraise?category=${encodeURIComponent(category)}`); };
  const handleCertSearch = () => { if (certInput.trim()) { navigate(`/certificate/${encodeURIComponent(certInput.trim())}`); } };
  const handleFileDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); navigate('/appraise'); };

  const handleSampleClick = (sample: typeof sampleArtworks[0]) => {
    setSelectedSample(sample);
    setAiResult(null);
    setIsAiLoading(true);
    setTimeout(() => { setIsAiLoading(false); setAiResult(sample); }, 1500);
  };

  const handleValuation = () => {
    setIsValuating(true);
    setTimeout(() => {
      const base = valuationBase[valuationCategory] || 30000;
      const eraFactor = eraFactors[valuationEra] || 1.0;
      const condFactor = conditionFactors[valuationCondition] || 1.0;
      const median = Math.round(base * eraFactor * condFactor);
      const min = Math.round(median * 0.82);
      const max = Math.round(median * 1.18);
      setValuationResult({
        min, max, median,
        factors: [
          { label: '材质稀缺性', value: 4 },
          { label: '年代价值', value: Math.min(5, Math.round(eraFactor * 2)) },
          { label: '品相完好度', value: Math.round(condFactor * 3.5) },
          { label: '市场热度', value: 5 },
        ],
        auctionCount: 3 + Math.floor(Math.random() * 5),
        maxAuction: Math.round(max * 1.3),
      });
      setIsValuating(false);
    }, 1200);
  };

  const getStatusConfig = (status: OrderStatus, slaRemaining: number) => {
    const isUrgent = slaRemaining < 300;
    switch (status) {
      case OrderStatus.PENDING: return { label: '等待接单', borderClass: isUrgent ? 'border-cinnabar-400 animate-pulse' : 'border-gold-400', labelClass: isUrgent ? 'bg-cinnabar-400' : 'bg-gold-500' };
      case OrderStatus.ACCEPTED: return { label: '已接单', borderClass: 'border-jade-400', labelClass: 'bg-jade-500' };
      case OrderStatus.APPRAISING: return { label: '鉴定中', borderClass: 'border-jade-500', labelClass: 'bg-jade-600' };
      default: return { label: '进行中', borderClass: 'border-gold-300', labelClass: 'bg-gold-400' };
    }
  };

  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-4 h-4 ${i <= count ? 'text-gold-500 fill-gold-500' : 'text-rice-300'}`} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-rice-100">
      {/* ========== Section 1: Hero ========== */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale }} className="relative overflow-hidden bg-ink-gradient min-h-[620px] flex items-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(201, 169, 97, 0.08) 50px, rgba(201, 169, 97, 0.08) 100px)` }} />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-[85%] overflow-hidden">
          <div className="relative w-full h-full">
            {heroArtworks.map((artwork, index) => (
              <motion.div key={index} className="absolute inset-0 flex items-center justify-center gap-4"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: index === currentSlide ? 1 : 0, x: index === currentSlide ? 0 : 100 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-gold-gradient/20 rounded-lg blur-xl" />
                  <img src={artwork.url} alt={artwork.name} className="relative w-44 h-56 object-cover rounded-lg shadow-2xl border-2 border-gold-400/50" />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-ink-gradient/90 backdrop-blur rounded-full text-xs text-gold-300 whitespace-nowrap border border-gold-400/50">
                    AI 初筛 {artwork.match} 匹配 · {artwork.category}
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -inset-2 bg-gold-gradient/30 rounded-lg blur-2xl" />
                  <img src={heroArtworks[(index + 1) % heroArtworks.length].url} alt={heroArtworks[(index + 1) % heroArtworks.length].name} className="relative w-52 h-64 object-cover rounded-lg shadow-2xl border-2 border-gold-400/70 translate-y-6" />
                </div>
                <div className="relative">
                  <div className="absolute -inset-2 bg-gold-gradient/20 rounded-lg blur-xl" />
                  <img src={heroArtworks[(index + 2) % heroArtworks.length].url} alt={heroArtworks[(index + 2) % heroArtworks.length].name} className="relative w-44 h-56 object-cover rounded-lg shadow-2xl border-2 border-gold-400/50" />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="absolute bottom-8 right-12 flex gap-2">
            {heroArtworks.map((_, index) => (
              <button key={index} onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-gold-400' : 'w-1.5 bg-rice-300/50'}`} />
            ))}
          </div>
        </div>
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-400/40 bg-gold-500/10 mb-6">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-200">专业文玩艺术品鉴定平台</span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 bg-clip-text text-transparent text-shadow-gold">鉴真</span>
              <span className="text-rice-100 mx-2">·</span>
              <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 bg-clip-text text-transparent text-shadow-gold">传承</span>
              <span className="text-rice-100 mx-2">·</span>
              <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 bg-clip-text text-transparent text-shadow-gold">立信</span>
            </h1>
            <p className="text-base text-rice-200/80 mb-8 leading-relaxed">
              汇聚国家级鉴定专家，AI智能初筛辅助，区块链存证溯源。
              <br />为每一件藏品，出具权威可信的身份证明。
            </p>
            <div className="flex gap-4">
              <Link to="/appraise" className="group inline-flex items-center gap-2 px-7 py-3 bg-gold-gradient text-jade-900 rounded-md font-semibold hover:shadow-gold-glow transition-all duration-300 hover:scale-[1.02]">
                立即鉴定 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="inline-flex items-center gap-2 px-7 py-3 border border-gold-400/50 text-gold-200 rounded-md font-medium hover:bg-gold-500/10 transition-all duration-300">了解更多</button>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-rice-100 to-transparent" />
      </motion.section>

      {/* ========== Section 2: 快速鉴定 + AI 初筛 ========== */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="container -mt-12 relative z-20 mb-20">
        <motion.div variants={fadeInUp} className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #F8F4E9 0%, #F0E6D2 50%, #F8F4E9 100%)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          }}
        >
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            border: '2px dashed transparent',
            backgroundImage: `linear-gradient(#F8F4E9, #F8F4E9), repeating-linear-gradient(45deg, #C9A961 0px, #C9A961 8px, transparent 8px, transparent 16px, #C9A961 16px, #C9A961 24px, transparent 24px, transparent 32px)`,
            backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', opacity: 0.6,
          }} />
          <div className="relative p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <div className="mb-5">
                  <h3 className="font-serif text-xl font-bold text-jade-700 mb-1">快速鉴定</h3>
                  <p className="text-sm text-jade-500">选择品类或直接上传图片，开启您的藏品鉴定之旅</p>
                </div>
                <motion.div variants={staggerContainer} className="grid grid-cols-6 gap-2 mb-5">
                  {allCategories.map((category) => {
                    const Icon = categoryIcons[category];
                    return (
                      <motion.button key={category} variants={fadeInUp} whileHover={{ y: -3, scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleCategoryClick(category)} className="group flex flex-col items-center gap-1.5"
                      >
                        <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-full bg-rice-50 border-2 border-gold-300 group-hover:border-gold-500 shadow-lg shadow-gold-200/30 flex items-center justify-center transition-all duration-300 group-hover:bg-gold-50">
                          <Icon className="w-4.5 h-4.5 md:w-5 md:h-5 text-jade-600 group-hover:text-gold-600 transition-colors" />
                          <div className="absolute -inset-0.5 rounded-full bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
                        </div>
                        <span className="text-xs font-medium text-jade-600 group-hover:text-gold-600 transition-colors">{categoryLabels[category]}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
                <motion.div variants={fadeInUp}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => navigate('/appraise')}
                  className="relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden mb-5"
                  style={{ borderColor: isDragging ? '#C9A961' : 'rgba(201, 169, 97, 0.4)', backgroundColor: isDragging ? 'rgba(201, 169, 97, 0.08)' : 'rgba(255, 255, 255, 0.5)' }}
                >
                  <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 35px, rgba(201, 169, 97, 0.06) 35px, rgba(201, 169, 97, 0.06) 70px)` }} />
                  <div className="relative py-7 px-5 flex flex-col md:flex-row items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gold-gradient/20 flex items-center justify-center mb-2 md:mb-0">
                      <Upload className="w-6 h-6 text-gold-500" />
                    </div>
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-jade-700">拖拽或点击上传藏品图片</p>
                      <p className="text-xs text-jade-500 mt-0.5">支持 JPG、PNG 格式</p>
                    </div>
                    <div className="hidden md:block h-10 w-px bg-gold-300/50" />
                    <div className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-ink-gradient text-gold-200 rounded-md text-sm font-medium">
                      开始上传 <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={fadeInUp}>
                  <p className="text-sm text-jade-600 font-medium mb-3">
                    <Sparkles className="w-4 h-4 inline mr-1.5 text-gold-500" />示例图片快速体验
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {sampleArtworks.map((sample) => {
                      const Icon = categoryIcons[sample.category];
                      return (
                        <motion.button key={sample.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleSampleClick(sample)}
                          className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedSample?.id === sample.id ? 'border-gold-500 ring-2 ring-gold-400/30' : 'border-gold-200 hover:border-gold-400'
                          }`}
                        >
                          <img src={sample.image} alt={sample.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-jade-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1.5">
                            <span className="text-[10px] text-gold-200 whitespace-nowrap">{categoryLabels[sample.category]}</span>
                          </div>
                          <div className="absolute top-0.5 left-0.5"><Icon className="w-3 h-3 text-gold-300/80" /></div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
              <div className="lg:col-span-5">
                <motion.div variants={fadeInUp} className="h-full rounded-xl border border-gold-200 bg-rice-50/80 backdrop-blur-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gold-200/50 bg-ink-gradient/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4.5 h-4.5 text-gold-600" />
                        <span className="font-serif font-bold text-jade-700">AI 初筛结果</span>
                      </div>
                      <span className="text-xs text-jade-400">实时演示</span>
                    </div>
                  </div>
                  <div className="p-4 min-h-[280px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {!selectedSample && (
                        <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-jade-50 flex items-center justify-center">
                            <Eye className="w-8 h-8 text-jade-300" />
                          </div>
                          <p className="text-sm text-jade-400">点击左侧示例图片</p>
                          <p className="text-sm text-jade-400">体验 AI 初筛</p>
                        </motion.div>
                      )}
                      {isAiLoading && (
                        <motion.div key="loading" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center">
                          <div className="relative w-16 h-16 mx-auto mb-4">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full border-2 border-gold-200 border-t-gold-500" />
                            <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="absolute inset-2 rounded-full border-2 border-transparent border-b-jade-400" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-gold-500" />
                            </div>
                          </div>
                          <p className="font-medium text-jade-700">AI 识别中...</p>
                          <p className="text-xs text-jade-400 mt-1">正在分析器型、纹饰、胎釉特征</p>
                        </motion.div>
                      )}
                      {aiResult && !isAiLoading && (
                        <motion.div key="result" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} exit={{ opacity: 0, y: -10 }} className="w-full space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="relative px-3 py-1.5 bg-ink-gradient text-gold-200 rounded-sm font-serif font-bold text-sm" style={{ boxShadow: '0 2px 8px rgba(45, 74, 62, 0.3)' }}>
                              {categoryLabels[aiResult.category]}·{aiResult.era.split('年')[0]}
                              <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-gold-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-jade-500">置信度</span>
                                <span className="font-semibold text-gold-600">{aiResult.confidence}%</span>
                              </div>
                              <div className="progress-bar h-1.5">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${aiResult.confidence}%` }} transition={{ duration: 1, delay: 0.2 }} className="progress-fill" />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-rice-100 rounded-md">
                              <p className="text-jade-400 mb-1">年代推测</p>
                              <p className="font-medium text-jade-700">{aiResult.era}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <div className="flex-1 h-1 bg-rice-200 rounded-full overflow-hidden"><div className="h-full bg-jade-500 rounded-full" style={{ width: '85%' }} /></div>
                                <span className="text-[10px] text-jade-400">87.5%</span>
                              </div>
                            </div>
                            <div className="p-2 bg-rice-100 rounded-md">
                              <p className="text-jade-400 mb-1">真伪初判</p>
                              {(() => {
                                const badge = getConclusionBadge(aiResult.authenticity);
                                const BadgeIcon = badge.Icon;
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <BadgeIcon className={`w-4 h-4 text-${badge.className.replace('bg-', '')}`} />
                                    <span className="font-medium text-jade-700">{badge.label}</span>
                                  </div>
                                );
                              })()}
                              <div className="flex gap-1 mt-1.5">
                                <div className="flex-1 h-1.5 bg-jade-400 rounded-full" style={{ opacity: aiResult.authenticity === AuthenticityLevel.GENUINE ? 1 : 0.3 }} />
                                <div className="flex-1 h-1.5 bg-gold-400 rounded-full" style={{ opacity: aiResult.authenticity === AuthenticityLevel.SUSPICIOUS ? 1 : 0.3 }} />
                                <div className="flex-1 h-1.5 bg-cinnabar-400 rounded-full" style={{ opacity: aiResult.authenticity === AuthenticityLevel.FAKE ? 1 : 0.3 }} />
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-jade-500 mb-2">AI 识别特征</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {aiFeatures.map((feature, idx) => {
                                const Icon = feature.icon;
                                return (
                                  <div key={idx} className="flex items-center gap-1.5 text-xs text-jade-600">
                                    <Icon className="w-3.5 h-3.5 text-gold-500" />
                                    <span>{feature.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gold-200/50">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {mockExperts.slice(0, 3).map((expert, i) => (
                                  <div key={expert.id} className="w-7 h-7 rounded-full border-2 border-rice-50 bg-jade-100 overflow-hidden">
                                    <img src={`https://picsum.photos/seed/expert_res${i}/40/40`} alt={expert.name} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                              <span className="text-xs text-jade-500">查看全部 8 位</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-jade-400" />
                          </div>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => handleCategoryClick(aiResult.category)}
                            className="w-full py-2.5 bg-gold-gradient text-jade-900 rounded-md font-semibold text-sm hover:shadow-gold-glow transition-all"
                          >立即找专家鉴定</motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ========== Section 3: 鉴定流程 ========== */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="container py-6 mb-16">
        <motion.div variants={fadeInUp} className="text-center mb-10">
          <h2 className="section-title">鉴定流程</h2>
          <p className="section-subtitle mb-0">四步专业流程，保障鉴定权威可信</p>
        </motion.div>
        <div className="relative">
          <div className="hidden md:block absolute top-[38px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {processSteps.map((step, index) => (
              <motion.div key={index} variants={fadeInUp} className="relative text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink-gradient border-2 border-gold-400 shadow-gold-glow mb-4">
                  <div className="absolute inset-0 rounded-full bg-gold-gradient opacity-0 hover:opacity-20 transition-opacity" />
                  <step.icon className="w-7 h-7 text-gold-400 relative z-10" />
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gold-gradient text-jade-900 text-xs font-bold flex items-center justify-center shadow-lg">{index + 1}</span>
                </div>
                <h3 className="font-serif text-base font-semibold text-jade-700 mb-1">{step.title}</h3>
                <p className="text-jade-500 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ========== Section 4: 专家竞价 + SLA ========== */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="bg-jade-50/50 py-16 border-y border-gold-200/50 mb-20">
        <div className="container">
          <motion.div variants={fadeInUp} className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title mb-1">正在进行中的鉴定</h2>
              <p className="text-jade-500 text-sm">实时展示平台鉴定订单动态</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jade-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-jade-500" />
              </span>
              <span className="text-jade-600 font-medium">实时更新</span>
            </div>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status, order.slaRemaining);
              const isUrgent = order.slaRemaining < 300;
              const CatIcon = categoryIcons[order.category] || Package;
              const slaProgress = (order.slaRemaining / order.slaTotal) * 100;
              return (
                <motion.div key={order.id} variants={fadeInUp} custom={index} whileHover={{ y: -2 }}
                  className={`card card-hover p-4 border-l-4 ${statusConfig.borderClass}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full border-2 border-gold-300 overflow-hidden bg-rice-100">
                        <img src={order.image} alt={order.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-ink-gradient rounded text-[10px] text-gold-200 whitespace-nowrap">
                        <CatIcon className="w-3 h-3 inline mr-0.5" />{categoryLabels[order.category]}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-jade-700 text-sm line-clamp-1 flex-1">{order.name}</h4>
                        <span className={`shrink-0 px-2 py-0.5 text-xs text-white rounded ${statusConfig.labelClass}`}>{statusConfig.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-jade-500 mb-2">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />已有 {order.bidCount} 位专家报价</span>
                        <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />¥{order.minPrice}-{order.maxPrice}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-jade-400">SLA 倒计时</span>
                            <span className={`font-mono font-bold ${isUrgent ? 'text-cinnabar-500' : 'text-jade-600'}`}>{formatTime(order.slaRemaining)}</span>
                          </div>
                          <div className="h-1.5 bg-rice-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-cinnabar-500' : slaProgress > 50 ? 'bg-jade-500' : 'bg-gold-500'}`} style={{ width: `${slaProgress}%` }} />
                          </div>
                        </div>
                        <div className="flex -space-x-2">
                          {order.experts.slice(0, 3).map((expert, i) => (
                            <div key={i} className="w-7 h-7 rounded-full border-2 border-rice-50 bg-jade-100 overflow-hidden" title={expert.name}>
                              <img src={expert.avatar} alt={expert.name} className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {order.expertCount > 3 && (
                            <div className="w-7 h-7 rounded-full border-2 border-rice-50 bg-gold-100 flex items-center justify-center text-[10px] text-gold-700 font-medium">+{order.expertCount - 3}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gold-200/50 flex justify-end">
                    <button onClick={() => navigate(`/appraise`)} className="inline-flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium">
                      查看竞价 <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ========== Section 5: 证书查询 + 防伪预览 ========== */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="container mb-20">
        <motion.div variants={fadeInUp}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="card p-6">
              <h3 className="font-serif text-xl font-bold text-jade-700 mb-1">证书快速查询</h3>
              <p className="text-jade-500 text-sm mb-5">输入证书编号，立即验证您的鉴定证书真伪</p>
              <div className="flex gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-jade-400" />
                  <input type="text" value={certInput} onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCertSearch()}
                    placeholder="请输入证书编号" className="input-field pl-10 pr-4 py-2.5 text-sm" />
                </div>
                <button onClick={handleCertSearch} className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-gradient text-gold-200 rounded-md text-sm font-medium hover:shadow-gold-glow transition-all">
                  立即查询 <Search className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="text-xs text-jade-500 mb-2">示例证书编号（点击可填充）：</p>
                <div className="flex flex-wrap gap-2">
                  {sampleCertNos.map((no) => (
                    <button key={no} onClick={() => setCertInput(no)}
                      className="px-2.5 py-1 bg-rice-100 border border-gold-200 rounded-md text-xs text-jade-600 hover:border-gold-400 hover:bg-gold-50 transition-all font-mono">
                      {no}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <motion.div variants={fadeInUp} className="relative">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative rounded-xl overflow-hidden border border-gold-300 shadow-gold-glow/20"
                style={{ background: 'linear-gradient(135deg, #F8F4E9 0%, #EDE3CE 100%)' }}
              >
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.15 }}>
                  <div className="absolute inset-0" style={{ transform: 'rotate(-20deg) scale(1.5)' }}>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex gap-12 py-6 whitespace-nowrap">
                        {[...Array(4)].map((_, j) => (
                          <span key={j} className="font-serif text-2xl font-black text-gold-600 tracking-widest">鉴真阁</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative z-10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-ink-gradient flex items-center justify-center">
                        <Shield className="w-4 h-4 text-gold-400" />
                      </div>
                      <span className="font-serif font-bold text-jade-700">鉴真阁</span>
                    </div>
                    <span className="text-xs font-mono text-jade-500">JZG-202406-00128</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-24 rounded border border-gold-300/60 overflow-hidden bg-rice-100 shrink-0">
                      <img src="https://picsum.photos/seed/cert_art/80/100" alt="藏品" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-jade-700 mb-1">清乾隆青花赏瓶</h4>
                      <p className="text-xs text-jade-500 mb-2">陶瓷 · 青花瓷</p>
                      <div className="relative inline-block">
                        <div className="w-12 h-12 rounded-full border-2 border-cinnabar-500/70 flex items-center justify-center bg-cinnabar-500/5 transform rotate-[-8deg]">
                          <span className="text-cinnabar-600 font-serif font-bold text-xs">真品</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gold-200/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-jade-500">专家签名：<span className="font-serif text-jade-700">张明德</span></span>
                      <div className="flex items-center gap-1 text-jade-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-jade-500" />已上链
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-rice-200 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-jade-400 via-gold-400 to-jade-400 rounded-full opacity-50" />
                      </div>
                      <span className="font-mono text-[10px] text-jade-400">0x8f3a...7f9</span>
                    </div>
                  </div>
                  <div className="mt-3 text-right">
                    <Link to="/certificate/JZG-202406-00128" className="inline-flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium">
                      查看完整证书 <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* ========== Section 6: 知识库三维检索 ========== */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="bg-jade-50/50 py-16 border-y border-gold-200/50 mb-20">
        <div className="container">
          <motion.div variants={fadeInUp} className="text-center mb-8">
            <h2 className="section-title">行家知识库</h2>
            <p className="section-subtitle mb-0">名家经验分享，收藏知识宝库</p>
          </motion.div>
          <motion.div variants={fadeInUp} className="mb-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-jade-600 w-16">按年代</span>
                <div className="flex flex-wrap gap-1.5">
                  {eraFilters.map((era) => (
                    <button key={era} onClick={() => { setActiveEraFilter(era); setKnowledgeTab('era'); }}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                        activeEraFilter === era && knowledgeTab === 'era'
                          ? 'bg-gold-gradient text-jade-900 font-medium shadow-gold-glow/30'
                          : 'bg-rice-100 text-jade-600 border border-gold-200 hover:border-gold-400'
                      }`}
                    >{era}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-jade-600 w-16">按工艺</span>
                <div className="flex flex-wrap gap-1.5">
                  {craftFilters.map((craft) => (
                    <button key={craft} onClick={() => { setActiveCraftFilter(craft); setKnowledgeTab('craft'); }}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                        activeCraftFilter === craft && knowledgeTab === 'craft'
                          ? 'bg-gold-gradient text-jade-900 font-medium shadow-gold-glow/30'
                          : 'bg-rice-100 text-jade-600 border border-gold-200 hover:border-gold-400'
                      }`}
                    >{craft}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-jade-600 w-16">按真伪</span>
                <div className="flex flex-wrap gap-1.5">
                  {authenticityFilters.map((auth) => (
                    <button key={auth} onClick={() => { setActiveAuthFilter(auth); setKnowledgeTab('authenticity'); }}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                        activeAuthFilter === auth && knowledgeTab === 'authenticity'
                          ? 'bg-gold-gradient text-jade-900 font-medium shadow-gold-glow/30'
                          : 'bg-rice-100 text-jade-600 border border-gold-200 hover:border-gold-400'
                      }`}
                    >{auth}</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredArticles.map((article, index) => (
                  <motion.article key={article.id} variants={fadeInUp} whileHover={{ y: -4 }}
                    className="card card-hover group cursor-pointer"
                    onClick={() => navigate(`/knowledge/${article.id}`)}
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img src={`https://picsum.photos/seed/know${index + 10}/400/300`} alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 left-2">
                        <span className="seal-tag">{categoryLabels[article.category]}</span>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-jade-700/80 text-gold-200 text-xs rounded">{article.era}</div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-serif text-sm font-semibold text-jade-700 line-clamp-2 group-hover:text-gold-600 transition-colors mb-1.5">{article.title}</h3>
                      <p className="text-xs text-jade-500 line-clamp-2 mb-2">{article.content.split('\n')[0]}</p>
                      <div className="flex items-center justify-between text-xs text-jade-400">
                        <span>{article.author}</span>
                        <span className="flex items-center gap-0.5">阅读全文 <ChevronRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
            <div>
              <div className="card p-4">
                <h3 className="font-serif font-bold text-jade-700 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4.5 h-4.5 text-gold-500" />热门 FAQ
                </h3>
                <div className="space-y-2">
                  {faqList.map((faq, idx) => (
                    <div key={idx} className="border border-gold-200 rounded-lg overflow-hidden">
                      <button onClick={() => setExpandedFaq(expandedFaq === idx ? -1 : idx)}
                        className="w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-gold-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-jade-700 flex-1">{faq.question}</span>
                        {expandedFaq === idx ? <ChevronUp className="w-4 h-4 text-gold-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-jade-400 shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {expandedFaq === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 text-sm text-jade-600 leading-relaxed border-t border-gold-100 pt-2">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========== Section 7: 藏品价值快速评估 ========== */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="container mb-20">
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <h2 className="section-title">藏品价值快速评估</h2>
          <p className="section-subtitle mb-0">智能估值引擎，即时获取藏品市场参考价</p>
        </motion.div>
        <motion.div variants={fadeInUp} className="card p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-serif font-bold text-jade-700 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-gold-500" />选择藏品参数
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-jade-600 mb-1.5">品类</label>
                  <select value={valuationCategory} onChange={(e) => setValuationCategory(e.target.value as Category)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gold-200 bg-rice-50 text-jade-700 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400">
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-jade-600 mb-1.5">年代</label>
                  <select value={valuationEra} onChange={(e) => setValuationEra(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gold-200 bg-rice-50 text-jade-700 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400">
                    {Object.keys(eraFactors).map((era) => (
                      <option key={era} value={era}>{era}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-jade-600 mb-1.5">品相</label>
                  <select value={valuationCondition} onChange={(e) => setValuationCondition(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gold-200 bg-rice-50 text-jade-700 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400">
                    {Object.keys(conditionFactors).map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleValuation} disabled={isValuating}
                  className="w-full py-3 bg-gold-gradient text-jade-900 rounded-lg font-bold text-sm hover:shadow-gold-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {isValuating ? '估值计算中...' : '立即估值'}
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-jade-700 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold-500" />估值结果
              </h3>
              <div className="rounded-xl border border-gold-200 bg-rice-50/60 min-h-[300px] flex items-center justify-center p-5">
                {!valuationResult && !isValuating && (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-jade-50 flex items-center justify-center">
                      <Calculator className="w-8 h-8 text-jade-300" />
                    </div>
                    <p className="text-sm text-jade-400">选择参数后点击「立即估值」</p>
                    <p className="text-sm text-jade-400">获取藏品市场参考价</p>
                  </div>
                )}
                {isValuating && (
                  <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full border-2 border-gold-200 border-t-gold-500" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-gold-500" />
                      </div>
                    </div>
                    <p className="font-medium text-jade-700">智能估值中...</p>
                    <p className="text-xs text-jade-400 mt-1">正在综合分析市场数据</p>
                  </div>
                )}
                {valuationResult && !isValuating && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4">
                    <div className="text-center">
                      <p className="text-xs text-jade-500 mb-1">估值区间</p>
                      <p className="font-serif text-3xl font-black bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 bg-clip-text text-transparent">
                        ¥{valuationResult.min.toLocaleString()} - ¥{valuationResult.max.toLocaleString()}
                      </p>
                      <p className="text-sm text-jade-600 mt-1">中位价：<span className="font-semibold text-gold-600">¥{valuationResult.median.toLocaleString()}</span></p>
                    </div>
                    <div className="space-y-2.5">
                      {valuationResult.factors.map((factor, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-jade-600">{factor.label}</span>
                          {renderStars(factor.value)}
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-rice-100 rounded-lg border border-gold-200/50">
                      <p className="text-xs text-jade-500">
                        <TrendingUp className="w-3.5 h-3.5 inline mr-1 text-gold-500" />
                        拍卖参考：近半年同类成交 <span className="font-semibold text-gold-600">{valuationResult.auctionCount}</span> 件，最高 <span className="font-semibold text-gold-600">¥{valuationResult.maxAuction.toLocaleString()}</span>
                      </p>
                    </div>
                    <Link to="/valuation" className="flex items-center justify-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium">
                      查看详细估值报告 <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ========== Section 8: 藏品分类入口 ========== */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="bg-jade-50/50 py-16 border-y border-gold-200/50 mb-20">
        <div className="container">
          <motion.div variants={fadeInUp} className="text-center mb-8">
            <h2 className="section-title">藏品分类</h2>
            <p className="section-subtitle mb-0">十二大门类，专业鉴定全覆盖</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allCategories.map((cat) => {
              const Icon = categoryIcons[cat];
              const count = expertCountByCategory[cat] || 0;
              return (
                <motion.div key={cat} variants={fadeInUp} whileHover={{ y: -4, boxShadow: '0 0 0 1px rgba(201,169,97,0.5)' }}
                  onClick={() => handleCategoryClick(cat)}
                  className="card card-hover p-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gold-gradient/20 flex items-center justify-center border border-gold-200 group-hover:border-gold-400 transition-colors">
                      <Icon className="w-5 h-5 text-jade-600 group-hover:text-gold-600 transition-colors" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-jade-700 group-hover:text-gold-600 transition-colors">{categoryLabels[cat]}</p>
                      <p className="text-xs text-jade-400">{count} 位专家</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cat === Category.CERAMIC && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">青花</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">粉彩</span></>}
                    {cat === Category.JADE && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">和田玉</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">籽料</span></>}
                    {cat === Category.CALLIGRAPHY_PAINTING && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">水墨</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">工笔</span></>}
                    {cat === Category.BRONZE && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">商周</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">铭文</span></>}
                    {cat === Category.COIN && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">古泉</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">机制币</span></>}
                    {cat === Category.ZISHA && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">紫泥</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">朱泥</span></>}
                    {cat === Category.WOOD && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">红木</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">雕件</span></>}
                    {cat === Category.LACQUER && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">剔红</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">螺钿</span></>}
                    {cat === Category.TEXTILE && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">刺绣</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">缂丝</span></>}
                    {cat === Category.STATIONERY && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">端砚</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">徽墨</span></>}
                    {cat === Category.SEAL && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">田黄</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">鸡血</span></>}
                    {cat === Category.MISCELLANEOUS && <><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">鼻烟壶</span><span className="px-1.5 py-0.5 bg-rice-100 text-[10px] text-jade-500 rounded">珐琅</span></>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ========== Section 9: 专家团队 ========== */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="container mb-20">
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <h2 className="section-title">专家团队</h2>
          <p className="section-subtitle mb-0">权威专家坐镇，值得信赖</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockExperts.slice(0, 6).map((expert) => (
            <motion.div key={expert.id} variants={fadeInUp} whileHover={{ y: -4 }}
              className="card card-hover p-5 group"
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full border-2 border-gold-300 overflow-hidden bg-rice-100">
                    <img src={`https://picsum.photos/seed/expert${expert.id}/80/80`} alt={expert.name} className="w-full h-full object-cover" />
                  </div>
                  <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[10px] text-white rounded font-medium ${levelColors[expert.level]}`}>
                    {levelLabels[expert.level]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-bold text-jade-700 group-hover:text-gold-600 transition-colors">{expert.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {expert.categories.slice(0, 2).map((cat) => (
                      <span key={cat} className="px-1.5 py-0.5 bg-gold-50 text-[10px] text-gold-600 rounded border border-gold-200">
                        {categoryLabels[cat] || cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gold-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-jade-400">评分</p>
                  <p className="font-semibold text-jade-700 flex items-center justify-center gap-0.5"><Star className="w-3 h-3 text-gold-500 fill-gold-500" />4.9</p>
                </div>
                <div>
                  <p className="text-jade-400">响应</p>
                  <p className="font-semibold text-jade-700 flex items-center justify-center gap-0.5"><Clock className="w-3 h-3 text-gold-500" />2h</p>
                </div>
                <div>
                  <p className="text-jade-400">完成</p>
                  <p className="font-semibold text-jade-700 flex items-center justify-center gap-0.5"><TrendingUp className="w-3 h-3 text-gold-500" />326</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div variants={fadeInUp} className="mt-8 rounded-xl bg-ink-gradient p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-serif text-lg font-bold text-gold-200 mb-1">成为鉴真阁认证专家</p>
            <p className="text-sm text-gold-300/70">国家级 / 省级 / 行内资深 三级认证体系</p>
          </div>
          <Link to="/join" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold-gradient text-jade-900 rounded-md font-semibold text-sm hover:shadow-gold-glow transition-all">
            申请专家入驻 <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.section>

      {/* ========== Section 10: 服务生态 ========== */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="bg-jade-50/50 py-16 border-y border-gold-200/50 mb-20">
        <div className="container">
          <motion.div variants={fadeInUp} className="text-center mb-8">
            <h2 className="section-title">服务生态</h2>
            <p className="section-subtitle mb-0">后台管理与 B 端开放平台</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Award, title: '专家资质认证', desc: '国家级/省级/行内资深三级认证审核', stat1: '本月审核 48 名', stat2: '待审核 12 名', link: '/admin/experts' },
              { icon: Gavel, title: '鉴定纠纷仲裁', desc: '三级仲裁机制保障鉴定公正', stat1: '待处理 3 件', stat2: '平均结案 48.5h', link: '/admin/disputes' },
              { icon: FileText, title: '证书模板配置', desc: '6套官方模板可自定义', stat1: '6 套模板', stat2: '可视化编辑', link: '/admin/templates' },
              { icon: Building2, title: 'B端开放平台', desc: '博物馆批量初鉴·电商品控·拍卖行筛查', stat1: '合作机构 128 家', stat2: '日调用 50万+', link: '/openapi' },
            ].map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <motion.div key={idx} variants={fadeInUp} whileHover={{ y: -4, boxShadow: '0 0 0 1px rgba(201,169,97,0.5)' }}
                  className="card card-hover p-5 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gold-gradient/20 flex items-center justify-center border border-gold-200 mb-4">
                    <ItemIcon className="w-6 h-6 text-gold-600" />
                  </div>
                  <h4 className="font-serif font-bold text-jade-700 group-hover:text-gold-600 transition-colors mb-1.5">{item.title}</h4>
                  <p className="text-xs text-jade-500 mb-3 leading-relaxed">{item.desc}</p>
                  <div className="space-y-1 mb-4">
                    <p className="text-xs text-jade-500">· <span className="font-semibold text-gold-600">{item.stat1.split(' ').slice(0, -1).join(' ')}</span> {item.stat1.split(' ').slice(-1)}</p>
                    <p className="text-xs text-jade-500">· <span className="font-semibold text-gold-600">{item.stat2.split(' ').slice(0, -1).join(' ')}</span> {item.stat2.split(' ').slice(-1)}</p>
                  </div>
                  <Link to={item.link} className="inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium">
                    进入 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ========== Section 11: 平台数据统计 ========== */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="container py-16 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const StatIcon = stat.icon;
            return (
              <motion.div key={idx} variants={fadeInUp} className="text-center p-6 card">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold-gradient/20 flex items-center justify-center border border-gold-200">
                  <StatIcon className="w-6 h-6 text-gold-600" />
                </div>
                <p className="font-serif text-2xl md:text-3xl font-black bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-jade-500 mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}