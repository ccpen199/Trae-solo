import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flower2,
  Coins,
  Ticket,
  Package,
  ShoppingBag,
  History,
  X,
  Check,
  Copy,
  Share2,
  Download,
  Loader2,
  LogIn,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePointStore } from '@/stores/usePointStore';
import { useUserStore } from '@/stores/useUserStore';
import { mockMallItems } from '@/data/mockPoints';
import type { MallItem } from '@/types';
import MallItemCard from '@/components/business/MallItemCard';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Empty from '@/components/common/Empty';

type CategoryType = 'all' | 'coupon' | 'physical' | 'huizhou';

const categories: { key: CategoryType; label: string; icon: typeof Ticket }[] = [
  { key: 'all', label: '全部', icon: ShoppingBag },
  { key: 'coupon', label: '优惠券', icon: Ticket },
  { key: 'physical', label: '实物商品', icon: Package },
  { key: 'huizhou', label: '惠州特色', icon: Flower2 },
];

const huizhouFeaturedIds = ['mi006', 'mi007', 'mi008', 'mi009', 'mi010', 'mi018'];

export default function Mall() {
  const navigate = useNavigate();
  const { user, isLoggedIn, updatePoints } = useUserStore();
  const { mallItems, loading, fetchMallItems, exchangeItem } = usePointStore();
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [selectedItem, setSelectedItem] = useState<MallItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeCode, setExchangeCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [showPointAnimation, setShowPointAnimation] = useState(false);
  const [animationPoints, setAnimationPoints] = useState(0);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMallItems();
    }
  }, [isLoggedIn, fetchMallItems]);

  useEffect(() => {
    if (user) {
      setDisplayPoints(user.points);
    }
  }, [user?.points]);

  const filteredItems = useMemo(() => {
    let items = mallItems.filter(i => i.category !== 'donation');
    
    if (activeCategory === 'coupon') {
      items = items.filter(i => i.category === 'coupon');
    } else if (activeCategory === 'physical') {
      items = items.filter(i => i.category === 'physical');
    } else if (activeCategory === 'huizhou') {
      items = items.filter(i => huizhouFeaturedIds.includes(i.id));
    }
    
    return items;
  }, [mallItems, activeCategory]);

  const handleExchangeClick = (itemId: string) => {
    const item = mallItems.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setShowDetailModal(true);
    }
  };

  const handleConfirmExchange = async () => {
    if (!selectedItem || !user) return;
    
    if (user.points < selectedItem.price) {
      return;
    }

    setExchangeLoading(true);
    const result = await exchangeItem(selectedItem.id);
    setExchangeLoading(false);

    if (result.success) {
      setAnimationPoints(selectedItem.price);
      setShowPointAnimation(true);
      updatePoints(-selectedItem.price);
      setTimeout(() => setShowPointAnimation(false), 2000);

      const code = `HZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setExchangeCode(code);
      setShowDetailModal(false);
      setShowSuccessModal(true);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exchangeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setSelectedItem(null);
    setExchangeCode('');
  };

  const formatExpiryDate = (date?: Date) => {
    if (!date) return '长期有效';
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  if (!isLoggedIn || !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-neutral-50 flex items-center justify-center"
      >
        <Card className="p-8 text-center max-w-sm mx-4">
          <div className="w-20 h-20 rounded-full bg-chaojing-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-chaojing-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-2">登录后兑换商品</h2>
          <p className="text-neutral-500 mb-6">登录即可使用小红花积分兑换精选商品</p>
          <Button
            variant="warning"
            size="lg"
            onClick={() => navigate('/login', { state: { from: '/points/mall' } })}
            className="w-full"
            leftIcon={<LogIn className="w-5 h-5" />}
          >
            立即登录
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50 pb-20"
    >
      <div className="bg-gradient-to-br from-chaojing-400 via-chaojing-500 to-chaojing-600 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/15"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 24 + 12}px`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.2, 0.4, 0.2],
                rotate: [0, 8, -8, 0],
              }}
              transition={{
                duration: Math.random() * 4 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              🌸
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showPointAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="flex items-center gap-2 text-white text-2xl font-bold">
                <Sparkles className="w-6 h-6" />
                -{animationPoints}
                <Flower2 className="w-6 h-6" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container-page pt-6 pb-8 relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">积分商城</h1>
                <p className="text-white/70 text-sm">用小红花兑换精选好物</p>
              </div>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => navigate('/points/records')}
                leftIcon={<History className="w-5 h-5" />}
              >
                兑换记录
              </Button>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <Flower2 className="w-7 h-7 text-white" />
                  </motion.div>
                </div>
                <div>
                  <p className="text-white/70 text-sm">我的积分</p>
                  <motion.span
                    key={displayPoints}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl font-bold text-white"
                  >
                    {displayPoints.toLocaleString()}
                  </motion.span>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-white/50 text-white hover:bg-white/20 hover:border-white"
                onClick={() => navigate('/points')}
              >
                去赚积分
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container-page -mt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="p-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.key;
                return (
                  <motion.button
                    key={category.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveCategory(category.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-chaojing-400 to-chaojing-500 text-white shadow-md'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 text-chaojing-500 animate-spin" />
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="contents"
                >
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <MallItemCard
                        item={item}
                        onExchange={handleExchangeClick}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <Empty title="该分类暂无商品" />
          )}
        </motion.div>
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="lg"
        title={selectedItem?.name}
        footer={
          selectedItem && (
            <div className="flex items-center justify-between w-full">
              <div>
                <span className="text-sm text-neutral-500">兑换需要</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-5 h-5 text-chaojing-500" />
                  <span className="text-2xl font-bold text-chaojing-600">{selectedItem.price}</span>
                  <span className="text-sm text-neutral-400">积分</span>
                </div>
              </div>
              <Button
                variant="warning"
                size="lg"
                onClick={handleConfirmExchange}
                loading={exchangeLoading}
                disabled={user.points < selectedItem.price || selectedItem.stock === 0}
                leftIcon={<ShoppingBag className="w-5 h-5" />}
              >
                {selectedItem.stock === 0
                  ? '已售罄'
                  : user.points < selectedItem.price
                  ? '积分不足'
                  : '确认兑换'}
              </Button>
            </div>
          )
        }
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="w-full h-56 md:h-64 object-cover"
              />
              {selectedItem.discountRate && selectedItem.discountRate < 1 && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {Math.round(selectedItem.discountRate * 100)}% OFF
                </div>
              )}
              {selectedItem.category === 'coupon' && (
                <div className="absolute top-3 left-3 bg-chaojing-500 text-neutral-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Ticket className="w-4 h-4" />
                  优惠券
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">{selectedItem.name}</h3>
              <p className="text-neutral-600">{selectedItem.description}</p>
            </div>

            {selectedItem.merchantName && (
              <div className="flex items-center gap-2 text-neutral-500 text-sm">
                <Package className="w-4 h-4" />
                <span>商户：{selectedItem.merchantName}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-neutral-50 rounded-xl">
                <p className="text-sm text-neutral-500 mb-1">库存</p>
                <p className="text-lg font-bold text-neutral-800">{selectedItem.stock}</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-xl">
                <p className="text-sm text-neutral-500 mb-1">已售</p>
                <p className="text-lg font-bold text-neutral-800">{selectedItem.sold}</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-xl">
                <p className="text-sm text-neutral-500 mb-1">有效期至</p>
                <p className="text-sm font-bold text-neutral-800">{formatExpiryDate(selectedItem.expiryDate)}</p>
              </div>
            </div>

            <div className="bg-chaojing-50 rounded-xl p-4">
              <h4 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-chaojing-500" />
                使用须知
              </h4>
              <ul className="space-y-1 text-sm text-neutral-600">
                <li className="flex items-start gap-2">
                  <span className="text-chaojing-500">•</span>
                  兑换成功后请在有效期内使用，过期不补
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chaojing-500">•</span>
                  优惠券不找零、不兑现，可转赠他人
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chaojing-500">•</span>
                  实物商品将在7个工作日内发货
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-chaojing-500">•</span>
                  如有疑问请联系客服：400-888-8888
                </li>
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={handleCloseSuccess}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-chaojing-300/30"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      fontSize: `${Math.random() * 20 + 10}px`,
                    }}
                    animate={{
                      y: [0, -30],
                      opacity: [0, 0.5, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: Math.random() * 2 + 1,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-chaojing-400 to-chaojing-600 flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>

              <h3 className="text-2xl font-bold text-neutral-800 mb-2">兑换成功！</h3>
              <p className="text-neutral-500 mb-6">恭喜您成功兑换 {selectedItem?.name}</p>

              <div className="bg-gradient-to-r from-chaojing-50 to-chaojing-100 rounded-2xl p-6 mb-6">
                <p className="text-sm text-neutral-500 mb-2">您的兑换码</p>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl md:text-3xl font-mono font-bold text-chaojing-700 tracking-wider"
                  >
                    {exchangeCode}
                  </motion.div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  className={cn(
                    'border-chaojing-300 text-chaojing-600 hover:bg-chaojing-100 hover:border-chaojing-400',
                    copied && 'bg-honghua-100 border-honghua-300 text-honghua-600'
                  )}
                >
                  {copied ? '已复制' : '复制兑换码'}
                </Button>
              </div>

              <p className="text-sm text-neutral-500 mb-6">
                兑换码已发送至您的消息中心，请注意查收
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={handleCloseSuccess}
                >
                  继续浏览
                </Button>
                <Button
                  variant="warning"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    handleCloseSuccess();
                    navigate('/points/records');
                  }}
                  leftIcon={<History className="w-5 h-5" />}
                >
                  查看记录
                </Button>
              </div>

              <button
                onClick={handleCloseSuccess}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
