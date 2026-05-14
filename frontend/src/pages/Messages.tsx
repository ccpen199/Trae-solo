import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import api, { handleApiError } from '../services/api';
import Loading from '../components/Loading';
import { showToast } from '../components/Toast';

interface Conversation {
  user_id: number;
  nickname: string;
  avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      if (res.data.success) {
        setConversations(res.data.data.conversations || []);
      }
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-4 pt-8 pb-4">
          <h1 className="text-xl font-bold text-gray-800">消息</h1>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <Loading />
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p className="mb-2">暂无消息</p>
            <p className="text-sm">去星球匹配有趣的人吧</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => navigate(`/chat/${conv.user_id}`)}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:bg-gray-50"
              >
                <img
                  src={conv.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.user_id}`}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{conv.nickname}</span>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message || '暂无消息'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
