import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBaoliaoStore } from '@/stores/useBaoliaoStore';
import { useUserStore } from '@/stores/useUserStore';
import BaoliaoCard from '@/components/business/BaoliaoCard';
import Tag from '@/components/common/Tag';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import Empty from '@/components/common/Empty';
import Loading, { Skeleton } from '@/components/common/Loading';

const categories = [
  { value: '', label: '全部', color: 'neutral' as const },
  { value: 'traffic', label: '交通出行', color: 'westlake' as const },
  { value: 'environment', label: '城市环境', color: 'honghua' as const },
  { value: 'facility', label: '公共设施', color: 'chaojing' as const },
  { value: 'livelihood', label: '民生服务', color: 'westlake' as const },
  { value: 'emergency', label: '突发事件', color: 'neutral' as const },
  { value: 'other', label: '其他', color: 'neutral' as const },
];

const districts = [
  { value: '', label: '全部区域' },
  { value: '惠城区', label: '惠城区' },
  { value: '惠阳区', label: '惠阳区' },
  { value: '博罗县', label: '博罗县' },
  { value: '惠东县', label: '惠东县' },
  { value: '龙门县', label: '龙门县' },
  { value: '大亚湾区', label: '大亚湾区' },
  { value: '仲恺区', label: '仲恺区' },
];

const sortOptions = [
  { value: 'latest', label: '最新' },
  { value: 'hot', label: '最热' },
];

export default function BaoliaoList() {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserStore();
  const { baoliaos, loading, fetchBaoliaos, likeBaoliao } = useBaoliaoStore();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [displayCount, setDisplayCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(() => {
    fetchBaoliaos({
      category: selectedCategory || undefined,
      district: selectedDistrict || undefined,
      sort: sortBy,
    });
  }, [selectedCategory, selectedDistrict, sortBy, fetchBaoliaos]);

  useEffect(() => {
    loadData();
    setDisplayCount(5);
  }, [loadData]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isLoadingMore) {
          if (displayCount < baoliaos.length) {
            setIsLoadingMore(true);
            setTimeout(() => {
              setDisplayCount((prev) => Math.min(prev + 5, baoliaos.length));
              setIsLoadingMore(false);
            }, 500);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, isLoadingMore, displayCount, baoliaos.length]);

  const handleLike = (id: string) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    likeBaoliao(id);
  };

  const handlePublish = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    navigate('/baoliao/publish');
  };

  const displayedBaoliaos = baoliaos.slice(0, displayCount);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50 pb-24"
    >
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-4 h-4 text-westlake-600" />
            <Select
              options={districts}
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              size="sm"
              className="flex-1 max-w-[200px]"
            />
            <div className="flex items-center bg-neutral-100 rounded-full p-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                    sortBy === option.value
                      ? 'bg-white text-westlake-600 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  {option.value === 'latest' ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2 pb-1 min-w-max">
              {categories.map((category) => (
                <Tag
                  key={category.value}
                  color={selectedCategory === category.value ? category.color : 'neutral'}
                  size="md"
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    selectedCategory === category.value && 'ring-2 ring-offset-1 ring-current'
                  )}
                >
                  {category.label}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {loading && baoliaos.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-card p-4">
                <div className="flex gap-4">
                  <Skeleton shape="rect" width="w-28" height="h-28" />
                  <div className="flex-1 space-y-3">
                    <Skeleton shape="text" lines={2} />
                    <Skeleton shape="text" lines={2} />
                    <div className="flex gap-2">
                      <Skeleton shape="rect" width="w-16" height="h-6" />
                      <Skeleton shape="rect" width="w-20" height="h-6" />
                    </div>
                    <div className="flex justify-between items-center">
                      <Skeleton shape="rect" width="w-24" height="h-6" />
                      <div className="flex gap-4">
                        <Skeleton shape="rect" width="w-8" height="h-4" />
                        <Skeleton shape="rect" width="w-8" height="h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : baoliaos.length === 0 ? (
          <Empty
            title="暂无爆料"
            description="还没有相关爆料，快来发布第一条吧"
            action={{
              label: '发布爆料',
              onClick: handlePublish,
            }}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {displayedBaoliaos.map((baoliao, index) => (
                <motion.div
                  key={baoliao.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  <BaoliaoCard baoliao={baoliao} onLike={handleLike} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        <div ref={observerRef} className="h-10 flex items-center justify-center mt-4">
          {isLoadingMore && <Loading type="spinner" size="sm" text="加载更多..." />}
        </div>
      </div>

      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePublish}
        className="fixed right-6 bottom-24 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-westlake-500 to-westlake-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
}
