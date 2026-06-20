import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Info,
  ChevronRight,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { mockFinanceProducts } from '@/mocks/data/finance';
import type { FinanceProductType, RiskLevel } from '@/types/entity';

const categoryConfig: Record<FinanceProductType, { icon: typeof Shield; label: string; color: string }> = {
  INSURANCE: { icon: Shield, label: '保险保障', color: 'text-blue-400' },
  DEPOSIT: { icon: PiggyBank, label: '养老储蓄', color: 'text-green-400' },
  FUND: { icon: TrendingUp, label: '理财基金', color: 'text-amber-400' },
  LOAN: { icon: CreditCard, label: '贷款服务', color: 'text-purple-400' },
  OTHER: { icon: Info, label: '其他', color: 'text-neutral-400' },
};

const riskLevelConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  LOW: { label: '低风险', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  MEDIUM: { label: '中风险', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  HIGH: { label: '高风险', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  VERY_HIGH: { label: '极高风险', color: 'text-red-400', bgColor: 'bg-red-500/10' },
};

export default function FinanceProducts() {
  const [activeCategory, setActiveCategory] = useState<FinanceProductType | 'ALL'>('ALL');

  const filteredProducts = activeCategory === 'ALL'
    ? mockFinanceProducts
    : mockFinanceProducts.filter((p) => p.type === activeCategory);

  const categories = ['ALL', 'INSURANCE', 'DEPOSIT', 'FUND', 'LOAN'] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="普惠金融" subtitle="精选社区专属金融产品，安全有保障" />

      <div className="glass-card p-6">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const Icon = cat === 'ALL' ? Star : categoryConfig[cat].icon;
            const label = cat === 'ALL' ? '全部产品' : categoryConfig[cat].label;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product, index) => {
          const catConfig = categoryConfig[product.type];
          const riskConfig = riskLevelConfig[product.riskLevel];
          const Icon = catConfig.icon;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="glass-card-hover p-6 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${catConfig.color} bg-gradient-to-br ${product.isRecommended ? 'from-accent-500/20 to-primary-500/20' : 'bg-white/5'} flex items-center justify-center`}>
                  <Icon size={24} className={catConfig.color} />
                </div>
                {product.isRecommended && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-400 text-xs font-medium flex items-center gap-1">
                    <Star size={12} fill="currentColor" />
                    推荐
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                {product.name}
              </h3>

              <p className="text-neutral-500 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>

              {product.expectedReturn && (
                <div className="mb-4">
                  <span className="text-2xl font-bold text-gradient-accent font-mono">
                    {product.expectedReturn}
                  </span>
                  <span className="text-neutral-500 text-sm ml-2">预期年化</span>
                </div>
              )}

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={14} className="text-success-400" />
                  <span className="text-neutral-400">起购金额</span>
                  <span className="text-white ml-auto font-mono">¥{product.minAmount.toLocaleString()}</span>
                </div>
                {product.term && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-success-400" />
                    <span className="text-neutral-400">投资期限</span>
                    <span className="text-white ml-auto">{product.term}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle size={14} className={riskConfig.color} />
                  <span className="text-neutral-400">风险等级</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${riskConfig.bgColor} ${riskConfig.color}`}>
                    {riskConfig.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-neutral-500 text-xs">{product.provider}</span>
                <button className="flex items-center gap-1 text-primary-400 text-sm font-medium group/btn">
                  立即查看
                  <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="glass-card p-6">
        <h3 className="section-title mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-400" />
          风险提示
        </h3>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
          <p className="text-neutral-400 text-sm leading-relaxed">
            理财有风险，投资需谨慎。本平台展示的金融产品由持牌金融机构提供，智居云仅作为信息展示平台，不承担投资风险。
            购买前请仔细阅读产品说明书及相关法律文件，根据自身风险承受能力谨慎选择。
          </p>
        </div>
      </div>
    </div>
  );
}
