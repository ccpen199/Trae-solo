import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Plus, Mic, Send, ChevronDown, Trash2, Bot, User,
  Volume2, Sparkles, Clock, MoreHorizontal, Headphones, BarChart3,
  CheckCircle2, Phone, FileText, AlertCircle, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Session {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: string;
}

const dialects = [
  { id: 'mandarin', label: '普通话' },
  { id: 'cantonese', label: '粤语' },
  { id: 'sichuan', label: '四川话' },
  { id: 'shanghai', label: '上海话' },
  { id: 'northeast', label: '东北话' },
];

const quickQuestions = [
  '如何办理失业保险金申领？',
  '养老保险怎么转移接续？',
  '稳岗返还申请条件是什么？',
  '社保卡丢失了怎么补办？',
  '退休年龄是多少？',
  '如何查询社保缴费记录？',
  '工伤认定流程怎么走？',
  '创业补贴怎么申请？',
];

const staticSessions: Session[] = [
  { id: '1', title: '失业保险金申领问题', lastMessage: '好的，已为您整理申领流程...', updatedAt: '10分钟前' },
  { id: '2', title: '社保转移咨询', lastMessage: '您需要准备以下材料...', updatedAt: '昨天' },
  { id: '3', title: '稳岗返还政策', lastMessage: '符合条件的企业可以...', updatedAt: '3天前' },
];

const staticMessages: Message[] = [
  { id: '1', role: 'assistant', content: '您好！我是12333智能政务服务助手，很高兴为您服务。请问有什么可以帮助您的吗？您可以直接提问，或点击下方常见问题快速咨询。', timestamp: '09:00' },
];

export default function SmartQAPage() {
  const [sessions, setSessions] = useState<Session[]>(staticSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(staticMessages);
  const [inputText, setInputText] = useState('');
  const [dialect, setDialect] = useState(dialects[0]);
  const [dialectDropdownOpen, setDialectDropdownOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [transferStatus, setTransferStatus] = useState<'none' | 'transferring' | 'connected'>('none');
  const [kbStats] = useState({
    totalQuestions: 125800,
    hitRate: 94.6,
    avgResponseTime: 1.8,
    dialectAccuracy: { mandarin: 99.2, cantonese: 92.5, sichuan: 90.1, shanghai: 88.3, northeast: 93.8 },
    todaySessions: 3420,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId);
    }
  }, [activeSessionId]);

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const data = await api.get(`/smart-qa/session/${sessionId}/messages`);
      if (data && Array.isArray(data)) {
        setMessages(data);
      }
    } catch {
      setMessages(staticMessages);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await api.post('/smart-qa/session', { title: '新对话' });
      const newSession: Session = {
        id: (res as any)?.data?.id || Date.now().toString(),
        title: '新对话',
        updatedAt: '刚刚',
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages(staticMessages);
    } catch {
      const newSession: Session = {
        id: Date.now().toString(),
        title: '新对话',
        updatedAt: '刚刚',
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages(staticMessages);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);
    const question = inputText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      const res = await api.post('/smart-qa/message', {
        sessionId: activeSessionId,
        message: question,
        dialect: dialect.id,
      });

      setTimeout(() => {
        setIsTyping(false);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: (res as any)?.data?.content || generateMockReply(question),
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 1000);
    } catch {
      setTimeout(() => {
        setIsTyping(false);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateMockReply(question),
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 1000);
    }
  };

  const generateMockReply = (question: string): string => {
    if (question.includes('失业')) {
      return '关于失业保险金申领，您需要满足以下条件：\n1. 失业前用人单位和本人已缴纳失业保险费满一年\n2. 非因本人意愿中断就业\n3. 已进行失业登记，并有求职要求\n\n申领流程：\n① 登录平台 → ② 进入"失业登记"服务 → ③ 填写个人信息 → ④ 提交材料（身份证、解除劳动合同证明）→ ⑤ 审核通过后按月发放\n\n您是否需要我为您直接跳转至申领页面？';
    }
    if (question.includes('社保') || question.includes('养老')) {
      return '社保转移接续办理指南：\n\n【办理条件】\n• 跨统筹地区流动就业\n• 在转入地已参保缴费\n\n【办理材料】\n1. 本人有效身份证件\n2. 原参保地社保经办机构出具的《参保缴费凭证》\n\n【办理渠道】\n• 线上：国家社会保险公共服务平台\n• 线下：转入地社保经办机构窗口\n\n一般在15个工作日内完成转移接续。';
    }
    if (question.includes('稳岗') || question.includes('返还')) {
      return '稳岗返还申请条件及流程：\n\n【申请条件】\n✓ 参加失业保险并足额缴纳失业保险费12个月以上\n✓ 上年度未裁员或裁员率不高于5.5%\n✓ 30人（含）以下的参保企业裁员率不高于参保职工总数的20%\n\n【返还比例】\n• 大型企业：按企业及其职工上年度实际缴纳失业保险费的30%返还\n• 中小微企业：按60%返还\n\n【办理时限】\n每年1-12月均可申请，审核通过后15个工作日内拨付资金。';
    }
    if (question.includes('社保卡') || question.includes('补办')) {
      return '社保卡丢失补办流程：\n\n【第一步：挂失】\n• 电话挂失：拨打12333服务热线\n• 线上挂失：APP/小程序内操作\n• 窗口挂失：社保卡服务网点\n\n【第二步：补办】\n1. 携带本人身份证原件前往社保卡服务网点\n2. 填写《社保卡补办申请表》\n3. 缴纳工本费（一般20元）\n4. 15个工作日后凭回执领取新卡\n\n温馨提示：挂失后原卡立即失效，请尽快补办。';
    }
    return `感谢您的咨询！关于您提出的"${question}"问题，建议您：\n\n1. 可拨打12333服务热线进行人工咨询（工作日9:00-17:00）\n2. 前往就近的人社服务网点现场办理\n3. 在平台"政策法规"栏目查询相关文件\n\n如需转人工客服，请回复"人工"，或告诉我您的具体问题，我会尽力为您解答！`;
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        const mockTexts = [
          '我想咨询一下失业保险金怎么申请',
          '社保卡丢了怎么办',
          '养老保险怎么转移',
          '稳岗返还的条件是什么',
        ];
        const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
        setInputText(randomText);
        setIsRecording(false);
      }, 2500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] min-h-[600px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
        <div className={cn(
          'border-r border-gray-100 bg-gray-50/50 flex flex-col transition-all duration-300',
          sidebarOpen ? 'w-72' : 'w-0 md:w-16'
        )}>
          <div className={cn('p-4 border-b border-gray-100', !sidebarOpen && 'flex justify-center')}>
            {sidebarOpen ? (
              <button
                onClick={createNewSession}
                className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gov-500 to-gov-700 text-white rounded-xl font-medium hover:shadow-gov transition-all duration-300 hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5" />
                新建会话
              </button>
            ) : (
              <button
                onClick={createNewSession}
                className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-gov-500 to-gov-700 text-white rounded-xl hover:shadow-gov transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sidebarOpen ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={cn(
                    'group p-3 rounded-xl cursor-pointer transition-all duration-200',
                    activeSessionId === session.id
                      ? 'bg-gov-50 border border-gov-200'
                      : 'hover:bg-white border border-transparent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      activeSessionId === session.id ? 'bg-gov-500 text-white' : 'bg-gray-100 text-gray-500'
                    )}>
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        'font-medium text-sm truncate mb-1',
                        activeSessionId === session.id ? 'text-gov-700' : 'text-gray-700'
                      )}>
                        {session.title}
                      </h4>
                      {session.lastMessage && (
                        <p className="text-xs text-gray-400 truncate mb-1">{session.lastMessage}</p>
                      )}
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.updatedAt}
                      </p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={cn(
                    'w-10 h-10 mx-auto rounded-xl flex items-center justify-center cursor-pointer transition-all',
                    activeSessionId === session.id
                      ? 'bg-gov-500 text-white'
                      : 'bg-white text-gray-500 hover:bg-gov-50'
                  )}
                  title={session.title}
                >
                  <MessageCircle className="w-4 h-4" />
                </div>
              ))
            )}
          </div>

          {sidebarOpen && (
            <div className="p-4 border-t border-gray-100 space-y-3">
              <div className="bg-gradient-to-br from-gov-50 to-gov-100/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-gov-600" />
                  <span className="text-sm font-semibold text-gov-700">智能助手</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  基于大模型，7x24小时在线服务，已服务 120万+ 人次
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-600 font-medium">服务正常</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">知识库统计</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-gray-400">知识条目</p>
                    <p className="font-bold text-gray-800">{kbStats.totalQuestions.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-gray-400">命中准确率</p>
                    <p className="font-bold text-emerald-600">{kbStats.hitRate}%</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-gray-400">平均响应</p>
                    <p className="font-bold text-gray-800">{kbStats.avgResponseTime}s</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-gray-400">今日会话</p>
                    <p className="font-bold text-gray-800">{kbStats.todaySessions.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">方言识别精度</span>
                </div>
                <div className="space-y-1.5">
                  {dialects.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-gray-500">{d.label}</span>
                      <div className="flex-1 h-1.5 bg-white/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${kbStats.dialectAccuracy[d.id as keyof typeof kbStats.dialectAccuracy]}%` }}
                        ></div>
                      </div>
                      <span className="w-10 text-right font-medium text-gray-700">
                        {kbStats.dialectAccuracy[d.id as keyof typeof kbStats.dialectAccuracy]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50/30 to-white">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors lg:hidden"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center shadow-gov">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  12333智能政务服务助手
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </h2>
                <p className="text-xs text-gray-400">在线 · 平均响应时间 3秒</p>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDialectDropdownOpen(!dialectDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-gov-300 hover:bg-gov-50/50 transition-all text-sm"
                >
                  <Volume2 className="w-4 h-4 text-gov-600" />
                  <span className="text-gray-700">{dialect.label}</span>
                  <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', dialectDropdownOpen && 'rotate-180')} />
                </button>

                {transferStatus === 'none' && (
                  <button
                    onClick={() => {
                      setTransferStatus('transferring');
                      setTimeout(() => {
                        setTransferStatus('connected');
                        const transferMsg: Message = {
                          id: Date.now().toString(),
                          role: 'assistant',
                          content: '已为您转接人工客服，请稍候...\n\n✓ 人工客服编号：CS-2026-0583\n✓ 预计等待时间：1-2分钟\n✓ 当前排队：2人\n\n客服人员将继承本次对话记录，无需重复描述问题。',
                          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                        };
                        setMessages((prev) => [...prev, transferMsg]);
                      }, 2000);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition-all text-sm"
                  >
                    <Headphones className="w-4 h-4" />
                    转人工客服
                  </button>
                )}

                {transferStatus === 'transferring' && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 text-sm">
                    <Clock className="w-4 h-4 animate-spin" />
                    正在转接人工客服...
                  </div>
                )}

                {transferStatus === 'connected' && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                    <Headphones className="w-4 h-4" />
                    人工客服在线 · CS-0583
                    <button
                      onClick={() => setTransferStatus('none')}
                      className="ml-2 px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium transition-colors"
                    >
                      结束
                    </button>
                  </div>
                )}
              </div>
              {dialectDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden">
                  {dialects.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDialect(d);
                        setDialectDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between',
                        dialect.id === d.id
                          ? 'bg-gov-50 text-gov-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {d.label}
                      {dialect.id === d.id && (
                        <span className="w-2 h-2 rounded-full bg-gov-500"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
            {messages.length <= 1 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-500" />
                  推荐问题 · 快速提问
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(q);
                        inputRef.current?.focus();
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-gov-300 hover:bg-gov-50/50 hover:text-gov-700 transition-all duration-200 hover:scale-[1.02] shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 animate-fade-in-up',
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-gov-500 to-gov-700'
                    : 'bg-gradient-to-br from-gold-400 to-gold-600'
                )}>
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className={cn('max-w-[75%]', msg.role === 'user' ? 'items-end' : '')}>
                  <div
                    className={cn(
                      'rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-gov-500 to-gov-700 text-white rounded-tr-md'
                        : 'bg-white border border-gray-100 text-gray-700 rounded-tl-md'
                    )}
                  >
                    <span
                      className={cn(
                        msg.role === 'assistant' && 'text-gov-600 hover:underline cursor-pointer'
                      )}
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline">$1</a>')
                          .replace(/\n/g, '<br/>')
                      }}
                    />
                  </div>
                  {msg.timestamp && (
                    <p className={cn(
                      'text-xs text-gray-400 mt-1.5',
                      msg.role === 'user' ? 'text-right' : ''
                    )}>
                      {msg.timestamp}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md bg-gradient-to-br from-gold-400 to-gold-600">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gov-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-gov-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-gov-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 md:px-6 py-4 border-t border-gray-100 bg-white">
            <div className="relative max-w-5xl mx-auto">
              {isRecording && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-red-500 text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                  <span className="text-sm font-medium">正在聆听...</span>
                  <div className="flex items-end gap-0.5 h-5">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <span
                        key={i}
                        className="w-0.5 bg-white rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 14 + 6}px`,
                          animationDelay: `${i * 80}ms`,
                          animationDuration: '0.8s'
                        }}
                      ></span>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative flex items-end gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-200 focus-within:border-gov-400 focus-within:ring-4 focus-within:ring-gov-100 transition-all">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`请输入您的问题...（当前使用：${dialect.label}）`}
                  rows={1}
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none resize-none max-h-32"
                  style={{ minHeight: '40px' }}
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={toggleRecording}
                    className={cn(
                      'p-2.5 rounded-xl transition-all duration-200',
                      isRecording
                        ? 'bg-red-500 text-white shadow-lg scale-105 animate-pulse'
                        : 'bg-white text-gray-500 hover:bg-gov-50 hover:text-gov-600 border border-gray-200'
                    )}
                    title={isRecording ? '停止录音' : '语音输入'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim()}
                    className={cn(
                      'p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2',
                      inputText.trim()
                        ? 'bg-gradient-to-r from-gov-500 to-gov-700 text-white shadow-gov hover:scale-105 hover:shadow-gov-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-medium">发送</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
                <span>按 Enter 发送 · Shift + Enter 换行</span>
                <span>·</span>
                <span>内容由AI生成，仅供参考</span>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
