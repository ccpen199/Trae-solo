import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const VehicleManagement: React.FC = () => {
  const columns = [
    { title: '车牌号码', dataIndex: 'plateNumber', required: true, width: 120 },
    { title: '车辆类型', dataIndex: 'vehicleTypeName', width: 120 },
    { title: '核定载重(吨)', dataIndex: 'loadCapacity', width: 120 },
    { title: '核定体积(m³)', dataIndex: 'volumeCapacity', width: 120 },
    { title: '车辆状态', dataIndex: 'vehicleStatus', width: 100 },
    { title: '所属部门', dataIndex: 'departmentName', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="车辆管理"
      apiPath="/vehicles"
      columns={columns}
      showToggle={true}
    />
  )
}

export default VehicleManagement
