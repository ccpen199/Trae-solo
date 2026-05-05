import React, { useState } from 'react'
import { Card, Tabs } from 'antd'
import CrudList from '../../components/CrudList/CrudList'

const GpsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('vehicles')

  const vehicleColumns = [
    { title: '设备编号', dataIndex: 'deviceId', required: true, width: 150 },
    { title: '车牌号码', dataIndex: 'plateNumber', required: true, width: 120 },
    { title: 'SIM卡号', dataIndex: 'simCard', width: 130 },
    { title: '所属部门', dataIndex: 'departmentCode', width: 120 },
    { title: '安装日期', dataIndex: 'installDate', width: 120 },
    { title: '最后在线', dataIndex: 'lastOnlineTime', width: 160 },
    { title: '最后经度', dataIndex: 'lastLongitude', width: 100 },
    { title: '最后纬度', dataIndex: 'lastLatitude', width: 100 },
    { title: '最后速度', dataIndex: 'lastSpeed', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  const departmentColumns = [
    { title: '部门编码', dataIndex: 'code', required: true, width: 120 },
    { title: '部门名称', dataIndex: 'name', required: true, width: 150 },
    { title: '上级编码', dataIndex: 'parentCode', width: 120 },
    { title: '负责人', dataIndex: 'manager', width: 100 },
    { title: '联系电话', dataIndex: 'phone', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  const tabItems = [
    {
      key: 'vehicles',
      label: 'GPS车辆',
      children: (
        <CrudList
          title="GPS车辆管理"
          apiPath="/gps-vehicles"
          columns={vehicleColumns}
          showToggle={true}
        />
      ),
    },
    {
      key: 'departments',
      label: 'GPS部门',
      children: (
        <CrudList
          title="GPS部门管理"
          apiPath="/gps-departments"
          columns={departmentColumns}
          showToggle={true}
        />
      ),
    },
  ]

  return (
    <Card title="GPS管理" bodyStyle={{ padding: '16px 0' }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Card>
  )
}

export default GpsManagement
