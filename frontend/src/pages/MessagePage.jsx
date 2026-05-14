import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMessages, markMessageAsRead } from '../utils/api';

function MessagePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const result = await fetchMessages();
    if (result.success) {
      setMessages(result.data);
    }
  };

  const handleMarkAsRead = async (id) => {
    await markMessageAsRead(id);
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, read: 1 } : msg
    ));
  };

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">我的消息</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500">暂无消息</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleMarkAsRead(msg.id)}
                className={`bg-white rounded-xl p-4 cursor-pointer transition-colors ${
                  msg.read === 0 ? 'border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-medium ${msg.read === 0 ? 'text-gray-800' : 'text-gray-600'}`}>
                      {msg.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{msg.content}</p>
                  </div>
                  <span className="text-xs text-gray-400">{msg.created_at?.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MessagePage;
