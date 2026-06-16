import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Calendar, Shield, Star, CheckCircle, AlertCircle, MessageSquare, User, ChevronRight, FileText, Scale, AlertTriangle, Receipt, PiggyBank, ArrowRight, X, Phone, Download, Image, File, Tag, ClipboardCheck, Timer, Navigation, Building2, Hash, ThumbsUp, ThumbsDown, Send, CircleCheck, Landmark, Wallet, CreditCard, CheckSquare, Eye, FileCheck, Award, BadgeCheck } from 'lucide-react';
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
  arbitrated: { label: '已仲裁', color: 'status-disputed', step: -1 },
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

const categories = ['家政', '保洁', '搬家', '维修', '护理', '育婴', '宠物照料', '上门烹饪'];
const titles = [
  '深度保洁服务（三居室）',
  '日常家庭保洁',
  '搬家搬运服务',
  '家电维修服务',
  '老人护理服务',
  '育婴师住家服务',
  '宠物上门喂养',
  '上门烹饪私厨',
];
const locations = [
  '北京市海淀区中关村大街1号院5号楼1单元1802',
  '北京市朝阳区建国路88号院3号楼2单元501',
  '上海市浦东新区陆家嘴环路1000号12栋3单元201',
  '广州市天河区珠江新城华夏路10号8栋1单元1503',
  '深圳市南山区科技园南区科苑路1号6栋2单元802',
];

function generateMockOrder(orderId: string): any {
  const hash = orderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const catIndex = hash % categories.length;
  const locIndex = (hash * 3) % locations.length;
  const statuses = ['published', 'matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'];
  const statusIndex = (hash * 7) % statuses.length;
  const priceBase = [200, 350, 500, 680, 800, 1200, 150, 400];
  const price = priceBase[catIndex] + (hash % 100);
  const deposit = Math.floor(price * 0.3);
  const durationBase = [120, 180, 240, 300, 360, 480, 60, 240];
  const duration = durationBase[catIndex];

  const daysAgo = (hash % 14) + 1;
  const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
  const serviceDate = new Date(Date.now() - (daysAgo - 2) * 86400000);
  const serviceTime = `${serviceDate.getFullYear()}年${serviceDate.getMonth() + 1}月${serviceDate.getDate()}日 上午9:00-${9 + Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;

  return {
    id: orderId,
    requesterId: 'user1',
    title: titles[catIndex],
    description: `专业${categories[catIndex]}服务，经验丰富，品质保障。`,
    category: categories[catIndex],
    price,
    deposit,
    location: locations[locIndex],
    serviceTime,
    duration,
    status: statuses[statusIndex],
    insurancePolicy: categories[catIndex] === '家政' || categories[catIndex] === '护理' ? '家政服务责任险（强制投保）' : '平台基础保障',
    requirements: '需要携带专业设备，服务人员需有相关资质和经验。',
    createdAt,
    requester: {
      id: 'user1',
      username: '王先生',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${orderId}user`,
      role: 'user',
      followerCount: 0,
      followingCount: 0,
      rating: 4.8,
      verified: true,
      createdAt: new Date().toISOString(),
    },
    creator: {
      id: 'creator1',
      username: `服务者李${categories[catIndex]}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${orderId}creator`,
      role: 'creator',
      followerCount: 5000,
      followingCount: 100,
      rating: 4.9,
      verified: true,
      createdAt: new Date().toISOString(),
    },
    contactPhone: '138****5678',
    bookingNo: 'BK' + orderId.toUpperCase().slice(0, 10),
    checkInTime: statuses.indexOf(statuses[statusIndex]) >= 4 ? new Date(Date.now() - (daysAgo - 2) * 86400000 + 9 * 3600000).toISOString() : null,
    checkOutTime: statuses.indexOf(statuses[statusIndex]) >= 5 ? new Date(Date.now() - (daysAgo - 2) * 86400000 + 13 * 3600000).toISOString() : null,
    actualDuration: statuses.indexOf(statuses[statusIndex]) >= 5 ? duration + 13 : null,
    gpsDistance: 0.08,
  };
}

function generateMockTraces(orderId: string, status: string): any[] {
  const hash = orderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const daysAgo = (hash % 14) + 1;
  const baseTime = Date.now() - daysAgo * 86400000;

  const allTraces = [
    { type: 'create', content: '订单已创建', timeOffset: 0, hasOperator: true, role: 'user' },
    { type: 'match', content: '系统匹配了多位符合条件的服务者', timeOffset: 3600000, hasOperator: false },
    { type: 'confirm', content: '服务者已接单，双方确认服务时间', timeOffset: 7200000, hasOperator: true, role: 'creator' },
    { type: 'deposit', content: '定金已支付，平台托管', timeOffset: 86400000, hasOperator: true, role: 'user' },
    { type: 'start', content: '服务者已签到，服务开始', timeOffset: 2 * 86400000 + 9 * 3600000, hasOperator: true, role: 'creator' },
    { type: 'complete', content: '服务完成，等待确认', timeOffset: 2 * 86400000 + 13 * 3600000, hasOperator: true, role: 'creator' },
  ];

  const statusIndex = ['published', 'matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'].indexOf(status);
  const selectedTraces = allTraces.slice(0, statusIndex + 1 < 1 ? 1 : statusIndex + 1);

  return selectedTraces.map((trace, index) => ({
    id: `trace${index + 1}`,
    orderId,
    type: trace.type,
    content: trace.content,
    operatorId: trace.hasOperator ? (trace.role === 'user' ? 'user1' : 'creator1') : undefined,
    createdAt: new Date(baseTime + trace.timeOffset).toISOString(),
    operator: trace.hasOperator ? {
      id: trace.role === 'user' ? 'user1' : 'creator1',
      username: trace.role === 'user' ? '王先生' : `服务者李`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${orderId}${trace.role}`,
      role: trace.role === 'user' ? 'user' : 'creator',
      followerCount: trace.role === 'creator' ? 5000 : 0,
      followingCount: 100,
      rating: trace.role === 'creator' ? 4.9 : 4.8,
      verified: true,
      createdAt: new Date().toISOString(),
    } : undefined,
  }));
}

function generateMockReview(orderId: string): any {
  return {
    id: 'review1',
    orderId,
    userId: 'user1',
    rating: 5,
    content: '服务非常专业！效果超出预期，工作人员态度也特别好，全程沟通顺畅。强烈推荐！下次还会选择。',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    tags: ['专业细致', '准时到达', '态度友好', '服务周到'],
    images: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop',
    ],
    user: {
      id: 'user1',
      username: '王先生',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${orderId}user`,
      role: 'user',
      followerCount: 0,
      followingCount: 0,
      rating: 4.8,
      verified: true,
      createdAt: new Date().toISOString(),
    },
  };
}

function generateChatMessages(orderId: string, category: string): any[] {
  const requesterName = '王先生';
  const creatorName = `服务者李${category}`;
  const requesterAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${orderId}user`;
  const creatorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${orderId}creator`;

  return [
    {
      id: 'msg1',
      sender: 'user1',
      senderName: requesterName,
      senderAvatar: requesterAvatar,
      type: 'text',
      content: `您好，我想确认一下明天的${category}服务，时间是上午9点对吗？`,
      time: '2024-06-09 20:15',
      role: 'requester',
    },
    {
      id: 'msg2',
      sender: 'creator1',
      senderName: creatorName,
      senderAvatar: creatorAvatar,
      type: 'text',
      content: '您好！是的，明天上午9点准时到。请问家里有停车位吗？需要特别注意的地方可以提前跟我说一下。',
      time: '2024-06-09 20:22',
      role: 'creator',
    },
    {
      id: 'msg3',
      sender: 'user1',
      senderName: requesterName,
      senderAvatar: requesterAvatar,
      type: 'image',
      content: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      time: '2024-06-09 20:25',
      role: 'requester',
      caption: '这是现场情况，麻烦重点处理一下',
    },
    {
      id: 'msg4',
      sender: 'creator1',
      senderName: creatorName,
      senderAvatar: creatorAvatar,
      type: 'text',
      content: '收到！看图片情况我会多带一套专业设备过去。另外我把我的资质证书发给您确认。',
      time: '2024-06-09 20:30',
      role: 'creator',
    },
    {
      id: 'msg5',
      sender: 'creator1',
      senderName: creatorName,
      senderAvatar: creatorAvatar,
      type: 'file',
      content: '服务资质证书.pdf',
      fileSize: '2.3 MB',
      time: '2024-06-09 20:31',
      role: 'creator',
    },
    {
      id: 'msg6',
      sender: 'user1',
      senderName: requesterName,
      senderAvatar: requesterAvatar,
      type: 'text',
      content: '太好了，谢谢您！另外小区地下车库可以临时停车，我到时帮您登记。明天见！',
      time: '2024-06-09 20:35',
      role: 'requester',
    },
    {
      id: 'msg7',
      sender: 'creator1',
      senderName: creatorName,
      senderAvatar: creatorAvatar,
      type: 'text',
      content: '好的，明天9点准时到！期待为您服务。',
      time: '2024-06-09 20:36',
      role: 'creator',
    },
  ];
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
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
  const [disputeImages, setDisputeImages] = useState<string[]>([]);
  const [showArbitrationTimeline, setShowArbitrationTimeline] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessagesList, setChatMessagesList] = useState<any[]>([]);
  const [markedMessages, setMarkedMessages] = useState<string[]>([]);
  const [showExportTip, setShowExportTip] = useState(false);
  const [showInsuranceConfirm, setShowInsuranceConfirm] = useState(false);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [creatorReviewTags, setCreatorReviewTags] = useState<string[]>([]);
  const [showReviewSyncTip, setShowReviewSyncTip] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showSettlementDetailModal, setShowSettlementDetailModal] = useState(false);
  const [creatorReviewImages, setCreatorReviewImages] = useState<string[]>([]);
  const [showInsuranceDetailModal, setShowInsuranceDetailModal] = useState(false);
  const [showUpgradeConfirmModal, setShowUpgradeConfirmModal] = useState(false);

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

  const timestamp = Date.now();
  const insuranceInfo = {
    policyNo: `PICC${timestamp}`,
    receiptNo: `RC${timestamp}`,
    company: '中国人民财产保险',
    coverage: 500000,
    premium: 12,
    range: [
      { label: '财产损失', icon: Building2 },
      { label: '人身意外', icon: User },
      { label: '服务过失', icon: FileCheck },
      { label: '盗抢损失', icon: BadgeCheck },
    ],
    period: '服务开始前 2 小时至服务结束后 30 天',
    hasUpgraded: false,
    upgradedCoverage: 1000000,
    upgradePremium: 19.9,
    upgradeItems: ['宠物伤害保障', '钥匙丢失保障', '高空作业保障', '精神损害赔偿'],
  };

  const insuranceDockingSteps = [
    {
      step: 1,
      title: '平台发起投保',
      status: 'done',
      time: new Date(timestamp - 3600000).toLocaleString(),
      icon: Shield,
    },
    {
      step: 2,
      title: '保险公司承保',
      status: 'done',
      time: new Date(timestamp - 1800000).toLocaleString(),
      policyNo: `PICC${timestamp}`,
      icon: FileCheck,
    },
    {
      step: 3,
      title: '保单生效',
      status: 'done',
      time: new Date(timestamp - 600000).toLocaleString(),
      icon: CheckCircle,
    },
  ];

  const upgradeAuditRecord = {
    applied: true,
    content: '基础版 → 升级版（保额从50万→100万，增加宠物伤害/钥匙丢失等）',
    status: '已通过',
    auditor: '平台运营 张主管',
    auditTime: new Date(timestamp - 86400000).toLocaleString(),
    upgradeFee: 19.9,
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

  const arbitrationSteps = [
    { id: 'applied', label: '已申请', icon: FileText, description: '您的仲裁申请已提交' },
    { id: 'accepted', label: '平台受理', icon: ClipboardCheck, description: '平台专员已受理，正在核实情况' },
    { id: 'evidence', label: '双方举证', icon: Image, description: '请双方上传相关凭证' },
    { id: 'verdict', label: '仲裁裁决', icon: Scale, description: '平台根据双方举证作出裁决' },
    { id: 'execution', label: '结果执行', icon: CheckCircle, description: '裁决结果已执行，资金已结算' },
  ];

  const reviewTagOptions = [
    '清洁到位', '准时到达', '态度友好', '专业细致',
    '沟通顺畅', '环境整洁', '准时守约', '爽快结账',
    '价格合理', '超出预期', '服务周到', '值得推荐',
  ];

  const arbitrationTimeline = [
    {
      id: 'step1',
      step: '已申请',
      time: '2024-06-12 10:30',
      handler: '王先生（需求方）',
      description: '提交仲裁申请，原因：服务质量不符合预期',
      completed: true,
    },
    {
      id: 'step2',
      step: '平台受理',
      time: '2024-06-12 11:00',
      handler: '平台专员 李主管',
      description: '已受理您的申请，正在调取服务留痕记录',
      completed: true,
    },
    {
      id: 'step3',
      step: '双方举证',
      time: '进行中',
      handler: '双方当事人',
      description: '请在24小时内上传相关凭证',
      completed: false,
      current: true,
    },
    {
      id: 'step4',
      step: '仲裁裁决',
      time: '预计24小时内',
      handler: '平台仲裁委员会',
      description: '根据双方举证作出公正裁决',
      completed: false,
    },
    {
      id: 'step5',
      step: '结果执行',
      time: '裁决后立即执行',
      handler: '系统自动执行',
      description: '资金结算及信用分调整',
      completed: false,
    },
  ];

  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  useEffect(() => {
    setChatMessagesList(chatMessages);
  }, []);

  const loadOrderData = async () => {
    if (!id) return;
    setLoading(true);
    setShowSkeleton(true);

    const skeletonTimer = setTimeout(() => {
      setShowSkeleton(false);
    }, 500);

    try {
      const [orderRes, tracesRes, reviewRes] = await Promise.all([
        api.orders.getById(id),
        api.orders.getTraces(id),
        api.orders.getReview(id).catch(() => ({ data: null })),
      ]);

      const orderData = (orderRes as any).data;
      setOrder(orderData);
      setTraces((tracesRes as any).data || []);
      setReview((reviewRes as any).data);

      if (orderData) {
        const chatMsgs = generateChatMessages(id, orderData.category || '家政');
        setChatMessagesList(chatMsgs);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      const mockOrder = generateMockOrder(id);
      setOrder(mockOrder);
      setTraces(generateMockTraces(id, mockOrder.status));
      if (mockOrder.status === 'completed') {
        setReview(generateMockReview(id));
      }
      const chatMsgs = generateChatMessages(id, mockOrder.category);
      setChatMessagesList(chatMsgs);
    } finally {
      clearTimeout(skeletonTimer);
      setLoading(false);
      setTimeout(() => setShowSkeleton(false), 300);
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
          handlePayDepositWithInsurance();
          return;
        case 'start':
          await api.orders.start(id);
          break;
        case 'complete':
          await api.orders.complete(id);
          break;
        case 'review':
          setShowReviewForm(true);
          return;
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
      setReviewTags([]);
      setReviewImages([]);
      setShowReviewSyncTip(true);
      setTimeout(() => setShowReviewSyncTip(false), 3000);
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
      setShowDisputeModal(false);
      setShowArbitrationTimeline(true);
      setDisputeReason('');
      setDisputeDescription('');
      setDisputeImages([]);
      alert('仲裁申请已提交，平台将在24小时内介入处理');
      loadOrderData();
    } catch (error: any) {
      alert(error.message || '提交失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = {
      id: 'msg' + Date.now(),
      sender: user?.id || 'user1',
      senderName: user?.username || '王先生',
      senderAvatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      type: 'text',
      content: chatInput,
      time: new Date().toLocaleString(),
      role: 'requester',
    };
    setChatMessagesList([...chatMessagesList, newMsg]);
    setChatInput('');
  };

  const toggleMarkMessage = (msgId: string) => {
    if (markedMessages.includes(msgId)) {
      setMarkedMessages(markedMessages.filter(id => id !== msgId));
    } else {
      setMarkedMessages([...markedMessages, msgId]);
    }
  };

  const handleExportChat = () => {
    setShowExportTip(true);
    setTimeout(() => setShowExportTip(false), 3000);
  };

  const toggleReviewTag = (tag: string) => {
    if (reviewTags.includes(tag)) {
      setReviewTags(reviewTags.filter(t => t !== tag));
    } else {
      setReviewTags([...reviewTags, tag]);
    }
  };

  const toggleCreatorReviewTag = (tag: string) => {
    if (creatorReviewTags.includes(tag)) {
      setCreatorReviewTags(creatorReviewTags.filter(t => t !== tag));
    } else {
      setCreatorReviewTags([...creatorReviewTags, tag]);
    }
  };

  const handlePayDepositWithInsurance = () => {
    if (order?.category === '家政' || order?.category === '护理' || (order as any)?.insuranceRequired) {
      setShowInsuranceConfirm(true);
    } else {
      handleAction('payDeposit');
    }
  };

  const confirmInsuranceAndPay = () => {
    setShowInsuranceConfirm(false);
    handleAction('payDeposit');
  };

  if (loading || showSkeleton) {
    return (
      <div className="min-h-screen bg-zinc-50 pb-32">
        <div className="container mx-auto px-4 py-6">
          <div className="h-5 w-20 bg-zinc-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-16 bg-zinc-200 rounded-full animate-pulse" />
                      <div className="h-6 w-12 bg-zinc-200 rounded-full animate-pulse" />
                    </div>
                    <div className="h-7 w-64 bg-zinc-200 rounded animate-pulse" />
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-8 w-24 bg-zinc-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-zinc-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-4 w-full bg-zinc-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-5/6 bg-zinc-200 rounded animate-pulse mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-xl mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 animate-pulse flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <div className="h-6 w-36 bg-zinc-200 rounded animate-pulse mb-6" />
                <div className="flex items-center justify-between mb-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 animate-pulse mb-2" />
                      <div className="h-3 w-12 bg-zinc-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
                <div className="h-1 w-full bg-zinc-200 rounded-full animate-pulse mb-8" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 animate-pulse flex-shrink-0" />
                      <div className="flex-1 pb-6 space-y-2">
                        <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
                        <div className="h-3 w-full bg-zinc-200 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <div className="h-5 w-24 bg-zinc-200 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-16 bg-zinc-200 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-zinc-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-zinc-200 rounded-xl animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-5 w-24 bg-zinc-200 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 animate-pulse" />
                      <div className="h-4 w-28 bg-zinc-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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
    if (order.status === 'completed' && isRequester && !review) {
      actions.push({ key: 'review', label: '去评价', primary: true });
    }
    if (order.status !== 'cancelled' && order.status !== 'disputed' && order.status !== 'completed' && (isRequester || isCreator)) {
      actions.push({ key: 'dispute', label: '申请仲裁', danger: true });
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <>
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

              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-green-50/50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-800">三方履约状态</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      ['published', 'matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'].includes(order.status)
                        ? 'bg-green-500 text-white'
                        : 'bg-zinc-200 text-zinc-500'
                    }`}>
                      {['published', 'matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'].includes(order.status) ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-zinc-800">需求方</span>
                    <span className={`text-xs mt-1 ${
                      ['published', 'matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'].includes(order.status)
                        ? 'text-green-600'
                        : 'text-zinc-400'
                    }`}>
                      {['published', 'matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'].includes(order.status) ? '✓ 已发布' : '待发布'}
                    </span>
                  </div>

                  <div className={`flex-1 h-0.5 mx-2 ${
                    ['matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'].includes(order.status)
                      ? 'bg-green-400'
                      : 'bg-zinc-200'
                  }`} />

                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      ['matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'].includes(order.status)
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-200 text-zinc-500'
                    }`}>
                      {['matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'].includes(order.status) ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-zinc-800">服务方</span>
                    <span className={`text-xs mt-1 ${
                      ['matched', 'confirmed', 'deposit_paid', 'in_progress', 'completed'].includes(order.status)
                        ? 'text-blue-600'
                        : 'text-zinc-400'
                    }`}>
                      {order.status === 'published' ? '○ 待接单' :
                       order.status === 'matched' ? '✓ 已匹配' :
                       ['confirmed', 'deposit_paid', 'in_progress', 'completed'].includes(order.status) ? '✓ 已接单' : '○ 待接单'}
                    </span>
                  </div>

                  <div className={`flex-1 h-0.5 mx-2 ${
                    ['deposit_paid', 'in_progress', 'completed'].includes(order.status)
                      ? 'bg-blue-400'
                      : 'bg-zinc-200'
                  }`} />

                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      order.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : ['deposit_paid', 'in_progress'].includes(order.status)
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-200 text-zinc-500'
                    }`}>
                      {order.status === 'completed' ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : ['deposit_paid', 'in_progress'].includes(order.status) ? (
                        <Shield className="w-6 h-6" />
                      ) : (
                        <Shield className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-zinc-800">平台</span>
                    <span className={`text-xs mt-1 ${
                      order.status === 'completed'
                        ? 'text-green-600'
                        : ['deposit_paid', 'in_progress'].includes(order.status)
                        ? 'text-blue-600'
                        : 'text-zinc-400'
                    }`}>
                      {order.status === 'completed' ? '✓ 已结算' :
                       ['deposit_paid', 'in_progress'].includes(order.status) ? '○ 资金托管中' :
                       '○ 待托管'}
                    </span>
                  </div>
                </div>
              </div>

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

            {order.status === 'completed' ? (
              <div className="card p-6 animate-fade-in-up-delay-1">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">履约全链路时间线</h2>
                    <p className="text-sm text-zinc-500 mt-1">订单完整履约记录，每一步均可追溯</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    全流程已完成
                  </span>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    {[
                      { label: '需求发布', icon: FileText },
                      { label: '创作者接单', icon: User },
                      { label: '定金支付', icon: CreditCard },
                      { label: '服务进行中', icon: Timer },
                      { label: '服务完成', icon: CheckSquare },
                      { label: '资金结算', icon: Landmark },
                    ].map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center mb-2 shadow-lg shadow-green-500/20">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs text-center text-green-600 font-medium">{step.label}</span>
                          <span className="text-[10px] text-green-500 mt-0.5">✓</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative h-1 bg-green-200 rounded-full">
                    <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  {[
                    {
                      title: '需求发布',
                      description: '订单需求已发布至平台，等待创作者接单',
                      operator: order?.requester?.username || '需求方',
                      operatorRole: 'requester',
                      time: order?.createdAt,
                      icon: FileText,
                      color: 'blue',
                    },
                    {
                      title: '创作者接单',
                      description: `${order?.creator?.username || '创作者'} 已确认接单，双方达成服务意向`,
                      operator: order?.creator?.username || '创作者',
                      operatorRole: 'creator',
                      time: traces?.[2]?.createdAt || new Date(Date.now() - 5 * 86400000).toISOString(),
                      icon: User,
                      color: 'orange',
                    },
                    {
                      title: '定金支付',
                      description: `定金 ¥${order?.deposit || 0} 已支付，由平台第三方托管`,
                      operator: order?.requester?.username || '需求方',
                      operatorRole: 'requester',
                      time: traces?.[3]?.createdAt || new Date(Date.now() - 4 * 86400000).toISOString(),
                      icon: CreditCard,
                      color: 'purple',
                    },
                    {
                      title: '服务进行中',
                      description: `签到：${(order as any)?.checkInTime ? new Date((order as any).checkInTime).toLocaleString() : '---'} ｜ 签出：${(order as any)?.checkOutTime ? new Date((order as any).checkOutTime).toLocaleString() : '---'}`,
                      operator: order?.creator?.username || '创作者',
                      operatorRole: 'creator',
                      time: (order as any)?.checkInTime || traces?.[4]?.createdAt,
                      icon: Timer,
                      color: 'cyan',
                      extra: `实际服务 ${Math.floor(((order as any)?.actualDuration || order?.duration || 240) / 60)}小时${((order as any)?.actualDuration || order?.duration || 240) % 60}分钟`,
                    },
                    {
                      title: '服务完成',
                      description: '双方确认服务完成，服务品质符合约定标准',
                      operator: order?.requester?.username || '需求方',
                      operatorRole: 'requester',
                      time: traces?.[5]?.createdAt || (order as any)?.checkOutTime,
                      icon: CheckSquare,
                      color: 'teal',
                    },
                    {
                      title: '资金结算',
                      description: 'T+1 结算周期已完成，资金已到账创作者账户',
                      operator: '系统自动结算',
                      operatorRole: 'system',
                      time: new Date(Date.now() - 1 * 86400000).toISOString(),
                      icon: Landmark,
                      color: 'green',
                      extra: `创作者实收 ¥${((order?.price || 0) * 0.85).toFixed(2)}`,
                      isLast: true,
                    },
                  ].map((step, index) => {
                    const Icon = step.icon;
                    const colorMap: Record<string, string> = {
                      blue: 'bg-blue-100 text-blue-600',
                      orange: 'bg-orange-100 text-orange-600',
                      purple: 'bg-purple-100 text-purple-600',
                      cyan: 'bg-cyan-100 text-cyan-600',
                      teal: 'bg-teal-100 text-teal-600',
                      green: 'bg-green-100 text-green-600',
                    };
                    return (
                      <div key={index} className="flex gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.08}s` }}>
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full ${colorMap[step.color]} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {!step.isLast && (
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-zinc-200" />
                          )}
                        </div>
                        <div className={`flex-1 ${!step.isLast ? 'pb-6' : ''}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900">{step.title}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                step.operatorRole === 'requester'
                                  ? 'bg-blue-50 text-blue-600'
                                  : step.operatorRole === 'creator'
                                  ? 'bg-orange-50 text-orange-600'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}>
                                {step.operatorRole === 'requester' ? '需求方' : step.operatorRole === 'creator' ? '服务方' : '系统'}
                              </span>
                            </div>
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {step.time ? new Date(step.time).toLocaleString() : '---'}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-600 mb-1">{step.description}</p>
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {step.operator}
                            </span>
                            {step.extra && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-medium">
                                {step.extra}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
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
            )}

            {(order.status === 'disputed' || showArbitrationTimeline) && (
              <div className="card p-6 animate-fade-in-up-delay-1 border-2 border-red-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-900">仲裁进度追踪</h2>
                      <p className="text-sm text-zinc-500">平台将在24小时内响应</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    仲裁中
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    {arbitrationSteps.map((step, index) => {
                      const Icon = step.icon;
                      const isCompleted = index < 2;
                      const isCurrent = index === 2;
                      return (
                        <div key={step.id} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isCurrent
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-zinc-200 text-zinc-500'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <span
                            className={`text-xs text-center font-medium ${
                              isCompleted
                                ? 'text-green-600'
                                : isCurrent
                                ? 'text-red-600'
                                : 'text-zinc-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative h-1 bg-zinc-200 rounded-full">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: '40%' }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {arbitrationTimeline.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.completed
                            ? 'bg-green-100'
                            : item.current
                            ? 'bg-red-100'
                            : 'bg-zinc-100'
                        }`}>
                          {item.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : item.current ? (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        {index < arbitrationTimeline.length - 1 && (
                          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-zinc-200" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${
                            item.current ? 'text-red-600' : 'text-zinc-900'
                          }`}>
                            {item.step}
                          </span>
                          <span className="text-xs text-zinc-500">{item.time}</span>
                        </div>
                        <p className="text-sm text-zinc-600 mb-1">{item.description}</p>
                        <div className="text-xs text-zinc-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.handler}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium">预计处理时间</p>
                      <p className="text-xs mt-1">平台专员将在24小时内介入处理，复杂案件可能需要3-5个工作日</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

                <div className={`grid gap-4 ${
                  (order.status === 'in_progress' || order.status === 'completed')
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  <div className="p-4 border border-zinc-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-zinc-500">预约服务时间</span>
                    </div>
                    <div className="font-medium text-zinc-900">{order.serviceTime || '待确认'}</div>
                  </div>
                  {(order.status === 'in_progress' || order.status === 'completed') && (
                    <div className="p-4 border border-green-200 rounded-xl bg-green-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">签到时间</span>
                      </div>
                      <div className="font-medium text-zinc-900">
                        {(order as any).checkInTime
                          ? new Date((order as any).checkInTime).toLocaleString()
                          : '服务开始后显示'}
                      </div>
                    </div>
                  )}
                  {order.status === 'completed' && (
                    <div className="p-4 border border-teal-200 rounded-xl bg-teal-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-teal-500" />
                        <span className="text-sm text-teal-600">签出时间</span>
                      </div>
                      <div className="font-medium text-zinc-900">
                        {(order as any).checkOutTime
                          ? new Date((order as any).checkOutTime).toLocaleString()
                          : '服务完成后显示'}
                      </div>
                    </div>
                  )}
                </div>

                {order.status === 'completed' && (
                  <div className="p-4 bg-gradient-to-r from-accent-50 to-primary-50 rounded-xl border border-accent-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                          <Timer className="w-5 h-5 text-accent-600" />
                        </div>
                        <div>
                          <div className="text-sm text-zinc-500">实际服务时长</div>
                          <div className="text-2xl font-bold text-zinc-900">
                            {Math.floor(((order as any).actualDuration || order.duration || 240) / 60)}小时{((order as any).actualDuration || order.duration || 240) % 60}分钟
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-zinc-500 mb-1">对比预约时长</div>
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          +{((order as any).actualDuration || order.duration || 240) - (order.duration || 240)} 分钟
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {chatMessagesList?.length > 0 && (
                  <div className="p-4 border border-zinc-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-zinc-500">最新沟通</span>
                    </div>
                    <p className="text-sm text-zinc-700 line-clamp-1">
                      {chatMessagesList[chatMessagesList.length - 1]?.content || '暂无沟通记录'}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {chatMessagesList[chatMessagesList.length - 1]?.time || ''}
                    </p>
                  </div>
                )}
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
                <div className="flex items-center gap-2">
                  {showExportTip && (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1 animate-fade-in">
                      <CheckCircle className="w-3 h-3" />
                      已生成留痕记录，可用于仲裁举证
                    </span>
                  )}
                  <button
                    onClick={handleExportChat}
                    className="px-4 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    导出聊天
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-2">
                {chatMessagesList.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-fade-in group relative ${
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
                        <button
                          onClick={() => toggleMarkMessage(msg.id)}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                            markedMessages.includes(msg.id)
                              ? 'text-amber-500 opacity-100'
                              : 'text-zinc-400 hover:text-amber-500'
                          }`}
                          title={markedMessages.includes(msg.id) ? '取消标记' : '标记为关键节点'}
                        >
                          <Star className={`w-3.5 h-3.5 ${markedMessages.includes(msg.id) ? 'fill-current' : ''}`} />
                        </button>
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

              <div className="border-t border-zinc-100 pt-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="发送消息，沟通记录将自动留痕..."
                      className="input-field resize-none text-sm"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-zinc-300 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Send className="w-4 h-4" />
                    发送
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  消息已加密存储，可作为仲裁举证凭证
                </p>
              </div>
            </div>

            {order.status === 'completed' && (
              <div className="card p-6 animate-fade-in-up-delay-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">双向评价</h2>
                    <p className="text-sm text-zinc-500 mt-1">双方互评，共建诚信服务生态</p>
                  </div>
                  {showReviewSyncTip && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 animate-fade-in">
                      <CheckCircle className="w-3 h-3" />
                      评价已同步至信用档案
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">需</div>
                        <span className="font-medium text-blue-800">需求方 → 服务方</span>
                      </div>
                      {review ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          已完成
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          待评价
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      {review ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={review.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`}
                              alt={review.user?.username}
                              className="w-10 h-10 rounded-full ring-2 ring-blue-100"
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
                            <div className="flex flex-wrap gap-1.5">
                              {(review as any).tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {(review as any).images && (review as any).images.length > 0 && (
                            <div>
                              <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                服务图片 ({(review as any).images.length})
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {(review as any).images.map((img: string, idx: number) => (
                                  <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-zinc-200 hover:ring-2 hover:ring-blue-200 transition-all cursor-pointer">
                                    <img src={img} alt={`评价图片${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(review.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ) : isRequester ? (
                        showReviewForm ? (
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">服务评分 <span className="text-red-500">*</span></div>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    className="focus:outline-none transition-transform hover:scale-125"
                                    onClick={() => setReviewRating(star)}
                                  >
                                    <Star
                                      className={`w-8 h-8 ${
                                        star <= reviewRating ? 'text-amber-500' : 'text-zinc-200'
                                      }`}
                                      fill="currentColor"
                                    />
                                  </button>
                                ))}
                                <span className="ml-2 text-base font-semibold text-zinc-700">{reviewRating}.0 分</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">服务标签（可多选）</div>
                              <div className="flex flex-wrap gap-2">
                                {reviewTagOptions.slice(0, 6).map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleReviewTag(tag)}
                                    className={cn(
                                      'px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                                      reviewTags.includes(tag)
                                        ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm'
                                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-blue-200 hover:bg-blue-50'
                                    )}
                                  >
                                    {reviewTags.includes(tag) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">评价内容 <span className="text-red-500">*</span></div>
                              <textarea
                                value={reviewContent}
                                onChange={(e) => setReviewContent(e.target.value)}
                                placeholder="分享您的真实服务体验，帮助其他用户做出选择..."
                                className="input-field resize-none"
                                rows={4}
                              />
                              <div className="text-xs text-zinc-400 mt-1 text-right">{reviewContent.length}/500</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">上传图片（可选，最多4张）</div>
                              <div className="grid grid-cols-4 gap-2">
                                {reviewImages.map((img, idx) => (
                                  <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-zinc-200 relative group">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== idx))}
                                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                {reviewImages.length < 4 && (
                                  <button
                                    onClick={() => {
                                      const mockImages = [
                                        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=300&fit=crop',
                                        'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=300&h=300&fit=crop',
                                      ];
                                      if (reviewImages.length < mockImages.length) {
                                        setReviewImages([...reviewImages, mockImages[reviewImages.length]]);
                                      }
                                    }}
                                    className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-blue-300 hover:bg-blue-50 flex flex-col items-center justify-center text-zinc-400 hover:text-blue-500 transition-colors"
                                  >
                                    <Image className="w-6 h-6 mb-1" />
                                    <span className="text-xs">添加图片</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button
                                className="btn-primary flex-1 py-2.5"
                                onClick={handleSubmitReview}
                                disabled={actionLoading === 'review'}
                              >
                                {actionLoading === 'review' ? <LoadingSpinner size="sm" /> : '提交评价'}
                              </button>
                              <button
                                className="btn-secondary py-2.5"
                                onClick={() => setShowReviewForm(false)}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="w-full py-10 border-2 border-dashed border-blue-200 rounded-xl text-blue-500 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-2 group"
                            onClick={() => setShowReviewForm(true)}
                          >
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                              <Star className="w-7 h-7" fill="currentColor" />
                            </div>
                            <span className="font-semibold text-lg">去评价</span>
                            <span className="text-xs text-zinc-500">评价将同步至您的信用档案</span>
                          </button>
                        )
                      ) : (
                        <div className="py-10 text-center">
                          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-7 h-7 text-zinc-400" />
                          </div>
                          <p className="text-zinc-600 text-sm font-medium">等待需求方完成评价</p>
                          <p className="text-zinc-400 text-xs mt-1">完成后双方评价将同时展示</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">服</div>
                        <span className="font-medium text-orange-800">服务方 → 需求方</span>
                      </div>
                      {creatorReviewSubmitted || creatorReview ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          已完成
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          待评价
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      {creatorReviewSubmitted || creatorReview ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={creatorReview?.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.creatorId}`}
                              alt={creatorReview?.user?.username || '服务者'}
                              className="w-10 h-10 rounded-full ring-2 ring-orange-100"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-zinc-900">{creatorReview?.user?.username || '服务者'}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= (creatorReview?.rating || 5) ? 'text-amber-500' : 'text-zinc-200'}`}
                                    fill="currentColor"
                                  />
                                ))}
                                <span className="ml-1 text-sm text-zinc-500">{creatorReview?.rating || 5}.0</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-zinc-700 text-sm leading-relaxed">{creatorReview?.content}</p>
                          {creatorReview?.tags && creatorReview.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {creatorReview.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-lg"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {(creatorReview as any)?.images && (creatorReview as any).images.length > 0 && (
                            <div>
                              <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                现场图片 ({(creatorReview as any).images.length})
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {(creatorReview as any).images.map((img: string, idx: number) => (
                                  <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-zinc-200 hover:ring-2 hover:ring-orange-200 transition-all cursor-pointer">
                                    <img src={img} alt={`评价图片${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(creatorReview?.createdAt || Date.now()).toLocaleString()}
                          </div>
                        </div>
                      ) : isCreator ? (
                        showCreatorReviewForm ? (
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">需求方评分 <span className="text-red-500">*</span></div>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    className="focus:outline-none transition-transform hover:scale-125"
                                    onClick={() => setCreatorReviewRating(star)}
                                  >
                                    <Star
                                      className={`w-8 h-8 ${
                                        star <= creatorReviewRating ? 'text-amber-500' : 'text-zinc-200'
                                      }`}
                                      fill="currentColor"
                                    />
                                  </button>
                                ))}
                                <span className="ml-2 text-base font-semibold text-zinc-700">{creatorReviewRating}.0 分</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">印象标签（可多选）</div>
                              <div className="flex flex-wrap gap-2">
                                {reviewTagOptions.slice(6, 12).map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleCreatorReviewTag(tag)}
                                    className={cn(
                                      'px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                                      creatorReviewTags.includes(tag)
                                        ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-orange-200 hover:bg-orange-50'
                                    )}
                                  >
                                    {creatorReviewTags.includes(tag) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">评价内容 <span className="text-red-500">*</span></div>
                              <textarea
                                value={creatorReviewContent}
                                onChange={(e) => setCreatorReviewContent(e.target.value)}
                                placeholder="评价本次合作体验，帮助其他服务者了解需求方..."
                                className="input-field resize-none"
                                rows={4}
                              />
                              <div className="text-xs text-zinc-400 mt-1 text-right">{creatorReviewContent.length}/500</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-700 mb-2">上传图片（可选，最多4张）</div>
                              <div className="grid grid-cols-4 gap-2">
                                {creatorReviewImages.map((img, idx) => (
                                  <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-zinc-200 relative group">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => setCreatorReviewImages(creatorReviewImages.filter((_, i) => i !== idx))}
                                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                {creatorReviewImages.length < 4 && (
                                  <button
                                    onClick={() => {
                                      const mockImages = [
                                        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
                                        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=300&fit=crop',
                                      ];
                                      if (creatorReviewImages.length < mockImages.length) {
                                        setCreatorReviewImages([...creatorReviewImages, mockImages[creatorReviewImages.length]]);
                                      }
                                    }}
                                    className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-orange-300 hover:bg-orange-50 flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors"
                                  >
                                    <Image className="w-6 h-6 mb-1" />
                                    <span className="text-xs">添加图片</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button
                                className="btn-primary flex-1 py-2.5"
                                onClick={() => {
                                  setCreatorReviewSubmitted(true);
                                  setShowCreatorReviewForm(false);
                                  setCreatorReviewRating(5);
                                  setCreatorReviewContent('');
                                  setCreatorReviewTags([]);
                                  setCreatorReviewImages([]);
                                  setShowReviewSyncTip(true);
                                  setTimeout(() => setShowReviewSyncTip(false), 3000);
                                }}
                              >
                                提交评价
                              </button>
                              <button
                                className="btn-secondary py-2.5"
                                onClick={() => setShowCreatorReviewForm(false)}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="w-full py-10 border-2 border-dashed border-orange-200 rounded-xl text-orange-500 hover:border-orange-400 hover:bg-orange-50/50 transition-all flex flex-col items-center gap-2 group"
                            onClick={() => setShowCreatorReviewForm(true)}
                          >
                            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                              <Star className="w-7 h-7" fill="currentColor" />
                            </div>
                            <span className="font-semibold text-lg">去评价</span>
                            <span className="text-xs text-zinc-500">评价将影响需求方信用评级</span>
                          </button>
                        )
                      ) : (
                        <div className="py-10 text-center">
                          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-7 h-7 text-zinc-400" />
                          </div>
                          <p className="text-zinc-600 text-sm font-medium">等待服务方完成评价</p>
                          <p className="text-zinc-400 text-xs mt-1">完成后双方评价将同时展示</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {(review && (creatorReviewSubmitted || creatorReview)) && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <BadgeCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-green-800">评价已同步至双方信用档案</div>
                        <div className="text-xs text-green-600">真实评价将影响双方平台信用评级</div>
                      </div>
                    </div>
                    <Award className="w-6 h-6 text-green-500" />
                  </div>
                )}
              </div>
            )}

            {(order.status === 'completed' || order.status === 'disputed' || order.status === 'arbitrated') && (
              <div className="card p-6 animate-fade-in-up-delay-3">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-900">平台复查记录</h2>
                      <p className="text-sm text-zinc-500">全流程品质保障追踪</p>
                    </div>
                  </div>
                  {order.status === 'completed' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <BadgeCheck className="w-4 h-4" />
                      全流程复查通过
                    </span>
                  )}
                  {(order.status === 'disputed' || order.status === 'arbitrated') && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      仲裁中
                    </span>
                  )}
                </div>

                {(order.status === 'disputed' || order.status === 'arbitrated') && (
                  <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                          <Scale className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900">仲裁进度追踪</h3>
                          <p className="text-xs text-zinc-500">平台专员正在处理中</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        仲裁中
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        {arbitrationSteps.map((step, index) => {
                          const Icon = step.icon;
                          const isCompleted = order.status === 'arbitrated' ? true : index < 2;
                          const isCurrent = order.status === 'arbitrated' ? false : index === 2;
                          return (
                            <div key={step.id} className="flex flex-col items-center flex-1">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                                  isCompleted
                                    ? 'bg-green-500 text-white'
                                    : isCurrent
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'bg-zinc-200 text-zinc-500'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Icon className="w-4 h-4" />
                                )}
                              </div>
                              <span
                                className={`text-[11px] text-center font-medium ${
                                  isCompleted
                                    ? 'text-green-600'
                                    : isCurrent
                                    ? 'text-red-600'
                                    : 'text-zinc-400'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="relative h-1 bg-zinc-200 rounded-full">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full transition-all duration-500"
                          style={{ width: order.status === 'arbitrated' ? '100%' : '40%' }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {arbitrationTimeline.map((item, index) => {
                        const isCompleted = order.status === 'arbitrated' ? true : item.completed;
                        const isCurrent = order.status === 'arbitrated' ? false : item.current;
                        return (
                          <div key={item.id} className="flex gap-3">
                            <div className="relative flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted
                                  ? 'bg-green-100'
                                  : isCurrent
                                  ? 'bg-red-100'
                                  : 'bg-zinc-100'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : isCurrent ? (
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-zinc-400" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-sm font-medium ${
                                  isCurrent ? 'text-red-600' : 'text-zinc-900'
                                }`}>
                                  {item.step}
                                </span>
                                <span className="text-xs text-zinc-400">{item.time}</span>
                              </div>
                              <p className="text-xs text-zinc-600">{item.description}</p>
                              <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                <User className="w-3 h-3" />
                                {item.handler}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {order.status === 'arbitrated' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-start gap-2">
                          <FileCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-700">
                            <p className="font-medium">仲裁裁决结果</p>
                            <p className="mt-0.5">根据双方举证及服务留痕，平台裁定：服务方履约符合标准，尾款全额支付给服务方。</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {[
                    {
                      id: 'rr1',
                      type: '服务留痕复查',
                      reviewer: '系统自动核验',
                      result: '通过',
                      resultType: 'pass',
                      detail: '签到/签出GPS定位、服务时长、沟通记录等全链路留痕完整，无异常。',
                      time: new Date(Date.now() - 2 * 86400000 + 3600000).toLocaleString().slice(0, 16),
                      icon: Eye,
                      iconBg: 'bg-blue-100',
                      iconColor: 'text-blue-600',
                    },
                    {
                      id: 'rr2',
                      type: '评价真实性复核',
                      reviewer: order.status === 'disputed' || order.status === 'arbitrated' ? '平台运营 李主管' : '平台运营抽检',
                      result: order.status === 'disputed' || order.status === 'arbitrated' ? '仲裁中' : '通过',
                      resultType: order.status === 'disputed' || order.status === 'arbitrated' ? 'pending' : 'pass',
                      detail: order.status === 'disputed' || order.status === 'arbitrated'
                        ? '正在核实双方评价内容真实性，结合聊天记录及服务留痕综合判定。'
                        : '电话回访需求方，确认服务质量与评价内容一致，无刷单刷评行为。',
                      time: new Date(Date.now() - 1 * 86400000 + 3600000).toLocaleString().slice(0, 16),
                      icon: FileCheck,
                      iconBg: 'bg-purple-100',
                      iconColor: 'text-purple-600',
                    },
                    {
                      id: 'rr3',
                      type: '交易合规检查',
                      reviewer: '系统自动核验',
                      result: '通过',
                      resultType: 'pass',
                      detail: '资金流向合规，无异常交易行为，税费计算准确，符合平台交易规则。',
                      time: new Date(Date.now() - 1 * 86400000).toLocaleString().slice(0, 16),
                      icon: Shield,
                      iconBg: 'bg-green-100',
                      iconColor: 'text-green-600',
                    },
                  ].map((record, index) => {
                    const Icon = record.icon;
                    return (
                      <div
                        key={record.id}
                        className="flex gap-4 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="relative flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full ${record.iconBg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${record.iconColor}`} />
                          </div>
                          {index < 2 && (
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-zinc-200" />
                          )}
                        </div>
                        <div className={`flex-1 ${index < 2 ? 'pb-5' : ''}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-zinc-900 text-sm">{record.type}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  record.resultType === 'pass'
                                    ? 'bg-green-100 text-green-700'
                                    : record.resultType === 'pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {record.result}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-600 leading-relaxed">{record.detail}</p>
                              <div className="mt-1.5 flex items-center gap-4 text-xs text-zinc-400">
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
                    );
                  })}
                </div>

                {order.status === 'completed' && (
                  <div className="mt-5 p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-green-800">全流程复查通过 · 无异常</div>
                        <div className="text-xs text-green-600">服务留痕 / 评价复核 / 交易合规 三项检查全部通过</div>
                      </div>
                    </div>
                    <BadgeCheck className="w-7 h-7 text-green-500" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6 animate-fade-in-up-delay-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {order.status === 'completed' ? '资金结算' :
                     order.status === 'disputed' || order.status === 'arbitrated' ? '争议处理' : '支付信息'}
                  </h3>
                  {(order.status === 'completed' || order.status === 'disputed' || order.status === 'arbitrated') && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'disputed' || order.status === 'arbitrated'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-zinc-100 text-zinc-600'
                      )}>
                        {order.status === 'completed' ? '已结算' :
                         order.status === 'disputed' || order.status === 'arbitrated' ? '资金冻结' : '待结算'}
                      </span>
                    </div>
                  )}
                </div>
                {order.status === 'completed' && (
                  <button
                    onClick={() => setShowSettlementDetailModal(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    结算明细
                  </button>
                )}
              </div>

              {order.status === 'completed' && (
                <>
                  <div className="mb-5 space-y-3">
                    {[
                      {
                        step: 1,
                        title: '订单金额',
                        amount: `¥${order.price}`,
                        desc: '服务总费用',
                        icon: DollarSign,
                        iconBg: 'bg-zinc-100',
                        iconColor: 'text-zinc-600',
                        status: 'done',
                      },
                      {
                        step: 2,
                        title: '定金托管',
                        amount: `¥${order.deposit}`,
                        desc: '已支付 · 平台托管',
                        icon: PiggyBank,
                        iconBg: 'bg-blue-100',
                        iconColor: 'text-blue-600',
                        status: 'done',
                      },
                      {
                        step: 3,
                        title: '尾款支付',
                        amount: `¥${order.price - order.deposit}`,
                        desc: '已完成支付',
                        icon: Wallet,
                        iconBg: 'bg-purple-100',
                        iconColor: 'text-purple-600',
                        status: 'done',
                      },
                      {
                        step: 4,
                        title: '平台服务费 15%',
                        amount: `-¥${(order.price * 0.15).toFixed(2)}`,
                        desc: `创作者实收 ¥${(order.price * 0.85).toFixed(2)}`,
                        icon: Landmark,
                        iconBg: 'bg-green-100',
                        iconColor: 'text-green-600',
                        status: 'done',
                        isLast: true,
                      },
                    ].map((item: any, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.step} className="flex gap-3">
                          <div className="relative flex-shrink-0">
                            <div className={`w-9 h-9 rounded-full ${item.iconBg} flex items-center justify-center`}>
                              <Icon className={`w-4.5 h-4.5 ${item.iconColor}`} />
                            </div>
                            {!item.isLast && (
                              <div className="absolute top-9 left-1/2 -translate-x-1/2 w-0.5 h-[calc(100%+12px)] bg-green-200" />
                            )}
                          </div>
                          <div className={`flex-1 ${!item.isLast ? 'pb-4' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-zinc-900">{item.title}</span>
                                {item.status === 'done' && (
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                )}
                              </div>
                              <span className={cn(
                                'text-sm font-semibold',
                                item.amount.startsWith('-') ? 'text-red-500' : 'text-zinc-900'
                              )}>
                                {item.amount}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                          <BadgeCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-green-800 text-sm">T+1 已到账</div>
                          <div className="text-xs text-green-600">资金已结算至创作者账户</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-green-600">创作者实收</div>
                        <div className="text-xl font-bold text-green-700">¥{(order.price * 0.85).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {order.status === 'deposit_paid' && (
                <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-green-800">定金已托管</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">¥{order.deposit}</span>
                  </div>
                  <div className="relative h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: '33%' }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-green-600">
                    <span>第1步 · 定金支付</span>
                    <span>等待服务开始</span>
                  </div>
                </div>
              )}

              {order.status === 'in_progress' && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-blue-800">服务进行中</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">¥{order.deposit}</span>
                  </div>
                  <div className="relative h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: '66%' }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-blue-600">
                    <span>第2步 · 服务进行</span>
                    <span>完成后结算</span>
                  </div>
                </div>
              )}

              {(order.status === 'disputed' || order.status === 'arbitrated') && (
                <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-red-800">
                        {order.status === 'arbitrated' ? '仲裁已完成' : '仲裁中'}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-red-600">¥{order.price}</span>
                  </div>
                  <p className="text-xs text-red-600 mb-2">
                    {order.status === 'arbitrated' ? '仲裁已完成，按裁决结果结算' : '资金已冻结，待仲裁结果'}
                  </p>
                  <button
                    onClick={() => setShowArbitrationTimeline(true)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Scale className="w-3 h-3" />
                    查看仲裁进度
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">服务费用</span>
                  <span className="font-semibold text-zinc-900">¥{order.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">定金（已付）</span>
                  <span className="font-semibold text-green-600">¥{order.deposit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">尾款</span>
                  <span className="font-semibold text-zinc-900">¥{order.price - order.deposit}</span>
                </div>

                {order.status === 'completed' && (
                  <>
                    <div className="h-px bg-zinc-100 my-2" />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-zinc-500 text-sm flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        交易单号
                      </span>
                      <span className="font-mono text-xs text-zinc-700">TXN{order.id?.slice(0, 10).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        结算时间
                      </span>
                      <span className="text-sm text-zinc-700">{new Date(Date.now() - 1 * 86400000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5" />
                        到账时间
                      </span>
                      <span className="text-sm text-green-600 font-medium">T+1 已到账</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        支付方式
                      </span>
                      <span className="text-sm text-zinc-700">微信支付</span>
                    </div>
                  </>
                )}
              </div>

              {showSettlementDetail && (
                <div className="mt-4 p-4 bg-zinc-50 rounded-xl space-y-4 animate-fade-in">
                  <div className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-primary-500" />
                    资金分账明细
                  </div>

                  <div className="space-y-3">
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
                  </div>

                  <div className="h-px bg-zinc-200" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">结算状态</span>
                      <span className={cn(
                        'font-medium',
                        order.status === 'completed' ? 'text-green-600' : 'text-amber-600'
                      )}>
                        {order.status === 'completed' ? '已结算' : '待结算'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">结算时间</span>
                      <span className="text-zinc-700">
                        {order.status === 'completed'
                          ? new Date().toLocaleDateString()
                          : '服务完成后 T+1 工作日'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">交易单号</span>
                      <span className="font-mono text-zinc-700">TXN{order.id?.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>

                  {order.status !== 'completed' && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-700">
                            <p className="font-medium">结算规则</p>
                            <p className="mt-0.5">服务完成确认后，T+1 工作日自动结算至创作者账户</p>
                          </div>
                        </div>
                      </div>
                    )}
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

            {(order?.category === '家政' || order?.category === '护理' || (order as any)?.insuranceRequired) && (
              <div className="space-y-4">
                <div className={`card p-4 animate-fade-in-up-delay-2 border-2 overflow-hidden relative ${
                  order.status === 'deposit_paid' || order.status === 'in_progress'
                    ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50'
                    : order.status === 'completed'
                    ? 'border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50'
                    : 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      order.status === 'deposit_paid' || order.status === 'in_progress'
                        ? 'bg-green-500'
                        : order.status === 'completed'
                        ? 'bg-teal-500'
                        : 'bg-amber-500'
                    }`}>
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-base font-bold ${
                          order.status === 'deposit_paid' || order.status === 'in_progress'
                            ? 'text-green-700'
                            : order.status === 'completed'
                            ? 'text-teal-700'
                            : 'text-amber-700'
                        }`}>
                          投保状态：{order.status === 'deposit_paid' || order.status === 'in_progress'
                            ? '保障中'
                            : order.status === 'completed'
                            ? '保障有效（30天追溯期）'
                            : order.status === 'cancelled'
                            ? '已终止'
                            : '待投保'}
                        </span>
                        {order.status === 'deposit_paid' || order.status === 'in_progress' || order.status === 'completed' ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            已承保
                          </span>
                        ) : null}
                      </div>
                      <p className={`text-xs ${
                        order.status === 'deposit_paid' || order.status === 'in_progress'
                          ? 'text-green-600'
                          : order.status === 'completed'
                          ? 'text-teal-600'
                          : 'text-amber-600'
                      }`}>
                        {order.status === 'published' || order.status === 'matched' || order.status === 'confirmed'
                          ? '支付定金后自动为您投保家政服务责任险'
                          : `保障期限：${insuranceInfo.period}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-6 animate-fade-in-up-delay-2 border border-green-100 overflow-hidden relative">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <BadgeCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">保单信息</h3>
                      <p className="text-xs text-zinc-500">家政服务责任险</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="text-xs text-zinc-500 mb-1">保单号</div>
                        <div className="font-mono text-sm font-medium text-zinc-900 break-all tracking-tight">
                          {insuranceInfo.policyNo}
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="text-xs text-zinc-500 mb-1">保险公司</div>
                        <div className="font-medium text-zinc-900 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          {insuranceInfo.company}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="text-xs text-green-700 mb-1">累计保额</div>
                        <div className="text-3xl font-bold text-green-700">
                          ¥{insuranceInfo.coverage.toLocaleString()}
                        </div>
                        {insuranceInfo.hasUpgraded && (
                          <span className="text-xs text-green-600">已升级至 {insuranceInfo.upgradedCoverage.toLocaleString()} 元</span>
                        )}
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="text-xs text-blue-700 mb-1">保费</div>
                        <div className="text-xl font-bold text-blue-700 flex items-baseline gap-1">
                          ¥{insuranceInfo.premium.toFixed(2)}
                        </div>
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          已由平台垫付
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs text-zinc-500">保障期限</span>
                      </div>
                      <div className="font-medium text-sm text-zinc-900">{insuranceInfo.period}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-green-600" />
                        保障范围
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {insuranceInfo.range?.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.label} className="flex items-center gap-2 p-2.5 bg-zinc-50 rounded-lg">
                              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-3.5 h-3.5 text-green-600" />
                              </div>
                              <span className="text-sm text-zinc-700 font-medium">{item.label}</span>
                            </div>
                          );
                        })}
                        {insuranceInfo.hasUpgraded && insuranceInfo.upgradeItems?.map((item) => (
                          <div key={item} className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <BadgeCheck className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <span className="text-sm text-amber-700 font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-6 animate-fade-in-up-delay-2 border border-blue-100">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">保险对接结果</h3>
                      <p className="text-xs text-zinc-500">投保全流程已完成</p>
                    </div>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-green-200" />
                    <div className="space-y-4">
                      {insuranceDockingSteps?.map((step, index) => {
                        const StepIcon = step.icon;
                        const isLast = index === insuranceDockingSteps.length - 1;
                        return (
                          <div key={step.step} className="relative flex gap-4">
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center z-10 flex-shrink-0',
                              step.status === 'done' ? 'bg-green-500 text-white' : 'bg-zinc-200 text-zinc-500'
                            )}>
                              {step.status === 'done' ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <StepIcon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 pb-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-zinc-900">
                                  {step.step}. {step.title}
                                </span>
                                <span className="text-xs text-zinc-400">{step.time}</span>
                              </div>
                              {step.policyNo && (
                                <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                                  保单号：{step.policyNo}
                                </p>
                              )}
                              {isLast && (
                                <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  保单已正式生效
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="text-xs text-zinc-500 mb-1">保险公司回执单号</div>
                      <div className="font-mono text-sm font-medium text-zinc-900 break-all">
                        {insuranceInfo.receiptNo}
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="text-xs text-zinc-500 mb-1">投保确认时间</div>
                      <div className="font-medium text-sm text-zinc-900">
                        {insuranceDockingSteps?.[0]?.time}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowInsuranceDetailModal(true);
                      }}
                      className="flex-1 py-2.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      保单详情
                    </button>
                    <button
                      onClick={() => {
                        alert('电子保单已生成，可用于理赔');
                      }}
                      className="flex-1 py-2.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      电子保单下载
                    </button>
                  </div>
                </div>

                {insuranceInfo.hasUpgraded ? (
                  <div className="card p-6 animate-fade-in-up-delay-2 border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-transparent overflow-hidden relative">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-bl-xl">
                      已升级
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">保障升级申请</h3>
                        <p className="text-xs text-amber-600 font-medium">{upgradeAuditRecord.status} · 平台运营审核</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-xl border border-amber-100">
                        <div className="text-xs text-zinc-500 mb-1">升级内容</div>
                        <div className="font-medium text-sm text-zinc-900">{upgradeAuditRecord.content}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-xl border border-amber-100">
                          <div className="text-xs text-zinc-500 mb-1">审核人</div>
                          <div className="font-medium text-sm text-zinc-900">{upgradeAuditRecord.auditor}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-amber-100">
                          <div className="text-xs text-zinc-500 mb-1">审核时间</div>
                          <div className="font-medium text-sm text-zinc-900">{upgradeAuditRecord.auditTime}</div>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-amber-700 mb-0.5">升级费用</div>
                          <div className="text-xl font-bold text-amber-600">¥{upgradeAuditRecord.upgradeFee.toFixed(2)}</div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          审核通过
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card p-6 animate-fade-in-up-delay-2 border-2 border-dashed border-amber-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-bl-xl">
                      可升级保障
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">升级保障方案</h3>
                        <p className="text-xs text-zinc-500">保额提升至 100 万，额外保障更全面</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs text-zinc-500 mb-0.5">升级后保额</div>
                          <div className="text-2xl font-bold text-amber-600">¥{insuranceInfo.upgradedCoverage.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-zinc-500 mb-0.5">升级保费</div>
                          <div className="text-2xl font-bold text-zinc-900">¥{insuranceInfo.upgradePremium.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {insuranceInfo.upgradeItems?.map((item) => (
                          <div key={item} className="flex items-center gap-1.5 text-xs text-zinc-700">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setShowUpgradeConfirmModal(true)}
                      className="w-full py-2.5 text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      立即升级保障（¥{insuranceInfo.upgradePremium.toFixed(2)}）
                    </button>
                  </div>
                )}
              </div>
            )}

            {(order?.category !== '家政' && order?.category !== '护理' && !(order as any)?.insuranceRequired) && (
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

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  上传凭证（最多4张）
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {disputeImages.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-zinc-200 relative">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setDisputeImages(disputeImages.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {disputeImages.length < 4 && (
                    <button
                      onClick={() => {
                        const mockImages = [
                          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop',
                        ];
                        if (disputeImages.length < mockImages.length) {
                          setDisputeImages([...disputeImages, mockImages[disputeImages.length]]);
                        }
                      }}
                      className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 hover:border-red-300 hover:bg-red-50 flex flex-col items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Image className="w-6 h-6 mb-1" />
                      <span className="text-xs">添加</span>
                    </button>
                  )}
                </div>
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

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs text-blue-700">
                  预计处理时间：平台将在 <strong>24小时内</strong> 响应您的申请
                </span>
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

      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-blue-500 to-indigo-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">电子保单</h2>
                    <p className="text-sm text-blue-100">家政服务责任险</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPolicyModal(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="text-center">
                  <div className="text-sm text-zinc-500 mb-1">累计保额</div>
                  <div className="text-4xl font-bold text-blue-600">¥500,000</div>
                  <div className="text-xs text-zinc-500 mt-1">人身伤害 + 财产损失 双重保障</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">保单号</div>
                  <div className="font-mono text-sm font-medium text-zinc-800">{insuranceInfo.policyNo}</div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">保费</div>
                  <div className="font-semibold text-green-600">¥{insuranceInfo.premium} <span className="text-xs">平台承担</span></div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-zinc-700">承保公司</span>
                </div>
                <div className="font-medium text-zinc-900">{insuranceInfo.company}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-zinc-700 mb-3">保障范围</div>
                <div className="space-y-2">
                  {insuranceInfo.range.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <ItemIcon className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="text-sm text-zinc-700">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">特别说明</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 保障期限：服务开始至服务完成后30天追溯期</li>
                      <li>• 本保单由平台统一投保，保费由平台承担</li>
                      <li>• 理赔事宜请联系平台客服协助办理</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettlementDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-green-500 to-emerald-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">结算明细</h2>
                    <p className="text-sm text-green-100">资金分账详情</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettlementDetailModal(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-600 mb-1">订单总金额</div>
                    <div className="text-3xl font-bold text-green-700">¥{order?.price || 0}</div>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <BadgeCheck className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between text-xs">
                  <span className="text-green-700">交易单号</span>
                  <span className="font-mono text-green-800">TXN{order?.id?.slice(0, 12).toUpperCase()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-zinc-500" />
                  资金流向
                </div>
                <div className="space-y-0">
                  {[
                    { label: '订单金额', value: `¥${order?.price || 0}`, type: 'neutral', desc: '需求方支付' },
                    { label: '定金托管', value: `¥${order?.deposit || 0}`, type: 'positive', desc: '已支付 · 平台托管' },
                    { label: '尾款支付', value: `¥${(order?.price || 0) - (order?.deposit || 0)}`, type: 'positive', desc: '服务完成后支付' },
                    { label: '平台服务费 (15%)', value: `-¥${((order?.price || 0) * 0.15).toFixed(2)}`, type: 'negative', desc: '平台技术服务费', divider: true },
                    { label: '创作者实收', value: `¥${((order?.price || 0) * 0.85).toFixed(2)}`, type: 'success', desc: 'T+1 已到账', highlight: true },
                  ].map((item: any, index) => (
                    <div key={index} className="relative">
                      <div className={`flex items-center justify-between py-3 ${item.divider ? 'border-t border-zinc-200 mt-2 pt-4' : ''} ${item.highlight ? 'mt-2' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.type === 'positive' ? 'bg-green-100' :
                            item.type === 'negative' ? 'bg-red-100' :
                            item.type === 'success' ? 'bg-emerald-100' :
                            'bg-zinc-100'
                          }`}>
                            {item.type === 'positive' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : item.type === 'negative' ? (
                              <DollarSign className="w-4 h-4 text-red-600" />
                            ) : item.type === 'success' ? (
                              <Wallet className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <DollarSign className="w-4 h-4 text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                            <div className="text-xs text-zinc-500">{item.desc}</div>
                          </div>
                        </div>
                        <span className={cn(
                          'text-sm font-semibold',
                          item.type === 'negative' ? 'text-red-500' :
                          item.type === 'success' ? 'text-green-600' :
                          'text-zinc-900'
                        )}>
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-2xl space-y-3">
                <div className="text-sm font-semibold text-zinc-900 flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  结算信息
                </div>
                {[
                  { label: '结算状态', value: '已结算', valueClass: 'text-green-600', icon: BadgeCheck },
                  { label: '结算时间', value: new Date(Date.now() - 1 * 86400000).toLocaleString(), icon: Clock },
                  { label: '到账时间', value: 'T+1 已到账', valueClass: 'text-green-600', icon: Landmark },
                  { label: '支付方式', value: '微信支付', icon: CreditCard },
                  { label: '收款账户', value: `${order?.creator?.username || '创作者'} · 尾号****`, icon: Wallet },
                ].map((item: any, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        {item.label}
                      </span>
                      <span className={cn('text-xs font-medium text-zinc-800', item.valueClass)}>
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium">结算规则说明</p>
                    <p className="mt-0.5 leading-relaxed">
                      平台采用 T+1 结算机制，服务完成确认后，次日自动结算至创作者账户。
                      如遇争议，资金将冻结至仲裁结束后按裁决结果分配。
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSettlementDetailModal(false)}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  我知道了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInsuranceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-blue-500 to-indigo-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">保险投保确认</h2>
                  <p className="text-sm text-blue-100">家政服务强制投保</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="text-center">
                  <div className="text-sm text-zinc-500 mb-1">保障额度</div>
                  <div className="text-3xl font-bold text-blue-600">¥50万</div>
                  <div className="text-xs text-zinc-500 mt-1">人身伤害 + 财产损失</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">保费</span>
                  <span className="font-medium text-green-600">¥{insuranceInfo.premium}（平台承担）</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">承保公司</span>
                  <span className="font-medium text-zinc-900">{insuranceInfo.company}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">保障期限</span>
                  <span className="font-medium text-zinc-900">服务全程 + 30天追溯期</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    根据平台规则，家政/护理类服务订单强制投保家政服务责任险，保障您的服务安全。保费由平台承担，无需您额外支付。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex gap-3">
              <button
                onClick={() => setShowInsuranceConfirm(false)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmInsuranceAndPay}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                确认投保并支付
              </button>
            </div>
          </div>
        </div>
      )}

      {showInsuranceDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-green-500 to-emerald-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">保单详情</h2>
                    <p className="text-sm text-green-100">家政服务责任险</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInsuranceDetailModal(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                <div className="text-center">
                  <div className="text-sm text-zinc-500 mb-1">累计保额</div>
                  <div className="text-4xl font-bold text-green-600">¥{insuranceInfo.coverage.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500 mt-1">人身伤害 + 财产损失 双重保障</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">保单号</div>
                  <div className="font-mono text-sm font-medium text-zinc-800 break-all">{insuranceInfo.policyNo}</div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">回执单号</div>
                  <div className="font-mono text-sm font-medium text-zinc-800 break-all">{insuranceInfo.receiptNo}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">保费</div>
                  <div className="font-semibold text-green-600">¥{insuranceInfo.premium.toFixed(2)} <span className="text-xs">平台承担</span></div>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <div className="text-xs text-zinc-500 mb-1">保障期限</div>
                  <div className="font-medium text-sm text-zinc-800">{insuranceInfo.period}</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-zinc-700">承保公司</span>
                </div>
                <div className="font-medium text-zinc-900">{insuranceInfo.company}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-zinc-700 mb-3">保障范围</div>
                <div className="space-y-2">
                  {insuranceInfo.range?.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="text-sm text-zinc-700">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-zinc-700 mb-3">投保对接流程</div>
                <div className="space-y-3">
                  {insuranceDockingSteps?.map((step) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={step.step} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-zinc-900">{step.step}. {step.title}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{step.time}</div>
                          {step.policyNo && (
                            <div className="text-xs text-blue-600 mt-0.5 font-mono">保单号：{step.policyNo}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">特别说明</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 本保单由平台统一投保，保费由平台承担</li>
                      <li>• 理赔事宜请联系平台客服协助办理</li>
                      <li>• 电子保单已生成，可用于理赔举证</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex gap-3">
              <button
                onClick={() => {
                  setShowInsuranceDetailModal(false);
                  alert('电子保单已生成，可用于理赔');
                }}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载电子保单
              </button>
              <button
                onClick={() => setShowInsuranceDetailModal(false)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-amber-500 to-orange-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <BadgeCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">升级保障确认</h2>
                    <p className="text-sm text-orange-100">保额提升至 100 万</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeConfirmModal(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                <div className="text-center">
                  <div className="text-sm text-zinc-500 mb-1">升级后保额</div>
                  <div className="text-4xl font-bold text-amber-600">¥{insuranceInfo.upgradedCoverage.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500 mt-1">基础版 → 升级版</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">升级保费</span>
                  <span className="font-bold text-zinc-900 text-lg">¥{insuranceInfo.upgradePremium.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">基础保额</span>
                  <span className="font-medium text-zinc-900">¥{insuranceInfo.coverage.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">承保公司</span>
                  <span className="font-medium text-zinc-900">{insuranceInfo.company}</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-zinc-700 mb-2">新增保障项目</div>
                <div className="space-y-2">
                  {insuranceInfo.upgradeItems?.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-zinc-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    升级后保障立即生效，升级费用需用户自行承担。审核通过后保单自动更新。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex gap-3">
              <button
                onClick={() => setShowUpgradeConfirmModal(false)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
              >
                暂不升级
              </button>
              <button
                onClick={() => {
                  setShowUpgradeConfirmModal(false);
                  alert('保障升级申请已提交，平台将在24小时内审核');
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <BadgeCheck className="w-4 h-4" />
                确认升级（¥{insuranceInfo.upgradePremium.toFixed(2)}）
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
