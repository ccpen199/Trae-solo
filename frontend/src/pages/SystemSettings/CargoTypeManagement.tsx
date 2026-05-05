import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const CargoTypeManagement: React.FC = () => {
  const columns = [
    { title: '货物编码', dataIndex: 'code', required: true, width: 120 },
    { title: '货物名称', dataIndex: 'name', required: true, width: 150 },
    { title: '分类', dataIndex: 'category', width: 100 },
    { title: '计量单位', dataIndex: 'unit', width: 100 },
    { title: '描述', dataIndex: 'description', width: 200 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="货物类型"
      apiPath="/cargo-types"
      columns={columns}
      showToggle={true}
    />
  )
}

export default CargoTypeManagement
