import React from 'react'
import PageScaffold from './PageScaffold'

const Dashboard: React.FC = () => (
  <PageScaffold
    title="一网通办工作台"
    subtitle="汇总事项办理、证照调用、12345 工单和城市数据秘书的实时运行情况。"
    metrics={[
      { label: '今日办件', value: 1286 },
      { label: '在线事项', value: 426 },
      { label: '证照调用', value: 35620 },
      { label: '工单办结率', value: 96.8, suffix: '%' }
    ]}
    rows={[
      { key: '1', name: '企业开办一件事', owner: '市场监管厅', status: '运行中', updatedAt: '09:30' },
      { key: '2', name: '电子营业执照核验', owner: '政务数据局', status: '已完成', updatedAt: '09:18' },
      { key: '3', name: '民生诉求智能分派', owner: '12345 中心', status: '待处理', updatedAt: '08:56' }
    ]}
    timeline={['统一身份认证正常', '证照共享接口完成巡检', '12345 热点诉求已同步']}
  />
)

export default Dashboard
