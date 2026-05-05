import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const UserManagement: React.FC = () => {
  const columns = [
    { title: '用户名', dataIndex: 'username', required: true, width: 150 },
    { title: '真实姓名', dataIndex: 'realName', width: 120 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="用户管理"
      apiPath="/users"
      columns={columns}
      showToggle={true}
    />
  )
}

export default UserManagement
