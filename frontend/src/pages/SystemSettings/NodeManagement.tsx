import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const NodeManagement: React.FC = () => {
  const columns = [
    { title: '节点名称', dataIndex: 'name', required: true, width: 150 },
    { title: '节点编码', dataIndex: 'code', width: 120 },
    { title: '城市', dataIndex: 'cityName', width: 120 },
    { title: '详细地址', dataIndex: 'address', width: 250 },
    { title: '联系人', dataIndex: 'contactPerson', width: 100 },
    { title: '联系电话', dataIndex: 'contactPhone', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="节点管理"
      apiPath="/nodes"
      columns={columns}
      showToggle={true}
    />
  )
}

export default NodeManagement
