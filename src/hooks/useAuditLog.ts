import { useAppStore } from '@/store/useAppStore'
import type { AuditLogEntry } from '@/types'

export function useAuditLog() {
  const logAction = (
    action: string,
    category: AuditLogEntry['category'],
    target: string,
    result: 'success' | 'failure' = 'success'
  ) => {
    const user = useAppStore.getState().user
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    const r = () => String(Math.floor(Math.random() * 256))
    const entry: AuditLogEntry = {
      id: `AL${Date.now()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      operatorId: user?.id ?? 'anonymous',
      operatorName: user?.name ?? '未知',
      action,
      category,
      target,
      result,
      timestamp,
      ip: `192.168.${r()}.${r()}`,
    }
    useAppStore.getState().addAuditLog(entry)
  }
  return { logAction }
}
