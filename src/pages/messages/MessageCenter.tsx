import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Search, Clock, CheckCircle, User } from 'lucide-react';
import { messageApi } from '../../lib/api';
import { useAuth } from '../../store/authStore';
import type { Conversation, Message } from '../../../shared/types';
import { cn } from '../../lib/utils';

const MessageCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await messageApi.getConversations();
        setConversations(data);
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0].taskId);
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation !== null) {
      const fetchMessages = async () => {
        setMessagesLoading(true);
        try {
          const data = await messageApi.getMessages(selectedConversation);
          setMessages(data);
        } catch (err) {
          console.error('Failed to fetch messages:', err);
        } finally {
          setMessagesLoading(false);
        }
      };
      fetchMessages();
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || selectedConversation === null) return;
    try {
      const msg = await messageApi.send(selectedConversation, { content: newMessage, type: 'text' });
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const selectedConv = conversations.find(c => c.taskId === selectedConversation);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">消息中心</h2>
          <p className="text-slate-500 mt-1">管理您的所有沟通</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex h-[calc(100vh-280px)]">
        <div className="w-80 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索会话..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map(conv => (
                <button
                  key={conv.taskId}
                  onClick={() => setSelectedConversation(conv.taskId)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-100',
                    selectedConversation === conv.taskId && 'bg-blue-50 border-l-4 border-l-blue-600'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {conv.participants.find(p => p.id !== user?.id)?.name?.charAt(0) || 'U'}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-800 truncate">
                          {conv.participants.find(p => p.id !== user?.id)?.name || '用户'}
                        </p>
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate mb-1">{conv.taskTitle}</p>
                      <p className="text-sm text-slate-600 truncate">
                        {conv.lastMessage.senderId === user?.id ? '你: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">暂无会话</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedConv.participants.find(p => p.id !== user?.id)?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {selectedConv.participants.find(p => p.id !== user?.id)?.name || '用户'}
                    </p>
                    <p className="text-sm text-slate-500 cursor-pointer hover:text-blue-600" onClick={() => navigate(`/tasks/${selectedConv.taskId}`)}>
                      任务: {selectedConv.taskTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/tasks/${selectedConv.taskId}`)}
                  className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  查看任务
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map(msg => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={cn('flex gap-3', isOwn ? 'justify-end' : '')}>
                        {!isOwn && (
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {msg.sender?.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className={cn('max-w-[70%]', isOwn ? 'order-first' : '')}>
                          <div className={cn(
                            'px-4 py-2 rounded-2xl',
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-slate-100 text-slate-800 rounded-bl-none'
                          )}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <div className={cn(
                            'flex items-center gap-1 mt-1 text-xs',
                            isOwn ? 'justify-end' : ''
                          )}>
                            <span className="text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              msg.read
                                ? <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                : <Clock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>
                        {isOwn && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {user?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">开始沟通吧</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="输入消息..."
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    发送
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">选择一个会话</h3>
                <p className="text-slate-500">从左侧选择一个会话开始沟通</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCenter;
