import { create } from 'zustand';
import type { Dashboard, WidgetConfig } from '../types/dashboard';

interface DashboardState {
  dashboards: Dashboard[];
  currentDashboardId: string | null;
  isEditing: boolean;
  selectedWidgetId: string | null;
  draggedWidget: WidgetConfig | null;
  
  setCurrentDashboard: (id: string) => void;
  toggleEditMode: () => void;
  selectWidget: (id: string | null) => void;
  setDraggedWidget: (widget: WidgetConfig | null) => void;
  addWidget: (dashboardId: string, widget: WidgetConfig) => void;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<WidgetConfig>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  createDashboard: (name: string) => void;
  deleteDashboard: (id: string) => void;
}

const defaultWidgets: WidgetConfig[] = [
  {
    id: 'w-001',
    type: 'metric-card',
    title: '房企总数',
    size: { w: 1, h: 1 },
    position: { x: 0, y: 0 },
    dataSource: 'companies',
    metric: 'totalCount',
  },
  {
    id: 'w-002',
    type: 'metric-card',
    title: '项目总数',
    size: { w: 1, h: 1 },
    position: { x: 1, y: 0 },
    dataSource: 'projects',
    metric: 'totalCount',
  },
  {
    id: 'w-003',
    type: 'metric-card',
    title: '今日舆情',
    size: { w: 1, h: 1 },
    position: { x: 2, y: 0 },
    dataSource: 'sentiment',
    metric: 'todayCount',
  },
  {
    id: 'w-004',
    type: 'metric-card',
    title: '预警数量',
    size: { w: 1, h: 1 },
    position: { x: 3, y: 0 },
    dataSource: 'monitoring',
    metric: 'alertCount',
  },
  {
    id: 'w-005',
    type: 'line-chart',
    title: '销售趋势',
    size: { w: 2, h: 2 },
    position: { x: 0, y: 1 },
    dataSource: 'sales',
    metric: 'salesAmount',
    timeRange: '12m',
  },
  {
    id: 'w-006',
    type: 'bar-chart',
    title: '房企销售TOP10',
    size: { w: 2, h: 2 },
    position: { x: 2, y: 1 },
    dataSource: 'companies',
    metric: 'salesRanking',
  },
  {
    id: 'w-007',
    type: 'pie-chart',
    title: '舆情情感分布',
    size: { w: 1, h: 2 },
    position: { x: 0, y: 3 },
    dataSource: 'sentiment',
    metric: 'sentimentDistribution',
  },
  {
    id: 'w-008',
    type: 'list',
    title: '最新预警',
    size: { w: 3, h: 2 },
    position: { x: 1, y: 3 },
    dataSource: 'monitoring',
    metric: 'latestAlerts',
  },
];

const defaultDashboards: Dashboard[] = [
  {
    id: 'dash-001',
    name: '行业总览',
    description: '房地产行业整体数据概览',
    widgets: defaultWidgets,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    isDefault: true,
  },
  {
    id: 'dash-002',
    name: '财务监测',
    description: '重点企业财务指标监测',
    widgets: defaultWidgets.slice(0, 6),
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
    isDefault: false,
  },
  {
    id: 'dash-003',
    name: '舆情监控',
    description: '行业舆情实时监控',
    widgets: defaultWidgets.slice(2, 8),
    createdAt: '2024-01-08',
    updatedAt: '2024-01-14',
    isDefault: false,
  },
];

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboards: defaultDashboards,
  currentDashboardId: 'dash-001',
  isEditing: false,
  selectedWidgetId: null,
  draggedWidget: null,
  
  setCurrentDashboard: (id) => set({ currentDashboardId: id }),
  
  toggleEditMode: () => set({ isEditing: !get().isEditing }),
  
  selectWidget: (id) => set({ selectedWidgetId: id }),
  
  setDraggedWidget: (widget) => set({ draggedWidget: widget }),
  
  addWidget: (dashboardId, widget) => set((state) => ({
    dashboards: state.dashboards.map(d => 
      d.id === dashboardId 
        ? { ...d, widgets: [...d.widgets, widget], updatedAt: new Date().toISOString() }
        : d
    ),
  })),
  
  updateWidget: (dashboardId, widgetId, updates) => set((state) => ({
    dashboards: state.dashboards.map(d => 
      d.id === dashboardId 
        ? {
            ...d,
            widgets: d.widgets.map(w => 
              w.id === widgetId ? { ...w, ...updates } : w
            ),
            updatedAt: new Date().toISOString(),
          }
        : d
    ),
  })),
  
  removeWidget: (dashboardId, widgetId) => set((state) => ({
    dashboards: state.dashboards.map(d => 
      d.id === dashboardId 
        ? {
            ...d,
            widgets: d.widgets.filter(w => w.id !== widgetId),
            updatedAt: new Date().toISOString(),
          }
        : d
    ),
  })),
  
  createDashboard: (name) => {
    const newDashboard: Dashboard = {
      id: `dash-${Date.now()}`,
      name,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    };
    set((state) => ({
      dashboards: [...state.dashboards, newDashboard],
      currentDashboardId: newDashboard.id,
    }));
  },
  
  deleteDashboard: (id) => set((state) => ({
    dashboards: state.dashboards.filter(d => d.id !== id),
    currentDashboardId: state.currentDashboardId === id 
      ? state.dashboards.find(d => d.id !== id)?.id || null
      : state.currentDashboardId,
  })),
}));
