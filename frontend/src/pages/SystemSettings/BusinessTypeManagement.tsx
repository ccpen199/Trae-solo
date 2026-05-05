import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const BusinessTypeManagement: React.FC = () => {
  const columns = [
    { title: '业务编码', dataIndex: 'code', required: true, width: 120 },
    { title: '业务名称', dataIndex: 'name', required: true, width: 150 },
    { title: '描述', dataIndex: 'description', width: 200 },
    { title: '模板', dataIndex: 'template', width: 200 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="业务类型"
      apiPath="/business-types"
      columns={columns}
      showToggle={true}
    />
  )
}

export default BusinessTypeManagement
