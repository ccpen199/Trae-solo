import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
  Smartphone, Camera, Watch, Briefcase, Gem, Laptop,
  ChevronRight, Check, UploadCloud, Sparkles, ShieldCheck,
  Info, AlertCircle, Clock, Banknote, Zap, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Stepper } from '@/components/ui/Stepper';
import { Tabs } from '@/components/ui/Tabs';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { StepItem, UploadedImage, AIAnalyzeResult, PriceTierUI, ConditionQuestion } from '@/types';

const steps: StepItem[] = [
  { title: '选择品类', description: '品牌与型号' },
  { title: '成色评估', description: '基础问卷' },
  { title: '上传照片', description: 'AI智能检测' },
  { title: '获取报价', description: '阶梯报价' },
];

const categories = [
  { id: 'phone', name: '手机数码', Icon: Smartphone },
  { id: 'camera', name: '相机镜头', Icon: Camera },
  { id: 'watch', name: '奢华腕表', Icon: Watch },
  { id: 'bag', name: '品牌箱包', Icon: Briefcase },
  { id: 'jewelry', name: '珠宝首饰', Icon: Gem },
  { id: 'laptop', name: '笔记本', Icon: Laptop },
];

const brands = {
  phone: [
    { id: 'apple', name: 'Apple', initial: 'A', products: 42 },
    { id: 'huawei', name: '华为', initial: 'H', products: 28 },
    { id: 'xiaomi', name: '小米', initial: 'X', products: 35 },
    { id: 'samsung', name: 'Samsung', initial: 'S', products: 31 },
    { id: 'oppo', name: 'OPPO', initial: 'O', products: 22 },
    { id: 'vivo', name: 'vivo', initial: 'V', products: 19 },
  ],
  camera: [
    { id: 'sony', name: 'Sony', initial: 'S', products: 24 },
    { id: 'canon', name: 'Canon', initial: 'C', products: 30 },
    { id: 'nikon', name: 'Nikon', initial: 'N', products: 22 },
    { id: 'leica', name: 'Leica', initial: 'L', products: 15 },
    { id: 'fujifilm', name: 'Fujifilm', initial: 'F', products: 18 },
  ],
  watch: [
    { id: 'rolex', name: 'Rolex', initial: 'R', products: 38 },
    { id: 'omega', name: 'Omega', initial: 'O', products: 26 },
    { id: 'cartier', name: 'Cartier', initial: 'C', products: 21 },
    { id: 'ap', name: 'Audemars Piguet', initial: 'A', products: 14 },
    { id: 'patek', name: 'Patek Philippe', initial: 'P', products: 19 },
    { id: 'iwc', name: 'IWC', initial: 'I', products: 17 },
  ],
  bag: [
    { id: 'hermes', name: 'Hermès', initial: 'H', products: 24 },
    { id: 'chanel', name: 'Chanel', initial: 'C', products: 31 },
    { id: 'lv', name: 'Louis Vuitton', initial: 'L', products: 45 },
    { id: 'dior', name: 'Dior', initial: 'D', products: 28 },
    { id: 'gucci', name: 'Gucci', initial: 'G', products: 36 },
  ],
  jewelry: [
    { id: 'vca', name: 'Van Cleef', initial: 'V', products: 18 },
    { id: 'cartier-j', name: 'Cartier', initial: 'C', products: 25 },
    { id: 'bvlgari', name: 'Bulgari', initial: 'B', products: 20 },
    { id: 'tiffany', name: 'Tiffany', initial: 'T', products: 22 },
  ],
  laptop: [
    { id: 'mac', name: 'MacBook', initial: 'M', products: 20 },
    { id: 'thinkpad', name: 'ThinkPad', initial: 'T', products: 16 },
    { id: 'surface', name: 'Surface', initial: 'S', products: 12 },
  ],
};

const mockModels = [
  { id: 'm1', name: 'iPhone 15 Pro Max 256GB', start: 7800, avg: 9200 },
  { id: 'm2', name: 'iPhone 15 Pro 256GB', start: 6200, avg: 7500 },
  { id: 'm3', name: 'iPhone 15 256GB', start: 4500, avg: 5600 },
  { id: 'm4', name: 'iPhone 14 Pro Max 256GB', start: 5800, avg: 7200 },
  { id: 'm5', name: 'iPhone 14 Pro 256GB', start: 4800, avg: 6100 },
  { id: 'm6', name: 'iPhone 14 256GB', start: 3500, avg: 4600 },
];

const conditionQuestions: ConditionQuestion[] = [
  {
    id: 'func',
    question: '功能完好度',
    options: [
      { key: 'perfect', value: 'perfect', label: '完美工作', description: '所有功能100%正常' },
      { key: 'minor', value: 'minor', label: '轻微瑕疵', description: '无功能影响小问题' },
      { key: 'issue', value: 'issue', label: '存在问题', description: '个别功能异常' },
    ],
  },
  {
    id: 'wear',
    question: '外观磨损',
    options: [
      { key: 'none', value: 'none', label: '几乎全新', description: '使用痕迹极轻微' },
      { key: 'light', value: 'light', label: '轻微磨损', description: '细小划痕可接受' },
      { key: 'moderate', value: 'moderate', label: '中度磨损', description: '明显使用痕迹' },
      { key: 'heavy', value: 'heavy', label: '重度磨损', description: '磕碰、掉漆等' },
    ],
  },
  {
    id: 'repair',
    question: '是否有维修史',
    options: [
      { key: 'no', value: 'no', label: '从未维修', description: '全原厂未拆封' },
      { key: 'official', value: 'official', label: '官方维修', description: '品牌官方售后' },
      { key: 'third', value: 'third', label: '第三方维修', description: '非官方渠道维修' },
    ],
  },
  {
    id: 'accessory',
    question: '配件是否齐全',
    options: [
      { key: 'all', value: 'all', label: '全套齐全', description: '包装/发票/配件全' },
      { key: 'partial', value: 'partial', label: '部分配件', description: '缺少非核心配件' },
      { key: 'bare', value: 'bare', label: '仅有主机', description: '无任何配件' },
    ],
  },
  {
    id: 'receipt',
    question: '包装盒发票',
    options: [
      { key: 'both', value: 'both', label: '都有', description: '包装盒+购买发票' },
      { key: 'box', value: 'box', label: '仅包装盒', description: '有原盒无发票' },
      { key: 'none', value: 'none', label: '都没有', description: '裸机无凭证' },
    ],
  },
];

const uploadLabels = ['正面', '背面', '左侧面', '右侧面', '顶部', '底部', '细节1', '细节2', '细节3'];

const priceChartOption = {
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(10,10,15,0.95)',
    borderColor: 'rgba(201,169,98,0.3)',
    textStyle: { color: '#D7D7E0' },
  },
  legend: {
    data: ['京东回收', '闲鱼二手', '臻回收'],
    textStyle: { color: '#86869B' },
    top: 0,
  },
  grid: { left: 50, right: 20, top: 50, bottom: 30 },
  xAxis: {
    type: 'category',
    data: ['-30d', '-25d', '-20d', '-15d', '-10d', '-5d', '今日'],
    axisLine: { lineStyle: { color: '#2E2E3D' } },
    axisLabel: { color: '#86869B' },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    axisLabel: { color: '#86869B', formatter: '¥{value}' },
  },
  series: [
    {
      name: '京东回收',
      type: 'line',
      data: [7200, 7350, 7280, 7100, 7050, 6900, 6800],
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#4FC498', width: 2, type: 'dashed' },
    },
    {
      name: '闲鱼二手',
      type: 'line',
      data: [7800, 7900, 7850, 7600, 7500, 7400, 7300],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#2BA179', width: 2, type: 'dotted' },
      itemStyle: { color: '#2BA179' },
    },
    {
      name: '臻回收',
      type: 'line',
      data: [8200, 8350, 8400, 8300, 8450, 8600, 8800],
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#C9A962', width: 3 },
      itemStyle: { color: '#C9A962', borderColor: '#0A0A0F', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(201,169,98,0.3)' },
            { offset: 1, color: 'rgba(201,169,98,0)' },
          ],
        },
      },
    },
  ],
};

const priceTiers: PriceTierUI[] = [
  {
    id: 'instant',
    tier: 'instant',
    label: '即时变现',
    name: '即时变现',
    price: 8200,
    settlementDays: '2小时',
    arrivalTime: '2小时到账',
    description: '快速变现',
    features: ['检测完成立即打款', '平台兜底收购', '快速变现无等待'],
  },
  {
    id: 'standard',
    tier: 'standard',
    label: '标准交易',
    name: '标准交易',
    price: 8800,
    settlementDays: '24小时',
    arrivalTime: '24小时到账',
    description: '均衡方案',
    features: ['最优均衡方案', '72小时匹配买家', '大部分用户选择'],
  },
  {
    id: 'consignment',
    tier: 'consignment',
    label: '寄售最高价',
    name: '寄售最高价',
    price: 9500,
    settlementDays: '3-7天',
    arrivalTime: '3-7天到账',
    description: '最高价',
    features: ['全渠道精准匹配', '最高价售出保障', '适合不急出用户'],
  },
];

const compareRows = [
  { platform: '臻回收', price: 8800, fee: '0手续费', speed: '24h', rating: '★★★★★' },
  { platform: '闲鱼二手', price: 8500, fee: '1%服务费', speed: '7-15天', rating: '★★★★☆' },
  { platform: '京东回收', price: 7800, fee: '0手续费', speed: '48h', rating: '★★★★☆' },
  { platform: '爱回收', price: 7500, fee: '0手续费', speed: '24h', rating: '★★★☆☆' },
  { platform: '本地门店', price: 7200, fee: '无公示', speed: '当场', rating: '★★★☆☆' },
];

const EvaluatePage: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [activeCategory, setActiveCategory] = React.useState('phone');
  const [activeBrand, setActiveBrand] = React.useState<string | null>(null);
  const [activeModel, setActiveModel] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [scanProgress, setScanProgress] = React.useState(0);
  const [analyzeResult, setAnalyzeResult] = React.useState<AIAnalyzeResult | null>(null);
  const [selectedTier, setSelectedTier] = React.useState('standard');

  const handleNext = () => {
    if (currentStep === 2 && images.length >= 6 && !analyzeResult) {
      simulateScan();
      return;
    }
    if (currentStep < 3) setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const simulateScan = () => {
    setScanProgress(0);
    const timer = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setAnalyzeResult({
            scratchLevel: '极轻微',
            wearLevel: '轻度使用',
            oxidationLevel: '无氧化',
            functionScore: 98,
            overallGrade: 'S',
          });
          return 100;
        }
        return p + 2;
      });
    }, 40);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-3"
        >
          <Badge variant="gold">智能估价系统</Badge>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
            <span className="gold-text">4步</span>获取精准回收报价
          </h1>
          <p className="text-ink-300">AI智能检测 + 大数据定价，为您匹配最优报价</p>
        </motion.div>

        <div className="mb-12">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <Tabs
                    tabs={categories.map((c) => ({
                      id: c.id,
                      label: c.name,
                      icon: <c.Icon className="w-4 h-4" />,
                    }))}
                    activeTab={activeCategory}
                    onChange={setActiveCategory}
                  />

                  <div className="grid lg:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-ink-50">选择品牌</h3>
                        <Badge variant="info">
                          {(brands as Record<string, unknown[]>)[activeCategory]?.length || 0} 个品牌
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(brands as Record<string, { id: string; name: string; initial: string; products: number }[]>)[activeCategory]?.map(
                          (b) => {
                            const isActive = activeBrand === b.id;
                            return (
                              <button
                                key={b.id}
                                onClick={() => {
                                  setActiveBrand(b.id);
                                  setActiveModel(null);
                                }}
                                className={`p-4 rounded-2xl border text-left transition-all duration-300 group ${
                                  isActive
                                    ? 'bg-gold-soft gold-border shadow-gold-sm'
                                    : 'bg-ink-800/40 border-white/[0.06] hover:border-gold-500/30 hover:bg-ink-800/70'
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                                      isActive
                                        ? 'bg-gold-gradient text-ink-950'
                                        : 'bg-ink-700 text-ink-300 group-hover:text-gold-400'
                                    }`}
                                  >
                                    {b.initial}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`font-semibold text-sm truncate ${
                                        isActive ? 'text-gold-400' : 'text-ink-100'
                                      }`}
                                    >
                                      {b.name}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs text-ink-400 pl-13">
                                  {b.products}款在售
                                </p>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-ink-50">选择型号</h3>
                        {activeBrand && <Badge variant="gold">{mockModels.length} 款型号</Badge>}
                      </div>
                      {!activeBrand ? (
                        <div className="h-full min-h-[300px] rounded-2xl border-2 border-dashed border-ink-700 flex flex-col items-center justify-center text-center p-8 gap-3">
                          <ChevronRight className="w-10 h-10 text-ink-500" />
                          <p className="text-ink-400">请先在左侧选择品牌</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                          {mockModels.map((m) => {
                            const isActive = activeModel === m.id;
                            return (
                              <button
                                key={m.id}
                                onClick={() => setActiveModel(m.id)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between gap-4 ${
                                  isActive
                                    ? 'bg-gold-soft gold-border shadow-gold-sm'
                                    : 'bg-ink-800/40 border-white/[0.06] hover:border-gold-500/30 hover:bg-ink-800/70'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className={`font-semibold truncate ${isActive ? 'text-gold-400' : 'text-ink-100'}`}>
                                    {m.name}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1.5 text-xs">
                                    <span className="text-ink-400">
                                      起售 <span className="text-ink-200">¥{m.start.toLocaleString()}</span>
                                    </span>
                                    <span className="text-ink-400">
                                      S级均 <span className="gold-text font-semibold">¥{m.avg.toLocaleString()}</span>
                                    </span>
                                  </div>
                                </div>
                                {isActive && (
                                  <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center shrink-0">
                                    <Check className="w-4 h-4 text-ink-950" strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <StepFooter
                    currentStep={currentStep}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    canNext={!!activeModel}
                  />
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="space-y-8">
                    {conditionQuestions.map((q, qi) => (
                      <div key={q.id} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-gold-soft border border-gold-500/30 text-gold-400 text-sm font-bold flex items-center justify-center shrink-0">
                            {qi + 1}
                          </span>
                          <h3 className="font-semibold text-lg text-ink-50">{q.question}</h3>
                        </div>
                        <div className="pl-11 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {q.options.map((opt) => {
                            const isActive = answers[q.id] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() =>
                                  setAnswers((a) => ({ ...a, [q.id]: opt.value }))
                                }
                                className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                                  isActive
                                    ? 'bg-gold-soft gold-border shadow-gold-sm'
                                    : 'bg-ink-800/40 border-white/[0.06] hover:border-gold-500/30'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      isActive
                                        ? 'border-gold-500 bg-gold-gradient'
                                        : 'border-ink-500'
                                    }`}
                                  >
                                    {isActive && <div className="w-2 h-2 rounded-full bg-ink-950" />}
                                  </span>
                                  <span className={`font-semibold ${isActive ? 'text-gold-400' : 'text-ink-100'}`}>
                                    {opt.label}
                                  </span>
                                </div>
                                {opt.description && (
                                  <p className="text-xs text-ink-400 mt-1 ml-6">{opt.description}</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <StepFooter
                    currentStep={currentStep}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    canNext={Object.keys(answers).length === conditionQuestions.length}
                  />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <UploadCloud className="w-5 h-5 text-gold-400" />
                        <h3 className="font-semibold text-lg text-ink-50">上传6面照 + 3张细节特写</h3>
                      </div>
                      <Badge variant={images.length >= 6 ? 'success' : 'warning'}>
                        {images.length}/9 已上传
                      </Badge>
                    </div>
                    <p className="text-sm text-ink-400">
                      请保证光线充足、清晰对焦，AI将基于照片进行磨损分析和真伪检测
                    </p>
                  </div>

                  <ImageUploader
                    images={images}
                    onChange={setImages}
                    maxImages={9}
                    labels={uploadLabels}
                    showScanAnimation
                  />

                  {images.length >= 6 && !analyzeResult && scanProgress < 100 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-2xl overflow-hidden border gold-border bg-gold-soft"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-gold-400 animate-pulse" />
                          <div>
                            <h4 className="font-semibold text-ink-50">AI智能检测中</h4>
                            <p className="text-xs text-ink-400">正在分析外观磨损、划痕、氧化情况</p>
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-ink-800 overflow-hidden">
                          <motion.div
                            className="h-full bg-gold-gradient rounded-full relative"
                            animate={{ width: `${scanProgress}%` }}
                            transition={{ ease: 'linear' }}
                          >
                            <div className="absolute inset-0 overflow-hidden">
                              <div className="absolute inset-x-0 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-scan" />
                            </div>
                          </motion.div>
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-ink-400">识别中... {scanProgress}%</span>
                          <span className="text-gold-400">CNN视觉模型 · 运行中</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {analyzeResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid md:grid-cols-5 gap-4 p-6 rounded-2xl border gold-border bg-ink-850/60"
                    >
                      <div className="md:col-span-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-jade-400" />
                          <h4 className="font-semibold text-ink-50">AI 检测结果报告</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: '划痕等级', value: analyzeResult.scratchLevel, color: 'jade' },
                            { label: '磨损程度', value: analyzeResult.wearLevel, color: 'gold' },
                            { label: '氧化情况', value: analyzeResult.oxidationLevel, color: 'forest' },
                            { label: '功能得分', value: `${analyzeResult.functionScore}/100`, color: 'info' },
                          ].map((item) => (
                            <div key={item.label} className="p-4 rounded-xl bg-ink-800/60 border border-white/[0.06]">
                              <p className="text-xs text-ink-400 mb-1">{item.label}</p>
                              <p className="font-semibold text-ink-50">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-gold-500/20 via-gold-500/10 to-transparent border border-gold-500/30">
                        <Badge variant="gold" dot>综合等级</Badge>
                        <div className="my-3">
                          <span className="font-display text-8xl font-bold gold-text leading-none">
                            {analyzeResult.overallGrade}
                          </span>
                        </div>
                        <p className="text-xs text-ink-300 text-center">
                          {analyzeResult.overallGrade === 'S' ? '极品成色 · 市场价溢价' : '优秀'}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <StepFooter
                    currentStep={currentStep}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    canNext={!!analyzeResult}
                    nextText={images.length >= 6 && !analyzeResult ? '启动AI检测' : undefined}
                  />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="s4"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-10"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gold-400" />
                        <h3 className="font-semibold text-lg text-ink-50">30天价格走势对比</h3>
                      </div>
                      <Badge variant="info">数据来源：全网行情</Badge>
                    </div>
                    <div className="h-80 rounded-2xl border border-white/[0.06] bg-ink-850/40 p-4">
                      <ReactECharts option={priceChartOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Banknote className="w-5 h-5 text-gold-400" />
                      <h3 className="font-semibold text-lg text-ink-50">选择报价方案</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                      {priceTiers.map((tier) => {
                        const isActive = selectedTier === tier.id;
                        const TierIcon = tier.id === 'instant' ? Zap : tier.id === 'standard' ? Crown : Sparkles;
                        return (
                          <button
                            key={tier.id}
                            onClick={() => setSelectedTier(tier.id)}
                            className={`relative p-6 rounded-3xl border text-left transition-all duration-500 ${
                              isActive
                                ? 'bg-gold-soft gold-border shadow-gold scale-[1.02]'
                                : 'bg-ink-800/40 border-white/[0.08] hover:border-gold-500/30'
                            }`}
                          >
                            {isActive && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge variant="gold">推荐</Badge>
                              </div>
                            )}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isActive ? 'bg-gold-gradient text-ink-950' : 'bg-ink-700 text-ink-300'}`}>
                              <TierIcon className="w-6 h-6" />
                            </div>
                            <h4 className={`font-semibold text-xl ${isActive ? 'text-gold-400' : 'text-ink-50'}`}>
                              {tier.name}
                            </h4>
                            <div className="mt-3 mb-4">
                              <span className={`font-display text-4xl font-bold ${isActive ? 'gold-text' : 'text-ink-50'}`}>
                                ¥{tier.price.toLocaleString()}
                              </span>
                            </div>
                            <Badge variant={isActive ? 'success' : 'info'} dot>
                              {tier.arrivalTime}
                            </Badge>
                            <ul className="mt-4 space-y-2">
                              {tier.features.map((f) => (
                                <li key={f} className="flex items-center gap-2 text-sm text-ink-300">
                                  <Check className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold-400' : 'text-ink-500'}`} strokeWidth={3} />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-gold-400" />
                      <h3 className="font-semibold text-lg text-ink-50">多平台比价</h3>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-ink-800/60">
                          <tr className="text-left text-ink-300">
                            <th className="px-6 py-4 font-medium">平台</th>
                            <th className="px-6 py-4 font-medium">报价</th>
                            <th className="px-6 py-4 font-medium hidden sm:table-cell">手续费</th>
                            <th className="px-6 py-4 font-medium hidden md:table-cell">到账速度</th>
                            <th className="px-6 py-4 font-medium">综合评价</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compareRows.map((row) => (
                            <tr
                              key={row.platform}
                              className={`border-t border-white/[0.04] transition-colors ${
                                row.platform === '臻回收' ? 'bg-gold-500/[0.06]' : 'hover:bg-white/[0.02]'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-semibold ${
                                      row.platform === '臻回收' ? 'gold-text' : 'text-ink-100'
                                    }`}
                                  >
                                    {row.platform}
                                  </span>
                                  {row.platform === '臻回收' && (
                                    <Badge variant="gold" dot>
                                      最优
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-semibold text-ink-50">¥{row.price.toLocaleString()}</td>
                              <td className="px-6 py-4 text-ink-300 hidden sm:table-cell">{row.fee}</td>
                              <td className="px-6 py-4 text-ink-300 hidden md:table-cell">{row.speed}</td>
                              <td className="px-6 py-4 text-gold-400">{row.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-forest-500/30 bg-forest-500/[0.06] flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-forest-300 shrink-0 mt-0.5" />
                    <div className="text-sm space-y-1">
                      <p className="font-semibold text-forest-200">正品保障说明</p>
                      <p className="text-forest-200/70 leading-relaxed">
                        所有回收商品均需通过序列号校验 + 物理防伪验证 + AI外观比对三重检测。
                        序列号格式要求：<code className="px-2 py-0.5 rounded bg-ink-850/80 text-gold-300 font-mono text-xs">品牌前缀-型号代码-批次号-校验码</code>
                        ，如检测不一致将启动退货保障流程。
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:justify-between pt-4 border-t border-white/[0.06]">
                    <Button variant="ghost" size="lg" onClick={handlePrev}>
                      上一步
                    </Button>
                    <Button size="lg" className="animate-glow-pulse">
                      <Check className="w-5 h-5" />
                      确认报价，预约上门
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StepFooterProps {
  currentStep: number;
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
  nextText?: string;
}

const StepFooter: React.FC<StepFooterProps> = ({ currentStep, onPrev, onNext, canNext, nextText }) => (
  <div className="flex flex-col sm:flex-row gap-4 sm:justify-between pt-6 border-t border-white/[0.06]">
    <Button variant="ghost" size="lg" onClick={onPrev} disabled={currentStep === 0}>
      上一步
    </Button>
    <Button size="lg" onClick={onNext} disabled={!canNext}>
      {nextText || '下一步'}
      <ChevronRight className="w-5 h-5" />
    </Button>
  </div>
);

export { EvaluatePage };
export default EvaluatePage;
