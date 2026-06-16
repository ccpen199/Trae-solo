import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, MapPin, DollarSign, Clock, Calendar, X, Search, Tag, Shield, ChevronRight, FileText, AlertCircle, AlertTriangle, CheckCircle, Info, Home, User, CreditCard, Smartphone, Check, Star, Users, Zap, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import OrderCard from '../components/OrderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Empty from '../components/Empty';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatusBadge from '../components/StatusBadge';
import type { ServiceOrder, User as UserType } from '../../shared/types';
import { cn } from '../lib/utils';

type LoadingAction = 'accept' | 'payDeposit' | 'start' | 'complete' | 'dispute' | null;

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

const serviceCities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];

const timeSlots = [
  '上午 09:00-12:00',
  '下午 14:00-17:00',
  '晚上 19:00-21:00',
  '全天 09:00-18:00',
  '具体时间面议',
];

const durationOptions = [
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '2小时', value: 120 },
  { label: '半天 (4小时)', value: 240 },
  { label: '全天 (8小时)', value: 480 },
];

interface PublishFormData {
  title: string;
  description: string;
  category: string;
  price: string;
  deposit: string;
  location: string;
  city: string;
  serviceTime: string;
  serviceDate: string;
  timeSlot: string;
  address: string;
  duration: string;
  requirements: string;
  notes: string;
  insuranceUpgrade: boolean;
  insuranceRequired: boolean;
}

const defaultFormData: PublishFormData = {
  title: '',
  description: '',
  category: '舞蹈',
  price: '',
  deposit: '',
  location: '',
  city: '',
  serviceTime: '',
  serviceDate: '',
  timeSlot: '',
  address: '',
  duration: '',
  requirements: '',
  notes: '',
  insuranceUpgrade: false,
  insuranceRequired: false,
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
    address: '北京市朝阳区三里屯SOHO 3号楼1502室',
    serviceTime: '每周六、日上午10:00-11:30',
    duration: 90,
    status: 'published',
    requirements: '需要老师有3年以上教学经验，有相关资质证书优先。',
    insuranceRequired: false,
    depositPaid: false,
    matchScore: 92,
    latestMessage: {
      sender: '系统',
      time: '10分钟前',
      content: '订单已发布，正在为您匹配优质创作者',
    },
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
    address: '上海市静安区南京西路1266号恒隆广场5楼宴会厅',
    serviceTime: '2024年8月15日 16:00-18:00',
    duration: 120,
    status: 'matched',
    requirements: '需要自备礼服，有专业演奏水平，能配合现场氛围即兴演奏。',
    insuranceRequired: false,
    depositPaid: false,
    matchScore: 95,
    latestMessage: {
      sender: '钢琴小王',
      time: '2小时前',
      content: '已收到您的需求，我有5年婚礼演奏经验，期待合作！',
    },
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
    title: '高端家政保洁服务',
    description: '三居室深度保洁，包括厨房油污清洁、卫生间消毒、窗户玻璃清洁等。需要专业设备和环保清洁剂。',
    category: '家政',
    price: 599,
    deposit: 200,
    location: '广州市天河区珠江新城',
    address: '广州市天河区珠江新城冼村路2号博雅首府1803室',
    serviceTime: '每周六上午9:00-13:00',
    duration: 240,
    status: 'deposit_paid',
    requirements: '需要有正规家政公司资质，服务人员有健康证。',
    insuranceRequired: true,
    depositPaid: true,
    matchScore: 88,
    latestMessage: {
      sender: '洁丽雅家政',
      time: '昨天 15:30',
      content: '定金已收到，本周六上午9点准时上门服务',
    },
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
      username: '洁丽雅家政',
      avatar: '',
      role: 'creator',
      followerCount: 8900,
      followingCount: 234,
      rating: 4.9,
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
    address: '深圳市南山区科技园南区科苑南路3809号TCL大厦B座12楼',
    serviceTime: '工作日可安排，具体时间面议',
    duration: 480,
    status: 'in_progress',
    requirements: '需要有产品拍摄经验，提供样片参考。',
    insuranceRequired: false,
    depositPaid: true,
    matchScore: 91,
    latestMessage: {
      sender: '摄影师阿杰',
      time: '今天 09:15',
      content: '脚本已调整完毕，今天下午2点开拍没问题吧？',
    },
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
    address: '杭州市西湖区文三路259号昌地火炬大厦2号楼802室',
    serviceTime: '工作日晚上7:00-8:00',
    duration: 60,
    status: 'completed',
    requirements: '需要教练有ACE或NSCA认证，有减脂成功案例。',
    insuranceRequired: true,
    depositPaid: true,
    matchScore: 87,
    latestMessage: {
      sender: '健身教练阿强',
      time: '3天前',
      content: '课程全部完成啦！记得坚持锻炼，有问题随时问我~',
    },
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
      username: '健身教练阿强',
      avatar: '',
      role: 'creator',
      followerCount: 5600,
      followingCount: 123,
      rating: 4.9,
      verified: true,
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
    address: '成都市锦江区春熙路正科甲巷17号锦华馆10号楼3单元501',
    serviceTime: '周日全天可约',
    duration: 180,
    status: 'disputed',
    requirements: '需要老师自带部分工具和材料，具体可以商议。',
    insuranceRequired: false,
    depositPaid: true,
    matchScore: 85,
    latestMessage: {
      sender: '系统',
      time: '2小时前',
      content: '争议已受理，平台专员将在3个工作日内介入处理',
    },
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
    creator: {
      id: 'creator-6',
      username: '甜点师Coco',
      avatar: '',
      role: 'creator',
      followerCount: 3200,
      followingCount: 89,
      rating: 4.3,
      verified: false,
      createdAt: '2024-03-05T00:00:00Z',
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
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [formData, setFormData] = useState<PublishFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PublishFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [publishStep, setPublishStep] = useState(1);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedOrderId, setPublishedOrderId] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchOrderId, setMatchOrderId] = useState<string | null>(null);
  const [confirmingCreator, setConfirmingCreator] = useState<string | null>(null);

  const mockMatchedCreators: (UserType & { matchScore: number })[] = [
    {
      id: 'creator-1',
      username: '舞蹈大师Linda',
      avatar: '',
      role: 'creator',
      followerCount: 12500,
      followingCount: 89,
      rating: 4.9,
      verified: true,
      createdAt: '2023-06-15T00:00:00Z',
      matchScore: 95,
    },
    {
      id: 'creator-2',
      username: '街舞阿King',
      avatar: '',
      role: 'creator',
      followerCount: 8900,
      followingCount: 156,
      rating: 4.7,
      verified: true,
      createdAt: '2023-09-20T00:00:00Z',
      matchScore: 88,
    },
    {
      id: 'creator-3',
      username: '爵士舞老师Mia',
      avatar: '',
      role: 'creator',
      followerCount: 5600,
      followingCount: 234,
      rating: 4.8,
      verified: false,
      createdAt: '2024-01-10T00:00:00Z',
      matchScore: 82,
    },
  ];

  useEffect(() => {
    loadOrders();
  }, [selectedCategory, selectedPrice, selectedStatus, selectedLocation, searchKeyword, activeTab]);

  const fillOrderDefaults = (order: ServiceOrder): ServiceOrder => {
    const category = order.category || '';
    const status = order.status;
    const location = order.location || '';

    const addressSuffixes = [
      '1号楼101室',
      '2号楼3单元502室',
      '商业广场A座12层',
      '科技园B栋8楼',
      '中心大厦1503室',
    ];
    const randomSuffix = addressSuffixes[Math.floor(Math.random() * addressSuffixes.length)];
    const address = order.address || (location ? location + randomSuffix : '地址待补充');

    const matchScore = order.matchScore ?? Math.floor(80 + Math.random() * 18);

    const defaultMessages = [
      { sender: '系统', time: '刚刚', content: '订单已创建，等待创作者接单' },
      { sender: '系统', time: '10分钟前', content: '正在为您匹配合适的创作者' },
      { sender: '创作者', time: '30分钟前', content: '您好，我已接单，请确认订单信息' },
      { sender: '需求方', time: '1小时前', content: '好的，期待您的服务' },
      { sender: '创作者', time: '昨天', content: '定金已收到，会准时上门' },
    ];
    const latestMessage = order.latestMessage || defaultMessages[Math.floor(Math.random() * defaultMessages.length)];

    const insuranceRequired = order.insuranceRequired ?? (category === '家政' || category === '护理' || category === '运动');

    const depositPaid = order.depositPaid ?? ['deposit_paid', 'in_progress', 'completed', 'disputed'].includes(status);

    return {
      ...order,
      address,
      matchScore,
      latestMessage,
      insuranceRequired,
      depositPaid,
    };
  };

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

      let orderList: ServiceOrder[] = [];
      if (data.length > 0) {
        orderList = data.map((order: ServiceOrder) => fillOrderDefaults(order));
      } else {
        orderList = mockOrders;
      }

      if (activeTab === 'my' && user) {
        orderList = orderList.filter(order => order.requesterId === user.id);
      }

      setOrders(orderList);
    } catch (error) {
      console.error('Failed to load orders:', error);
      let orderList = mockOrders;
      if (activeTab === 'my' && user) {
        orderList = orderList.filter(order => order.requesterId === user.id);
      }
      setOrders(orderList);
    } finally {
      setLoading(false);
    }
  };

  const setActionLoading = (orderId: string, action: LoadingAction) => {
    setLoadingOrderId(orderId);
    setLoadingAction(action);
  };

  const clearActionLoading = () => {
    setLoadingOrderId(null);
    setLoadingAction(null);
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setActionLoading(orderId, 'accept');
    try {
      await api.orders.accept(orderId);
      alert('接单成功！请等待需求方确认');
      loadOrders();
    } catch (error: any) {
      alert(error.message || '接单失败');
    } finally {
      clearActionLoading();
    }
  };

  const handlePayDeposit = (orderId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setPayOrderId(orderId);
    setShowPayModal(true);
  };

  const handleConfirmPay = async () => {
    if (!payOrderId) return;

    setPaying(true);
    try {
      await api.orders.payDeposit(payOrderId);
      setShowPayModal(false);
      setPayOrderId(null);
      loadOrders();
    } catch (error: any) {
      alert(error.message || '支付失败');
    } finally {
      setPaying(false);
    }
  };

  const getCurrentPayOrder = () => {
    return orders.find(o => o.id === payOrderId);
  };

  const handleViewMatches = (orderId: string) => {
    setMatchOrderId(orderId);
    setShowMatchModal(true);
  };

  const handleConfirmCreator = async (creatorId: string) => {
    if (!matchOrderId) return;

    setConfirmingCreator(creatorId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowMatchModal(false);
      setMatchOrderId(null);
      loadOrders();
      alert('已确认创作者，等待创作者接单');
    } catch (error: any) {
      alert(error.message || '确认失败');
    } finally {
      setConfirmingCreator(null);
    }
  };

  const handleStartService = async (orderId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setActionLoading(orderId, 'start');
    try {
      await api.orders.start(orderId);
      alert('服务已开始！请按时完成服务');
      loadOrders();
    } catch (error: any) {
      alert(error.message || '开始服务失败');
    } finally {
      clearActionLoading();
    }
  };

  const handleCompleteService = async (orderId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setActionLoading(orderId, 'complete');
    try {
      await api.orders.complete(orderId);
      alert('服务已完成！请双方确认评价');
      loadOrders();
    } catch (error: any) {
      alert(error.message || '完成服务失败');
    } finally {
      clearActionLoading();
    }
  };

  const handleOpenDispute = (orderId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setDisputeOrderId(orderId);
    setDisputeReason('');
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async () => {
    if (!disputeOrderId || !disputeReason.trim()) {
      alert('请填写仲裁申请理由');
      return;
    }

    setDisputeSubmitting(true);
    try {
      await api.orders.dispute(disputeOrderId, disputeReason.trim());
      alert('仲裁申请已提交，平台将尽快处理');
      setShowDisputeModal(false);
      loadOrders();
    } catch (error: any) {
      alert(error.message || '申请仲裁失败');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const handlePublish = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowPublishModal(true);
    setPublishStep(1);
    setPublishSuccess(false);
    setPublishedOrderId('');
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const validateStep1 = (): boolean => {
    const errors: Partial<Record<keyof PublishFormData, string>> = {};
    if (!formData.title.trim()) {
      errors.title = '请输入需求标题';
    } else if (formData.title.trim().length < 5) {
      errors.title = '标题至少需要5个字';
    }
    if (!formData.description.trim()) errors.description = '请输入需求描述';
    if (!formData.category) errors.category = '请选择分类';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Partial<Record<keyof PublishFormData, string>> = {};
    const price = Number(formData.price);
    const deposit = Number(formData.deposit);
    if (!formData.price || price <= 0) errors.price = '请输入有效的预算金额';
    if (!formData.deposit || deposit <= 0) {
      errors.deposit = '请输入定金额度';
    } else if (deposit > price * 0.5) {
      errors.deposit = '定金不能超过预算的50%';
    }
    if (!formData.serviceDate) errors.serviceDate = '请选择预约日期';
    if (!formData.timeSlot) errors.timeSlot = '请选择时间段';
    if (!formData.duration) errors.duration = '请选择服务时长';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: Partial<Record<keyof PublishFormData, string>> = {};
    if (!formData.city) errors.city = '请选择服务城市';
    if (!formData.address.trim()) errors.address = '请输入详细地址';
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
    if (!validateStep3()) return;

    setSubmitting(true);
    try {
      const isHomeService = formData.category === '家政';
      const serviceTimeStr = `${formData.serviceDate} ${formData.timeSlot}`;
      const orderData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        deposit: Number(formData.deposit),
        location: formData.city + (formData.address ? ' ' + formData.address : ''),
        serviceTime: serviceTimeStr,
        address: formData.address,
        duration: Number(formData.duration) || 60,
        requirements: formData.requirements,
        notes: formData.notes,
        insuranceRequired: isHomeService || formData.insuranceUpgrade,
      };

      const res = await api.orders.create(orderData);
      const orderId = (res as any)?.data?.id || `ORDER-${Date.now()}`;

      setPublishedOrderId(orderId);
      setPublishSuccess(true);
      loadOrders();
    } catch (error: any) {
      alert(error.message || '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewMyOrders = () => {
    setShowPublishModal(false);
    setActiveTab('my');
  };

  const handleViewOrderDetail = () => {
    setShowPublishModal(false);
    if (publishedOrderId) {
      navigate(`/orders/${publishedOrderId}`);
    }
  };

  const handleContinuePublish = () => {
    setPublishSuccess(false);
    setPublishedOrderId('');
    setPublishStep(1);
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const updateForm = (field: keyof PublishFormData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field as keyof PublishFormData]) {
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
    { num: 1, title: '基本信息', icon: FileText },
    { num: 2, title: '预算时间', icon: DollarSign },
    { num: 3, title: '地址保障', icon: Shield },
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

          <div className="flex items-center gap-1 mb-4 bg-zinc-100 rounded-full p-1 w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all duration-300',
                activeTab === 'all'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              全部需求
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                setActiveTab('my');
              }}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2',
                activeTab === 'my'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              <User className="w-4 h-4" />
              我的需求
            </button>
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
                  showActions={true}
                  userRole={user?.role}
                  loadingAction={loadingOrderId === order.id ? loadingAction : null}
                  onAccept={() => handleAcceptOrder(order.id)}
                  onPayDeposit={() => handlePayDeposit(order.id)}
                  onStart={() => handleStartService(order.id)}
                  onComplete={() => handleCompleteService(order.id)}
                  onDispute={() => handleOpenDispute(order.id)}
                  onViewMatches={() => handleViewMatches(order.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
            {publishSuccess ? (
              <div className="p-8 flex flex-col items-center justify-center text-center animate-fade-in overflow-y-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-green-500/30">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-1">需求已发布</h2>
                <p className="text-zinc-500 mb-6">我们正在为您匹配合适的创作者</p>

                <div className="w-full bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-5 mb-6 border border-primary-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-zinc-500">订单编号</span>
                    <span className="font-mono font-semibold text-primary-600 text-sm">{publishedOrderId}</span>
                  </div>
                  <div className="text-left mb-4 pb-4 border-b border-primary-100">
                    <p className="font-semibold text-zinc-800 text-left mb-1">{formData.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">待接单</Badge>
                      <span className="text-sm text-zinc-500">预计 24 小时内匹配</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-zinc-800">智能匹配中</p>
                      <p className="text-xs text-zinc-500 mt-0.5">系统正在根据您的需求筛选优质创作者</p>
                    </div>
                  </div>
                </div>

                <div className="w-full mb-6">
                  <p className="text-sm font-medium text-zinc-700 mb-4 text-left">匹配进度</p>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      {[
                        { label: '发布成功', icon: CheckCircle, active: true },
                        { label: '系统匹配', icon: Zap, active: true },
                        { label: '创作者接单', icon: User, active: false },
                        { label: '定金支付', icon: DollarSign, active: false },
                      ].map((step, idx) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={idx} className="flex flex-col items-center flex-1 relative">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500',
                                step.active
                                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md shadow-green-500/30'
                                  : 'bg-zinc-100 text-zinc-400'
                              )}
                            >
                              <StepIcon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                              'text-xs mt-2 font-medium',
                              step.active ? 'text-green-600' : 'text-zinc-400'
                            )}>
                              {step.label}
                            </span>
                            {idx < 3 && (
                              <div
                                className={cn(
                                  'absolute top-5 left-[60%] w-[80%] h-0.5 -translate-y-1/2',
                                  idx < 1 ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-zinc-200'
                                )}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="w-full p-4 bg-zinc-50 rounded-2xl mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <div className="text-left text-sm text-zinc-600">
                      <p className="font-medium text-zinc-700 mb-1">温馨提示</p>
                      <ul className="space-y-1 text-zinc-500 text-xs">
                        <li>• 匹配成功后将通过站内消息通知您</li>
                        <li>• 您可以选择心仪的创作者并确认接单</li>
                        <li>• 支付定金后，创作者将开始服务</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="w-full flex gap-3">
                  <Button variant="secondary" onClick={handleViewMyOrders} fullWidth>
                    查看我的需求
                  </Button>
                  <Button variant="primary" onClick={handleContinuePublish} fullWidth>
                    继续发布
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-zinc-100 flex-shrink-0">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-zinc-900">发布定制需求</h2>
                    <button
                      onClick={() => setShowPublishModal(false)}
                      className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
                    >
                      <X className="w-5 h-5 text-zinc-500" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {publishSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = publishStep === step.num;
                      const isCompleted = publishStep > step.num;
                      return (
                        <div key={step.num} className="flex items-center flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                                isCompleted
                                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md shadow-green-500/30'
                                  : isActive
                                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30 scale-110'
                                  : 'bg-zinc-100 text-zinc-400'
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <StepIcon className="w-5 h-5" />
                              )}
                            </div>
                            <span
                              className={cn(
                                'text-sm font-medium transition-colors',
                                isActive || isCompleted ? 'text-zinc-800' : 'text-zinc-400'
                              )}
                            >
                              {step.title}
                            </span>
                          </div>
                          {index < publishSteps.length - 1 && (
                            <div
                              className={cn(
                                'flex-1 h-1 mx-3 rounded-full transition-all duration-300',
                                isCompleted ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-zinc-200'
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
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
                        <p className="mt-1 text-xs text-zinc-400">请输入清晰、具体的需求标题（至少5个字）</p>
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
                                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
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
                          需求描述 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => updateForm('description', e.target.value)}
                          placeholder="详细描述您的需求，包括学习目标、期望效果、服务内容等..."
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
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                          服务要求
                        </label>
                        <textarea
                          value={formData.requirements}
                          onChange={(e) => updateForm('requirements', e.target.value)}
                          placeholder="如：需要有相关资质证书、需要上门服务、有教学经验等..."
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
                            预算金额 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">¥</span>
                            <input
                              type="number"
                              value={formData.price}
                              onChange={(e) => updateForm('price', e.target.value)}
                              placeholder="请输入预算"
                              className={cn(
                                'input-field pl-10',
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
                            定金金额 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">¥</span>
                            <input
                              type="number"
                              value={formData.deposit}
                              onChange={(e) => updateForm('deposit', e.target.value)}
                              placeholder="建议为预算的30%"
                              className={cn(
                                'input-field pl-10',
                                formErrors.deposit && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                              )}
                            />
                          </div>
                          {formErrors.deposit && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.deposit}</p>
                          )}
                          <p className="mt-1 text-xs text-zinc-400">建议为预算的20%-50%，定金由平台托管</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            预约日期 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                              type="date"
                              value={formData.serviceDate}
                              onChange={(e) => updateForm('serviceDate', e.target.value)}
                              className={cn(
                                'input-field pl-12',
                                formErrors.serviceDate && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                              )}
                            />
                          </div>
                          {formErrors.serviceDate && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.serviceDate}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            时间段 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <select
                              value={formData.timeSlot}
                              onChange={(e) => updateForm('timeSlot', e.target.value)}
                              className={cn(
                                'input-field pl-12 appearance-none cursor-pointer',
                                formErrors.timeSlot && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                              )}
                            >
                              <option value="">请选择时间段</option>
                              {timeSlots.map((slot) => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                          {formErrors.timeSlot && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.timeSlot}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-3">
                          服务时长 <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {durationOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateForm('duration', String(opt.value))}
                              className={cn(
                                'py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
                                formData.duration === String(opt.value)
                                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {formErrors.duration && (
                          <p className="mt-2 text-sm text-red-500">{formErrors.duration}</p>
                        )}
                      </div>

                      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">温馨提示</p>
                            <p className="text-xs text-amber-600 mt-1">
                              定金用于锁定服务时段，服务确认后支付给创作者。如取消服务，定金根据平台规则处理。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {publishStep === 3 && (
                    <div className="space-y-5 animate-fade-in">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                          服务城市 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                          <select
                            value={formData.city}
                            onChange={(e) => updateForm('city', e.target.value)}
                            className={cn(
                              'input-field pl-12 appearance-none cursor-pointer',
                              formErrors.city && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                            )}
                          >
                            <option value="">请选择城市</option>
                            {serviceCities.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        {formErrors.city && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                          详细地址 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Home className="absolute left-4 top-4 w-5 h-5 text-zinc-400" />
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => updateForm('address', e.target.value)}
                            placeholder="请输入详细地址，如：朝阳区三里屯SOHO..."
                            className={cn(
                              'input-field pl-12',
                              formErrors.address && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                            )}
                          />
                        </div>
                        {formErrors.address && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>
                        )}
                        <p className="mt-1 text-xs text-zinc-400">详细地址仅在确认订单后向创作者展示</p>
                      </div>

                      <div className="pt-2">
                        {formData.category === '家政' ? (
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Shield className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-green-800">强制投保服务责任险</p>
                                  <span className="px-2 py-0.5 bg-green-200 text-green-700 text-xs rounded-full font-medium">
                                    已自动勾选
                                  </span>
                                </div>
                                <p className="text-sm text-green-600 mt-1">
                                  平台承担保费，最高50万保额，保障服务过程中的意外风险
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Shield className="w-5 h-5 text-zinc-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-zinc-800">可选升级保障</p>
                                  <p className="text-sm text-zinc-500 mt-1">
                                    升级服务责任险，最高50万保额，保费由平台承担
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateForm('insuranceUpgrade', !formData.insuranceUpgrade)}
                                className={cn(
                                  'relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0',
                                  formData.insuranceUpgrade ? 'bg-primary-500' : 'bg-zinc-300'
                                )}
                              >
                                <div
                                  className={cn(
                                    'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200',
                                    formData.insuranceUpgrade ? 'translate-x-5' : 'translate-x-0.5'
                                  )}
                                />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                          备注信息
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => updateForm('notes', e.target.value)}
                          placeholder="其他需要说明的事项..."
                          rows={2}
                          className="input-field resize-none"
                        />
                      </div>

                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-blue-800">平台服务保障</p>
                            <p className="text-xs text-blue-600 mt-1">
                              资金托管 · 履约留痕 · 争议仲裁 · 7天无理由退款（未开始服务）
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-zinc-100 flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={handlePrevStep}
                    className={cn(
                      'px-6 py-2.5 rounded-xl font-medium transition-colors',
                      publishStep === 1
                        ? 'text-zinc-400 cursor-not-allowed'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    )}
                    disabled={publishStep === 1}
                  >
                    上一步
                  </button>

                  {publishStep < 3 ? (
                    <Button variant="primary" onClick={handleNextStep} className="px-8">
                      下一步
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleSubmitPublish}
                      isLoading={submitting}
                      className="px-8"
                    >
                      提交发布
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">申请仲裁</h2>
                    <p className="text-sm text-zinc-500">平台将在3个工作日内介入处理</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  仲裁理由 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="请详细描述您的争议原因，包括相关情况和您的诉求..."
                  rows={5}
                  className="input-field resize-none"
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">温馨提示</p>
                    <p className="text-xs text-amber-600 mt-1">
                      申请仲裁后，订单将进入争议处理状态。平台会根据双方提供的证据进行裁决，请确保您的描述真实有效。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDisputeModal(false)}
                disabled={disputeSubmitting}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitDispute}
                isLoading={disputeSubmitting}
              >
                提交申请
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPayModal && getCurrentPayOrder() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">支付定金</h2>
                    <p className="text-sm text-zinc-500">确认支付信息后完成支付</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-2xl p-5 border border-accent-100">
                <p className="text-sm text-zinc-500 mb-2">{getCurrentPayOrder()?.title}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">服务总价</p>
                    <p className="text-xl font-bold text-zinc-800">¥{getCurrentPayOrder()?.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">定金 (30%)</p>
                    <p className="text-2xl font-bold text-accent-600">¥{getCurrentPayOrder()?.deposit}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700 mb-3">支付方式</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 border-2 border-primary-500 bg-primary-50 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-800">微信支付</p>
                        <p className="text-xs text-zinc-500">推荐使用</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-2 border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-800">支付宝</p>
                        <p className="text-xs text-zinc-500">支持花呗、信用卡</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-300" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">平台资金保障</p>
                    <p className="text-xs text-blue-600 mt-1">
                      定金由平台托管，服务确认完成后结算给创作者。如遇纠纷，平台将介入保障您的权益。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100">
              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={handleConfirmPay}
                isLoading={paying}
              >
                确认支付 ¥{getCurrentPayOrder()?.deposit}
              </Button>
              <p className="text-xs text-zinc-400 text-center mt-3">
                点击支付即表示同意《服务协议》和《支付条款》
              </p>
            </div>
          </div>
        </div>
      )}

      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">匹配创作者</h2>
                    <p className="text-sm text-zinc-500">已为您匹配到 {mockMatchedCreators.length} 位创作者</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMatchModal(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {mockMatchedCreators.map((creator, index) => (
                <div
                  key={creator.id}
                  className={`p-4 border-2 rounded-2xl transition-all animate-fade-in-up-delay-${index + 1}`}
                  style={{
                    animationFillMode: 'backwards',
                    borderColor: 'rgb(228, 228, 231)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    {creator.avatar ? (
                      <img
                        src={creator.avatar}
                        alt={creator.username}
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-zinc-900 truncate">{creator.username}</h3>
                        {creator.verified && (
                          <Badge variant="primary" size="sm">认证</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-zinc-700 font-medium">{creator.rating.toFixed(1)}</span>
                        </div>
                        <span>{creator.followerCount.toLocaleString()} 粉丝</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">匹配度</span>
                        <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              creator.matchScore >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                              creator.matchScore >= 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                              'bg-gradient-to-r from-red-400 to-red-500'
                            )}
                            style={{ width: `${creator.matchScore}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-sm font-bold',
                          creator.matchScore >= 90 ? 'text-green-600' :
                          creator.matchScore >= 70 ? 'text-amber-600' :
                          'text-red-600'
                        )}>
                          {creator.matchScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => navigate(`/creator/${creator.id}`)}
                    >
                      查看主页
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      isLoading={confirmingCreator === creator.id}
                      onClick={() => handleConfirmCreator(creator.id)}
                    >
                      确认接单
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-zinc-100 flex-shrink-0">
              <p className="text-xs text-zinc-500 text-center">
                <Info className="w-4 h-4 inline mr-1 -mt-0.5" />
                确认后创作者将收到通知，支付定金后开始服务
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
