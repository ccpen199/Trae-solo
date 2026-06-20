import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  User,
  Phone,
  Share2,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  QrCode,
  X,
  Building2,
  DollarSign,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { Button, Input, InputNumber, message, Modal, Progress, Form } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import { mockActivities, mockActivityParticipants } from '@/mocks/data/activities';
import type { Activity } from '@/types/entity';

const organizerInfo = {
  name: '阳光花园社区居委会',
  avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=organizer',
  phone: '010-88888888',
  address: '阳光花园社区活动中心',
};

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

const categoryLabels: Record<string, string> = {
  CULTURE: '文化活动',
  SPORTS: '体育运动',
  EDUCATION: '教育培训',
  CHARITY: '公益慈善',
  OTHER: '其他活动',
};

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getStatusBadgeProps(status: string) {
  switch (status) {
    case 'PUBLISHED':
      return { status: 'upcoming' as const, category: 'activity' as const };
    case 'ONGOING':
      return { status: 'ongoing' as const, category: 'activity' as const };
    case 'ENDED':
      return { status: 'ended' as const, category: 'activity' as const };
    case 'CANCELLED':
      return { status: 'cancelled' as const, category: 'activity' as const };
    default:
      return { status: 'upcoming' as const, category: 'activity' as const };
  }
}

export default function ActivityDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const activityDetail = mockActivities.find((a) => a.id === id);
  const participants = activityDetail
    ? mockActivityParticipants.filter((p) => p.activityId === activityDetail.id)
    : [];

  const activityImages = activityDetail
    ? [
        activityDetail.coverImage || 'https://api.dicebear.com/7.x/shapes/svg?seed=act1',
        'https://api.dicebear.com/7.x/shapes/svg?seed=act2',
        'https://api.dicebear.com/7.x/shapes/svg?seed=act3',
        'https://api.dicebear.com/7.x/shapes/svg?seed=act4',
      ]
    : [];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSignUpModalVisible, setIsSignUpModalVisible] = useState(false);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [form] = Form.useForm();

  if (!activityDetail) {
    return (
      <div className="p-6">
        <PageHeader
          title="活动详情"
          breadcrumb={[{ title: '首页' }, { title: '邻里活动' }, { title: '活动详情' }]}
          showBack
          onBack={() => navigate(-1)}
        />
        <div className="max-w-5xl mx-auto">
          <EmptyState
            type="search"
            title="活动不存在"
            description="未找到该活动，请返回活动列表查看"
          />
        </div>
      </div>
    );
  }

  const progress = activityDetail.maxParticipants
    ? (activityDetail.currentParticipants / activityDetail.maxParticipants) * 100
    : 0;
  const isFull = activityDetail.maxParticipants
    ? activityDetail.currentParticipants >= activityDetail.maxParticipants
    : false;
  const remainingSpots = activityDetail.maxParticipants
    ? activityDetail.maxParticipants - activityDetail.currentParticipants
    : 0;
  const isOngoing = activityDetail.status === 'ONGOING';
  const isEnded = activityDetail.status === 'ENDED';

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? activityImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === activityImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleSignUp = () => {
    if (isEnded) {
      message.info('活动已结束');
      return;
    }
    if (isFull) {
      message.warning('活动已报满');
      return;
    }
    if (isSignUp) {
      Modal.confirm({
        title: '取消报名',
        content: '确定要取消报名吗？取消后可重新报名。',
        okText: '确认取消',
        cancelText: '再想想',
        onOk: () => {
          setIsSignUp(false);
          message.success('已取消报名');
        },
      });
    } else {
      setIsSignUpModalVisible(true);
    }
  };

  const handleSignUpSubmit = () => {
    form.validateFields().then(() => {
      setIsSignUpModalVisible(false);
      setIsSignUp(true);
      message.success('报名成功！');
      form.resetFields();
    });
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    message.info(isFavorite ? '已取消收藏' : '已收藏');
  };

  const handleShare = () => {
    message.info('分享功能');
  };

  const getButtonText = () => {
    if (isEnded) return '活动已结束';
    if (isFull) return '名额已满';
    if (isSignUp) return '取消报名';
    return '立即报名';
  };

  const getButtonType = () => {
    if (isEnded || isFull) return 'disabled';
    if (isSignUp) return 'outline';
    return 'primary';
  };

  return (
    <div className="p-6">
      <PageHeader
        title="活动详情"
        breadcrumb={[
          { title: '首页' },
          { title: '邻里活动' },
          { title: '活动详情' },
        ]}
        showBack
        onBack={() => navigate(-1)}
        extra={
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={cn(
                'btn-ghost flex items-center gap-2',
                isFavorite && '!text-danger-400 !border-danger-500/30'
              )}
            >
              <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
              收藏
            </button>
            <button
              onClick={handleShare}
              className="btn-ghost flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              分享
            </button>
          </div>
        }
      />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card overflow-hidden mb-6"
        >
          <div className="relative aspect-video overflow-hidden bg-white/5">
            <img
              src={activityImages[currentImageIndex]}
              alt={activityDetail.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {isOngoing && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500/90 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                  <Flame className="w-4 h-4" />
                  火热进行中
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge
                  {...getStatusBadgeProps(activityDetail.status)}
                  size="md"
                />
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm">
                  {categoryLabels[activityDetail.category] || '其他'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                {activityDetail.title}
              </h1>
            </div>
          </div>

          <div className="p-4 flex gap-2">
            {activityImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  'w-16 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                  currentImageIndex === index
                    ? 'border-primary-500'
                    : 'border-transparent hover:border-white/20'
                )}
              >
                <img
                  src={img}
                  alt={`活动图片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4">
                活动详情
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-neutral-300 leading-relaxed mb-4">
                  {activityDetail.description}
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary-500/10 to-transparent border border-primary-500/20">
                    <h4 className="text-white font-medium mb-2">活动亮点</h4>
                    <ul className="text-sm text-neutral-400 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success-400 mt-0.5 flex-shrink-0" />
                        <span>专业教练指导，零基础也能轻松参与</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success-400 mt-0.5 flex-shrink-0" />
                        <span>精美礼品赠送，参与即有收获</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success-400 mt-0.5 flex-shrink-0" />
                        <span>结识邻里朋友，共建和谐社区</span>
                      </li>
                    </ul>
                  </div>
                  <img
                    src={activityImages[1]}
                    alt="活动场景"
                    className="w-full rounded-lg"
                  />
                  <h3 className="text-white font-medium">注意事项</h3>
                  <ul className="text-sm text-neutral-400 space-y-1">
                    <li>• 请提前15分钟到达活动现场签到</li>
                    <li>• 穿着舒适运动服装和运动鞋</li>
                    <li>• 请自备水杯，现场提供饮用水</li>
                    <li>• 如有特殊情况请提前告知主办方</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  参与者 ({activityDetail.currentParticipants}人)
                </h2>
                {isSignUp && (
                  <span className="flex items-center gap-1 text-sm text-success-400">
                    <CheckCircle2 className="w-4 h-4" />
                    已报名
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="flex -space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                  {participants.map((participant, index) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.25 + index * 0.03 }}
                      className="flex-shrink-0"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-white/10 bg-white/5 overflow-hidden relative group">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.userName}`}
                          alt={participant.userName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-white whitespace-nowrap px-1">
                            {participant.userName}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {activityDetail.currentParticipants > participants.length && (
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-xs text-neutral-500">
                      +{activityDetail.currentParticipants - participants.length}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="glass-card p-6 sticky top-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4">
                活动信息
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">活动时间</p>
                    <p className="text-sm text-white">
                      {formatDateTime(activityDetail.startTime)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      至 {formatDateTime(activityDetail.endTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-success-500/15 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-success-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">活动地点</p>
                    <p className="text-sm text-white">{activityDetail.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-500/15 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">活动费用</p>
                    <p className="text-sm text-white">免费</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-warning-500/15 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-warning-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-neutral-500">报名人数</p>
                      <p className="text-xs text-neutral-400">
                        {activityDetail.currentParticipants}
                        {activityDetail.maxParticipants &&
                          `/${activityDetail.maxParticipants}`}
                      </p>
                    </div>
                    {activityDetail.maxParticipants && (
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
                      />
                    )}
                    <p className="text-xs text-neutral-500 mt-1">
                      {isFull
                        ? '名额已满'
                        : `剩余 ${remainingSpots} 个名额`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-start gap-3">
                  <img
                    src={organizerInfo.avatar}
                    alt={organizerInfo.name}
                    className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {organizerInfo.name}
                    </p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      主办方
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {isSignUp && isOngoing && (
                  <button
                    onClick={() => setIsQrModalVisible(true)}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-success-500 to-success-600 text-white font-medium hover:from-success-400 hover:to-success-500 transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-5 h-5" />
                    签到二维码
                  </button>
                )}

                <button
                  onClick={handleSignUp}
                  disabled={isEnded || isFull}
                  className={cn(
                    'w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                    isEnded || isFull
                      ? 'bg-white/5 text-neutral-500 cursor-not-allowed'
                      : isSignUp
                      ? 'bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500'
                  )}
                >
                  {getButtonText()}
                </button>

                <button className="w-full py-3 rounded-lg bg-white/5 text-neutral-300 font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  咨询活动
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Modal
        title="活动报名"
        open={isSignUpModalVisible}
        onCancel={() => setIsSignUpModalVisible(false)}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入您的姓名" prefix={<User className="w-4 h-4 text-neutral-500" />} />
          </Form.Item>
          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入您的手机号" prefix={<Phone className="w-4 h-4 text-neutral-500" />} />
          </Form.Item>
          <Form.Item
            label="报名人数"
            name="count"
            initialValue={1}
            rules={[{ required: true, message: '请选择报名人数' }]}
          >
            <InputNumber min={1} max={remainingSpots || 10} className="!w-full" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="如有特殊需求请备注" />
          </Form.Item>
          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => setIsSignUpModalVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSignUpSubmit}>
              确认报名
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={isQrModalVisible}
        onCancel={() => setIsQrModalVisible(false)}
        footer={null}
        width={360}
        centered
      >
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            活动签到码
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            请在活动现场出示此二维码进行签到
          </p>
          <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center mb-4 p-2">
            <QrCodeSvg />
          </div>
          <p className="text-sm text-neutral-400">
            活动：{activityDetail.title}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            时间：{formatDate(activityDetail.startTime)} {formatTime(activityDetail.startTime)}
          </p>
        </div>
      </Modal>
    </div>
  );
}
