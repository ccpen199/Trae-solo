import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const FreightCalculationManagement: React.FC = () => {
  const statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: '待核算', color: 'warning' },
    1: { text: '核算中', color: 'processing' },
    2: { text: '已核算', color: 'success' },
    3: { text: '已确认', color: 'success' },
  }

  const columns = [
    { title: '核算单号', dataIndex: 'calculationNo', required: true, width: 150 },
    { title: '运输委托', dataIndex: 'orderNo', width: 150 },
    { title: '运输类型', dataIndex: 'transportTypeName', width: 100 },
    { title: '运价名称', dataIndex: 'freightRateName', width: 150 },
    { title: '运输里程', dataIndex: 'distance', width: 100 },
    { title: '计费重量', dataIndex: 'chargeableWeight', width: 100 },
    { title: '计费体积', dataIndex: 'chargeableVolume', width: 100 },
    { title: '基础运费', dataIndex: 'baseFreight', width: 120 },
    { title: '其他费用', dataIndex: 'otherCharges', width: 100 },
    { title: '总运费', dataIndex: 'totalFreight', width: 120 },
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
      title="运费核算管理"
      apiPath="/freight-calculations"
      columns={columns}
    />
  )
}

export default FreightCalculationManagement
