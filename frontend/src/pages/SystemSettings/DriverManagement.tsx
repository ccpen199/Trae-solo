import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const DriverManagement: React.FC = () => {
  const columns = [
    { title: '司机姓名', dataIndex: 'name', required: true, width: 100 },
    { title: '联系电话', dataIndex: 'phone', width: 120 },
    { title: '身份证号', dataIndex: 'idCardNumber', width: 180 },
    { title: '驾驶证号', dataIndex: 'driverLicenseNumber', width: 150 },
    { title: '驾驶证到期日', dataIndex: 'driverLicenseExpiry', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="司机管理"
      apiPath="/drivers"
      columns={columns}
      showToggle={true}
    />
  )
}

export default DriverManagement
