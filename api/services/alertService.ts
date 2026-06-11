import db from "../db/index.js";
import type {
  Alert,
  AlertRule,
  AlertType,
  AlertSeverity,
  AlertStatus,
  ConditionOperator,
} from "../../shared/types.js";
import { healthDataService } from "./healthDataService.js";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function rowToAlert(row: unknown): Alert {
  const r = row as {
    id: string;
    user_id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    value: number;
    threshold: number;
    started_at: string;
    duration_minutes: number;
    status: AlertStatus;
    created_at: string;
    acknowledged_by?: string;
    acknowledged_at?: string;
    disposition_status?: string;
    disposition_note?: string;
    review_scheduled_at?: string;
    review_completed_at?: string;
    referral_needed?: number;
    referral_appointment_id?: string;
    dismissed_by?: string;
    dismissed_at?: string;
    dismiss_reason?: string;
  };
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    severity: r.severity,
    title: r.title,
    description: r.description,
    value: r.value,
    threshold: r.threshold,
    startedAt: r.started_at,
    durationMinutes: r.duration_minutes,
    status: r.status,
    createdAt: r.created_at,
    acknowledgedBy: r.acknowledged_by,
    acknowledgedAt: r.acknowledged_at,
    dispositionStatus: r.disposition_status as Alert["dispositionStatus"],
    dispositionNote: r.disposition_note,
    reviewScheduledAt: r.review_scheduled_at,
    reviewCompletedAt: r.review_completed_at,
    referralNeeded: r.referral_needed === 1,
    referralAppointmentId: r.referral_appointment_id,
    dismissedBy: r.dismissed_by,
    dismissedAt: r.dismissed_at,
    dismissReason: r.dismiss_reason,
  };
}

function rowToAlertRule(row: unknown): AlertRule {
  const r = row as {
    id: string;
    user_id: string;
    metric: string;
    metric_name: string;
    condition: ConditionOperator;
    threshold: number;
    duration_minutes: number;
    severity: AlertSeverity;
    enabled: number;
  };
  return {
    id: r.id,
    userId: r.user_id,
    metric: r.metric,
    metricName: r.metric_name,
    condition: r.condition,
    threshold: r.threshold,
    durationMinutes: r.duration_minutes,
    severity: r.severity,
    enabled: r.enabled === 1,
  };
}

export class AlertService {
  getAlerts(userId: string, status?: AlertStatus): Alert[] {
    let sql = `SELECT * FROM alerts WHERE user_id = ?`;
    const params: (string | number)[] = [userId];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY started_at DESC`;
    const rows = db.prepare(sql).all(...params) as unknown[];
    return rows.map(rowToAlert);
  }

  getActiveAlerts(userId: string): Alert[] {
    return this.getAlerts(userId, "active");
  }

  getAlertRules(userId: string): AlertRule[] {
    const stmt = db.prepare(`SELECT * FROM alert_rules WHERE user_id = ? ORDER BY severity DESC`);
    const rows = stmt.all(userId) as unknown[];
    return rows.map(rowToAlertRule);
  }

  createAlertRule(
    userId: string,
    rule: Omit<AlertRule, "id" | "userId">
  ): AlertRule {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO alert_rules (id, user_id, metric, metric_name, condition, threshold, duration_minutes, severity, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      rule.metric,
      rule.metricName,
      rule.condition,
      rule.threshold,
      rule.durationMinutes,
      rule.severity,
      rule.enabled ? 1 : 0
    );
    return this.getAlertRules(userId).find((r) => r.id === id) as AlertRule;
  }

  updateAlertRule(
    userId: string,
    ruleId: string,
    updates: Partial<AlertRule>
  ): AlertRule | null {
    const existing = this.getAlertRules(userId).find((r) => r.id === ruleId);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    db.prepare(
      `UPDATE alert_rules SET metric = ?, metric_name = ?, condition = ?, threshold = ?, duration_minutes = ?, severity = ?, enabled = ? WHERE id = ?`
    ).run(
      merged.metric,
      merged.metricName,
      merged.condition,
      merged.threshold,
      merged.durationMinutes,
      merged.severity,
      merged.enabled ? 1 : 0,
      ruleId
    );

    return this.getAlertRules(userId).find((r) => r.id === ruleId) as AlertRule;
  }

  deleteAlertRule(userId: string, ruleId: string): boolean {
    const result = db
      .prepare(`DELETE FROM alert_rules WHERE id = ? AND user_id = ?`)
      .run(ruleId, userId);
    return result.changes > 0;
  }

  acknowledgeAlert(userId: string, alertId: string, data?: Record<string, unknown>): Alert | null {
    const acknowledgedBy = data?.acknowledgedBy as string | undefined;
    const stmt = db.prepare(`
      UPDATE alerts SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ? WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(acknowledgedBy || "系统", new Date().toISOString(), alertId, userId);
    if (result.changes === 0) return null;
    return this.getAlerts(userId).find((a) => a.id === alertId) as Alert;
  }

  dismissAlert(userId: string, alertId: string, data?: Record<string, unknown>): Alert | null {
    const dismissedBy = data?.dismissedBy as string | undefined;
    const dismissReason = data?.dismissReason as string | undefined;
    const stmt = db.prepare(`
      UPDATE alerts SET status = 'dismissed', dismissed_by = ?, dismissed_at = ?, dismiss_reason = ? WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(dismissedBy || "系统", new Date().toISOString(), dismissReason || null, alertId, userId);
    if (result.changes === 0) return null;
    return this.getAlerts(userId).find((a) => a.id === alertId) as Alert;
  }

  scheduleReview(userId: string, alertId: string, reviewTime: string, dispositionStatus?: string): Alert | null {
    const stmt = db.prepare(`
      UPDATE alerts SET status = 'pending_review', review_scheduled_at = ?, disposition_status = ? WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(reviewTime, dispositionStatus || null, alertId, userId);
    if (result.changes === 0) return null;
    return this.getAlerts(userId).find((a) => a.id === alertId) as Alert;
  }

  markForReferral(userId: string, alertId: string, appointmentId?: string): Alert | null {
    const stmt = db.prepare(`
      UPDATE alerts SET status = 'needs_referral', referral_needed = 1, referral_appointment_id = ? WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(appointmentId || null, alertId, userId);
    if (result.changes === 0) return null;
    return this.getAlerts(userId).find((a) => a.id === alertId) as Alert;
  }

  completeReview(userId: string, alertId: string, dispositionStatus: string, dispositionNote?: string): Alert | null {
    const stmt = db.prepare(`
      UPDATE alerts SET status = 'acknowledged', review_completed_at = ?, disposition_status = ?, disposition_note = ? WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(new Date().toISOString(), dispositionStatus, dispositionNote || null, alertId, userId);
    if (result.changes === 0) return null;
    return this.getAlerts(userId).find((a) => a.id === alertId) as Alert;
  }

  createAlert(
    userId: string,
    alert: Partial<Alert> & { type: AlertType; severity: AlertSeverity; title: string; startedAt: string }
  ): Alert {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO alerts (
        id, user_id, type, severity, title, description, value, threshold, 
        started_at, duration_minutes, status, acknowledged_by, acknowledged_at,
        disposition_status, disposition_note, review_scheduled_at, review_completed_at,
        referral_needed, referral_appointment_id, dismissed_by, dismissed_at, dismiss_reason
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      userId,
      alert.type,
      alert.severity,
      alert.title,
      alert.description || "",
      alert.value || 0,
      alert.threshold || 0,
      alert.startedAt,
      alert.durationMinutes || 0,
      alert.status || "active",
      alert.acknowledgedBy || null,
      alert.acknowledgedAt || null,
      alert.dispositionStatus || null,
      alert.dispositionNote || null,
      alert.reviewScheduledAt || null,
      alert.reviewCompletedAt || null,
      alert.referralNeeded ? 1 : 0,
      alert.referralAppointmentId || null,
      alert.dismissedBy || null,
      alert.dismissedAt || null,
      alert.dismissReason || null
    );
    return this.getAlerts(userId).find((a) => a.id === id) as Alert;
  }

  evaluateRules(userId: string): Alert[] {
    const rules = this.getAlertRules(userId).filter((r) => r.enabled);
    const vitals = healthDataService.getVitalRecords(userId, 1);
    const baselineHR = healthDataService.getBaselineHeartRate(userId);
    const newAlerts: Alert[] = [];

    if (vitals.length < 2) return newAlerts;

    for (const rule of rules) {
      const records = vitals.filter((v) => {
        const recordTime = new Date(v.timestamp).getTime();
        const thresholdTime = Date.now() - rule.durationMinutes * 60 * 1000;
        return recordTime >= thresholdTime;
      });

      if (records.length < Math.min(2, rule.durationMinutes / 30)) continue;

      let triggered = false;
      let triggerValue = 0;

      for (const record of records) {
        const values: Record<string, number> = {
          heartRate: record.heartRate,
          hrv: record.hrv,
          bloodOxygen: record.bloodOxygen,
          stressIndex: record.stressIndex,
          restingHeartRate: record.restingHeartRate,
        };

        const currentValue = values[rule.metric];
        if (currentValue === undefined) continue;

        switch (rule.condition) {
          case "gt":
            triggered = currentValue > rule.threshold;
            break;
          case "lt":
            triggered = currentValue < rule.threshold;
            break;
          case "gte":
            triggered = currentValue >= rule.threshold;
            break;
          case "lte":
            triggered = currentValue <= rule.threshold;
            break;
          case "spike_percent":
            if (baselineHR > 0 && rule.metric === "restingHeartRate") {
              const percentChange = ((currentValue - baselineHR) / baselineHR) * 100;
              triggered = percentChange > rule.threshold;
              triggerValue = percentChange;
            }
            break;
        }

        if (triggered) {
          triggerValue = triggerValue || currentValue;
          break;
        }
      }

      if (triggered) {
        const existingActive = this.getActiveAlerts(userId).find(
          (a) => a.type === rule.metric as AlertType
        );
        if (!existingActive) {
          const alert = this.createAlert(userId, {
            type: (rule.metric as AlertType) || "custom",
            severity: rule.severity,
            title: `${rule.metricName}异常`,
            description: `您的${rule.metricName}已超过阈值，请关注身体状况。`,
            value: triggerValue,
            threshold: rule.threshold,
            startedAt: new Date().toISOString(),
            durationMinutes: rule.durationMinutes,
          });
          newAlerts.push(alert);
        }
      }
    }

    return newAlerts;
  }

  initializeDefaultRules(userId: string): AlertRule[] {
    const existing = this.getAlertRules(userId);
    if (existing.length > 0) return existing;

    const defaults: Omit<AlertRule, "id" | "userId">[] = [
      {
        metric: "restingHeartRate",
        metricName: "静息心率",
        condition: "spike_percent",
        threshold: 20,
        durationMinutes: 120,
        severity: "critical",
        enabled: true,
      },
      {
        metric: "bloodOxygen",
        metricName: "血氧饱和度",
        condition: "lt",
        threshold: 92,
        durationMinutes: 30,
        severity: "warning",
        enabled: true,
      },
      {
        metric: "stressIndex",
        metricName: "压力指数",
        condition: "gt",
        threshold: 75,
        durationMinutes: 60,
        severity: "warning",
        enabled: true,
      },
      {
        metric: "hrv",
        metricName: "心率变异性",
        condition: "lt",
        threshold: 40,
        durationMinutes: 360,
        severity: "info",
        enabled: true,
      },
    ];

    return defaults.map((r) => this.createAlertRule(userId, r));
  }
}

export const alertService = new AlertService();
