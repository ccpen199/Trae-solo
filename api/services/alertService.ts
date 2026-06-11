import { Alert, User } from '../../shared/types'
import { userDB, familyBindingDB, alertDB } from '../db/index'

const INACTIVITY_THRESHOLD_DAYS = 3

export interface InactivityCheckResult {
  inactiveUsers: User[]
  alertsCreated: number
  errors: string[]
}

export function checkInactivity(): InactivityCheckResult {
  const result: InactivityCheckResult = {
    inactiveUsers: [],
    alertsCreated: 0,
    errors: []
  }

  try {
    const inactiveUsers = userDB.findInactiveUsers(INACTIVITY_THRESHOLD_DAYS)
    result.inactiveUsers = inactiveUsers

    for (const elder of inactiveUsers) {
      try {
        const bindings = familyBindingDB.findByElderId(elder.id)
        const activeBindings = bindings.filter(b => b.status === 'active' && b.notificationEnabled)

        for (const binding of activeBindings) {
          const existingAlert = alertDB.findAll({
            elderId: elder.id,
            familyId: binding.familyId,
            type: 'inactivity',
            read: false
          })

          if (existingAlert.length === 0) {
            const daysInactive = Math.floor(
              (Date.now() - new Date(elder.lastActiveAt).getTime()) / (24 * 60 * 60 * 1000)
            )

            alertDB.create({
              type: 'inactivity',
              elderId: elder.id,
              familyId: binding.familyId,
              message: `${elder.name}已连续${daysInactive}天未使用应用，请关注其健康状况`,
              level: daysInactive >= 7 ? 'danger' : daysInactive >= 5 ? 'warning' : 'info'
            })
            result.alertsCreated++
          }
        }
      } catch (error) {
        result.errors.push(`处理用户 ${elder.id} (${elder.name}) 时出错: ${error}`)
      }
    }
  } catch (error) {
    result.errors.push(`检测不活跃用户时出错: ${error}`)
  }

  return result
}

export function getAlerts(
  familyId: string,
  options?: {
    read?: boolean
    type?: Alert['type']
    level?: Alert['level']
    limit?: number
  }
): Alert[] {
  return alertDB.findAll({
    familyId,
    ...options
  })
}

export function getUnreadCount(familyId: string): number {
  return alertDB.countUnread(familyId)
}

export function markAlertAsRead(alertId: string): Alert | null {
  return alertDB.markAsRead(alertId)
}

export function markAllAlertsAsRead(familyId: string): number {
  return alertDB.markAllAsRead(familyId)
}

export function deleteAlert(alertId: string): boolean {
  return alertDB.delete(alertId)
}

export function createAlert(
  type: Alert['type'],
  elderId: string,
  familyId: string,
  message: string,
  level: Alert['level'] = 'info'
): Alert {
  return alertDB.create({
    type,
    elderId,
    familyId,
    message,
    level
  })
}

export function createHealthAlert(
  elderId: string,
  message: string,
  level: Alert['level'] = 'warning'
): Alert[] {
  const bindings = familyBindingDB.findByElderId(elderId)
  const activeBindings = bindings.filter(b => b.status === 'active' && b.notificationEnabled)

  const createdAlerts: Alert[] = []
  for (const binding of activeBindings) {
    const alert = alertDB.create({
      type: 'health',
      elderId,
      familyId: binding.familyId,
      message,
      level
    })
    createdAlerts.push(alert)
  }

  return createdAlerts
}

export default {
  checkInactivity,
  getAlerts,
  getUnreadCount,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
  createAlert,
  createHealthAlert
}
