import { create } from 'zustand'

interface AuditEntry {
  id: string
  timestamp: string
  operator: string
  module: string
  action: string
  detail: string
  result: 'success' | 'failure'
  ip: string
}

interface AppState {
  currentUser: { name: string; role: string; org: string } | null
  auditLog: AuditEntry[]
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
  login: (user: { name: string; role: string; org: string }) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  auditLog: [
    {
      id: '1',
      timestamp: '2026-06-09 09:15:23',
      operator: '张伟',
      module: '统一身份认证',
      action: '用户登录',
      detail: '通过身份证号登录系统',
      result: 'success',
      ip: '10.0.1.105',
    },
    {
      id: '2',
      timestamp: '2026-06-09 09:20:45',
      operator: '李明',
      module: '电子印章管理',
      action: '制章申请',
      detail: '申请制作"北京市政务服务专用章"',
      result: 'success',
      ip: '10.0.2.88',
    },
    {
      id: '3',
      timestamp: '2026-06-09 09:32:11',
      operator: '王芳',
      module: '电子证照库',
      action: '证照签发',
      detail: '签发电子营业执照：91110000MA01XXXX',
      result: 'success',
      ip: '10.0.3.42',
    },
    {
      id: '4',
      timestamp: '2026-06-09 09:45:08',
      operator: '赵强',
      module: '数据共享交换',
      action: 'API调用',
      detail: '调用"人口基本信息查询"接口，脱敏等级：L3',
      result: 'success',
      ip: '10.0.4.201',
    },
    {
      id: '5',
      timestamp: '2026-06-09 10:01:33',
      operator: '陈丽',
      module: '事项标准化管理',
      action: '事项版本发布',
      detail: '发布"建筑工程施工许可证核发"V3.2版本',
      result: 'success',
      ip: '10.0.5.67',
    },
    {
      id: '6',
      timestamp: '2026-06-09 10:15:42',
      operator: '周磊',
      module: '统一身份认证',
      action: '登录失败',
      detail: '身份证号登录验证失败，连续3次错误',
      result: 'failure',
      ip: '10.0.6.150',
    },
    {
      id: '7',
      timestamp: '2026-06-09 10:22:19',
      operator: '吴婷',
      module: '电子印章管理',
      action: '印章吊销',
      detail: '吊销"上海市浦东新区审批章"（有效期届满）',
      result: 'success',
      ip: '10.0.7.33',
    },
    {
      id: '8',
      timestamp: '2026-06-09 10:38:55',
      operator: '孙涛',
      module: '门户聚合引擎',
      action: '服务入口接入',
      detail: '新增接入"广东省政务服务网"入口',
      result: 'success',
      ip: '10.0.8.91',
    },
    {
      id: '9',
      timestamp: '2026-06-09 10:50:07',
      operator: '黄蕾',
      module: '数据共享交换',
      action: '敏感字段访问',
      detail: '访问"居民身份证号"字段，合规校验通过',
      result: 'success',
      ip: '10.0.9.14',
    },
    {
      id: '10',
      timestamp: '2026-06-09 11:05:28',
      operator: '刘洋',
      module: '电子证照库',
      action: '跨域证照共享',
      detail: '浙江省请求共享不动产权证信息，授权通过',
      result: 'success',
      ip: '10.0.10.77',
    },
  ],
  addAuditEntry: (entry) =>
    set((state) => ({
      auditLog: [
        {
          ...entry,
          id: String(state.auditLog.length + 1),
          timestamp: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        },
        ...state.auditLog,
      ],
    })),
  login: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),
}))
