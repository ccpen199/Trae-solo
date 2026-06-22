import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Award,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  Flower2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCircleStore } from '@/stores/useCircleStore';
import { useUserStore } from '@/stores/useUserStore';
import type { Activity, User } from '@/types';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Tag from '@/components/common/Tag';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import Empty from '@/components/common/Empty';
import Loading from '@/components/common/Loading';
import Modal from '@/components/common/Modal';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'registered', label: '已报名' },
  { value: 'checked_in', label: '已签到' },
  { value: 'cancelled', label: '已取消' },
];

const exportOptions = [
  { value: 'excel', label: '导出 Excel' },
  { value: 'csv', label: '导出 CSV' },
];

interface ParticipantWithStatus extends User {
  registerTime: Date;
  checkInTime?: Date;
  status: 'registered' | 'checked_in' | 'cancelled';
  hasShared?: boolean;
  note?: string;
}

export default function ActivityManage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { activities, fetchActivities, updateParticipantStatus } = useCircleStore();
  const { user: currentUser, isLoggedIn } = useUserStore();
  
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithStatus | null>(null);
  const [messageText, setMessageText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const activity = useMemo(() => {
    return activities.find(a => a.id === activityId);
  }, [activities, activityId]);

  useEffect(() => {
    loadData();
  }, [activityId]);

  const loadData = async () => {
    setLoading(true);
    await fetchActivities();
    setLoading(false);
  };

  const participants = useMemo((): ParticipantWithStatus[] => {
    if (!activity) return [];
    return activity.participants.map((user, index) => ({
      ...user,
      registerTime: new Date(Date.now() - (index + 1) * 3600000 * (Math.random() * 24 + 1)),
      checkInTime: index % 3 === 0 ? new Date(Date.now() - 3600000 * 2) : undefined,
      status: index % 3 === 0 ? 'checked_in' : index % 5 === 0 ? 'cancelled' : 'registered',
      hasShared: index % 2 === 0,
      note: index % 4 === 0 ? '需要停车位' : undefined,
    }));
  }, [activity]);

  const filteredParticipants = useMemo(() => {
    let list = [...participants];
    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter);
    }
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      list = list.filter(p =>
        p.nickname.toLowerCase().includes(keyword) ||
        p.phone?.includes(keyword) ||
        p.email?.toLowerCase().includes(keyword)
      );
    }
    return list;
  }, [participants, statusFilter, searchKeyword]);

  const stats = useMemo(() => {
    const total = activity?.currentParticipants || 0;
    const checkedIn = participants.filter(p => p.status === 'checked_in').length;
    const cancelled = participants.filter(p => p.status === 'cancelled').length;
    const registered = participants.filter(p => p.status === 'registered').length;
    return { total, checkedIn, cancelled, registered };
  }, [activity, participants]);

  const isAdmin = currentUser && activity?.organizer.id === currentUser.id;

  const handleCheckIn = async (userId: string) => {
    if (!activityId) return;
    setActionLoading(true);
    await updateParticipantStatus(activityId, userId, 'checked_in');
    setActionLoading(false);
  };

  const handleCancelRegistration = async (userId: string) => {
    if (!activityId) return;
    setActionLoading(true);
    await updateParticipantStatus(activityId, userId, 'cancelled');
    setActionLoading(false);
  };

  const handleExport = (format: string) => {
    setShowExportModal(false);
    setTimeout(() => {
      alert(`已导出 ${filteredParticipants.length} 条报名记录为 ${format.toUpperCase()} 格式`);
    }, 500);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedParticipant) return;
    setActionLoading(true);
    setTimeout(() => {
      alert(`已向 ${selectedParticipant.nickname} 发送消息：${messageText}`);
      setMessageText('');
      setShowMessageModal(false);
      setActionLoading(false);
    }, 500);
  };

  const handleAwardPoints = (userId: string, points: number) => {
    setActionLoading(true);
    setTimeout(() => {
      alert(`已向用户发放 ${points} 小红花积分奖励`);
      setActionLoading(false);
    }, 500);
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-sm mx-4">
          <h2 className="text-xl font-bold text-neutral-800 mb-2">请先登录</h2>
          <p className="text-neutral-500 mb-6">登录后可管理活动报名</p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
            className="w-full"
          >
            立即登录
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Empty description="活动不存在" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-sm mx-4">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-800 mb-2">无权限访问</h2>
          <p className="text-neutral-500 mb-6">仅活动组织者可管理报名名单</p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/activity/${activityId}`)}
            className="w-full"
          >
            返回活动详情
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50 pb-20"
    >
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(`/activity/${activityId}`)}
              className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-lg text-neutral-800 truncate">报名名单管理</h1>
              <p className="text-sm text-neutral-500 truncate">{activity.title}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportModal(true)}
            >
              导出
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <Card className="p-2 text-center">
              <div className="text-xl font-bold text-westlake-600">{stats.total}</div>
              <div className="text-xs text-neutral-500">总报名</div>
            </Card>
            <Card className="p-2 text-center">
              <div className="text-xl font-bold text-honghua-600">{stats.checkedIn}</div>
              <div className="text-xs text-neutral-500">已签到</div>
            </Card>
            <Card className="p-2 text-center">
              <div className="text-xl font-bold text-chaojing-600">{stats.registered}</div>
              <div className="text-xs text-neutral-500">待签到</div>
            </Card>
            <Card className="p-2 text-center">
              <div className="text-xl font-bold text-neutral-400">{stats.cancelled}</div>
              <div className="text-xs text-neutral-500">已取消</div>
            </Card>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="搜索姓名/手机号/邮箱"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                size="sm"
                className="pl-9"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              size="sm"
              className="w-32"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {filteredParticipants.length === 0 ? (
          <Empty
            title="暂无报名记录"
            description={searchKeyword || statusFilter !== 'all' ? '请尝试修改筛选条件' : '还没有人报名该活动'}
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredParticipants.map((participant, index) => (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar
                        size="lg"
                        src={participant.avatar}
                        name={participant.nickname}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-neutral-800">{participant.nickname}</h4>
                          <Tag
                            size="sm"
                            color={
                              participant.status === 'checked_in' ? 'honghua' :
                              participant.status === 'cancelled' ? 'neutral' : 'westlake'
                            }
                          >
                            {participant.status === 'checked_in' ? '已签到' :
                             participant.status === 'cancelled' ? '已取消' : '已报名'}
                          </Tag>
                          {participant.hasShared && (
                            <Tag size="sm" color="chaojing">已分享</Tag>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500 mb-2">
                          {participant.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {participant.phone}
                            </span>
                          )}
                          {participant.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {participant.email}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            报名时间：{participant.registerTime.toLocaleString('zh-CN')}
                          </span>
                          {participant.checkInTime && (
                            <span className="flex items-center gap-1 text-honghua-500">
                              <UserCheck className="w-3 h-3" />
                              签到时间：{participant.checkInTime.toLocaleString('zh-CN')}
                            </span>
                          )}
                          {participant.note && (
                            <span className="flex items-center gap-1 text-chaojing-600">
                              <MessageCircle className="w-3 h-3" />
                              备注：{participant.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {participant.status === 'registered' && (
                          <Button
                            size="sm"
                            variant="primary"
                            leftIcon={<UserCheck className="w-4 h-4" />}
                            loading={actionLoading}
                            onClick={() => handleCheckIn(participant.id)}
                          >
                            签到
                          </Button>
                        )}
                        {participant.status === 'registered' && (
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<XCircle className="w-4 h-4" />}
                            loading={actionLoading}
                            onClick={() => handleCancelRegistration(participant.id)}
                          >
                            取消
                          </Button>
                        )}
                        {participant.status === 'checked_in' && (
                          <Button
                            size="sm"
                            variant="warning"
                            leftIcon={<Flower2 className="w-4 h-4" />}
                            loading={actionLoading}
                            onClick={() => handleAwardPoints(participant.id, 30)}
                          >
                            发积分
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<MessageCircle className="w-4 h-4" />}
                          onClick={() => {
                            setSelectedParticipant(participant);
                            setShowMessageModal(true);
                          }}
                        >
                          发消息
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showExportModal && (
          <Modal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            title="导出报名数据"
          >
            <div className="space-y-3">
              <p className="text-sm text-neutral-500 mb-4">
                选择导出格式，将导出 {filteredParticipants.length} 条报名记录
              </p>
              {exportOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExport(option.value)}
                  className="w-full p-4 border border-neutral-200 rounded-xl hover:border-westlake-500 hover:bg-westlake-50 transition-all flex items-center gap-3"
                >
                  <Download className="w-5 h-5 text-westlake-600" />
                  <div className="text-left">
                    <div className="font-medium text-neutral-800">{option.label}</div>
                    <div className="text-xs text-neutral-500">包含报名时间、签到状态等完整信息</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMessageModal && selectedParticipant && (
          <Modal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            title={`发送消息给 ${selectedParticipant.nickname}`}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                <Avatar
                  size="md"
                  src={selectedParticipant.avatar}
                  name={selectedParticipant.nickname}
                />
                <div>
                  <div className="font-medium text-neutral-800">{selectedParticipant.nickname}</div>
                  <div className="text-xs text-neutral-500">{selectedParticipant.phone}</div>
                </div>
              </div>
              <textarea
                placeholder="请输入消息内容..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-westlake-500 focus:border-transparent outline-none resize-none"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowMessageModal(false)}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  loading={actionLoading}
                  disabled={!messageText.trim()}
                  onClick={handleSendMessage}
                >
                  发送
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
