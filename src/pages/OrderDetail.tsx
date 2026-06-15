import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Calendar, Shield, Star, CheckCircle, AlertCircle, MessageSquare, User, ChevronRight, FileText, Scale, AlertTriangle, Receipt, PiggyBank, ArrowRight, X } from 'lucide-react';
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
        title: '寻找专业街舞老师进行一对一私教',
        description: '想学习街舞基础，每周2次，每次1.5小时，希望老师有耐心，教学经验丰富。可以上门或者去老师的工作室。',
        category: '舞蹈',
        price: 300,
        deposit: 100,
        location: '北京市朝阳区三里屯SOHO',
        serviceTime: '每周六、日上午10:00-11:30',
        duration: 90,
        status: 'published',
        insurancePolicy: '平台服务保障',
        requirements: '需要老师有3年以上教学经验，有相关资质证书优先。',
        createdAt: new Date().toISOString(),
        requester: {
          id: 'user1',
          username: '街舞爱好者',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
          role: 'user',
          followerCount: 0,
          followingCount: 0,
          rating: 4.8,
          verified: true,
          createdAt: new Date().toISOString(),
        },
        creator: {
          id: 'creator1',
          username: '舞蹈老师李明',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator1',
          role: 'creator',
          followerCount: 5000,
          followingCount: 100,
          rating: 4.9,
          verified: true,
          createdAt: new Date().toISOString(),
        },
      });
      setTraces([
        {
          id: 'trace1',
          orderId: id || '1',
          type: 'create',
          content: '订单已创建，等待创作者接单',
          operatorId: 'user1',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          operator: {
            id: 'user1',
            username: '街舞爱好者',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
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
          content: '系统为您匹配了3位符合条件的创作者',
          createdAt: new Date(Date.now() - 82800000).toISOString(),
        },
      ]);
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

            {order.status === 'completed' && (
              <div className="card p-6 animate-fade-in-up-delay-2">
                <h2 className="text-xl font-semibold text-zinc-900 mb-4">服务评价</h2>

                {review ? (
                  <div className="flex gap-4 p-4 bg-zinc-50 rounded-xl">
                    <img
                      src={review.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`}
                      alt={review.user?.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-zinc-900">{review.user?.username || '用户'}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-amber-500' : 'text-zinc-200'}`}
                              fill="currentColor"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-zinc-600">{review.content}</p>
                      <div className="text-xs text-zinc-400 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ) : isRequester ? (
                  showReviewForm ? (
                    <div className="p-4 bg-zinc-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-zinc-600">评分：</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className="focus:outline-none"
                            onClick={() => setReviewRating(star)}
                          >
                            <Star
                              className={`w-6 h-6 transition-transform hover:scale-110 ${
                                star <= reviewRating ? 'text-amber-500' : 'text-zinc-200'
                              }`}
                              fill="currentColor"
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="分享你的服务体验..."
                        className="input-field mb-3"
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <button
                          className="btn-primary"
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
                      className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-500 hover:border-primary-300 hover:text-primary-600 transition-colors"
                      onClick={() => setShowReviewForm(true)}
                    >
                      <Star className="w-5 h-5 inline mr-2" />
                      发表评价
                    </button>
                  )
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    等待需求方评价
                  </div>
                )}
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
                    <h3 className="text-lg font-semibold text-zinc-900">服务保障</h3>
                    <p className="text-xs text-zinc-500">平台全程托管保障</p>
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
                  {order.category === '家政' || (order as any).insuranceRequired ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-zinc-700">服务责任险（强制投保）</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-sm text-zinc-500">可选保险升级</span>
                    </div>
                  )}
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
