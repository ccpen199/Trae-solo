import { useState } from 'react';
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
import { Button, Input, message, Upload } from 'antd';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SlaCountdown } from '@/components/common/SlaCountdown';
import { DesensitizeText } from '@/components/common/DesensitizeText';
import { WorkOrderTimeline, type TimelineNode } from '@/components/business/WorkOrderTimeline';
import { SatisfactionRating } from '@/components/business/SatisfactionRating';
import { cn } from '@/lib/utils';
import type { WorkOrder, WorkOrderStatus, WorkOrderType, WorkOrderPriority } from '@/types/entity';
import { WORK_ORDER_TYPE, WORK_ORDER_PRIORITY } from '@/constants/enums';

const { TextArea } = Input;

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

const mockWorkOrder: WorkOrder = {
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
};

const mockTimelineNodes: TimelineNode[] = [
  {
    id: '1',
    status: 'pending',
    title: '工单已提交',
    description: '业主提交了空调维修工单，描述空调不制冷问题',
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
    description: '系统自动分派给维修工程师李维修处理',
    operator: '系统',
    time: dayjs().subtract(1.5, 'hour').toISOString(),
  },
  {
    id: '3',
    status: 'processing',
    title: '维修中',
    description: '维修师傅已上门检查，初步判断是制冷剂不足，正在补充制冷剂中',
    operator: '李维修',
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
  const [workOrder, setWorkOrder] = useState<WorkOrder>(mockWorkOrder);
  const [timelineNodes, setTimelineNodes] = useState<TimelineNode[]>(mockTimelineNodes);
  const [progressText, setProgressText] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['fast', 'professional', 'friendly']);

  const isCompleted = workOrder.status === 'COMPLETED';
  const TypeIcon = typeIcons[workOrder.type];

  const handleBack = () => {
    message.info('返回工单列表');
  };

  const handleAssign = () => {
    setWorkOrder((prev) => ({ ...prev, status: 'ASSIGNED', assigneeName: '李维修' }));
    const newNode: TimelineNode = {
      id: String(Date.now()),
      status: 'assigned',
      title: '工单已分派',
      description: '手动分派给维修工程师李维修',
      operator: '管理员',
      time: new Date().toISOString(),
    };
    setTimelineNodes((prev) => [...prev, newNode]);
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
    setWorkOrder((prev) => ({
      ...prev,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    }));
    const newNode: TimelineNode = {
      id: String(Date.now()),
      status: 'completed',
      title: '工单已完成',
      description: '空调已修复，制冷效果正常，业主确认满意',
      operator: '李维修',
      time: new Date().toISOString(),
    };
    setTimelineNodes((prev) => [...prev, newNode]);
    message.success('工单已完成');
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
    </div>
  );
}
