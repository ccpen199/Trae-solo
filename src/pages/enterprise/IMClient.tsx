import { useState, useEffect, useRef } from 'react';
import { PageLayout } from '@/components/layout';
import { Card, Button, Badge, Modal } from '@/components/ui';
import { Search, Lock, MoreVertical, Phone, Video, Send, Paperclip, Calendar, MapPin, CheckCircle, XCircle, Check } from 'lucide-react';
import { mockSessions, mockMessages, mockInterviewInvites } from '@shared/mock/data';
import { ChatSession, ChatMessage, InterviewInvite, InterviewStatus } from '@shared/types';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'unread' | 'interview' | 'hired';

export default function IMClient() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(mockSessions[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages.filter((m) => m.sessionId === mockSessions[0].id));
  const [inputValue, setInputValue] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({ dateTime: '', location: '', notes: '' });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredSessions = mockSessions.filter((session) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (
        !session.talent?.name.toLowerCase().includes(searchLower) &&
        !session.job?.title.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    switch (activeTab) {
      case 'unread':
        return (session.unreadCount || 0) > 0;
      case 'interview':
        return mockInterviewInvites.some((i) => i.sessionId === session.id);
      case 'hired':
        return mockInterviewInvites.some((i) => i.sessionId === session.id && i.status === 'completed');
      default:
        return true;
    }
  });

  useEffect(() => {
    if (selectedSession) {
      setMessages(mockMessages.filter((m) => m.sessionId === selectedSession.id));
    }
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSessionSelect = (session: ChatSession) => {
    setSelectedSession(session);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedSession) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: selectedSession.id,
      senderId: 'hr-001',
      senderType: 'hr',
      content: inputValue,
      type: 'text',
      encrypted: true,
      createdAt: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const reply: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sessionId: selectedSession.id,
          senderId: selectedSession.talentId,
          senderType: 'talent',
          content: '好的，我收到了。',
          type: 'text',
          encrypted: true,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, reply]);
      }, 1500);
    }, 1000);
  };

  const handleSendInterviewInvite = () => {
    if (!interviewForm.dateTime || !interviewForm.location || !selectedSession) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: selectedSession.id,
      senderId: 'hr-001',
      senderType: 'hr',
      content: JSON.stringify({
        interviewTime: interviewForm.dateTime,
        location: interviewForm.location,
        notes: interviewForm.notes,
      }),
      type: 'interview_invite',
      encrypted: true,
      createdAt: new Date(),
    };

    setMessages([...messages, newMessage]);
    setShowInterviewModal(false);
    setInterviewForm({ dateTime: '', location: '', notes: '' });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  const getInterviewInvite = (messageId: string) => {
    return mockInterviewInvites.find((i) => i.id === 'invite-001');
  };

  const getStatusBadge = (status: InterviewStatus) => {
    const statusMap: Record<InterviewStatus, { variant: any; label: string }> = {
      pending: { variant: 'warning', label: '待确认' },
      accepted: { variant: 'success', label: '已接受' },
      rejected: { variant: 'danger', label: '已拒绝' },
      completed: { variant: 'success', label: '已完成' },
      no_show: { variant: 'danger', label: '未出席' },
    };
    return statusMap[status];
  };

  return (
    <PageLayout title="消息中心" subtitle="加密通讯，安全高效">
      <Card className="p-0 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        <div className="flex h-full">
          <div className="w-full md:w-[30%] border-r border-neutral-200 flex flex-col">
            <div className="p-4 border-b border-neutral-200 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索对话..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                />
              </div>
              <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'unread', label: '未读' },
                  { key: 'interview', label: '面试邀约' },
                  { key: 'hired', label: '已录用' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as FilterTab)}
                    className={cn(
                      'flex-1 py-2 px-2 text-sm font-medium rounded-lg transition-all',
                      activeTab === tab.key
                        ? 'bg-white text-primary-500 shadow-sm'
                        : 'text-neutral-500 hover:text-primary-500'
                    )}
                  >
                    {tab.label}
                    {tab.key === 'unread' && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-accent-500 text-white rounded-full">
                        {mockSessions.reduce((acc, s) => acc + (s.unreadCount || 0), 0)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionSelect(session)}
                  className={cn(
                    'p-4 cursor-pointer transition-all border-b border-neutral-100',
                    'hover:bg-neutral-50',
                    selectedSession?.id === session.id &&
                      'bg-gradient-to-r from-primary-50 to-mint-50 border-l-4 border-l-primary-500'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={session.talent?.avatar}
                        alt={session.talent?.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-mint-500 rounded-full border-2 border-white" />
                      {session.encryptionEnabled && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Lock size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-neutral-800 truncate">
                          {session.talent?.name}
                        </h4>
                        <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
                          {session.lastMessageAt && formatDate(session.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-primary-500 truncate">{session.job?.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-neutral-500 truncate flex-1">
                          {session.lastMessage?.content}
                        </p>
                        {(session.unreadCount || 0) > 0 && (
                          <Badge variant="primary" size="sm" className="ml-2 flex-shrink-0">
                            {session.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredSessions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-neutral-500">暂无对话</p>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-col flex-1">
            {selectedSession ? (
              <>
                <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={selectedSession.talent?.avatar}
                        alt={selectedSession.talent?.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-mint-500 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">
                        {selectedSession.talent?.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-neutral-500">{selectedSession.job?.title}</span>
                        <span className="text-mint-500">● 在线</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone size={18} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video size={18} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={18} />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-neutral-50">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {messages.map((message, index) => {
                      const isHr = message.senderType === 'hr';
                      const showDate =
                        index === 0 ||
                        formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="inline-block px-3 py-1 bg-neutral-200 text-neutral-600 text-xs rounded-full">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                          )}

                          {message.type === 'interview_invite' ? (
                            <InterviewInviteBubble
                              message={message}
                              isHr={isHr}
                              formatTime={formatTime}
                              getInterviewInvite={getInterviewInvite}
                              getStatusBadge={getStatusBadge}
                            />
                          ) : (
                            <div
                              className={cn(
                                'flex',
                                isHr ? 'justify-end' : 'justify-start'
                              )}
                            >
                              <div className="flex items-end gap-2 max-w-[80%]">
                                {!isHr && (
                                  <img
                                    src={selectedSession.talent?.avatar}
                                    alt=""
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                  />
                                )}
                                <div
                                  className={cn(
                                    'px-4 py-2.5 rounded-2xl',
                                    isHr
                                      ? 'bg-primary-500 text-white rounded-br-md'
                                      : 'bg-white text-neutral-800 rounded-bl-md shadow-sm'
                                  )}
                                >
                                  <p className="text-sm leading-relaxed">{message.content}</p>
                                  <div
                                    className={cn(
                                      'flex items-center justify-end gap-1 mt-1',
                                      isHr ? 'text-primary-200' : 'text-neutral-400'
                                    )}
                                  >
                                    <span className="text-xs">{formatTime(message.createdAt)}</span>
                                    {isHr && (
                                      message.readAt ? (
                                        <CheckCircle size={14} />
                                      ) : (
                                        <Check size={14} />
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-end gap-2">
                          <img
                            src={selectedSession.talent?.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="p-4 border-t border-neutral-200 bg-white">
                  <div className="max-w-3xl mx-auto flex items-end gap-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Paperclip size={20} />
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setShowInterviewModal(true)}>
                        <Calendar size={18} />
                        面试邀约
                      </Button>
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="输入消息..."
                        rows={1}
                        className="w-full px-4 py-3 pr-14 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                      />
                    </div>
                    <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-neutral-50">
                <div className="text-center">
                  <Lock className="mx-auto text-neutral-300 mb-4" size={64} />
                  <p className="text-neutral-500">选择一个对话开始聊天</p>
                </div>
              </div>
            )}
          </div>

          <div className="md:hidden w-full flex-1 flex items-center justify-center bg-neutral-50">
            <div className="text-center p-8">
              <p className="text-neutral-500">请在桌面端查看完整聊天界面</p>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        title="发送面试邀约"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowInterviewModal(false)}>
              取消
            </Button>
            <Button onClick={handleSendInterviewInvite}>
              <Send size={16} />
              发送邀请
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="p-4 bg-primary-50 rounded-xl">
            <p className="text-sm text-primary-700">
              向 <span className="font-semibold">{selectedSession?.talent?.name}</span> 发送
              <span className="font-semibold">{selectedSession?.job?.title}</span> 岗位的面试邀请
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Calendar size={14} className="inline mr-1" />
              面试时间
            </label>
            <input
              type="datetime-local"
              value={interviewForm.dateTime}
              onChange={(e) => setInterviewForm({ ...interviewForm, dateTime: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <MapPin size={14} className="inline mr-1" />
              面试地点
            </label>
            <input
              type="text"
              value={interviewForm.location}
              onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
              placeholder="请输入面试地点"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">注意事项</label>
            <textarea
              value={interviewForm.notes}
              onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
              placeholder="请输入面试注意事项，如：请携带身份证、学历证书原件..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
            />
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}

interface InterviewInviteBubbleProps {
  message: ChatMessage;
  isHr: boolean;
  formatTime: (date: Date) => string;
  getInterviewInvite: (messageId: string) => InterviewInvite | undefined;
  getStatusBadge: (status: InterviewStatus) => { variant: any; label: string };
}

function InterviewInviteBubble({
  message,
  isHr,
  formatTime,
  getInterviewInvite,
  getStatusBadge,
}: InterviewInviteBubbleProps) {
  const invite = getInterviewInvite(message.id) || mockInterviewInvites[0];
  const status = getStatusBadge(invite.status);

  let inviteData;
  try {
    inviteData = JSON.parse(message.content);
  } catch {
    inviteData = {
      interviewTime: invite.interviewTime,
      location: invite.location,
      notes: invite.notes,
    };
  }

  return (
    <div className={cn('flex', isHr ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[85%]">
        <div
          className={cn(
            'rounded-2xl overflow-hidden',
            isHr ? 'rounded-br-md' : 'rounded-bl-md'
          )}
        >
          <div
            className={cn(
              'px-4 py-2 text-sm font-medium',
              isHr
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                : 'bg-gradient-to-r from-mint-500 to-mint-600 text-white'
            )}
          >
            <Calendar size={14} className="inline mr-1" />
            面试邀约
          </div>
          <div className="bg-white p-4 border border-neutral-200 border-t-0 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-neutral-500">面试时间</p>
                  <p className="font-medium text-neutral-800">
                    {new Date(inviteData.interviewTime || invite.interviewTime).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-accent-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-neutral-500">面试地点</p>
                  <p className="font-medium text-neutral-800">{inviteData.location || invite.location}</p>
                </div>
              </div>
              {inviteData.notes && (
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500">注意事项</p>
                  <p className="text-sm text-neutral-700 mt-1">{inviteData.notes}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <Badge variant={status.variant}>{status.label}</Badge>
                {invite.status === 'pending' && !isHr && (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      <XCircle size={14} className="text-accent-500" />
                      拒绝
                    </Button>
                    <Button size="sm">
                      <CheckCircle size={14} />
                      接受
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-xs text-neutral-400',
            isHr ? 'justify-end' : 'justify-start'
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isHr && message.readAt && <CheckCircle size={12} />}
        </div>
      </div>
    </div>
  );
}
