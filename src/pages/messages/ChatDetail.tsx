import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, Send, Paperclip, Award, Phone, MoreVertical } from 'lucide-react';
import type { Message, Conversation } from '../../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

interface ChatDetailProps {
  conversationId: string;
  onBack: () => void;
}

const mockMessages: Message[] = [
  {
    id: '1',
    conversationId: '1',
    senderId: '1',
    senderType: 'company',
    content: '您好，我们已经查看了您的简历，非常感兴趣。请问您方便安排面试吗？',
    type: 'text',
    createdAt: '2025-01-15 10:00',
    read: true,
  },
  {
    id: '2',
    conversationId: '1',
    senderId: '1',
    senderType: 'student',
    content: '您好，非常感谢！我下周都有空，请问贵公司什么时候方便呢？',
    type: 'text',
    createdAt: '2025-01-15 10:05',
    read: true,
  },
  {
    id: '3',
    conversationId: '1',
    senderId: '1',
    senderType: 'company',
    content: '那我们定在下周一上午10点可以吗？面试形式是视频面试。',
    type: 'text',
    createdAt: '2025-01-15 10:10',
    read: true,
  },
  {
    id: '4',
    conversationId: '1',
    senderId: '1',
    senderType: 'student',
    content: '好的，没问题！请问需要准备什么材料吗？',
    type: 'text',
    createdAt: '2025-01-15 10:15',
    read: true,
  },
  {
    id: '5',
    conversationId: '1',
    senderId: '1',
    senderType: 'company',
    content: '请准备好您的简历和作品集，面试链接会在面试前一小时发送给您。',
    type: 'text',
    createdAt: '2025-01-15 14:30',
    read: false,
  },
];

const mockConversation: Conversation = {
  id: '1',
  studentId: '1',
  companyId: '1',
  jobId: '1',
  lastMessage: '您好，我们已经查看了您的简历，非常感兴趣...',
  lastMessageAt: '2025-01-15 14:30',
  unreadCount: 0,
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
    industry: '互联网',
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
};

export default function ChatDetail({ conversationId, onBack }: ChatDetailProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [conversation] = useState<Conversation>(mockConversation);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = '1';
  const currentUserType: 'student' | 'company' = 'student';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isMyMessage = (msg: Message) => {
    return msg.senderId === currentUserId && msg.senderType === currentUserType;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId,
      senderId: currentUserId,
      senderType: currentUserType,
      content: inputValue.trim(),
      type: 'text',
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    try {
      await api.post('/messages', {
        conversationId,
        content: inputValue.trim(),
        type: 'text',
      });
    } catch (error) {
      console.error('发送消息失败', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherPartyName = () => {
    if (currentUserType === 'student') {
      return conversation.company?.name || '未知用户';
    }
    return conversation.student?.name || '未知用户';
  };

  const getOtherPartyPosition = () => {
    if (currentUserType === 'student') {
      return conversation.job?.title || '';
    }
    return conversation.student?.major || '';
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{getOtherPartyName()}</h3>
            <p className="text-xs text-gray-500">{getOtherPartyPosition()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentUserType === 'company' && (
            <button
              onClick={() => setShowCertificateModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">生成实习证明</span>
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2 max-w-[80%]',
              isMyMessage(msg) ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            {!isMyMessage(msg) && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={cn(
              'flex flex-col gap-1',
              isMyMessage(msg) ? 'items-end' : 'items-start'
            )}>
              <div className={cn(
                'px-4 py-2.5 rounded-2xl text-sm',
                isMyMessage(msg)
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
              )}>
                {msg.content}
              </div>
              <span className="text-xs text-gray-400 px-2">
                {formatTime(msg.createdAt)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-3">
          <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              'p-3 rounded-xl transition-all flex-shrink-0',
              inputValue.trim()
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">生成实习证明</h3>
            <p className="text-sm text-gray-500 mb-6">
              确认要为该学生生成实习证明吗？生成后学生可在个人中心查看和下载。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowCertificateModal(false);
                }}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
              >
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
