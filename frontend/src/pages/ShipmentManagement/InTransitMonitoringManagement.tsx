import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const InTransitMonitoringManagement: React.FC = () => {
  const statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: '正常', color: 'success' },
    1: { text: '异常', color: 'warning' },
    2: { text: '停车', color: 'default' },
    3: { text: '离线', color: 'error' },
  }

  const sourceTypeMap: { [key: number]: { text: string; color: string } } = {
    1: { text: 'GPS', color: 'blue' },
    2: { text: '手动上报', color: 'green' },
    3: { text: '系统自动', color: 'default' },
  }

  const columns = [
    { title: '运输委托', dataIndex: 'orderId', required: true, width: 150 },
    { title: '监控时间', dataIndex: 'monitorTime', required: true, width: 160 },
    { title: '经度', dataIndex: 'longitude', width: 100 },
    { title: '纬度', dataIndex: 'latitude', width: 100 },
    { title: '地址', dataIndex: 'address', width: 200 },
    { title: '速度(km/h)', dataIndex: 'speed', width: 100 },
    { title: '里程(km)', dataIndex: 'mileage', width: 100 },
    { title: '温度(°C)', dataIndex: 'temperature', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'status' as const,
      width: 100,
      statusMap,
    },
    {
      title: '数据来源',
      dataIndex: 'sourceType',
      type: 'status' as const,
      width: 100,
      statusMap: sourceTypeMap,
    },
    { title: '备注', dataIndex: 'remark', width: 150 },
  ]

  return (
    <CrudList
      title="在途监控"
      apiPath="/in-transit-monitorings"
      columns={columns}
      showToggle={false}
    />
  )
}

export default InTransitMonitoringManagement
