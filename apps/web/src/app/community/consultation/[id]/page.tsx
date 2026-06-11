'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, ImagePlus, Phone, MoreVertical } from 'lucide-react';
import type { ConsultationMessage } from '@pet/shared/types';

const mockMessages: ConsultationMessage[] = [
  { id: '1', consultationId: '1', senderId: 'u1', senderRole: 'user', type: 'text', content: '医生您好，我家猫咪最近总是打喷嚏，想咨询一下', isRead: true, createdAt: new Date(Date.now() - 3600000) },
  { id: '2', consultationId: '1', senderId: 'd1', senderRole: 'doctor', type: 'text', content: '您好，请问打喷嚏的频率大概是多少？有没有流鼻涕？', isRead: true, createdAt: new Date(Date.now() - 3500000) },
  { id: '3', consultationId: '1', senderId: 'u1', senderRole: 'user', type: 'text', content: '大概一天十几次，没有流鼻涕，精神状态还不错', isRead: true, createdAt: new Date(Date.now() - 3000000) },
  { id: '4', consultationId: '1', senderId: 'd1', senderRole: 'doctor', type: 'text', content: '有没有换过猫砂或者家里有什么新添置的东西？这种情况可能是过敏引起的', isRead: true, createdAt: new Date(Date.now() - 2500000) },
];

export default function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mockMessages]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="shrink-0 border-b bg-card px-4 py-3">
        <div className="container max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/community/doctor" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-foreground">张医生</h1>
              <p className="text-xs text-green-600">在线</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md hover:bg-muted">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-md hover:bg-muted">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="container max-w-4xl space-y-4">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.senderRole === 'user'
                  ? 'bg-pet-orange text-white rounded-tr-sm'
                  : 'bg-card border rounded-tl-sm'
              }`}>
                {msg.type === 'text' && (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
                {msg.type === 'image' && (
                  <div className="h-40 w-40 overflow-hidden rounded-md bg-muted">
                    <img src={msg.content} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <p className={`text-xs mt-1 ${
                  msg.senderRole === 'user' ? 'text-white/70' : 'text-muted-foreground'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t bg-card px-4 py-3">
        <div className="container max-w-4xl flex items-center gap-2">
          <button className="p-2 rounded-md hover:bg-muted">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
          />
          <button
            disabled={!messageText.trim()}
            className="rounded-full bg-pet-teal p-2.5 text-white hover:bg-pet-teal/90 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
