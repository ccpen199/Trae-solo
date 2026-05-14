import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import api, { handleApiError } from '../services/api';
import useStore from '../store/useStore';
import Loading from '../components/Loading';
import { showToast } from '../components/Toast';

interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  content: string;
  created_at: string;
}

const Chat: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages', {
        params: { targetUserId: userId, limit: 50 },
      });
      if (res.data.success) {
        setMessages(res.data.data.messages || []);
      }
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    const tempMessage: Message = {
      id: Date.now(),
      from_user_id: currentUser?.id || 0,
      to_user_id: Number(userId),
      content,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, tempMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/messages', {
        toUserId: Number(userId),
        content,
      });
      if (!res.data.success) {
        setMessages(messages.filter((m) => m.id !== tempMessage.id));
        showToast('发送失败', 'error');
      }
    } catch (error) {
      setMessages(messages.filter((m) => m.id !== tempMessage.id));
      showToast(handleApiError(error), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-8 pb-4">
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h1 className="font-semibold text-gray-800">用户{userId}</h1>
            <p className="text-xs text-green-500">在线</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <Loading />
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>开始你们的对话吧~</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMe = msg.from_user_id === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      isMe
                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-100 p-4 pb-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full outline-none text-gray-700"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={`p-2.5 rounded-full transition-colors ${
              input.trim() && !sending
                ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
