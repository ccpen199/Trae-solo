import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, TrendingUp, Clock, Users, Filter } from 'lucide-react';
import { useCircleStore } from '@/stores/useCircleStore';
import CircleCard from '@/components/business/CircleCard';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Empty from '@/components/common/Empty';
import Loading from '@/components/common/Loading';
import type { Circle } from '@/types';

const categories = [
  { value: 'all', label: '全部' },
  { value: 'photography', label: '摄影' },
  { value: 'parenting', label: '亲子' },
  { value: 'food', label: '美食' },
  { value: 'outdoor', label: '户外' },
  { value: 'sports', label: '运动' },
  { value: 'culture', label: '文化' },
  { value: 'other', label: '其他' },
];

const sortOptions = [
  { value: 'active', label: '最活跃' },
  { value: 'newest', label: '最新创建' },
  { value: 'members', label: '最多成员' },
];

export default function CircleList() {
  const { circles, fetchCircles, joinCircle, leaveCircle } = useCircleStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircles();
  }, [activeCategory]);

  const loadCircles = async () => {
    setLoading(true);
    const category = activeCategory === 'all' ? undefined : activeCategory;
    await fetchCircles(category);
    setLoading(false);
  };

  const handleJoin = async (circleId: string) => {
    const circle = circles.find(c => c.id === circleId);
    if (!circle) return;
    
    if (circle.isJoined) {
      await leaveCircle(circleId);
    } else {
      await joinCircle(circleId);
    }
  };

  const sortCircles = (circlesList: Circle[]): Circle[] => {
    const filtered = [...circlesList];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return filtered.filter(circle => 
        circle.name.toLowerCase().includes(query) ||
        circle.tags.some(tag => tag.toLowerCase().includes(query)) ||
        circle.description.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'active':
        return filtered.sort((a, b) => (b.postCount + b.activityCount) - (a.postCount + a.activityCount));
      case 'newest':
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'members':
        return filtered.sort((a, b) => b.memberCount - a.memberCount);
      default:
        return filtered;
    }
  };

  const sortedCircles = sortCircles(circles);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-neutral-800">圈子</h1>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-5 h-5" />}
              >
                创建圈子
              </Button>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="搜索圈子名称或标签"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                clearable
                prefix={<Search className="w-5 h-5 text-neutral-400" />}
              />

              <div className="flex items-center gap-4">
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 pb-1">
                    {categories.map((category) => (
                      <motion.button
                        key={category.value}
                        onClick={() => setActiveCategory(category.value)}
                        className={
                          activeCategory === category.value
                            ? 'relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all'
                            : 'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all'
                        }
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span
                          className={
                            activeCategory === category.value
                              ? 'text-westlake-600'
                              : 'text-neutral-600'
                          }
                        >
                          {category.label}
                        </span>
                        {activeCategory === category.value && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-westlake-500 to-westlake-600 rounded-full"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="w-40 flex-shrink-0">
                  <Select
                    options={sortOptions}
                    value={sortBy}
                    onChange={setSortBy}
                    size="sm"
                    prefix={<Filter className="w-4 h-4 text-neutral-400" />}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <Loading size="lg" />
            </motion.div>
          ) : sortedCircles.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <Empty description="暂无相关圈子" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
            >
              {sortedCircles.map((circle) => (
                <motion.div key={circle.id} variants={item}>
                <CircleCard
                  circle={circle}
                  variant="grid"
                  onJoin={handleJoin}
                />
              </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 right-6 md:hidden">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <Button
            variant="primary"
            size="lg"
            className="w-14 h-14 rounded-full shadow-lg"
            leftIcon={<Plus className="w-6 h-6" />}
          />
        </motion.div>
      </div>
    </div>
  );
}
