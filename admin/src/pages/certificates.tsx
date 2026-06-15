import React from 'react'
import PageScaffold from './PageScaffold'

const Certificates: React.FC = () => (
  <PageScaffold
    title="电子证照库"
    subtitle="集中管理证照目录、授权调用、核验日志和跨部门共享状态。"
    metrics={[
      { label: '证照目录', value: 214 },
      { label: '有效证照', value: 186420 },
      { label: '今日核验', value: 5218 },
      { label: '共享成功率', value: 98.7, suffix: '%' }
    ]}
    rows={[
      { key: '1', name: '营业执照', owner: '市场监管厅', status: '运行中', updatedAt: '09:28' },
      { key: '2', name: '不动产权证', owner: '自然资源厅', status: '运行中', updatedAt: '09:01' },
      { key: '3', name: '社会保障卡', owner: '人社厅', status: '已完成', updatedAt: '08:48' }
    ]}
    timeline={['证照授权策略完成校验', '调用峰值低于告警阈值', '跨省核验通道正常']}
  />
)

export default Certificates
