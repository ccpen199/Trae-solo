import React from 'react'
import CrudList from '../../components/CrudList/CrudList'
import { Tag } from 'antd'

const TransportPlanManagement: React.FC = () => {
  const statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: '待确认', color: 'warning' },
    1: { text: '已确认', color: 'processing' },
    2: { text: '已发运', color: 'success' },
    9: { text: '已取消', color: 'default' },
  }

  const columns = [
    { title: '计划编号', dataIndex: 'planNo', required: true, width: 150 },
    { title: '计划名称', dataIndex: 'name', width: 150 },
    { title: '始发地', dataIndex: 'fromCityName', width: 100 },
    { title: '目的地', dataIndex: 'toCityName', width: 100 },
    { title: '计划日期', dataIndex: 'planDate', width: 120 },
    { title: '预估重量(kg)', dataIndex: 'estimatedWeight', width: 120 },
    { title: '预估体积(m³)', dataIndex: 'estimatedVolume', width: 120 },
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
      title="运输计划管理"
      apiPath="/transport-plans"
      columns={columns}
    />
  )
}

export default TransportPlanManagement
