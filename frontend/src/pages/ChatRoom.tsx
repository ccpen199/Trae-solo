import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Send, Users, ArrowLeft, Globe, MessageSquare, Link2, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { chatApi } from '../lib/api';
import { websocketClient } from '../lib/websocket';
import { Avatar } from '../components/Avatar';
import type { ChatMessage, OnlineUser } from '../types';
import dayjs from 'dayjs';

const DEMO_PAGES = [
  { url: 'https://news.ycombinator.com', title: 'Hacker News' },
  { url: 'https://github.com', title: 'GitHub' },
  { url: 'https://stackoverflow.com', title: 'Stack Overflow' },
  { url: 'https://www.reddit.com', title: 'Reddit' },
  { url: 'https://medium.com', title: 'Medium' },
];

export const ChatRoom: React.FC = () => {
  const { user, currentPageUrl, currentPageTitle, chatMessages, onlineUsers, setCurrentPage, setChatMessages, setOnlineUsers, showToast } = useStore();
  
  const [pageUrl, setPageUrl] = useState(currentPageUrl || DEMO_PAGES[0].url);
  const [pageTitle, setPageTitle] = useState(currentPageTitle || DEMO_PAGES[0].title);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const loadMessages = useCallback(async () => {
    if (!pageUrl) return;
    
    setLoading(true);
    try {
      const response = await chatApi.getMessages(pageUrl, 50, 0);
      if (response.success && response.data) {
        const data = response.data as { messages: ChatMessage[]; hasMore: boolean };
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  }, [pageUrl, setChatMessages]);
  
  const loadOnlineUsers = useCallback(async () => {
    if (!pageUrl) return;
    
    try {
      const response = await chatApi.getOnlineUsers(pageUrl);
      if (response.success && response.data) {
        const data = response.data as { users: OnlineUser[] };
        setOnlineUsers(data.users || []);
      }
    } catch (error) {
      console.error('Load online users error:', error);
    }
  }, [pageUrl, setOnlineUsers]);
  
  useEffect(() => {
    loadMessages();
    loadOnlineUsers();
    setCurrentPage(pageUrl, pageTitle);
    
    websocketClient.connect(pageUrl);
    
    return () => {
      websocketClient.disconnect();
    };
  }, [pageUrl, pageTitle, loadMessages, loadOnlineUsers, setCurrentPage]);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length]);
  
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !pageUrl || sending) return;
    
    setSending(true);
    try {
      websocketClient.sendChat(message.trim());
      setMessage('');
    } catch (error) {
      showToast('发送失败，请重试', 'error');
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  }, [message, pageUrl, sending, showToast]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const switchPage = (url: string, title: string) => {
    setPageUrl(url);
    setPageTitle(title);
  };
  
  return (
    <div className="h-full flex">
      <div className="hidden md:flex w-72 border-r border-white/10 bg-white/5 flex-col">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            热门网页
          </h3>
          <div className="space-y-2">
            {DEMO_PAGES.map((page) => (
              <button
                key={page.url}
                onClick={() => switchPage(page.url, page.title)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  pageUrl === page.url
                    ? 'bg-primary-500/30 text-white'
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <p className="font-medium truncate">{page.title}</p>
                <p className="text-xs text-white/50 truncate">{page.url.replace('https://', '')}</p>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              在线用户
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                {onlineUsers.length}
              </span>
            </h3>
            <button
              onClick={loadOnlineUsers}
              className="p-1 text-white/50 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {onlineUsers.map((u) => (
              <div key={u.userId} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <Avatar config={u.avatarConfig} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{u.nickname}</p>
                  <p className="text-xs text-white/50">位置: {Math.round(u.scrollPosition)}%</p>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
            ))}
            
            {onlineUsers.length === 0 && (
              <p className="text-white/50 text-center py-4 text-sm">暂无在线用户</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 text-white/70 hover:text-white"
            >
              <Users className="w-5 h-5" />
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary-400" />
                <h2 className="text-white font-semibold truncate">{pageTitle}</h2>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Link2 className="w-3 h-3 text-white/50" />
                <p className="text-white/50 text-sm truncate">{pageUrl}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 3).map((u) => (
                  <div key={u.userId} className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden">
                    <Avatar config={u.avatarConfig} size={32} />
                  </div>
                ))}
                {onlineUsers.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium border-2 border-white/20">
                    +{onlineUsers.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/50">暂无消息</p>
              <p className="text-white/30 text-sm">成为第一个发言的人吧！</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}
              >
                <Avatar config={msg.avatarConfig} size={40} />
                <div className={`max-w-[70%] ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                    <span className="text-white font-medium text-sm">{msg.nickname}</span>
                    <span className="text-white/40 text-xs">{dayjs(msg.createdAt).format('HH:mm')}</span>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      msg.userId === user?.id
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-br-md'
                        : 'bg-white/10 text-white rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 input-field"
              placeholder="输入消息..."
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
              className="btn-primary px-4 py-3 flex items-center gap-2"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
