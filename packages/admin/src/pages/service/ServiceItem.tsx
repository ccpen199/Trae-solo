import { ProTable } from '@ant-design/pro-components';
import { Tag, Space, Button, App, Popconfirm } from 'antd';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING_REVIEW: { text: '待审核', color: 'warning' },
  APPROVED: { text: '已上架', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' },
  SUSPENDED: { text: '已暂停', color: 'default' },
  OFFLINE: { text: '已下架', color: 'default' },
};

const mockData = Array.from({ length: 20 }, (_, i) => ({
  id: `SI-${String(i + 1).padStart(4, '0')}`,
  name: ['日常保洁', '深度保洁', '钟点工', '空调清洗', '快递代收', '水果套餐', '蔬菜套餐', '小型搬家'][i % 8],
  providerName: ['好阿姨家政', '顺风快递代收', '邻里团购', '快修家电'][i % 4],
  categoryName: ['家政服务', '快递收发', '社区团购', '家电维修', '搬家服务'][i % 5],
  price: (Math.random() * 300 + 10).toFixed(2),
  unit: ['次', '次', '小时', '台', '件', '份'][i % 6],
  sales: Math.floor(Math.random() * 1000) + 10,
  rating: (4 + Math.random()).toFixed(1),
  status: ['APPROVED', 'APPROVED', 'APPROVED', 'PENDING_REVIEW', 'OFFLINE'][i % 5],
  createdAt: `2026-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
}));

export default function ServiceItem() {
  const { message } = App.useApp();

  const columns: any[] = [
    { title: 'ID', dataIndex: 'id', width: 100 },
    { title: '服务名称', dataIndex: 'name', width: 140 },
    { title: '所属服务商', dataIndex: 'providerName', width: 140 },
    { title: '分类', dataIndex: 'categoryName', width: 100 },
    { title: '价格', dataIndex: 'price', width: 100, render: (v: string, r: any) => `¥${v}/${r.unit}` },
    { title: '销量', dataIndex: 'sales', width: 80 },
    { title: '评分', dataIndex: 'rating', width: 80, render: (v: string) => `⭐ ${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 130 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          {record.status === 'PENDING_REVIEW' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => message.success('审核通过')}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => message.success('已拒绝')}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'APPROVED' && (
            <Popconfirm title="确认下架" onConfirm={() => message.success('已下架')}>
              <Button type="link" size="small" danger>下架</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ProTable
      headerTitle="服务商品"
      columns={columns}
      dataSource={mockData}
      rowKey="id"
      search={{ labelWidth: 100 }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      scroll={{ x: 1200 }}
    />
  );
}
