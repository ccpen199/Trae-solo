import { ProTable } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { App, Popconfirm, Tag, Button, Space } from 'antd';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  id: `B${String(i + 1).padStart(3, '0')}`,
  communityName: '阳光花园小区',
  name: `${(i % 12) + 1}号楼`,
  floorCount: 18,
  unitCount: 2,
  houseCount: 36,
  deviceCount: Math.floor(Math.random() * 3) + 1,
  createdAt: '2025-01-01',
}));

export default function BuildingList() {
  const { message } = App.useApp();

  const columns: any[] = [
    { title: '编号', dataIndex: 'id', width: 100 },
    { title: '所属小区', dataIndex: 'communityName', width: 140 },
    { title: '楼栋名称', dataIndex: 'name', width: 120 },
    { title: '楼层数', dataIndex: 'floorCount', width: 80, render: (v: number) => `${v}层` },
    { title: '单元数', dataIndex: 'unitCount', width: 80, render: (v: number) => `${v}个` },
    { title: '房屋数', dataIndex: 'houseCount', width: 80, render: (v: number) => `${v}套` },
    { title: '门禁设备', dataIndex: 'deviceCount', width: 90, render: (v: number) => `${v}台` },
    { title: '创建时间', dataIndex: 'createdAt', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Popconfirm title="确认删除" onConfirm={() => message.success('删除成功')}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProTable
      headerTitle="楼栋房产"
      columns={columns}
      dataSource={mockData}
      rowKey="id"
      search={{ labelWidth: 100 }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      toolBarRender={() => [
        <Button type="primary" icon={<PlusOutlined />}>新增楼栋</Button>,
      ]}
      scroll={{ x: 1100 }}
    />
  );
}
