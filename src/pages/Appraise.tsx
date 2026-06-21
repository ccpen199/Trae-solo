import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  ChevronRight,
  Clock,
  Star,
  BarChart3,
  Sparkles,
  Shield,
  Clock3,
  User,
  Users,
  Send,
  CheckCircle2,
  Hourglass,
  Search,
  FileText,
  Award,
  Cpu,
  Calendar,
  Eye,
  Brush,
  Crown,
  Landmark,
  Palette,
  Scissors,
  Shirt,
  PenTool,
  Stamp,
  Coffee,
  Hash,
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { mockExperts, mockAIScreenResult } from '@/lib/mockData';
import { ExpertLevel, Category, AuthenticityLevel } from '../../shared/types';
import type { Expert } from '../../shared/types';
import { cn } from '@/lib/utils';

const categories = [
  { name: Category.CERAMIC, icon: Crown },
  { name: Category.JADE, icon: Eye },
  { name: Category.CALLIGRAPHY_PAINTING, icon: Brush },
  { name: Category.BRONZE, icon: Landmark },
  { name: Category.COIN, icon: Hash },
  { name: Category.MISCELLANEOUS, icon: Palette },
  { name: Category.WOOD, icon: Scissors },
  { name: Category.LACQUER, icon: Shield },
  { name: Category.TEXTILE, icon: Shirt },
  { name: Category.STATIONERY, icon: PenTool },
  { name: Category.SEAL, icon: Stamp },
  { name: Category.ZISHA, icon: Coffee },
];

const expertLevelConfig: Record<ExpertLevel, { label: string; bg: string; text: string; border: string }> = {
  [ExpertLevel.NATIONAL]: {
    label: '国家级专家',
    bg: 'bg-cinnabar-400',
    text: 'text-white',
    border: 'border-cinnabar-400',
  },
  [ExpertLevel.PROVINCIAL]: {
    label: '省级专家',
    bg: 'bg-gold-gradient',
    text: 'text-white',
    border: 'border-gold-400',
  },
  [ExpertLevel.SENIOR]: {
    label: '资深专家',
    bg: 'bg-jade-600',
    text: 'text-white',
    border: 'border-jade-600',
  },
};

type UploadedImage = {
  id: string;
  url: string;
  name: string;
};

type TimelineStep = {
  id: number;
  title: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending';
  hint?: string;
};

export default function Appraise() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.CERAMIC);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [artworkName, setArtworkName] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [matchedExperts] = useState<Expert[]>(() => {
    const shuffled = [...mockExperts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  });

  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [slaSeconds, setSlaSeconds] = useState(30 * 60);
  const [timelineStatus, setTimelineStatus] = useState<0 | 1 | 2 | 3>(1);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; from: 'user' | 'expert'; time: string }[]>([]);

  useEffect(() => {
    if (step !== 4 || timelineStatus >= 3) return;
    const timer = setInterval(() => {
      setSlaSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timelineStatus]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const remaining = 9 - uploadedImages.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const newImages: UploadedImage[] = toAdd.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setUploadedImages((prev) => [...prev, ...newImages]);
  }, [uploadedImages.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmitToAI = () => {
    setIsLoading(true);
    setDirection('right');
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 2000);
  };

  const goToStep = (next: 1 | 2 | 3 | 4) => {
    setDirection(next > step ? 'right' : 'left');
    setStep(next);
  };

  const handleSelectExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setDirection('right');
    setStep(4);
  };

  const handleSimulateAccept = () => {
    setTimelineStatus(2);
    setAcceptedAt(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleSimulateComplete = () => {
    setTimelineStatus(3);
    setCompletedAt(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { text: message.trim(), from: 'user', time: now }]);
    setMessage('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: '您好，我已收到您的藏品资料，正在仔细鉴定中，请稍候~', from: 'expert', time: now },
      ]);
    }, 1200);
  };

  const timelineSteps: TimelineStep[] = [
    { id: 0, title: '订单已创建', icon: <CheckCircle2 className="w-5 h-5" />, status: timelineStatus > 0 ? 'completed' : 'current' },
    {
      id: 1,
      title: '等待专家接单',
      icon: <Hourglass className="w-5 h-5" />,
      status: timelineStatus === 1 ? 'current' : timelineStatus > 1 ? 'completed' : 'pending',
      hint: timelineStatus === 1 ? '专家预计 2 分钟内响应' : undefined,
    },
    {
      id: 2,
      title: '专家鉴定中',
      icon: <Search className="w-5 h-5" />,
      status: timelineStatus === 2 ? 'current' : timelineStatus > 2 ? 'completed' : 'pending',
    },
    {
      id: 3,
      title: '出具鉴定证书',
      icon: <FileText className="w-5 h-5" />,
      status: timelineStatus === 3 ? 'current' : 'pending',
    },
  ];

  const slaProgress = ((30 * 60 - slaSeconds) / (30 * 60)) * 100;

  const stepIndicator = [
    { num: 1, label: '上传藏品' },
    { num: 2, label: 'AI 初筛' },
    { num: 3, label: '选专家' },
    { num: 4, label: '跟踪' },
  ];

  const pageVariants = {
    initial: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? 60 : -60,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? -60 : 60,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' },
    }),
  };

  const renderLoadingOverlay = () => (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-rice-50/95 backdrop-blur-sm"
        >
          <div className="text-center">
            <div className="relative w-40 h-40 mx-auto mb-8">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.3, 1], opacity: [0, 0.6, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-jade-300 via-gold-300 to-cinnabar-300 blur-2xl"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="relative w-40 h-40 rounded-full border-4 border-dashed border-gold-400 flex items-center justify-center bg-rice-50/80"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.1, 0.9, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-jade-600 via-jade-700 to-ink-gradient flex items-center justify-center shadow-scroll"
                  >
                    <Cpu className="w-10 h-10 text-gold-300" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-serif text-2xl font-bold text-jade-700 mb-2"
            >
              AI 智能分析中
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-jade-500 mb-6"
            >
              正在比对百万级藏品特征库，请稍候...
            </motion.p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '280px' }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              className="h-1 mx-auto rounded-full bg-gradient-to-r from-jade-400 via-gold-400 to-cinnabar-400"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2 md:gap-4">
        {stepIndicator.map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                scale: step === s.num ? 1.08 : 1,
              }}
              className="flex items-center gap-2 md:gap-3"
            >
              <div
                className={cn(
                  'w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-serif text-sm md:text-base font-bold border-2 transition-all duration-300',
                  step >= s.num
                    ? 'bg-ink-gradient text-gold-300 border-gold-400 shadow-gold-glow'
                    : 'bg-rice-100 text-jade-400 border-gold-200',
                )}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : s.num}
              </div>
              <span
                className={cn(
                  'hidden sm:block font-medium text-sm md:text-base transition-colors',
                  step >= s.num ? 'text-jade-700' : 'text-jade-400',
                )}
              >
                {s.label}
              </span>
            </motion.div>
            {idx < stepIndicator.length - 1 && (
              <div className="w-8 md:w-16 mx-1 md:mx-2">
                <div className="h-0.5 rounded-full bg-rice-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: step > s.num ? '100%' : '0%' }}
                    transition={{ duration: 0.4 }}
                    className="h-full bg-gold-gradient"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <motion.div
      key="step1"
      custom={direction}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="mb-6 text-center">
        <Tag variant="gold" className="mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          第一步 · 上传藏品
        </Tag>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">
          选择品类并上传图片
        </h2>
        <p className="text-jade-500 text-sm md:text-base">请先选择藏品所属品类，再上传多角度高清图片</p>
      </div>

      <div className="mb-6">
        <label className="label-field">选择藏品品类</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.name;
            return (
              <motion.button
                key={cat.name}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border-2 transition-all duration-300',
                  active
                    ? 'border-gold-400 bg-gold-50 shadow-gold-glow'
                    : 'border-gold-200 bg-rice-50 hover:border-gold-300 hover:bg-gold-50/50',
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors',
                    active ? 'bg-ink-gradient text-gold-300' : 'bg-jade-50 text-jade-600',
                  )}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span
                  className={cn(
                    'text-xs md:text-sm font-medium',
                    active ? 'text-jade-700' : 'text-jade-500',
                  )}
                >
                  {cat.name}
                </span>
                {active && (
                  <motion.div
                    layoutId="category-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold-500"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <Card className="mb-6">
        <Card.Content className="p-5 md:p-6">
          <label className="label-field">上传藏品图片（最多9张，建议多角度拍摄）</label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => uploadedImages.length < 9 && fileInputRef.current?.click()}
            className={cn(
              'relative rounded-xl border-2 border-dashed p-6 md:p-10 text-center cursor-pointer transition-all duration-300 bg-paper overflow-hidden',
              isDragging
                ? 'border-gold-500 bg-gold-50/60 scale-[1.01] shadow-gold-glow'
                : uploadedImages.length < 9
                  ? 'border-gold-400 hover:border-gold-500 hover:bg-gold-50/30'
                  : 'border-gold-200 cursor-default bg-rice-100',
            )}
          >
            <div className="absolute inset-0 opacity-30 pointer-events-none watermark-text" />
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-gold-400 rounded-tl" />
              <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-gold-400 rounded-tr" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-gold-400 rounded-bl" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-gold-400 rounded-br" />
            </div>

            {uploadedImages.length === 0 ? (
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ink-gradient flex items-center justify-center shadow-scroll">
                  <Upload className="w-8 h-8 text-gold-300" />
                </div>
                <p className="font-serif text-lg font-semibold text-jade-700 mb-1">拖拽图片到此处</p>
                <p className="text-sm text-jade-500 mb-3">或点击选择文件 · JPG / PNG · 单张不超过 10MB</p>
                <Badge variant="warning" dot>
                  建议上传：正面、背面、底足、细节各1张
                </Badge>
              </div>
            ) : (
              <div className="relative grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {uploadedImages.map((img, i) => (
                  <motion.div
                    key={img.id}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gold-300 shadow-scroll group"
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(img.id);
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-cinnabar-500 text-white flex items-center justify-center shadow-seal opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cinnabar-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/50 text-white text-xs font-medium">
                      #{i + 1}
                    </div>
                  </motion.div>
                ))}
                {uploadedImages.length < 9 && (
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: uploadedImages.length * 0.04 }}
                    className="aspect-square rounded-lg border-2 border-dashed border-gold-300 bg-rice-100/70 flex flex-col items-center justify-center text-jade-500 hover:bg-gold-50 hover:border-gold-400 transition-colors"
                  >
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">
                      {uploadedImages.length}/9
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </Card.Content>
      </Card>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="label-field">藏品名称</label>
          <Input
            placeholder="例如：青花缠枝莲纹梅瓶"
            value={artworkName}
            onChange={(e) => setArtworkName(e.target.value)}
            leftIcon={<FileText className="w-4 h-4" />}
          />
        </div>
        <div>
          <label className="label-field">尺寸 / 来源（选填）</label>
          <Input
            placeholder="例如：高35cm，家传旧藏"
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="label-field">补充描述</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请详细描述藏品的来历、特征、瑕疵等情况，越详细越有助于专家鉴定..."
          className="input-field w-full resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-jade-500">
          <Shield className="w-4 h-4 text-gold-500" />
          <span>所有图片已加密存储，严格保护隐私</span>
        </div>
        <Button
          size="lg"
          disabled={uploadedImages.length === 0}
          onClick={handleSubmitToAI}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          提交 AI 分析
        </Button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => {
    const { categoryConfidence, era, eraConfidence, authenticity, authenticityConfidence, features } = mockAIScreenResult;

    const authenticityLevels = [
      { key: AuthenticityLevel.GENUINE, label: '真品倾向', color: 'from-jade-400 to-jade-600' },
      { key: AuthenticityLevel.SUSPICIOUS, label: '存疑', color: 'from-gold-300 to-gold-500' },
      { key: AuthenticityLevel.FAKE, label: '仿品倾向', color: 'from-cinnabar-300 to-cinnabar-500' },
    ];

    const authenticityValue =
      authenticity === AuthenticityLevel.GENUINE
        ? { genuine: 70, suspicious: 20, fake: 10 }
        : authenticity === AuthenticityLevel.SUSPICIOUS
          ? { genuine: 25, suspicious: 50, fake: 25 }
          : { genuine: 15, suspicious: 25, fake: 60 };

    const analysisId = `AI-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    return (
      <motion.div
        key="step2"
        custom={direction}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="mb-6 text-center">
          <Tag variant="jade" className="mb-3">
            <Cpu className="w-3.5 h-3.5" />
            第二步 · AI 初筛结果
          </Tag>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">智能识别分析报告</h2>
          <p className="text-jade-500 text-sm md:text-base">基于百万级藏品特征库比对，仅供专家参考</p>
        </div>

        <Card className="mb-5 overflow-visible">
          <Card.Content className="p-5 md:p-6">
            <div className="flex items-start gap-4 md:gap-6 flex-col md:flex-row">
              <div className="flex-shrink-0 relative">
                <motion.div
                  initial={{ rotate: -8, scale: 0.85 }}
                  animate={{ rotate: -3, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center"
                >
                  <div className="absolute inset-0 rounded-lg bg-cinnabar-400 rotate-3 shadow-seal" />
                  <div className="absolute inset-0.5 rounded-md border-2 border-cinnabar-200/60" />
                  <div className="absolute inset-1.5 rounded-sm border border-cinnabar-200/40" />
                  <div className="relative text-center">
                    <div
                      className="font-serif text-xl md:text-2xl font-black text-white tracking-widest drop-shadow-sm"
                      style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
                    >
                      {mockAIScreenResult.category}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-serif text-xl font-bold text-jade-700">品类识别</span>
                  <Badge variant="success" dot>置信度高</Badge>
                </div>
                <p className="text-sm text-jade-500 mb-3">AI 模型综合视觉特征比对结果</p>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-jade-600">匹配度</span>
                  <span className="font-bold text-gold-600">{(categoryConfidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-4 rounded-full bg-rice-200 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${categoryConfidence * 100}%` }}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                    className="h-full rounded-full relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(90deg, #DBB85E 0%, #C9A961 50%, #A08544 100%)',
                      boxShadow: '0 0 12px rgba(201,169,97,0.6)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <Card>
            <Card.Content className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-porcelain-100 text-porcelain-600 flex items-center justify-center">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="font-serif text-base font-bold text-jade-700">年代推测</div>
                  <div className="text-xs text-jade-400">基于纹饰与工艺特征比对</div>
                </div>
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-serif text-2xl font-black text-porcelain-700">{era}</span>
                <span className="text-sm text-jade-500">约公元 1436-1464 年</span>
              </div>
              <ProgressBar value={eraConfidence * 100} size="sm" showLabel label={`置信度 ${(eraConfidence * 100).toFixed(0)}%`} />
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-cinnabar-100 text-cinnabar-600 flex items-center justify-center">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="font-serif text-base font-bold text-jade-700">真伪初判</div>
                  <div className="text-xs text-jade-400">综合特征概率分布</div>
                </div>
              </div>
              <div className="flex h-5 rounded-full overflow-hidden mb-2 shadow-inner">
                {authenticityLevels.map((lvl) => (
                  <motion.div
                    key={lvl.key}
                    initial={{ width: 0 }}
                    animate={{ width: `${authenticityValue[lvl.key as keyof typeof authenticityValue]}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${lvl.color} relative`}
                    title={`${lvl.label}: ${authenticityValue[lvl.key as keyof typeof authenticityValue]}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs">
                {authenticityLevels.map((lvl) => (
                  <div key={lvl.key} className="flex items-center gap-1">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        lvl.key === AuthenticityLevel.GENUINE && 'bg-jade-500',
                        lvl.key === AuthenticityLevel.SUSPICIOUS && 'bg-gold-500',
                        lvl.key === AuthenticityLevel.FAKE && 'bg-cinnabar-500',
                      )}
                    />
                    <span className="text-jade-500">
                      {lvl.label} <b className="text-jade-700">{authenticityValue[lvl.key as keyof typeof authenticityValue]}%</b>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gold-200 flex items-center justify-between">
                <span className="text-sm text-jade-500">综合判定置信度</span>
                <Tag variant="outline" className="text-gold-700 font-bold text-sm">
                  {(authenticityConfidence * 100).toFixed(0)}%
                </Tag>
              </div>
            </Card.Content>
          </Card>
        </div>

        <Card className="mb-5">
          <Card.Header>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-500" />
              <Card.Title>AI 识别特征</Card.Title>
              <Card.Description>共识别 {features.length} 项关键特征</Card.Description>
            </div>
          </Card.Header>
          <Card.Content className="p-0">
            <ul className="divide-y divide-gold-100">
              {features.map((feature, i) => {
                const icons = [Eye, Brush, Search, Award, FileCheck2, Palette];
                const Icon = icons[i % icons.length];
                return (
                  <motion.li
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-start gap-3 px-6 py-4 hover:bg-gold-50/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-jade-100 to-gold-100 text-jade-600 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gold-600">特征 #{String(i + 1).padStart(2, '0')}</span>
                        <Badge variant="success" dot className="text-[10px]">匹配</Badge>
                      </div>
                      <p className="text-jade-700 font-medium">{feature}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-jade-300 flex-shrink-0 mt-1.5" />
                  </motion.li>
                );
              })}
            </ul>
          </Card.Content>
        </Card>

        <Card className="mb-6 bg-gradient-to-br from-rice-50 via-gold-50/40 to-rice-50">
          <Card.Content className="p-4 md:p-5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-11 h-11 rounded-full bg-ink-gradient flex items-center justify-center shadow-scroll flex-shrink-0">
                <FileText className="w-5 h-5 text-gold-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-jade-700 mb-0.5">存证说明</div>
                <div className="text-xs text-jade-500">
                  本次分析已生成唯一分析 ID，所有上传图片与识别结果已加密存证，供后续专家参考使用。
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rice-50 border border-gold-300 shadow-inner">
                <Hash className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                <code className="text-xs font-mono text-jade-700 font-bold tracking-wide">{analysisId}</code>
              </div>
            </div>
          </Card.Content>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => goToStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            返回修改
          </Button>
          <Button size="lg" onClick={() => goToStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
            进入专家竞价
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderStep3 = () => (
    <motion.div
      key="step3"
      custom={direction}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="mb-6 text-center">
        <Tag variant="seal" className="mb-3">
          <Users className="w-3.5 h-3.5" />
          第三步 · 专家竞价分派
        </Tag>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">
          为您匹配到 {matchedExperts.length} 位 {mockAIScreenResult.category} 类专家
        </h2>
        <p className="text-jade-500 text-sm md:text-base">按 AI 推荐度排序，选择心仪的专家下单鉴定</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {matchedExperts.map((expert, idx) => {
          const levelCfg = expertLevelConfig[expert.level];
          const isRecommended = idx < 2;
          return (
            <motion.div
              key={expert.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.08, type: 'spring', stiffness: 250 }}
            >
              <Card hoverable className="relative h-full">
                {isRecommended && (
                  <div className="absolute -top-2.5 left-4 z-10">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + idx * 0.08, type: 'spring' }}
                      className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-seal flex items-center gap-1"
                      style={{
                        background: 'linear-gradient(135deg, #A8302A 0%, #8A2823 100%)',
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      AI 优先推荐
                    </motion.div>
                  </div>
                )}

                <Card.Content className="p-5 pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          'w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-scroll overflow-hidden',
                          levelCfg.border,
                        )}
                        style={{
                          background:
                            expert.level === ExpertLevel.NATIONAL
                              ? 'linear-gradient(135deg, #F7E7E6 0%, #EBC4C2 100%)'
                              : expert.level === ExpertLevel.PROVINCIAL
                                ? 'linear-gradient(135deg, #FBF7EC 0%, #F3E8CA 100%)'
                                : 'linear-gradient(135deg, #F0F4F1 0%, #D9E2DB 100%)',
                        }}
                      >
                        <User
                          className={cn(
                            'w-8 h-8',
                            expert.level === ExpertLevel.NATIONAL && 'text-cinnabar-500',
                            expert.level === ExpertLevel.PROVINCIAL && 'text-gold-600',
                            expert.level === ExpertLevel.SENIOR && 'text-jade-600',
                          )}
                        />
                      </div>
                      <div className={cn('absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-scroll', levelCfg.bg)}>
                        {expert.level === ExpertLevel.NATIONAL ? '国' : expert.level === ExpertLevel.PROVINCIAL ? '省' : '资'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-serif text-lg font-bold text-jade-700">{expert.name}</h3>
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', levelCfg.bg, levelCfg.text)}>
                          {levelCfg.label}
                        </span>
                      </div>
                      <div className="flex gap-1 mb-1.5 flex-wrap">
                        {expert.categories.slice(0, 2).map((cat) => (
                          <Tag key={cat} variant="outline" className="text-[10px] px-1.5 py-0.5">
                            {cat}
                          </Tag>
                        ))}
                      </div>
                      <p className="text-xs text-jade-500 line-clamp-1">
                        {expert.level === ExpertLevel.NATIONAL
                          ? '故宫博物院资深研究员，三十余年鉴定经验'
                          : expert.level === ExpertLevel.PROVINCIAL
                            ? '省级文物鉴定委员会委员，眼力独到'
                            : '业内资深藏家，实战经验丰富'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-gold-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                        <span className="font-bold text-jade-700 text-sm">{expert.rating}</span>
                      </div>
                      <div className="text-[10px] text-jade-400">综合评分</div>
                    </div>
                    <div className="text-center border-x border-gold-100">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <Clock className="w-3.5 h-3.5 text-jade-500" />
                        <span className="font-bold text-jade-700 text-sm">{expert.responseTime}<span className="text-[10px]">分</span></span>
                      </div>
                      <div className="text-[10px] text-jade-400">平均响应</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <BarChart3 className="w-3.5 h-3.5 text-jade-500" />
                        <span className="font-bold text-jade-700 text-sm">{expert.orderCount}</span>
                      </div>
                      <div className="text-[10px] text-jade-400">完成单数</div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <div className="text-xs text-jade-400 mb-0.5">专家报价</div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xs text-gold-600 font-bold">¥</span>
                        <span className="font-serif text-3xl font-black text-gold-600 text-shadow-gold">
                          {expert.basePrice}
                        </span>
                        <span className="text-xs text-jade-400 ml-0.5">/次</span>
                      </div>
                    </div>
                    <Badge variant="success" dot className="text-[10px]">
                      <Clock3 className="w-3 h-3 mr-0.5" />
                      30分钟SLA
                    </Badge>
                  </div>

                  <Button
                    fullWidth
                    variant={isRecommended ? 'primary' : 'secondary'}
                    onClick={() => handleSelectExpert(expert)}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    选择此专家下单
                  </Button>
                </Card.Content>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => goToStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          返回 AI 报告
        </Button>
        <div className="flex items-center gap-2 text-sm text-jade-500">
          <Shield className="w-4 h-4 text-gold-500" />
          <span>不满意可全额退款 · 平台担保交易</span>
        </div>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      key="step4"
      custom={direction}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="mb-6 text-center">
        <Tag variant="gold" className="mb-3">
          <FileText className="w-3.5 h-3.5" />
          第四步 · 订单跟踪
        </Tag>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-jade-700 mb-1">鉴定进行中</h2>
        <p className="text-jade-500 text-sm md:text-base">实时跟踪订单进度，专家将在 SLA 时限内完成鉴定</p>
      </div>

      <Card className="mb-5 bg-gradient-to-br from-rice-50 via-cinnabar-50/20 to-rice-50 border-cinnabar-200">
        <Card.Content className="p-5 md:p-6">
          <div className="flex items-center gap-5 md:gap-8 flex-col sm:flex-row">
            <div className="relative flex-shrink-0">
              <svg className="w-28 h-28 md:w-32 md:h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E8DFCA" strokeWidth="6" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#slaGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 52) * (1 - slaProgress / 100) }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(168,48,42,0.5))',
                  }}
                />
                <defs>
                  <linearGradient id="slaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A8302A" />
                    <stop offset="100%" stopColor="#C9A961" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[10px] text-cinnabar-500 font-bold mb-0.5">SLA 倒计时</div>
                <div className="font-mono text-2xl md:text-3xl font-black text-cinnabar-600 tabular-nums">
                  {formatTime(slaSeconds)}
                </div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div>
                  <h3 className="font-serif text-lg font-bold text-jade-700 mb-0.5">
                    {timelineStatus === 3 ? '鉴定已完成' : timelineStatus === 2 ? '专家正在鉴定' : '等待专家接单中'}
                  </h3>
                  <p className="text-xs text-jade-500">
                    订单号：ORD-{Date.now().toString().slice(-10)}
                  </p>
                </div>
                {timelineStatus < 3 && (
                  <Badge variant="warning" dot>
                    {timelineStatus === 1 ? '预计 2 分钟内响应' : '预计 25 分钟内完成'}
                  </Badge>
                )}
                {timelineStatus === 3 && (
                  <Badge variant="success" dot>
                    <CheckCircle2 className="w-3 h-3 mr-0.5" />
                    已完成
                  </Badge>
                )}
              </div>
              <div className="h-3 rounded-full bg-rice-200 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${slaProgress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, #A8302A 0%, #C34B46 50%, #C9A961 100%)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </motion.div>
              </div>
              <div className="flex justify-between text-xs mt-1.5 text-jade-400">
                <span>已用时 {formatTime(30 * 60 - slaSeconds)}</span>
                <span>剩余 {formatTime(slaSeconds)}</span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card className="mb-5">
        <Card.Header>
          <div className="flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-gold-500" />
            <Card.Title>鉴定进度</Card.Title>
          </div>
        </Card.Header>
        <Card.Content className="pt-2 pb-4">
          <div className="relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-rice-200" />
            <div className="space-y-1">
              {timelineSteps.map((ts) => {
                const isCurrent = ts.status === 'current';
                const isCompleted = ts.status === 'completed';
                return (
                  <div key={ts.id} className="relative flex items-start gap-4 py-3">
                    <div
                      className={cn(
                        'relative z-10 w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300',
                        isCompleted && 'bg-jade-600 border-jade-600 text-white shadow-scroll',
                        isCurrent &&
                          'bg-gold-gradient border-gold-400 text-white shadow-gold-glow ring-4 ring-gold-100',
                        ts.status === 'pending' && 'bg-rice-100 border-gold-200 text-jade-300',
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : ts.icon}
                    </div>
                    <div className="flex-1 pt-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={cn(
                            'font-serif text-base font-bold',
                            isCurrent && 'text-gold-600',
                            isCompleted && 'text-jade-700',
                            ts.status === 'pending' && 'text-jade-400',
                          )}
                        >
                          {ts.title}
                        </h4>
                        {isCompleted && ts.id === 1 && acceptedAt && (
                          <span className="text-xs text-jade-400">· {acceptedAt} 接单</span>
                        )}
                        {isCompleted && ts.id === 3 && completedAt && (
                          <span className="text-xs text-jade-400">· {completedAt} 出具证书</span>
                        )}
                      </div>
                      {ts.hint && isCurrent && (
                        <motion.p
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs text-gold-600 mt-0.5 flex items-center gap-1"
                        >
                          <Hourglass className="w-3 h-3" />
                          {ts.hint}
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card.Content>
      </Card>

      {selectedExpert && (
        <Card className="mb-5">
          <Card.Header>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gold-500" />
              <Card.Title>已选专家</Card.Title>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-scroll',
                  expertLevelConfig[selectedExpert.level].border,
                )}
                style={{
                  background:
                    selectedExpert.level === ExpertLevel.NATIONAL
                      ? 'linear-gradient(135deg, #F7E7E6 0%, #EBC4C2 100%)'
                      : selectedExpert.level === ExpertLevel.PROVINCIAL
                        ? 'linear-gradient(135deg, #FBF7EC 0%, #F3E8CA 100%)'
                        : 'linear-gradient(135deg, #F0F4F1 0%, #D9E2DB 100%)',
                }}
              >
                <User
                  className={cn(
                    'w-7 h-7',
                    selectedExpert.level === ExpertLevel.NATIONAL && 'text-cinnabar-500',
                    selectedExpert.level === ExpertLevel.PROVINCIAL && 'text-gold-600',
                    selectedExpert.level === ExpertLevel.SENIOR && 'text-jade-600',
                  )}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-serif text-lg font-bold text-jade-700">{selectedExpert.name}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold',
                      expertLevelConfig[selectedExpert.level].bg,
                      expertLevelConfig[selectedExpert.level].text,
                    )}
                  >
                    {expertLevelConfig[selectedExpert.level].label}
                  </span>
                  {timelineStatus >= 2 && (
                    <Badge variant="success" dot>
                      已接单
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-jade-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                    {selectedExpert.rating} 分
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    {selectedExpert.orderCount} 单
                  </span>
                  {acceptedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {acceptedAt} 开始接单
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-jade-400">鉴定费</div>
                <div className="font-serif text-xl font-black text-gold-600">¥{selectedExpert.basePrice}</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      <Card className="mb-5">
        <Card.Header>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gold-500" />
            <Card.Title>给专家留言</Card.Title>
            <Card.Description>专家接单后可见</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          {messages.length > 0 && (
            <div className="space-y-3 mb-4 p-4 bg-rice-100/50 rounded-lg max-h-48 overflow-y-auto scrollbar-thin">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-2', m.from === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {m.from === 'expert' && (
                    <div className="w-7 h-7 rounded-full bg-jade-100 text-jade-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className={cn('max-w-[75%]', m.from === 'user' ? 'text-right' : '')}>
                    <div
                      className={cn(
                        'inline-block px-3 py-2 rounded-xl text-sm',
                        m.from === 'user'
                          ? 'bg-ink-gradient text-white rounded-br-md'
                          : 'bg-white border border-gold-200 text-jade-700 rounded-bl-md shadow-sm',
                      )}
                    >
                      {m.text}
                    </div>
                    <div className="text-[10px] text-jade-400 mt-1">{m.time}</div>
                  </div>
                  {m.from === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入留言内容，可补充藏品细节..."
              className="input-field flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card.Content>
      </Card>

      {timelineStatus < 3 && (
        <div className="p-4 rounded-xl border border-dashed border-gold-300 bg-gold-50/40 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-gold-600" />
            <span className="text-sm font-bold text-jade-700">演示模式 · 模拟订单流程</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {timelineStatus === 1 && (
              <Button onClick={handleSimulateAccept} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                模拟专家接单
              </Button>
            )}
            {timelineStatus === 2 && (
              <Button onClick={handleSimulateComplete} leftIcon={<FileCheck2 className="w-4 h-4" />}>
                模拟专家完成鉴定
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => goToStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          更换专家
        </Button>
        {timelineStatus === 3 ? (
          <Button
            size="lg"
            variant="primary"
            rightIcon={<FileCheck2 className="w-4 h-4" />}
          >
            查看鉴定证书
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-sm text-jade-500">
            <Shield className="w-4 h-4 text-gold-500" />
            <span>SLA 超时自动赔付，平台保障交易安全</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="container py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <Tag variant="gold" className="mb-3">在线鉴定</Tag>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-jade-700 mb-2">藏品在线鉴定</h1>
        <p className="text-jade-500 text-base md:text-lg">AI 初筛 + 权威专家双重保障，专业可信</p>
      </motion.div>

      {renderStepIndicator()}

      <div className="relative">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </AnimatePresence>
      </div>

      {renderLoadingOverlay()}
    </div>
  );
}