import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  Clock,
  Building2,
  CheckCircle2,
  ArrowRight,
  X,
  FileCheck,
  ListChecks,
  Route,
} from 'lucide-react';
import { mockServices, quickQuestions } from '../mock/data';
import type { ChatMessage, ServiceItem, MaterialItem, GuideStep } from '../shared/types';

const keywordMap: Record<string, string[]> = {
  '1': ['社保卡', '社保', '社会保障卡'],
  '2': ['户口', '迁移', '落户', '户籍'],
  '3': ['出生证明', '出生', '新生儿', '医学证明'],
  '7': ['公积金', '提取', '住房公积金'],
  '5': ['企业', '开办', '注册', '公司'],
  '8': ['结婚证', '结婚', '婚姻', '预约'],
};

const generateGuideSteps = (service: ServiceItem): GuideStep[] => {
  const steps: GuideStep[] = [
    {
      step: 1,
      title: '在线预约',
      description: `通过政务服务平台预约「${service.name}」，选择办理时间和地点`,
      department: service.department,
      duration: '5分钟',
    },
    {
      step: 2,
      title: '准备材料',
      description: `按照材料清单准备所需材料，支持电子证照免提交`,
      department: service.department,
      duration: '10分钟',
    },
    {
      step: 3,
      title: '在线填报',
      description: '填写申请表格，系统自动回填已有证照信息',
      department: service.department,
      duration: '10分钟',
    },
    {
      step: 4,
      title: '提交审核',
      description: '提交申请，工作人员进行材料审核',
      department: service.department,
      duration: service.handlingTime,
    },
    {
      step: 5,
      title: '领取结果',
      description: '审核通过后，可选择邮寄送达或窗口自取',
      department: service.department,
      duration: '即时',
    },
  ];
  return steps;
};

const matchService = (query: string): ServiceItem | null => {
  const lowerQuery = query.toLowerCase();
  
  for (const [serviceId, keywords] of Object.entries(keywordMap)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return mockServices.find(s => s.id === serviceId) || null;
      }
    }
  }
  
  for (const service of mockServices) {
    if (
      lowerQuery.includes(service.name.toLowerCase()) ||
      lowerQuery.includes(service.category.toLowerCase()) ||
      lowerQuery.includes(service.description.toLowerCase())
    ) {
      return service;
    }
  }
  
  return null;
};

const generateId = () => Math.random().toString(36).substring(2, 15);

export default function Guide() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: '您好！我是智能导办助手 🤖，可以帮您解答政务服务相关问题。请告诉我您想办理什么业务，或者点击下方快捷问题开始咨询。',
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setShowQuickQuestions(false);

    setTimeout(() => {
      const matchedService = matchService(content);
      
      if (matchedService) {
        const guideSteps = generateGuideSteps(matchedService);
        
        const textResponse: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `根据您的需求，为您匹配到「${matchedService.name}」服务事项。该事项由${matchedService.department}负责办理，预计办理时间${matchedService.handlingTime}。`,
          timestamp: new Date(),
          type: 'text',
        };

        const cardResponse: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          type: 'card',
          data: {
            service: matchedService,
            steps: guideSteps,
            materials: matchedService.requiredMaterials,
          },
        };

        setMessages(prev => [...prev, textResponse, cardResponse]);
      } else {
        const response: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '抱歉，我暂时没有理解您的问题。您可以尝试以下方式：\n\n1. 点击下方快捷问题\n2. 尝试更具体的描述，如"我要办理社保卡"\n3. 咨询以下热门业务：社保卡申领、户口迁移、出生证明办理、公积金提取、企业开办、结婚证预约',
          timestamp: new Date(),
          type: 'text',
        };
        setMessages(prev => [...prev, response]);
        setShowQuickQuestions(true);
      }
      
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleApply = (serviceId: string) => {
    navigate(`/services/${serviceId}`);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: generateId(),
        role: 'assistant',
        content: '对话已清空。您好！我是智能导办助手 🤖，请问有什么可以帮您？',
        timestamp: new Date(),
        type: 'text',
      },
    ]);
    setShowQuickQuestions(true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gov-gray-50 to-primary-50/30">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <div className="bg-white border-b border-gov-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gov-gray-700">智能导办助手</h1>
              <p className="text-xs text-gov-gray-400">7×24小时在线为您服务</p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gov-gray-500 hover:text-gov-red hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            清空对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`flex gap-3 max-w-[85%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                      : 'bg-gradient-to-br from-gov-cyan to-primary-500'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                <div
                  className={`flex flex-col ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {message.type === 'text' && (
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-sm shadow-lg shadow-primary-500/20'
                          : 'bg-white text-gov-gray-700 border border-gov-gray-100 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  )}

                  {message.type === 'card' && message.data && (
                    <div className="space-y-4 w-full">
                      <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gov-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-white font-semibold text-lg">
                                  {message.data.service.name}
                                </h3>
                                <p className="text-white/80 text-xs">
                                  {message.data.service.category}
                                </p>
                              </div>
                            </div>
                            {message.data.service.hotLevel > 900 && (
                              <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                                热门
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-5">
                          <p className="text-sm text-gov-gray-500 mb-4">
                            {message.data.service.description}
                          </p>

                          <div className="flex items-center gap-4 mb-4 text-xs text-gov-gray-400">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {message.data.service.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {message.data.service.handlingTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-gov-green" />
                              支持在线办理
                            </span>
                          </div>

                          <button
                            onClick={() => handleApply(message.data.service.id)}
                            className="w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium text-sm hover:from-primary-600 hover:to-primary-700 transition-all shadow-md shadow-primary-500/30 flex items-center justify-center gap-2"
                          >
                            立即办理
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gov-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gov-gray-100 flex items-center gap-2">
                          <Route className="w-5 h-5 text-primary-500" />
                          <h4 className="font-semibold text-gov-gray-700">办理路径</h4>
                        </div>
                        <div className="p-5">
                          <div className="space-y-4">
                            {message.data.steps.map((step: GuideStep, idx: number) => (
                              <div key={step.step} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      idx === 0
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gov-gray-100 text-gov-gray-500'
                                    }`}
                                  >
                                    {step.step}
                                  </div>
                                  {idx < message.data.steps.length - 1 && (
                                    <div className="w-0.5 h-full bg-gov-gray-100 mt-2" />
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-center justify-between mb-1">
                                    <h5 className="font-medium text-gov-gray-700 text-sm">
                                      {step.title}
                                    </h5>
                                    <span className="text-xs text-gov-gray-400">
                                      {step.duration}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gov-gray-500">
                                    {step.description}
                                  </p>
                                  <p className="text-xs text-gov-gray-400 mt-1">
                                    {step.department}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gov-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gov-gray-100 flex items-center gap-2">
                          <ListChecks className="w-5 h-5 text-primary-500" />
                          <h4 className="font-semibold text-gov-gray-700">材料清单</h4>
                        </div>
                        <div className="p-5">
                          <div className="space-y-3">
                            {message.data.materials.map((material: MaterialItem) => (
                              <div
                                key={material.id}
                                className="flex items-start gap-3 p-3 bg-gov-gray-50 rounded-xl"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                  <FileCheck className="w-4 h-4 text-primary-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gov-gray-700">
                                      {material.name}
                                    </span>
                                    {material.required && (
                                      <span className="px-1.5 py-0.5 bg-red-100 text-gov-red text-xs rounded">
                                        必需
                                      </span>
                                    )}
                                    {material.isElectronic && (
                                      <span className="px-1.5 py-0.5 bg-green-100 text-gov-green text-xs rounded">
                                        电子证照
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gov-gray-500 mt-1">
                                    {material.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {message.data.materials.length === 0 && (
                            <p className="text-sm text-gov-gray-400 text-center py-4">
                              无需提交材料
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <span
                    className={`text-xs text-gov-gray-400 mt-1.5 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-gov-cyan to-primary-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gov-gray-100">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gov-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gov-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gov-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showQuickQuestions && (
          <div className="px-6 py-3 bg-white border-t border-gov-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gov-orange" />
              <span className="text-sm font-medium text-gov-gray-600">快捷问题</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(question)}
                  className="px-3 py-1.5 text-sm bg-gov-gray-50 hover:bg-primary-50 text-gov-gray-600 hover:text-primary-600 rounded-full border border-gov-gray-200 hover:border-primary-200 transition-all hover:scale-105"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border-t border-gov-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入您想咨询的问题..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gov-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gov-gray-700 placeholder:text-gov-gray-400"
              />
            </div>
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim()}
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white flex items-center justify-center hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-500/30 hover:shadow-lg hover:shadow-primary-500/40"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gov-gray-400 mt-2 text-center">
            智能助手仅供参考，具体办理以实际政策为准
          </p>
        </div>
      </div>
    </div>
  );
}
