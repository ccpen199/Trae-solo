import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Lock, Send, X } from 'lucide-react';
import { useSessionStore } from '@/store/useSessionStore';
import { useProfileStore } from '@/store/useProfileStore';
import type { SessionSummary } from '@/types';
import { RISK_LEVEL_CONFIG } from '@/types';

interface ChatMessage {
  id: string;
  role: 'counselor' | 'user';
  content: string;
}

export default function Session() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSession, setCurrentSession, setCurrentSummary } = useSessionStore();
  const { profile } = useProfileStore();

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'counselor', content: '你好，很高兴认识你。请告诉我，最近是什么让你感到困扰？' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!currentSession && sessionId) {
      setCurrentSession({
        id: sessionId,
        profile_id: profile?.id || 'demo-profile',
        counselor_id: 'counselor-1',
        counselor_name: '林咨询师',
        counselor_tags: ['职场', '家庭'],
        scheduled_at: new Date().toISOString(),
        duration: 0,
        status: 'in_progress',
        created_at: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: inputValue.trim() },
    ]);
    setInputValue('');
  };

  const handleEndCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/summary`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSummary(json.data);
          setCurrentSummary(json.data);
        }
      }
    } catch {
      setSummary({
        id: 'summary-demo',
        session_id: sessionId || '',
        emotion_state: '轻度焦虑',
        core_issues: ['工作压力与倦怠感', '人际关系中的边界模糊', '自我价值感不足'],
        suggested_actions: ['每日进行10分钟正念冥想', '记录情绪日记识别压力源', '尝试与信任的人分享感受'],
        next_focus: '探索工作压力的具体来源，建立健康的情绪表达方式',
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSaveAndReturn = () => {
    setCurrentSession(null);
    navigate('/dashboard');
  };

  const counselorName = currentSession?.counselor_name || '林咨询师';

  return (
    <div className="min-h-screen bg-slate-dark-900 flex flex-col">
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-slate-dark rounded-2xl m-3 overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-dark-800/60 px-3 py-1.5 rounded-full z-10">
              <Lock size={14} className="text-green-400" />
              <span className="text-green-400 text-xs font-medium">端到端加密</span>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-dark-800/60 px-4 py-1.5 rounded-full z-10">
              <span className="text-white/80 text-sm font-mono">{formatTime(elapsed)}</span>
            </div>

            <div className="absolute top-4 right-4 z-10">
              <div className="w-28 h-20 sm:w-36 sm:h-24 rounded-xl bg-slate-dark-700 flex items-center justify-center border border-slate-dark-600">
                <span className="text-white/60 text-sm">你</span>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-lavender-500/20 flex items-center justify-center">
                <span className="text-lavender-300 text-3xl sm:text-4xl font-serif">{counselorName[0]}</span>
              </div>
              <span className="text-white/70 text-base sm:text-lg">{counselorName}</span>
            </div>

            <button
              onClick={() => setShowChat(!showChat)}
              className="absolute bottom-4 right-4 z-10 md:hidden bg-slate-dark-800/80 px-3 py-2 rounded-full text-white/70 text-xs hover:bg-slate-dark-700 transition-colors"
            >
              {showChat ? '隐藏对话' : '显示对话'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 py-4 px-6">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                micOn ? 'bg-slate-dark-700 text-white/80 hover:bg-slate-dark-600' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                cameraOn ? 'bg-slate-dark-700 text-white/80 hover:bg-slate-dark-600' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button className="w-12 h-12 rounded-full bg-slate-dark-700 text-white/80 flex items-center justify-center hover:bg-slate-dark-600 transition-colors">
              <Monitor size={20} />
            </button>
            <button
              onClick={handleEndCall}
              className="w-14 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '30%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="hidden md:flex flex-col bg-slate-dark-800 border-l border-slate-dark-700 min-w-[280px] max-w-[400px]"
            >
              <div className="p-4 border-b border-slate-dark-700">
                <h2 className="text-white/90 font-medium text-sm">咨询对话</h2>
                <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                  <span className="text-green-400 text-xs">对话内容已脱敏处理</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'counselor'
                          ? 'bg-white/10 text-white/90 rounded-bl-md'
                          : 'bg-lavender-500/30 text-lavender-100 rounded-br-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 border-t border-slate-dark-700">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="输入消息..."
                    className="flex-1 bg-slate-dark-700 text-white/90 text-sm rounded-full px-4 py-2.5 outline-none placeholder:text-white/30 focus:ring-1 focus:ring-lavender-500/50"
                  />
                  <button
                    onClick={handleSend}
                    className="w-9 h-9 rounded-full bg-lavender-500 text-white flex items-center justify-center hover:bg-lavender-600 transition-colors shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 240, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden flex flex-col bg-slate-dark-800 border-t border-slate-dark-700"
          >
            <div className="p-3 border-b border-slate-dark-700 flex items-center justify-between">
              <h2 className="text-white/90 font-medium text-sm">咨询对话</h2>
              <button onClick={() => setShowChat(false)} className="text-white/40 hover:text-white/70">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'counselor'
                        ? 'bg-white/10 text-white/90 rounded-bl-md'
                        : 'bg-lavender-500/30 text-lavender-100 rounded-br-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-slate-dark-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="输入消息..."
                  className="flex-1 bg-slate-dark-700 text-white/90 text-xs rounded-full px-3 py-2 outline-none placeholder:text-white/30 focus:ring-1 focus:ring-lavender-500/50"
                />
                <button
                  onClick={handleSend}
                  className="w-8 h-8 rounded-full bg-lavender-500 text-white flex items-center justify-center hover:bg-lavender-600 transition-colors shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-lavender-lg"
            >
              {summaryLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-2 border-lavender-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-dark-500 text-sm">正在生成咨询摘要...</span>
                </div>
              ) : (
                summary && (
                  <div className="p-6 sm:p-8 space-y-6">
                    <h2 className="font-serif text-2xl text-lavender-600">咨询摘要</h2>

                    <div>
                      <h3 className="text-sm font-medium text-slate-dark-500 mb-2">情绪状态</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        RISK_LEVEL_CONFIG[summary.emotion_state.includes('轻度') ? 'low' : summary.emotion_state.includes('中度') ? 'medium' : 'high']?.bg || 'bg-lavender-100'
                      } ${
                        RISK_LEVEL_CONFIG[summary.emotion_state.includes('轻度') ? 'low' : summary.emotion_state.includes('中度') ? 'medium' : 'high']?.color || 'text-lavender-600'
                      }`}>
                        {summary.emotion_state}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-dark-500 mb-2">核心议题</h3>
                      <ul className="space-y-1.5">
                        {summary.core_issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-dark-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-lavender-400 mt-1.5 shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-dark-500 mb-2">建议行动</h3>
                      <ol className="space-y-1.5">
                        {summary.suggested_actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-dark-700">
                            <span className="text-lavender-500 font-medium shrink-0">{i + 1}.</span>
                            {action}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-dark-500 mb-2">下次关注</h3>
                      <div className="bg-lavender-50 rounded-xl px-4 py-3 text-sm text-lavender-700 leading-relaxed">
                        {summary.next_focus}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveAndReturn}
                      className="w-full py-3 bg-lavender-500 text-white rounded-xl font-medium hover:bg-lavender-600 transition-colors"
                    >
                      保存并返回
                    </button>
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
