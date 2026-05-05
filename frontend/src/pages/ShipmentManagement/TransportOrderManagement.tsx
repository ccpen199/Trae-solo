import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const TransportOrderManagement: React.FC = () => {
  const statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: '待发运', color: 'warning' },
    1: { text: '已发运', color: 'processing' },
    2: { text: '在途', color: 'processing' },
    3: { text: '已到达', color: 'success' },
    4: { text: '已签收', color: 'success' },
    9: { text: '已取消', color: 'default' },
  }

  const columns = [
    { title: '委托编号', dataIndex: 'orderNo', required: true, width: 150 },
    { title: '运输计划', dataIndex: 'planName', width: 150 },
    { title: '承运商', dataIndex: 'carrierName', width: 120 },
    { title: '车辆', dataIndex: 'vehiclePlateNumber', width: 100 },
    { title: '司机', dataIndex: 'driverName', width: 100 },
    { title: '始发地', dataIndex: 'fromNodeName', width: 100 },
    { title: '目的地', dataIndex: 'toNodeName', width: 100 },
    { title: '发运日期', dataIndex: 'shipDate', width: 120 },
    { title: '预计到达', dataIndex: 'estimatedArrivalDate', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'status' as const,
      width: 100,
      statusMap,
    },
  ]

  return (
    <CrudList
      title="运输委托管理"
      apiPath="/transport-orders"
      columns={columns}
    />
  )
}

export default TransportOrderManagement
