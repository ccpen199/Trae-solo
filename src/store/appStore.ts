import { create } from 'zustand';
import {
  NewsSource,
  NewsItem,
  Keyword,
  Region,
  SubscriptionTopic,
  AlertRule,
  Alert,
  DashboardData,
  ReportTemplate
} from '../types';
import {
  mockNewsSources,
  mockNewsItems,
  mockKeywords,
  mockRegions,
  mockSubscriptionTopics,
  mockAlertRules,
  mockAlerts,
  mockDashboardData,
  mockReportTemplates
} from '../data/mockData';

interface AppState {
  newsSources: NewsSource[];
  newsItems: NewsItem[];
  keywords: Keyword[];
  regions: Region[];
  subscriptionTopics: SubscriptionTopic[];
  alertRules: AlertRule[];
  alerts: Alert[];
  dashboardData: DashboardData;
  reportTemplates: ReportTemplate[];
  selectedNewsItem: NewsItem | null;
  currentPage: string;
  
  setCurrentPage: (page: string) => void;
  setSelectedNewsItem: (news: NewsItem | null) => void;
  
  toggleSourceStatus: (id: string) => void;
  addSource: (source: Omit<NewsSource, 'id' | 'lastSync'>) => void;
  updateSource: (id: string, source: Partial<NewsSource>) => void;
  deleteSource: (id: string) => void;
  
  toggleKeywordMonitor: (id: string) => void;
  addKeyword: (keyword: Omit<Keyword, 'id' | 'matchCount'>) => void;
  updateKeyword: (id: string, keyword: Partial<Keyword>) => void;
  deleteKeyword: (id: string) => void;
  
  toggleRegionMonitor: (id: string) => void;
  addRegion: (region: Omit<Region, 'id'>) => void;
  updateRegion: (id: string, region: Partial<Region>) => void;
  deleteRegion: (id: string) => void;
  
  addSubscriptionTopic: (topic: Omit<SubscriptionTopic, 'id' | 'createdAt'>) => void;
  updateSubscriptionTopic: (id: string, topic: Partial<SubscriptionTopic>) => void;
  deleteSubscriptionTopic: (id: string) => void;
  
  toggleAlertRule: (id: string) => void;
  addAlertRule: (rule: Omit<AlertRule, 'id'>) => void;
  updateAlertRule: (id: string, rule: Partial<AlertRule>) => void;
  deleteAlertRule: (id: string) => void;
  
  markAlertAsRead: (id: string) => void;
  processAlert: (id: string, note: string) => void;
  
  markNewsAsRead: (id: string) => void;
  
  addReportTemplate: (template: Omit<ReportTemplate, 'id' | 'createdAt'>) => void;
  updateReportTemplate: (id: string, template: Partial<ReportTemplate>) => void;
  deleteReportTemplate: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  newsSources: mockNewsSources,
  newsItems: mockNewsItems,
  keywords: mockKeywords,
  regions: mockRegions,
  subscriptionTopics: mockSubscriptionTopics,
  alertRules: mockAlertRules,
  alerts: mockAlerts,
  dashboardData: mockDashboardData,
  reportTemplates: mockReportTemplates,
  selectedNewsItem: null,
  currentPage: 'dashboard',
  
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedNewsItem: (news) => set({ selectedNewsItem: news }),
  
  toggleSourceStatus: (id) => set((state) => ({
    newsSources: state.newsSources.map((s) =>
      s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
    )
  })),
  
  addSource: (source) => set((state) => ({
    newsSources: [
      ...state.newsSources,
      {
        ...source,
        id: Date.now().toString(),
        lastSync: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    ]
  })),
  
  updateSource: (id, source) => set((state) => ({
    newsSources: state.newsSources.map((s) =>
      s.id === id ? { ...s, ...source } : s
    )
  })),
  
  deleteSource: (id) => set((state) => ({
    newsSources: state.newsSources.filter((s) => s.id !== id)
  })),
  
  toggleKeywordMonitor: (id) => set((state) => ({
    keywords: state.keywords.map((k) =>
      k.id === id ? { ...k, monitorStatus: k.monitorStatus === 'active' ? 'paused' : 'active' } : k
    )
  })),
  
  addKeyword: (keyword) => set((state) => ({
    keywords: [
      ...state.keywords,
      {
        ...keyword,
        id: Date.now().toString(),
        matchCount: 0
      }
    ]
  })),
  
  updateKeyword: (id, keyword) => set((state) => ({
    keywords: state.keywords.map((k) =>
      k.id === id ? { ...k, ...keyword } : k
    )
  })),
  
  deleteKeyword: (id) => set((state) => ({
    keywords: state.keywords.filter((k) => k.id !== id)
  })),
  
  toggleRegionMonitor: (id) => set((state) => ({
    regions: state.regions.map((r) =>
      r.id === id ? { ...r, monitorStatus: r.monitorStatus === 'active' ? 'paused' : 'active' } : r
    )
  })),
  
  addRegion: (region) => set((state) => ({
    regions: [
      ...state.regions,
      {
        ...region,
        id: Date.now().toString()
      }
    ]
  })),
  
  updateRegion: (id, region) => set((state) => ({
    regions: state.regions.map((r) =>
      r.id === id ? { ...r, ...region } : r
    )
  })),
  
  deleteRegion: (id) => set((state) => ({
    regions: state.regions.filter((r) => r.id !== id)
  })),
  
  addSubscriptionTopic: (topic) => set((state) => ({
    subscriptionTopics: [
      ...state.subscriptionTopics,
      {
        ...topic,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    ]
  })),
  
  updateSubscriptionTopic: (id, topic) => set((state) => ({
    subscriptionTopics: state.subscriptionTopics.map((t) =>
      t.id === id ? { ...t, ...topic } : t
    )
  })),
  
  deleteSubscriptionTopic: (id) => set((state) => ({
    subscriptionTopics: state.subscriptionTopics.filter((t) => t.id !== id)
  })),
  
  toggleAlertRule: (id) => set((state) => ({
    alertRules: state.alertRules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    )
  })),
  
  addAlertRule: (rule) => set((state) => ({
    alertRules: [
      ...state.alertRules,
      {
        ...rule,
        id: Date.now().toString()
      }
    ]
  })),
  
  updateAlertRule: (id, rule) => set((state) => ({
    alertRules: state.alertRules.map((r) =>
      r.id === id ? { ...r, ...rule } : r
    )
  })),
  
  deleteAlertRule: (id) => set((state) => ({
    alertRules: state.alertRules.filter((r) => r.id !== id)
  })),
  
  markAlertAsRead: (id) => set((state) => ({
    alerts: state.alerts.map((a) =>
      a.id === id ? { ...a, status: a.status === 'unread' ? 'read' : a.status } : a
    )
  })),
  
  processAlert: (id, note) => set((state) => ({
    alerts: state.alerts.map((a) =>
      a.id === id ? {
        ...a,
        status: 'processed',
        processedBy: '张三',
        processedTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        processedNote: note
      } : a
    )
  })),
  
  markNewsAsRead: (id) => set((state) => ({
    newsItems: state.newsItems.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
  })),
  
  addReportTemplate: (template) => set((state) => ({
    reportTemplates: [
      ...state.reportTemplates,
      {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    ]
  })),
  
  updateReportTemplate: (id, template) => set((state) => ({
    reportTemplates: state.reportTemplates.map((t) =>
      t.id === id ? { ...t, ...template } : t
    )
  })),
  
  deleteReportTemplate: (id) => set((state) => ({
    reportTemplates: state.reportTemplates.filter((t) => t.id !== id)
  }))
}));
