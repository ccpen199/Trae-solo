import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Image,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Stethoscope,
  FileText,
  User,
  Clock,
  Check,
  CheckCheck,
} from 'lucide-react';
import type { ConsultationMessage } from '@shared/types';
import { cn } from '@/lib/utils';

const mockMessages: (ConsultationMessage & { senderType: 'owner' | 'doctor' })[] = [
  {
    id: 'm1',
    consultationId: 'c1',
    senderId: 'owner1',
    senderType: 'owner',
    contentEncrypted: '医生您好，我家狗狗最近两天食欲不振，还有点拉稀，请问是什么情况？',
    messageType: 'text',
    createdAt: '2025-06-14T10:05:00Z',
  },
  {
    id: 'm2',
    consultationId: 'c1',
    senderId: 'doctor1',
    senderType: 'doctor',
    contentEncrypted: '您好，感谢您的咨询。请问狗狗的精神状态怎么样？有没有呕吐的情况？最近饮食有没有变化？',
    messageType: 'text',
    createdAt: '2025-06-14T10:07:00Z',
  },
  {
    id: 'm3',
    consultationId: 'c1',
    senderId: 'owner1',
    senderType: 'owner',
    contentEncrypted: '精神状态还可以，没有呕吐。最近换了新的狗粮，会不会是这个原因？',
    messageType: 'text',
    createdAt: '2025-06-14T10:10:00Z',
  },
  {
    id: 'm4',
    consultationId: 'c1',
    senderId: 'doctor1',
    senderType: 'doctor',
    contentEncrypted: '很有可能是换粮引起的肠胃不适。建议先换回原来的狗粮观察一下，可以喂一些益生菌调理肠胃。如果持续拉稀或出现其他症状，建议及时就医做便检。',
    messageType: 'text',
    createdAt: '2025-06-14T10:15:00Z',
  },
  {
    id: 'm5',
    consultationId: 'c1',
    senderId: 'owner1',
    senderType: 'owner',
    contentEncrypted: '好的，谢谢医生！请问益生菌有推荐的品牌吗？',
    messageType: 'text',
    createdAt: '2025-06-14T10:20:00Z',
  },
];

export default function ConsultationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: `m${Date.now()}`,
      consultationId: id || '',
      senderId: 'owner1',
      senderType: 'owner' as const,
      contentEncrypted: input,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, newMessage]);
    setInput('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)] flex flex-col">
      <div className="card !p-4 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-forest-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-forest-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-gray-900">王医生</h2>
              <span className="tag tag-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                在线
              </span>
            </div>
            <p className="text-xs text-gray-500">主任医师 · 内科 · 10年经验</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors">
              <FileText className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 card !p-4 overflow-y-auto mb-4">
        <div className="flex items-center gap-2 justify-center mb-6">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">今天</span>
        </div>

        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.senderType === 'owner' ? 'flex-row-reverse' : ''
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  message.senderType === 'owner'
                    ? 'bg-warm-100'
                    : 'bg-gradient-to-br from-forest-100 to-forest-200'
                )}
              >
                {message.senderType === 'owner' ? (
                  <User className="w-5 h-5 text-warm-500" />
                ) : (
                  <Stethoscope className="w-5 h-5 text-forest-500" />
                )}
              </div>
              <div
                className={cn(
                  'max-w-[75%] space-y-1',
                  message.senderType === 'owner' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'px-4 py-3 rounded-2xl',
                    message.senderType === 'owner'
                      ? 'bg-forest-500 text-white rounded-tr-sm'
                      : 'bg-cream-100 text-gray-800 rounded-tl-sm'
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.contentEncrypted}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs text-gray-400',
                    message.senderType === 'owner' ? 'justify-end' : ''
                  )}
                >
                  <span>
                    {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.senderType === 'owner' && (
                    <CheckCheck className="w-3.5 h-3.5 text-forest-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <div className="card !p-3">
        <div className="flex items-end gap-3">
          <div className="flex gap-1">
            <button className="p-2.5 rounded-xl hover:bg-forest-50 transition-colors text-gray-500">
              <Image className="w-5 h-5" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-forest-50 transition-colors text-gray-500">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="描述宠物的症状..."
              rows={1}
              className="w-full px-4 py-3 pr-14 rounded-2xl bg-cream-50 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-forest-200 min-h-[48px] max-h-32"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-2 bottom-2 p-2 rounded-xl bg-forest-500 text-white hover:bg-forest-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
