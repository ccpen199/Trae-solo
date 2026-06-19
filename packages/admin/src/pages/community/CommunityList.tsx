import { ProTable } from '@ant-design/pro-components';
import { Tag, Space, Button, Descriptions, Drawer, App } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useState } from 'react';

const mockData = [
  { id: 'C001', name: '阳光花园小区', address: '浙江省杭州市西湖区文一西路1008号', buildingCount: 12, unitCount: 24, houseCount: 864, userCount: 1258, deviceCount: 12, createdAt: '2025-01-01', description: '大型现代化住宅小区' },
  { id: 'C002', name: '翠苑五区', address: '浙江省杭州市西湖区文二路388号', buildingCount: 8, unitCount: 16, houseCount: 512, userCount: 720, deviceCount: 8, createdAt: '2025-03-15', description: '成熟社区，配套完善' },
  { id: 'C003', name: '万家花城', address: '浙江省杭州市拱墅区丰潭路168号', buildingCount: 15, unitCount: 30, houseCount: 1080, userCount: 1580, deviceCount: 15, createdAt: '2025-06-01', description: '高端品质住宅' },
];

export default function CommunityList() {
  const [viewItem, setViewItem] = useState<any>(null);

  const columns = [
    { title: '编号', dataIndex: 'id', width: 90 },
    { title: '小区名称', dataIndex: 'name', width: 140 },
    { title: '地址', dataIndex: 'address', width: 260, ellipsis: true },
    { title: '楼栋数', dataIndex: 'buildingCount', width: 80 },
    { title: '单元数', dataIndex: 'unitCount', width: 80 },
    { title: '房屋数', dataIndex: 'houseCount', width: 80 },
    { title: '居民数', dataIndex: 'userCount', width: 80 },
    { title: '门禁设备', dataIndex: 'deviceCount', width: 90 },
    { title: '创建时间', dataIndex: 'createdAt', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewItem(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="小区列表"
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        search={false}
        pagination={false}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />}>新增小区</Button>,
        ]}
        scroll={{ x: 1200 }}
      />

      <Drawer
        title="小区详情"
        width={640}
        open={!!viewItem}
        onClose={() => setViewItem(null)}
      >
        {viewItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="编号">{viewItem.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{viewItem.name}</Descriptions.Item>
            <Descriptions.Item label="地址">{viewItem.address}</Descriptions.Item>
            <Descriptions.Item label="楼栋数">{viewItem.buildingCount}栋</Descriptions.Item>
            <Descriptions.Item label="单元数">{viewItem.unitCount}个</Descriptions.Item>
            <Descriptions.Item label="房屋数">{viewItem.houseCount}套</Descriptions.Item>
            <Descriptions.Item label="居民数">{viewItem.userCount}人</Descriptions.Item>
            <Descriptions.Item label="门禁设备">{viewItem.deviceCount}台</Descriptions.Item>
            <Descriptions.Item label="描述">{viewItem.description}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );
}
