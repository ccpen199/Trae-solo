import { create } from 'zustand';
import type { ChatMessage } from '@/types/chat';

const mockResponses: Record<string, string> = {
  default: '我已收到您的信息。让我帮您将这些经历转化为专业的简历内容。\n\n我注意到您的职业背景很有竞争力，接下来我会：\n1. 使用STAR法则重写您的项目经历\n2. 强化行业关键词\n3. 优化ATS兼容性\n\n请继续告诉我更多关于您的项目细节。',
};

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  currentResumePreview: string;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  sendMessage: (content: string) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是ResumeForge AI助手 🌟\n\n我将帮助您创建一份专业的简历。请告诉我：\n\n1. **您的职业方向** — 目前在寻找什么类型的岗位？\n2. **工作经历** — 您有哪些重要的工作经历？\n3. **项目亮点** — 有哪些让您自豪的项目成果？\n\n您可以随意描述，我会帮您整理成结构化的简历内容。',
      timestamp: new Date().toISOString(),
    },
  ],
  isTyping: false,
  currentResumePreview: '',

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  sendMessage: (content) => {
    const { addMessage, setTyping } = get();

    addMessage({ role: 'user', content });

    setTyping(true);

    setTimeout(() => {
      const response = mockResponses.default;
      addMessage({ role: 'assistant', content: response });
      setTyping(false);
    }, 1500);
  },

  setTyping: (typing) => set({ isTyping: typing }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '对话已重置。请告诉我您的职业背景，我将帮您创建专业简历！',
          timestamp: new Date().toISOString(),
        },
      ],
    }),
}));
