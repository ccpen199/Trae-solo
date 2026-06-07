import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import AdminLayout from './AdminLayout'

interface ActionCount {
  action: string
  count: number
}

interface DailyActive {
  date: string
  count: number
}

interface TopUser {
  id: number
  username: string
  activity_count: number
}

interface BehaviorData {
  action_counts: ActionCount[]
  daily_active_users: DailyActive[]
  top_active_users: TopUser[]
}

interface ActivityLog {
  id: number
  user_id: number
  username: string
  action: string
  detail: string
  ip: string
  created_at: string
}

interface LogList {
  list: ActivityLog[]
  total: number
  page: number
  pageSize: number
}

const ACTION_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
]

export default function Activity() {
  const [behavior, setBehavior] = useState<BehaviorData | null>(null)
  const [logs, setLogs] = useState<LogList>({ list: [], total: 0, page: 1, pageSize: 10 })
  const [page, setPage] = useState(1)

  const fetchBehavior = async () => {
    try {
      const data = await api.get<BehaviorData>('/admin/user-behavior')
      setBehavior(data)
    } catch {}
  }

  const fetchLogs = async (p = 1) => {
    try {
      const data = await api.get<LogList>(`/admin/activity-logs?page=${p}&pageSize=10`)
      setLogs(data)
      setPage(p)
    } catch {}
  }

  useEffect(() => { fetchBehavior(); fetchLogs() }, [])

  const maxActionCount = Math.max(...(behavior?.action_counts.map(a => a.count) ?? [1]), 1)
  const maxDailyCount = Math.max(...(behavior?.daily_active_users.map(d => d.count) ?? [1]), 1)
  const totalPages = Math.ceil(logs.total / logs.pageSize)

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">活动看板</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">操作类型分布</h2>
        <div className="space-y-3">
          {(behavior?.action_counts ?? []).map((ac, i) => (
            <div key={ac.action} className="flex items-center gap-3">
              <span className="w-20 text-sm text-gray-600 shrink-0 truncate">{ac.action}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full flex items-center px-2 ${ACTION_COLORS[i % ACTION_COLORS.length]}`}
                  style={{ width: `${(ac.count / maxActionCount) * 100}%`, minWidth: '2rem' }}
                >
                  <span className="text-white text-xs font-medium">{ac.count}</span>
                </div>
              </div>
            </div>
          ))}
          {(!behavior?.action_counts.length) && <p className="text-gray-400 text-sm">暂无数据</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">近7日活跃用户</h2>
        <div className="flex items-end gap-2 h-40">
          {(behavior?.daily_active_users ?? []).map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{d.count}</span>
              <div
                className="w-full bg-red-400 rounded-t"
                style={{ height: `${(d.count / maxDailyCount) * 120}px`, minHeight: '4px' }}
              />
              <span className="text-xs text-gray-400">{d.date.slice(5)}</span>
            </div>
          ))}
          {(!behavior?.daily_active_users.length) && <p className="text-gray-400 text-sm">暂无数据</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">活跃用户排行</h2>
          <div className="space-y-2">
            {(behavior?.top_active_users ?? []).map((u, i) => (
              <div key={u.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 3 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>{i + 1}</span>
                  <span className="text-sm text-gray-700">{u.username}</span>
                </div>
                <span className="text-sm text-gray-500">{u.activity_count} 次</span>
              </div>
            ))}
            {(!behavior?.top_active_users.length) && <p className="text-gray-400 text-sm">暂无数据</p>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-gray-700">活动日志</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">用户</th>
                <th className="text-left px-4 py-2">操作</th>
                <th className="text-left px-4 py-2">详情</th>
                <th className="text-left px-4 py-2">IP</th>
                <th className="text-left px-4 py-2">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.list.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{log.username || '-'}</td>
                  <td className="px-4 py-2 text-gray-600">{log.action}</td>
                  <td className="px-4 py-2 text-gray-600 max-w-xs truncate">{log.detail || '-'}</td>
                  <td className="px-4 py-2 text-gray-600 font-mono text-xs">{log.ip || '-'}</td>
                  <td className="px-4 py-2 text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.list.length === 0 && <p className="text-center text-gray-400 py-6">暂无数据</p>}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-3 border-t">
              <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1} className="px-3 py-1 border rounded text-xs disabled:opacity-40">上一页</button>
              <span className="text-xs text-gray-600">{page} / {totalPages}</span>
              <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages} className="px-3 py-1 border rounded text-xs disabled:opacity-40">下一页</button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
