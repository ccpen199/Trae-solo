import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const CarrierManagement: React.FC = () => {
  const columns = [
    { title: '承运商名称', dataIndex: 'name', required: true, width: 180 },
    { title: '承运商编码', dataIndex: 'code', width: 120 },
    { title: '联系人', dataIndex: 'contactPerson', width: 100 },
    { title: '联系电话', dataIndex: 'contactPhone', width: 120 },
    { title: '地址', dataIndex: 'address', width: 200 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="承运商管理"
      apiPath="/carriers"
      columns={columns}
      showToggle={true}
    />
  )
}

export default CarrierManagement
