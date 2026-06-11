import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Phone,
  ShieldCheck,
  ShieldX,
  Bell,
  Heart,
  History,
  TrendingDown,
  MapPin,
  Building2,
  Home,
  Plus,
  Trash2,
  Settings,
  X,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { Subscription, Property, PriceAlert } from '@/mock/data';
import {
  getSubscriptions,
  createSubscription,
  deleteSubscription,
} from '@/services/api';
import PropertyCard from '@/components/PropertyCard';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import { mockProperties, mockPriceAlerts } from '@/mock/data';

type TabType = 'subscriptions' | 'favorites' | 'history' | 'alerts';

const subscriptionSchema = z.object({
  targetType: z.enum(['property', 'district', 'community']),
  targetName: z.string().min(1, '请输入订阅名称'),
  targetId: z.string().min(1, '请选择目标'),
  threshold: z.number().min(0.5, '阈值最小为0.5%').max(50, '阈值最大为50%'),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

const tabs = [
  { key: 'subscriptions' as TabType, label: '我的订阅', icon: <Bell className="h-4 w-4" /> },
  { key: 'favorites' as TabType, label: '我的收藏', icon: <Heart className="h-4 w-4" /> },
  { key: 'history' as TabType, label: '浏览历史', icon: <History className="h-4 w-4" /> },
  { key: 'alerts' as TabType, label: '降价提醒', icon: <TrendingDown className="h-4 w-4" /> },
];

const targetTypeOptions = [
  { value: 'property', label: '房源', icon: <Home className="h-4 w-4" /> },
  { value: 'district', label: '区域', icon: <MapPin className="h-4 w-4" /> },
  { value: 'community', label: '小区', icon: <Building2 className="h-4 w-4" /> },
];

const mockUser = {
  name: '张三',
  phone: '138****8000',
  avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20asian%20male%20business&image_size=square',
  isVerified: true,
};

const favoriteProperties = mockProperties.slice(0, 6);
const historyProperties = mockProperties.slice(10, 16);

export default function UserCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [priceAlerts] = useState<PriceAlert[]>(mockPriceAlerts.slice(0, 10));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      targetType: 'property',
      threshold: 5,
    },
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscription = async (data: SubscriptionFormData) => {
    try {
      await createSubscription({
        targetId: data.targetId,
        targetType: data.targetType,
        targetName: data.targetName,
        threshold: data.threshold,
      });
      await fetchSubscriptions();
      setShowAddModal(false);
      reset();
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await deleteSubscription(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getTargetTypeIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Home className="h-4 w-4" />;
      case 'district':
        return <MapPin className="h-4 w-4" />;
      case 'community':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'property':
        return '房源';
      case 'district':
        return '区域';
      case 'community':
        return '小区';
      default:
        return '房源';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 pt-12 pb-20 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <div className="relative">
              <img
                src={mockUser.avatar}
                alt="头像"
                className="w-24 h-24 rounded-full border-4 border-white/20 object-cover"
              />
              {mockUser.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent-verified rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{mockUser.name}</h1>
                {mockUser.isVerified ? (
                  <span className="badge-verified bg-white/10 text-white">
                    <ShieldCheck className="h-3 w-3" />
                    已认证
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-200 px-2.5 py-1 rounded-full text-xs font-medium">
                    <ShieldX className="h-3 w-3" />
                    未认证
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Phone className="h-4 w-4" />
                <span>{mockUser.phone}</span>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
              编辑资料
            </button>
          </motion.div>
        </div>
      </div>

      <div className="container -mt-12 px-4 pb-12">
        <div className="card p-0 overflow-hidden">
          <div className="flex border-b border-neutral-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all border-b-2',
                  activeTab === tab.key
                    ? 'border-primary-800 text-primary-800 bg-primary-50/50'
                    : 'border-transparent text-neutral-500 hover:text-primary-700 hover:bg-neutral-50'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'subscriptions' && (
                <motion.div
                  key="subscriptions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">我的订阅</h2>
                      <p className="text-sm text-neutral-500 mt-1">
                        订阅房源、区域或小区，价格变动时第一时间通知您
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAddModal(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      添加订阅
                    </motion.button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-8 w-8 border-4 border-primary-200 border-t-primary-800 rounded-full"
                      />
                    </div>
                  ) : subscriptions.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="space-y-3">
                      {subscriptions.map((sub) => (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-800">
                            {getTargetTypeIcon(sub.targetType)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-neutral-900">
                                {sub.targetName}
                              </h3>
                              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                                {getTargetTypeLabel(sub.targetType)}
                              </span>
                              {sub.isActive ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  已启用
                                </span>
                              ) : (
                                <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded">
                                  已暂停
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                              <span className="flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" />
                                降价阈值: {sub.priceThreshold}%
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                创建于: {formatDate(sub.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-neutral-400 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors">
                              <Settings className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubscription(sub.id)}
                              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <ChevronRight className="h-4 w-4 text-neutral-300" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'favorites' && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-900">我的收藏</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      您收藏的房源，共 {favoriteProperties.length} 个
                    </p>
                  </div>

                  {favoriteProperties.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteProperties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          onClick={() => navigate(`/property/${property.id}`)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">浏览历史</h2>
                      <p className="text-sm text-neutral-500 mt-1">
                        您最近浏览的房源，共 {historyProperties.length} 个
                      </p>
                    </div>
                    <button className="text-sm text-neutral-500 hover:text-primary-800">
                      清空历史
                    </button>
                  </div>

                  {historyProperties.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="space-y-3">
                      {historyProperties.map((property) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => navigate(`/property/${property.id}`)}
                          className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-1">
                              {property.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-neutral-600 mb-1">
                              <span>{property.area}㎡</span>
                              <span>·</span>
                              <span>{property.bedrooms}室{property.bathrooms}卫</span>
                              <span>·</span>
                              <span>{property.district}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-accent-up">
                                {(property.price / 10000).toFixed(0)}万
                              </span>
                              <span className="text-sm text-neutral-400">
                                {property.unitPrice.toLocaleString()}元/㎡
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-neutral-400 mb-2">
                              今天 14:30
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-300 ml-auto" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'alerts' && (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-900">降价提醒</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      您订阅的房源价格变动提醒
                    </p>
                  </div>

                  {priceAlerts.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="space-y-3">
                      {priceAlerts.map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-accent-down/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <TrendingDown className="h-5 w-5 text-accent-down" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-neutral-900">
                                {alert.propertyTitle}
                              </h3>
                              <span className="text-xs text-neutral-400">
                                {formatDate(alert.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="badge-down">
                                <AlertCircle className="h-3 w-3" />
                                价格偏离 {alert.deviation.toFixed(1)}%
                              </span>
                              <span className="text-sm text-neutral-600">
                                区域均价: {alert.districtAvgPrice.toLocaleString()}元/㎡
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500">
                              该房源价格已低于您设置的 {alert.threshold}% 阈值，建议关注。
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-neutral-900">添加订阅</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(handleAddSubscription)}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    订阅类型
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {targetTypeOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 cursor-pointer transition-all border-neutral-200 hover:border-primary-300 data-[checked=true]:border-primary-800 data-[checked=true]:bg-primary-50"
                      >
                        <input
                          type="radio"
                          value={option.value}
                          className="sr-only"
                          {...register('targetType')}
                          data-checked={option.value === 'property' ? true : undefined}
                        />
                        {option.icon}
                        <span className="text-sm font-medium text-neutral-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    订阅名称
                  </label>
                  <input
                    type="text"
                    placeholder="请输入房源/区域/小区名称"
                    className={cn(
                      'input-field',
                      errors.targetName && 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    )}
                    {...register('targetName')}
                  />
                  {errors.targetName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.targetName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    目标ID
                  </label>
                  <input
                    type="text"
                    placeholder="请选择或输入目标ID"
                    className={cn(
                      'input-field',
                      errors.targetId && 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    )}
                    {...register('targetId')}
                  />
                  {errors.targetId && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.targetId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    降价提醒阈值 (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    placeholder="5"
                    className={cn(
                      'input-field',
                      errors.threshold && 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    )}
                    {...register('threshold', { valueAsNumber: true })}
                  />
                  {errors.threshold && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.threshold.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-400">
                    当价格下降超过此阈值时，您将收到通知
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    取消
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      'flex-1 btn-primary flex items-center justify-center gap-2',
                      isSubmitting && 'opacity-70 cursor-not-allowed'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                          className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        提交中...
                      </>
                    ) : (
                      '确认添加'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
