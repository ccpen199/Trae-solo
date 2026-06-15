import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, MapPin, DollarSign, Clock, Calendar, X, Search, Tag, Shield, ChevronRight, FileText, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import OrderCard from '../components/OrderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Empty from '../components/Empty';
import Button from '../components/Button';
import Badge from '../components/Badge';
import type { ServiceOrder } from '../../shared/types';
import { cn } from '../lib/utils';

const categories = ['全部', '舞蹈', '音乐', '运动', '绘画', '摄影', '烹饪', '编程', '语言', '家政'];
const priceRanges = [
  { label: '全部价格', value: '' },
  { label: '¥0-100', value: '0-100' },
  { label: '¥100-500', value: '100-500' },
  { label: '¥500-1000', value: '500-1000' },
  { label: '¥1000+', value: '1000-' },
];
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待接单', value: 'published' },
  { label: '已匹配', value: 'matched' },
  { label: '已确认', value: 'confirmed' },
  { label: '服务中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
];
const locations = ['全部地区', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京'];

interface PublishFormData {
  title: string;
  description: string;
  category: string;
  price: string;
  deposit: string;
  location: string;
  serviceTime: string;
  address: string;
  duration: string;
  requirements: string;
}

const defaultFormData: PublishFormData = {
  title: '',
  description: '',
  category: '舞蹈',
  price: '',
  deposit: '',
  location: '',
  serviceTime: '',
  address: '',
  duration: '',
  requirements: '',
};

const mockOrders: ServiceOrder[] = [
  {
    id: 'order-1',
    requesterId: 'user-1',
    title: '寻找专业街舞老师进行一对一私教',
    description: '想学习街舞基础，每周2次，每次1.5小时，希望老师有耐心，教学经验丰富。可以上门或者去老师的工作室。',
    category: '舞蹈',
    price: 300,
    deposit: 100,
    location: '北京市朝阳区三里屯',
    serviceTime: '每周六、日上午10:00-11:30',
    duration: 90,
    status: 'published',
    requirements: '需要老师有3年以上教学经验，有相关资质证书优先。',
    insuranceRequired: true,
    createdAt: '2024-06-10T10:00:00Z',
    requester: {
      id: 'user-1',
      username: '街舞爱好者小明',
      avatar: '',
      role: 'user',
      followerCount: 12,
      followingCount: 45,
      rating: 4.8,
      verified: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'order-2',
    requesterId: 'user-2',
    title: '婚礼现场钢琴演奏师',
    description: '婚礼现场需要钢琴演奏，曲目已确定，需要在婚礼前彩排一次。要求演奏者形象气质佳，有婚礼演出经验。',
    category: '音乐',
    price: 2000,
    deposit: 500,
    location: '上海市静安区南京西路',
    serviceTime: '2024年8月15日 16:00-18:00',
    duration: 120,
    status: 'matched',
    requirements: '需要自备礼服，有专业演奏水平，能配合现场氛围即兴演奏。',
    insuranceRequired: false,
    createdAt: '2024-06-08T14:30:00Z',
    requester: {
      id: 'user-2',
      username: '准新人小李',
      avatar: '',
      role: 'user',
      followerCount: 5,
      followingCount: 20,
      rating: 5.0,
      verified: true,
      createdAt: '2024-02-15T00:00:00Z',
    },
    creator: {
      id: 'creator-2',
      username: '钢琴小王',
      avatar: '',
      role: 'creator',
      followerCount: 28000,
      followingCount: 156,
      rating: 4.8,
      verified: true,
      createdAt: '2023-12-01T00:00:00Z',
    },
  },
  {
    id: 'order-3',
    requesterId: 'user-3',
    title: '儿童绘画启蒙老师',
    description: '孩子5岁，想培养绘画兴趣，不需要太专业，主要是激发创造力。每周一次，每次1小时。',
    category: '绘画',
    price: 150,
    deposit: 50,
    location: '广州市天河区珠江新城',
    serviceTime: '每周六下午3:00-4:00',
    duration: 60,
    status: 'deposit_paid',
    requirements: '需要老师有儿童教学经验，有耐心，性格开朗。',
    insuranceRequired: true,
    createdAt: '2024-06-05T09:00:00Z',
    requester: {
      id: 'user-3',
      username: '宝妈王女士',
      avatar: '',
      role: 'user',
      followerCount: 28,
      followingCount: 89,
      rating: 4.9,
      verified: true,
      createdAt: '2024-03-20T00:00:00Z',
    },
    creator: {
      id: 'creator-4',
      username: '画家张三',
      avatar: '',
      role: 'creator',
      followerCount: 8900,
      followingCount: 234,
      rating: 4.6,
      verified: true,
      createdAt: '2024-01-10T00:00:00Z',
    },
  },
  {
    id: 'order-4',
    requesterId: 'user-4',
    title: '产品宣传视频拍摄',
    description: '需要拍摄一条30秒的产品宣传短视频，用于抖音推广。需要有创意脚本、拍摄、后期剪辑一条龙服务。',
    category: '摄影',
    price: 5000,
    deposit: 1500,
    location: '深圳市南山区科技园',
    serviceTime: '工作日可安排，具体时间面议',
    duration: 480,
    status: 'in_progress',
    requirements: '需要有产品拍摄经验，提供样片参考。',
    insuranceRequired: false,
    createdAt: '2024-06-01T11:20:00Z',
    requester: {
      id: 'user-4',
      username: '创业者小张',
      avatar: '',
      role: 'user',
      followerCount: 15,
      followingCount: 67,
      rating: 4.7,
      verified: false,
      createdAt: '2024-04-01T00:00:00Z',
    },
    creator: {
      id: 'creator-5',
      username: '摄影师阿杰',
      avatar: '',
      role: 'creator',
      followerCount: 15000,
      followingCount: 456,
      rating: 4.5,
      verified: true,
      createdAt: '2023-11-15T00:00:00Z',
    },
  },
  {
    id: 'order-5',
    requesterId: 'user-5',
    title: '私教健身教练减脂塑形',
    description: '想减脂增肌，每周3次，每次1小时。希望教练有专业资质，能根据我的身体情况制定训练计划。',
    category: '运动',
    price: 200,
    deposit: 80,
    location: '杭州市西湖区文三路',
    serviceTime: '工作日晚上7:00-8:00',
    duration: 60,
    status: 'completed',
    requirements: '需要教练有ACE或NSCA认证，有减脂成功案例。',
    insuranceRequired: true,
    createdAt: '2024-05-15T08:00:00Z',
    requester: {
      id: 'user-5',
      username: '健身小白',
      avatar: '',
      role: 'user',
      followerCount: 8,
      followingCount: 34,
      rating: 4.6,
      verified: false,
      createdAt: '2024-05-01T00:00:00Z',
    },
    creator: {
      id: 'creator-3',
      username: '瑜伽导师Lily',
      avatar: '',
      role: 'creator',
      followerCount: 5600,
      followingCount: 123,
      rating: 4.7,
      verified: false,
      createdAt: '2024-02-20T00:00:00Z',
    },
  },
  {
    id: 'order-6',
    requesterId: 'user-6',
    title: '法式甜点大师课上门教学',
    description: '想学习马卡龙、泡芙等经典法式甜点的制作。希望老师是专业甜点师，有实体店或教学经验。',
    category: '烹饪',
    price: 400,
    deposit: 150,
    location: '成都市锦江区春熙路',
    serviceTime: '周日全天可约',
    duration: 180,
    status: 'published',
    requirements: '需要老师自带部分工具和材料，具体可以商议。',
    insuranceRequired: false,
    createdAt: '2024-06-12T16:45:00Z',
    requester: {
      id: 'user-6',
      username: '烘焙爱好者',
      avatar: '',
      role: 'user',
      followerCount: 42,
      followingCount: 78,
      rating: 5.0,
      verified: true,
      createdAt: '2024-01-20T00:00:00Z',
    },
  },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('全部地区');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PublishFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PublishFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [publishStep, setPublishStep] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [selectedCategory, selectedPrice, selectedStatus, selectedLocation, searchKeyword]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        pageSize: 20,
        status: selectedStatus || undefined,
        category: selectedCategory === '全部' ? undefined : selectedCategory,
        location: selectedLocation === '全部地区' ? undefined : selectedLocation,
        keyword: searchKeyword || undefined,
      };

      const res = await api.orders.list(params);
      const data = (res as any).data?.items || [];

      if (data.length > 0) {
        setOrders(data);
      } else {
        setOrders(mockOrders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAcceptingId(orderId);
    try {
      await api.orders.accept(orderId);
      alert('接单成功！请等待需求方确认');
      loadOrders();
    } catch (error: any) {
      alert(error.message || '接单失败');
    } finally {
      setAcceptingId(null);
    }
  };

  const handlePublish = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowPublishModal(true);
    setPublishStep(1);
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const validateStep1 = (): boolean => {
    const errors: Partial<Record<keyof PublishFormData, string>> = {};
    if (!formData.title.trim()) errors.title = '请输入需求标题';
    if (!formData.description.trim()) errors.description = '请输入需求描述';
    if (!formData.category) errors.category = '请选择分类';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Partial<Record<keyof PublishFormData, string>> = {};
    if (!formData.price || Number(formData.price) <= 0) errors.price = '请输入有效的预算金额';
    if (!formData.deposit || Number(formData.deposit) <= 0) errors.deposit = '请输入定金额度';
    if (Number(formData.deposit) > Number(formData.price) * 0.5) errors.deposit = '定金不能超过预算的50%';
    if (!formData.location.trim()) errors.location = '请输入服务城市';
    if (!formData.serviceTime.trim()) errors.serviceTime = '请输入服务时间';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (publishStep === 1 && validateStep1()) {
      setPublishStep(2);
    } else if (publishStep === 2 && validateStep2()) {
      setPublishStep(3);
    }
  };

  const handlePrevStep = () => {
    if (publishStep > 1) {
      setPublishStep(publishStep - 1);
    }
  };

  const handleSubmitPublish = async () => {
    setSubmitting(true);
    try {
      await api.orders.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        deposit: Number(formData.deposit),
        location: formData.location,
        serviceTime: formData.serviceTime,
        address: formData.address,
        duration: Number(formData.duration) || 60,
        requirements: formData.requirements,
      });
      alert('需求发布成功！系统将为您匹配优质创作者');
      setShowPublishModal(false);
      loadOrders();
    } catch (error: any) {
      alert(error.message || '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: keyof PublishFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };

  const clearFilters = () => {
    setSelectedCategory('全部');
    setSelectedPrice('');
    setSelectedStatus('');
    setSelectedLocation('全部地区');
    setSearchKeyword('');
  };

  const hasActiveFilters = selectedCategory !== '全部' || selectedPrice || selectedStatus || selectedLocation !== '全部地区';

  const publishSteps = [
    { num: 1, title: '基本信息' },
    { num: 2, title: '预算时间' },
    { num: 3, title: '确认发布' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg z-40 border-b border-zinc-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">定制服务广场</h1>
              <p className="text-sm text-zinc-500 mt-1">发布需求，等待专业创作者为您服务</p>
            </div>
            <Button
              variant="primary"
              onClick={handlePublish}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              发布需求
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="搜索需求..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-zinc-100 border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <button
              className={cn(
                'p-3 rounded-full transition-all',
                showFilters || hasActiveFilters
                  ? 'bg-primary-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-sm text-zinc-500">已选：</span>
              {selectedCategory !== '全部' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-sm">
                  {selectedCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('全部')} />
                </span>
              )}
              {selectedLocation !== '全部地区' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                  {selectedLocation}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedLocation('全部地区')} />
                </span>
              )}
              {selectedStatus && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                  {statusOptions.find((s) => s.value === selectedStatus)?.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedStatus('')} />
                </span>
              )}
              <button
                className="text-sm text-zinc-500 hover:text-zinc-700 ml-2"
                onClick={clearFilters}
              >
                清除全部
              </button>
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border-b border-zinc-100 animate-fade-in">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-3">
                  <Tag className="w-4 h-4" />
                  分类
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-all',
                        selectedCategory === cat
                          ? 'bg-primary-500 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      )}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-3">
                  <DollarSign className="w-4 h-4" />
                  价格
                </label>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.value}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-all',
                        selectedPrice === range.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      )}
                      onClick={() => setSelectedPrice(range.value)}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-3">
                  <MapPin className="w-4 h-4" />
                  地区
                </label>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-all',
                        selectedLocation === loc
                          ? 'bg-primary-500 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      )}
                      onClick={() => setSelectedLocation(loc)}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-3">
                  <Clock className="w-4 h-4" />
                  状态
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-all',
                        selectedStatus === status.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      )}
                      onClick={() => setSelectedStatus(status.value)}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order, index) => (
              <div
                key={order.id}
                className={`animate-fade-in-up-delay-${(index % 5) + 1}`}
                style={{ animationFillMode: 'backwards' }}
              >
                <OrderCard
                  order={order}
                  showActions={user?.role === 'creator'}
                  onAccept={() => handleAcceptOrder(order.id)}
                />
                {acceptingId === order.id && (
                  <div className="mt-2 flex justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900">发布定制需求</h2>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                {publishSteps.map((step, index) => (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                          publishStep >= step.num
                            ? 'bg-primary-500 text-white'
                            : 'bg-zinc-200 text-zinc-500'
                        )}
                      >
                        {publishStep > step.num ? '✓' : step.num}
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          publishStep >= step.num ? 'text-primary-600' : 'text-zinc-400'
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < publishSteps.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-4',
                          publishStep > step.num ? 'bg-primary-500' : 'bg-zinc-200'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {publishStep === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      需求标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateForm('title', e.target.value)}
                      placeholder="例如：寻找专业街舞老师进行一对一私教"
                      className={cn(
                        'input-field',
                        formErrors.title && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                      )}
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      需求描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                      placeholder="详细描述您的需求，包括学习目标、期望效果等..."
                      rows={4}
                      className={cn(
                        'input-field resize-none',
                        formErrors.description && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                      )}
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-3">
                      服务分类 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.filter(c => c !== '全部').map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => updateForm('category', cat)}
                          className={cn(
                            'px-4 py-2 rounded-full text-sm transition-all',
                            formData.category === cat
                              ? 'bg-primary-500 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      特殊要求
                    </label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => updateForm('requirements', e.target.value)}
                      placeholder="如：需要有相关资质证书、需要上门服务等..."
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              )}

              {publishStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        预算金额 (元) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => updateForm('price', e.target.value)}
                          placeholder="请输入预算"
                          className={cn(
                            'input-field pl-12',
                            formErrors.price && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                          )}
                        />
                      </div>
                      {formErrors.price && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        定金金额 (元) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                          type="number"
                          value={formData.deposit}
                          onChange={(e) => updateForm('deposit', e.target.value)}
                          placeholder="建议为预算的30%"
                          className={cn(
                            'input-field pl-12',
                            formErrors.deposit && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                          )}
                        />
                      </div>
                      {formErrors.deposit && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.deposit}</p>
                      )}
                      <p className="mt-1 text-xs text-zinc-400">定金用于锁定服务，不超过预算50%</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      服务城市 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => updateForm('location', e.target.value)}
                        placeholder="例如：北京市朝阳区"
                        className={cn(
                          'input-field pl-12',
                          formErrors.location && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                        )}
                      />
                    </div>
                    {formErrors.location && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.location}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      服务时间 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        value={formData.serviceTime}
                        onChange={(e) => updateForm('serviceTime', e.target.value)}
                        placeholder="例如：每周六上午10:00-12:00"
                        className={cn(
                          'input-field pl-12',
                          formErrors.serviceTime && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                        )}
                      />
                    </div>
                    {formErrors.serviceTime && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.serviceTime}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      详细地址
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateForm('address', e.target.value)}
                      placeholder="具体地址将在确认订单后向创作者展示"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      单次时长 (分钟)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => updateForm('duration', e.target.value)}
                        placeholder="60"
                        className="input-field pl-12"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">平台服务保障</p>
                        <p className="text-xs text-blue-600 mt-1">
                          定金由平台托管，服务完成后结算给创作者。家政类服务自动投保服务责任险。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {publishStep === 3 && (
                <div className="animate-fade-in">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">确认需求信息</h3>
                    <p className="text-sm text-zinc-500">请确认以下信息无误后发布</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-50 rounded-xl">
                      <div className="text-sm text-zinc-500 mb-1">需求标题</div>
                      <div className="font-medium text-zinc-900">{formData.title || '-'}</div>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-xl">
                      <div className="text-sm text-zinc-500 mb-1">需求描述</div>
                      <div className="text-zinc-700">{formData.description || '-'}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-50 rounded-xl">
                        <div className="text-sm text-zinc-500 mb-1">分类</div>
                        <div className="font-medium text-zinc-900">{formData.category || '-'}</div>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-xl">
                        <div className="text-sm text-zinc-500 mb-1">预算</div>
                        <div className="font-bold text-accent-600">¥{formData.price || 0}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-50 rounded-xl">
                        <div className="text-sm text-zinc-500 mb-1">定金</div>
                        <div className="font-medium text-primary-600">¥{formData.deposit || 0}</div>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-xl">
                        <div className="text-sm text-zinc-500 mb-1">服务地点</div>
                        <div className="font-medium text-zinc-900">{formData.location || '-'}</div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-xl">
                      <div className="text-sm text-zinc-500 mb-1">服务时间</div>
                      <div className="font-medium text-zinc-900">{formData.serviceTime || '-'}</div>
                    </div>

                    {formData.requirements && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-amber-800">特殊要求</div>
                            <div className="text-sm text-amber-700">{formData.requirements}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-green-800">平台保障</div>
                          <div className="text-xs text-green-600">资金托管 · 履约留痕 · 争议仲裁 · 家政类自动投保</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={handlePrevStep}
                className={cn(
                  'px-6 py-2.5 rounded-xl font-medium transition-colors',
                  publishStep === 1
                    ? 'text-zinc-400 cursor-not-allowed'
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
                disabled={publishStep === 1}
              >
                上一步
              </button>

              {publishStep < 3 ? (
                <Button variant="primary" onClick={handleNextStep} className="px-8">
                  下一步
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmitPublish}
                  isLoading={submitting}
                  className="px-8"
                >
                  确认发布
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
