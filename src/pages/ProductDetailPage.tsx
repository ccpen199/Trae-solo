import * as React from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
  ChevronLeft, ChevronRight, Star, ShieldCheck,
  Barcode, Info, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const miniTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 10, top: 15, bottom: 25 },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLine: { lineStyle: { color: '#2E2E3D' } },
    axisLabel: { color: '#86869B', fontSize: 10 },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    axisLabel: { color: '#86869B', fontSize: 10, formatter: '¥{value}' },
  },
  series: [
    {
      type: 'line',
      data: [8200, 8500, 8800, 9100, 9300, 9800],
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#C9A962', width: 2.5 },
      itemStyle: { color: '#C9A962', borderColor: '#0A0A0F', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(201,169,98,0.4)' },
            { offset: 1, color: 'rgba(201,169,98,0)' },
          ],
        },
      },
    },
  ],
};

const gradients = [
  'from-emerald-600/50 via-green-700/40 to-forest-900/60',
  'from-blue-600/50 via-indigo-700/40 to-ink-900/60',
  'from-amber-600/50 via-orange-700/40 to-ink-900/60',
  'from-rose-600/50 via-pink-700/40 to-ink-900/60',
  'from-purple-600/50 via-violet-700/40 to-ink-900/60',
  'from-cyan-600/50 via-teal-700/40 to-ink-900/60',
];

const specs = [
  { key: '屏幕尺寸', value: '6.7 英寸 Super Retina XDR' },
  { key: '处理器', value: 'A17 Pro 芯片' },
  { key: '存储容量', value: '256GB / 512GB / 1TB' },
  { key: '摄像头', value: '4800万 三摄系统' },
  { key: '电池容量', value: '4422 mAh' },
  { key: '机身材质', value: '钛金属边框 + 玻璃背板' },
  { key: '防水等级', value: 'IP68 (6米/30分钟)' },
  { key: '重量', value: '221 克' },
];

const authRules = [
  { title: '序列号验证', desc: '格式校验 + 官方数据库比对', status: 'pass' },
  { title: '外观特征点', desc: 'Logo刻字、螺丝孔、按键阻尼等18项检测', status: 'pass' },
  { title: '功能完整性', desc: '面容ID、振动马达、扬声器、摄像头等', status: 'pass' },
  { title: '主板防伪', desc: '激光雕刻码 + X光透视比对', status: 'manual' },
];

const ProductDetailPage: React.FC = () => {
  const [activeImage, setActiveImage] = React.useState(0);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4" />
            返回商品库
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-4"
          >
            <div className={`relative aspect-square rounded-3xl overflow-hidden border border-white/[0.06] bg-gradient-to-br ${gradients[activeImage]}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-[12rem] font-bold text-white/15 tracking-tighter">
                  {['A', 'B', 'C', 'D', 'E', 'F'][activeImage]}
                </span>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,15,0.3)_100%)]" />
              <div className="absolute top-5 left-5 flex gap-2">
                <Badge variant="gold">官方正品</Badge>
                <Badge variant="success">AI已验真</Badge>
              </div>
              <button
                onClick={() => setActiveImage((i) => (i - 1 + 6) % 6)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ink-950/70 backdrop-blur border border-white/10 flex items-center justify-center text-ink-200 hover:text-gold-400 hover:border-gold-500/50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveImage((i) => (i + 1) % 6)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ink-950/70 backdrop-blur border border-white/10 flex items-center justify-center text-ink-200 hover:text-gold-400 hover:border-gold-500/50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-5 right-5 px-3 py-1.5 rounded-full bg-ink-950/70 backdrop-blur border border-white/10 text-xs text-ink-200 font-medium">
                {activeImage + 1} / 6
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {gradients.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                    activeImage === i ? 'gold-border shadow-gold-sm scale-105' : 'border-white/[0.06] opacity-70 hover:opacity-100'
                  } bg-gradient-to-br ${g}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold text-white/30">
                    {['A', 'B', 'C', 'D', 'E', 'F'][i]}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="info">Apple</Badge>
                <Badge variant="warning">热门口碑</Badge>
                <div className="flex items-center gap-1 text-amberLux-400 text-sm ml-auto">
                  <Star className="w-4 h-4 fill-amberLux-400" />
                  <span className="font-semibold">4.9</span>
                  <span className="text-ink-400">(3,280 评价)</span>
                </div>
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-ink-50 tracking-tight leading-tight">
                iPhone 15 Pro Max <span className="gold-text">256GB 原色钛金属</span>
              </h1>
              <p className="text-ink-300 mt-2">2023款 · 国行正品 · 全网通5G</p>
            </div>

            <Card goldBorder className="p-6">
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm text-ink-400">S级成色 回收均价</span>
                <Badge variant="success" dot>实时更新</Badge>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl font-bold gold-text leading-none">
                  ¥9,200
                </span>
                <span className="text-jade-400 text-sm font-semibold">↑ 3.8% 月涨幅</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/[0.06]">
                {[
                  { level: 'S', price: '9,200', desc: '准新成色' },
                  { level: 'A', price: '8,100', desc: '轻微使用' },
                  { level: 'B', price: '6,800', desc: '正常使用' },
                ].map((g) => (
                  <div key={g.level} className="text-center p-2 rounded-xl bg-ink-800/40">
                    <Badge variant={g.level === 'S' ? 'gold' : g.level === 'A' ? 'success' : 'warning'}>
                      {g.level}级
                    </Badge>
                    <p className="mt-2 font-bold text-ink-50">¥{g.price}</p>
                    <p className="text-[11px] text-ink-400 mt-0.5">{g.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-gold-400" />
                  <CardTitle className="text-base">真伪校验规则</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {authRules.map((r) => (
                  <div
                    key={r.title}
                    className="flex items-center justify-between p-3 rounded-xl bg-ink-800/40 border border-white/[0.05]"
                  >
                    <div>
                      <p className="font-medium text-sm text-ink-100">{r.title}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{r.desc}</p>
                    </div>
                    <Badge variant={r.status === 'pass' ? 'success' : 'warning'}>
                      {r.status === 'pass' ? '自动' : '人工复核'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="p-0 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-400" />
                    <CardTitle className="text-base">近半年回收均价走势</CardTitle>
                  </div>
                  <span className="text-xs text-jade-400 font-semibold">↑ 19.5%</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-44 -mx-4">
                  <ReactECharts option={miniTrendOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button size="lg" className="w-full animate-glow-pulse">
                <ShieldCheck className="w-5 h-5" />
                立即估价回收
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-ink-400">
                <Info className="w-3.5 h-3.5" />
                免费上门 · 即时打款 · 30天保障
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16"
        >
          <Card>
            <CardHeader>
              <CardTitle>规格参数表</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-2 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
                {specs.map((s) => (
                  <div key={s.key} className="grid grid-cols-3 bg-ink-850/80 hover:bg-ink-800/80 transition-colors">
                    <div className="px-5 py-4 text-sm text-ink-400 flex items-center">
                      {s.key}
                    </div>
                    <div className="col-span-2 px-5 py-4 text-sm text-ink-100 font-medium border-l border-white/[0.04] flex items-center">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export { ProductDetailPage };
export default ProductDetailPage;
