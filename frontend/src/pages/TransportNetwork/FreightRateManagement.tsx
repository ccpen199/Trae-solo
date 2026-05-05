import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const FreightRateManagement: React.FC = () => {
  const columns = [
    { title: '运价名称', dataIndex: 'name', required: true, width: 180 },
    { title: '运输类型', dataIndex: 'transportTypeName', width: 100 },
    { title: '始发地', dataIndex: 'fromCityName', width: 100 },
    { title: '目的地', dataIndex: 'toCityName', width: 100 },
    { title: '基准价格(元)', dataIndex: 'basePrice', width: 120 },
    { title: '重量单价(元/kg)', dataIndex: 'weightPrice', width: 130 },
    { title: '体积单价(元/m³)', dataIndex: 'volumePrice', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="运价管理"
      apiPath="/freight-rates"
      columns={columns}
      showToggle={true}
    />
  )
}

export default FreightRateManagement
