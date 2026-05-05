import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const OrderSignManagement: React.FC = () => {
  const statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: '待签收', color: 'warning' },
    1: { text: '部分签收', color: 'processing' },
    2: { text: '已签收', color: 'success' },
    3: { text: '拒收', color: 'error' },
  }

  const columns = [
    { title: '签收编号', dataIndex: 'signNo', required: true, width: 150 },
    { title: '运输委托', dataIndex: 'orderNo', width: 150 },
    { title: '签收人', dataIndex: 'signPerson', width: 100 },
    { title: '签收时间', dataIndex: 'signTime', width: 160 },
    { title: '签收数量', dataIndex: 'signQuantity', width: 100 },
    { title: '实际重量', dataIndex: 'actualWeight', width: 100 },
    { title: '异常数量', dataIndex: 'abnormalQuantity', width: 100 },
    { title: '签收备注', dataIndex: 'remark', width: 200 },
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
      title="签收管理"
      apiPath="/order-signs"
      columns={columns}
    />
  )
}

export default OrderSignManagement
