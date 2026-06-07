import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Image,
  Smile,
  Phone,
  Video,
  MoreVertical,
  MapPin,
  MessageCircle,
  Clock,
  User,
  Home,
  ChevronRight,
  X,
  Bell,
  Archive,
  BookOpen,
  UserPlus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  History,
  Star,
} from 'lucide-react';
import {
  ChatSession,
  ChatMessage,
  SOPTemplate,
} from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { useAuthStore } from '@/store/authStore';

interface FollowUpReminder {
  id: string;
  customerId: number;
  customerName: string;
  propertyName: string;
  reminderType: 'call' | 'visit' | 'follow_up';
  reminderTime: string;
  priority: 'high' | 'medium' | 'low';
  note: string;
  completed: boolean;
}

interface ChatArchive {
  id: string;
  sessionId: string;
  customerName: string;
  propertyName: string;
  startTime: string;
  endTime: string;
  messageCount: number;
  summary: string;
  tags: string[];
}

const mockSessions: ChatSession[] = [
  {
    id: 'session-1',
    customerId: 2,
    advisorId: 1,
    propertyId: 1,
    lastMessageAt: '2024-01-20T10:30:00Z',
    customer: { id: 2, name: '李明', phone: '13900139000', city: '上海', tags: ['刚需', '首次购房', '预算600-700万'] },
    advisor: { id: 1, name: '张顾问', phone: '13800138000' },
    property: { id: 1, projectName: '金域华府' },
    lastMessage: '这个房源的学区是哪个学校？',
  },
  {
    id: 'session-2',
    customerId: 3,
    advisorId: 1,
    propertyId: 2,
    lastMessageAt: '2024-01-20T09:15:00Z',
    customer: { id: 3, name: '王芳', phone: '13700137000', city: '上海', tags: ['改善', '二胎家庭', '关注学区'] },
    advisor: { id: 1, name: '张顾问', phone: '13800138000' },
    property: { id: 2, projectName: '滨江壹号' },
    lastMessage: '好的，我周末过来看房',
  },
  {
    id: 'session-3',
    customerId: 4,
    advisorId: 1,
    propertyId: 4,
    lastMessageAt: '2024-01-19T16:45:00Z',
    customer: { id: 4, name: '张伟', phone: '13600136000', city: '上海', tags: ['投资', '全款', '多套房产'] },
    advisor: { id: 1, name: '张顾问', phone: '13800138000' },
    property: { id: 4, projectName: '翠湖天地' },
    lastMessage: '请问最低折扣能到多少？',
  },
];

const mockMessages: ChatMessage[] = [
  { id: 1, sessionId: 'session-1', senderId: 2, receiverId: 1, content: '你好，我想咨询一下金域华府这个房源', type: 'text', timestamp: '2024-01-20T10:00:00Z', isRead: true },
  { id: 2, sessionId: 'session-1', senderId: 1, receiverId: 2, content: '您好！很高兴为您服务。金域华府位于浦东新区张江板块，是我们的热销楼盘', type: 'text', timestamp: '2024-01-20T10:01:00Z', isRead: true },
  { id: 3, sessionId: 'session-1', senderId: 2, receiverId: 1, content: '这个楼盘的交通方便吗？', type: 'text', timestamp: '2024-01-20T10:05:00Z', isRead: true },
  { id: 4, sessionId: 'session-1', senderId: 1, receiverId: 2, content: '非常方便！距离地铁2号线张江高科站仅500米，步行5分钟即可到达。周边还有多条公交线路，自驾的话紧邻中环高架，出行非常便利。', type: 'text', timestamp: '2024-01-20T10:07:00Z', isRead: true },
  { id: 5, sessionId: 'session-1', senderId: 2, receiverId: 1, content: '这个房源的学区是哪个学校？', type: 'text', timestamp: '2024-01-20T10:30:00Z', isRead: false },
];

const mockSOPTemplates: SOPTemplate[] = [
  { id: 1, category: '房源介绍', title: '楼盘基本信息', content: '您好！{projectName}位于{city}{district}，是由知名开发商打造的高品质社区。项目占地约10万平米，绿化率35%，容积率2.5，非常适合居住。', scenario: '客户首次咨询' },
  { id: 2, category: '价格优惠', title: '价格优惠说明', content: '目前我们有多重优惠活动：1）认购立减10万元；2）按时签约再享98折；3）老客户推荐新客户，双方各免1年物业费。优惠力度很大，建议您尽快认购。', scenario: '客户询问价格' },
  { id: 3, category: '交通配套', title: '交通配套介绍', content: '项目交通非常便利：\n• 地铁：距离{line}号线{station}站{distance}米，步行{time}分钟\n• 公交：周边有{busLines}等多条公交线路\n• 自驾：紧邻{road}，快速直达全城', scenario: '客户询问交通' },
  { id: 4, category: '邀约看房', title: '邀约看房话术', content: '非常欢迎您来现场看房！我可以为您安排专属的一对一讲解服务。请问您本周六还是周日方便？我提前准备好房源资料和团购优惠。', scenario: '邀约客户看房' },
  { id: 5, category: '购房流程', title: '购房流程说明', content: '购房流程非常简单：\n1）资格核验（1个工作日）\n2）支付定金认购（2万元）\n3）签署购房合同（7天内）\n4）办理贷款（如需）\n5）资金监管\n6）过户交房\n全程我会陪同您办理，不用担心。', scenario: '客户询问流程' },
  { id: 6, category: '异议处理', title: '价格异议处理', content: '我理解您对价格的关注。我们的定价是基于周边市场价和项目品质综合制定的。而且目前的优惠力度确实很大，加上项目的地段和配套，性价比非常高。如果您今天认购，我还可以帮您申请额外的家电礼包。', scenario: '客户嫌价格高' },
  { id: 7, category: '异议处理', title: '楼层异议处理', content: '这个楼层其实是非常好的黄金楼层，不高不低，视野和采光都非常好，而且避开了扬灰层。很多客户专门选这个楼层呢。', scenario: '客户嫌楼层不好' },
];

const mockFollowUpReminders: FollowUpReminder[] = [
  { id: 'r1', customerId: 2, customerName: '李明', propertyName: '金域华府', reminderType: 'call', reminderTime: '2024-01-21T09:00:00Z', priority: 'high', note: '客户询问学区问题，需要回电解答', completed: false },
  { id: 'r2', customerId: 3, customerName: '王芳', propertyName: '滨江壹号', reminderType: 'visit', reminderTime: '2024-01-21T14:00:00Z', priority: 'high', note: '客户周末来看房，提前准备资料', completed: false },
  { id: 'r3', customerId: 4, customerName: '张伟', propertyName: '翠湖天地', reminderType: 'follow_up', reminderTime: '2024-01-22T10:00:00Z', priority: 'medium', note: '跟进折扣问题，向领导申请后回复', completed: false },
  { id: 'r4', customerId: 5, customerName: '刘强', propertyName: '金域华府', reminderType: 'call', reminderTime: '2024-01-23T15:00:00Z', priority: 'low', note: '客户表示需要再考虑一下，3天后跟进', completed: false },
];

const mockArchives: ChatArchive[] = [
  { id: 'a1', sessionId: 'archive-1', customerName: '陈静', propertyName: '金域华府', startTime: '2024-01-15T10:00:00Z', endTime: '2024-01-15T11:30:00Z', messageCount: 28, summary: '客户首次咨询，了解房源基本信息和价格，约定周末看房', tags: ['首次咨询', '意向强烈'] },
  { id: 'a2', sessionId: 'archive-2', customerName: '赵强', propertyName: '滨江壹号', startTime: '2024-01-14T14:00:00Z', endTime: '2024-01-14T15:45:00Z', messageCount: 35, summary: '客户详细询问交通配套和学区划分，对120平户型感兴趣', tags: ['改善需求', '关注学区'] },
  { id: 'a3', sessionId: 'archive-3', customerName: '孙丽', propertyName: '翠湖天地', startTime: '2024-01-13T09:30:00Z', endTime: '2024-01-13T10:20:00Z', messageCount: 18, summary: '投资客户，询问投资回报率和租金收益', tags: ['投资需求', '全款支付'] },
];

const allMessages: Record<string, ChatMessage[]> = {
  'session-1': mockMessages,
  'session-2': [
    { id: 10, sessionId: 'session-2', senderId: 3, receiverId: 1, content: '你好，滨江壹号还有房源吗？', type: 'text', timestamp: '2024-01-20T09:00:00Z', isRead: true },
    { id: 11, sessionId: 'session-2', senderId: 1, receiverId: 3, content: '您好！滨江壹号目前还有少量房源，主要是120平和140平的三居和四居。请问您考虑多大面积的？', type: 'text', timestamp: '2024-01-20T09:02:00Z', isRead: true },
    { id: 12, sessionId: 'session-2', senderId: 3, receiverId: 1, content: '120平的三居，楼层好一点的', type: 'text', timestamp: '2024-01-20T09:05:00Z', isRead: true },
    { id: 13, sessionId: 'session-2', senderId: 1, receiverId: 3, content: '好的，目前120平的三居还有8层、12层和15层的房源，都是非常好的楼层。8层的价格是850万，12层865万，15层875万。', type: 'text', timestamp: '2024-01-20T09:08:00Z', isRead: true },
    { id: 14, sessionId: 'session-2', senderId: 3, receiverId: 3, content: '好的，我周末过来看房', type: 'text', timestamp: '2024-01-20T09:15:00Z', isRead: false },
  ],
  'session-3': [
    { id: 20, sessionId: 'session-3', senderId: 4, receiverId: 1, content: '翠湖天地现在什么价格？', type: 'text', timestamp: '2024-01-19T16:00:00Z', isRead: true },
    { id: 21, sessionId: 'session-3', senderId: 1, receiverId: 4, content: '您好！翠湖天地目前均价12万/平，具体价格根据楼层和户型有所不同。请问您考虑多大面积的？', type: 'text', timestamp: '2024-01-19T16:02:00Z', isRead: true },
    { id: 22, sessionId: 'session-3', senderId: 4, receiverId: 1, content: '180平的四居，全款有什么优惠？', type: 'text', timestamp: '2024-01-19T16:15:00Z', isRead: true },
    { id: 23, sessionId: 'session-3', senderId: 1, receiverId: 4, content: '180平的四居目前总价约2160万。全款的话可以享受97折优惠，另外认购立减20万。综合下来优惠力度还是很大的。', type: 'text', timestamp: '2024-01-19T16:20:00Z', isRead: true },
    { id: 24, sessionId: 'session-3', senderId: 4, receiverId: 1, content: '请问最低折扣能到多少？', type: 'text', timestamp: '2024-01-19T16:45:00Z', isRead: false },
  ],
};

export default function IMCenter() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>(mockSessions);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(mockSessions[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sopTemplates] = useState<SOPTemplate[]>(mockSOPTemplates);
  const [newTag, setNewTag] = useState('');
  const [activeRightTab, setActiveRightTab] = useState<'profile' | 'sop' | 'archive'>('profile');
  const [showReminderPanel, setShowReminderPanel] = useState(false);
  const [followUpReminders, setFollowUpReminders] = useState<FollowUpReminder[]>(mockFollowUpReminders);
  const [archives] = useState<ChatArchive[]>(mockArchives);
  const [sopCategory, setSopCategory] = useState('全部');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    if (selectedSession) {
      const sessionMessages = allMessages[selectedSession.id] || mockMessages;
      setMessages(sessionMessages);
    }
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', (message: ChatMessage) => {
        if (selectedSession && message.sessionId === selectedSession.id) {
          setMessages(prev => [...prev, message]);
        }
      });
    }
    return () => {
      socket?.off('receive_message');
    };
  }, [socket, selectedSession]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedSession) return;
    const newMessage: ChatMessage = {
      id: Date.now(),
      sessionId: selectedSession.id,
      senderId: user?.id || 1,
      receiverId: selectedSession.customerId,
      content: inputValue,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages(prev => [...prev, newMessage]);
    socket?.emit('send_message', newMessage);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUseSop = (template: SOPTemplate) => {
    let content = template.content;
    if (selectedSession?.property) {
      content = content.replace('{projectName}', selectedSession.property.projectName);
      content = content.replace('{city}', selectedSession.customer?.city || '上海');
      content = content.replace('{district}', '浦东新区');
    }
    setInputValue(content);
  };

  const handleAddTag = () => {
    if (!newTag.trim() || !selectedSession?.customer) return;
    const updatedSessions = sessions.map(s => {
      if (s.id === selectedSession.id && s.customer) {
        return {
          ...s,
          customer: {
            ...s.customer,
            tags: [...s.customer.tags, newTag.trim()],
          },
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    setSelectedSession(updatedSessions.find(s => s.id === selectedSession.id) || null);
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedSession?.customer) return;
    const updatedSessions = sessions.map(s => {
      if (s.id === selectedSession.id && s.customer) {
        return {
          ...s,
          customer: {
            ...s.customer,
            tags: s.customer.tags.filter(t => t !== tagToRemove),
          },
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    setSelectedSession(updatedSessions.find(s => s.id === selectedSession.id) || null);
  };

  const handleCompleteReminder = (reminderId: string) => {
    setFollowUpReminders(prev => prev.map(r => 
      r.id === reminderId ? { ...r, completed: true } : r
    ));
  };

  const filteredSessions = sessions.filter(s =>
    s.customer?.name.includes(searchQuery) ||
    s.property?.projectName.includes(searchQuery)
  );

  const sopCategories = ['全部', ...Array.from(new Set(sopTemplates.map(t => t.category)))];
  const filteredSops = sopCategory === '全部' 
    ? sopTemplates 
    : sopTemplates.filter(t => t.category === sopCategory);

  const pendingReminders = followUpReminders.filter(r => !r.completed);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateStr);
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-danger/10 text-danger border-danger/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '紧急';
      case 'medium': return '重要';
      case 'low': return '普通';
      default: return priority;
    }
  };

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'visit': return <UserPlus className="w-4 h-4" />;
      case 'follow_up': return <MessageCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };



  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-600" />
              会话列表
            </h2>
            <button
              onClick={() => setShowReminderPanel(!showReminderPanel)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {pendingReminders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                  {pendingReminders.length}
                </span>
              )}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户或楼盘..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {showReminderPanel && (
          <div className="border-b border-gray-100 bg-amber-50/50">
            <div className="p-3 border-b border-amber-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                待跟进提醒
              </h3>
              <button onClick={() => setShowReminderPanel(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto p-2 space-y-2">
              {pendingReminders.map((reminder) => (
                <div key={reminder.id} className="bg-white p-3 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${getPriorityColor(reminder.priority).split(' ')[0]}`}>
                        {getReminderTypeIcon(reminder.reminderType)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{reminder.customerName}</p>
                        <p className="text-xs text-gray-500">{reminder.propertyName}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(reminder.priority)}`}>
                      {getPriorityLabel(reminder.priority)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{reminder.note}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatFullDate(reminder.reminderTime)}
                    </span>
                    <button
                      onClick={() => handleCompleteReminder(reminder.id)}
                      className="text-xs text-success hover:text-success/80 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      完成
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filteredSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className={`w-full p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${
                selectedSession?.id === session.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 gradient-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 truncate">{session.customer?.name}</h3>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(session.lastMessageAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    <Home className="w-3 h-3 inline mr-1" />
                    {session.property?.projectName}
                  </p>
                  <p className="text-sm text-gray-600 truncate mt-1">{session.lastMessage}</p>
                  {session.customer?.tags && session.customer.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {session.customer.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col border-r border-gray-100">
        {selectedSession ? (
          <>
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-gold rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedSession.customer?.name}</h3>
                  <p className="text-xs text-gray-500">
                    {selectedSession.customer?.city} · {selectedSession.customer?.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              <div className="text-center">
                <span className="inline-block px-4 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  今天 {new Date(selectedSession.lastMessageAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </span>
              </div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${message.senderId === user?.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-gray-400 to-gray-500">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          message.senderId === user?.id
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-400 mt-1 ${message.senderId === user?.id ? 'text-right' : ''}`}>
                        {formatTime(message.timestamp)}
                        {message.senderId === user?.id && (
                          <span className="ml-2">{message.isRead ? '已读' : '未读'}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-100 p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Smile className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Image className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  onClick={() => setActiveRightTab('sop')}
                  className={`p-2 rounded-lg transition-colors ${activeRightTab === 'sop' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <BookOpen className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-3">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息，按 Enter 发送..."
                  className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  发送
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">选择一个会话开始咨询</h3>
              <p className="text-sm text-gray-400 mt-1">从左侧列表选择客户进行沟通</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-96 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="flex gap-1">
            {[
              { id: 'profile', label: '客户画像', icon: User },
              { id: 'sop', label: '话术库', icon: BookOpen },
              { id: 'archive', label: '会话存档', icon: Archive },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveRightTab(tab.id as 'profile' | 'sop' | 'archive')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeRightTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeRightTab === 'profile' && selectedSession?.customer && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 gradient-gold rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedSession.customer.name}</h4>
                    <p className="text-sm text-gray-500">{selectedSession.customer.phone}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedSession.customer.city}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">客户标签</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.customer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full flex items-center gap-1 group"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="添加标签..."
                        className="flex-1 px-3 py-1.5 text-sm bg-gray-50 rounded-lg border-0 focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                      >
                        添加
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">关注楼盘</p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Home className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedSession.property?.projectName}</p>
                        <p className="text-xs text-gray-500">咨询中</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">客户画像分析</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-lg font-bold text-blue-600">高</p>
                        <p className="text-xs text-blue-600/70">意向程度</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg text-center">
                        <p className="text-lg font-bold text-amber-600">680万</p>
                        <p className="text-xs text-amber-600/70">预算范围</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-lg font-bold text-green-600">3次</p>
                        <p className="text-xs text-green-600/70">咨询次数</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                        <p className="text-lg font-bold text-purple-600">5天</p>
                        <p className="text-xs text-purple-600/70">跟进周期</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">跟进记录</p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MessageCircle className="w-3 h-3 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">首次咨询楼盘信息</p>
                          <p className="text-xs text-gray-400">2024-01-20 10:00</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Phone className="w-3 h-3 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">电话沟通交通配套</p>
                          <p className="text-xs text-gray-400">2024-01-20 10:05</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">客户咨询学区划分，待回复</p>
                          <p className="text-xs text-gray-400">2024-01-20 10:30</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <button className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      安排跟进提醒
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeRightTab === 'sop' && (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {sopCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSopCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      sopCategory === category
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredSops.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => handleUseSop(template)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                        {template.category}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{template.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">适用场景：{template.scenario}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Star className="w-3 h-3 text-gold-500" />
                        常用话术
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUseSop(template); }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        插入使用
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeRightTab === 'archive' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">共 {archives.length} 条历史会话</p>
              </div>
              <div className="space-y-3">
                {archives.map((archive) => (
                  <div
                    key={archive.id}
                    className="bg-white p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <History className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{archive.customerName}</h4>
                          <p className="text-xs text-gray-500">{archive.propertyName}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(archive.startTime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{archive.summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {archive.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {archive.messageCount}条消息
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round((new Date(archive.endTime).getTime() - new Date(archive.startTime).getTime()) / 60000)}分钟
                        </span>
                      </div>
                    </div>
                    <button className="w-full mt-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                      <Archive className="w-4 h-4" />
                      查看完整会话
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
