import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { chatApi } from '../api/client';

const Messages = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getChats();
      setChats(data.data.chats || []);
    } catch (err) {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading && chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">消息</h1>
        <p className="text-gray-500 text-sm">你的聊天列表</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 px-4 py-3 rounded-xl mb-4 text-center">
          {error}
          <button onClick={loadChats} className="ml-2 underline">重试</button>
        </div>
      )}

      <div className="space-y-3">
        {chats.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无消息</p>
            <p className="text-sm">去星球找人聊聊吧</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-xl">
                {chat.nickname?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-800 truncate">{chat.nickname || '用户'}</h3>
                  {chat.last_message_time && (
                    <span className="text-xs text-gray-400">{chat.last_message_time}</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm truncate">{chat.last_message || '暂无消息'}</p>
              </div>
              {chat.unread_count > 0 && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  {chat.unread_count}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Messages;
