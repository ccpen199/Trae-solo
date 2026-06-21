import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3, Upload, Calculator, History } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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

export default function Valuation() {
  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <Tag variant="gold" className="mb-4">价值评估</Tag>
        <h1 className="section-title text-3xl md:text-4xl mb-3">藏品价值评估</h1>
        <p className="section-subtitle text-lg">基于海量拍卖数据，AI 智能估价</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        <Card className="lg:col-span-1">
          <Card.Content>
            <h2 className="font-serif text-xl font-semibold text-jade-700 mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gold-500" />
              立即估价
            </h2>
            <EmptyState
              icon={<Upload className="w-10 h-10 text-gold-500" />}
              title="上传藏品图片"
              description="上传藏品多角度图片，AI 将根据拍卖大数据为您提供专业估价"
              action={{ label: '上传藏品', onClick: () => {} }}
            />
          </Card.Content>
        </Card>

        <Card className="lg:col-span-2">
          <Card.Content>
            <h2 className="font-serif text-xl font-semibold text-jade-700 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold-500" />
              热门品类市场行情
            </h2>
            <div className="space-y-5">
              {[
                { category: '明清官窑瓷器', min: 50, max: 200, confidence: 92, trend: 'rising' as const },
                { category: '和田白玉籽料', min: 2, max: 15, confidence: 88, trend: 'stable' as const },
                { category: '近现代名家书画', min: 10, max: 80, confidence: 85, trend: 'rising' as const },
                { category: '宋代五大名窑', min: 100, max: 500, confidence: 90, trend: 'rising' as const },
                { category: '清代紫檀家具', min: 20, max: 100, confidence: 82, trend: 'declining' as const },
              ].map((item) => {
                const TrendIcon = trendIcons[item.trend];
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-jade-700">{item.category}</span>
                        <Badge variant={item.trend === 'rising' ? 'success' : item.trend === 'declining' ? 'error' : 'default'} dot>
                          {trendLabels[item.trend]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-jade-500">
                          ¥{item.min}万 - ¥{item.max}万
                        </span>
                        <TrendIcon className={['w-4 h-4', trendColors[item.trend].split(' ')[0]].join(' ')} />
                      </div>
                    </div>
                    <ProgressBar value={item.confidence} label={`可信度 ${item.confidence}%`} showLabel />
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>
      </div>

      <div>
        <h2 className="font-serif text-2xl font-bold text-jade-700 mb-6 flex items-center gap-2">
          <History className="w-5 h-5 text-gold-500" />
          近期成交参考
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: '清雍正粉彩九桃天球瓶', price: '¥ 1,280万', date: '2024-01-15', source: '苏富比' },
            { name: '明代和田玉观音摆件', price: '¥ 86万', date: '2024-01-12', source: '嘉德拍卖' },
            { name: '傅抱石山水立轴', price: '¥ 520万', date: '2024-01-10', source: '保利拍卖' },
            { name: '南宋官窑青瓷洗', price: '¥ 3,450万', date: '2024-01-08', source: '佳士得' },
          ].map((item) => (
            <Card key={item.name} hoverable>
              <Card.Content>
                <h4 className="font-serif font-semibold text-jade-700 mb-3 line-clamp-2">{item.name}</h4>
                <p className="font-serif text-xl font-bold text-gold-600 mb-3">{item.price}</p>
                <div className="flex items-center justify-between text-xs text-jade-500">
                  <span>{item.date}</span>
                  <span className="text-gold-600">{item.source}</span>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Button size="lg" rightIcon={<Calculator className="w-4 h-4" />}>获取精准估价</Button>
      </div>
    </div>
  );
}
