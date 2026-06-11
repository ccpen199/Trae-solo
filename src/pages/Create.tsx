import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, FileText, RotateCcw, Zap } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-brand-500" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-brand-500"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const mockResume = {
  name: '张明远',
  title: '高级前端工程师',
  summary: '拥有8年前端开发经验，精通React生态与性能优化，主导过多个大型ToB产品的前端架构设计，具备出色的跨团队协作能力与技术视野。',
  experience: [
    {
      company: '字节跳动',
      role: '高级前端工程师',
      period: '2021.03 - 至今',
      desc: '主导飞书文档编辑器核心模块重构，将首屏加载时间从3.2s优化至0.8s，用户留存率提升23%。',
    },
    {
      company: '阿里巴巴',
      role: '前端工程师',
      period: '2018.07 - 2021.02',
      desc: '负责钉钉工作台前端架构升级，引入微前端方案，支撑20+子应用独立部署与灰度发布。',
    },
  ],
  projects: [
    {
      name: '智能表单引擎',
      desc: '设计并实现低代码表单渲染引擎，支持50+组件类型与逻辑编排，服务内部200+业务场景。',
    },
  ],
  education: '浙江大学 · 计算机科学与技术 · 硕士（2015 - 2018）',
  skills: ['React / Next.js', 'TypeScript', '性能优化', '微前端', 'Node.js', 'Webpack / Vite'],
};

const starData = {
  original: '负责飞书文档编辑器的开发工作，优化了加载性能，提升了用户体验。',
  star: {
    s: '飞书文档编辑器首屏加载耗时3.2秒，严重影响用户留存与编辑体验',
    t: '作为核心模块负责人，主导编辑器渲染链路全面重构',
    a: '引入虚拟滚动与增量渲染机制，重构SSR数据预取流程，实现关键资源预加载策略',
    r: '首屏加载时间从3.2s降至0.8s（提升75%），用户留存率提升23%，获季度技术突破奖',
  },
};

export default function Create() {
  const { messages, isTyping, sendMessage, clearMessages } = useChatStore();
  const [input, setInput] = useState('');
  const [showStar, setShowStar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel - Chat */}
      <div className="w-[40%] flex flex-col border-r border-surface-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <h2 className="font-display text-lg font-bold text-brand-900">AI对话创作</h2>
          </div>
          <button onClick={clearMessages} className="btn-ghost flex items-center gap-1.5 text-sm">
            <RotateCcw className="w-3.5 h-3.5" />
            新对话
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mr-2.5 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-900 text-white rounded-2xl rounded-br-sm'
                    : 'bg-white text-brand-900 rounded-2xl rounded-bl-sm shadow-sm border border-surface-100'
                }`}
              >
                {renderBold(msg.content)}
              </div>
            </div>
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        <div className="px-5 py-4 border-t border-surface-200">
          <div className="flex items-center gap-2 bg-surface-50 rounded-xl px-4 py-2.5 border border-surface-200 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述您的职业背景、项目经历..."
              className="flex-1 bg-transparent outline-none text-sm text-brand-900 placeholder:text-surface-300"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-surface-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-[60%] flex flex-col bg-surface-50 relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-500" />
            <h2 className="font-display text-lg font-bold text-brand-900">实时简历预览</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStar(!showStar)}
              className={`btn-ghost text-xs flex items-center gap-1 ${showStar ? 'bg-brand-50 text-brand-700' : ''}`}
            >
              <RotateCcw className="w-3 h-3" />
              STAR重写
            </button>
            <button className="btn-ghost text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" />
              术语强化
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[680px] bg-white rounded-lg shadow-lg resume-preview" style={{ aspectRatio: '210/297' }}>
            <div className="p-8 h-full flex flex-col">
              <div className="text-center mb-5">
                <h1 className="font-display text-2xl font-bold text-brand-900 tracking-wide">{mockResume.name}</h1>
                <p className="text-brand-600 font-medium mt-1 text-sm">{mockResume.title}</p>
                <div className="mt-3 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
              </div>

              <div className="flex-1 space-y-4 text-[13px] overflow-hidden">
                <Section title="个人总结">
                  <p className="text-brand-800 leading-relaxed">{mockResume.summary}</p>
                </Section>

                <Section title="工作经历">
                  {mockResume.experience.map((exp, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-brand-900">{exp.company}</span>
                        <span className="text-xs text-brand-600 font-mono">{exp.period}</span>
                      </div>
                      <p className="text-brand-700 text-xs mb-1">{exp.role}</p>
                      <p className="text-brand-800 leading-relaxed">{exp.desc}</p>
                    </div>
                  ))}
                </Section>

                <Section title="项目经历">
                  {mockResume.projects.map((p, i) => (
                    <div key={i}>
                      <span className="font-semibold text-brand-900">{p.name}</span>
                      <p className="text-brand-800 leading-relaxed mt-0.5">{p.desc}</p>
                    </div>
                  ))}
                </Section>

                <Section title="教育背景">
                  <p className="text-brand-800">{mockResume.education}</p>
                </Section>

                <Section title="专业技能">
                  <div className="flex flex-wrap gap-1.5">
                    {mockResume.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>

        {/* STAR Rewrite Panel */}
        <AnimatePresence>
          {showStar && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-surface-200 rounded-t-2xl shadow-2xl"
              style={{ maxHeight: '45%' }}
            >
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-brand-900">STAR法则重写</h3>
                  <button onClick={() => setShowStar(false)} className="text-surface-300 hover:text-brand-700 text-xl leading-none">&times;</button>
                </div>
                <div className="grid grid-cols-2 gap-4 overflow-y-auto" style={{ maxHeight: 'calc(45vh - 80px)' }}>
                  <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
                    <p className="text-xs font-semibold text-surface-300 uppercase tracking-wider mb-2">原始描述</p>
                    <p className="text-sm text-brand-800 leading-relaxed">{starData.original}</p>
                  </div>
                  <div className="bg-brand-50/50 rounded-xl p-4 border border-brand-200">
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">STAR重写</p>
                    <div className="space-y-2.5 text-sm">
                      {(['s', 't', 'a', 'r'] as const).map((key) => (
                        <div key={key}>
                          <span className="inline-block px-1.5 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded mr-1.5 uppercase">
                            {key}
                          </span>
                          <span className="text-brand-800 leading-relaxed">{starData.star[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-brand-500 pl-3 section-spacing">
      <h3 className="font-display font-bold text-brand-900 text-sm mb-1.5">{title}</h3>
      {children}
    </div>
  );
}
