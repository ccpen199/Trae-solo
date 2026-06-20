import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Home,
  Clock,
  Send,
  Image as ImageIcon,
  Wrench,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  MoreHorizontal,
  AlertTriangle,
  AlertCircle,
  ArrowUp,
  Award,
  CalendarClock,
  CheckCircle2,
  UserCircle2,
  Star,
  MapPin as MapPinIcon,
  Gauge,
  Zap,
  Sparkles,
  RotateCcw,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Button, Input, message, Upload, Modal, Radio, Rate, Tag, Progress, ProgressProps,
} from 'antd';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SlaCountdown } from '@/components/common/SlaCountdown';
import { DesensitizeText } from '@/components/common/DesensitizeText';
import { WorkOrderTimeline, type TimelineNode } from '@/components/business/WorkOrderTimeline';
import { SatisfactionRating, defaultRatingTags } from '@/components/business/SatisfactionRating';
import { cn } from '@/utils/cn';
import { EmptyState } from '@/components/common/EmptyState';
import { useUserStore } from '@/store/userStore';
import type { WorkOrder, WorkOrderStatus, WorkOrderType, WorkOrderPriority, UserRole } from '@/types/entity';
import { WORK_ORDER_TYPE, WORK_ORDER_PRIORITY, USER_ROLE } from '@/constants/enums';

const { TextArea } = Input;

const mockStewards = [
  {
    id: 's1',
    name: '赵管家',
    role: '综合管家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s1',
    skills: ['综合服务', '投诉处理', '门禁系统'],
    distance: 0.5,
    load: 2,
    rating: 4.8,
    responseTime: 15,
    isRecommended: true,
  },
  {
    id: 's2',
    name: '钱财务',
    role: '财务管家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s2',
    skills: ['财务咨询', '缴费服务'],
    distance: 1.2,
    load: 3,
    rating: 4.6,
    responseTime: 30,
    isRecommended: false,
  },
  {
    id: 's3',
    name: '吴维修',
    role: '维修管家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s3',
    skills: ['水电维修', '空调维修', '家电维修'],
    distance: 0.3,
    load: 1,
    rating: 4.9,
    responseTime: 10,
    isRecommended: true,
  },
  {
    id: 's4',
    name: '保安王',
    role: '安保管家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s4',
    skills: ['安保巡逻', '停车管理', '门禁系统'],
    distance: 0.8,
    load: 4,
    rating: 4.5,
    responseTime: 20,
    isRecommended: false,
  },
  {
    id: 's5',
    name: '前台李',
    role: '前台管家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s5',
    skills: ['前台接待', '门禁管理', '咨询服务'],
    distance: 1.5,
    load: 2,
    rating: 4.7,
    responseTime: 25,
    isRecommended: false,
  },
];

const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    orderNo: 'WO20240115001',
    title: '客厅空调不制冷',
    description: '空调开机后只出风不制冷，已经持续两天了，天气太热了请尽快处理。空调型号是格力的，买了大概3年左右，之前一直正常使用，昨天开始突然就不制冷了，只有风出来但是不凉。',
    type: 'REPAIR',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    source: 'RESIDENT_APP',
    submitterId: 'u1',
    submitterName: '张三',
    submitterRole: 'RESIDENT',
    assigneeId: 's3',
    assigneeName: '吴维修',
    assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s3',
    communityId: 'c1',
    communityName: '阳光花园',
    buildingId: 'b1',
    buildingName: '1号楼',
    unitId: 'u2',
    unitName: '2单元',
    roomId: 'r1',
    roomName: '501室',
    locationDetail: '客厅',
    slaDeadline: dayjs().add(3, 'hour').toISOString(),
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    updatedAt: dayjs().subtract(30, 'minute').toISOString(),
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1631552939727-1b02b8b6753e?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1580910051070-8f35eea67f9e?w=200&h=200&fit=crop',
    ],
  },
  {
    id: '2',
    orderNo: 'WO20240115002',
    title: '楼道灯坏了',
    description: '3单元5楼的楼道灯不亮了，晚上走路很不方便',
    type: 'REPAIR',
    status: 'PENDING',
    priority: 'HIGH',
    source: 'PHONE',
    submitterId: 'u2',
    submitterName: '李四',
    submitterRole: 'RESIDENT',
    communityId: 'c1',
    communityName: '阳光花园',
    buildingId: 'b1',
    buildingName: '1号楼',
    unitId: 'u3',
    unitName: '3单元',
    slaDeadline: dayjs().add(8, 'hour').toISOString(),
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    updatedAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: '3',
    orderNo: 'WO20240115003',
    title: '小区广场舞噪音太大',
    description: '每天晚上广场舞音乐声音太大，影响孩子学习，希望能控制音量',
    type: 'COMPLAINT',
    status: 'ASSIGNED',
    priority: 'MEDIUM',
    source: 'RESIDENT_APP',
    submitterId: 'u3',
    submitterName: '王五',
    submitterRole: 'RESIDENT',
    assigneeId: 's1',
    assigneeName: '赵管家',
    assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s1',
    communityId: 'c1',
    communityName: '阳光花园',
    slaDeadline: dayjs().add(12, 'hour').toISOString(),
    createdAt: dayjs().subtract(4, 'hour').toISOString(),
    updatedAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: '4',
    orderNo: 'WO20240115004',
    title: '物业费收费标准咨询',
    description: '想了解一下今年的物业费收费标准，以及缴费方式有哪些',
    type: 'CONSULT',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    source: 'STAFF_ENTRY',
    submitterId: 'u4',
    submitterName: '赵六',
    submitterRole: 'RESIDENT',
    assigneeId: 's2',
    assigneeName: '钱财务',
    assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s2',
    communityId: 'c1',
    communityName: '阳光花园',
    slaDeadline: dayjs().add(24, 'hour').toISOString(),
    createdAt: dayjs().subtract(6, 'hour').toISOString(),
    updatedAt: dayjs().subtract(3, 'hour').toISOString(),
  },
  {
    id: '5',
    orderNo: 'WO20240115005',
    title: '建议增加健身器材',
    description: '小区健身区器材太少，建议增加一些跑步机和力量训练器材',
    type: 'SUGGESTION',
    status: 'COMPLETED',
    priority: 'LOW',
    source: 'RESIDENT_APP',
    submitterId: 'u5',
    submitterName: '孙七',
    submitterRole: 'RESIDENT',
    assigneeId: 's1',
    assigneeName: '赵管家',
    assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s1',
    communityId: 'c1',
    communityName: '阳光花园',
    slaDeadline: dayjs().subtract(1, 'day').toISOString(),
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
    completedAt: dayjs().subtract(1, 'day').toISOString(),
    satisfaction: 5,
    satisfactionComment: '处理很快，态度很好',
    satisfactionTags: ['fast', 'professional', 'friendly'],
  },
];

const typeIcons: Record<WorkOrderType, typeof Wrench> = {
  REPAIR: Wrench,
  COMPLAINT: MessageSquare,
  CONSULT: HelpCircle,
  SUGGESTION: Lightbulb,
  APPOINTMENT: CalendarClock,
  OTHER: MoreHorizontal,
};

function convertStatus(status: WorkOrderStatus): 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled' {
  const map: Record<WorkOrderStatus, 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled'> = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status];
}

const defaultTimelineNodes: TimelineNode[] = [
  {
    id: '1',
    status: 'pending',
    title: '工单已提交',
    description: '业主提交了工单',
    operator: '张三',
    operatorRole: '业主',
    time: dayjs().subtract(2, 'hour').toISOString(),
    thumbnails: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1631552939727-1b02b8b6753e?w=200&h=200&fit=crop',
    ],
  },
  {
    id: '2',
    status: 'assigned',
    title: '工单已分派',
    description: '系统自动分派给维修工程师处理',
    operator: '系统',
    operatorRole: '系统',
    time: dayjs().subtract(1.5, 'hour').toISOString(),
  },
  {
    id: '3',
    status: 'processing',
    title: '处理中',
    description: '维修师傅已上门检查',
    operator: '吴维修',
    operatorRole: '维修管家',
    operatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s3',
    time: dayjs().subtract(30, 'minute').toISOString(),
    thumbnails: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop',
    ],
  },
];

const uploadProps: UploadProps = {
  beforeUpload: () => {
    message.info('图片上传功能演示');
    return false;
  },
  multiple: true,
  accept: 'image/*',
};

export default function WorkOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const foundWorkOrder = mockWorkOrders.find((o) => o.id === id);
  const { user } = useUserStore();

  const [workOrder, setWorkOrder] = useState<WorkOrder>(foundWorkOrder || mockWorkOrders[0]);
  const [timelineNodes, setTimelineNodes] = useState<TimelineNode[]>(defaultTimelineNodes);
  const [progressText, setProgressText] = useState('');
  const [rating, setRating] = useState(workOrder.satisfaction || 0);
  const [comment, setComment] = useState(workOrder.satisfactionComment || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(workOrder.satisfactionTags || []);
  const [hasSubmittedRating, setHasSubmittedRating] = useState(!!workOrder.satisfaction);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedSteward, setSelectedSteward] = useState<string>('');
  const [reopenModalVisible, setReopenModalVisible] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const currentUserRole = user?.role || 'RESIDENT';
  const isResident = currentUserRole === 'RESIDENT';
  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'COMMUNITY_ADMIN';
  const isStaff = currentUserRole === 'PROPERTY_STAFF' || isAdmin;

  const slaInfo = useMemo(() => {
    const deadline = dayjs(workOrder.slaDeadline);
    const now = dayjs();
    const created = dayjs(workOrder.createdAt);
    const totalHours = deadline.diff(created, 'hour', true);
    const usedHours = now.diff(created, 'hour', true);
    const remainingHours = deadline.diff(now, 'hour', true);
    const progress = Math.min(100, Math.max(0, (usedHours / totalHours) * 100));

    let status: 'normal' | 'warning' | 'overdue' = 'normal';
    if (remainingHours <= 0) {
      status = 'overdue';
    } else if (remainingHours <= 2) {
      status = 'warning';
    }

    const formatTime = (hours: number) => {
      if (hours < 0) return '已逾期';
      if (hours < 1) return `${Math.round(hours * 60)}分钟`;
      if (hours < 24) return `${hours.toFixed(1)}小时`;
      return `${(hours / 24).toFixed(1)}天`;
    };

    return {
      totalHours,
      usedHours,
      remainingHours,
      progress,
      status,
      usedTimeText: formatTime(usedHours),
      remainingTimeText: formatTime(remainingHours),
      responseRequirement: `${workOrder.priority === 'URGENT' ? '30分钟' : workOrder.priority === 'HIGH' ? '2小时' : workOrder.priority === 'MEDIUM' ? '8小时' : '24小时'}内响应`,
    };
  }, [workOrder]);

  const recommendedSteward = useMemo(() => {
    return mockStewards.find((s) => s.isRecommended) || mockStewards[0];
  }, []);

  if (!foundWorkOrder) {
    return (
      <div className="p-6">
        <PageHeader
          title="工单详情"
          subtitle="工单不存在"
          showBack
          onBack={() => navigate(-1)}
          breadcrumb={[{ title: '首页' }, { title: '工单管理' }, { title: '工单详情' }]}
        />
        <div className="max-w-5xl mx-auto">
          <EmptyState
            type="search"
            title="工单不存在"
            description="未找到该工单，请返回工单列表查看"
          />
        </div>
      </div>
    );
  }

  const isCompleted = workOrder.status === 'COMPLETED';
  const isCancelled = workOrder.status === 'CANCELLED';
  const TypeIcon = typeIcons[workOrder.type];

  const handleBack = () => {
    navigate(-1);
  };

  const handleAssign = () => {
    setAssignModalVisible(true);
    setSelectedSteward('');
  };

  const handleAssignConfirm = () => {
    if (!selectedSteward) {
      message.warning('请选择管家');
      return;
    }
    const steward = mockStewards.find((s) => s.id === selectedSteward);
    setWorkOrder((prev) => ({ ...prev, status: 'ASSIGNED', assigneeId: selectedSteward, assigneeName: steward?.name || '', assigneeAvatar: steward?.avatar }));
    const newNode: TimelineNode = {
      id: String(Date.now()),
      status: 'assigned',
      title: '工单已分派',
      description: `手动分派给${steward?.role || '管家'}${steward?.name || ''}处理`,
      operator: user?.realName || '管理员',
      operatorRole: '管理员',
      time: new Date().toISOString(),
    };
    setTimelineNodes((prev) => [...prev, newNode]);
    setAssignModalVisible(false);
    message.success('工单分派成功');
  };

  const handleProcess = () => {
    setWorkOrder((prev) => ({ ...prev, status: 'IN_PROGRESS' }));
    const newNode: TimelineNode = {
      id: String(Date.now()),
      status: 'processing',
      title: '开始处理',
      description: '维修师傅已接单，正在前往处理',
      operator: workOrder.assigneeName || '处理人',
      operatorRole: '维修管家',
      operatorAvatar: workOrder.assigneeAvatar,
      time: new Date().toISOString(),
    };
    setTimelineNodes((prev) => [...prev, newNode]);
    message.success('工单已开始处理');
  };

  const handleComplete = () => {
    Modal.confirm({
      title: '完成工单',
      content: '确认此工单已处理完成？',
      okText: '确认完成',
      cancelText: '取消',
      onOk: () => {
        setWorkOrder((prev) => ({
          ...prev,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
        }));
        const newNode: TimelineNode = {
          id: String(Date.now()),
          status: 'completed',
          title: '工单已完成',
          description: '工单已处理完成',
          operator: workOrder.assigneeName || '处理人',
          operatorRole: '维修管家',
          operatorAvatar: workOrder.assigneeAvatar,
          time: new Date().toISOString(),
        };
        setTimelineNodes((prev) => [...prev, newNode]);
        message.success('工单已完成');
      },
    });
  };

  const handleCancel = () => {
    Modal.confirm({
      title: '取消工单',
      content: '确认取消此工单吗？取消后将无法恢复。',
      okText: '确认取消',
      cancelText: '我再想想',
      okButtonProps: { danger: true },
      onOk: () => {
        setWorkOrder((prev) => ({
          ...prev,
          status: 'CANCELLED',
        }));
        const newNode: TimelineNode = {
          id: String(Date.now()),
          status: 'cancelled',
          title: '工单已取消',
          description: '工单已被取消',
          operator: user?.realName || '操作人',
          operatorRole: isResident ? '业主' : '管理员',
          time: new Date().toISOString(),
        };
        setTimelineNodes((prev) => [...prev, newNode]);
        message.success('工单已取消');
      },
    });
  };

  const handleReopen = () => {
    setReopenModalVisible(true);
    setReopenReason('');
  };

  const handleReopenConfirm = () => {
    if (!reopenReason.trim()) {
      message.warning('请输入重新打开的原因');
      return;
    }
    setWorkOrder((prev) => ({
      ...prev,
      status: 'IN_PROGRESS',
    }));
    const newNode: TimelineNode = {
      id: String(Date.now()),
      status: 'processing',
      title: '工单重新打开',
      description: reopenReason,
      operator: user?.realName || '操作人',
      operatorRole: isResident ? '业主' : '管理员',
      time: new Date().toISOString(),
    };
    setTimelineNodes((prev) => [...prev, newNode]);
    setReopenModalVisible(false);
    message.success('工单已重新打开');
  };

  const handleReactivate = () => {
    Modal.confirm({
      title: '重新激活工单',
      content: '确认重新激活此已取消的工单吗？',
      okText: '确认激活',
      cancelText: '取消',
      onOk: () => {
        setWorkOrder((prev) => ({
          ...prev,
          status: 'PENDING',
        }));
        const newNode: TimelineNode = {
          id: String(Date.now()),
          status: 'pending',
          title: '工单重新激活',
          description: '已取消的工单被重新激活',
          operator: user?.realName || '管理员',
          operatorRole: '管理员',
          time: new Date().toISOString(),
        };
        setTimelineNodes((prev) => [...prev, newNode]);
        message.success('工单已重新激活');
      },
    });
  };

  const handleTransfer = () => {
    setAssignModalVisible(true);
    setSelectedSteward('');
  };

  const handleSubmitProgress = () => {
    if (!progressText.trim()) {
      message.warning('请输入进度内容');
      return;
    }
    const newNode: TimelineNode = {
      id: String(Date.now()),
      status: 'processing',
      title: '进度更新',
      description: progressText,
      operator: workOrder.assigneeName || '处理人',
      operatorRole: '维修管家',
      operatorAvatar: workOrder.assigneeAvatar,
      time: new Date().toISOString(),
    };
    setTimelineNodes((prev) => [...prev, newNode]);
    setProgressText('');
    message.success('进度更新成功');
  };

  const handleSubmitRating = (data: { rating: number; comment: string; tags: string[] }) => {
    console.log('提交评价:', data);
    setHasSubmittedRating(true);
    setWorkOrder((prev) => ({
      ...prev,
      satisfaction: data.rating,
      satisfactionComment: data.comment,
      satisfactionTags: data.tags,
    }));
    message.success('评价提交成功，感谢您的反馈！');
  };

  const renderActionButtons = () => {
    const buttons = [];

    if (isResident) {
      if (workOrder.status === 'PENDING') {
        buttons.push(
          <button key="cancel" onClick={handleCancel} className="btn-ghost">
            <XCircle className="w-4 h-4" />
            取消工单
          </button>
        );
      }
      if (workOrder.status === 'COMPLETED' && !hasSubmittedRating) {
        buttons.push(
          <button key="rate" onClick={() => document.getElementById('rating-section')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary">
            <Star className="w-4 h-4" />
            去评价
          </button>
        );
      }
      return buttons;
    }

    switch (workOrder.status) {
      case 'PENDING':
        buttons.push(
          <button key="assign" onClick={handleAssign} className="btn-primary flex items-center gap-2">
            <UserCircle2 className="w-4 h-4" />
            分派工单
          </button>
        );
        buttons.push(
          <button key="cancel" onClick={handleCancel} className="btn-ghost">
            取消
          </button>
        );
        break;
      case 'ASSIGNED':
        if (isStaff || isAdmin) {
          buttons.push(
            <button key="process" onClick={handleProcess} className="btn-primary flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              开始处理
            </button>
          );
        }
        if (isAdmin) {
          buttons.push(
            <button key="transfer" onClick={handleTransfer} className="btn-ghost">
              <RefreshCw className="w-4 h-4" />
              转派
            </button>
          );
        }
        break;
      case 'IN_PROGRESS':
        if (isStaff || isAdmin) {
          buttons.push(
            <button key="complete" onClick={handleComplete} className="btn-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              完成工单
            </button>
          );
        }
        break;
      case 'COMPLETED':
        if (isAdmin) {
          buttons.push(
            <button key="reopen" onClick={handleReopen} className="btn-ghost">
              <RotateCcw className="w-4 h-4" />
              重新打开
            </button>
          );
        }
        break;
      case 'CANCELLED':
        if (isAdmin) {
          buttons.push(
            <button key="reactivate" onClick={handleReactivate} className="btn-primary">
              <RotateCcw className="w-4 h-4" />
              重新激活
            </button>
          );
        }
        break;
      default:
        break;
    }

    return buttons;
  };

  return (
    <div className="p-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg">{workOrder.orderNo}</span>
            <StatusBadge
              status={convertStatus(workOrder.status)}
              category="workorder"
              size="md"
            />
          </div>
        }
        subtitle={workOrder.title}
        showBack
        onBack={handleBack}
        breadcrumb={[
          { title: '首页' },
          { title: '工单管理' },
          { title: '工单详情' },
        ]}
        extra={<div className="flex items-center gap-2">{renderActionButtons()}</div>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'glass-card p-6 border-l-4',
              slaInfo.status === 'normal' && 'border-l-success-500',
              slaInfo.status === 'warning' && 'border-l-warning-500',
              slaInfo.status === 'overdue' && 'border-l-danger-500'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary-400" />
                SLA 服务时效
              </h3>
              <Tag
                color={
                  slaInfo.status === 'normal' ? 'success' :
                  slaInfo.status === 'warning' ? 'warning' : 'error'
                }
                className="!text-xs"
              >
                {slaInfo.status === 'normal' && '正常'}
                {slaInfo.status === 'warning' && '预警'}
                {slaInfo.status === 'overdue' && '已逾期'}
              </Tag>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xs text-neutral-500 mb-1">响应时效要求</div>
                <div className="text-sm font-medium text-white">{slaInfo.responseRequirement}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-neutral-500 mb-1">已用时间</div>
                <div className="text-sm font-medium text-neutral-300">{slaInfo.usedTimeText}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-neutral-500 mb-1">剩余时间</div>
                <div className={cn(
                  'text-sm font-medium',
                  slaInfo.status === 'normal' && 'text-success-400',
                  slaInfo.status === 'warning' && 'text-warning-400',
                  slaInfo.status === 'overdue' && 'text-danger-400'
                )}>
                  {slaInfo.remainingTimeText}
                </div>
              </div>
            </div>

            {!isCompleted && !isCancelled && (
              <Progress
                percent={Math.round(slaInfo.progress)}
                size="small"
                showInfo={false}
                strokeColor={
                  slaInfo.status === 'normal' ? '#10b981' :
                  slaInfo.status === 'warning' ? '#f59e0b' : '#ef4444'
                }
                trailColor="rgba(255,255,255,0.1)"
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <TypeIcon className="w-5 h-5 text-primary-400" />
              工单信息
            </h3>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">{workOrder.title}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm bg-white/5 text-neutral-300">
                    <TypeIcon className="w-4 h-4" />
                    {WORK_ORDER_TYPE[workOrder.type]}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium',
                    workOrder.priority === 'URGENT' && 'bg-danger-500/15 text-danger-400',
                    workOrder.priority === 'HIGH' && 'bg-warning-500/15 text-warning-400',
                    workOrder.priority === 'MEDIUM' && 'bg-primary-500/15 text-primary-400',
                    workOrder.priority === 'LOW' && 'bg-neutral-500/15 text-neutral-400',
                  )}>
                    {workOrder.priority === 'URGENT' && <AlertTriangle className="w-4 h-4" />}
                    {workOrder.priority === 'HIGH' && <AlertCircle className="w-4 h-4" />}
                    {workOrder.priority === 'LOW' && <ArrowUp className="w-4 h-4 rotate-180" />}
                    {WORK_ORDER_PRIORITY[workOrder.priority]}优先级
                  </span>
                </div>
              </div>

              <div className="divider" />

              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-2">问题描述</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {workOrder.description}
                </p>
              </div>

              {workOrder.images && workOrder.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-neutral-300 mb-3">现场图片</h4>
                  <div className="flex gap-3 flex-wrap">
                    {workOrder.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-primary-500/50 transition-all"
                      >
                        <img
                          src={img}
                          alt={`现场图片 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" />
              处理进度
            </h3>
            <WorkOrderTimeline nodes={timelineNodes} />
          </motion.div>

          {workOrder.status === 'IN_PROGRESS' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-400" />
                更新进度
              </h3>
              <div className="space-y-4">
                <TextArea
                  value={progressText}
                  onChange={(e) => setProgressText(e.target.value)}
                  placeholder="请输入进度更新内容..."
                  rows={4}
                  maxLength={500}
                  showCount
                  className="!bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0 resize-none"
                />
                <div className="flex items-center justify-between">
                  <Upload {...uploadProps}>
                    <Button
                      type="text"
                      icon={<ImageIcon className="w-4 h-4" />}
                      className="!text-neutral-400 hover:!text-white"
                    >
                      上传图片
                    </Button>
                  </Upload>
                  <button
                    onClick={handleSubmitProgress}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    提交
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {isCompleted && (
            <motion.div
              id="rating-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-warning-400" />
                服务评价
              </h3>
              {hasSubmittedRating || (!isResident && workOrder.satisfaction) ? (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'w-6 h-6',
                            star <= (workOrder.satisfaction || 0)
                              ? 'fill-warning-400 text-warning-400'
                              : 'fill-none text-neutral-600'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-medium text-white">
                      {workOrder.satisfaction?.toFixed(1) || '0.0'} 分
                    </span>
                    <span className="text-sm text-success-400">感谢您的评价</span>
                  </div>
                  {workOrder.satisfactionTags && workOrder.satisfactionTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {workOrder.satisfactionTags.map((tag) => {
                        const tagLabel = defaultRatingTags.find((t) => t.key === tag)?.label || tag;
                        return (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-success-500/15 text-success-400 border border-success-500/30"
                          >
                            {tagLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {workOrder.satisfactionComment && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">评价内容</div>
                      <p className="text-sm text-neutral-300">{workOrder.satisfactionComment}</p>
                    </div>
                  )}
                </div>
              ) : (
                <SatisfactionRating
                  value={rating}
                  onChange={setRating}
                  comment={comment}
                  onCommentChange={setComment}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  onSubmit={handleSubmitRating}
                  disabled={!isResident}
                  showComment
                  showTags
                  showSubmit={isResident}
                />
              )}
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-5"
          >
            <h4 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-400" />
              位置信息
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">所属小区</span>
                <span className="text-sm text-white">{workOrder.communityName || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">楼栋</span>
                <span className="text-sm text-white">{workOrder.buildingName || '-'}</span>
              </div>
              {workOrder.unitName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">单元</span>
                  <span className="text-sm text-white">{workOrder.unitName}</span>
                </div>
              )}
              {workOrder.roomName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">房号</span>
                  <span className="text-sm text-white">{workOrder.roomName}</span>
                </div>
              )}
              {workOrder.locationDetail && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">位置描述</span>
                  <span className="text-sm text-white">{workOrder.locationDetail}</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="glass-card p-5"
          >
            <h4 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-400" />
              提交人信息
            </h4>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  <DesensitizeText value={workOrder.submitterName} type="name" />
                </div>
                <div className="text-xs text-neutral-500">{USER_ROLE[workOrder.submitterRole as UserRole] || '业主'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-neutral-500" />
              <DesensitizeText value="13812345678" type="phone" />
            </div>
          </motion.div>

          {workOrder.assigneeName && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="glass-card p-5"
            >
              <h4 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary-400" />
                处理人信息
              </h4>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={workOrder.assigneeAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                  alt={workOrder.assigneeName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {workOrder.assigneeName}
                  </div>
                  <div className="text-xs text-neutral-500">物业管家</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['专业负责', '响应迅速'].map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md text-xs bg-primary-500/15 text-primary-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="glass-card p-5"
          >
            <h4 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-400" />
              时间信息
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">创建时间</span>
                <span className="text-sm text-neutral-300">
                  {dayjs(workOrder.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">更新时间</span>
                <span className="text-sm text-neutral-300">
                  {dayjs(workOrder.updatedAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
              {workOrder.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">完成时间</span>
                  <span className="text-sm text-success-400">
                    {dayjs(workOrder.completedAt).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <Modal
        title="分派工单"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        onOk={handleAssignConfirm}
        okText="确认分派"
        cancelText="取消"
        width={600}
      >
        <div className="mt-4">
          <div className="mb-4 p-3 rounded-lg bg-info-500/10 border border-info-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-info-400" />
              <span className="text-sm font-medium text-info-400">智能推荐</span>
            </div>
            <p className="text-xs text-neutral-400">
              推荐 <span className="text-info-300 font-medium">{recommendedSteward.name}</span>：
              该管家具备{recommendedSteward.skills.slice(0, 2).join('、')}等技能，
              距离您{recommendedSteward.distance}公里，
              当前负载{recommendedSteward.load}单，
              预计{recommendedSteward.responseTime}分钟响应
            </p>
          </div>

          <p className="text-sm text-neutral-400 mb-3">请选择要分派的管家：</p>
          <Radio.Group
            value={selectedSteward}
            onChange={(e) => setSelectedSteward(e.target.value)}
            className="w-full"
          >
            <div className="space-y-3">
              {mockStewards.map((steward) => (
                <Radio key={steward.id} value={steward.id} className="!block">
                  <div className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-all',
                    steward.isRecommended && 'border-info-500/50 bg-info-500/5'
                  )}>
                    <img
                      src={steward.avatar}
                      alt={steward.name}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{steward.name}</span>
                        {steward.isRecommended && (
                          <Tag color="cyan" className="!text-xs !py-0 !h-5">
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            智能推荐
                          </Tag>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mb-2">{steward.role}</div>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {steward.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-1.5 py-0.5 rounded text-xs bg-primary-500/15 text-primary-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-neutral-400">
                          <MapPinIcon className="w-3 h-3" />
                          <span>{steward.distance}km</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Gauge className="w-3 h-3" />
                          <span>{steward.load}单/处理中</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Star className="w-3 h-3 text-warning-400 fill-warning-400" />
                          <span>{steward.rating}分</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Radio>
              ))}
            </div>
          </Radio.Group>
        </div>
      </Modal>

      <Modal
        title="重新打开工单"
        open={reopenModalVisible}
        onCancel={() => setReopenModalVisible(false)}
        onOk={handleReopenConfirm}
        okText="确认重新打开"
        cancelText="取消"
      >
        <div className="mt-4">
          <p className="text-sm text-neutral-400 mb-3">请输入重新打开的原因：</p>
          <TextArea
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="请描述重新打开工单的原因..."
            rows={4}
            maxLength={200}
            showCount
            className="!bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0 resize-none"
          />
        </div>
      </Modal>
    </div>
  );
}
