import { Alert } from '../types';

export interface AlertServiceConfig {
  maxAlerts: number;
  operator: string;
}

export const DEFAULT_ALERT_CONFIG: AlertServiceConfig = {
  maxAlerts: 500,
  operator: 'Alert-Service'
};

export class AlertService {
  private config: AlertServiceConfig;
  private alerts: Map<string, Alert> = new Map();
  private alertCallbacks: ((alert: Alert) => void)[] = [];

  constructor(config?: Partial<AlertServiceConfig>) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  createAlert(alert: Omit<Alert, 'id' | 'operator'>): Alert {
    const now = Date.now();
    const newAlert: Alert = {
      ...alert,
      operator: this.config.operator
    };

    this.alerts.set(newAlert.id, newAlert);

    const sortedAlerts = Array.from(this.alerts.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, this.config.maxAlerts);

    this.alerts.clear();
    sortedAlerts.forEach(alert => this.alerts.set(alert.id, alert));

    this.alertCallbacks.forEach(callback => callback(newAlert));

    return newAlert;
  }

  acknowledgeAlert(alertId: string, operator: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return null;
    }

    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = operator;
    alert.status = 'acknowledged';

    return alert;
  }

  resolveAlert(alertId: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return null;
    }

    alert.status = 'resolved';

    return alert;
  }

  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status === 'active')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getAcknowledgedAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status === 'acknowledged')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getResolvedAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status === 'resolved')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getAlertsByLevel(level: Alert['level']): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.level === level)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getAlertsByPond(pondId: string): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.message.includes(pondId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  onNewAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  getUnacknowledgedCount(): number {
    return this.getActiveAlerts().length;
  }

  getCriticalCount(): number {
    return this.getAlertsByLevel('red').length;
  }

  getWarningCount(): number {
    return this.getAlertsByLevel('orange').length;
  }

  clearResolvedAlerts(): number {
    const resolvedAlerts = this.getResolvedAlerts();
    resolvedAlerts.forEach(alert => this.alerts.delete(alert.id));
    return resolvedAlerts.length;
  }

  updateConfig(config: Partial<AlertServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AlertServiceConfig {
    return { ...this.config };
  }
}
