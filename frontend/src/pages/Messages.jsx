import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageApi } from '@/api';
import { useAuthStore, useToastStore } from '@/store';
import { PageLoading } from '@/components/Loading.jsx';
import Empty from '@/components/Empty.jsx';
import {
  MessageCircle,
  Heart,
  AtSign,
  Bell,
  Users,
  ChevronRight,
  Send,
  X,
} from 'lucide-react';
import { formatDate } from '@/utils';

export default function Messages() {
  const [activeTab, setActiveTab] = useState('chat');
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState({ following: [], followers: [] });
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/messages' } } });
      return;
    }
    fetchData();
  }, [activeTab, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const contactsRes = await messageApi.getContacts();
      setContacts(contactsRes.data.data);

      if (activeTab === 'chat') {
        const convRes = await messageApi.getConversations();
        setConversations(convRes.data.data);
      } else {
        const notifRes = await messageApi.getNotifications({ type: activeTab });
        setNotifications(notifRes.data.data.notifications || []);
      }
    } catch (error) {
      console.error('加载消息失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (chatUser) => {
    setSelectedUser(chatUser);
    setShowChat(true);
    try {
      const res = await messageApi.getConversation(chatUser.id);
      setChatMessages(res.data.data.messages || []);
    } catch (error) {
      showToast('加载聊天记录失败', 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUser) return;
    try {
      await messageApi.send(selectedUser.id, messageInput.trim());
      setMessageInput('');
      const res = await messageApi.getConversation(selectedUser.id);
      setChatMessages(res.data.data.messages || []);
      showToast('发送成功', 'success');
    } catch (error) {
      showToast('发送失败', 'error');
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (showChat && selectedUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
          <button onClick={() => setShowChat(false)}>
            <X size={24} className="text-neutral-600" />
          </button>
          <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden">
            {selectedUser.avatar ? (
              <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="font-medium text-neutral-800">{selectedUser.username}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Empty message="暂无消息，快来打个招呼吧~" />
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[70%]">
                  {msg.sender_id !== user?.id && selectedUser.avatar && (
                    <img
                      src={selectedUser.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full bg-neutral-200"
                    />
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm ${
                      msg.sender_id === user?.id
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-neutral-100 text-neutral-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-neutral-100">
          <div className="flex gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入消息..."
              className="flex-1 px-4 py-2.5 bg-neutral-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleSendMessage}
              className="p-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-16 md:pb-0">
      <div className="bg-white p-4 mb-2">
        <h1 className="text-xl font-bold text-neutral-800 mb-4">消息</h1>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
              activeTab === 'chat' ? 'bg-primary/10' : 'bg-neutral-50'
            }`}
          >
            <MessageCircle size={20} className={activeTab === 'chat' ? 'text-primary' : 'text-neutral-500'} />
            <span className="text-xs text-neutral-600">私信</span>
          </button>
          <button
            onClick={() => setActiveTab('reply')}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
              activeTab === 'reply' ? 'bg-primary/10' : 'bg-neutral-50'
            }`}
          >
            <MessageCircle size={20} className={activeTab === 'reply' ? 'text-primary' : 'text-neutral-500'} />
            <span className="text-xs text-neutral-600">回复</span>
          </button>
          <button
            onClick={() => setActiveTab('like')}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
              activeTab === 'like' ? 'bg-primary/10' : 'bg-neutral-50'
            }`}
          >
            <Heart size={20} className={activeTab === 'like' ? 'text-primary' : 'text-neutral-500'} />
            <span className="text-xs text-neutral-600">点赞</span>
          </button>
          <button
            onClick={() => setActiveTab('mention')}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
              activeTab === 'mention' ? 'bg-primary/10' : 'bg-neutral-50'
            }`}
          >
            <AtSign size={20} className={activeTab === 'mention' ? 'text-primary' : 'text-neutral-500'} />
            <span className="text-xs text-neutral-600">@我</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {activeTab === 'chat' ? (
          <>
            {conversations.length === 0 ? (
              <Empty message="暂无私信" />
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.user_id}
                    onClick={() => handleUserClick(conv)}
                    className="w-full flex items-center gap-3 p-4 bg-white rounded-xl"
                  >
                    <div className="w-12 h-12 rounded-full bg-neutral-200 overflow-hidden">
                      {conv.avatar ? (
                        <img src={conv.avatar} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-neutral-800">{conv.username}</div>
                      <div className="text-sm text-neutral-500 truncate">{conv.last_message}</div>
                    </div>
                    <ChevronRight size={20} className="text-neutral-400" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 bg-white rounded-xl p-4">
              <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <Users size={18} />
                通讯录
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-neutral-500 mb-2">我关注的 ({contacts.following?.length || 0})</div>
                  <div className="space-y-2">
                    {contacts.following?.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleUserClick(u)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <span className="font-medium text-neutral-800">{u.username}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl p-4">
            {notifications.length === 0 ? (
              <Empty message={`暂无${activeTab === 'reply' ? '回复' : activeTab === 'like' ? '点赞' : '@消息'}`} />
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex gap-3 p-3 bg-neutral-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden">
                      {notif.avatar ? (
                        <img src={notif.avatar} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium text-neutral-800">{notif.username}</span>
                        <span className="text-neutral-600 ml-1">{notif.content}</span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">{formatDate(notif.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
