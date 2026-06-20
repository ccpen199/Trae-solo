import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Filter,
  Flame,
  Plus,
  Settings,
  QrCode,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Image,
  Download,
  UserCheck,
  Eye,
  BarChart3,
} from 'lucide-react';
import {
  Input,
  Select,
  Button,
  message,
  Progress,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Switch,
  Table,
  Tag,
  Space,
  Tabs,
  Avatar,
} from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import { mockActivities, mockActivityParticipants } from '@/mocks/data/activities';
import { useUserStore } from '@/store/userStore';
import type { Activity, ActivityStatus, ActivityCategory, ActivityParticipant, ActivityParticipantStatus } from '@/types/entity';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const categoryOptions = [
  { value: 'all', label: '全部分类' },
  { value: 'CULTURE', label: '文化活动' },
  { value: 'SPORTS', label: '体育运动' },
  { value: 'EDUCATION', label: '教育培训' },
  { value: 'CHARITY', label: '公益慈善' },
  { value: 'OTHER', label: '其他活动' },
];

const tabItems = [
  { key: 'all', label: '全部' },
  { key: 'PUBLISHED', label: '报名中' },
  { key: 'ONGOING', label: '进行中' },
  { key: 'ENDED', label: '已结束' },
  { key: 'CANCELLED', label: '已取消' },
];

const categoryLabels: Record<string, string> = {
  CULTURE: '文化活动',
  SPORTS: '体育运动',
  EDUCATION: '教育培训',
  CHARITY: '公益慈善',
  OTHER: '其他活动',
};

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  PUBLISHED: {
    label: '报名中',
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/15',
    dotColor: 'bg-primary-500',
  },
  ONGOING: {
    label: '进行中',
    color: 'text-success-400',
    bgColor: 'bg-success-500/15',
    dotColor: 'bg-success-500',
  },
  ENDED: {
    label: '已结束',
    color: 'text-neutral-400',
    bgColor: 'bg-neutral-500/15',
    dotColor: 'bg-neutral-500',
  },
  DRAFT: {
    label: '草稿',
    color: 'text-neutral-500',
    bgColor: 'bg-neutral-500/10',
    dotColor: 'bg-neutral-500',
  },
  CANCELLED: {
    label: '已取消',
    color: 'text-danger-400',
    bgColor: 'bg-danger-500/15',
    dotColor: 'bg-danger-500',
  },
};

const participantStatusConfig: Record<ActivityParticipantStatus, { label: string; color: string }> = {
  PENDING_REVIEW: { label: '待审核', color: 'warning' },
  REGISTERED: { label: '已通过', color: 'success' },
  ATTENDED: { label: '已签到', color: 'success' },
  CANCELLED: { label: '已取消', color: 'default' },
  REJECTED: { label: '已拒绝', color: 'error' },
};

const defaultCoverImage = 'https://api.dicebear.com/7.x/shapes/svg?seed=default-activity';

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

function formatDateTimeFull(dateStr: string) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

interface ActivityCardProps {
  activity: Activity;
  onClick: () => void;
  onSignUp: () => void;
  onManage: () => void;
  isAdmin: boolean;
}

function ActivityCard({ activity, onClick, onSignUp, onManage, isAdmin }: ActivityCardProps) {
  const statusInfo = statusConfig[activity.status] || statusConfig.DRAFT;
  const progress = activity.maxParticipants
    ? (activity.currentParticipants / activity.maxParticipants) * 100
    : 0;
  const isFull = activity.maxParticipants
    ? activity.currentParticipants >= activity.maxParticipants
    : false;
  const isOngoing = activity.status === 'ONGOING';

  const renderActionButtons = () => {
    if (isAdmin) {
      return (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onManage();
            }}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
          >
            <Settings className="w-4 h-4" />
            管理
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500 transition-all flex items-center justify-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            详情
          </button>
        </div>
      );
    }

    switch (activity.status) {
      case 'PUBLISHED':
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSignUp();
              }}
              disabled={isFull}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                isFull
                  ? 'bg-white/5 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500'
              )}
            >
              <UserCheck className="w-4 h-4" />
              {isFull ? '已满员' : '立即报名'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              查看详情
            </button>
          </div>
        );
      case 'ONGOING':
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSignUp();
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-400 hover:to-success-500 transition-all flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              签到核销
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              查看详情
            </button>
          </div>
        );
      case 'ENDED':
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-400 hover:to-accent-500 transition-all flex items-center justify-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              查看报告
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              查看详情
            </button>
          </div>
        );
      case 'CANCELLED':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            查看详情
          </button>
        );
      default:
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-white/5 text-neutral-500 cursor-not-allowed"
            disabled
          >
            草稿
          </button>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="glass-card-hover overflow-hidden relative"
    >
      {isOngoing && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-success-500/90 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            <Flame className="w-3 h-3" />
            火热进行中
          </div>
        </div>
      )}

      {activity.needReview && activity.status === 'PUBLISHED' && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-warning-500/90 backdrop-blur-sm rounded-full text-white text-xs font-medium">
            <Clock className="w-3 h-3" />
            需审核
          </div>
        </div>
      )}

      <div className="relative aspect-video overflow-hidden bg-white/5" onClick={onClick}>
        <img
          src={activity.coverImage || defaultCoverImage}
          alt={activity.title}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                statusInfo.bgColor,
                statusInfo.color
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.dotColor)} />
              {statusInfo.label}
            </span>
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
              {categoryLabels[activity.category] || '其他'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white line-clamp-1">
            {activity.title}
          </h3>
        </div>
      </div>

      <div className="p-4" onClick={onClick}>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {formatDateTime(activity.startTime)} -{' '}
              {formatDateTime(activity.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{activity.location}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-1 text-neutral-400">
              <Users className="w-4 h-4" />
              <span>
                <span className="text-white font-medium">
                  {activity.currentParticipants}
                </span>
                {activity.maxParticipants && (
                  <>
                    <span className="text-neutral-600"> / </span>
                    <span>{activity.maxParticipants}人</span>
                  </>
                )}
              </span>
            </div>
            {activity.maxParticipants && (
              <span
                className={cn(
                  'text-xs',
                  progress >= 90 ? 'text-danger-400' : 'text-neutral-500'
                )}
              >
                {isFull ? '已满员' : `剩余${activity.maxParticipants - activity.currentParticipants}名额`}
              </span>
            )}
          </div>
          {activity.maxParticipants && (
            <Progress
              percent={progress}
              showInfo={false}
              size="small"
              strokeColor={
                progress >= 90
                  ? '#EF4444'
                  : progress >= 60
                  ? '#F59E0B'
                  : '#10B981'
              }
              strokeWidth={4}
              className="!min-w-0"
            />
          )}
        </div>

        {renderActionButtons()}
      </div>
    </motion.div>
  );
}

const publishCategoryOptions = [
  { value: 'CULTURE', label: '文化活动' },
  { value: 'SPORTS', label: '体育运动' },
  { value: 'EDUCATION', label: '教育培训' },
  { value: 'CHARITY', label: '公益慈善' },
  { value: 'OTHER', label: '其他' },
];

function QrCodeSvg() {
  const cells = 21;
  const size = 168;
  const cellSize = size / cells;
  const pattern: number[][] = [];
  for (let r = 0; r < cells; r++) {
    const row: number[] = [];
    for (let c = 0; c < cells; c++) {
      const inFinder =
        (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
      if (inFinder) {
        const lr = r < 7 ? r : r >= cells - 7 ? r - (cells - 7) : r;
        const lc = c < 7 ? c : c >= cells - 7 ? c - (cells - 7) : c;
        row.push(lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) ? 1 : 0);
      } else {
        row.push(Math.random() > 0.5 ? 1 : 0);
      }
    }
    pattern.push(row);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pattern.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#000" />
          ) : null
        )
      )}
    </svg>
  );
}

const modalBodyStyle = {
  background: '#0f172a',
  color: '#fff',
};

export default function ActivityList() {
  const navigate = useNavigate();
  const { user, hasAnyRole } = useUserStore();
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [publishForm] = Form.useForm();
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [coverImagePreview, setCoverImagePreview] = useState(defaultCoverImage);

  const isAdmin = hasAnyRole(['SUPER_ADMIN', 'COMMUNITY_ADMIN']);

  const filteredActivities = useMemo(() => {
    return mockActivities.filter((activity) => {
      if (activeTab !== 'all' && activity.status !== activeTab) return false;
      if (category !== 'all' && activity.category !== category) return false;
      if (
        searchText &&
        !activity.title.toLowerCase().includes(searchText.toLowerCase()) &&
        !activity.location.toLowerCase().includes(searchText.toLowerCase())
      )
        return false;
      return true;
    });
  }, [searchText, category, activeTab]);

  const handleActivityClick = (activity: Activity) => {
    navigate(`/activity/${activity.id}`);
  };

  const handleSignUp = (activity: Activity) => {
    if (activity.status === 'ENDED') {
      message.info('活动已结束');
    } else if (activity.maxParticipants && activity.currentParticipants >= activity.maxParticipants) {
      message.warning('活动已报满');
    } else {
      navigate(`/activity/${activity.id}`);
    }
  };

  const handleManage = (activity: Activity) => {
    setCurrentActivity(activity);
    const activityParticipants = mockActivityParticipants.filter(
      (p) => p.activityId === activity.id
    );
    setParticipants([...activityParticipants]);
    setManageModalVisible(true);
  };

  const handlePublishSubmit = () => {
    publishForm.validateFields().then(() => {
      setPublishModalVisible(false);
      message.success('活动发布成功');
      publishForm.resetFields();
      setCoverImagePreview(defaultCoverImage);
    });
  };

  const handleReview = (participantId: string, action: 'approve' | 'reject') => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? {
              ...p,
              status: action === 'approve' ? 'REGISTERED' : 'REJECTED',
              reviewedAt: new Date().toISOString(),
              reviewerName: user?.realName || '管理员',
            }
          : p
      )
    );
    message.success(action === 'approve' ? '已通过报名' : '已拒绝报名');
  };

  const handleCheckIn = (participantId: string, isCheckIn: boolean) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? {
              ...p,
              status: isCheckIn ? 'ATTENDED' : 'REGISTERED',
              attendedAt: isCheckIn ? new Date().toISOString() : undefined,
            }
          : p
      )
    );
    message.success(isCheckIn ? '签到成功' : '已取消签到');
  };

  const handleExport = () => {
    if (!currentActivity) return;
    message.success(`已导出 ${currentActivity.title} 报名名单`);
  };

  const handleCoverImageUpload = () => {
    const mockImages = [
      'https://api.dicebear.com/7.x/shapes/svg?seed=cover1',
      'https://api.dicebear.com/7.x/shapes/svg?seed=cover2',
      'https://api.dicebear.com/7.x/shapes/svg?seed=cover3',
    ];
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    setCoverImagePreview(randomImage);
    message.success('封面图上传成功');
  };

  const participantColumns = [
    {
      title: '姓名',
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string, record: ActivityParticipant) => (
        <div className="flex items-center gap-2">
          <Avatar size={32} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.userName}`} />
          <span className="text-white">{text}</span>
        </div>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => <span className="text-neutral-300">{text}</span>,
    },
    {
      title: '报名时间',
      dataIndex: 'signedUpAt',
      key: 'signedUpAt',
      render: (text: string) => <span className="text-neutral-400 text-sm">{formatDateTimeFull(text)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ActivityParticipantStatus) => {
        const config = participantStatusConfig[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ActivityParticipant) => {
        const actions: JSX.Element[] = [];

        if (record.status === 'PENDING_REVIEW') {
          actions.push(
            <Button
              key="approve"
              type="link"
              size="small"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={() => handleReview(record.id, 'approve')}
              className="!text-success-400 !p-0"
            >
              通过
            </Button>
          );
          actions.push(
            <Button
              key="reject"
              type="link"
              size="small"
              danger
              icon={<XCircle className="w-3.5 h-3.5" />}
              onClick={() => handleReview(record.id, 'reject')}
              className="!p-0"
            >
              拒绝
            </Button>
          );
        }

        if (record.status === 'REGISTERED' && currentActivity?.status === 'ONGOING') {
          actions.push(
            <Button
              key="checkin"
              type="link"
              size="small"
              icon={<QrCode className="w-3.5 h-3.5" />}
              onClick={() => handleCheckIn(record.id, true)}
              className="!text-primary-400 !p-0"
            >
              签到
            </Button>
          );
        }

        if (record.status === 'ATTENDED') {
          actions.push(
            <Button
              key="cancel-checkin"
              type="link"
              size="small"
              onClick={() => handleCheckIn(record.id, false)}
              className="!text-neutral-400 !p-0"
            >
              取消签到
            </Button>
          );
        }

        return <Space size="small">{actions}</Space>;
      },
    },
  ];

  const pendingCount = participants.filter((p) => p.status === 'PENDING_REVIEW').length;
  const registeredCount = participants.filter((p) => p.status === 'REGISTERED').length;
  const attendedCount = participants.filter((p) => p.status === 'ATTENDED').length;

  return (
    <div className="p-6">
      <PageHeader
        title="邻里活动"
        subtitle="参与社区活动，共建美好家园"
        breadcrumb={[{ title: '首页' }, { title: '邻里活动' }]}
        extra={
          isAdmin && (
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setPublishModalVisible(true)}
            >
              <Plus className="w-4 h-4" />
              发布活动
            </button>
          )
        }
      />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="搜索活动名称、地点..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="!pl-10 !bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-500">分类:</span>
              </div>
              <Select
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                className="!w-32 !bg-white/5"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </div>
          </div>

          <div className="mt-4">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className="!mb-0 activity-tabs"
            />
          </div>
        </motion.div>

        {filteredActivities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ActivityCard
                  activity={activity}
                  onClick={() => handleActivityClick(activity)}
                  onSignUp={() => handleSignUp(activity)}
                  onManage={() => handleManage(activity)}
                  isAdmin={isAdmin}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card"
          >
            <EmptyState
              type="search"
              title="未找到相关活动"
              description="试试调整搜索关键词或筛选条件"
            />
          </motion.div>
        )}
      </div>

      <Modal
        title="发布活动"
        open={publishModalVisible}
        onCancel={() => {
          setPublishModalVisible(false);
          publishForm.resetFields();
          setCoverImagePreview(defaultCoverImage);
        }}
        footer={null}
        width={640}
        bodyStyle={modalBodyStyle}
        styles={{
          content: { background: '#0f172a' },
          header: { background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.1)' },
        }}
        className="dark-modal"
      >
        <Form form={publishForm} layout="vertical" className="mt-4">
          <Form.Item label="活动封面图">
            <div className="flex items-start gap-4">
              <div className="w-40 h-28 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                <img
                  src={coverImagePreview}
                  alt="封面预览"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <Button
                  icon={<Upload className="w-4 h-4" />}
                  onClick={handleCoverImageUpload}
                  className="!mb-2"
                >
                  上传封面图
                </Button>
                <p className="text-xs text-neutral-500">
                  建议尺寸：800x450，支持 JPG、PNG 格式
                </p>
              </div>
            </div>
          </Form.Item>

          <Form.Item
            label="活动标题"
            name="title"
            rules={[{ required: true, message: '请输入活动标题' }]}
          >
            <Input placeholder="请输入活动标题" className="!bg-white/5 !border-white/10 !text-white" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="活动分类"
              name="category"
              rules={[{ required: true, message: '请选择活动分类' }]}
            >
              <Select placeholder="请选择活动分类" options={publishCategoryOptions} />
            </Form.Item>
            <Form.Item
              label="活动地点"
              name="location"
              rules={[{ required: true, message: '请输入活动地点' }]}
            >
              <Input placeholder="请输入活动地点" className="!bg-white/5 !border-white/10 !text-white" />
            </Form.Item>
          </div>

          <Form.Item label="活动时间" required>
            <Input.Group compact>
              <Form.Item
                name="startTime"
                noStyle
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <DatePicker
                  showTime
                  placeholder="开始时间"
                  style={{ width: '50%' }}
                  className="!bg-white/5"
                />
              </Form.Item>
              <Form.Item
                name="endTime"
                noStyle
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <DatePicker
                  showTime
                  placeholder="结束时间"
                  style={{ width: '50%' }}
                  className="!bg-white/5"
                />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item
            label="报名截止时间"
            name="registrationDeadline"
          >
            <DatePicker
              showTime
              placeholder="请选择报名截止时间"
              className="!w-full !bg-white/5"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="最大人数"
              name="maxParticipants"
              rules={[{ required: true, message: '请输入最大人数' }]}
            >
              <InputNumber min={1} className="!w-full" placeholder="请输入最大人数" />
            </Form.Item>
            <Form.Item
              label="报名费用"
              name="fee"
              initialValue={0}
            >
              <InputNumber min={0} className="!w-full" placeholder="免费请填0" addonAfter="元" />
            </Form.Item>
          </div>

          <Form.Item
            label="需要报名审核"
            name="needReview"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
          </Form.Item>

          <Form.Item
            label="活动描述"
            name="description"
            rules={[{ required: true, message: '请输入活动描述' }]}
          >
            <TextArea rows={4} placeholder="请输入活动描述" className="!bg-white/5 !border-white/10 !text-white" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => {
              setPublishModalVisible(false);
              publishForm.resetFields();
              setCoverImagePreview(defaultCoverImage);
            }}>
              取消
            </Button>
            <Button type="primary" onClick={handlePublishSubmit}>发布活动</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-400" />
            <span>活动管理 - {currentActivity?.title}</span>
          </div>
        }
        open={manageModalVisible}
        onCancel={() => setManageModalVisible(false)}
        footer={null}
        width={900}
        bodyStyle={modalBodyStyle}
        styles={{
          content: { background: '#0f172a' },
          header: { background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.1)' },
        }}
        className="dark-modal"
      >
        {currentActivity && (
          <div className="mt-4">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-white mb-1">{participants.length}</p>
                <p className="text-sm text-neutral-400">总报名人数</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-warning-400 mb-1">{pendingCount}</p>
                <p className="text-sm text-neutral-400">待审核</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-primary-400 mb-1">{registeredCount}</p>
                <p className="text-sm text-neutral-400">已通过</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-success-400 mb-1">{attendedCount}</p>
                <p className="text-sm text-neutral-400">已签到</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-white">报名人员列表</h3>
              <div className="flex items-center gap-2">
                <Button
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleExport}
                  size="small"
                >
                  导出名单
                </Button>
                <Button
                  icon={<QrCode className="w-4 h-4" />}
                  type="primary"
                  size="small"
                  onClick={() => message.info('签到二维码功能')}
                >
                  签到二维码
                </Button>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden border border-white/10">
              <Table
                dataSource={participants}
                columns={participantColumns}
                rowKey="id"
                size="small"
                pagination={{
                  pageSize: 5,
                  className: '!bg-transparent',
                }}
                className="activity-participants-table"
              />
            </div>

            {pendingCount > 0 && (
              <div className="mt-4 p-4 bg-warning-500/10 border border-warning-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning-400">
                      有 {pendingCount} 个报名等待审核
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      请及时处理待审核的报名申请，审核通过后用户才能参与活动
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .dark-modal .ant-modal-content {
          background: #0f172a !important;
        }
        .dark-modal .ant-modal-header {
          background: #0f172a !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        }
        .dark-modal .ant-modal-title {
          color: #fff !important;
        }
        .dark-modal .ant-modal-close {
          color: rgba(255,255,255,0.5) !important;
        }
        .dark-modal .ant-modal-close:hover {
          color: #fff !important;
        }
        .dark-modal .ant-form-item-label > label {
          color: #e2e8f0 !important;
        }
        .dark-modal .ant-input,
        .dark-modal .ant-input-number,
        .dark-modal .ant-select-selector,
        .dark-modal .ant-picker {
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: #fff !important;
        }
        .dark-modal .ant-input::placeholder,
        .dark-modal .ant-picker-input > input::placeholder {
          color: rgba(255,255,255,0.3) !important;
        }
        .dark-modal .ant-input-number-input {
          color: #fff !important;
        }
        .dark-modal .ant-select-arrow {
          color: rgba(255,255,255,0.5) !important;
        }
        .dark-modal .ant-table {
          background: rgba(255,255,255,0.02) !important;
        }
        .dark-modal .ant-table-thead > tr > th {
          background: rgba(255,255,255,0.05) !important;
          color: #e2e8f0 !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        }
        .dark-modal .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        }
        .dark-modal .ant-table-tbody > tr:hover > td {
          background: rgba(255,255,255,0.05) !important;
        }
        .dark-modal .ant-pagination-item {
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .dark-modal .ant-pagination-item a {
          color: #e2e8f0 !important;
        }
        .dark-modal .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .dark-modal .ant-pagination-item-active a {
          color: #fff !important;
        }
        .dark-modal .ant-pagination-prev button,
        .dark-modal .ant-pagination-next button {
          color: #e2e8f0 !important;
        }
        .activity-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
        }
        .activity-tabs .ant-tabs-tab {
          color: rgba(255,255,255,0.5) !important;
        }
        .activity-tabs .ant-tabs-tab-active {
          color: #fff !important;
        }
        .activity-tabs .ant-tabs-ink-bar {
          background: #3b82f6 !important;
        }
      `}</style>
    </div>
  );
}
