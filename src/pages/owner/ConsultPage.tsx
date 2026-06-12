import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Video,
  Send,
  Image,
  Paperclip,
  Clock,
  Check,
  CheckCheck,
  Plus,
  ChevronRight,
  Zap,
  User,
  Stethoscope,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag, Avatar } from '@/components/common/BadgeTagAvatar';
import { Tabs } from '@/components/common/UIComponents';
import { useMemberStore } from '@/stores/memberStore';
import { useAuthStore } from '@/stores/authStore';
import { cn, formatCurrency } from '@/utils/common';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function ConsultPage() {
  const { consults, currentConsult, consultMessages, fetchConsults, setCurrentConsult, sendConsultMessage, isLoading } = useMemberStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('list');
  const [newMessage, setNewMessage] = useState('');
  const [showNewConsult, setShowNewConsult] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConsults();
  }, [fetchConsults]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consultMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConsult) return;

    try {
      await sendConsultMessage(currentConsult.id, newMessage, 'text');
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const statusColors: Record<string, string> = {
    waiting: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-green-100 text-green-700',
    completed: 'bg-neutral-100 text-neutral-600',
    expired: 'bg-red-100 text-red-600',
  };

  const statusLabels: Record<string, string> = {
    waiting: '待接诊',
    in_progress: '问诊中',
    completed: '已完成',
    expired: '已过期',
  };

  const ongoingConsults = consults.filter((c) => c.status !== 'completed' && c.status !== 'expired');
  const historyConsults = consults.filter((c) => c.status === 'completed' || c.status === 'expired');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-[calc(100vh-12rem)] flex"
    >
      <div className="w-96 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-900">在线问诊</h1>
            <p className="text-neutral-500 mt-1">执业兽医在线答疑</p>
          </div>
          <Button onClick={() => setShowNewConsult(true)}>
            <Plus className="w-4 h-4 mr-2" />
            发起问诊
          </Button>
        </div>

        <Card padded={false} className="flex-1 flex flex-col overflow-hidden">
          <Tabs
            tabs={[
              { id: 'list', label: `进行中 (${ongoingConsults.length})` },
              { id: 'history', label: '历史记录' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="px-4"
          />
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(activeTab === 'list' ? ongoingConsults : historyConsults).map((consult) => (
              <motion.div
                key={consult.id}
                whileHover={{ x: 4 }}
                onClick={() => {
                  setCurrentConsult(consult);
                }}
                className={cn(
                  'p-4 rounded-xl cursor-pointer transition-all border-2',
                  currentConsult?.id === consult.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-transparent bg-neutral-50 hover:bg-white hover:shadow-soft'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${consult.veterinarianId}`}
                    name="兽医"
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-neutral-900 truncate">
                        {consult.question.slice(0, 20)}...
                      </h4>
                      <Badge className={statusColors[consult.status]} size="sm">
                        {statusLabels[consult.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 truncate">
                      {consult.messages[consult.messages.length - 1]?.content || '暂无消息'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(consult.messages[0]?.createdAt || consult.startedAt || Date.now()), 'MM-dd HH:mm', { locale: zhCN })}
                      </span>
                      {consult.isPriorityChannel && (
                        <Tag variant="accent" size="sm">
                          <Zap className="w-3 h-3 mr-1" />
                          优先通道
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {(activeTab === 'list' ? ongoingConsults : historyConsults).length === 0 && (
              <div className="text-center py-12 text-neutral-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无问诊记录</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex-1 flex flex-col ml-6">
        {currentConsult ? (
          <Card padded={false} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentConsult.veterinarianId}`}
                  name="兽医"
                  size="md"
                  status="online"
                />
                <div>
                  <h4 className="font-semibold text-neutral-900">李兽医</h4>
                  <p className="text-xs text-neutral-500">执业兽医 · 从业8年</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={currentConsult.type === 'video' ? 'info' : 'success'}>
                  {currentConsult.type === 'video' ? '视频问诊' : '图文问诊'}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4 mr-1" />
                  {currentConsult.status === 'in_progress' ? '接通视频' : '查看详情'}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50/50">
              <div className="text-center mb-4">
                <Badge variant="info" size="sm">
                  {format(new Date(currentConsult.startedAt || Date.now()), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                </Badge>
              </div>

              <AnimatePresence>
                {consultMessages.map((msg) => {
                  const isOwn = msg.senderType === 'owner' || msg.senderId === user?.id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex gap-3', isOwn ? 'flex-row-reverse' : '')}
                    >
                      <Avatar
                        src={isOwn ? user?.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentConsult.veterinarianId}`}
                        name={isOwn ? user?.nickname || '我' : '兽医'}
                        size="sm"
                      />
                      <div className={cn('max-w-[60%]', isOwn ? 'items-end' : 'items-start')}>
                        <div
                          className={cn(
                            'px-4 py-3 rounded-2xl',
                            isOwn
                              ? 'bg-primary-500 text-white rounded-tr-sm'
                              : 'bg-white text-neutral-900 rounded-tl-sm shadow-soft'
                          )}
                        >
                          {msg.messageType === 'image' ? (
                            <img src={msg.content} alt="图片" className="max-w-xs rounded-lg" />
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                        <div className={cn('flex items-center gap-1 mt-1 text-xs text-neutral-400', isOwn ? 'justify-end' : '')}>
                          <span>
                            {format(new Date(msg.createdAt), 'HH:mm', { locale: zhCN })}
                          </span>
                          {isOwn && (
                            <CheckCheck className="w-3.5 h-3.5 text-primary-500" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {currentConsult.status !== 'completed' && currentConsult.status !== 'expired' && (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-100 bg-white">
                <div className="flex items-center gap-3">
                  <Button type="button" variant="ghost" size="sm">
                    <Image className="w-5 h-5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="输入消息..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || isLoading}>
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            )}
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center text-neutral-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">选择一个问诊会话开始聊天</p>
              <p className="text-sm mt-2">或点击右上角发起新的问诊</p>
            </div>
          </Card>
        )}
      </div>

      {showNewConsult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewConsult(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold mb-6">发起问诊</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">问诊类型</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 border-2 border-primary-500 bg-primary-50 rounded-xl text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                    <p className="font-medium text-primary-700">图文问诊</p>
                    <p className="text-xs text-neutral-500 mt-1">{formatCurrency(50)}/次</p>
                  </button>
                  <button className="p-4 border-2 border-neutral-200 rounded-xl text-center hover:border-primary-200 transition-colors">
                    <Video className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                    <p className="font-medium text-neutral-700">视频问诊</p>
                    <p className="text-xs text-neutral-500 mt-1">{formatCurrency(100)}/次</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">问题描述</label>
                <textarea
                  placeholder="请详细描述宠物的症状、持续时间、用药史等..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all resize-none h-32"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowNewConsult(false)}>
                  取消
                </Button>
                <Button className="flex-1" onClick={() => setShowNewConsult(false)}>
                  提交问诊
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
