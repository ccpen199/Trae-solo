import { useState } from 'react';
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
} from 'lucide-react';
import { Button, Input, message, Upload, Modal, Radio } from 'antd';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SlaCountdown } from '@/components/common/SlaCountdown';
import { DesensitizeText } from '@/components/common/DesensitizeText';
import { WorkOrderTimeline, type TimelineNode } from '@/components/business/WorkOrderTimeline';
import { SatisfactionRating } from '@/components/business/SatisfactionRating';
import { cn } from '@/utils/cn';
import { EmptyState } from '@/components/common/EmptyState';
import type { WorkOrder, WorkOrderStatus, WorkOrderType, WorkOrderPriority } from '@/types/entity';
import { WORK_ORDER_TYPE, WORK_ORDER_PRIORITY } from '@/constants/enums';

const { TextArea } = Input;

const mockStewards = [
  { id: 's1', name: '赵管家', role: '综合管家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s1', skills: ['综合服务', '投诉处理'] },
  { id: 's2', name: '钱财务', role: '财务管家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s2', skills: ['财务咨询', '缴费服务'] },
  { id: 's3', name: '吴维修', role: '维修管家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s3', skills: ['空调维修', '水电维修'] },
  { id: 's4', name: '保安王', role: '安保管家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s4', skills: ['安保巡逻', '停车管理'] },
  { id: 's5', name: '前台李', role: '前台管家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=s5', skills: ['前台接待', '门禁管理'] },
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
    submitterId: 'u1',
    submitterName: '张三',
    assigneeId: 's1',
    assigneeName: '李维修',
    communityId: 'c1',
    buildingId: 'b1',
    roomId: 'r1',
    slaDeadline: dayjs().add(3, 'hour').toISOString(),
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    updatedAt: dayjs().subtract(30, 'minute').toISOString(),
  },
  {
    id: '2',
    orderNo: 'WO20240115002',
    title: '楼道灯坏了',
    description: '3单元5楼的楼道灯不亮了，晚上走路很不方便',
    type: 'REPAIR',
    status: 'PENDING',
    priority: 'HIGH',
    submitterId: 'u2',
    submitterName: '李四',
    communityId: 'c1',
    buildingId: 'b1',
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
    submitterId: 'u3',
    submitterName: '王五',
    assigneeId: 's1',
    assigneeName: '赵管家',
    communityId: 'c1',
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
    submitterId: 'u4',
    submitterName: '赵六',
    assigneeId: 's2',
    assigneeName: '钱财务',
    communityId: 'c1',
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
    submitterId: 'u5',
    submitterName: '孙七',
    assigneeId: 's1',
    assigneeName: '赵管家',
    communityId: 'c1',
    slaDeadline: dayjs().subtract(1, 'day').toISOString(),
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
    completedAt: dayjs().subtract(1, 'day').toISOString(),
  },
];

const typeIcons: Record<WorkOrderType, typeof Wrench> = {
  REPAIR: Wrench,
  COMPLAINT: MessageSquare,
  CONSULT: HelpCircle,
  SUGGESTION: Lightbulb,
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
    time: dayjs().subtract(1.5, 'hour').toISOString(),
  },
  {
    id: '3',
    status: 'processing',
    title: '处理中',
    description: '维修师傅已上门检查',
    operator: '维修工程师',
    operatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
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

  const [workOrder, setWorkOrder] = useState<WorkOrder>(foundWorkOrder || mockWorkOrders[0]);
  const [timelineNodes, setTimelineNodes] = useState<TimelineNode[]>(defaultTimelineNodes);
  const [progressText, setProgressText] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['fast', 'professional', 'friendly']);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedSteward, setSelectedSteward] = useState<string>('');

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
    setWorkOrder((prev) => ({ ...prev, status: 'ASSIGNED', assigneeId: selectedSteward, assigneeName: steward?.name || '' }));
    const newNode: TimelineNode = {
      id: String(Date.now()),
      status: 'assigned',
      title: '工单已分派',
      description: `手动分派给${steward?.role || '管家'}${steward?.name || ''}处理`,
      operator: '管理员',
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
      operator: '李维修',
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
          time: new Date().toISOString(),
        };
        setTimelineNodes((prev) => [...prev, newNode]);
        message.success('工单已完成');
      },
    });
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
      operator: '李维修',
      time: new Date().toISOString(),
    };
    setTimelineNodes((prev) => [...prev, newNode]);
    setProgressText('');
    message.success('进度更新成功');
  };

  const handleSubmitRating = (data: { rating: number; comment: string; tags: string[] }) => {
    console.log('提交评价:', data);
    message.success('评价提交成功，感谢您的反馈！');
  };

  const renderActionButtons = () => {
    switch (workOrder.status) {
      case 'PENDING':
        return (
          <button onClick={handleAssign} className="btn-primary flex items-center gap-2">
            <UserCircle2 className="w-4 h-4" />
            分派工单
          </button>
        );
      case 'ASSIGNED':
        return (
          <button onClick={handleProcess} className="btn-primary flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            开始处理
          </button>
        );
      case 'IN_PROGRESS':
        return (
          <button onClick={handleComplete} className="btn-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            完成工单
          </button>
        );
      default:
        return null;
    }
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

              <div>
                <h4 className="text-sm font-medium text-neutral-300 mb-3">现场图片</h4>
                <div className="flex gap-3 flex-wrap">
                  {[
                    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&h=200&fit=crop',
                    'https://images.unsplash.com/photo-1631552939727-1b02b8b6753e?w=200&h=200&fit=crop',
                    'https://images.unsplash.com/photo-1580910051070-8f35eea67f9e?w=200&h=200&fit=crop',
                  ].map((img, idx) => (
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-warning-400" />
                服务评价
              </h3>
              <SatisfactionRating
                value={rating}
                onChange={setRating}
                comment={comment}
                onCommentChange={setComment}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                onSubmit={handleSubmitRating}
                disabled={false}
                showComment
                showTags
                showSubmit
              />
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
                <span className="text-sm text-white">阳光花园</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">楼栋</span>
                <span className="text-sm text-white">1号楼</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">单元</span>
                <span className="text-sm text-white">2单元</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">房号</span>
                <span className="text-sm text-white">501室</span>
              </div>
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
                <div className="text-xs text-neutral-500">业主</div>
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
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                  alt={workOrder.assigneeName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {workOrder.assigneeName}
                  </div>
                  <div className="text-xs text-neutral-500">维修工程师</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['空调维修', '水电维修', '家电维修'].map((skill) => (
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
              <CalendarClock className="w-4 h-4 text-primary-400" />
              SLA信息
            </h4>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-neutral-500 mb-2">剩余时间</div>
                <SlaCountdown
                  deadline={workOrder.slaDeadline}
                  completed={isCompleted}
                  size="md"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">截止时间</span>
                <span className="text-sm text-white">
                  {dayjs(workOrder.slaDeadline).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">创建时间</span>
                <span className="text-sm text-neutral-300">
                  {dayjs(workOrder.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
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
        width={520}
      >
        <div className="mt-4">
          <p className="text-sm text-neutral-400 mb-4">请选择要分派的管家：</p>
          <Radio.Group
            value={selectedSteward}
            onChange={(e) => setSelectedSteward(e.target.value)}
            className="w-full"
          >
            <div className="space-y-3">
              {mockStewards.map((steward) => (
                <Radio key={steward.id} value={steward.id} className="!block">
                  <div className="flex items-center gap-3">
                    <img
                      src={steward.avatar}
                      alt={steward.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{steward.name}</div>
                      <div className="text-xs text-neutral-500">{steward.role}</div>
                      <div className="flex gap-1.5 mt-1">
                        {steward.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-1.5 py-0.5 rounded text-xs bg-primary-500/15 text-primary-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Radio>
              ))}
            </div>
          </Radio.Group>
        </div>
      </Modal>
    </div>
  );
}
