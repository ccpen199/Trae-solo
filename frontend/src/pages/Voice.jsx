import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, History, Sparkles, AlertCircle, Check } from 'lucide-react';
import * as api from '../api.js';

export default function Voice() {
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initSession();
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function initSession() {
    try {
      const res = await api.startVoiceSession();
      setSessionId(res.data.sessionId);
    } catch (e) {
      console.error('Failed to start session:', e);
    }
  }

  async function loadHistory() {
    try {
      const res = await api.getVoiceHistory();
      setHistory(res.data.slice(0, 20));
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }

  async function handleSend() {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const res = await api.sendVoiceCommand({ sessionId, command: input });
      
      const aiMessage = {
        role: 'assistant',
        content: res.data.response,
        intent: res.data.intent,
        corrected: res.data.correctedText,
        entities: res.data.entities,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      loadHistory();
    } catch (e) {
      const errorMessage = {
        role: 'assistant',
        content: '抱歉，处理您的指令时出现错误，请稍后重试。',
        timestamp: Date.now(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }

  const quickCommands = [
    '打开客厅灯',
    '关闭空调',
    '看电影',
    '帮我买牛奶',
    '温度调到24度',
    '亮度调到80'
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">语音控制</h1>
        <p className="text-slate-400 mt-1">使用自然语言控制您的智能家居</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col bg-slate-800 rounded-xl border border-slate-700 h-[600px]">
          <div className="p-4 border-b border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Sparkles className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-white font-medium">AIoT 智能助手</p>
              <p className="text-xs text-slate-400">支持多轮对话和模糊意图纠正</p>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Mic size={48} className="mx-auto mb-4 text-blue-400 opacity-50" />
                <p className="text-slate-400 mb-2">欢迎使用语音控制</p>
                <p className="text-slate-500 text-sm">试试下面的快捷指令，或输入您的问题</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {quickCommands.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(cmd)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-full transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-700 text-slate-200 rounded-bl-md'
                }`}>
                  {msg.corrected && (
                    <div className="flex items-center gap-1 text-xs text-amber-300 mb-1">
                      <AlertCircle size={12} />
                      已纠正: {msg.corrected}
                    </div>
                  )}
                  <p>{msg.content}</p>
                  {msg.intent && (
                    <div className="mt-2 pt-2 border-t border-slate-600/50">
                      <span className="text-xs text-slate-400">
                        意图: <span className="text-blue-300">{msg.intent}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-300 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <button className="p-3 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                <Mic size={22} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入您的指令..."
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History size={20} />
              历史记录
            </h3>
            <div className="space-y-2 max-h-[280px] overflow-auto">
              {history.map((item, i) => (
                <div key={i} className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-white text-sm">{item.command}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.corrected_intent ? (
                      <span className="text-xs text-amber-400">已纠正</span>
                    ) : null}
                    <span className="text-xs text-slate-500">
                      {item.intent || 'unknown'}
                    </span>
                    <div className="flex-1" />
                    {item.success ? (
                      <Check className="text-green-400" size={12} />
                    ) : (
                      <AlertCircle className="text-red-400" size={12} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">支持的指令</h3>
            <div className="space-y-3">
              {[
                { group: '设备控制', examples: ['打开/关闭灯', '打开/关闭空调', '设置温度XX度'] },
                { group: '场景控制', examples: ['看电影', '开启观影模式'] },
                { group: '模糊意图', examples: ['打灯 -> 开灯', '看影 -> 看电影'] },
                { group: '多轮对话', examples: ['打开空调 -> 24度'] }
              ].map((section, i) => (
                <div key={i}>
                  <p className="text-sm text-blue-400 font-medium">{section.group}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {section.examples.map((ex, j) => (
                      <span key={j} className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
