export type WidgetType = 
  | 'metric-card'
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'table'
  | 'list'
  | 'progress'
  | 'heatmap';

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: {
    w: number;
    h: number;
  };
  position: {
    x: number;
    y: number;
  };
  dataSource: string;
  metric: string;
  dimensions?: string[];
  filters?: Record<string, any>;
  timeRange?: string;
  compareMode?: 'none' | 'yoy' | 'mom';
  style?: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  shareConfig?: {
    enabled: boolean;
    shareUrl?: string;
    password?: string;
    expireTime?: string;
  };
}

export interface DashboardState {
  dashboards: Dashboard[];
  currentDashboardId: string | null;
  isEditing: boolean;
  selectedWidgetId: string | null;
  draggedWidget: WidgetConfig | null;
}
