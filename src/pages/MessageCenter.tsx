import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  DollarSign,
  Ban,
  Megaphone,
  AlertCircle,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Clock,
  X
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { get, put } from '@/utils/api';
import { cn } from '@/lib/utils';
import { Modal, ModalFooter } from '@/components/Modal';
import type { Message, MessageType, PaginatedResponse } from 'shared/types';

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'pickup_reminder',
    title: '揽收任务提醒',
    content: '您有3个待揽收的订单即将超时，请及时处理。订单号：KD202606190001、KD202606190002、KD202606190003',
    targetRole: 'courier',
    targetCourierId: '1',
    relatedId: 'task1',
    relatedType: 'task',
    isRead: false,
    createdAt: '2026-06-19T10:30:00Z',
  },
  {
    id: '2',
    type: 'balance_alert',
    title: '面单账户余额不足',
    content: '您的面单账户余额为 ¥856.50，已低于预警阈值 ¥1000.00，请及时充值以免影响正常使用。',
    targetRole: 'operator',
    targetOutletId: '1',
    relatedId: 'waybill1',
    relatedType: 'waybill_account',
    isRead: false,
    createdAt: '2026-06-19T09:15:00Z',
  },
  {
    id: '3',
    type: 'suspension_notice',
    title: '暴雨天气停收通知',
    content: '因深圳市今日暴雨红色预警，部分区域暂停揽收服务。受影响区域：南山区、福田区、罗湖区。预计恢复时间：2026-06-20 08:00。',
    targetRole: 'courier',
    targetOutletId: '1',
    relatedId: 'notice1',
    relatedType: 'notice',
    isRead: true,
    createdAt: '2026-06-19T07:00:00Z',
    readAt: '2026-06-19T08:30:00Z',
  },
  {
    id: '4',
    type: 'system_announcement',
    title: '系统升级公告',
    content: '为提升服务质量，系统将于2026-06-20 22:00-24:00进行维护升级。维护期间将暂停所有服务，请提前做好相关安排。',
    isRead: true,
    createdAt: '2026-06-18T16:00:00Z',
    readAt: '2026-06-18T17:30:00Z',
  },
  {
    id: '5',
    type: 'exception_alert',
    title: '揽收任务异常',
    content: '任务 TASK202606180089 出现异常：收件人地址无法联系。请及时处理并更新任务状态。',
    targetRole: 'operator',
    targetOutletId: '1',
    relatedId: 'task89',
    relatedType: 'task',
    isRead: false,
    createdAt: '2026-06-18T15:45:00Z',
  },
  {
    id: '6',
    type: 'pickup_reminder',
    title: '新订单揽收提醒',
    content: '您收到1个新的揽收订单，订单号：KD202606180099，地址：深圳市南山区科技园北区。请在30分钟内上门揽收。',
    targetRole: 'courier',
    targetCourierId: '1',
    relatedId: 'task99',
    relatedType: 'task',
    isRead: true,
    createdAt: '2026-06-18T14:20:00Z',
    readAt: '2026-06-18T14:25:00Z',
  },
  {
    id: '7',
    type: 'system_announcement',
    title: '新功能上线通知',
    content: '电子面单模板自定义功能已上线！您现在可以自定义面单的纸张尺寸、字体大小和Logo显示。前往"面单模板配置"页面体验吧！',
    isRead: false,
    createdAt: '2026-06-17T10:00:00Z',
  },
  {
    id: '8',
    type: 'balance_alert',
    title: '充值成功通知',
    content: '您的面单账户已成功充值 ¥5000.00，当前余额 ¥5856.50。感谢您的使用！',
    targetRole: 'operator',
    targetOutletId: '1',
    relatedId: 'recharge1',
    relatedType: 'recharge',
    isRead: true,
    createdAt: '2026-06-16T10:30:00Z',
    readAt: '2026-06-16T11:00:00Z',
  },
  {
    id: '9',
    type: 'exception_alert',
    title: '设备离线告警',
    content: '快递员张三（工号：C001）的手持设备已离线超过2小时，请及时联系确认情况。',
    targetRole: 'operator',
    targetOutletId: '1',
    relatedId: 'courier1',
    relatedType: 'courier',
    isRead: true,
    createdAt: '2026-06-15T16:00:00Z',
    readAt: '2026-06-15T16:30:00Z',
  },
  {
    id: '10',
    type: 'pickup_reminder',
    title: '揽收任务即将超时',
    content: '任务 TASK202606150045 距离预约时间还有30分钟，请尽快前往收件地址。',
    targetRole: 'courier',
    targetCourierId: '1',
    relatedId: 'task45',
    relatedType: 'task',
    isRead: true,
    createdAt: '2026-06-15T14:30:00Z',
    readAt: '2026-06-15T14:32:00Z',
  },
];

const typeConfig: Record<MessageType | 'all', { label: string; icon: any; className: string; bgColor: string }> = {
  all: { label: '全部消息', icon: Inbox, className: 'text-gray-700', bgColor: 'bg-gray-100' },
  pickup_reminder: { label: '催揽提醒', icon: Clock, className: 'text-orange-700', bgColor: 'bg-orange-100' },
  balance_alert: { label: '余额告警', icon: DollarSign, className: 'text-pink-700', bgColor: 'bg-pink-100' },
  suspension_notice: { label: '停收通知', icon: Ban, className: 'text-red-700', bgColor: 'bg-red-100' },
  system_announcement: { label: '系统公告', icon: Megaphone, className: 'text-blue-700', bgColor: 'bg-blue-100' },
  exception_alert: { label: '异常告警', icon: AlertCircle, className: 'text-red-700', bgColor: 'bg-red-100' },
};

interface MessageTab {
  key: MessageType | 'all';
  label: string;
  icon: any;
}

const tabs: MessageTab[] = [
  { key: 'all', label: '全部', icon: Inbox },
  { key: 'pickup_reminder', label: '催揽提醒', icon: Clock },
  { key: 'balance_alert', label: '余额告警', icon: DollarSign },
  { key: 'suspension_notice', label: '停收通知', icon: Ban },
  { key: 'system_announcement', label: '系统公告', icon: Megaphone },
  { key: 'exception_alert', label: '异常告警', icon: AlertCircle },
];

export default function MessageCenter() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<MessageType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    fetchMessages();
  }, [activeTab, page]);

  useEffect(() => {
    const counts: Record<string, number> = { all: 0 };
    mockMessages.forEach(msg => {
      if (!msg.isRead) {
        counts.all = (counts.all || 0) + 1;
        counts[msg.type] = (counts[msg.type] || 0) + 1;
      }
    });
    setUnreadCounts(counts);
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      const result = await get<PaginatedResponse<Message>>('/messages', { params });
      if (page === 1) {
        setMessages(result.data.list);
      } else {
        setMessages(prev => [...prev, ...result.data.list]);
      }
      setTotal(result.data.total);
    } catch {
      let filtered = mockMessages;
      if (activeTab !== 'all') {
        filtered = mockMessages.filter(m => m.type === activeTab);
      }
      if (page === 1) {
        setMessages(filtered);
      } else {
        setMessages(prev => [...prev, ...filtered]);
      }
      setTotal(filtered.length);
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && !loadingMoreRef.current && messages.length < total) {
      loadingMoreRef.current = true;
      setPage(p => p + 1);
    }
  }, [messages.length, total]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '20px',
      threshold: 0,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [handleObserver]);

  const markAsRead = async (messageId: string) => {
    try {
      setMarkingReadId(messageId);
      await put(`/messages/${messageId}/read`);
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
      ));
    } finally {
      setMarkingReadId(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      await put('/messages/read-all');
      setMessages(prev => prev.map(m => ({ ...m, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        Object.keys(newCounts).forEach(key => {
          newCounts[key] = 0;
        });
        return newCounts;
      });
    } catch {
      setMessages(prev => prev.map(m => ({ ...m, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCounts({ all: 0, pickup_reminder: 0, balance_alert: 0, suspension_notice: 0, system_announcement: 0, exception_alert: 0 });
    } finally {
      setMarkingAllRead(false);
    }
  };

  const openMessageDetail = (message: Message) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  const filteredMessages = activeTab === 'all'
    ? messages
    : messages.filter(m => m.type === activeTab);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">消息中心</h1>
            <p className="text-gray-500 mt-1">查看和管理所有系统消息</p>
          </div>
          <button
            onClick={markAllAsRead}
            disabled={markingAllRead || unreadCounts[activeTab] === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {markingAllRead ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                全部标记已读
              </>
            )}
          </button>
        </div>

        <div className="flex gap-6">
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-gray-900">消息分类</span>
                </div>
              </div>
              <nav className="p-2">
                {tabs.map(tab => {
                  const TabIcon = tab.icon;
                  const unreadCount = unreadCounts[tab.key] || 0;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setPage(1);
                        setMessages([]);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-all',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <TabIcon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="min-w-[22px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = typeConfig[activeTab];
                    const Icon = config.icon;
                    return (
                      <>
                        <Icon className={cn('w-5 h-5', config.className)} />
                        <span className="font-semibold text-gray-900">{config.label}</span>
                      </>
                    );
                  })()}
                  <span className="text-sm text-gray-500">({total} 条)</span>
                </div>
              </div>

              {loading && page === 1 ? (
                <div className="p-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="text-gray-500 mt-4">加载中...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-gray-400">
                  <Inbox className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无消息</p>
                  <p className="text-sm mt-1">当前分类下没有消息</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {filteredMessages.map((message, idx) => {
                    const config = typeConfig[message.type];
                    const MessageIcon = config.icon;
                    const isHovered = hoveredMessageId === message.id;
                    const isUnread = !message.isRead;

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'relative p-4 cursor-pointer transition-all group',
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                          isUnread && 'bg-blue-50/50',
                          isHovered && 'bg-gray-100'
                        )}
                        onMouseEnter={() => setHoveredMessageId(message.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                        onClick={() => openMessageDetail(message)}
                      >
                        {isUnread && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                        )}

                        <div className={cn('flex items-start gap-4', isUnread ? 'pl-6' : 'pl-2')}>
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                            config.bgColor
                          )}>
                            <MessageIcon className={cn('w-5 h-5', config.className)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={cn(
                                'font-medium truncate',
                                isUnread ? 'text-gray-900' : 'text-gray-700'
                              )}>
                                {message.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isHovered && isUnread && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(message.id);
                                    }}
                                    className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 transition-opacity"
                                  >
                                    {markingReadId === message.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4" />
                                        标记已读
                                      </>
                                    )}
                                  </button>
                                )}
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  {dayjs(message.createdAt).fromNow()}
                                </span>
                              </div>
                            </div>
                            <p className={cn(
                              'text-sm mt-1 line-clamp-2',
                              isUnread ? 'text-gray-600' : 'text-gray-500'
                            )}>
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={observerRef} className="py-4">
                    {loading && page > 1 && (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>加载更多...</span>
                      </div>
                    )}
                    {page >= totalPages && total > 0 && (
                      <p className="text-center text-gray-400 text-sm">没有更多消息了</p>
                    )}
                  </div>
                </div>
              )}

              {total > pageSize && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    共 {total} 条记录，第 {page} / {totalPages || 1} 页
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setPage(p => Math.max(1, p - 1)); setMessages([]); }}
                      disabled={page === 1}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        page === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600">
                      {page} / {totalPages || 1}
                    </span>
                    <button
                      onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setMessages([]); }}
                      disabled={page === totalPages || totalPages === 0}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        (page === totalPages || totalPages === 0)
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedMessage?.title || '消息详情'}
        size="lg"
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                typeConfig[selectedMessage.type].bgColor
              )}>
                {(() => {
                  const Icon = typeConfig[selectedMessage.type].icon;
                  return <Icon className={cn('w-6 h-6', typeConfig[selectedMessage.type].className)} />;
                })()}
              </div>
              <div>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                  typeConfig[selectedMessage.type].bgColor,
                  typeConfig[selectedMessage.type].className
                )}>
                  {typeConfig[selectedMessage.type].label}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  {dayjs(selectedMessage.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.content}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>
                  {selectedMessage.isRead
                    ? `已读 · ${dayjs(selectedMessage.readAt).format('YYYY-MM-DD HH:mm')}`
                    : '未读'}
                </span>
              </div>
              {selectedMessage.relatedId && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>关联ID: {selectedMessage.relatedId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <ModalFooter>
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            关闭
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
