import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const VehicleTypeManagement: React.FC = () => {
  const columns = [
    { title: '车型编码', dataIndex: 'code', required: true, width: 120 },
    { title: '车型名称', dataIndex: 'name', required: true, width: 150 },
    { title: '核定载重(吨)', dataIndex: 'loadWeight', width: 130 },
    { title: '核定体积(m³)', dataIndex: 'volume', width: 130 },
    { title: '车长(米)', dataIndex: 'length', width: 100 },
    { title: '车宽(米)', dataIndex: 'width', width: 100 },
    { title: '车高(米)', dataIndex: 'height', width: 100 },
    { title: '轴数', dataIndex: 'axleCount', width: 80 },
    { title: '描述', dataIndex: 'description', width: 200 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="车型管理"
      apiPath="/vehicle-types"
      columns={columns}
      showToggle={true}
    />
  )
}

export default VehicleTypeManagement
