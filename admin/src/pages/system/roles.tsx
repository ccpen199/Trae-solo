import React from 'react'
import PageScaffold from '../PageScaffold'

const Roles: React.FC = () => (
  <PageScaffold
    title="角色权限"
    subtitle="配置菜单权限、接口权限、数据范围和跨部门协同授权。"
    metrics={[
      { label: '角色模板', value: 24 },
      { label: '权限点', value: 186 },
      { label: '待审批授权', value: 5 },
      { label: '最小授权覆盖', value: 94.6, suffix: '%' }
    ]}
    rows={[
      { key: '1', name: '平台超级管理员', owner: '政务数据局', status: '运行中', updatedAt: '09:15' },
      { key: '2', name: '部门业务管理员', owner: '各委办局', status: '已发布', updatedAt: '08:58' },
      { key: '3', name: '审计只读角色', owner: '安全审计组', status: '已完成', updatedAt: '08:22' }
    ]}
    timeline={['权限矩阵已完成校验', '新增角色等待审批', '高危权限变更已记录']}
  />
)

export default Roles
