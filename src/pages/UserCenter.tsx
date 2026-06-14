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
  TrendingUp,
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
  Check,
  Pause,
  Play,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
} from 'lucide-react';
import type { Subscription, Property, PriceAlert, Report, ReportStatus } from '@/mock/data';
import { mockReports } from '@/mock/data';
import {
  getSubscriptions,
  createSubscription,
  deleteSubscription,
} from '@/services/api';
import PropertyCard from '@/components/PropertyCard';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import { mockProperties, mockPriceAlerts } from '@/mock/data';

type TabType = 'subscriptions' | 'alerts' | 'favorites' | 'reports' | 'history';

const subscriptionSchema = z.object({
  targetType: z.enum(['property', 'district', 'community']),
  targetName: z.string().min(1, '请输入订阅名称'),
  targetId: z.string().min(1, '请选择目标'),
  threshold: z.number().min(0.5, '阈值最小为0.5%').max(50, '阈值最大为50%'),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

type AlertFilterType = 'all' | 'unread' | 'read';

const tabs = [
  { key: 'subscriptions' as TabType, label: '降价订阅', icon: <Bell className="h-4 w-4" /> },
  { key: 'alerts' as TabType, label: '降价提醒', icon: <TrendingDown className="h-4 w-4" /> },
  { key: 'favorites' as TabType, label: '我的收藏', icon: <Heart className="h-4 w-4" /> },
  { key: 'reports' as TabType, label: '我的举报', icon: <FileText className="h-4 w-4" /> },
  { key: 'history' as TabType, label: '浏览历史', icon: <History className="h-4 w-4" /> },
];

const targetTypeOptions = [
  { value: 'property', label: '房源', icon: <Home className="h-4 w-4" /> },
  { value: 'district', label: '区域', icon: <MapPin className="h-4 w-4" /> },
  { value: 'community', label: '小区', icon: <Building2 className="h-4 w-4" /> },
];

const mockUser = {
  name: '张三',
  phone: '138****8000',
  avatar: '/api/ide/v1/text_to_image?prompt=professional%20portrait%20asian%20male%20business&image_size=square',
  isVerified: true,
};

const favoriteProperties = mockProperties.slice(0, 6);
const historyProperties = mockProperties.slice(10, 16);

interface PriceAlertWithRead extends PriceAlert {
  isRead: boolean;
  originalPrice: number;
  newPrice: number;
  dropAmount: number;
  dropPercent: number;
}

const getMockPriceAlertsWithRead = (): PriceAlertWithRead[] => {
  return mockPriceAlerts.slice(0, 12).map((alert, index) => {
    const originalPrice = alert.districtAvgPrice * 1.2;
    const newPrice = alert.districtAvgPrice * (1 - alert.deviation / 100);
    const dropAmount = originalPrice - newPrice;
    const dropPercent = ((originalPrice - newPrice) / originalPrice) * 100;
    return {
      ...alert,
      isRead: index >= 5,
      originalPrice: Math.round(originalPrice),
      newPrice: Math.round(newPrice),
      dropAmount: Math.round(dropAmount),
      dropPercent: parseFloat(dropPercent.toFixed(1)),
    };
  });
};

const getReportStatusInfo = (status: ReportStatus) => {
  switch (status) {
    case 'pending':
      return { label: '待处理', color: 'text-amber-600', bg: 'bg-amber-50', icon: <ClockIcon className="h-4 w-4" /> };
    case 'reviewing':
      return { label: '审核中', color: 'text-blue-600', bg: 'bg-blue-50', icon: <AlertTriangle className="h-4 w-4" /> };
    case 'resolved':
      return { label: '已解决', color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle className="h-4 w-4" /> };
    case 'rejected':
      return { label: '已驳回', color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-4 w-4" /> };
  }
};

const getReportProgress = (status: ReportStatus) => {
  switch (status) {
    case 'pending': return 25;
    case 'reviewing': return 60;
    case 'resolved': return 100;
    case 'rejected': return 100;
  }
};

export default function UserCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertWithRead[]>([]);
  const [alertFilter, setAlertFilter] = useState<AlertFilterType>('all');
  const [reports] = useState<Report[]>(mockReports.slice(0, 8));
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editThreshold, setEditThreshold] = useState(5);

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
    setPriceAlerts(getMockPriceAlertsWithRead());
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

  const handleToggleSubscription = async (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  const handleEditSubscription = (sub: Subscription) => {
    setEditingSubscription(sub);
    setEditThreshold(sub.priceThreshold);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editingSubscription) {
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === editingSubscription.id
            ? { ...s, priceThreshold: editThreshold }
            : s
        )
      );
      setShowEditModal(false);
      setEditingSubscription(null);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setPriceAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const handleMarkAllAsRead = () => {
    setPriceAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const handleRemoveFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Remove favorite:', id);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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

  const getSubscriptionCurrentPrice = (sub: Subscription) => {
    const basePrice = 65000;
    const variation = (sub.id.charCodeAt(0) % 10) * 2000;
    return basePrice + variation;
  };

  const getLatestAlertStatus = (sub: Subscription) => {
    const hasAlert = sub.id.charCodeAt(0) % 3 === 0;
    if (hasAlert) {
      return {
        hasAlert: true,
        message: '最近7天内有价格变动',
        type: 'alert' as const,
      };
    }
    return {
      hasAlert: false,
      message: '暂无价格变动提醒',
      type: 'normal' as const,
    };
  };

  const filteredAlerts = priceAlerts.filter((alert) => {
    if (alertFilter === 'unread') return !alert.isRead;
    if (alertFilter === 'read') return alert.isRead;
    return true;
  });

  const unreadCount = priceAlerts.filter((a) => !a.isRead).length;

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(2)}万`;
    }
    return price.toLocaleString();
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
          <div className="flex border-b border-neutral-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 relative whitespace-nowrap',
                  activeTab === tab.key
                    ? 'border-primary-800 text-primary-800 bg-primary-50/50'
                    : 'border-transparent text-neutral-500 hover:text-primary-700 hover:bg-neutral-50'
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.key === 'alerts' && unreadCount > 0 && (
                  <span className="absolute top-3 right-3 min-w-[18px] h-[18px] flex items-center justify-center bg-accent-down text-white text-[10px] font-bold rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
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
                      <h2 className="text-xl font-bold text-neutral-900">降价订阅管理</h2>
                      <p className="text-sm text-neutral-500 mt-1">
                        订阅房源、区域或小区，价格下降超过阈值时第一时间通知您
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
                      {subscriptions.map((sub, index) => {
                        const currentPrice = getSubscriptionCurrentPrice(sub);
                        const alertStatus = getLatestAlertStatus(sub);
                        return (
                          <motion.div
                            key={sub.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 p-5 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                          >
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-800">
                              {getTargetTypeIcon(sub.targetType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <h3 className="font-semibold text-neutral-900 truncate">
                                  {sub.targetName}
                                </h3>
                                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                                  {getTargetTypeLabel(sub.targetType)}
                                </span>
                                {sub.isActive ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    已启用
                                  </span>
                                ) : (
                                  <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Pause className="h-3 w-3" />
                                    已暂停
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm flex-wrap">
                                <span className="text-neutral-600">
                                  当前价格: <span className="font-semibold text-neutral-900">{formatPrice(currentPrice)}</span>
                                </span>
                                <span className="flex items-center gap-1 text-accent-down">
                                  <TrendingDown className="h-3 w-3" />
                                  降价阈值: {sub.priceThreshold}%
                                </span>
                                <span className="text-neutral-400 text-xs">
                                  创建于 {formatDate(sub.createdAt)}
                                </span>
                              </div>
                              <div className="mt-2">
                                {alertStatus.hasAlert ? (
                                  <span className="text-xs text-accent-down flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {alertStatus.message}
                                  </span>
                                ) : (
                                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    {alertStatus.message}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditSubscription(sub)}
                                className="p-2 text-neutral-400 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                                title="编辑阈值"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleSubscription(sub.id)}
                                className={cn(
                                  'p-2 rounded-lg transition-colors',
                                  sub.isActive
                                    ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-green-500 hover:text-green-600 hover:bg-green-50'
                                )}
                                title={sub.isActive ? '暂停' : '启用'}
                              >
                                {sub.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteSubscription(sub.id)}
                                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="取消订阅"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <ChevronRight className="h-4 w-4 text-neutral-300 ml-2" />
                            </div>
                          </motion.div>
                        );
                      })}
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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">降价提醒记录</h2>
                      <p className="text-sm text-neutral-500 mt-1">
                        您订阅的房源价格变动提醒，共 {priceAlerts.length} 条，未读 {unreadCount} 条
                      </p>
                    </div>
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                      className={cn(
                        'text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors',
                        unreadCount > 0
                          ? 'text-primary-700 hover:bg-primary-50'
                          : 'text-neutral-400 cursor-not-allowed'
                      )}
                    >
                      <Check className="h-4 w-4" />
                      全部标记已读
                    </button>
                  </div>

                  <div className="flex gap-2 mb-5">
                    {([
                      { key: 'all' as AlertFilterType, label: '全部', count: priceAlerts.length },
                      { key: 'unread' as AlertFilterType, label: '未读', count: unreadCount },
                      { key: 'read' as AlertFilterType, label: '已读', count: priceAlerts.length - unreadCount },
                    ]).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setAlertFilter(tab.key)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          alertFilter === tab.key
                            ? 'bg-primary-800 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        )}
                      >
                        {tab.label}
                        <span className={cn(
                          'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                          alertFilter === tab.key
                            ? 'bg-white/20 text-white'
                            : 'bg-neutral-200 text-neutral-500'
                        )}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {filteredAlerts.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="space-y-3">
                      {filteredAlerts.map((alert, index) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleMarkAsRead(alert.id)}
                          className={cn(
                            'flex items-start gap-4 p-5 rounded-xl cursor-pointer transition-colors',
                            alert.isRead
                              ? 'bg-neutral-50 hover:bg-neutral-100'
                              : 'bg-blue-50/50 hover:bg-blue-50 border border-blue-100'
                          )}
                        >
                          <div className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                            alert.isRead ? 'bg-neutral-200' : 'bg-accent-down/10'
                          )}>
                            <TrendingDown className={cn('h-6 w-6', alert.isRead ? 'text-neutral-400' : 'text-accent-down')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className={cn(
                                  'font-semibold',
                                  alert.isRead ? 'text-neutral-600' : 'text-neutral-900'
                                )}>
                                  {alert.propertyTitle}
                                </h3>
                                {!alert.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-accent-down flex-shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 flex-shrink-0">
                                {formatDateTime(alert.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm text-neutral-500 line-through">
                                  ¥{alert.originalPrice.toLocaleString()}
                                </span>
                                <span className="text-lg font-bold text-accent-down">
                                  ¥{alert.newPrice.toLocaleString()}
                                </span>
                              </div>
                              <span className="badge-down">
                                降 ¥{formatPrice(alert.dropAmount)}
                              </span>
                              <span className="text-accent-down font-medium text-sm">
                                -{alert.dropPercent}%
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-neutral-500">
                              <span>区域均价: {alert.districtAvgPrice.toLocaleString()}元/㎡</span>
                              <span>·</span>
                              <span>阈值: {alert.threshold}%</span>
                            </div>
                            <p className="text-sm text-neutral-500 mt-2">
                              该房源价格已低于您设置的 {alert.threshold}% 阈值，建议及时关注。
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {alert.isRead ? (
                              <EyeOff className="h-4 w-4 text-neutral-300" />
                            ) : (
                              <Eye className="h-4 w-4 text-primary-400" />
                            )}
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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">我的收藏</h2>
                      <p className="text-sm text-neutral-500 mt-1">
                        您收藏的房源，共 {favoriteProperties.length} 个
                      </p>
                    </div>
                  </div>

                  {favoriteProperties.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteProperties.map((property) => (
                        <div key={property.id} className="relative group">
                          <PropertyCard
                            property={property}
                            onClick={() => navigate(`/property/${property.id}`)}
                          />
                          <button
                            onClick={(e) => handleRemoveFavorite(property.id, e)}
                            className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">我的举报</h2>
                      <p className="text-sm text-neutral-500 mt-1">
                        您提交的举报记录，共 {reports.length} 条
                      </p>
                    </div>
                  </div>

                  {reports.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report, index) => {
                        const statusInfo = getReportStatusInfo(report.status);
                        const progress = getReportProgress(report.status);
                        return (
                          <motion.div
                            key={report.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleViewReport(report)}
                            className="p-5 bg-neutral-50 rounded-xl hover:bg-neutral-100 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', statusInfo.bg)}>
                                  <span className={statusInfo.color}>{statusInfo.icon}</span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-neutral-900 line-clamp-1">
                                    {report.propertyTitle}
                                  </h3>
                                  <p className="text-sm text-neutral-500">
                                    举报类型: {report.reportType}
                                  </p>
                                </div>
                              </div>
                              <span className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                                statusInfo.bg, statusInfo.color
                              )}>
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
                                <span>处理进度</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.1 }}
                                  className={cn(
                                    'h-full rounded-full',
                                    report.status === 'resolved' ? 'bg-green-500' :
                                    report.status === 'rejected' ? 'bg-red-500' :
                                    report.status === 'reviewing' ? 'bg-blue-500' : 'bg-amber-500'
                                  )}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-neutral-500 flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                提交时间: {formatDateTime(report.createdAt)}
                              </span>
                              <span className="text-primary-600 flex items-center gap-1">
                                查看详情
                                <ChevronRight className="h-4 w-4" />
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
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
                          <div className="flex-1 min-w-0">
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

      <AnimatePresence>
        {showEditModal && editingSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-900">编辑降价阈值</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600">
                  订阅: <span className="font-medium text-neutral-900">{editingSubscription.targetName}</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  降价提醒阈值 (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(parseFloat(e.target.value))}
                  className="input-field"
                />
                <p className="mt-2 text-xs text-neutral-400">
                  当价格下降超过此阈值时，您将收到通知
                </p>
                <div className="mt-3 flex gap-2">
                  {[3, 5, 10, 15].map((val) => (
                    <button
                      key={val}
                      onClick={() => setEditThreshold(val)}
                      className={cn(
                        'flex-1 py-1.5 text-sm rounded-lg transition-colors',
                        editThreshold === val
                          ? 'bg-primary-800 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSaveEdit}
                  className="flex-1 btn-primary"
                >
                  保存
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReportModal && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-neutral-200 p-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900">举报详情</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="text-sm text-neutral-500 block mb-1">举报房源</label>
                  <p className="font-medium text-neutral-900">{selectedReport.propertyTitle}</p>
                </div>

                <div>
                  <label className="text-sm text-neutral-500 block mb-1">举报类型</label>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    {selectedReport.reportType}
                  </span>
                </div>

                <div>
                  <label className="text-sm text-neutral-500 block mb-1">当前状态</label>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5',
                      getReportStatusInfo(selectedReport.status).bg,
                      getReportStatusInfo(selectedReport.status).color
                    )}>
                      {getReportStatusInfo(selectedReport.status).icon}
                      {getReportStatusInfo(selectedReport.status).label}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-neutral-500 block mb-2">处理进度</label>
                  <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        selectedReport.status === 'resolved' ? 'bg-green-500' :
                        selectedReport.status === 'rejected' ? 'bg-red-500' :
                        selectedReport.status === 'reviewing' ? 'bg-blue-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${getReportProgress(selectedReport.status)}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {getReportProgress(selectedReport.status)}%
                  </p>
                </div>

                <div>
                  <label className="text-sm text-neutral-500 block mb-1">举报描述</label>
                  <p className="text-neutral-700 text-sm leading-relaxed bg-neutral-50 p-3 rounded-lg">
                    {selectedReport.description}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-neutral-500 block mb-2">证据图片</label>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedReport.evidenceUrls.map((url, idx) => (
                      <div key={idx} className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                        <img
                          src={`/api/ide/v1/text_to_image?prompt=${encodeURIComponent('房产相关证据图片')}&image_size=square`}
                          alt={`证据${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-neutral-500 block mb-1">提交时间</label>
                  <p className="text-neutral-700">{formatDateTime(selectedReport.createdAt)}</p>
                </div>

                {selectedReport.resolution && (
                  <div>
                    <label className="text-sm text-neutral-500 block mb-1">处理结果</label>
                    <p className="text-neutral-700 text-sm leading-relaxed bg-green-50 p-3 rounded-lg border border-green-100">
                      {selectedReport.resolution}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
