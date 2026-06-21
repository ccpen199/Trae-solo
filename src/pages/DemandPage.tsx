import { CompareView } from '@/components/demand/CompareView';
import { FilterBar } from '@/components/demand/FilterBar';
import { OrderModal } from '@/components/demand/OrderModal';
import { ProviderCard } from '@/components/demand/ProviderCard';
import { useAppStore } from '@/store/appStore';
import type { ServiceCategory, ServiceProvider } from '@/types';
import { matchProviders, type MatchResult } from '@/utils/lbs';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  FileText,
  Info,
  MapPin,
  Shield,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: '家政', label: '家政服务' },
  { value: '维修', label: '家电维修' },
  { value: '保洁', label: '保洁服务' },
  { value: '搬家', label: '搬家服务' },
  { value: '餐饮', label: '餐饮服务' },
  { value: '快递', label: '快递服务' },
  { value: '美容', label: '美容美体' },
  { value: '教育', label: '教育培训' },
];

const TIME_SLOTS = [
  '立即服务',
  '今天上午',
  '今天下午',
  '今天晚上',
  '明天上午',
  '明天下午',
  '自定义时间',
];

type ViewMode = 'card' | 'compare';
type StarFilter = 'all' | '3' | '4' | '5';
type SortBy = 'distance' | 'rating' | 'response';

export default function DemandPage() {
  const { location, addDemand, setMatchedProviders } = useAppStore();

  const [category, setCategory] = useState<ServiceCategory>('家政');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('人民广场片区128号');
  const [expectedTime, setExpectedTime] = useState('立即服务');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [starFilter, setStarFilter] = useState<StarFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('distance');

  const [orderProvider, setOrderProvider] = useState<ServiceProvider | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleMatch = () => {
    setIsMatching(true);
    setTimeout(() => {
      const results = matchProviders(category, location, 3000, 3);
      setMatches(results);
      setShowResults(true);
      setIsMatching(false);
      if (results.length > 0) {
        setMatchedProviders(results.map((r) => r.provider));
        addDemand({ category, description, location, address, expectedTime });
      }
    }, 1200);
  };

  const filteredMatches = useMemo(() => {
    let result = [...matches];
    if (starFilter !== 'all') {
      const minStar = parseInt(starFilter);
      result = result.filter((m) => m.provider.starLevel >= minStar);
    }
    result.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'rating') return b.provider.starLevel - a.provider.starLevel;
      return a.provider.responseSpeed - b.provider.responseSpeed;
    });
    return result;
  }, [matches, starFilter, sortBy]);

  const handleOrderClick = (provider: ServiceProvider) => {
    setOrderProvider(provider);
    setOrderSuccess(false);
  };

  const closeOrderModal = () => {
    setOrderProvider(null);
    setOrderSuccess(false);
  };

  return (
    <div className="min-h-screen bg-warm-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-100 rounded-full blur-3xl opacity-30 translate-y-1/3 -translate-x-1/4" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-soft mb-4">
            <Sparkles size={14} className="text-accent" />
            <span className="text-sm text-brand font-medium">AI智能匹配引擎</span>
          </div>
          <h1 className="text-3xl font-bold text-brand font-display">
            智能需求发布与匹配
          </h1>
          <p className="text-gray-500 mt-2">发布需求，3公里内优质服务商为您服务</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl2 shadow-card p-8 mb-8 border border-warm-card relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-mint-100 to-transparent rounded-full blur-2xl opacity-50" />

          <h2 className="text-xl font-bold text-brand mb-6 flex items-center gap-2 relative">
            <FileText size={20} className="text-accent" />
            发布服务需求
          </h2>

          <div className="grid md:grid-cols-2 gap-5 relative">
            <div>
              <label className="block text-sm font-medium text-brand mb-2 flex items-center gap-1.5">
                <Tag size={14} className="text-accent" />
                服务类型
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full px-4 py-3 rounded-xl2 border border-warm-card bg-warm-bg text-brand focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand mb-2 flex items-center gap-1.5">
                <Calendar size={14} className="text-accent" />
                期望时间
              </label>
              <select
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl2 border border-warm-card bg-warm-bg text-brand focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand mb-2 flex items-center gap-1.5">
                <MapPin size={14} className="text-accent" />
                服务地址
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="请输入详细地址"
                className="w-full px-4 py-3 rounded-xl2 border border-warm-card bg-warm-bg text-brand placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-brand mb-2 flex items-center gap-1.5">
                <FileText size={14} className="text-accent" />
                需求描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="需要家电清洗，一台油烟机一台洗衣机"
                className="w-full px-4 py-3 rounded-xl2 border border-warm-card bg-warm-bg text-brand placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleMatch}
            disabled={isMatching}
            className="mt-7 w-full py-4 rounded-xl2 bg-gradient-to-r from-accent to-accent-400 text-white font-bold text-lg hover:from-accent-600 hover:to-accent-500 transition-all shadow-lg shadow-accent/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative"
          >
            {isMatching ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full"
                />
                正在匹配中...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                立即匹配3公里内优质服务商
              </>
            )}
          </button>
        </motion.div>

        {showResults && matches.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-center mb-6"
            >
              <div className="inline-flex items-center gap-2 bg-mint/10 px-4 py-1.5 rounded-full mb-3">
                <CheckCircle2 size={14} className="text-mint" />
                <span className="text-sm text-mint font-medium">匹配完成</span>
              </div>
              <h2 className="text-2xl font-bold text-brand font-display">
                已为您匹配到 {matches.length} 家优质服务商
              </h2>
            </motion.div>

            <FilterBar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              starFilter={starFilter}
              onStarFilterChange={setStarFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {viewMode === 'card' && (
              <div className="grid md:grid-cols-3 gap-5 mb-8">
                {filteredMatches.map((m, idx) => (
                  <motion.div
                    key={m.provider.id}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <ProviderCard
                      provider={m.provider}
                      rank={idx + 1}
                      distance={m.distance}
                      expanded={expandedCardId === m.provider.id}
                      onToggleExpand={() =>
                        setExpandedCardId(
                          expandedCardId === m.provider.id ? null : m.provider.id
                        )
                      }
                      onOrderClick={() => handleOrderClick(m.provider)}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {viewMode === 'compare' && (
              <CompareView
                matches={filteredMatches}
                onOrderClick={handleOrderClick}
              />
            )}

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-white rounded-3xl2 p-6 shadow-soft border border-warm-card mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Info size={18} className="text-brand" />
                <span className="font-bold text-brand">匹配算法说明</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { pct: '40%', label: '星级评分', desc: '服务等级权重', color: 'accent' },
                  { pct: '30%', label: '好评率', desc: '用户口碑权重', color: 'mint' },
                  { pct: '20%', label: '响应速度', desc: '接单时效权重', color: 'brand' },
                  { pct: '10%', label: '距离远近', desc: '地理位置权重', color: 'brand-200/40' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl2 flex items-center justify-center font-bold bg-${item.color}/10 text-${item.color}`}
                    >
                      {item.pct}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-brand">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-gradient-to-r from-brand-50 to-accent-50 rounded-3xl2 p-6 border border-brand-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-accent" />
                <span className="font-bold text-brand">需求发布须知</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-accent flex-shrink-0 shadow-sm">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-brand mb-0.5">平台担保交易</div>
                    <div className="text-xs text-gray-500">服务满意后再付款，保障资金安全</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-mint flex-shrink-0 shadow-sm">
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-brand mb-0.5">服务质量保障</div>
                    <div className="text-xs text-gray-500">不满意可申请退款，平台介入仲裁</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand flex-shrink-0 shadow-sm">
                    <Info size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-brand mb-0.5">实名认证审核</div>
                    <div className="text-xs text-gray-500">所有服务商均经过资质审核与实名认证</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      <OrderModal
        provider={orderProvider}
        category={category}
        expectedTime={expectedTime}
        address={address}
        onClose={closeOrderModal}
        onConfirm={() => setOrderSuccess(true)}
        success={orderSuccess}
      />
    </div>
  );
}
