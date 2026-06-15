import React from 'react'
import PageScaffold from '../PageScaffold'

const Users: React.FC = () => (
  <PageScaffold
    title="用户管理"
    subtitle="维护平台管理员、部门经办人、审计员和运营人员账号。"
    metrics={[
      { label: '平台账号', value: 328 },
      { label: '在线用户', value: 42 },
      { label: '待启用', value: 7 },
      { label: '多因素绑定', value: 91.4, suffix: '%' }
    ]}
    rows={[
      { key: '1', name: '自治区管理员', owner: '政务数据局', status: '运行中', updatedAt: '09:19' },
      { key: '2', name: '部门经办人批量导入', owner: '平台运维组', status: '审核中', updatedAt: '09:02' },
      { key: '3', name: '离岗账号冻结', owner: '安全审计组', status: '已完成', updatedAt: '08:31' }
    ]}
    timeline={['权限基线完成同步', '弱密码账号已提示整改', '角色变更进入审计队列']}
  />
)

export default Users
