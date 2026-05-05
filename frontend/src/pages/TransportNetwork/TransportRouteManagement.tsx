import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const TransportRouteManagement: React.FC = () => {
  const columns = [
    { title: '线路编码', dataIndex: 'code', required: true, width: 120 },
    { title: '线路名称', dataIndex: 'name', required: true, width: 180 },
    { title: '承运商', dataIndex: 'carrierId', width: 150 },
    { title: '始发城市', dataIndex: 'fromCityCode', width: 100 },
    { title: '目的城市', dataIndex: 'toCityCode', width: 100 },
    { title: '始发节点', dataIndex: 'fromNodeId', width: 120 },
    { title: '目的节点', dataIndex: 'toNodeId', width: 120 },
    {
      title: '运输类型',
      dataIndex: 'transportType',
      type: 'select' as const,
      width: 100,
      options: [
        { label: '公路整车', value: 1 },
        { label: '公路零担', value: 2 },
        { label: '航空', value: 3 },
        { label: '铁路', value: 4 },
        { label: '快递', value: 5 },
      ],
    },
    { title: '预计天数', dataIndex: 'estimatedDays', width: 80 },
    { title: '运输距离(km)', dataIndex: 'distance', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="运输线路"
      apiPath="/transport-routes"
      columns={columns}
      showToggle={true}
    />
  )
}

export default TransportRouteManagement
