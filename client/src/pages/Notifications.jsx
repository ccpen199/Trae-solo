import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notifications';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { PageLoading } from '../components/Loading';
import { ErrorState, EmptyState } from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { Bell, Heart, MessageCircle, Star, UserPlus, Check, CheckCheck, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function Notifications() {
  const { user } = useAuthStore();
  const toast = useToastStore();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const notificationIcons = {
    like: Heart,
    comment: MessageCircle,
    favorite: Star,
    follow: UserPlus,
    answer: MessageCircle,
    mention: MessageCircle,
    system: Bell,
  };

  const notificationColors = {
    like: 'text-red-500 bg-red-50',
    comment: 'text-blue-500 bg-blue-50',
    favorite: 'text-amber-500 bg-amber-50',
    follow: 'text-green-500 bg-green-50',
    answer: 'text-purple-500 bg-purple-50',
    mention: 'text-orange-500 bg-orange-50',
    system: 'text-gray-500 bg-gray-50',
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [notificationsRes, unreadRes] = await Promise.all([
        getNotifications({ page: 1, pageSize: 50 }),
        getUnreadCount(),
      ]);
      if (notificationsRes?.success) setNotifications(notificationsRes.data?.list || []);
      if (unreadRes?.success) setUnreadCount(unreadRes.data?.count || 0);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await markAsRead(id);
      if (res?.success) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      toast.error(err.message || '操作失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      const res = await markAllAsRead();
      if (res?.success) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('已全部标记为已读');
      }
    } catch (err) {
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationText = (notification) => {
    const actorName = notification.actor?.nickname || notification.actor?.username || '某人';
    switch (notification.type) {
      case 'like': return `${actorName} 点赞了你的内容`;
      case 'comment': return `${actorName} 评论了你的内容`;
      case 'favorite': return `${actorName} 收藏了你的内容`;
      case 'follow': return `${actorName} 关注了你`;
      case 'answer': return `${actorName} 回答了你的问题`;
      case 'mention': return `${actorName} 提到了你`;
      case 'system': return notification.content || '系统通知';
      default: return notification.content || '新通知';
    }
  };

  const getLink = (notification) => {
    if (notification.articleId) return `/article/${notification.articleId}`;
    if (notification.questionId) return `/question/${notification.questionId}`;
    if (notification.actorId) return `/user/${notification.actorId}`;
    return '#';
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <Bell size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">请先登录查看通知</p>
      </div>
    );
  }

  if (loading) return <PageLoading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">通知中心</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount} 条未读
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <CheckCheck size={16} />
            全部已读
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const colorClass = notificationColors[notification.type] || 'text-gray-500 bg-gray-50';
            return (
              <Link
                key={notification.id}
                to={getLink(notification)}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {notification.actor ? (
                    <Avatar src={notification.actor.avatar} size="md" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    {getNotificationText(notification)}
                    {!notification.isRead && (
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2 align-middle" />
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    {dayjs(notification.createdAt).fromNow()}
                  </p>
                </div>
                {!notification.isRead && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleMarkAsRead(notification.id);
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                    title="标记为已读"
                  >
                    <Check size={16} />
                  </button>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Bell size={48} className="text-gray-300" />}
          title="暂无通知"
          description="你还没有收到任何通知"
        />
      )}
    </div>
  );
}
