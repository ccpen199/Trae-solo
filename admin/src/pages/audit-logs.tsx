import React from 'react'
import PageScaffold from './PageScaffold'

const AuditLogs: React.FC = () => (
  <PageScaffold
    title="审计日志"
    subtitle="记录账号登录、接口调用、证照授权、事项变更和系统管理操作。"
    metrics={[
      { label: '今日日志', value: 8420 },
      { label: '风险事件', value: 3 },
      { label: '接口调用', value: 56810 },
      { label: '留存天数', value: 90 }
    ]}
    rows={[
      { key: '1', name: '证照目录变更', owner: '平台管理员', status: '已完成', updatedAt: '09:22' },
      { key: '2', name: '高频接口访问', owner: '安全审计组', status: '运行中', updatedAt: '09:10' },
      { key: '3', name: '异常登录核查', owner: '安全审计组', status: '预警', updatedAt: '08:44' }
    ]}
    timeline={['审计归档任务正常', '敏感操作已完成二次确认', '风险事件进入人工复核']}
  />
)

export default AuditLogs
