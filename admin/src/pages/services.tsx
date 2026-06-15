import React from 'react'
import PageScaffold from './PageScaffold'

const Services: React.FC = () => (
  <PageScaffold
    title="服务事项中枢"
    subtitle="管理政务事项、情形引导、办事材料和线上线下办理渠道。"
    metrics={[
      { label: '事项总数', value: 1248 },
      { label: '可网办事项', value: 1120 },
      { label: '材料免提交', value: 318 },
      { label: '平均办理时长', value: 1.8, suffix: '天' }
    ]}
    rows={[
      { key: '1', name: '个体工商户设立登记', owner: '市场监管厅', status: '已发布', updatedAt: '09:16' },
      { key: '2', name: '不动产登记资料查询', owner: '自然资源厅', status: '运行中', updatedAt: '09:03' },
      { key: '3', name: '社保关系转移接续', owner: '人社厅', status: '审核中', updatedAt: '08:35' }
    ]}
    timeline={['高频事项清单已同步', '情形引导树完成灰度发布', '材料共享命中率持续上升']}
  />
)

export default Services
