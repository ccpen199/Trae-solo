import * as React from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
  MapPin, Star, Award, CheckCircle2, Clock,
  FileCheck, ThumbsUp, MessageSquare, ChevronLeft,
  TrendingDown, Shield, BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Inspector } from '@/types';

const mockInspector: Inspector = {
  id: 'ins-001',
  name: '王建国',
  experience: 12,
  region: '上海 · 浦东新区',
  rating: 4.96,
  certifications: ['中检认证高级鉴定师', '国检珠宝鉴定师', '瑞士钟表协会认证', 'GIA钻石分级师'],
  deviationRate: [2.1, 1.8, 2.3, 1.5, 1.9, 2.0, 1.7, 1.4, 1.6, 1.8, 1.5, 1.3],
};

const deviationOption = {
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(10,10,15,0.95)',
    borderColor: 'rgba(201,169,98,0.3)',
    textStyle: { color: '#D7D7E0' },
  },
  legend: {
    data: ['个人偏差率', '行业均值'],
    textStyle: { color: '#86869B' },
    top: 0,
  },
  grid: { left: 50, right: 20, top: 50, bottom: 30 },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    axisLine: { lineStyle: { color: '#2E2E3D' } },
    axisLabel: { color: '#86869B' },
  },
  yAxis: {
    type: 'value',
    name: '%',
    nameTextStyle: { color: '#86869B' },
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    axisLabel: { color: '#86869B', formatter: '{value}%' },
  },
  series: [
    {
      name: '个人偏差率',
      type: 'line',
      data: mockInspector.deviationRate,
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { color: '#C9A962', width: 3 },
      itemStyle: { color: '#C9A962', borderColor: '#0A0A0F', borderWidth: 2 },
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
    {
      name: '行业均值',
      type: 'line',
      data: [5.2, 4.8, 5.5, 4.6, 5.0, 5.3, 4.9, 4.7, 5.1, 4.8, 4.5, 4.6],
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#4FC498', width: 2, type: 'dashed' },
    },
  ],
};

const reviews = [
  {
    id: '1',
    user: '陈**',
    date: '2025-06-15',
    rating: 5,
    product: 'Rolex Submariner',
    content: '王检测师非常专业，细致耐心，每个细节都解释清楚，价格也给得很公道，强烈推荐！',
    tags: ['专业度高', '态度亲和', '价格公正'],
  },
  {
    id: '2',
    user: '李**',
    date: '2025-06-10',
    rating: 5,
    product: 'Hermès Birkin 30',
    content: '上门检测非常准时，鉴定过程透明，全程录像让我很放心，打款速度也很快。',
    tags: ['准时上门', '流程透明', '打款迅速'],
  },
  {
    id: '3',
    user: '张**',
    date: '2025-06-03',
    rating: 5,
    product: 'Canon R5 + 镜头套装',
    content: '对摄影器材非常懂行，连镜头的细微霉斑都检查出来了，比门店的师傅更仔细。',
    tags: ['经验丰富', '检查细致', '知识渊博'],
  },
];

const recentOrders = [
  { id: 'o1', brand: 'Rolex', model: 'Submariner Date', grade: 'S', price: 89500, status: '已完成' },
  { id: 'o2', brand: 'Apple', model: 'iPhone 15 PM 512G', grade: 'A', price: 9200, status: '已完成' },
  { id: 'o3', brand: 'Hermès', model: 'Birkin 30 Epsom', grade: 'S', price: 218000, status: '检测中' },
  { id: 'o4', brand: 'Sony', model: 'A7R V 机身', grade: 'A', price: 22800, status: '已完成' },
  { id: 'o5', brand: 'Cartier', model: 'Love Bracelet', grade: 'S', price: 48500, status: '待打款' },
];

const InspectorProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4" />
            返回检测师列表
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <Card goldBorder className="overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-forest-800/80 via-gold-600/20 to-forest-800/80" />
            <div className="absolute inset-0 noise-overlay pointer-events-none" />
            <CardContent className="relative p-8 pt-10 lg:p-10 lg:pt-14">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="relative shrink-0">
                  <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-[28px] border-4 border-ink-850 bg-gradient-to-br from-gold-500/40 via-gold-700/30 to-forest-800/60 flex items-center justify-center shadow-gold-sm">
                    <span className="font-display text-5xl font-bold gold-text">王</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-2xl bg-jade-500 border-4 border-ink-850 flex items-center justify-center shadow-lg">
                    <BadgeCheck className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1 space-y-5 w-full">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="font-display text-3xl font-bold text-ink-50">
                        {mockInspector.name}
                      </h1>
                      <Badge variant="gold" dot>首席检测师</Badge>
                      <Badge variant="success">在线接单</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-ink-300">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gold-400" />
                        {mockInspector.region}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-gold-400" />
                        从业 {mockInspector.experience} 年
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-jade-400" />
                        累计完成 3,280+ 单
                      </span>
                      <div className="flex items-center gap-1 text-amberLux-400">
                        <Star className="w-4 h-4 fill-amberLux-400" />
                        <span className="font-bold">{mockInspector.rating}</span>
                        <span className="text-ink-400">(1,280评价)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                    {[
                      { label: '验真准确率', value: '99.8%', icon: CheckCircle2, color: 'jade' },
                      { label: '平均偏差率', value: '1.7%', icon: TrendingDown, color: 'gold' },
                      { label: '准时到达率', value: '99.2%', icon: Clock, color: 'forest' },
                      { label: '客户满意度', value: '99.5%', icon: ThumbsUp, color: 'info' },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="p-4 rounded-2xl bg-ink-850/60 border border-white/[0.06]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <s.icon
                            className={`w-4 h-4 ${
                              s.color === 'jade'
                                ? 'text-jade-400'
                                : s.color === 'gold'
                                ? 'text-gold-400'
                                : s.color === 'forest'
                                ? 'text-forest-300'
                                : 'text-forest-400'
                            }`}
                          />
                          <span className="text-xs text-ink-400">{s.label}</span>
                        </div>
                        <p className="text-xl font-bold gold-text">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 space-y-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-gold-400" />
                  <CardTitle>资质证书</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {mockInspector.certifications.map((c, i) => (
                  <div
                    key={c}
                    className="p-4 rounded-2xl bg-ink-800/50 border border-white/[0.06] flex items-center gap-4 hover:border-gold-500/30 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gold-soft border border-gold-500/25 flex items-center justify-center shrink-0 text-gold-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-ink-50">{c}</p>
                      <p className="text-xs text-ink-400 mt-0.5">证书编号 ZS-{2024 - i}****{1000 + i}</p>
                    </div>
                    <Badge variant="success">有效</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gold-400" />
                  <CardTitle>服务评价</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-ink-800/40 border border-white/[0.05] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-ink-100">{r.user}</span>
                          <Badge variant="info">已认证</Badge>
                        </div>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {r.date} · {r.product}
                        </p>
                      </div>
                      <div className="flex text-amberLux-400 shrink-0">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amberLux-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-ink-300 leading-relaxed">{r.content}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {r.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-gold-400" />
                    <CardTitle>偏差率看板（vs 行业均值）</CardTitle>
                  </div>
                  <Badge variant="success">优于行业 3.1%</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-72">
                  <ReactECharts option={deviationOption} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-gold-400" />
                  <CardTitle>TA的近期订单</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-800/60">
                      <tr className="text-left text-ink-300">
                        <th className="px-5 py-3 font-medium">商品</th>
                        <th className="px-5 py-3 font-medium">成色</th>
                        <th className="px-5 py-3 font-medium">成交价</th>
                        <th className="px-5 py-3 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-ink-100">{o.brand}</p>
                            <p className="text-xs text-ink-400">{o.model}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={o.grade === 'S' ? 'gold' : 'success'}>{o.grade}级</Badge>
                          </td>
                          <td className="px-5 py-3.5 font-semibold gold-text">
                            ¥{o.price.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={
                                o.status === '已完成' ? 'success' : o.status === '检测中' ? 'warning' : 'info'
                              }
                              dot
                            >
                              {o.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card goldBorder className="p-6 flex flex-col sm:flex-row items-center justify-between gap-5 bg-gradient-to-br from-gold-500/[0.08] via-ink-850/40 to-transparent">
              <div>
                <h3 className="font-semibold text-lg text-ink-50">指定本检测师服务</h3>
                <p className="text-sm text-ink-300 mt-1">免费上门检测，专业鉴定，优先服务</p>
              </div>
              <Button size="lg" className="shrink-0 animate-glow-pulse">
                <Award className="w-5 h-5" />
                预约上门
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export { InspectorProfilePage };
export default InspectorProfilePage;
