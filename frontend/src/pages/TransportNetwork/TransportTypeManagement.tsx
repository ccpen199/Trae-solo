import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const TransportTypeManagement: React.FC = () => {
  const columns = [
    { title: '类型编码', dataIndex: 'code', required: true, width: 120 },
    { title: '类型名称', dataIndex: 'name', required: true, width: 150 },
    {
      title: '运输方式',
      dataIndex: 'type',
      type: 'select' as const,
      width: 120,
      options: [
        { label: '公路整车', value: 1 },
        { label: '公路零担', value: 2 },
        { label: '航空', value: 3 },
        { label: '铁路', value: 4 },
        { label: '快递', value: 5 },
      ],
    },
    { title: '计费模式', dataIndex: 'billingMode', width: 120 },
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
      title="运输类型"
      apiPath="/transport-types"
      columns={columns}
      showToggle={true}
    />
  )
}

export default TransportTypeManagement
