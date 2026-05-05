import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const MenuManagement: React.FC = () => {
  const columns = [
    { title: '菜单名称', dataIndex: 'name', required: true, width: 150 },
    { title: '菜单路径', dataIndex: 'path', width: 150 },
    { title: '图标', dataIndex: 'icon', width: 100 },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '类型',
      dataIndex: 'type',
      type: 'select' as const,
      width: 100,
      options: [
        { label: '目录', value: 1 },
        { label: '菜单', value: 2 },
        { label: '按钮', value: 3 },
      ],
    },
    { title: '权限标识', dataIndex: 'permission', width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'switch' as const,
      width: 100,
    },
  ]

  return (
    <CrudList
      title="菜单管理"
      apiPath="/menus"
      columns={columns}
      showToggle={true}
    />
  )
}

export default MenuManagement
