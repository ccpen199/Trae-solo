import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  Filter,
  ChevronDown,
  Flame,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Input, Select, Button, message, Progress, Modal, Form, InputNumber, DatePicker } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import { mockActivities } from '@/mocks/data/activities';
import type { Activity, ActivityStatus, ActivityCategory } from '@/types/entity';

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

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'PUBLISHED', label: '报名中' },
  { value: 'ONGOING', label: '进行中' },
  { value: 'ENDED', label: '已结束' },
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

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

interface ActivityCardProps {
  activity: Activity;
  onClick: () => void;
  onSignUp: () => void;
}

function ActivityCard({ activity, onClick, onSignUp }: ActivityCardProps) {
  const statusInfo = statusConfig[activity.status] || statusConfig.DRAFT;
  const progress = activity.maxParticipants
    ? (activity.currentParticipants / activity.maxParticipants) * 100
    : 0;
  const isFull = activity.maxParticipants
    ? activity.currentParticipants >= activity.maxParticipants
    : false;
  const isOngoing = activity.status === 'ONGOING';

  const getButtonText = () => {
    if (activity.status === 'ENDED') return '已结束';
    if (activity.status === 'CANCELLED') return '已取消';
    if (isFull) return '已满员';
    if (activity.status === 'ONGOING') return '立即参与';
    return '立即报名';
  };

  const getButtonDisabled = () => {
    return (
      activity.status === 'ENDED' ||
      activity.status === 'CANCELLED' ||
      activity.status === 'DRAFT' ||
      isFull
    );
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

      <div className="relative aspect-video overflow-hidden bg-white/5" onClick={onClick}>
        <img
          src={activity.coverImage}
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSignUp();
          }}
          disabled={getButtonDisabled()}
          className={cn(
            'w-full py-2.5 rounded-lg text-sm font-medium transition-all',
            getButtonDisabled()
              ? 'bg-white/5 text-neutral-500 cursor-not-allowed'
              : activity.status === 'ONGOING'
              ? 'bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-400 hover:to-success-500'
              : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500'
          )}
        >
          {getButtonText()}
        </button>
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

export default function ActivityList() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [publishForm] = Form.useForm();

  const filteredActivities = useMemo(() => {
    return mockActivities.filter((activity) => {
      if (category !== 'all' && activity.category !== category) return false;
      if (status !== 'all' && activity.status !== status) return false;
      if (
        searchText &&
        !activity.title.toLowerCase().includes(searchText.toLowerCase()) &&
        !activity.location.toLowerCase().includes(searchText.toLowerCase())
      )
        return false;
      return true;
    });
  }, [searchText, category, status]);

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

  const handlePublishSubmit = () => {
    publishForm.validateFields().then(() => {
      setPublishModalVisible(false);
      message.success('活动发布成功');
      publishForm.resetFields();
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="邻里活动"
        subtitle="参与社区活动，共建美好家园"
        breadcrumb={[{ title: '首页' }, { title: '邻里活动' }]}
        extra={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setPublishModalVisible(true)}
          >
            <Plus className="w-4 h-4" />
            发布活动
          </button>
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">状态:</span>
              </div>
              <Select
                value={status}
                onChange={setStatus}
                options={statusOptions}
                className="!w-32"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </div>
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
        onCancel={() => setPublishModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form form={publishForm} layout="vertical" className="mt-4">
          <Form.Item
            label="活动标题"
            name="title"
            rules={[{ required: true, message: '请输入活动标题' }]}
          >
            <Input placeholder="请输入活动标题" />
          </Form.Item>
          <Form.Item
            label="活动分类"
            name="category"
            rules={[{ required: true, message: '请选择活动分类' }]}
          >
            <Select placeholder="请选择活动分类" options={publishCategoryOptions} />
          </Form.Item>
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
                />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            label="活动地点"
            name="location"
            rules={[{ required: true, message: '请输入活动地点' }]}
          >
            <Input placeholder="请输入活动地点" />
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
            >
              <InputNumber min={0} className="!w-full" placeholder="免费请填0" addonAfter="元" />
            </Form.Item>
          </div>
          <Form.Item
            label="活动描述"
            name="description"
            rules={[{ required: true, message: '请输入活动描述' }]}
          >
            <TextArea rows={4} placeholder="请输入活动描述" />
          </Form.Item>
          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => setPublishModalVisible(false)}>取消</Button>
            <Button type="primary" onClick={handlePublishSubmit}>发布活动</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
