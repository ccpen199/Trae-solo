import { create } from 'zustand'

interface AppState {
  city: string
  setCity: (city: string) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  currentUser: {
    name: string
    role: 'personal' | 'enterprise' | 'admin'
  }
  addLog: (action: string, module: string) => void
  logs: LogEntry[]
}

interface LogEntry {
  id: string
  action: string
  module: string
  user: string
  time: string
  ip: string
}

export const useAppStore = create<AppState>((set) => ({
  city: '广州',
  setCity: (city) => set({ city }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  currentUser: {
    name: '张伟',
    role: 'personal',
  },
  logs: [
    { id: '1', action: '查询养老参保明细', module: '社保查询', user: '张伟', time: '2026-06-09 09:15:23', ip: '192.168.1.100' },
    { id: '2', action: '生成参保证明PDF', module: '社保查询', user: '张伟', time: '2026-06-09 09:20:45', ip: '192.168.1.100' },
    { id: '3', action: '提交欠薪线索举报', module: '劳动维权', user: '李明', time: '2026-06-09 10:05:12', ip: '192.168.1.105' },
    { id: '4', action: '预约视频面试', module: '就业服务', user: '王芳', time: '2026-06-09 10:30:00', ip: '192.168.1.108' },
    { id: '5', action: '提交职称申报材料', module: '人才服务', user: '陈刚', time: '2026-06-09 11:00:33', ip: '192.168.1.112' },
    { id: '6', action: '签署劳动合同', module: '劳动维权', user: '刘洋', time: '2026-06-09 11:25:18', ip: '192.168.1.115' },
    { id: '7', action: '审核专家评审表', module: '人才服务', user: '管理员', time: '2026-06-09 14:10:05', ip: '192.168.1.200' },
    { id: '8', action: '导出地市数据报表', module: '数据看板', user: '管理员', time: '2026-06-09 14:30:22', ip: '192.168.1.200' },
  ],
  addLog: (action, module) => set((s) => ({
    logs: [
      {
        id: String(Date.now()),
        action,
        module,
        user: s.currentUser.name,
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        ip: '192.168.1.100',
      },
      ...s.logs,
    ],
  })),
}))
