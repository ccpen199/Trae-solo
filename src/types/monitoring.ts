export type AlertType = 'finance' | 'judicial' | 'sentiment' | 'operation';
export type AlertLevel = 'high' | 'medium' | 'low';
export type AlertStatus = 'unread' | 'read' | 'processed';
export type AlertDirection = 'up' | 'down' | 'both';

export interface Alert {
  id: string;
  type: AlertType;
  typeName: string;
  level: AlertLevel;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  metric?: string;
  metricName?: string;
  currentValue?: number;
  threshold?: number;
  deviation?: number;
  deviationPercent?: number;
  status: AlertStatus;
  createTime: string;
  updateTime?: string;
  relatedDataIds?: string[];
}

export interface AlertThreshold {
  id: string;
  metric: string;
  metricName: string;
  category: string;
  highThreshold: number;
  mediumThreshold: number;
  lowThreshold: number;
  direction: AlertDirection;
  enabled: boolean;
  unit?: string;
  description?: string;
}

export interface AlertStats {
  total: number;
  unread: number;
  high: number;
  medium: number;
  low: number;
  finance: number;
  judicial: number;
  sentiment: number;
  operation: number;
}

export interface AlertFilter {
  type?: AlertType[];
  level?: AlertLevel[];
  status?: AlertStatus[];
  companyId?: string;
  dateRange?: [string, string];
  keyword?: string;
}
