import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const RoleManagement: React.FC = () => {
  const columns = [
    { title: '角色名称', dataIndex: 'name', required: true, width: 150 },
    { title: '角色编码', dataIndex: 'code', width: 150 },
    { title: '描述', dataIndex: 'description', width: 250 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="角色管理"
      apiPath="/roles"
      columns={columns}
      showToggle={true}
    />
  )
}

export default RoleManagement
