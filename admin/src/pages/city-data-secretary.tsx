import React from 'react'
import PageScaffold from './PageScaffold'

const CityDataSecretary: React.FC = () => (
  <PageScaffold
    title="城市数据秘书"
    subtitle="基于用户画像、行为日志和数据资产生成办事推荐与证照提醒。"
    metrics={[
      { label: '推荐触达', value: 18420 },
      { label: '画像标签', value: 326 },
      { label: '未读提醒', value: 2140 },
      { label: '点击转化', value: 31.5, suffix: '%' }
    ]}
    rows={[
      { key: '1', name: '惠企政策推荐', owner: '数据运营组', status: '运行中', updatedAt: '09:20' },
      { key: '2', name: '证照到期提醒', owner: '证照运营组', status: '已发布', updatedAt: '09:05' },
      { key: '3', name: '用户标签补全', owner: '算法运营组', status: '审核中', updatedAt: '08:39' }
    ]}
    timeline={['推荐模型完成离线评估', '用户标签批处理成功', '证照提醒队列正常投递']}
  />
)

export default CityDataSecretary
