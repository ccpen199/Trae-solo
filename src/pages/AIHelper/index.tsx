import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  FileText,
  Gavel,
  Lightbulb,
} from 'lucide-react';
import { Input, Button, Tag, Avatar, Tooltip } from 'antd';
import { AIMessage, LawCitation, RelatedCase } from '@/types';
import { toolsApi } from '@/services/tools';
import { formatDate, formatPercent } from '@/utils/format';

const { TextArea } = Input;

const suggestedQuestions = [
  '对方不履行合同怎么办？',
  '劳动合同被辞退如何赔偿？',
  '借钱不还怎么起诉？',
  '房屋买卖纠纷如何处理？',
  '交通事故责任怎么划分？',
  '公司拖欠工资怎么办？',
];

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-2 px-4 py-3">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-neutral-ink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-neutral-ink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-neutral-ink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <span className="text-sm text-neutral-ink-500">AI 正在思考中...</span>
  </div>
);

const CitationBlock: React.FC<{ citations: LawCitation[] }> = ({ citations }) => (
  <div className="mt-3 space-y-2">
    <div className="text-xs font-semibold text-primary-500 flex items-center gap-1.5">
      <BookOpen className="w-3.5 h-3.5" />
      相关法条
    </div>
    {citations.map((citation, idx) => (
      <div key={idx} className="bg-primary-50/60 border border-primary-100 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-primary-700">{citation.law}</span>
          <Tag color="blue" className="!text-xs !py-0 !m-0">{citation.article}</Tag>
        </div>
        <p className="text-sm text-neutral-ink-700 leading-relaxed m-0">{citation.content}</p>
      </div>
    ))}
  </div>
);

const RelatedCasesBlock: React.FC<{ cases: RelatedCase[] }> = ({ cases }) => (
  <div className="mt-3 space-y-2">
    <div className="text-xs font-semibold text-accent-gold-dark flex items-center gap-1.5">
      <Gavel className="w-3.5 h-3.5" />
      类似案例
    </div>
    {cases.map((c) => (
      <div key={c.id} className="bg-neutral-ink-50 border border-neutral-ink-100 rounded-lg p-3 hover:bg-neutral-ink-100/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-sm font-medium text-neutral-ink-900 line-clamp-1 flex-1">{c.title}</span>
          <Tooltip title={`相似度 ${formatPercent(c.similarity * 100)}`}>
            <Tag color={c.similarity >= 0.8 ? 'success' : c.similarity >= 0.6 ? 'gold' : 'default'} className="!text-xs !py-0 !m-0 flex-shrink-0">
              {formatPercent(c.similarity * 100)}
            </Tag>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-ink-500 mb-2 flex-wrap">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{c.caseNumber}</span>
          <span>·</span>
          <span>{c.court}</span>
          <span>·</span>
          <span>{formatDate(c.date)}</span>
        </div>
        <p className="text-xs text-neutral-ink-600 line-clamp-2 m-0 leading-relaxed">{c.summary}</p>
      </div>
    ))}
  </div>
);

const MessageBubble: React.FC<{ message: AIMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar
        size={36}
        icon={isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        className={isUser ? 'bg-primary-500' : 'bg-primary-900'}
      />
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-primary-900 text-white rounded-tr-sm'
              : 'bg-white border border-neutral-ink-100 rounded-tl-sm shadow-sm'
          }`}
        >
          <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-neutral-ink-800'}`}>
            {message.content}
          </div>
        </div>
        {!isUser && message.citations && message.citations.length > 0 && (
          <CitationBlock citations={message.citations} />
        )}
        {!isUser && message.relatedCases && message.relatedCases.length > 0 && (
          <RelatedCasesBlock cases={message.relatedCases} />
        )}
        <div className={`text-xs text-neutral-ink-400 mt-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatDate(message.timestamp, 'HH:mm')}
        </div>
      </div>
    </div>
  );
};

const AIHelperPage: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是法律 AI 助手。我可以帮您解答法律问题、分析案件、提供法条参考和类似案例。请问有什么可以帮您的？',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (content: string = input) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || loading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedContent,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await toolsApi.sendAIMessage(trimmedContent, messages);
      setMessages(prev => [...prev, response]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedClick = (question: string) => {
    handleSend(question);
  };

  return (
    <div className="h-full flex flex-col -m-6">
      <div className="px-6 py-4 bg-white border-b border-neutral-ink-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl primary-gradient flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent-gold" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-primary-900">法律 AI 助手</h1>
            <p className="text-xs text-neutral-ink-500 mt-0.5">智能法律问答 · 法条检索 · 案例匹配</p>
          </div>
          <div className="ml-auto">
            <Tag color="success" className="!text-xs !py-1">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              在线
            </Tag>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin px-6 py-6 bg-neutral-ivory/50">
        {messages.length === 1 && (
          <div className="mb-6">
            <div className="text-sm text-neutral-ink-600 mb-3 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-accent-gold" />
              试试这些问题：
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedClick(q)}
                  disabled={loading}
                  className="px-4 py-2 bg-white border border-neutral-ink-200 rounded-lg text-sm text-neutral-ink-700 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5 max-w-4xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <Avatar size={36} icon={<Bot className="w-5 h-5" />} className="bg-primary-900" />
              <div className="bg-white border border-neutral-ink-100 rounded-2xl rounded-tl-sm shadow-sm">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-t border-neutral-ink-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-neutral-ink-50 border border-neutral-ink-200 rounded-xl p-2 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入您的法律问题，Enter 发送，Shift+Enter 换行..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              className="!border-none !shadow-none !bg-transparent !resize-none focus:!ring-0 !text-sm"
            />
            <Button
              type="primary"
              icon={<Send className="w-4 h-4" />}
              onClick={() => handleSend()}
              loading={loading}
              disabled={!input.trim()}
              className="!h-10 !px-5 flex-shrink-0"
            >
              发送
            </Button>
          </div>
          <p className="text-xs text-neutral-ink-400 mt-2 text-center">
            AI 回答仅供参考，不构成法律意见。重要法律问题请咨询专业律师。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIHelperPage;
