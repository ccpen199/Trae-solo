import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
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
  Search,
  Play,
  Pause,
  Bell,
  BellOff,
  Check,
  Home,
  Building,
  KeyRound,
} from 'lucide-react';
import type { SnapshotData, DistrictPrice, PropertyCategory } from '@/mock/data';
import { generateDistrictPrices } from '@/mock/data';
import { getTimeMachineSnapshot, createSubscription, getSubscriptions } from '@/services/api';
import DistrictHeatmap from '@/components/charts/DistrictHeatmap';
import { cn } from '@/lib/utils';

const MIN_YEAR = 2018;
const MAX_YEAR = 2026;

const cities = [
  { code: 'bj', name: '北京' },
  { code: 'sh', name: '上海' },
  { code: 'gz', name: '广州' },
  { code: 'sz', name: '深圳' },
  { code: 'hz', name: '杭州' },
];

const cityDistricts: Record<string, string[]> = {
  bj: ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '石景山区', '通州区', '昌平区', '大兴区', '顺义区'],
  sh: ['浦东新区', '黄浦区', '静安区', '徐汇区', '长宁区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区'],
  gz: ['天河区', '越秀区', '海珠区', '荔湾区', '白云区', '番禺区', '黄埔区', '花都区', '南沙区', '增城区'],
  sz: ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区', '龙华区', '坪山区', '光明区', '盐田区', '大鹏新区'],
  hz: ['西湖区', '上城区', '拱墅区', '滨江区', '萧山区', '余杭区', '临平区', '钱塘区', '富阳区', '临安区'],
};

const propertyTypes = [
  { value: 'secondhand', label: '二手房', icon: <Home className="h-4 w-4" /> },
  { value: 'new', label: '新房', icon: <Building className="h-4 w-4" /> },
  { value: 'rental', label: '租赁', icon: <KeyRound className="h-4 w-4" /> },
];

const milestones = [
  { year: 2018, title: '棚改货币化', description: '棚改货币化政策推动三四线城市房价上涨', type: 'policy' },
  { year: 2019, title: 'LPR改革', description: '贷款市场报价利率形成机制改革', type: 'policy' },
  { year: 2020, title: '疫情最低点', description: '新冠疫情爆发，市场短暂下行后快速反弹', type: 'market' },
  { year: 2021, title: '调控前峰值', description: '三道红线前市场达到历史高点', type: 'market' },
  { year: 2022, title: '保交楼', description: '多地出台稳楼市政策，支持刚性需求', type: 'policy' },
  { year: 2023, title: '需求释放', description: '市场逐步回暖，改善型需求释放', type: 'market' },
  { year: 2024, title: '以旧换新', description: '住房以旧换新政策落地，刺激改善需求', type: 'policy' },
  { year: 2025, title: '长效机制', description: '房地产长效机制逐步完善', type: 'policy' },
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

const generateYearlyDistrictPrices = (year: number, cityCode: string): DistrictPrice[] => {
  const basePrices: Record<string, Record<string, number>> = {
    bj: {
      '东城区': 95000, '西城区': 110000, '朝阳区': 75000, '海淀区': 90000,
      '丰台区': 55000, '石景山区': 48000, '通州区': 45000, '昌平区': 40000,
      '大兴区': 42000, '顺义区': 46000,
    },
    sh: {
      '浦东新区': 85000, '黄浦区': 120000, '静安区': 110000, '徐汇区': 100000,
      '长宁区': 95000, '普陀区': 65000, '虹口区': 70000, '杨浦区': 68000,
      '闵行区': 60000, '宝山区': 50000,
    },
    gz: {
      '天河区': 75000, '越秀区': 65000, '海珠区': 58000, '荔湾区': 50000,
      '白云区': 40000, '番禺区': 38000, '黄埔区': 42000, '花都区': 25000,
      '南沙区': 28000, '增城区': 22000,
    },
    sz: {
      '南山区': 120000, '福田区': 110000, '罗湖区': 75000, '宝安区': 65000,
      '龙岗区': 55000, '龙华区': 60000, '坪山区': 38000, '光明区': 42000,
      '盐田区': 50000, '大鹏新区': 35000,
    },
    hz: {
      '西湖区': 65000, '上城区': 58000, '拱墅区': 52000, '滨江区': 55000,
      '萧山区': 38000, '余杭区': 40000, '临平区': 30000, '钱塘区': 32000,
      '富阳区': 25000, '临安区': 22000,
    },
  };

  const yearMultiplier = 0.5 + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 0.5;

  return generateDistrictPrices().map((d, idx) => {
    const districtName = cityDistricts[cityCode]?.[idx % cityDistricts[cityCode].length] || d.districtName;
    const basePrice = basePrices[cityCode]?.[districtName] || 40000;
    const adjustedPrice = Math.round(basePrice * yearMultiplier * (1 + (Math.random() - 0.5) * 0.08));
    return {
      ...d,
      districtName,
      avgPrice: adjustedPrice,
      change7d: parseFloat(((Math.random() - 0.5) * 6).toFixed(2)),
    };
  });
};

interface HistoryDataPoint {
  date: string;
  avgPrice: number;
  change: number;
  transactionVolume: number;
  event?: string;
}

const generateHistoryData = (startYear: number, endYear: number, cityCode: string): HistoryDataPoint[] => {
  const data: HistoryDataPoint[] = [];
  const cityBasePrice = { bj: 60000, sh: 65000, gz: 40000, sz: 70000, hz: 35000 };
  const basePrice = cityBasePrice[cityCode as keyof typeof cityBasePrice] || 50000;

  for (let year = startYear; year <= endYear; year++) {
    const yearMultiplier = 0.5 + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 0.5;
    const yearPrice = basePrice * yearMultiplier;

    for (let month = 1; month <= 12; month += 3) {
      const monthVariation = 1 + (Math.random() - 0.5) * 0.05;
      const price = Math.round(yearPrice * monthVariation);
      const prevPrice = data.length > 0 ? data[data.length - 1].avgPrice : price * 0.98;
      const change = parseFloat(((price - prevPrice) / prevPrice * 100).toFixed(2));

      const milestone = milestones.find(m => m.year === year && month === 6);

      data.push({
        date: `${year}-${String(month).padStart(2, '0')}-01`,
        avgPrice: price,
        change,
        transactionVolume: Math.floor(Math.random() * 2000) + 500,
        event: milestone?.title,
      });
    }
  }

  return data;
};

export default function TimeMachine() {
  const [selectedCity, setSelectedCity] = useState('bj');
  const [selectedDistrict, setSelectedDistrict] = useState('朝阳区');
  const [selectedYear, setSelectedYear] = useState(2024);
  const [startYear, setStartYear] = useState(2018);
  const [propertyType, setPropertyType] = useState<PropertyCategory>('secondhand');
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscribeSuccess, setShowSubscribeSuccess] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const districts = cityDistricts[selectedCity] || [];

  const districtPrices = useMemo(
    () => generateYearlyDistrictPrices(selectedYear, selectedCity),
    [selectedYear, selectedCity]
  );

  const historyData = useMemo(
    () => generateHistoryData(startYear, MAX_YEAR, selectedCity),
    [startYear, selectedCity]
  );

  const currentPrice = useMemo(() => {
    return historyData[historyData.length - 1]?.avgPrice || 0;
  }, [historyData]);

  const selectedDatePrice = useMemo(() => {
    const targetDate = `${selectedYear}-06-01`;
    const found = historyData.find(d => d.date === targetDate);
    return found?.avgPrice || snapshot?.avgPrice || 50000;
  }, [historyData, selectedYear, snapshot]);

  const priceChangePercent = useMemo(() => {
    if (!currentPrice || !selectedDatePrice) return 0;
    return parseFloat(((currentPrice - selectedDatePrice) / selectedDatePrice * 100).toFixed(1));
  }, [currentPrice, selectedDatePrice]);

  useEffect(() => {
    const firstDistrict = cityDistricts[selectedCity]?.[0] || '朝阳区';
    setSelectedDistrict(firstDistrict);
  }, [selectedCity]);

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
    const checkSubscription = async () => {
      try {
        const subs = await getSubscriptions();
        const exists = subs.some(
          s => s.targetType === 'district' && s.targetName === selectedDistrict
        );
        setIsSubscribed(exists);
      } catch (error) {
        console.error('Failed to check subscription:', error);
      }
    };
    checkSubscription();
  }, [selectedDistrict]);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setSelectedYear(prev => {
          if (prev >= MAX_YEAR) {
            setIsPlaying(false);
            return startYear;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, startYear]);

  const handleCityChange = (cityCode: string) => {
    setSelectedCity(cityCode);
  };

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handlePlayToggle = () => {
    if (!isPlaying) {
      setSelectedYear(startYear);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSubscribe = async () => {
    try {
      await createSubscription({
        targetId: `${selectedCity}-${selectedDistrict}`,
        targetType: 'district',
        targetName: selectedDistrict,
        threshold: 5,
      });
      setIsSubscribed(true);
      setShowSubscribeSuccess(true);
      setTimeout(() => setShowSubscribeSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  const currentMilestone = milestones.find((m) => m.year === selectedYear);

  const topGrowthDistrict = useMemo(() => {
    return [...districtPrices].sort((a, b) => b.change7d - a.change7d)[0];
  }, [districtPrices]);

  const trendChartOption: EChartsOption = useMemo(() => {
    const filteredData = historyData.filter(d => {
      const year = parseInt(d.date.split('-')[0]);
      return year >= startYear && year <= selectedYear;
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#fff' },
        formatter: (params: unknown) => {
          const p = params as Array<{ axisValue: string; value: number }>;
          if (!p || p.length === 0) return '';
          return `<div style="font-weight: 600;">${p[0].axisValue}</div>
                  <div style="margin-top: 4px;">均价: ¥${p[0].value?.toLocaleString() || 0}/㎡</div>`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: filteredData.map(d => d.date),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        axisLabel: {
          color: 'rgba(255,255,255,0.6)',
          formatter: (value: string) => {
            const d = new Date(value);
            return `${d.getFullYear()}/${d.getMonth() + 1}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: {
          color: 'rgba(255,255,255,0.6)',
          formatter: (value: number) => {
            if (value >= 10000) return `${(value / 10000).toFixed(0)}万`;
            return value.toString();
          },
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)', type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          data: filteredData.map(d => d.avgPrice),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: false,
          lineStyle: {
            color: '#10b981',
            width: 3,
          },
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
              ],
            },
          },
          markPoint: {
            data: milestones
              .filter(m => m.year >= startYear && m.year <= selectedYear)
              .map(m => ({
                name: m.title,
                xAxis: `${m.year}-06-01`,
                yAxis: 50000,
                symbolSize: 30,
                itemStyle: { color: m.type === 'policy' ? '#f59e0b' : '#ef4444' },
              })),
          },
        },
      ],
    };
  }, [historyData, selectedYear, startYear]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-neutral-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden py-12 px-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-700/30 via-transparent to-transparent" />
        <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-accent-verified/5 blur-3xl" />
        <div className="absolute bottom-0 right-20 h-96 w-96 rounded-full bg-accent-up/5 blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <Clock className="h-4 w-4 text-accent-verified" />
              <span>穿越时空 · 洞悉市场变迁</span>
            </div>

            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              房价时光机
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-white/70">
              回溯历史价格数据，见证城市发展轨迹。
              从2018到2026，每一个节点都记录着房地产市场的风云变幻。
            </p>
          </motion.div>
        </div>
      </motion.div>

      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 rounded-2xl bg-white/5 p-6 backdrop-blur-lg border border-white/10"
        >
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-white">
            <Search className="h-5 w-5 text-accent-verified" />
            查询条件
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">城市选择</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-white appearance-none outline-none focus:border-accent-verified/50 transition-colors"
                >
                  {cities.map((city) => (
                    <option key={city.code} value={city.code} className="bg-primary-800">
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">片区选择</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-white appearance-none outline-none focus:border-accent-verified/50 transition-colors"
                >
                  {districts.map((district) => (
                    <option key={district} value={district} className="bg-primary-800">
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">房类筛选</label>
              <div className="flex gap-1">
                {propertyTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setPropertyType(type.value as PropertyCategory)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all',
                      propertyType === type.value
                        ? 'bg-accent-verified text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    )}
                  >
                    {type.icon}
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-verified to-accent-up text-white py-2.5 rounded-lg font-medium shadow-lg shadow-accent-verified/25"
              >
                <Search className="h-4 w-4" />
                查询
              </motion.button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-white/60">时间范围: {startYear}年 - {selectedYear}年</label>
              <button
                onClick={handlePlayToggle}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  isPlaying
                    ? 'bg-accent-verified text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                )}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? '暂停播放' : '播放价格变迁'}
              </button>
            </div>
            <div className="relative px-2">
              <input
                type="range"
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-10"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="range"
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-verified"
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/40">
              {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i).map(year => (
                <span key={year} className={cn(
                  year === selectedYear ? 'text-accent-verified font-semibold' : ''
                )}>
                  {year}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 card rounded-2xl bg-white/5 backdrop-blur-lg p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <BarChart3 className="h-6 w-6 text-accent-verified" />
                历史价格走势
              </h2>
              <span className="text-sm text-white/60">
                {cities.find(c => c.code === selectedCity)?.name} · {selectedDistrict}
              </span>
            </div>
            <ReactECharts
              option={trendChartOption}
              style={{ height: 300, width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>

          <div className="space-y-4">
            <motion.div
              key={selectedYear}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="card rounded-2xl bg-gradient-to-br from-accent-verified/20 to-accent-verified/5 border border-accent-verified/20 p-6"
            >
              <p className="text-sm text-white/60 mb-1">{selectedYear}年均价</p>
              <p className="text-3xl font-bold text-white mb-1">
                {formatUnitPrice(selectedDatePrice)}
              </p>
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                priceChangePercent >= 0 ? 'text-accent-up' : 'text-accent-down'
              )}>
                {priceChangePercent >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                相比当前 {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent}%
              </div>
            </motion.div>

            <div className="card rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6">
              <p className="text-sm text-white/60 mb-1">当前均价</p>
              <p className="text-2xl font-bold text-white">
                {formatUnitPrice(currentPrice)}
              </p>
              <p className="text-xs text-white/40 mt-1">
                数据更新至 2026年6月
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubscribe}
              disabled={isSubscribed}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
                isSubscribed
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              )}
            >
              {isSubscribed ? (
                <>
                  <Check className="h-5 w-5" />
                  已订阅该片区
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5" />
                  订阅该片区价格变动
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showSubscribeSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
            >
              <Check className="h-5 w-5" />
              订阅成功！价格变动时将通知您
            </motion.div>
          )}
        </AnimatePresence>

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
          <div className="relative overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => setSelectedYear(milestone.year)}
                  className={cn(
                    'relative flex-shrink-0 w-56 p-4 rounded-xl cursor-pointer transition-all',
                    milestone.year === selectedYear
                      ? 'bg-accent-verified/20 border-2 border-accent-verified/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      milestone.type === 'policy' ? 'bg-amber-500/20' : 'bg-red-500/20'
                    )}>
                      {milestone.type === 'policy' ? (
                        <AlertCircle className="h-5 w-5 text-amber-400" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <span className={cn(
                        'text-sm font-bold',
                        milestone.year === selectedYear ? 'text-accent-verified' : 'text-white/60'
                      )}>
                        {milestone.year}年
                      </span>
                      <h3 className="font-semibold text-white text-sm">{milestone.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2">{milestone.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
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
            <div className="card rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
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

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <BarChart3 className="h-6 w-6 text-accent-verified" />
              {selectedYear}年区域价格排名
            </h2>
            <div className="card rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-4 max-h-[380px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-white/60 text-sm">
                    <th className="text-left pb-3 font-medium">排名</th>
                    <th className="text-left pb-3 font-medium">区域</th>
                    <th className="text-right pb-3 font-medium">均价</th>
                    <th className="text-right pb-3 font-medium">涨跌幅</th>
                  </tr>
                </thead>
                <tbody>
                  {[...districtPrices]
                    .sort((a, b) => b.avgPrice - a.avgPrice)
                    .map((district, index) => (
                      <motion.tr
                        key={district.districtName}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                        onClick={() => setSelectedDistrict(district.districtName)}
                      >
                        <td className="py-3">
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                            index === 0 ? 'bg-amber-500/20 text-amber-400' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-white/10 text-white/40'
                          )}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 text-white font-medium">
                          {district.districtName}
                        </td>
                        <td className="py-3 text-right text-white">
                          {formatUnitPrice(district.avgPrice)}
                        </td>
                        <td className={cn(
                          'py-3 text-right text-sm font-medium',
                          district.change7d >= 0 ? 'text-accent-up' : 'text-accent-down'
                        )}>
                          {district.change7d >= 0 ? '+' : ''}{district.change7d}%
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Calendar className="h-6 w-6 text-accent-verified" />
              历史数据列表
            </h2>
            <span className="text-sm text-white/50">
              共 {historyData.length} 条记录
            </span>
          </div>
          <div className="card rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-white/60 text-sm">
                    <th className="text-left py-3 px-4 font-medium">日期</th>
                    <th className="text-right py-3 px-4 font-medium">均价</th>
                    <th className="text-right py-3 px-4 font-medium">涨跌</th>
                    <th className="text-right py-3 px-4 font-medium">成交量</th>
                    <th className="text-left py-3 px-4 font-medium">备注事件</th>
                  </tr>
                </thead>
                <tbody>
                  {[...historyData].reverse().map((item, index) => (
                    <motion.tr
                      key={item.date}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-t border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-white/80">
                        {item.date}
                      </td>
                      <td className="py-3 px-4 text-right text-white font-medium">
                        {formatUnitPrice(item.avgPrice)}
                      </td>
                      <td className={cn(
                        'py-3 px-4 text-right font-medium',
                        item.change >= 0 ? 'text-accent-up' : 'text-accent-down'
                      )}>
                        <span className="inline-flex items-center gap-1">
                          {item.change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {item.change >= 0 ? '+' : ''}{item.change}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white/70">
                        {item.transactionVolume.toLocaleString()} 套
                      </td>
                      <td className="py-3 px-4">
                        {item.event ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-accent-verified/20 text-accent-verified">
                            <Zap className="h-3 w-3" />
                            {item.event}
                          </span>
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {snapshot && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mb-16"
          >
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
              <BarChart3 className="h-6 w-6 text-accent-verified" />
              {selectedYear}年核心指标
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={snapshot.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 contents"
                >
                  <div className="card rounded-xl bg-gradient-to-br from-accent-verified/20 to-accent-verified/5 border border-accent-verified/20 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">平均房价</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                          {formatUnitPrice(snapshot.avgPrice)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-verified/20">
                        <Building2 className="h-6 w-6 text-accent-verified" />
                      </div>
                    </div>
                  </div>

                  <div className="card rounded-xl bg-gradient-to-br from-accent-up/20 to-accent-up/5 border border-accent-up/20 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">成交量</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                          {snapshot.transactionVolume.toLocaleString()} 套
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-up/20">
                        <TrendingUp className="h-6 w-6 text-accent-up" />
                      </div>
                    </div>
                  </div>

                  <div className="card rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 border border-primary-500/20 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">挂牌总量</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                          {snapshot.totalListings.toLocaleString()} 套
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20">
                        <BarChart3 className="h-6 w-6 text-primary-400" />
                      </div>
                    </div>
                  </div>

                  <div className="card rounded-xl bg-gradient-to-br from-accent-down/20 to-accent-down/5 border border-accent-down/20 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">最高涨幅区域</p>
                        <p className="mt-1 text-xl font-bold text-white">
                          {topGrowthDistrict?.districtName}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-sm text-accent-down">
                          <TrendingUp className="h-4 w-4" />
                          +{topGrowthDistrict?.change7d}%
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-down/20">
                        <Star className="h-6 w-6 text-accent-down" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
