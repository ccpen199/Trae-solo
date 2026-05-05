import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const ArrivalForecastManagement: React.FC = () => {
  const statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: '预报中', color: 'warning' },
    1: { text: '已到达', color: 'success' },
    2: { text: '已签收', color: 'success' },
  }

  const columns = [
    { title: '预报编号', dataIndex: 'forecastNo', required: true, width: 150 },
    { title: '运输委托', dataIndex: 'orderNo', width: 150 },
    { title: '承运人', dataIndex: 'carrierName', width: 120 },
    { title: '司机', dataIndex: 'driverName', width: 100 },
    { title: '车辆', dataIndex: 'vehiclePlateNumber', width: 100 },
    { title: '预报到达', dataIndex: 'forecastArrivalDate', width: 120 },
    { title: '实际到达', dataIndex: 'actualArrivalDate', width: 120 },
    { title: '收货单位', dataIndex: 'receiverName', width: 120 },
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
      title="到货预报管理"
      apiPath="/arrival-forecasts"
      columns={columns}
    />
  )
}

export default ArrivalForecastManagement
