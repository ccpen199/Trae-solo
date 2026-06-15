import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Calendar, Shield, Star, CheckCircle, AlertCircle, MessageSquare, User, ChevronRight, FileText, Scale, AlertTriangle, Receipt, PiggyBank, ArrowRight, X, Phone, Download, Image, File, Tag, ClipboardCheck, Timer, Navigation, Building2, Hash, ThumbsUp, ThumbsDown } from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import Empty from '../components/Empty';
import Button from '../components/Button';
import Badge from '../components/Badge';
import type { ServiceOrder, ServiceTrace, Review, Transaction } from '../../shared/types';
import { cn } from '../lib/utils';

const statusConfig: Record<string, { label: string; color: string; step: number }> = {
  published: { label: '待接单', color: 'status-published', step: 0 },
  matched: { label: '已匹配', color: 'status-matched', step: 1 },
  confirmed: { label: '已确认', color: 'status-confirmed', step: 2 },
  deposit_paid: { label: '已付定金', color: 'status-deposit_paid', step: 3 },
  in_progress: { label: '服务中', color: 'status-in_progress', step: 4 },
  completed: { label: '已完成', color: 'status-completed', step: 5 },
  cancelled: { label: '已取消', color: 'status-cancelled', step: -1 },
  disputed: { label: '有争议', color: 'status-disputed', step: -1 },
};

const timelineLabels = ['发布订单', '匹配创作者', '双方确认', '支付定金', '服务进行', '服务完成'];

const traceTypeLabels: Record<string, string> = {
  create: '订单创建',
  match: '创作者匹配',
  confirm: '订单确认',
  deposit: '定金支付',
  start: '服务开始',
  complete: '服务完成',
  cancel: '订单取消',
  dispute: '争议提交',
  message: '消息记录',
  upload: '文件上传',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [traces, setTraces] = useState<ServiceTrace[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [showSettlementDetail, setShowSettlementDetail] = useState(false);
  const [showCreatorReviewForm, setShowCreatorReviewForm] = useState(false);
  const [creatorReviewRating, setCreatorReviewRating] = useState(5);
  const [creatorReviewContent, setCreatorReviewContent] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [creatorReviewSubmitted, setCreatorReviewSubmitted] = useState(true);

  const chatMessages = [
    {
      id: 'msg1',
      sender: 'user1',
      senderName: '王先生',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      type: 'text',
      content: '您好张阿姨，我家明天的保洁有几个重点区域需要跟您说一下：厨房油烟机很久没清洗了，还有两个卫生间的玻璃水垢比较严重。',
      time: '2024-06-09 20:15',
      role: 'requester',
    },
    {
      id: 'msg2',
      sender: 'creator1',
      senderName: '家政师张阿姨',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangayi',
      type: 'text',
      content: '好的王先生放心！油烟机重油污我会用专用的清洁剂配合高温蒸汽处理，玻璃水垢也有专门的工具。请问家里有停车位吗？',
      time: '2024-06-09 20:22',
      role: 'creator',
    },
    {
      id: 'msg3',
      sender: 'user1',
      senderName: '王先生',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      type: 'image',
      content: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      time: '2024-06-09 20:25',
      role: 'requester',
      caption: '厨房现状图，麻烦重点处理',
    },
    {
      id: 'msg4',
      sender: 'creator1',
      senderName: '家政师张阿姨',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangayi',
      type: 'text',
      content: '收到！看图片油污确实比较重，我会多带一套专业设备过去。另外我把我的健康证和服务资质发给您确认。',
      time: '2024-06-09 20:30',
      role: 'creator',
    },
    {
      id: 'msg5',
      sender: 'creator1',
      senderName: '家政师张阿姨',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangayi',
      type: 'file',
      content: '家政服务资质证书.pdf',
      fileSize: '2.3 MB',
      time: '2024-06-09 20:31',
      role: 'creator',
    },
    {
      id: 'msg6',
      sender: 'user1',
      senderName: '王先生',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      type: 'text',
      content: '太好了，谢谢您！另外小区地下车库可以临时停车，我到时帮您登记。明天见！',
      time: '2024-06-09 20:35',
      role: 'requester',
    },
    {
      id: 'msg7',
      sender: 'creator1',
      senderName: '家政师张阿姨',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangayi',
      type: 'text',
      content: '好的，明天9点准时到！😊',
      time: '2024-06-09 20:36',
      role: 'creator',
    },
  ];

  const creatorReview = {
    id: 'creview1',
    rating: 5,
    content: '王先生一家非常好相处，家里环境整洁，沟通顺畅，还贴心地给我准备了饮用水。预约时间准确，结账也很爽快，非常愉快的一次合作！期待下次继续为您服务。',
    createdAt: new Date(Date.now() - 3 * 86400000 + 3600000).toISOString(),
    tags: ['沟通顺畅', '环境整洁', '准时守约', '爽快结账'],
    user: {
      username: '家政师张阿姨',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangayi',
    },
  };

  const insuranceInfo = {
    policyNo: 'PICC20240610051288',
    company: '中国人民财产保险',
    coverage: 500000,
    premium: 12,
    range: ['第三者财产损失', '服务人员意外伤害', '家政服务过失责任', '盗抢损失保障'],
  };

  const reviewRecords = [
    {
      id: 'rr1',
      type: '签到核验',
      time: '2024-06-10 09:05',
      reviewer: '系统自动核验',
      result: '通过',
      detail: 'GPS定位距服务地址80米，签到时间与预约时间差2分钟，正常。',
      resultType: 'pass',
    },
    {
      id: 'rr2',
      type: '时长核对',
      time: '2024-06-10 13:20',
      reviewer: '系统自动核验',
      result: '通过',
      detail: '实际服务时长253分钟，预约时长240分钟，超出时长5%，符合标准。',
      resultType: 'pass',
    },
    {
      id: 'rr3',
      type: '评价抽样',
      time: '2024-06-12 14:30',
      reviewer: '平台运营 李主管',
      result: '通过',
      detail: '电话回访需求方，确认服务质量与评价内容一致，无异常。',
      resultType: 'pass',
    },
  ];

  const disputeReasons = [
    '服务质量不符合预期',
    '创作者未按时履约',
    '服务内容与描述不符',
    '沟通不畅或态度问题',
    '其他原因',
  ];

  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  const loadOrderData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [orderRes, tracesRes, reviewRes] = await Promise.all([
        api.orders.getById(id),
        api.orders.getTraces(id),
        api.orders.getReview(id).catch(() => ({ data: null })),
      ]);

      setOrder((orderRes as any).data);
      setTraces((tracesRes as any).data || []);
      setReview((reviewRes as any).data);
    } catch (error) {
      console.error('Failed to load order:', error);
      setOrder({
        id: id || '1',
        requesterId: 'user1',
        title: '深度保洁服务（三居室）',
        description: '需要对三居室进行深度保洁，包括厨房油污清理、卫生间消毒、窗户擦拭、地板打蜡等。重点区域：厨房油烟机、灶台、卫生间马桶、淋浴间玻璃水垢。',
        category: '家政',
        price: 680,
        deposit: 200,
        location: '北京市海淀区中关村大街1号院5号楼1单元1802',
        serviceTime: '2024年6月10日 上午9:00-13:00',
        duration: 240,
        status: 'completed',
        insurancePolicy: '家政服务责任险（强制投保）',
        requirements: '需要携带专业清洁设备和环保清洁剂，保洁人员需有健康证和3年以上家政经验。',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        requester: {
          id: 'user1',
          username: '王先生',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
          role: 'user',
          followerCount: 0,
          followingCount: 0,
          rating: 4.8,
          verified: true,
          createdAt: new Date().toISOString(),
        },
        creator: {
          id: 'creator1',
          username: '家政师张阿姨',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangayi',
          role: 'creator',
          followerCount: 5000,
          followingCount: 100,
          rating: 4.9,
          verified: true,
          createdAt: new Date().toISOString(),
        },
        contactPhone: '138****5678',
        bookingNo: 'BK20240610001234',
        checkInTime: '2024-06-10T09:02:15',
        checkOutTime: '2024-06-10T13:15:42',
        actualDuration: 253,
        gpsDistance: 0.08,
      } as any);
      setTraces([
        {
          id: 'trace1',
          orderId: id || '1',
          type: 'create',
          content: '订单已创建，等待家政师接单',
          operatorId: 'user1',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          operator: {
            id: 'user1',
            username: '王先生',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
            role: 'user',
            followerCount: 0,
            followingCount: 0,
            rating: 0,
            verified: false,
            createdAt: new Date().toISOString(),
          },
        },
        {
          id: 'trace2',
          orderId: id || '1',
          type: 'match',
          content: '系统为您匹配了5位符合条件的家政师',
          createdAt: new Date(Date.now() - 7 * 86400000 + 3600000).toISOString(),
        },
        {
          id: 'trace3',
          orderId: id || '1',
          type: 'confirm',
          content: '家政师张阿姨已接单，双方确认服务时间',
          operatorId: 'creator1',
          createdAt: new Date(Date.now() - 7 * 86400000 + 7200000).toISOString(),
          operator: {
            id: 'creator1',
            username: '家政师张阿姨',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangayi',
            role: 'creator',
            followerCount: 5000,
            followingCount: 100,
            rating: 4.9,
            verified: true,
            createdAt: new Date().toISOString(),
          },
        },
        {
          id: 'trace4',
          orderId: id || '1',
          type: 'deposit',
          content: '定金¥200已支付，平台托管',
          operatorId: 'user1',
          createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
          operator: {
            id: 'user1',
            username: '王先生',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
            role: 'user',
            followerCount: 0,
            followingCount: 0,
            rating: 0,
            verified: false,
            createdAt: new Date().toISOString(),
          },
        },
        {
          id: 'trace5',
          orderId: id || '1',
          type: 'start',
          content: '家政师已GPS签到，服务开始',
          operatorId: 'creator1',
          createdAt: new Date(Date.now() - 4 * 86400000 + 9 * 3600000 + 2 * 60000).toISOString(),
          operator: {
            id: 'creator1',
            username: '家政师张阿姨',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangayi',
            role: 'creator',
            followerCount: 5000,
            followingCount: 100,
            rating: 4.9,
            verified: true,
            createdAt: new Date().toISOString(),
          },
        },
        {
          id: 'trace6',
          orderId: id || '1',
          type: 'complete',
          content: '服务完成，等待确认',
          operatorId: 'creator1',
          createdAt: new Date(Date.now() - 4 * 86400000 + 13 * 3600000 + 15 * 60000).toISOString(),
          operator: {
            id: 'creator1',
            username: '家政师张阿姨',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangayi',
            role: 'creator',
            followerCount: 5000,
            followingCount: 100,
            rating: 4.9,
            verified: true,
            createdAt: new Date().toISOString(),
          },
        },
      ]);
      setReview({
        id: 'review1',
        orderId: id || '1',
        userId: 'user1',
        rating: 5,
        content: '张阿姨非常专业！厨房的油污清理得干干净净，连我自己都没注意到的死角都清洁到了。窗户擦得特别透亮，地板打蜡后焕然一新。态度也特别好，全程没有一句怨言。强烈推荐！下次还会找张阿姨。',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        tags: ['清洁到位', '准时到达', '态度友好', '专业细致'],
        images: [
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop',
        ],
        user: {
          id: 'user1',
          username: '王先生',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
          role: 'user',
          followerCount: 0,
          followingCount: 0,
          rating: 4.8,
          verified: true,
          createdAt: new Date().toISOString(),
        },
      } as any);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!isAuthenticated || !id) return;

    if (action === 'dispute') {
      setShowDisputeModal(true);
      return;
    }

    setActionLoading(action);
    try {
      switch (action) {
        case 'accept':
          await api.orders.accept(id);
          break;
        case 'confirm':
          await api.orders.confirm(id);
          break;
        case 'payDeposit':
          await api.orders.payDeposit(id);
          break;
        case 'start':
          await api.orders.start(id);
          break;
        case 'complete':
          await api.orders.complete(id);
          break;
      }
      alert('操作成功！');
      loadOrderData();
    } catch (error: any) {
      alert(error.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    setActionLoading('review');
    try {
      await api.orders.addReview(id, reviewRating, reviewContent);
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewContent('');
      loadOrderData();
    } catch (error: any) {
      alert(error.message || '评价失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitDispute = async () => {
    if (!id || !disputeReason) return;
    setActionLoading('dispute');
    try {
      const fullReason = disputeDescription
        ? `${disputeReason} - ${disputeDescription}`
        : disputeReason;
      await api.orders.dispute(id, fullReason);
      alert('争议已提交，平台将在24小时内介入处理');
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeDescription('');
      loadOrderData();
    } catch (error: any) {
      alert(error.message || '提交失败');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Empty />
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.published;
  const isRequester = user?.id === order.requesterId;
  const isCreator = user?.id === order.creatorId;

  const getAvailableActions = () => {
    const actions: { key: string; label: string; primary?: boolean; danger?: boolean }[] = [];

    if (order.status === 'published' && isCreator) {
      actions.push({ key: 'accept', label: '接单', primary: true });
    }
    if (order.status === 'matched' && isRequester) {
      actions.push({ key: 'confirm', label: '确认订单', primary: true });
    }
    if (order.status === 'confirmed' && isRequester) {
      actions.push({ key: 'payDeposit', label: `支付定金 ¥${order.deposit}`, primary: true });
    }
    if (order.status === 'deposit_paid' && isCreator) {
      actions.push({ key: 'start', label: '开始服务', primary: true });
    }
    if (order.status === 'in_progress' && (isRequester || isCreator)) {
      actions.push({ key: 'complete', label: '完成服务', primary: true });
    }
    if (order.status !== 'cancelled' && order.status !== 'disputed' && order.status !== 'completed' && (isRequester || isCreator)) {
      actions.push({ key: 'dispute', label: '申请仲裁', danger: true });
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 mb-6 transition-colors"
        >
          ← 返回
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 animate-fade-in-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${status.color}`}>{status.label}</span>
                    {order.category && (
                      <span className="badge bg-zinc-100 text-zinc-600">{order.category}</span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-zinc-900">{order.title}</h1>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">¥{order.price}</div>
                  <div className="text-sm text-zinc-500">定金 ¥{order.deposit}</div>
                </div>
              </div>

              {order.description && (
                <p className="text-zinc-600 mb-6 leading-relaxed">{order.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">服务地点</div>
                    <div className="font-medium text-zinc-900">{order.location || '待确认'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">服务时长</div>
                    <div className="font-medium text-zinc-900">{order.duration} 分钟</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">服务时间</div>
                    <div className="font-medium text-zinc-900">{order.serviceTime || '待确认'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">服务保障</div>
                    <div className="font-medium text-zinc-900">{order.insurancePolicy || '平台保障'}</div>
                  </div>
                </div>
              </div>

              {order.requirements && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-800 mb-1">服务要求</div>
                      <p className="text-sm text-amber-700">{order.requirements}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card p-6 animate-fade-in-up-delay-1">
              <h2 className="text-xl font-semibold text-zinc-900 mb-6">服务留痕时间线</h2>

              {status.step >= 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    {timelineLabels.map((label, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                            index <= status.step
                              ? 'bg-primary-500 text-white'
                              : 'bg-zinc-200 text-zinc-500'
                          }`}
                        >
                          {index <= status.step ? <CheckCircle className="w-5 h-5" /> : index + 1}
                        </div>
                        <span
                          className={`text-xs text-center ${
                            index <= status.step ? 'text-primary-600 font-medium' : 'text-zinc-400'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="relative h-1 bg-zinc-200 rounded-full">
                    <div
                      className="absolute left-0 top-0 h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${(status.step / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {traces.map((trace, index) => (
                  <div key={trace.id} className="flex gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        {trace.type === 'message' ? (
                          <MessageSquare className="w-5 h-5 text-zinc-500" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {index < traces.length - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-zinc-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-zinc-900">
                          {traceTypeLabels[trace.type] || trace.type}
                        </span>
                        {trace.operator && (
                          <span className="text-sm text-zinc-500">
                            by {trace.operator.username}
                          </span>
                        )}
                      </div>
                      {trace.content && (
                        <p className="text-zinc-600 mb-1">{trace.content}</p>
                      )}
                      <div className="text-xs text-zinc-400">
                        {new Date(trace.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 animate-fade-in-up-delay-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">预约留痕</h2>
                    <p className="text-sm text-zinc-500">完整服务履约记录</p>
                  </div>
                </div>
                <button
                  onClick={() => alert('留痕记录已导出，文件将发送至您的邮箱')}
                  className="px-4 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出留痕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-zinc-50 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">预约编号</div>
                    <div className="font-mono font-medium text-zinc-900">{(order as any).bookingNo || 'BK' + order.id?.toUpperCase()}</div>
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">联系电话</div>
                    <div className="font-medium text-zinc-900">{(order as any).contactPhone || '138****8888'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-zinc-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-zinc-900">服务地址</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          (order as any).gpsDistance && (order as any).gpsDistance < 0.2
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          <Navigation className="w-3 h-3" />
                          GPS已验证
                        </span>
                      </div>
                      <p className="text-zinc-700 mb-2">{order.location}</p>
                      {(order as any).gpsDistance && (
                        <div className="text-xs text-zinc-500 flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          签到时GPS定位距离目标地址 {(order as any).gpsDistance * 1000} 米，地址核验通过
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-zinc-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-zinc-500">预约服务时间</span>
                    </div>
                    <div className="font-medium text-zinc-900">{order.serviceTime}</div>
                  </div>
                  <div className="p-4 border border-green-200 rounded-xl bg-green-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">签到时间</span>
                    </div>
                    <div className="font-medium text-zinc-900">
                      {(order as any).checkInTime ? new Date((order as any).checkInTime).toLocaleString() : '2024-06-10 09:02:15'}
                    </div>
                  </div>
                  <div className="p-4 border border-red-200 rounded-xl bg-red-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">签出时间</span>
                    </div>
                    <div className="font-medium text-zinc-900">
                      {(order as any).checkOutTime ? new Date((order as any).checkOutTime).toLocaleString() : '2024-06-10 13:15:42'}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-accent-50 to-primary-50 rounded-xl border border-accent-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                        <Timer className="w-5 h-5 text-accent-600" />
                      </div>
                      <div>
                        <div className="text-sm text-zinc-500">实际服务时长</div>
                        <div className="text-2xl font-bold text-zinc-900">
                          {Math.floor(((order as any).actualDuration || 253) / 60)}小时{((order as any).actualDuration || 253) % 60}分钟
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-500 mb-1">对比预约时长</div>
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        +{((order as any).actualDuration || 253) - (order.duration || 240)} 分钟
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 animate-fade-in-up-delay-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">沟通记录 / 履约聊天</h2>
                    <p className="text-sm text-zinc-500">双向沟通消息已加密留痕</p>
                  </div>
                </div>
                <button
                  onClick={() => alert('聊天记录已导出为PDF文件')}
                  className="px-4 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  导出聊天
                </button>
              </div>

              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-fade-in ${
                      msg.role === 'requester' ? 'flex-row' : 'flex-row-reverse'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    <div className={`max-w-[75%] ${msg.role === 'requester' ? '' : 'items-end'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${msg.role === 'creator' ? 'justify-end' : ''}`}>
                        <span className="text-sm font-medium text-zinc-700">{msg.senderName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          msg.role === 'requester'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          {msg.role === 'requester' ? '需求方' : '服务方'}
                        </span>
                        <span className="text-xs text-zinc-400">{msg.time}</span>
                      </div>
                      {msg.type === 'text' && (
                        <div className={`p-3 rounded-2xl ${
                          msg.role === 'requester'
                            ? 'bg-blue-50 text-zinc-800 rounded-tl-sm'
                            : 'bg-zinc-100 text-zinc-800 rounded-tr-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      )}
                      {msg.type === 'image' && (
                        <div className={`space-y-2 ${msg.role === 'creator' ? 'flex flex-col items-end' : ''}`}>
                          <div className="overflow-hidden rounded-xl border border-zinc-200 max-w-xs">
                            <img
                              src={msg.content}
                              alt={msg.caption || '图片消息'}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                          {msg.caption && (
                            <p className="text-xs text-zinc-500 px-2">{msg.caption}</p>
                          )}
                        </div>
                      )}
                      {msg.type === 'file' && (
                        <div className={`flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white max-w-sm ${
                          msg.role === 'creator' ? 'justify-end' : ''
                        }`}>
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                            <File className="w-5 h-5 text-zinc-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-800 truncate">{msg.content}</div>
                            <div className="text-xs text-zinc-500">{msg.fileSize}</div>
                          </div>
                          <button className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors flex-shrink-0">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.status === 'completed' && (
              <div className="card p-6 animate-fade-in-up-delay-2">
                <h2 className="text-xl font-semibold text-zinc-900 mb-6">双向评价</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">需</div>
                        <span className="font-medium text-blue-800">需求方对服务方评价</span>
                      </div>
                      {review ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          已完成
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">待评价</span>
                      )}
                    </div>
                    <div className="p-4">
                      {review ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={review.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`}
                              alt={review.user?.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-zinc-900">{review.user?.username || '用户'}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= review.rating ? 'text-amber-500' : 'text-zinc-200'}`}
                                    fill="currentColor"
                                  />
                                ))}
                                <span className="ml-1 text-sm text-zinc-500">{review.rating}.0</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-zinc-700 text-sm leading-relaxed">{review.content}</p>
                          {(review as any).tags && (review as any).tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {(review as any).tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {(review as any).images && (review as any).images.length > 0 && (
                            <div>
                              <div className="text-xs text-zinc-500 mb-2">图片凭证</div>
                              <div className="grid grid-cols-2 gap-2">
                                {(review as any).images.map((img: string, idx: number) => (
                                  <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-zinc-200">
                                    <img src={img} alt={`凭证${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100">
                            评价时间：{new Date(review.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ) : isRequester ? (
                        showReviewForm ? (
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">服务评分</div>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    className="focus:outline-none"
                                    onClick={() => setReviewRating(star)}
                                  >
                                    <Star
                                      className={`w-7 h-7 transition-transform hover:scale-110 ${
                                        star <= reviewRating ? 'text-amber-500' : 'text-zinc-200'
                                      }`}
                                      fill="currentColor"
                                    />
                                  </button>
                                ))}
                                <span className="ml-2 text-sm text-zinc-500">{reviewRating}.0 分</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">评价内容</div>
                              <textarea
                                value={reviewContent}
                                onChange={(e) => setReviewContent(e.target.value)}
                                placeholder="分享您的服务体验，帮助其他用户选择..."
                                className="input-field"
                                rows={4}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">上传图片凭证（可选）</div>
                              <div className="grid grid-cols-4 gap-2">
                                {reviewImages.map((img, idx) => (
                                  <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-zinc-200 relative">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== idx))}
                                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                {reviewImages.length < 4 && (
                                  <button
                                    onClick={() => alert('模拟选择图片上传')}
                                    className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 hover:border-primary-300 hover:bg-primary-50 flex flex-col items-center justify-center text-zinc-400 hover:text-primary-500 transition-colors"
                                  >
                                    <Image className="w-6 h-6 mb-1" />
                                    <span className="text-xs">添加</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button
                                className="btn-primary flex-1"
                                onClick={handleSubmitReview}
                                disabled={actionLoading === 'review'}
                              >
                                {actionLoading === 'review' ? <LoadingSpinner size="sm" /> : '提交评价'}
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() => setShowReviewForm(false)}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-colors flex flex-col items-center gap-2"
                            onClick={() => setShowReviewForm(true)}
                          >
                            <Star className="w-8 h-8" />
                            <span className="font-medium">立即评价</span>
                            <span className="text-xs">评价后可提升您的信用等级</span>
                          </button>
                        )
                      ) : (
                        <div className="py-10 text-center">
                          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-8 h-8 text-zinc-400" />
                          </div>
                          <p className="text-zinc-500 text-sm">等待需求方完成评价</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">服</div>
                        <span className="font-medium text-orange-800">服务方对需求方评价</span>
                      </div>
                      {creatorReviewSubmitted || creatorReview ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          已完成
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">待评价</span>
                      )}
                    </div>
                    <div className="p-4">
                      {creatorReviewSubmitted || creatorReview ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={creatorReview.user.avatar}
                              alt={creatorReview.user.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-zinc-900">{creatorReview.user.username}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= creatorReview.rating ? 'text-amber-500' : 'text-zinc-200'}`}
                                    fill="currentColor"
                                  />
                                ))}
                                <span className="ml-1 text-sm text-zinc-500">{creatorReview.rating}.0</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-zinc-700 text-sm leading-relaxed">{creatorReview.content}</p>
                          {creatorReview.tags && creatorReview.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {creatorReview.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100">
                            评价时间：{new Date(creatorReview.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ) : isCreator ? (
                        showCreatorReviewForm ? (
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">需求方评分</div>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    className="focus:outline-none"
                                    onClick={() => setCreatorReviewRating(star)}
                                  >
                                    <Star
                                      className={`w-7 h-7 transition-transform hover:scale-110 ${
                                        star <= creatorReviewRating ? 'text-amber-500' : 'text-zinc-200'
                                      }`}
                                      fill="currentColor"
                                    />
                                  </button>
                                ))}
                                <span className="ml-2 text-sm text-zinc-500">{creatorReviewRating}.0 分</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">评价内容</div>
                              <textarea
                                value={creatorReviewContent}
                                onChange={(e) => setCreatorReviewContent(e.target.value)}
                                placeholder="评价本次合作体验..."
                                className="input-field"
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-3">
                              <button
                                className="btn-primary flex-1"
                                onClick={() => {
                                  setCreatorReviewSubmitted(true);
                                  setShowCreatorReviewForm(false);
                                  alert('评价提交成功！');
                                }}
                              >
                                提交评价
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() => setShowCreatorReviewForm(false)}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50 transition-colors flex flex-col items-center gap-2"
                            onClick={() => setShowCreatorReviewForm(true)}
                          >
                            <Star className="w-8 h-8" />
                            <span className="font-medium">立即评价</span>
                            <span className="text-xs">评价将影响需求方信用分</span>
                          </button>
                        )
                      ) : (
                        <div className="py-10 text-center">
                          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-8 h-8 text-zinc-400" />
                          </div>
                          <p className="text-zinc-500 text-sm">等待服务方完成评价</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.status === 'completed' && (
              <div className="card p-6 animate-fade-in-up-delay-3">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">服务复查记录</h2>
                    <p className="text-sm text-zinc-500">平台品质保障追踪</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviewRecords.map((record, index) => (
                    <div
                      key={record.id}
                      className="flex gap-4 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          record.resultType === 'pass'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}>
                          {record.resultType === 'pass' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <ThumbsDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        {index < reviewRecords.length - 1 && (
                          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-zinc-200" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-zinc-900">{record.type}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                record.resultType === 'pass'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {record.result}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-600 leading-relaxed">{record.detail}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {record.reviewer}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {record.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-green-800">全流程复查通过</div>
                    <div className="text-xs text-green-600">本订单服务品质保障已完成，可申请评价抽样奖励</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6 animate-fade-in-up-delay-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">支付信息</h3>
                {order.status === 'completed' && (
                  <button
                    onClick={() => setShowSettlementDetail(!showSettlementDetail)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    分账明细
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-500">服务费用</span>
                  <span className="font-medium">¥{order.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">定金（已付）</span>
                  <span className="font-medium text-green-600">¥{order.deposit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">尾款</span>
                  <span className="font-medium">¥{order.price - order.deposit}</span>
                </div>

                {showSettlementDetail && order.status === 'completed' && (
                  <div className="mt-4 p-4 bg-zinc-50 rounded-xl space-y-3 animate-fade-in">
                    <div className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                      <PiggyBank className="w-4 h-4 text-primary-500" />
                      资金分账明细
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">订单总金额</span>
                      <span className="font-medium">¥{order.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">平台服务费 (15%)</span>
                      <span className="text-red-500">-¥{(order.price * 0.15).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">创作者实际收入</span>
                      <span className="font-medium text-green-600">¥{(order.price * 0.85).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-zinc-200 my-2" />
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>结算状态</span>
                      <span className="text-green-500">已结算</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>结算时间</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>交易单号</span>
                      <span className="font-mono">TXN{order.id?.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                )}

                <div className="h-px bg-zinc-200 my-2" />
                <div className="flex justify-between">
                  <span className="text-zinc-500">平台服务费</span>
                  <span className="font-medium text-green-600">15%抽佣</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">服务保障</span>
                  <span className="font-medium text-green-600">已包含</span>
                </div>
              </div>
            </div>

            <div className="card p-6 animate-fade-in-up-delay-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-200/30 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">平台基础保障</h3>
                    <p className="text-xs text-zinc-500">全订单默认享有</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-zinc-700">定金资金托管</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-zinc-700">服务过程留痕</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-zinc-700">争议仲裁机制</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/guarantee')}
                  className="w-full mt-4 py-2.5 text-sm text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors flex items-center justify-center gap-1"
                >
                  了解平台保障
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {order.category === '家政' || order.category === '护理' || (order as any).insuranceRequired ? (
              <div className="card p-6 animate-fade-in-up-delay-2 border-2 border-blue-200 overflow-hidden relative bg-gradient-to-br from-blue-50/50 to-transparent">
                <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-bl-xl">
                  强制投保
                </div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">家政服务责任险</h3>
                    <p className="text-xs text-zinc-500">保单已生效 · 全程保障</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-blue-100">
                      <div className="text-xs text-zinc-500 mb-1">保单号</div>
                      <div className="font-mono text-xs font-medium text-zinc-800 break-all">{insuranceInfo.policyNo}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-blue-100">
                      <div className="text-xs text-zinc-500 mb-1">保费</div>
                      <div className="font-semibold text-blue-600">¥{insuranceInfo.premium}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-zinc-500">承保公司</span>
                    </div>
                    <div className="font-medium text-zinc-900">{insuranceInfo.company}</div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white">
                    <div className="text-xs text-blue-100 mb-1">累计保额</div>
                    <div className="text-3xl font-bold">
                      ¥{(insuranceInfo.coverage / 10000).toFixed(0)}万
                    </div>
                    <div className="text-xs text-blue-100 mt-1">人身伤害 + 财产损失 双重保障</div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-zinc-700 mb-2">保障范围</div>
                    <div className="space-y-2">
                      {insuranceInfo.range.map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="text-sm text-zinc-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => alert('保单详情页（模拟跳转）')}
                    className="w-full py-2.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    查看完整保单
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-6 animate-fade-in-up-delay-2 border-2 border-dashed border-zinc-200 overflow-hidden relative">
                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-bl-xl">
                  可选升级
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">升级服务保障</h3>
                    <p className="text-xs text-zinc-500">最高50万保额 安心无忧</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm text-zinc-700">第三者财产损失保障</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm text-zinc-700">服务人员意外伤害</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm text-zinc-700">服务过失责任保障</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-zinc-500">升级保费</div>
                    <div className="text-lg font-bold text-amber-600">¥12.00</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">累计保额</div>
                    <div className="text-lg font-bold text-zinc-800">50万</div>
                  </div>
                </div>

                <button
                  onClick={() => alert('保险升级（模拟购买）')}
                  className="w-full py-2.5 text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Shield className="w-4 h-4" />
                  一键升级保障
                </button>
              </div>
            )}

            {order.requester && (
              <div className="card p-6 animate-fade-in-up-delay-2">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">需求方信息</h3>
                <div
                  className="flex items-center gap-4 mb-4 cursor-pointer"
                  onClick={() => navigate(`/users/${order.requesterId}`)}
                >
                  <img
                    src={order.requester.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.requesterId}`}
                    alt={order.requester.username}
                    className="w-14 h-14 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-zinc-900">{order.requester.username}</span>
                      {order.requester.verified && (
                        <span className="w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                      <User className="w-3 h-3" />
                      需求方
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                    <span>{order.requester.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
              </div>
            )}

            {order.creator && (
              <div className="card p-6 animate-fade-in-up-delay-3">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">服务方信息</h3>
                <div
                  className="flex items-center gap-4 mb-4 cursor-pointer"
                  onClick={() => navigate(`/creator/${order.creatorId}`)}
                >
                  <img
                    src={order.creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.creatorId}`}
                    alt={order.creator.username}
                    className="w-14 h-14 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-zinc-900">{order.creator.username}</span>
                      {order.creator.verified && (
                        <span className="w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                      <User className="w-3 h-3" />
                      创作者
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                    <span>{order.creator.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="w-px h-4 bg-zinc-200" />
                  <div className="text-sm text-zinc-500">
                    {order.creator.followerCount} 粉丝
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {availableActions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-zinc-200 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'disputed' && (
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    申请仲裁
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button className="btn-secondary">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  联系对方
                </button>
                {availableActions.filter(a => a.key !== 'dispute').map((action) => (
                  <button
                    key={action.key}
                    className={action.primary ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => handleAction(action.key)}
                    disabled={actionLoading === action.key}
                  >
                    {actionLoading === action.key ? <LoadingSpinner size="sm" /> : action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Scale className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">申请争议仲裁</h2>
                    <p className="text-sm text-zinc-500">平台将在24小时内介入处理</p>
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

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">仲裁须知</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 请如实描述争议原因，平台将根据服务留痕记录判定</li>
                      <li>• 仲裁期间订单资金将被冻结，待判定结果后结算</li>
                      <li>• 恶意申诉将影响您的平台信用评级</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-3">
                  争议原因 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {disputeReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setDisputeReason(reason)}
                      className={cn(
                        'w-full p-3 rounded-xl text-left text-sm transition-all border-2',
                        disputeReason === reason
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
                      )}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  详细描述
                </label>
                <textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="请详细描述争议情况，包括时间、经过、诉求等..."
                  rows={4}
                  className="input-field resize-none"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  建议上传相关凭证，便于平台更快判定
                </p>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl">
                <div className="text-sm font-medium text-zinc-700 mb-2">涉及金额</div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">订单金额</span>
                  <span className="font-bold text-primary-600">¥{order?.price || 0}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-zinc-500">已付定金</span>
                  <span className="text-green-600">¥{order?.deposit || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-6 py-2.5 rounded-xl font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                取消
              </button>
              <Button
                variant="primary"
                onClick={handleSubmitDispute}
                isLoading={actionLoading === 'dispute'}
                disabled={!disputeReason}
                className="bg-red-500 hover:bg-red-600"
              >
                提交仲裁申请
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
