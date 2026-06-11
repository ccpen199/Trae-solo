import { motion } from 'framer-motion';
import {
  Globe,
  Sparkles,
  GitCompareArrows,
  Hourglass,
} from 'lucide-react';
import type { PropertyCategory } from '@/mock/data';

interface CategoryAggregationPanelProps {
  activeCategory: PropertyCategory;
}

const sourceData: Record<PropertyCategory, { name: string; count: number }[]> = {
  secondhand: [
    { name: '链家', count: 3280 },
    { name: '贝壳', count: 2960 },
    { name: '安居客', count: 2150 },
    { name: '58同城', count: 1870 },
    { name: '我爱我家', count: 1240 },
    { name: '中原地产', count: 890 },
  ],
  new: [
    { name: '贝壳', count: 1560 },
    { name: '安居客', count: 1320 },
    { name: '链家', count: 1100 },
    { name: '房天下', count: 980 },
    { name: '搜狐焦点', count: 650 },
  ],
  rental: [
    { name: '58同城', count: 4120 },
    { name: '安居客', count: 2890 },
    { name: '链家', count: 1760 },
    { name: '自如', count: 1530 },
    { name: '贝壳', count: 1200 },
    { name: '蛋壳', count: 680 },
  ],
  overseas: [
    { name: '居外网', count: 860 },
    { name: '链家海外', count: 540 },
    { name: '安居客海外', count: 420 },
    { name: '贝氏海外', count: 310 },
  ],
  vacation: [
    { name: '途家', count: 1280 },
    { name: '小猪短租', count: 960 },
    { name: '链家旅居', count: 640 },
    { name: '贝壳旅居', count: 520 },
    { name: '58同城旅居', count: 380 },
  ],
};

const cleaningSteps = [
  { name: '图片OCR比对', pct: 98 },
  { name: '电话号码一致性校验', pct: 95 },
  { name: '挂牌时效衰减加权', pct: 92 },
  { name: '行政区划标准映射', pct: 99 },
];

const priceComparisons: Record<PropertyCategory, { title: string; sources: { name: string; price: string }[] }[]> = {
  secondhand: [
    { title: '朝阳区 3室2厅 120㎡', sources: [{ name: '链家', price: '890万' }, { name: '贝壳', price: '885万' }, { name: '安居客', price: '905万' }] },
    { title: '海淀区 2室1厅 78㎡', sources: [{ name: '链家', price: '620万' }, { name: '贝壳', price: '615万' }, { name: '我爱我家', price: '630万' }] },
    { title: '丰台区 3室1厅 95㎡', sources: [{ name: '安居客', price: '510万' }, { name: '58同城', price: '505万' }, { name: '贝壳', price: '520万' }] },
  ],
  new: [
    { title: '通州区 新盘 3室2厅', sources: [{ name: '贝壳', price: '450万' }, { name: '房天下', price: '448万' }, { name: '链家', price: '455万' }] },
    { title: '昌平区 新盘 2室1厅', sources: [{ name: '安居客', price: '380万' }, { name: '贝壳', price: '375万' }, { name: '搜狐焦点', price: '382万' }] },
    { title: '大兴区 新盘 3室2厅', sources: [{ name: '链家', price: '420万' }, { name: '房天下', price: '418万' }, { name: '贝壳', price: '425万' }] },
  ],
  rental: [
    { title: '朝阳区 精装1室', sources: [{ name: '58同城', price: '5500元/月' }, { name: '自如', price: '5800元/月' }, { name: '链家', price: '5600元/月' }] },
    { title: '海淀区 2室1厅', sources: [{ name: '安居客', price: '7200元/月' }, { name: '贝壳', price: '7000元/月' }, { name: '58同城', price: '6800元/月' }] },
    { title: '西城区 整租1室', sources: [{ name: '链家', price: '4800元/月' }, { name: '自如', price: '5100元/月' }, { name: '蛋壳', price: '4900元/月' }] },
  ],
  overseas: [
    { title: '东京 新宿区 2LDK', sources: [{ name: '居外网', price: '¥580万' }, { name: '链家海外', price: '¥575万' }, { name: '贝氏海外', price: '¥585万' }] },
    { title: '曼谷 CBD 1室', sources: [{ name: '居外网', price: '¥120万' }, { name: '安居客海外', price: '¥118万' }, { name: '链家海外', price: '¥122万' }] },
    { title: '悉尼 2室1卫', sources: [{ name: '贝氏海外', price: '¥480万' }, { name: '居外网', price: '¥475万' }, { name: '链家海外', price: '¥485万' }] },
  ],
  vacation: [
    { title: '三亚 海棠湾 2室', sources: [{ name: '途家', price: '280万' }, { name: '链家旅居', price: '278万' }, { name: '贝壳旅居', price: '285万' }] },
    { title: '大理 古城旁 1室', sources: [{ name: '小猪短租', price: '95万' }, { name: '途家', price: '92万' }, { name: '链家旅居', price: '98万' }] },
    { title: '厦门 环岛路 精装', sources: [{ name: '贝壳旅居', price: '320万' }, { name: '途家', price: '315万' }, { name: '58同城旅居', price: '318万' }] },
  ],
};

const listingAgeData: Record<PropertyCategory, { avg: number; distribution: { range: string; pct: number }[] }> = {
  secondhand: { avg: 42, distribution: [{ range: '0-7天', pct: 18 }, { range: '7-30天', pct: 32 }, { range: '30-90天', pct: 28 }, { range: '90天+', pct: 22 }] },
  new: { avg: 65, distribution: [{ range: '0-7天', pct: 12 }, { range: '7-30天', pct: 25 }, { range: '30-90天', pct: 35 }, { range: '90天+', pct: 28 }] },
  rental: { avg: 18, distribution: [{ range: '0-7天', pct: 35 }, { range: '7-30天', pct: 38 }, { range: '30-90天', pct: 20 }, { range: '90天+', pct: 7 }] },
  overseas: { avg: 78, distribution: [{ range: '0-7天', pct: 8 }, { range: '7-30天', pct: 18 }, { range: '30-90天', pct: 32 }, { range: '90天+', pct: 42 }] },
  vacation: { avg: 55, distribution: [{ range: '0-7天', pct: 10 }, { range: '7-30天', pct: 22 }, { range: '30-90天', pct: 38 }, { range: '90天+', pct: 30 }] },
};

const barColors = ['bg-primary-800', 'bg-primary-600', 'bg-primary-400', 'bg-primary-200'];

export default function CategoryAggregationPanel({ activeCategory }: CategoryAggregationPanelProps) {
  const sources = sourceData[activeCategory];
  const comparisons = priceComparisons[activeCategory];
  const age = listingAgeData[activeCategory];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card"
        >
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary-800" />
            <h4 className="font-semibold text-neutral-900">跨渠道聚合</h4>
            <span className="ml-auto rounded-full bg-primary-800 px-2.5 py-0.5 text-xs font-medium text-white">
              每日抓取 800+ 站点
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5"
              >
                <span className="text-sm text-neutral-700">{s.name}</span>
                <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-medium text-primary-800">
                  {s.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card"
        >
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-verified" />
            <h4 className="font-semibold text-neutral-900">12层清洗质量</h4>
            <span className="ml-auto text-xs text-neutral-400">核心指标</span>
          </div>
          <div className="space-y-3">
            {cleaningSteps.map((step) => (
              <div key={step.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-neutral-600">{step.name}</span>
                  <span className="font-medium text-primary-800">{step.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${step.pct}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
        >
          <div className="mb-4 flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-accent-down" />
            <h4 className="font-semibold text-neutral-900">来源比对</h4>
          </div>
          <div className="space-y-3">
            {comparisons.map((item) => (
              <div key={item.title} className="rounded-lg border border-neutral-100 p-3">
                <p className="mb-2 text-sm font-medium text-neutral-800">{item.title}</p>
                <div className="flex items-center gap-3">
                  {item.sources.map((src) => (
                    <div key={src.name} className="flex items-center gap-1.5">
                      <span className="text-xs text-neutral-400">{src.name}</span>
                      <span className="text-sm font-semibold text-neutral-900">{src.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card"
        >
          <div className="mb-4 flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-accent-up" />
            <h4 className="font-semibold text-neutral-900">挂牌时效</h4>
          </div>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900">{age.avg}</span>
            <span className="text-sm text-neutral-500">天平均挂牌时长</span>
          </div>
          <div className="space-y-2">
            {age.distribution.map((d, i) => (
              <div key={d.range} className="flex items-center gap-3">
                <span className="w-16 text-xs text-neutral-500">{d.range}</span>
                <div className="flex-1">
                  <div className="h-5 overflow-hidden rounded bg-neutral-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                      className={`flex h-full items-center justify-end pr-2 ${barColors[i]} rounded`}
                    >
                      <span className="text-xs font-medium text-white">{d.pct}%</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
