import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const ReconciliationManagement: React.FC = () => {
  const statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: '待对账', color: 'warning' },
    1: { text: '对账中', color: 'processing' },
    2: { text: '已对账', color: 'success' },
    3: { text: '已确认', color: 'success' },
    4: { text: '已开票', color: 'blue' },
  }

  const columns = [
    { title: '对账单号', dataIndex: 'reconciliationNo', required: true, width: 150 },
    { title: '对账日期', dataIndex: 'reconciliationDate', width: 120 },
    { title: '承运商', dataIndex: 'carrierName', width: 150 },
    { title: '运输类型', dataIndex: 'transportTypeName', width: 100 },
    { title: '总单数', dataIndex: 'totalOrders', width: 80 },
    { title: '总重量', dataIndex: 'totalWeight', width: 100 },
    { title: '总金额', dataIndex: 'totalAmount', width: 120 },
    { title: '实际金额', dataIndex: 'actualAmount', width: 120 },
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
      title="对账管理"
      apiPath="/reconciliations"
      columns={columns}
    />
  )
}

export default ReconciliationManagement
