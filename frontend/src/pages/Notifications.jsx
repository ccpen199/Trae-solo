import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'like',
      user: { nickname: '小雨', avatar: 'https://picsum.photos/seed/g1/100/100' },
      content: '喜欢了你的资料',
      time: '5分钟前',
      read: false,
    },
    {
      id: 2,
      type: 'friend_request',
      user: { nickname: '阿杰', avatar: 'https://picsum.photos/seed/b1/100/100' },
      content: '发送了好友申请',
      time: '30分钟前',
      read: false,
    },
    {
      id: 3,
      type: 'message',
      user: { nickname: '思琪', avatar: 'https://picsum.photos/seed/g2/100/100' },
      content: '给你发送了一条消息',
      time: '2小时前',
      read: true,
    },
  ]);

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">通知</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm transition-all ${
                notification.read ? 'opacity-70' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={notification.user.avatar}
                  alt={notification.user.nickname}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {getIcon(notification.type)}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">
                  {notification.user.nickname}
                </h3>
                <p className="text-sm text-gray-500">{notification.content}</p>
                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
              </div>
              {!notification.read && (
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;