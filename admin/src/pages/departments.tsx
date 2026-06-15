import React from 'react'
import PageScaffold from './PageScaffold'

const Departments: React.FC = () => (
  <PageScaffold
    title="委办局管理"
    subtitle="维护自治区、地市、区县多级部门的服务目录、接口联通和责任边界。"
    metrics={[
      { label: '接入部门', value: 86 },
      { label: '接口在线率', value: 99.2, suffix: '%' },
      { label: '待协同事项', value: 18 },
      { label: '本周巡检', value: 42 }
    ]}
    rows={[
      { key: '1', name: '自治区住建厅', owner: '政务协同组', status: '运行中', updatedAt: '09:26' },
      { key: '2', name: '银川市审批局', owner: '区域运营组', status: '审核中', updatedAt: '09:08' },
      { key: '3', name: '医保局数据接口', owner: '数据交换组', status: '预警', updatedAt: '08:40' }
    ]}
    timeline={['新增部门接入申请 2 条', '跨部门材料复用规则已更新', '低频接口进入重点巡检']}
  />
)

export default Departments
