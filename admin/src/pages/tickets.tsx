import React from 'react'
import PageScaffold from './PageScaffold'

const Tickets: React.FC = () => (
  <PageScaffold
    title="12345 工单系统"
    subtitle="跟踪诉求受理、智能分派、部门回复、满意度评价和超期预警。"
    metrics={[
      { label: '今日诉求', value: 932 },
      { label: '智能分派', value: 884 },
      { label: '处理中', value: 76 },
      { label: '满意率', value: 97.1, suffix: '%' }
    ]}
    rows={[
      { key: '1', name: '供暖维修诉求', owner: '住建厅', status: '待处理', updatedAt: '09:24' },
      { key: '2', name: '医保报销咨询', owner: '医保局', status: '运行中', updatedAt: '09:12' },
      { key: '3', name: '道路交通建议', owner: '交通厅', status: '已完成', updatedAt: '08:52' }
    ]}
    timeline={['热点诉求词云完成刷新', '超期工单已推送提醒', '满意度回访样本已生成']}
  />
)

export default Tickets
