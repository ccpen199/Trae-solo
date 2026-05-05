import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const CityManagement: React.FC = () => {
  const columns = [
    { title: '城市名称', dataIndex: 'name', required: true, width: 150 },
    { title: '城市编码', dataIndex: 'code', width: 120 },
    { title: '省份', dataIndex: 'province', width: 120 },
    { title: '经度', dataIndex: 'longitude', width: 120 },
    { title: '纬度', dataIndex: 'latitude', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="城市管理"
      apiPath="/cities"
      columns={columns}
      showToggle={true}
    />
  )
}

export default CityManagement
