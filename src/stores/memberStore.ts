import { create } from 'zustand';
import type { MemberProfile, PointsTransaction, ConsultSession, ConsultMessage } from '@/types/member';
import type { Breed, SymptomNode, DiseaseNode, SymptomCheckResult, SymptomCheckRequest } from '@/types/knowledge';
import { memberService, consultService, knowledgeService } from '@/services/memberService';

interface MemberState {
  profile: MemberProfile | null;
  pointsTransactions: PointsTransaction[];
  consults: ConsultSession[];
  currentConsult: ConsultSession | null;
  consultMessages: ConsultMessage[];
  breeds: Breed[];
  symptoms: SymptomNode[];
  diseases: DiseaseNode[];
  symptomCheckResult: SymptomCheckResult | null;
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  fetchPointsTransactions: () => Promise<void>;
  fetchConsults: () => Promise<void>;
  fetchConsultMessages: (sessionId: string) => Promise<void>;
  sendConsultMessage: (sessionId: string, content: string, type: 'text' | 'image') => Promise<ConsultMessage>;
  createConsult: (petId: string, question: string, type: 'text' | 'video') => Promise<ConsultSession>;
  setCurrentConsult: (consult: ConsultSession | null) => void;
  fetchBreeds: (species?: 'dog' | 'cat' | 'rabbit' | 'bird' | 'other') => Promise<void>;
  fetchSymptoms: () => Promise<void>;
  checkSymptoms: (data: SymptomCheckRequest) => Promise<SymptomCheckResult>;
  clearSymptomCheck: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  profile: null,
  pointsTransactions: [],
  consults: [],
  currentConsult: null,
  consultMessages: [],
  breeds: [],
  symptoms: [],
  diseases: [],
  symptomCheckResult: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await memberService.getMemberProfile();
      set({ profile, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取会员信息失败', isLoading: false });
    }
  },

  fetchPointsTransactions: async () => {
    set({ isLoading: true });
    try {
      const transactions = await memberService.getPointsTransactions();
      set({ pointsTransactions: transactions, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取积分流水失败', isLoading: false });
    }
  },

  fetchConsults: async () => {
    set({ isLoading: true });
    try {
      const consults = await consultService.getConsults();
      set({ consults, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取问诊列表失败', isLoading: false });
    }
  },

  fetchConsultMessages: async (sessionId) => {
    set({ isLoading: true });
    try {
      const messages = await consultService.getMessages(sessionId);
      set({ consultMessages: messages, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取消息失败', isLoading: false });
    }
  },

  sendConsultMessage: async (sessionId, content, type) => {
    set({ isLoading: true });
    try {
      const message = await consultService.sendMessage(sessionId, { messageType: type, content });
      set((state) => ({
        consultMessages: [...state.consultMessages, message],
        isLoading: false,
      }));
      return message;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '发送消息失败', isLoading: false });
      throw err;
    }
  },

  createConsult: async (petId, question, type) => {
    set({ isLoading: true });
    try {
      const consult = await consultService.createConsult({ petId, question, type });
      set((state) => ({
        consults: [consult, ...state.consults],
        currentConsult: consult,
        consultMessages: consult.messages,
        isLoading: false,
      }));
      return consult;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建问诊失败', isLoading: false });
      throw err;
    }
  },

  setCurrentConsult: (consult) => {
    set({ currentConsult: consult });
    if (consult) {
      get().fetchConsultMessages(consult.id);
    }
  },

  fetchBreeds: async (species) => {
    set({ isLoading: true });
    try {
      const breeds = await knowledgeService.getBreeds(species);
      set({ breeds, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取品种列表失败', isLoading: false });
    }
  },

  fetchSymptoms: async () => {
    set({ isLoading: true });
    try {
      const symptoms = await knowledgeService.getSymptoms();
      set({ symptoms, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取症状列表失败', isLoading: false });
    }
  },

  checkSymptoms: async (data) => {
    set({ isLoading: true });
    try {
      const result = await knowledgeService.checkSymptoms(data);
      set({ symptomCheckResult: result, isLoading: false });
      return result;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '症状自查失败', isLoading: false });
      throw err;
    }
  },

  clearSymptomCheck: () => {
    set({ symptomCheckResult: null });
  },
}));
