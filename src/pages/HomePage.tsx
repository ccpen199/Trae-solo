import * as React from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
  Smartphone, Camera, Watch, Briefcase, Gem, Laptop,
  Search, Sparkles, TrendingUp, TrendingDown,
  FileSearch, Truck, Banknote, ShieldCheck, Leaf,
  Award, Gauge, RefreshCw, Barcode,
  ChevronRight, ArrowRight, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { CountUp } from '@/components/ui/CountUp';
import { StatusTimeline } from '@/components/ui/StatusTimeline';
import type { MarketTicker, LatestDeal, TimelineItem, Category } from '@/types';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const categories: { id: string; name: string; icon: string; avgPrice: string; gradient: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: '1', name: '手机', icon: 'smartphone', avgPrice: '¥3,800', gradient: 'from-indigo-600/30 via-blue-600/20 to-transparent', Icon: Smartphone },
  { id: '2', name: '相机', icon: 'camera', avgPrice: '¥8,500', gradient: 'from-purple-600/30 via-pink-600/20 to-transparent', Icon: Camera },
  { id: '3', name: '名表', icon: 'watch', avgPrice: '¥35,000', gradient: 'from-amber-600/30 via-orange-600/20 to-transparent', Icon: Watch },
  { id: '4', name: '包包', icon: 'briefcase', avgPrice: '¥18,000', gradient: 'from-rose-600/30 via-red-600/20 to-transparent', Icon: Briefcase },
  { id: '5', name: '珠宝', icon: 'gem', avgPrice: '¥25,000', gradient: 'from-emerald-600/30 via-teal-600/20 to-transparent', Icon: Gem },
  { id: '6', name: '笔记本', icon: 'laptop', avgPrice: '¥6,200', gradient: 'from-cyan-600/30 via-sky-600/20 to-transparent', Icon: Laptop },
];

const luxuryBrands = [
  'ROLEX', 'PATEK', 'AP', 'HERMÈS', 'CHANEL', 'LV', 'DIOR', 'CARTIER',
  'VCA', 'BVLGARI', 'TIFFANY', 'GUCCI', 'PRADA', 'FENDI', 'LOEWE',
  'APPLE', 'HUAWEI', 'SONY', 'CANON', 'NIKON', 'LEICA', 'RICHMOND',
  'OMEGA', 'IWC', 'JAEGER', 'BREITLING',
];

const marketTickers: MarketTicker[] = [
  { brand: 'Rolex', model: 'Submariner', price: 89500, change: 2.35 },
  { brand: 'Hermès', model: 'Birkin 30', price: 238000, change: 4.12 },
  { brand: 'Apple', model: 'iPhone 15PM', price: 8200, change: -1.08 },
  { brand: 'Cartier', model: 'Tank Solo', price: 32800, change: 1.56 },
  { brand: 'Chanel', model: 'Classic Flap', price: 68500, change: 3.21 },
  { brand: 'LV', model: 'Speedy 25', price: 18200, change: 0.89 },
  { brand: 'Sony', model: 'A7IV', price: 15800, change: -0.45 },
];

const processSteps = [
  { title: '发起估价', desc: '30秒智能估价', Icon: FileSearch },
  { title: '上门检测', desc: '免费专人服务', Icon: Truck },
  { title: '即时打款', desc: '验机秒到账', Icon: Banknote },
  { title: '30天保障', desc: '无忧售后', Icon: ShieldCheck },
  { title: '环保贡献', desc: '绿色循环', Icon: Leaf },
];

const latestDeals: LatestDeal[] = [
  { id: '1', brand: 'Rolex', model: 'Submariner Date', grade: 'S', price: 89500, initial: 'R', gradient: 'from-emerald-600/60 to-forest-700/60' },
  { id: '2', brand: 'Hermès', model: 'Birkin 30 Epsom', grade: 'A', price: 218000, initial: 'H', gradient: 'from-orange-600/60 to-amber-700/60' },
  { id: '3', brand: 'Apple', model: 'iPhone 15 Pro Max 512', grade: 'S', price: 9200, initial: 'A', gradient: 'from-slate-600/60 to-ink-700/60' },
  { id: '4', brand: 'Chanel', model: 'Classic Flap Medium', grade: 'A', price: 62800, initial: 'C', gradient: 'from-rose-600/60 to-pink-700/60' },
  { id: '5', brand: 'Louis Vuitton', model: 'Neverfull MM', grade: 'B', price: 9800, initial: 'L', gradient: 'from-amber-700/60 to-yellow-800/60' },
  { id: '6', brand: 'Cartier', model: 'Love Bracelet 18K', grade: 'S', price: 48500, initial: 'C', gradient: 'from-yellow-600/60 to-gold-700/60' },
  { id: '7', brand: 'Sony', model: 'A7R V 机身', grade: 'A', price: 22800, initial: 'S', gradient: 'from-indigo-600/60 to-blue-700/60' },
  { id: '8', brand: 'Omega', model: 'Seamaster 300', grade: 'A', price: 32500, initial: 'O', gradient: 'from-blue-700/60 to-cyan-800/60' },
  { id: '9', brand: 'Dior', model: 'Lady Dior Mini', grade: 'S', price: 38500, initial: 'D', gradient: 'from-fuchsia-600/60 to-purple-700/60' },
  { id: '10', brand: 'Patek', model: 'Nautilus 5711', grade: 'S', price: 680000, initial: 'P', gradient: 'from-blue-900/70 to-indigo-900/70' },
  { id: '11', brand: 'Gucci', model: 'GG Marmont', grade: 'B', price: 7200, initial: 'G', gradient: 'from-green-800/60 to-emerald-900/60' },
  { id: '12', brand: 'Leica', model: 'Q2 全幅', grade: 'A', price: 38800, initial: 'L', gradient: 'from-red-800/70 to-rose-900/70' },
];

const miniChartOption = {
  grid: { left: 0, right: 0, top: 8, bottom: 0 },
  xAxis: {
    type: 'category',
    show: false,
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: [
    {
      type: 'line',
      data: [100, 115, 108, 128, 142, 156],
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#C9A962', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(201,169,98,0.35)' },
            { offset: 1, color: 'rgba(201,169,98,0)' },
          ],
        },
      },
    },
  ],
};

const timeline: TimelineItem[] = [
  { id: '1', title: '申请退货', description: '提交退货申请', time: '第1天', status: 'done' },
  { id: '2', title: '检测审核', description: '检测师24小时内审核', time: '第2天', status: 'done' },
  { id: '3', title: '退款到账', description: '款项原路返回', time: '第3-5天', status: 'active' },
  { id: '4', title: '完成保障', description: '流程结束，服务评价', time: '完成', status: 'pending' },
];

const HomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('全部');

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient-bg" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-forest-600/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-gold-500/10 blur-[120px]" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              {...fadeUp}
              className="space-y-8 max-w-xl"
            >
              <Badge variant="gold" dot>
                <Sparkles className="w-3 h-3" />
                行业领先 · 全国连锁
              </Badge>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-balance">
                <span className="text-ink-50">让每一件奢侈品，</span>
                <br />
                <span className="gold-text">遇见更高价值</span>
              </h1>

              <p className="text-lg text-ink-300 leading-relaxed max-w-lg">
                臻回收 - 专业奢侈品回收平台。AI智能检测 + 持证专家双重保障，
                全国200+城市免费上门，让闲置奢品回归应有价值。
              </p>

              <div className="flex flex-col sm:flex-row items-stretch gap-3 p-2 rounded-3xl bg-ink-850/70 border border-white/[0.08] backdrop-blur-xl shadow-2xl">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-12 sm:w-36 px-4 rounded-2xl bg-ink-800/80 border border-white/[0.06] text-ink-100 text-sm font-medium focus:outline-none focus:border-gold-500/50"
                >
                  <option value="全部">全品类</option>
                  <option value="手机">手机数码</option>
                  <option value="相机">相机镜头</option>
                  <option value="名表">奢华腕表</option>
                  <option value="包包">品牌箱包</option>
                  <option value="珠宝">珠宝首饰</option>
                  <option value="笔记本">笔记本电脑</option>
                </select>
                <div className="flex-1 flex items-center h-12 px-4 rounded-2xl bg-ink-800/80 border border-white/[0.06]">
                  <Search className="w-4 h-4 text-ink-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="搜索品牌、型号..."
                    className="w-full h-full bg-transparent ml-3 text-sm text-ink-100 placeholder:text-ink-400 focus:outline-none"
                  />
                </div>
                <Button size="md" className="animate-glow-pulse">
                  立即估价
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-6 text-xs text-ink-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-jade-400" />
                  隐私保护
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gold-400" />
                  保价回收
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-forest-400" />
                  免费上门
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <Card goldBorder className="p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gold-400" />
                    <h3 className="font-semibold text-ink-50">实时行情</h3>
                  </div>
                  <Badge variant="success" dot>实时更新</Badge>
                </div>
                <div className="divide-y divide-white/[0.04] max-h-52 overflow-hidden">
                  {marketTickers.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-ink-700/50 border border-white/[0.06] flex items-center justify-center text-xs font-bold text-gold-400">
                          {t.brand[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink-100">{t.brand}</p>
                          <p className="text-xs text-ink-400">{t.model}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-ink-100">
                          ¥{t.price.toLocaleString()}
                        </p>
                        <p
                          className={`text-xs font-medium flex items-center gap-0.5 justify-end ${t.change >= 0 ? 'text-jade-400' : 'text-coral-400'}`}
                        >
                          {t.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {t.change >= 0 ? '+' : ''}
                          {t.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <motion.div
                variants={stagger}
                initial="initial"
                animate="animate"
                className="grid grid-cols-3 gap-4"
              >
                <motion.div variants={fadeUp}>
                  <StatCard
                    icon={<Award className="w-6 h-6" />}
                    label="累计回收件数"
                    value={<CountUp end={128650} suffix="+" />}
                    trend="up"
                    trendPercent="+12.5%"
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <StatCard
                    icon={<Leaf className="w-6 h-6" />}
                    label="节省碳排放"
                    value={<CountUp end={5200} suffix="吨" />}
                    trend="up"
                    trendPercent="+8.3%"
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <StatCard
                    icon={<Gauge className="w-6 h-6" />}
                    label="平均高于市价"
                    value={<CountUp end={15.8} decimals={1} suffix="%" />}
                    trend="up"
                    trendPercent="+2.1%"
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 品类导航 */}
      <section className="relative py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <motion.div
            {...fadeUp}
            className="text-center max-w-2xl mx-auto space-y-4"
          >
            <Badge variant="info">六大品类</Badge>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
              覆盖<span className="gold-text">全品类</span>奢侈品回收
            </h2>
            <p className="text-ink-300">从数码到珠宝，从腕表到箱包，专业团队一站式服务</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5"
          >
            {categories.map((c) => (
              <motion.div
                key={c.id}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card
                  goldBorder
                  className="group cursor-pointer relative overflow-hidden p-6 text-center space-y-4 h-full hover:shadow-gold-sm transition-all duration-500"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gold-soft border border-gold-500/25 flex items-center justify-center text-gold-400 group-hover:scale-110 group-hover:shadow-gold-sm transition-all duration-500">
                      <c.Icon className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="relative z-10 space-y-1">
                    <h3 className="font-semibold text-ink-50 text-lg group-hover:text-gold-400 transition-colors duration-300">
                      {c.name}
                    </h3>
                    <p className="text-xs text-ink-400">回收均价</p>
                    <p className="text-lg font-bold gold-text">{c.avgPrice}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* 品牌墙 */}
          <motion.div {...fadeUp} className="space-y-6 pt-6">
            <p className="text-center text-sm text-ink-400 uppercase tracking-[0.25em]">
              合作 500+ 奢侈品牌
            </p>
            <div className="marquee-container py-4">
              <div className="marquee-track">
                {[...luxuryBrands, ...luxuryBrands].map((brand, i) => (
                  <div
                    key={i}
                    className="w-24 h-24 shrink-0 rounded-2xl glass-card gold-border flex items-center justify-center hover:shadow-gold-sm transition-all duration-300 group"
                  >
                    <span className="font-display text-sm font-bold text-ink-300 group-hover:text-gold-400 transition-colors tracking-wider">
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 服务流程 */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,76,58,0.15),transparent_70%)]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto space-y-4">
            <Badge variant="gold">五步流程</Badge>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
              便捷高效的<span className="gold-text">回收之旅</span>
            </h2>
            <p className="text-ink-300">从发起估价到完成打款，最快2小时</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.1 }}
            className="relative grid grid-cols-1 md:grid-cols-5 gap-6"
          >
            <div className="hidden md:block absolute top-1/2 inset-x-[10%] h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

            {processSteps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                className="relative text-center"
              >
                <div className="relative z-10 mx-auto w-20 h-20 rounded-3xl bg-gold-gradient flex items-center justify-center shadow-gold-sm group hover:shadow-gold transition-all duration-500 hover:scale-105">
                  <step.Icon className="w-9 h-9 text-ink-950" strokeWidth={2} />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-ink-850 border-2 border-gold-500 text-gold-400 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div className="mt-6 space-y-1.5">
                  <h3 className="font-semibold text-lg text-ink-50">{step.title}</h3>
                  <p className="text-sm text-ink-400">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 信任背书 */}
      <section className="relative py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto space-y-4">
            <Badge variant="success">四大承诺</Badge>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
              为什么选择<span className="gold-text">臻回收</span>
            </h2>
            <p className="text-ink-300">透明、专业、可靠，回收每一步都值得信赖</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={fadeUp}>
              <Card goldBorder className="p-6 h-full space-y-5 hover:shadow-gold-sm transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-jade-500/15 border border-jade-500/30 flex items-center justify-center text-jade-400">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-ink-50">持证检测师</h3>
                  <p className="text-sm text-ink-400 leading-relaxed">
                    300+ 中检认证检测师，平均从业 8 年以上，权威鉴定
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex -space-x-2">
                    {['W', 'C', 'L'].map((a, i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full border-2 border-ink-850 flex items-center justify-center text-[11px] font-bold"
                        style={{
                          background: `linear-gradient(135deg, ${['#0F4C3A', '#6B562B', '#15634B'][i]}, #222)`,
                          color: '#D4BA7A',
                        }}
                      >
                        {a}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Badge variant="gold">中检</Badge>
                    <Badge variant="info">国检</Badge>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card goldBorder className="p-6 h-full space-y-5 hover:shadow-gold-sm transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-gold-soft border border-gold-500/30 flex items-center justify-center text-gold-400">
                  <Gauge className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-ink-50">三方比价</h3>
                  <p className="text-sm text-ink-400 leading-relaxed">
                    接入京东/闲鱼/平台三方数据，保证高价回收，透明可查
                  </p>
                </div>
                <div className="h-28">
                  <ReactECharts option={miniChartOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card goldBorder className="p-6 h-full space-y-5 hover:shadow-gold-sm transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-amberLux-500/15 border border-amberLux-500/30 flex items-center justify-center text-amberLux-400">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-ink-50">30天无理由退货</h3>
                  <p className="text-sm text-ink-400 leading-relaxed">
                    超长售后保障期，不满意可退，退款5个工作日内到账
                  </p>
                </div>
                <StatusTimeline items={timeline} className="pt-2" />
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card goldBorder className="p-6 h-full space-y-5 hover:shadow-gold-sm transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-forest-500/15 border border-forest-500/30 flex items-center justify-center text-forest-300">
                  <Barcode className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-ink-50">正品溯源</h3>
                  <p className="text-sm text-ink-400 leading-relaxed">
                    每一件商品序列号校验，全流程区块链存证，可追溯可验证
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-ink-800/60 border border-white/[0.06] space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-ink-400">
                    <span>SERIAL</span>
                    <span className="text-gold-400">✓ 校验通过</span>
                  </div>
                  <div className="text-ink-200 break-all">SN: RX5711-1A-010-{'>'}8922AC</div>
                  <div className="h-8 flex items-end gap-0.5 pt-2">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-forest-400/60"
                        style={{ height: `${20 + Math.sin(i) * 40 + Math.random() * 40}%` }}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 最新成交 */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <motion.div
            {...fadeUp}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          >
            <div className="space-y-3">
              <Badge variant="warning">实时更新</Badge>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
                最新<span className="gold-text">成交记录</span>
              </h2>
              <p className="text-ink-300">看看其他用户的回收成交案例</p>
            </div>
            <Button variant="ghost" size="md">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8 }}
            className="overflow-x-auto pb-6 -mx-4 px-4"
          >
            <div className="flex gap-5 w-max">
              {latestDeals.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  className="w-64 shrink-0"
                >
                  <Card className="p-0 overflow-hidden h-full hover:shadow-gold-sm hover:gold-border transition-all duration-400">
                    <div className={`relative aspect-[4/3] bg-gradient-to-br ${d.gradient}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-display text-7xl font-bold text-white/30 tracking-tighter">
                          {d.initial}
                        </span>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge variant={d.grade === 'S' ? 'gold' : d.grade === 'A' ? 'success' : d.grade === 'B' ? 'warning' : 'danger'}>
                          {d.grade}级成色
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />
                    </div>
                    <div className="p-5 space-y-3">
                      <div>
                        <p className="text-xs text-ink-400">{d.brand}</p>
                        <h3 className="text-base font-semibold text-ink-50 truncate">{d.model}</h3>
                      </div>
                      <div className="divider-gold" />
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-ink-400">成交价</span>
                        <span className="text-xl font-bold gold-text">
                          ¥{d.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="relative rounded-3xl overflow-hidden p-10 lg:p-16 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-forest-800/80 via-forest-900/90 to-ink-900" />
            <div className="absolute inset-0 noise-overlay" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gold-500/10 blur-[120px]" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <Badge variant="gold">立即行动</Badge>
              <h2 className="font-display text-4xl lg:text-6xl font-bold leading-tight text-ink-50 tracking-tight">
                准备好开启
                <br />
                <span className="gold-text">回收之旅</span>？
              </h2>
              <p className="text-lg text-forest-100/70">
                30秒快速估价，免费上门检测，让闲置奢品焕发新生
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="animate-glow-pulse">
                  <Sparkles className="w-5 h-5" />
                  立即估价
                </Button>
                <Button size="lg" variant="secondary">
                  <MessageCircle className="w-5 h-5" />
                  联系客服
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export { HomePage };
export default HomePage;
