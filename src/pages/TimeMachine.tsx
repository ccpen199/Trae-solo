import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MapPin,
  TrendingUp,
  Building2,
  BarChart3,
  Calendar,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  Zap,
  Star,
  AlertCircle,
  ArrowLeftRight,
} from 'lucide-react';
import type { SnapshotData, DistrictPrice } from '@/mock/data';
import { generateDistrictPrices } from '@/mock/data';
import { getTimeMachineSnapshot } from '@/services/api';
import DistrictHeatmap from '@/components/charts/DistrictHeatmap';
import { cn } from '@/lib/utils';

const MIN_YEAR = 2015;
const MAX_YEAR = 2026;

const milestones = [
  { year: 2015, title: '330新政', description: '央行降准降息，二套房首付比例下调', type: 'policy' },
  { year: 2016, title: '930调控', description: '北京出台限购政策，提高首付比例', type: 'policy' },
  { year: 2017, title: '317新政', description: '认房又认贷，最严调控政策出台', type: 'policy' },
  { year: 2019, title: 'LPR改革', description: '贷款市场报价利率形成机制改革', type: 'policy' },
  { year: 2021, title: '三道红线', description: '房企融资监管新规正式实施', type: 'policy' },
  { year: 2022, title: '保交楼', description: '多地出台稳楼市政策，支持刚性需求', type: 'policy' },
  { year: 2023, title: '需求释放', description: '市场逐步回暖，改善型需求释放', type: 'market' },
  { year: 2024, title: '以旧换新', description: '住房以旧换新政策落地，刺激改善需求', type: 'policy' },
  { year: 2025, title: '长效机制', description: '房地产长效机制逐步完善', type: 'policy' },
];

const districts = [
  '朝阳区',
  '海淀区',
  '东城区',
  '西城区',
  '丰台区',
  '石景山区',
  '通州区',
  '昌平区',
];

const formatUnitPrice = (price: number): string => {
  if (price >= 10000) {
    return `${(price / 10000).toFixed(2)}万/㎡`;
  }
  return `${price.toLocaleString()}元/㎡`;
};

const formatPrice = (price: number): string => {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(2)}亿`;
  }
  if (price >= 10000) {
    return `${(price / 10000).toFixed(0)}万`;
  }
  return price.toLocaleString();
};

const generateYearlyDistrictPrices = (year: number): DistrictPrice[] => {
  const basePrices: Record<string, number> = {
    '东城区': 45000,
    '西城区': 48000,
    '朝阳区': 38000,
    '海淀区': 42000,
    '丰台区': 32000,
    '石景山区': 28000,
    '通州区': 25000,
    '昌平区': 22000,
    '门头沟区': 20000,
    '房山区': 18000,
    '顺义区': 24000,
    '大兴区': 23000,
    '怀柔区': 18000,
    '平谷区': 16000,
    '密云区': 15000,
    '延庆区': 14000,
  };

  const yearMultiplier = 0.4 + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 0.6;

  return generateDistrictPrices().map((d) => {
    const basePrice = basePrices[d.districtName] || 30000;
    const adjustedPrice = Math.round(basePrice * yearMultiplier * (1 + (Math.random() - 0.5) * 0.1));
    return {
      ...d,
      avgPrice: adjustedPrice,
      change7d: parseFloat(((Math.random() - 0.5) * 8).toFixed(2)),
    };
  });
};

export default function TimeMachine() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [compareYear, setCompareYear] = useState<number | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('朝阳区');
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [compareSnapshot, setCompareSnapshot] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareLoading, setCompareLoading] = useState(false);

  const districtPrices = useMemo(() => generateYearlyDistrictPrices(selectedYear), [selectedYear]);
  const compareDistrictPrices = useMemo(
    () => (compareYear ? generateYearlyDistrictPrices(compareYear) : []),
    [compareYear]
  );

  useEffect(() => {
    const fetchSnapshot = async () => {
      setLoading(true);
      try {
        const data = await getTimeMachineSnapshot({
          date: `${selectedYear}-06-01`,
          district: selectedDistrict,
        });
        setSnapshot(data);
      } catch (error) {
        console.error('Failed to fetch snapshot:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [selectedYear, selectedDistrict]);

  useEffect(() => {
    if (isCompareMode && compareYear) {
      const fetchCompareSnapshot = async () => {
        setCompareLoading(true);
        try {
          const data = await getTimeMachineSnapshot({
            date: `${compareYear}-06-01`,
            district: selectedDistrict,
          });
          setCompareSnapshot(data);
        } catch (error) {
          console.error('Failed to fetch compare snapshot:', error);
        } finally {
          setCompareLoading(false);
        }
      };

      fetchCompareSnapshot();
    }
  }, [isCompareMode, compareYear, selectedDistrict]);

  const handleYearChange = (newYear: number) => {
    if (isCompareMode) {
      setCompareYear(newYear);
    } else {
      setSelectedYear(newYear);
    }
  };

  const currentMilestone = milestones.find((m) => m.year === selectedYear);

  const yearMarks = useMemo(() => {
    const marks = [];
    for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
      marks.push(year);
    }
    return marks;
  }, []);

  const topGrowthDistrict = useMemo(() => {
    return [...districtPrices].sort((a, b) => b.change7d - a.change7d)[0];
  }, [districtPrices]);

  const priceDiff = useMemo(() => {
    if (!snapshot || !compareSnapshot) return null;
    const diff = snapshot.avgPrice - compareSnapshot.avgPrice;
    const percent = ((diff / compareSnapshot.avgPrice) * 100).toFixed(1);
    return {
      diff,
      percent: `${diff >= 0 ? '+' : ''}${percent}%`,
      isPositive: diff >= 0,
    };
  }, [snapshot, compareSnapshot]);

  const transactionDiff = useMemo(() => {
    if (!snapshot || !compareSnapshot) return null;
    const diff = snapshot.transactionVolume - compareSnapshot.transactionVolume;
    const percent = ((diff / compareSnapshot.transactionVolume) * 100).toFixed(1);
    return {
      diff,
      percent: `${diff >= 0 ? '+' : ''}${percent}%`,
      isPositive: diff >= 0,
    };
  }, [snapshot, compareSnapshot]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-neutral-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden py-16 px-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-700/30 via-transparent to-transparent" />
        <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-accent-verified/5 blur-3xl" />
        <div className="absolute bottom-0 right-20 h-96 w-96 rounded-full bg-accent-up/5 blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <Clock className="h-4 w-4 text-accent-verified" />
              <span>穿越时空 · 洞悉市场变迁</span>
            </div>

            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
              房价时光机
            </h1>

            <p className="mb-8 text-xl leading-relaxed text-white/70">
              回溯历史价格数据，见证城市发展轨迹。
              从2015到2026，每一个节点都记录着房地产市场的风云变幻。
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCompareMode(!isCompareMode)}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all',
                  isCompareMode
                    ? 'bg-accent-verified text-white shadow-glow'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                )}
              >
                <GitCompare className="h-5 w-5" />
                {isCompareMode ? '退出对比模式' : '开启年份对比'}
              </motion.button>

              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-white/80">
                <MapPin className="h-4 w-4" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-transparent text-white outline-none"
                >
                  {districts.map((d) => (
                    <option key={d} value={d} className="bg-primary-800">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 rounded-2xl bg-white/5 p-6 backdrop-blur-lg"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent-verified" />
              <span className="text-lg font-medium text-white">
                选择年份: <span className="text-accent-verified">{selectedYear}年</span>
                {isCompareMode && compareYear && (
                  <span className="ml-2 text-white/60">
                    <ArrowLeftRight className="inline h-4 w-4 mx-2" />
                    <span className="text-accent-down">{compareYear}年</span>
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleYearChange(Math.max(MIN_YEAR, selectedYear - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleYearChange(Math.min(MAX_YEAR, selectedYear + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={isCompareMode ? compareYear || selectedYear : selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-verified"
            />
            <div className="mt-3 flex justify-between">
              {yearMarks.map((year) => {
                const isActive = year === selectedYear || year === compareYear;
                const isMilestone = milestones.some((m) => m.year === year);
                return (
                  <motion.div
                    key={year}
                    className="flex flex-col items-center"
                    whileHover={{ scale: 1.1 }}
                  >
                    <button
                      onClick={() => handleYearChange(year)}
                      className={cn(
                        'relative h-6 w-6 rounded-full transition-all',
                        isActive
                          ? year === selectedYear
                            ? 'bg-accent-verified shadow-glow scale-125'
                            : 'bg-accent-down scale-110'
                          : isMilestone
                          ? 'bg-accent-up/80'
                          : 'bg-white/30 hover:bg-white/50'
                      )}
                    >
                      {isMilestone && !isActive && (
                        <Zap className="absolute -top-1 -right-1 h-3 w-3 text-accent-verified" />
                      )}
                    </button>
                    <span
                      className={cn(
                        'mt-1 text-xs',
                        isActive ? 'text-white font-semibold' : 'text-white/40'
                      )}
                    >
                      {year}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
            <Star className="h-6 w-6 text-accent-verified" />
            市场里程碑
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 h-full w-0.5 bg-white/10" />
            <div className="space-y-4">
              {milestones
                .filter((m) => Math.abs(m.year - selectedYear) <= 3)
                .sort((a, b) => a.year - b.year)
                .map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'relative ml-10 rounded-lg p-4 transition-all',
                      milestone.year === selectedYear
                        ? 'bg-accent-verified/20 border border-accent-verified/30'
                        : 'bg-white/5 border border-white/10'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute -left-10 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 flex items-center justify-center',
                        milestone.year === selectedYear
                          ? 'border-accent-verified bg-accent-verified'
                          : 'border-white/30 bg-primary-800'
                      )}
                    >
                      {milestone.type === 'policy' ? (
                        <AlertCircle
                          className={cn(
                            'h-3 w-3',
                            milestone.year === selectedYear ? 'text-white' : 'text-white/50'
                          )}
                        />
                      ) : (
                        <TrendingUp
                          className={cn(
                            'h-3 w-3',
                            milestone.year === selectedYear ? 'text-white' : 'text-white/50'
                          )}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'text-sm font-bold',
                          milestone.year === selectedYear
                            ? 'text-accent-verified'
                            : 'text-white/60'
                        )}
                      >
                        {milestone.year}年
                      </span>
                      <h3 className="font-semibold text-white">{milestone.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-white/60">{milestone.description}</p>
                  </motion.div>
                ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-verified text-xs font-bold text-white">
                  {selectedYear}
                </span>
                区域价格热力图
              </h2>
              {currentMilestone && (
                <span className="rounded-full bg-accent-verified/20 px-3 py-1 text-xs text-accent-verified">
                  {currentMilestone.title}
                </span>
              )}
            </div>
            <div className="card rounded-2xl bg-white/5 backdrop-blur-lg">
              {loading ? (
                <div className="flex h-[380px] items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-10 w-10 rounded-full border-4 border-white/10 border-t-accent-verified"
                  />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedYear}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  >
                    <DistrictHeatmap data={districtPrices} height={380} />
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {isCompareMode ? (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-down text-xs font-bold text-white">
                    {compareYear || '?'}
                  </span>
                  对比年份热力图
                </h2>
                <select
                  value={compareYear || ''}
                  onChange={(e) => setCompareYear(parseInt(e.target.value))}
                  className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white outline-none"
                >
                  <option value="" className="bg-primary-800">
                    选择年份
                  </option>
                  {yearMarks
                    .filter((y) => y !== selectedYear)
                    .map((year) => (
                      <option key={year} value={year} className="bg-primary-800">
                        {year}年
                      </option>
                    ))}
                </select>
              </div>
              <div className="card rounded-2xl bg-white/5 backdrop-blur-lg">
                {compareLoading || !compareYear ? (
                  <div className="flex h-[380px] items-center justify-center">
                    {compareLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-10 w-10 rounded-full border-4 border-white/10 border-t-accent-down"
                      />
                    ) : (
                      <p className="text-white/50">请选择对比年份</p>
                    )}
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={compareYear}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                    >
                      <DistrictHeatmap data={compareDistrictPrices} height={380} />
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                <BarChart3 className="h-6 w-6 text-accent-verified" />
                {selectedYear}年核心指标
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="wait">
                  {snapshot && (
                    <motion.div
                      key={snapshot.date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-4"
                    >
                      <div className="card rounded-xl bg-gradient-to-br from-accent-verified/20 to-accent-verified/5 border border-accent-verified/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60">平均房价</p>
                            <p className="mt-1 text-3xl font-bold text-white">
                              {formatUnitPrice(snapshot.avgPrice)}
                            </p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-verified/20">
                            <Building2 className="h-7 w-7 text-accent-verified" />
                          </div>
                        </div>
                      </div>

                      <div className="card rounded-xl bg-gradient-to-br from-accent-up/20 to-accent-up/5 border border-accent-up/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60">成交量</p>
                            <p className="mt-1 text-3xl font-bold text-white">
                              {snapshot.transactionVolume.toLocaleString()} 套
                            </p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-up/20">
                            <TrendingUp className="h-7 w-7 text-accent-up" />
                          </div>
                        </div>
                      </div>

                      <div className="card rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 border border-primary-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60">挂牌总量</p>
                            <p className="mt-1 text-3xl font-bold text-white">
                              {snapshot.totalListings.toLocaleString()} 套
                            </p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/20">
                            <BarChart3 className="h-7 w-7 text-primary-400" />
                          </div>
                        </div>
                      </div>

                      <div className="card rounded-xl bg-gradient-to-br from-accent-down/20 to-accent-down/5 border border-accent-down/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60">最高涨幅区域</p>
                            <p className="mt-1 text-2xl font-bold text-white">
                              {topGrowthDistrict?.districtName}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-sm text-accent-down">
                              <TrendingUp className="h-4 w-4" />
                              +{topGrowthDistrict?.change7d}%
                            </p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-down/20">
                            <Star className="h-7 w-7 text-accent-down" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>

        {isCompareMode && snapshot && compareSnapshot && priceDiff && transactionDiff && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8"
          >
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
              <GitCompare className="h-6 w-6 text-accent-verified" />
              {selectedYear}年 vs {compareYear}年 对比分析
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="card rounded-xl bg-gradient-to-br from-accent-verified/20 to-accent-verified/5 border border-accent-verified/20"
              >
                <p className="text-sm text-white/60">均价变化</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {priceDiff.percent}
                </p>
                <p className={cn(
                  'mt-1 text-sm font-medium',
                  priceDiff.isPositive ? 'text-accent-up' : 'text-accent-down'
                )}>
                  {priceDiff.isPositive ? '上涨' : '下跌'} {formatPrice(Math.abs(priceDiff.diff))}
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="card rounded-xl bg-gradient-to-br from-accent-up/20 to-accent-up/5 border border-accent-up/20"
              >
                <p className="text-sm text-white/60">成交量变化</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {transactionDiff.percent}
                </p>
                <p className={cn(
                  'mt-1 text-sm font-medium',
                  transactionDiff.isPositive ? 'text-accent-up' : 'text-accent-down'
                )}>
                  {transactionDiff.isPositive ? '增加' : '减少'} {Math.abs(transactionDiff.diff)} 套
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="card rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 border border-primary-500/20"
              >
                <p className="text-sm text-white/60">挂牌量变化</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {snapshot.totalListings > compareSnapshot.totalListings ? '+' : ''}
                  {(
                    ((snapshot.totalListings - compareSnapshot.totalListings) /
                      compareSnapshot.totalListings) *
                    100
                  ).toFixed(1)}
                  %
                </p>
                <p className="text-sm text-white/60 mt-1">
                  从 {compareSnapshot.totalListings.toLocaleString()} 到 {snapshot.totalListings.toLocaleString()} 套
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {!isCompareMode && snapshot && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 mb-16"
          >
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
              <BarChart3 className="h-6 w-6 text-accent-verified" />
              价格分布
            </h2>
            <div className="card rounded-2xl bg-white/5 p-6 backdrop-blur-lg">
              <div className="space-y-4">
                {snapshot.priceDistribution.map((item, index) => {
                  const maxCount = Math.max(...snapshot.priceDistribution.map((d) => d.count));
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <motion.div
                      key={item.range}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <span className="w-24 text-sm text-white/70">{item.range}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                          className="h-8 rounded-full bg-gradient-to-r from-accent-verified/80 to-accent-up/60"
                        />
                      </div>
                      <span className="w-16 text-right text-sm font-semibold text-white">
                        {item.count} 套
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
