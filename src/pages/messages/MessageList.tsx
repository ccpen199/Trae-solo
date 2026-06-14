import { useState, useMemo } from 'react';
import { Search, MessageCircle, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Conversation } from '../../../../shared/types';
import { cn } from '@/lib/utils';
import ChatDetail from './ChatDetail';

const mockConversations: Conversation[] = [
  {
    id: '1',
    studentId: '1',
    companyId: '1',
    jobId: '1',
    lastMessage: '您好，我们已经查看了您的简历，非常感兴趣...',
    lastMessageAt: '2025-01-15 14:30',
    unreadCount: 3,
    student: {
      id: '1',
      studentId: 'S001',
      name: '张三',
      school: '清华大学',
      major: '计算机科学',
      grade: '大三',
      avatar: '',
      rating: 4.8,
      verified: true,
      createdAt: '2024-09-01',
    },
    company: {
      id: '1',
      name: '字节跳动科技有限公司',
      email: 'contact@bytedance.com',
      licenseNo: '123456789',
      contactName: '李经理',
      contactPhone: '13800138000',
      address: '北京市海淀区',
      verified: true,
      createdAt: '2024-01-15',
    },
    job: {
      id: '1',
      companyId: '1',
      title: '前端开发实习生',
      description: '参与公司核心产品的前端开发工作',
      location: '北京',
      salaryPerHour: 35,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['计算机科学', '软件工程'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
      createdAt: '2024-12-01',
    },
  },
  {
    id: '2',
    studentId: '1',
    companyId: '2',
    jobId: '2',
    lastMessage: '请问下周一可以来面试吗？',
    lastMessageAt: '2025-01-14 10:15',
    unreadCount: 0,
    company: {
      id: '2',
      name: '阿里巴巴集团',
      email: 'hr@alibaba.com',
      licenseNo: '987654321',
      contactName: '王主管',
      contactPhone: '13900139000',
      address: '杭州市余杭区',
      verified: true,
      createdAt: '2024-02-20',
    },
    job: {
      id: '2',
      companyId: '2',
      title: 'Java后端开发实习生',
      description: '参与电商平台后端系统开发',
      location: '杭州',
      salaryPerHour: 40,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['计算机科学', '软件工程'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '10:00',
      workEndTime: '19:00',
      status: 'published',
      createdAt: '2024-11-15',
    },
  },
  {
    id: '3',
    studentId: '1',
    companyId: '3',
    jobId: '3',
    lastMessage: '感谢您的投递，我们会尽快回复',
    lastMessageAt: '2025-01-12 16:45',
    unreadCount: 1,
    company: {
      id: '3',
      name: '腾讯科技',
      email: 'hr@tencent.com',
      licenseNo: '456789123',
      contactName: '陈经理',
      contactPhone: '13700137000',
      address: '深圳市南山区',
      verified: true,
      createdAt: '2024-03-10',
    },
    job: {
      id: '3',
      companyId: '3',
      title: '产品经理实习生',
      description: '参与产品规划和需求分析',
      location: '深圳',
      salaryPerHour: 30,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['计算机科学', '工商管理'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:30',
      workEndTime: '18:30',
      status: 'published',
      createdAt: '2024-12-20',
    },
  },
];

export default function MessageList() {
  const [conversations] = useState<Conversation[]>(mockConversations);
  const [searchQuery, setSearchQuery] = useState('');
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter((conv) => {
      const name = conv.company?.name || conv.student?.name || '';
      const lastMsg = conv.lastMessage || '';
      return name.includes(searchQuery) || lastMsg.includes(searchQuery);
    });
  }, [conversations, searchQuery]);

  const getAvatar = (conv: Conversation) => {
    return conv.company?.avatar || conv.student?.avatar || '';
  };

  const getName = (conv: Conversation) => {
    return conv.company?.name || conv.student?.name || '未知用户';
  };

  const handleSelectConversation = (id: string) => {
    navigate(`/messages/${id}`);
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-card overflow-hidden flex">
      <div className={cn(
        'border-r border-gray-100 flex flex-col',
        conversationId ? 'hidden md:flex md:w-80' : 'w-full md:w-80'
      )}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">消息中心</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索会话..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    'p-4 cursor-pointer transition-all hover:bg-gray-50',
                    conversationId === conv.id && 'bg-primary-50 border-l-4 border-primary-600'
                  )}
                >
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      {getAvatar(conv) ? (
                        <img
                          src={getAvatar(conv)}
                          alt={getName(conv)}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{getName(conv)}</h3>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                      {conv.job && (
                        <p className="text-xs text-primary-600 mt-1 truncate">
                          {conv.job.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <MessageCircle className="w-12 h-12 mb-3" />
              <p className="text-sm">暂无会话</p>
            </div>
          )}
        </div>
      </div>

      <div className={cn(
        'flex-1 flex flex-col',
        conversationId ? 'flex' : 'hidden md:flex'
      )}>
        {conversationId ? (
          <ChatDetail
            conversationId={conversationId}
            onBack={() => navigate('/messages')}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">选择一个会话开始聊天</p>
            <p className="text-sm mt-1">从左侧列表选择会话</p>
          </div>
        )}
      </div>
    </div>
  );
}
