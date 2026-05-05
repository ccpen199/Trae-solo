import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const DepartmentManagement: React.FC = () => {
  const columns = [
    { title: '部门名称', dataIndex: 'name', required: true, width: 150 },
    { title: '部门编码', dataIndex: 'code', width: 120 },
    { title: '负责人', dataIndex: 'manager', width: 100 },
    { title: '联系电话', dataIndex: 'phone', width: 130 },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="部门管理"
      apiPath="/departments"
      columns={columns}
      showToggle={true}
    />
  )
}

export default DepartmentManagement
